/**
 * We Work Remotely job scraper.
 * Uses their RSS feeds for remote jobs.
 */

const USER_AGENT = 'Mozilla/5.0 (compatible; VersifiedJobIndexer/1.0)';

// WWR RSS feed URLs - focusing on VA-relevant categories
const FEED_URLS = [
  'https://weworkremotely.com/categories/remote-customer-support-jobs.rss',
  'https://weworkremotely.com/categories/remote-marketing-jobs.rss',
  'https://weworkremotely.com/categories/remote-copywriting-jobs.rss',
  'https://weworkremotely.com/categories/remote-data-jobs.rss',
  'https://weworkremotely.com/categories/remote-business-exec-management-jobs.rss',
  'https://weworkremotely.com/categories/remote-finance-legal-jobs.rss',
];

/**
 * Parse WWR RSS feed XML into job objects.
 */
function parseWWRRSS(xml) {
  const jobs = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];

    const title = extractTag(itemXml, 'title');
    const link = extractTag(itemXml, 'link');
    const pubDate = extractTag(itemXml, 'pubDate');
    const description = extractTag(itemXml, 'description');
    const region = extractTag(itemXml, 'region');
    const category = extractTag(itemXml, 'category');
    const type = extractTag(itemXml, 'type');

    if (!title || !link) continue;

    // Extract a stable id from the URL path (slug or numeric).
    const jobIdMatch = link.match(/\/remote-jobs\/([^/?#]+)/);
    const jobId = jobIdMatch ? jobIdMatch[1] : link;

    // Parse company from title (format: "Company: Job Title")
    const titleParts = title.split(':');
    const company = titleParts.length > 1 ? titleParts[0].trim() : null;
    const jobTitle = titleParts.length > 1 ? titleParts.slice(1).join(':').trim() : title;

    // Clean up description
    const cleanDescription = description
      ? decodeHtmlEntities(description.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim())
      : null;

    jobs.push({
      source: 'wwr',
      source_id: `wwr-${jobId}`,
      title: decodeHtmlEntities(jobTitle),
      company: company ? decodeHtmlEntities(company) : null,
      description: cleanDescription,
      salary_min: null,
      salary_max: null,
      salary_currency: 'USD',
      salary_type: null,
      skills: extractSkills(cleanDescription, category),
      experience_level: 'mid',
      job_type: type || null,
      location: region || 'Remote',
      is_remote: true,
      original_url: link,
      posted_at: pubDate ? new Date(pubDate).toISOString() : null,
      scraped_at: new Date().toISOString(),
    });
  }

  return jobs;
}

function extractTag(xml, tagName) {
  const regex = new RegExp(`<${tagName}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tagName}>|<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
  const match = xml.match(regex);
  return match ? (match[1] || match[2] || '').trim() : null;
}

function decodeHtmlEntities(text) {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/');
}

function extractSkills(description, category) {
  if (!description) return category ? [category.toLowerCase()] : [];
  
  const skillKeywords = [
    'customer support', 'customer service', 'email support', 'chat support',
    'marketing', 'social media', 'content', 'seo', 'copywriting',
    'data entry', 'data analysis', 'excel', 'google sheets',
    'project management', 'asana', 'trello', 'monday',
    'sales', 'crm', 'hubspot', 'salesforce',
    'bookkeeping', 'quickbooks', 'accounting',
    'executive assistant', 'virtual assistant', 'admin',
    'zendesk', 'intercom', 'freshdesk',
  ];
  
  const lowerDesc = description.toLowerCase();
  const found = skillKeywords.filter(skill => lowerDesc.includes(skill));
  
  if (category && !found.includes(category.toLowerCase())) {
    found.push(category.toLowerCase());
  }
  
  return found;
}

/**
 * Scrape We Work Remotely jobs from RSS feeds.
 */
export async function scrapeWWR() {
  console.log('🔍 Scraping We Work Remotely...');
  const allJobs = [];
  const seenIds = new Set();

  const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

  for (const feedUrl of FEED_URLS) {
    try {
      const response = await fetch(feedUrl, {
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'application/rss+xml, application/xml, text/xml, */*',
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(15_000),
      });

      // Some category feeds 301 to a new path; Node reports the intermediate
      // status if the follow fails, so try the Location once by hand.
      let xml;
      if (response.status >= 300 && response.status < 400) {
        const next = response.headers.get('location');
        if (!next) {
          console.warn(`WWR feed returned ${response.status} for ${feedUrl}`);
          continue;
        }
        const absolute = new URL(next, feedUrl).toString();
        const redirected = await fetch(absolute, {
          headers: {
            'User-Agent': USER_AGENT,
            'Accept': 'application/rss+xml, application/xml, text/xml, */*',
          },
          redirect: 'follow',
          signal: AbortSignal.timeout(15_000),
        });
        if (!redirected.ok) {
          console.warn(`WWR feed returned ${redirected.status} for ${absolute}`);
          continue;
        }
        xml = await redirected.text();
      } else if (!response.ok) {
        console.warn(`WWR feed returned ${response.status} for ${feedUrl}`);
        continue;
      } else {
        xml = await response.text();
      }
      const jobs = parseWWRRSS(xml);

      for (const job of jobs) {
        if (!seenIds.has(job.source_id)) {
          seenIds.add(job.source_id);
          allJobs.push(job);
        }
      }

      // Small delay between feeds to be nice
      await new Promise(r => setTimeout(r, 500));
    } catch (error) {
      console.warn(`WWR feed error for ${feedUrl}: ${error.message}`);
    }
  }

  console.log(`Found ${allJobs.length} We Work Remotely listings`);
  return allJobs;
}
