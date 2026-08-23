#!/usr/bin/env node
/**
 * Ally job scraper.
 *
 * Run with: node scripts/scrape-jobs.mjs
 * Required: NEXT_PUBLIC_SUPABASE_URL and either SUPABASE_SERVICE_ROLE_KEY or
 * NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { scrapeUpwork } from './lib/upwork.mjs';
import { extractJobsFromSearch, parseOLJJob } from './lib/olj.mjs';

config({ path: new URL('../.env.local', import.meta.url) });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const USER_AGENT = 'Mozilla/5.0 (compatible; AllyJobIndexer/1.0; +https://ally.ph)';
const OLJ_LIMIT = Number.parseInt(process.env.OLJ_SCRAPE_LIMIT ?? '100', 10);

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('Missing Supabase URL or key. Configure .env.local before running the scraper.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function fetchText(url, attempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/xhtml+xml' },
        signal: AbortSignal.timeout(20_000),
      });
      if (!response.ok) {
        const retryAfter = Number(response.headers.get('retry-after'));
        const error = new Error(`${response.status} ${response.statusText}`);
        error.retryDelay = Number.isFinite(retryAfter) ? retryAfter * 1_000 : response.status === 429 ? 2_000 * attempt : 500 * attempt;
        throw error;
      }
      return await response.text();
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, error.retryDelay ?? 500 * attempt));
    }
  }
  throw new Error(`Failed to fetch ${url}: ${lastError?.message ?? lastError}`);
}

async function mapWithConcurrency(items, concurrency, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  async function run() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, run));
  return results;
}

async function scrapeOLJ() {
  console.log('Scraping OnlineJobs.ph detail pages...');
  const allJobs = new Map(); // slug -> { slug, postedAt }
  const maxPages = Math.ceil(OLJ_LIMIT / 30); // OLJ shows ~30 per page
  
  for (let page = 1; page <= maxPages; page++) {
    // OLJ uses offset-based pagination: /jobseekers/jobsearch, /jobseekers/jobsearch/30, /60, etc
    const offset = (page - 1) * 30;
    const searchUrl = offset === 0
      ? 'https://www.onlinejobs.ph/jobseekers/jobsearch'
      : `https://www.onlinejobs.ph/jobseekers/jobsearch/${offset}`;
    try {
      const searchHtml = await fetchText(searchUrl);
      const pageJobs = extractJobsFromSearch(searchHtml);
      if (pageJobs.length === 0) break;
      const before = allJobs.size;
      pageJobs.forEach(j => { if (!allJobs.has(j.slug)) allJobs.set(j.slug, j); });
      // If no new jobs found, we've reached the end
      if (allJobs.size === before) break;
      if (allJobs.size >= OLJ_LIMIT) break;
      // Small delay between pages to avoid rate limiting
      if (page < maxPages) await new Promise(r => setTimeout(r, 300));
    } catch (error) {
      console.error(`OLJ page ${page} failed: ${error.message}`);
      break;
    }
  }
  
  const jobsToFetch = [...allJobs.values()].slice(0, OLJ_LIMIT);
  console.log(`Found ${jobsToFetch.length} OLJ listings`);

  // Fetch detail pages one at a time with delay to avoid rate limiting
  const jobs = await mapWithConcurrency(jobsToFetch, 1, async ({ slug, postedAt }, index) => {
    const jobUrl = `https://www.onlinejobs.ph/jobseekers/job/${slug}`;
    try {
      // Add delay between requests (1.5s to avoid 429s - OLJ is aggressive)
      if (index > 0) await new Promise(r => setTimeout(r, 1500));
      const html = await fetchText(jobUrl);
      // Pass the exact timestamp from search page
      return parseOLJJob(html, jobUrl, slug, postedAt);
    } catch (error) {
      console.error(`Skipping OLJ listing ${slug}: ${error.message}`);
      return null;
    }
  });

  return jobs.filter(Boolean);
}

async function scrapeRemoteOK() {
  console.log('Scraping RemoteOK...');
  const response = await fetch('https://remoteok.com/api?tag=virtual-assistant', {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`RemoteOK returned ${response.status}`);
  const data = await response.json();

  const jobs = data.slice(1).filter((job) => job?.id).map((job) => ({
    source: 'remoteok',
    source_id: String(job.id),
    title: job.position || 'Untitled',
    company: job.company || null,
    description: job.description || null,
    salary_min: job.salary_min || null,
    salary_max: job.salary_max || null,
    salary_currency: 'USD',
    salary_type: 'yearly',
    skills: job.tags || [],
    experience_level: 'mid',
    job_type: null,
    location: job.location || 'Remote',
    is_remote: true,
    original_url: job.url || `https://remoteok.com/remote-jobs/${job.slug}`,
    posted_at: job.date ? new Date(job.date).toISOString() : null,
    scraped_at: new Date().toISOString(),
  }));
  console.log(`Found ${jobs.length} RemoteOK listings`);
  return jobs;
}

async function saveJobs(jobs) {
  if (!jobs.length) return;
  console.log(`Saving ${jobs.length} jobs...`);

  // Small batches make a single malformed source record easier to diagnose.
  for (let offset = 0; offset < jobs.length; offset += 100) {
    const batch = jobs.slice(offset, offset + 100);
    const { error } = await supabase.from('jobs').upsert(batch, {
      onConflict: 'source,source_id',
      ignoreDuplicates: false,
    });
    if (error) throw new Error(`Supabase upsert failed: ${error.message}`);
  }
}

async function main() {
  console.log(`Starting Ally scraper at ${new Date().toISOString()}`);
  const results = await Promise.allSettled([scrapeOLJ(), scrapeRemoteOK(), scrapeUpwork()]);
  const names = ['olj', 'remoteok', 'upwork'];
  const allJobs = [];

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      console.log(`${names[index]}: ${result.value.length}`);
      allJobs.push(...result.value);
    } else {
      console.error(`${names[index]} failed: ${result.reason?.message ?? result.reason}`);
    }
  });

  await saveJobs(allJobs);
  console.log(`Finished. ${allJobs.length} jobs indexed.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
