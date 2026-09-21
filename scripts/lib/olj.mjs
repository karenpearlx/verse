import * as cheerio from 'cheerio';

const clean = (value = '') => value.replace(/\u00a0/g, ' ').replace(/[ \t]+/g, ' ').replace(/\s*\n\s*/g, '\n').trim();

function labelValue($, label) {
  const heading = $('.job-post h3').filter((_, node) => clean($(node).text()).toUpperCase() === label).first();
  return clean(heading.closest('dd').find('p').first().text());
}

function parseAmount(raw) {
  const match = raw.trim().match(/([\d,.]+)\s*([kKmM])?/);
  if (!match) return null;
  const value = Number(match[1].replace(/,/g, ''));
  if (!Number.isFinite(value)) return null;
  const suffix = match[2]?.toLowerCase();
  if (suffix === 'k') return value * 1_000;
  if (suffix === 'm') return value * 1_000_000;
  return value;
}

export function parseSalary(salaryText) {
  const original = clean(salaryText);
  if (!original) return { min: null, max: null, currency: null, type: null };

  const text = original.toLowerCase();
  let currency = null;
  if (/\b(?:usd|us\s*dollars?)\b|\$/.test(text)) currency = 'USD';
  else if (/\b(?:php|peso?s?)\b|₱/.test(text)) currency = 'PHP';
  else if (/\baud\b|\baustralian dollars?\b/.test(text)) currency = 'AUD';
  else if (/\bnzd\b|\bnew zealand dollars?\b/.test(text)) currency = 'NZD';
  else if (/\beur\b|€/.test(text)) currency = 'EUR';
  else if (/\bgbp\b|£/.test(text)) currency = 'GBP';

  let type = 'monthly';
  if (/(?:\b(?:per|an?)\s*|\/\s*)(?:hour|hr)\b|\/h\b/.test(text)) type = 'hourly';
  else if (/(?:\b(?:per|an?)\s*|\/\s*)week\b|\/wk\b/.test(text)) type = 'weekly';
  else if (/(?:\b(?:per|an?)\s*|\/\s*)day\b/.test(text)) type = 'daily';
  else if (/(?:\b(?:per|an?)\s*|\/\s*)(?:year|yr|annum)\b|annual/.test(text)) type = 'yearly';
  else if (/(?:\b(?:per|an?)\s*|\/\s*)(?:project|task)\b/.test(text)) type = 'project';

  // OLJ occasionally renders a converted monthly amount and an hourly amount
  // as "@320 / $2 per hour". In that shape, the value after the slash is the rate.
  const convertedHourly = type === 'hourly'
    ? text.match(/@\s*[\d,.]+\s*\/\s*\$?\s*([\d,.]+)/)?.[1]
    : null;
  const rawTokens = convertedHourly
    ? [convertedHourly]
    : [...text.matchAll(/(?:^|[^a-z\d])([\d][\d,.]*\s*[km]?)(?=$|[^a-z])/gi)].map((match) => match[1]);
  const amounts = rawTokens.map(parseAmount).filter((value) => value !== null);
  if (!amounts.length) return { min: null, max: null, currency, type };

  const min = Math.min(...amounts);
  const max = Math.max(...amounts);
  return { min, max, currency: currency ?? (min >= 1_000 ? 'PHP' : 'USD'), type };
}

function parseDate(raw) {
  const value = clean(raw);
  if (!value) return null;
  // OLJ website shows dates like "Aug 23, 2026"
  // OLJ API/mobile might show "2026-08-24 02:46:09"
  const hasTime = /\d{2}:\d{2}:\d{2}/.test(value);
  let date;
  if (hasTime) {
    // Full timestamp: "2026-08-24 02:46:09" -> ISO format
    date = new Date(`${value.replace(' ', 'T')}Z`);
  } else {
    // Date only: "Aug 23, 2026" or "2026-08-23" -> add noon UTC
    date = new Date(`${value} 12:00:00 UTC`);
  }
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function extractCompany($) {
  const heading = $('*').filter((_, node) => clean($(node).text()).toUpperCase() === 'VIEW OTHER JOB POSTS FROM:').first();
  if (!heading.length) return null;
  const candidate = clean(heading.parent().next().find('a, strong, h3, h4').first().text());
  return candidate || null;
}

export function parseOLJJob(html, jobUrl, fallbackSlug = '', postedAtOverride = null) {
  const $ = cheerio.load(html);
  const title = clean($('h1.job__title').first().text()) || clean($('h1').first().text()) || fallbackSlug
    .replace(/-\d+$/, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
  const description = clean($('#job-description').first().text());
  const salaryText = labelValue($, 'WAGE / SALARY');
  const salary = parseSalary(salaryText);
  const workType = labelValue($, 'TYPE OF WORK');
  // Use override timestamp from search page if available (has exact time)
  // Otherwise fall back to detail page date (date only, no time)
  const postedAt = postedAtOverride ? parseDate(postedAtOverride) : parseDate(labelValue($, 'DATE UPDATED'));
  const skills = $('.card-worker-topskill').map((_, node) => clean($(node).text())).get().filter(Boolean);
  const sourceId = $('#job-description').attr('data-jobid') ?? fallbackSlug.match(/(\d+)$/)?.[1] ?? fallbackSlug;

  if (!title || !sourceId || !description) {
    throw new Error(`OLJ detail page did not contain expected job fields: ${jobUrl}`);
  }

  return {
    source: 'olj',
    source_id: sourceId,
    title,
    company: extractCompany($),
    description,
    salary_min: salary.min,
    salary_max: salary.max,
    salary_currency: salary.currency,
    salary_type: salary.type,
    // The listing's own wording, shown verbatim on the board so Verse never
    // misquotes a client's budget.
    salary_raw: salaryText || null,
    skills: skills.length ? skills : ['Virtual Assistant'],
    experience_level: /senior|lead|manager|director|head of/i.test(`${title} ${description}`) ? 'senior' : /no experience|entry.level|beginner/i.test(description) ? 'entry' : 'mid',
    job_type: /part[ -]?time/i.test(workType) ? 'part-time' : /full[ -]?time/i.test(workType) ? 'full-time' : clean(workType).toLowerCase() || null,
    location: 'Philippines',
    is_remote: true,
    original_url: jobUrl,
    posted_at: postedAt,
    scraped_at: new Date().toISOString(),
  };
}

/**
 * Extract job slugs and their posted timestamps from the search results page.
 * Returns array of { slug, postedAt } objects.
 * The postedAt comes from data-temp-2 attribute (UTC time) on the search page.
 */
export function extractJobsFromSearch(html) {
  const $ = cheerio.load(html);
  const jobs = new Map();
  
  // Each job card has a link and a nearby p with data-temp-2 for the UTC timestamp
  $('a[href*="/jobseekers/job/"]').each((_, link) => {
    const href = $(link).attr('href');
    const slug = href?.match(/\/jobseekers\/job\/([\w-]+)/)?.[1];
    if (!slug || jobs.has(slug)) return;
    
    // Find the timestamp - it's in a p with data-temp-2 within the same job card
    const card = $(link).closest('.jobpost-cat-box, .latest-job-post, [class*="job"]');
    const timestamp = card.find('[data-temp-2]').attr('data-temp-2') 
      || $(link).parent().find('[data-temp-2]').attr('data-temp-2')
      || $(link).siblings('[data-temp-2]').attr('data-temp-2');
    
    jobs.set(slug, { slug, postedAt: timestamp || null });
  });
  
  return [...jobs.values()];
}

// Legacy function for backwards compatibility
export function extractJobSlugs(html) {
  return extractJobsFromSearch(html).map(j => j.slug);
}
