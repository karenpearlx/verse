export interface Job {
  id: string;
  title: string;
  company: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  salary_type: string | null;
  /** The salary exactly as the original listing wrote it. Preferred for display. */
  salary_raw?: string | null;
  skills: string[] | null;
  experience_level: string | null;
  source: string;
  original_url: string;
  location: string | null;
  is_remote: boolean | null;
  posted_at: string | null;
  scraped_at: string;
}

export const SOURCE_META: Record<string, { label: string; short: string; bg: string; fg: string }> = {
  olj: { label: 'OnlineJobs.ph', short: 'OLJ', bg: '#eef2ff', fg: '#4453b8' },
  remoteok: { label: 'RemoteOK', short: 'RemoteOK', bg: '#fdf0e8', fg: '#b5581f' },
  wwr: { label: 'We Work Remotely', short: 'WWR', bg: '#e9f6ec', fg: '#2f7a45' },
  // Legacy slug: the OnlineJobs.ph scraper wrote `onlinejobs` before it wrote
  // `olj`, and 2.5k of those rows are still live. Same board, same badge.
  onlinejobs: { label: 'OnlineJobs.ph', short: 'OLJ', bg: '#eef2ff', fg: '#4453b8' },
  // Indeed / Upwork rows may still exist until they age out — labels only.
  indeed: { label: 'Indeed', short: 'Indeed', bg: '#f1efec', fg: '#4a4845' },
  upwork: { label: 'Upwork', short: 'Upwork', bg: '#eef2ff', fg: '#4453b8' },
};

/**
 * Slugs that mean the same board.
 *
 * Filtering has to match on the group, not the raw column, or picking
 * "OnlineJobs.ph" hides the 2.5k rows written under the older `onlinejobs`
 * slug and the board looks like it lost most of its listings.
 */
export const SOURCE_ALIASES: Record<string, readonly string[]> = {
  olj: ['olj', 'onlinejobs'],
  remoteok: ['remoteok'],
  wwr: ['wwr'],
};

/** Sources offered in the jobs board filter (Indeed is no longer scraped). */
export const JOB_BOARD_SOURCES = ['olj', 'remoteok', 'wwr'] as const;

/** Every raw `source` value that should show under the given filter key. */
export function sourceGroup(key: string): readonly string[] {
  return SOURCE_ALIASES[key] ?? [key];
}

export function sourceMeta(source: string) {
  return (
    SOURCE_META[source] ?? {
      label: source,
      short: source,
      bg: 'var(--color-paper-2)',
      fg: 'var(--color-ink-2)',
    }
  );
}

export function jobDate(job: Job) {
  return new Date(job.posted_at ?? job.scraped_at).getTime();
}

/** OLJ rows store a placeholder company name. */
export function displayCompany(job: Job) {
  const c = (job.company ?? '').trim();
  if (!c || /^company on olj$/i.test(c)) {
    return job.source === 'olj' || job.source === 'onlinejobs'
      ? 'Client on OnlineJobs.ph'
      : 'Independent client';
  }
  return c;
}

export function formatSalary(job: Job) {
  // Show the client's own wording when we have it — reformatting a salary is
  // how a "$2/hr" listing ends up displayed as "$320/mo".
  const raw = job.salary_raw?.replace(/\s+/g, ' ').trim();
  if (raw) return raw.length > 60 ? `${raw.slice(0, 57)}…` : raw;
  if (!job.salary_min && !job.salary_max) return null;
  const cur = job.salary_currency ?? 'USD';
  const symbol = cur === 'PHP' ? '₱' : cur === 'USD' ? '$' : `${cur} `;
  const type =
    job.salary_type === 'hourly' ? '/hr' : job.salary_type === 'yearly' ? '/yr' : '/mo';
  if (job.salary_min && job.salary_max && job.salary_min !== job.salary_max) {
    return `${symbol}${job.salary_min.toLocaleString()}–${job.salary_max.toLocaleString()}${type}`;
  }
  const amount = job.salary_min || job.salary_max;
  return `${symbol}${amount?.toLocaleString()}${type}`;
}

export function formatPostedAt(job: Job) {
  const raw = job.posted_at ?? job.scraped_at;
  if (!raw) return 'Recently';
  const then = new Date(raw);
  if (Number.isNaN(then.getTime())) return 'Recently';
  const mins = Math.floor((Date.now() - then.getTime()) / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return then.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/**
 * Round a raw total down to a friendly threshold so the homepage stat never
 * looks like a fake-precise vanity metric, and never *overstates* the board.
 */
export function formatJobCount(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return '0';
  const rounded = Math.floor(n / 100) * 100;
  return `${rounded.toLocaleString('en-US')}+`;
}
