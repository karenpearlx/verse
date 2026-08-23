import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient as createPublicClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { sourceGroup } from '@/lib/jobs-meta';
import { htmlToPlainText } from '@/lib/plain-text';

export type { Job } from '@/lib/jobs-meta';
export {
  SOURCE_META,
  SOURCE_ALIASES,
  JOB_BOARD_SOURCES,
  sourceGroup,
  sourceMeta,
  jobDate,
  displayCompany,
  formatSalary,
  formatPostedAt,
  formatJobCount,
} from '@/lib/jobs-meta';
import type { Job } from '@/lib/jobs-meta';

// Use Verse's single browser client so RLS can grant paid accounts the 24-hour
// early-access window without a second auth client racing the session refresh.
//
// Created lazily: this module is also imported by the server-rendered homepage
// (countActiveJobs), and the browser client touches document.cookie the moment
// it is constructed.
let browserClient: ReturnType<typeof createClient> | null = null;

function jobsClient() {
  browserClient ??= createClient();
  return browserClient;
}

const LIST_COLUMNS =
  'id,title,company,salary_min,salary_max,salary_currency,salary_type,skills,experience_level,source,original_url,location,is_remote,posted_at,scraped_at';

export type JobSort = 'newest' | 'oldest' | 'paid';

export type JobsQuery = {
  q?: string;
  source?: string;
  sort?: JobSort;
  page?: number;
  pageSize?: number;
};

export type JobsPageResult = {
  jobs: Job[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  counts: Record<string, number>;
};

function publicJobsClient(): SupabaseClient {
  return createPublicClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

function applyFilters(
  // PostgREST filter builders are not exported as a stable public type.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: any,
  { q, source, sort }: { q: string; source: string; sort: JobSort },
) {
  let next = query.eq('is_active', true);

  if (source !== 'all') {
    next = next.in('source', [...sourceGroup(source)]);
  }

  if (sort === 'paid') {
    next = next.or('salary_min.not.is.null,salary_max.not.is.null');
  }

  const term = q.trim();
  if (term) {
    const safe = term.replace(/[%_,.()]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);
    if (safe) {
      const pattern = `%${safe}%`;
      next = next.or(`title.ilike."${pattern}",company.ilike."${pattern}"`);
    }
  }

  return next;
}

/**
 * One page of active jobs from Postgres — filter, sort, and paginate server-side
 * so the board never downloads thousands of rows to show 24 cards.
 */
export async function fetchJobsPage(
  input: JobsQuery = {},
  client?: SupabaseClient,
): Promise<JobsPageResult> {
  const pageSize = Math.min(Math.max(input.pageSize ?? 24, 1), 48);
  let page = Math.max(input.page ?? 1, 1);
  const q = input.q ?? '';
  const source = input.source && input.source !== 'all' ? input.source : 'all';
  const sort: JobSort = input.sort === 'oldest' || input.sort === 'paid' ? input.sort : 'newest';
  const supabase = client ?? (typeof window === 'undefined' ? publicJobsClient() : jobsClient());

  const ascending = sort === 'oldest';

  const countKeys = ['all', 'olj', 'remoteok', 'wwr'] as const;
  const countPromises = countKeys.map(async (key) => {
    let query = supabase.from('jobs').select('id', { count: 'exact', head: true }).eq('is_active', true);
    if (key !== 'all') query = query.in('source', [...sourceGroup(key)]);
    const { count, error } = await query;
    if (error) throw error;
    return [key, count ?? 0] as const;
  });

  // Filtered total first so we can clamp page before fetching rows.
  const totalQuery = applyFilters(
    supabase.from('jobs').select('id', { count: 'exact', head: true }),
    { q, source, sort },
  );
  const [{ count: filteredCount, error: totalError }, ...countEntries] = await Promise.all([
    totalQuery,
    ...countPromises,
  ]);
  if (totalError) throw totalError;

  const total = filteredCount ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pageSize) || 1);
  page = Math.min(page, pageCount);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error } = await applyFilters(
    supabase.from('jobs').select(LIST_COLUMNS),
    { q, source, sort },
  )
    .order('posted_at', { ascending, nullsFirst: false })
    .order('scraped_at', { ascending })
    .range(from, to);

  if (error) throw error;

  const counts = Object.fromEntries(countEntries) as Record<string, number>;

  return {
    jobs: (data as Job[]) ?? [],
    total,
    page,
    pageSize,
    pageCount,
    counts,
  };
}

/**
 * @deprecated Prefer fetchJobsPage — kept for any callers that still need a
 * full dump (admin tooling). Caps at 10 pages of 1000 to avoid unbounded loads.
 */
export async function fetchJobs(): Promise<Job[]> {
  const PAGE = 1000;
  const all: Job[] = [];

  for (let page = 0; page < 10; page++) {
    const { data, error } = await jobsClient()
      .from('jobs')
      .select(LIST_COLUMNS)
      .eq('is_active', true)
      .order('posted_at', { ascending: false, nullsFirst: false })
      .order('scraped_at', { ascending: false })
      .range(page * PAGE, page * PAGE + PAGE - 1);

    if (error) throw error;
    if (!data?.length) break;
    all.push(...(data as Job[]));
    if (data.length < PAGE) break;
  }

  return all.sort((a, b) => new Date(b.posted_at ?? b.scraped_at).getTime() - new Date(a.posted_at ?? a.scraped_at).getTime());
}

/**
 * The full description for one listing.
 *
 * Deliberately not part of fetchJobsPage: descriptions are the largest column
 * and cards do not need them until someone asks for a letter.
 */
export async function fetchJobDescription(id: string): Promise<string> {
  const { data, error } = await jobsClient()
    .from('jobs')
    .select('description')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  const description = (data as { description?: string | null } | null)?.description;
  return typeof description === 'string' ? htmlToPlainText(description) : '';
}

/**
 * Live count of active listings, for the homepage stat.
 * `head: true` means Postgres returns the count only — no rows over the wire.
 */
export async function countActiveJobs(): Promise<number | null> {
  try {
    const supabase = publicJobsClient();
    const { count, error } = await supabase
      .from('jobs')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true);
    if (error) return null;
    return count ?? null;
  } catch {
    // Never let a stat lookup take down the homepage build or render.
    return null;
  }
}
