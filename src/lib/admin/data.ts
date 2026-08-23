import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import { NICHES } from '@/lib/cover-letter-templates';
import { RESUME_TEMPLATES } from '@/lib/resume';
import { COURSES } from '@/lib/courses';
import type {
  AnalyticsResponse,
  BuiltinTemplate,
  ClickRow,
  FeedbackLesson,
  FeedbackResponse,
  FeedbackRow,
  PageRow,
  ReferrerRow,
  ScraperResponse,
  ScraperRun,
  ScraperSource,
  SessionRow,
  StoredTemplate,
  TagRow,
  TemplatesResponse,
  TimelinePoint,
  UserRow,
  UsersResponse,
  VisitorRow,
} from './types';

/**
 * Reads for the admin console.
 *
 * Authorization happens before this file is reached, in the route handler.
 * Every query here runs on the signed-in admin's own cookie session; the
 * "Admins read …" policies in supabase/admin-schema.sql are what widen the
 * result set beyond their own rows. There is no service-role key in this app,
 * on purpose — nothing here can read more than RLS allows.
 *
 * Two error codes matter. PGRST205 is "table missing from the schema cache"
 * and 42703 is "column does not exist"; both mean the database has not caught
 * up with the code. They surface as null, never zero. A zero would read as
 * "nobody visited", which is a different and wrong story.
 */
type PgError = { code?: string; message?: string } | null;

export function isMissingTable(error: PgError) {
  return error?.code === 'PGRST205' || /schema cache/i.test(error?.message ?? '');
}

export function isMissingColumn(error: PgError) {
  return error?.code === '42703' || /does not exist/i.test(error?.message ?? '');
}

const isoDaysAgo = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();
const dayKey = (value: string) => value.slice(0, 10);

/** Dense day buckets, so a chart never hides a gap by skipping it. */
function emptyDays(days: number) {
  const out: string[] = [];
  for (let i = days - 1; i >= 0; i -= 1) out.push(isoDaysAgo(i).slice(0, 10));
  return out;
}

function tally<T>(rows: T[], key: (row: T) => string | null | undefined) {
  const map = new Map<string, number>();
  for (const row of rows) {
    const value = key(row);
    if (!value) continue;
    map.set(value, (map.get(value) ?? 0) + 1);
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

const str = (value: unknown) => (typeof value === 'string' && value.trim() ? value.trim() : null);

/* ------------------------------------------------------------------ analytics */

export const ANALYTICS_TABLE = 'analytics_events';

/** Hard ceiling on rows pulled into Node for one analytics read. */
const EVENT_LIMIT = 20_000;

type EventRow = {
  occurred_at: string;
  event_type: string;
  path: string | null;
  referrer: string | null;
  session_id: string | null;
  visitor_hash: string | null;
  target: string | null;
  label: string | null;
  query: string | null;
  filter_key: string | null;
  filter_value: string | null;
  job_id: string | null;
  scroll_depth: number | null;
  metadata: Record<string, unknown> | null;
};

function emptyAnalytics(rangeDays: number): AnalyticsResponse {
  return {
    provisioning: { present: [], missing: [ANALYTICS_TABLE] },
    rangeDays,
    truncated: false,
    totals: {
      pageViews: null,
      uniqueVisitors: null,
      sessions: null,
      activeVisitors: null,
      clicks: null,
      jobViews: null,
      avgScrollDepth: null,
    },
    timeline: [],
    pages: [],
    referrers: [],
    clicks: [],
    topJobs: [],
    searches: [],
    filters: [],
    sessions: [],
    visitors: [],
  };
}

export async function readAnalytics(db: SupabaseClient, rangeDays: number): Promise<AnalyticsResponse> {
  const { data, error } = await db
    .from(ANALYTICS_TABLE)
    .select(
      'occurred_at,event_type,path,referrer,session_id,visitor_hash,target,label,query,filter_key,filter_value,job_id,scroll_depth,metadata',
    )
    .gte('occurred_at', isoDaysAgo(rangeDays))
    .order('occurred_at', { ascending: false })
    .limit(EVENT_LIMIT);

  if (error) {
    if (!isMissingTable(error) && !isMissingColumn(error)) throw error;
    return emptyAnalytics(rangeDays);
  }

  const rows = (data ?? []) as EventRow[];
  const views = rows.filter((row) => row.event_type === 'page_view');
  const clicks = rows.filter((row) => row.event_type === 'click');
  const jobViews = rows.filter((row) => row.event_type === 'job_view');
  const searches = rows.filter((row) => row.event_type === 'search');
  const filters = rows.filter((row) => row.event_type === 'filter');
  const scrolls = rows
    .filter((row) => row.event_type === 'scroll' || row.event_type === 'scroll_depth')
    .map((row) => ({ path: row.path, percent: Number(row.scroll_depth ?? row.metadata?.percent) }))
    .filter((row) => Number.isFinite(row.percent));

  /* -- timeline ------------------------------------------------------ */

  const buckets = new Map(
    emptyDays(rangeDays).map((day) => [day, { views: 0, sessions: new Set<string>(), visitors: new Set<string>() }]),
  );
  for (const row of views) {
    const bucket = buckets.get(dayKey(row.occurred_at));
    if (!bucket) continue;
    bucket.views += 1;
    if (row.session_id) bucket.sessions.add(row.session_id);
    if (row.visitor_hash) bucket.visitors.add(row.visitor_hash);
  }
  const timeline: TimelinePoint[] = [...buckets.entries()].map(([date, bucket]) => ({
    date,
    views: bucket.views,
    sessions: bucket.sessions.size,
    visitors: bucket.visitors.size,
  }));

  /* -- pages --------------------------------------------------------- */

  const scrollByPath = new Map<string, number[]>();
  for (const row of scrolls) {
    const key = row.path ?? '(unknown)';
    const existing = scrollByPath.get(key);
    if (existing) existing.push(row.percent);
    else scrollByPath.set(key, [row.percent]);
  }

  const pageMap = new Map<string, { views: number; sessions: Set<string>; visitors: Set<string> }>();
  for (const row of views) {
    const path = row.path ?? '(unknown)';
    const entry = pageMap.get(path) ?? { views: 0, sessions: new Set<string>(), visitors: new Set<string>() };
    entry.views += 1;
    if (row.session_id) entry.sessions.add(row.session_id);
    if (row.visitor_hash) entry.visitors.add(row.visitor_hash);
    pageMap.set(path, entry);
  }
  const pages: PageRow[] = [...pageMap.entries()]
    .map(([path, entry]) => {
      const depths = scrollByPath.get(path) ?? [];
      return {
        path,
        views: entry.views,
        sessions: entry.sessions.size,
        visitors: entry.visitors.size,
        avgScroll: depths.length ? Math.round(depths.reduce((sum, value) => sum + value, 0) / depths.length) : null,
      };
    })
    .sort((a, b) => b.views - a.views)
    .slice(0, 25);

  /* -- referrers ----------------------------------------------------- */

  const referrers: ReferrerRow[] = tally(views, (row) => {
    if (!row.referrer) return 'Direct / none';
    try {
      return new URL(row.referrer, 'https://ally.local').hostname.replace(/^www\./, '') || 'Direct / none';
    } catch {
      return row.referrer;
    }
  })
    .slice(0, 12)
    .map(([source, visits]) => ({ source, visits }));

  /* -- clicks -------------------------------------------------------- */

  const clickMap = new Map<string, ClickRow>();
  for (const row of clicks) {
    const label = str(row.label) ?? str(row.metadata?.element) ?? 'unlabelled';
    const target = str(row.target) ?? row.path ?? '';
    const key = `${label}::${target}`;
    const existing = clickMap.get(key);
    if (existing) {
      existing.count += 1;
      if (!existing.lastAt || row.occurred_at > existing.lastAt) existing.lastAt = row.occurred_at;
    } else {
      clickMap.set(key, { label, target, count: 1, lastAt: row.occurred_at });
    }
  }

  /* -- most opened listings -----------------------------------------
     job_id is a real foreign key, so the title comes from the jobs table
     rather than from whatever text the browser happened to send.        */

  const jobCounts = tally([...jobViews, ...clicks], (row) => row.job_id);
  const topJobIds = jobCounts.slice(0, 15).map(([id]) => id);
  let jobTitles = new Map<string, { title: string; source: string | null }>();
  if (topJobIds.length) {
    const { data: jobRows } = await db.from('jobs').select('id,title,source').in('id', topJobIds);
    jobTitles = new Map(
      ((jobRows ?? []) as { id: string; title: string; source: string | null }[]).map((row) => [
        row.id,
        { title: row.title, source: normaliseSource(row.source) },
      ]),
    );
  }
  const topJobs = jobCounts.slice(0, 15).map(([jobId, count]) => ({
    jobId,
    title: jobTitles.get(jobId)?.title ?? 'Listing removed',
    source: jobTitles.get(jobId)?.source ?? null,
    views: count,
  }));

  /* -- sessions and visitors ----------------------------------------- */

  const sessionMap = new Map<string, SessionRow>();
  const visitorMap = new Map<string, VisitorRow & { sessionIds: Set<string> }>();
  for (const row of rows) {
    if (row.session_id) {
      const existing = sessionMap.get(row.session_id);
      if (existing) {
        if (row.event_type === 'page_view') existing.views += 1;
        if (row.occurred_at < existing.firstSeen) {
          existing.firstSeen = row.occurred_at;
          existing.entryPath = row.path;
          existing.referrer = row.referrer;
        }
        if (row.occurred_at > existing.lastSeen) existing.lastSeen = row.occurred_at;
      } else {
        sessionMap.set(row.session_id, {
          sessionId: row.session_id,
          firstSeen: row.occurred_at,
          lastSeen: row.occurred_at,
          views: row.event_type === 'page_view' ? 1 : 0,
          entryPath: row.path,
          referrer: row.referrer,
        });
      }
    }

    if (row.visitor_hash) {
      const existing = visitorMap.get(row.visitor_hash);
      if (existing) {
        if (row.event_type === 'page_view') existing.views += 1;
        if (row.session_id) existing.sessionIds.add(row.session_id);
        if (row.occurred_at < existing.firstSeen) {
          existing.firstSeen = row.occurred_at;
          existing.referrer = row.referrer;
        }
        if (row.occurred_at > existing.lastSeen) existing.lastSeen = row.occurred_at;
      } else {
        visitorMap.set(row.visitor_hash, {
          visitorId: row.visitor_hash,
          firstSeen: row.occurred_at,
          lastSeen: row.occurred_at,
          views: row.event_type === 'page_view' ? 1 : 0,
          sessions: 0,
          referrer: row.referrer,
          sessionIds: new Set(row.session_id ? [row.session_id] : []),
        });
      }
    }
  }

  const since7 = isoDaysAgo(7);
  const sessions = [...sessionMap.values()].sort((a, b) => b.lastSeen.localeCompare(a.lastSeen)).slice(0, 50);
  const visitors = [...visitorMap.values()]
    .sort((a, b) => b.lastSeen.localeCompare(a.lastSeen))
    .slice(0, 50)
    .map(({ sessionIds, ...visitor }) => ({ ...visitor, sessions: sessionIds.size }));

  return {
    provisioning: { present: [ANALYTICS_TABLE], missing: [] },
    rangeDays,
    truncated: rows.length >= EVENT_LIMIT,
    totals: {
      pageViews: views.length,
      uniqueVisitors: new Set(rows.map((row) => row.visitor_hash).filter(Boolean)).size,
      sessions: new Set(rows.map((row) => row.session_id).filter(Boolean)).size,
      activeVisitors: new Set(
        rows.filter((row) => row.occurred_at >= since7).map((row) => row.visitor_hash).filter(Boolean),
      ).size,
      clicks: clicks.length,
      jobViews: jobViews.length,
      avgScrollDepth: scrolls.length
        ? Math.round(scrolls.reduce((sum, row) => sum + row.percent, 0) / scrolls.length)
        : null,
    },
    timeline,
    pages,
    referrers,
    clicks: [...clickMap.values()].sort((a, b) => b.count - a.count).slice(0, 25),
    topJobs,
    searches: tally(searches, (row) => str(row.query)?.toLowerCase())
      .slice(0, 25)
      .map(([query, count]) => ({ query, count })),
    filters: tally(filters, (row) => `${str(row.filter_key) ?? 'filter'}\u0000${str(row.filter_value) ?? ''}`)
      .slice(0, 25)
      .map(([composite, count]) => {
        const [filter, value] = composite.split('\u0000');
        return { filter, value, count };
      }),
    sessions,
    visitors,
  };
}

/* -------------------------------------------------------------------- scraper */

export const RUNS_TABLE = 'scraper_runs';

/**
 * One job board, one key. Rows were written as `onlinejobs` by an older
 * scraper and as `olj` by the current one, and counting them separately made
 * the console under-report OnlineJobs.ph by an order of magnitude.
 */
const SOURCE_ALIASES: Record<string, string> = { onlinejobs: 'olj', 'onlinejobs.ph': 'olj' };
export const KNOWN_SOURCES = ['olj', 'remoteok', 'wwr'] as const;

export function normaliseSource(value: string | null | undefined) {
  if (!value) return null;
  const key = value.trim().toLowerCase();
  return SOURCE_ALIASES[key] ?? key;
}

function aliasesFor(key: string) {
  return [key, ...Object.entries(SOURCE_ALIASES).filter(([, target]) => target === key).map(([alias]) => alias)];
}

const SOURCE_LABELS: Record<string, string> = {
  olj: 'OnlineJobs.ph',
  remoteok: 'RemoteOK',
  wwr: 'We Work Remotely',
};

const SOURCE_NOTES: Record<string, string | null> = {
  olj: 'OnlineJobs.ph hides employer names from logged-out visitors, so company is stored as null.',
  remoteok: null,
  wwr: 'RSS feeds for customer support, marketing, copywriting, data, exec, and finance categories.',
};

/** A run that never wrote a finish time is treated as dead after this long. */
const STALL_AFTER_MS = 20 * 60_000;

function toRun(row: Record<string, unknown>): ScraperRun {
  const startedAt = String(row.started_at);
  const finishedAt = (row.finished_at as string | null) ?? null;
  const rawStatus = String(row.status) as ScraperRun['status'];
  const stalled = rawStatus === 'running' && Date.now() - Date.parse(startedAt) > STALL_AFTER_MS;
  return {
    id: String(row.id),
    source: String(row.source),
    status: stalled ? 'stalled' : rawStatus,
    jobCount: Number(row.job_count ?? 0),
    message: (row.message as string | null) ?? null,
    startedAt,
    finishedAt,
    durationMs: finishedAt ? Date.parse(finishedAt) - Date.parse(startedAt) : null,
  };
}

export async function readScraper(db: SupabaseClient): Promise<ScraperResponse> {
  const present: string[] = [];
  const missing: string[] = [];
  let problem: string | null = null;

  /** Counting server-side keeps this O(1) in transferred rows as jobs grow. */
  async function countJobs(options: { sources?: string[]; activeOnly?: boolean } = {}) {
    let query = db.from('jobs').select('id', { count: 'exact', head: true });
    if (options.sources) query = query.in('source', options.sources);
    if (options.activeOnly) query = query.eq('is_active', true);
    const { count, error } = await query;
    if (error) throw error;
    return count ?? 0;
  }

  let totalJobs = 0;
  let sources: ScraperSource[] = [];
  let strays: ScraperResponse['strays'] = [];

  try {
    totalJobs = await countJobs();
    present.push('jobs');

    sources = await Promise.all(
      KNOWN_SOURCES.map(async (key): Promise<ScraperSource> => {
        const keys = aliasesFor(key);
        const [jobCount, activeCount, newestScrape, newestPost] = await Promise.all([
          countJobs({ sources: keys }),
          countJobs({ sources: keys, activeOnly: true }),
          db.from('jobs').select('scraped_at').in('source', keys).order('scraped_at', { ascending: false }).limit(1),
          db
            .from('jobs')
            .select('posted_at')
            .in('source', keys)
            .not('posted_at', 'is', null)
            .order('posted_at', { ascending: false })
            .limit(1),
        ]);
        return {
          key,
          label: SOURCE_LABELS[key],
          enabled: true,
          note: SOURCE_NOTES[key],
          jobCount,
          activeCount,
          lastScrapedAt: newestScrape.data?.[0]?.scraped_at ?? null,
          newestPostedAt: newestPost.data?.[0]?.posted_at ?? null,
        };
      }),
    );

    // Anything written under a key the app does not know about. Worth seeing:
    // it usually means a second deployment is still writing to this database.
    const accounted = sources.reduce((sum, source) => sum + source.jobCount, 0);
    if (totalJobs > accounted) {
      const known = KNOWN_SOURCES.flatMap(aliasesFor);
      const { data } = await db
        .from('jobs')
        .select('source,scraped_at')
        .not('source', 'in', `(${known.join(',')})`)
        .order('scraped_at', { ascending: false })
        .limit(2_000);
      const rows = (data ?? []) as { source: string; scraped_at: string | null }[];
      strays = tally(rows, (row) => row.source).map(([source, jobCount]) => ({
        source,
        jobCount,
        lastScrapedAt: rows.find((row) => row.source === source)?.scraped_at ?? null,
      }));
    }
  } catch (error) {
    const pg = error as PgError;
    if (isMissingTable(pg)) {
      missing.push('jobs');
      problem = 'The jobs table does not exist yet.';
    } else {
      problem = pg?.message ?? 'Could not read the jobs table.';
    }
  }

  let runs: ScraperRun[] = [];
  const runsResult = await db
    .from(RUNS_TABLE)
    .select('id,source,status,job_count,message,started_at,finished_at')
    .order('started_at', { ascending: false })
    .limit(15);

  if (runsResult.error) {
    if (isMissingTable(runsResult.error)) missing.push(RUNS_TABLE);
    else throw runsResult.error;
  } else {
    present.push(RUNS_TABLE);
    runs = (runsResult.data ?? []).map(toRun);
  }

  return {
    provisioning: { present, missing },
    sources,
    totalJobs,
    strays,
    running: runs.find((run) => run.status === 'running') ?? null,
    runs,
    problem,
  };
}

/* ---------------------------------------------------------------------- users */

type CountResult = { value: number | null; missing: boolean };

async function safeCount(
  db: SupabaseClient,
  table: string,
  since?: { column: string; from: string },
): Promise<CountResult> {
  let query = db.from(table).select('id', { count: 'exact', head: true });
  if (since) query = query.gte(since.column, since.from);
  const { count, error } = await query;
  if (error) {
    if (isMissingTable(error)) return { value: null, missing: true };
    throw error;
  }
  return { value: count ?? 0, missing: false };
}

/** How many rows the people table shows at once. */
const USER_PAGE = 50;

export async function readUsers(db: SupabaseClient, query = ''): Promise<UsersResponse> {
  const present: string[] = [];
  const missing: string[] = [];
  const track = (table: string, result: CountResult) => {
    if (result.missing) missing.push(table);
    else present.push(table);
    return result.value;
  };

  const since7 = isoDaysAgo(7);
  const since30 = isoDaysAgo(30);

  // These are four independent round trips to the same database. Awaiting them
  // one after another cost about a second of dead time on every page load.
  const [userCount, applicationCount, resumeCount, letterCount] = await Promise.all([
    safeCount(db, 'users'),
    safeCount(db, 'applications'),
    safeCount(db, 'resumes'),
    safeCount(db, 'cover_letters'),
  ]);
  const users = track('users', userCount);
  const applications = track('applications', applicationCount);
  const resumes = track('resumes', resumeCount);
  const coverLetters = track('cover_letters', letterCount);

  let signups7d: number | null = null;
  let signups30d: number | null = null;
  let signupTimeline: UsersResponse['signupTimeline'] = [];
  let suspended: number | null = null;
  let moderation = false;
  let rows: UserRow[] = [];
  let matched = 0;

  if (users !== null) {
    // Signup sparkline pulls only the last 30 days and only the column the
    // chart needs. It goes out alongside the two counters rather than after.
    const [weekly, monthly, recentSignupsResult, statusProbe] = await Promise.all([
      safeCount(db, 'users', { column: 'created_at', from: since7 }),
      safeCount(db, 'users', { column: 'created_at', from: since30 }),
      db.from('users').select('created_at').gte('created_at', since30).order('created_at', { ascending: false }).limit(5_000),
      // Moderation columns are optional: the console works without them and
      // says so, rather than throwing a 500 at somebody who has not run the SQL.
      db.from('users').select('status').limit(1),
    ]);
    signups7d = weekly.value;
    signups30d = monthly.value;
    moderation = !statusProbe.error;
    const recentSignups = recentSignupsResult.data;
    const buckets = new Map(emptyDays(30).map((day) => [day, 0]));
    for (const row of (recentSignups ?? []) as { created_at: string }[]) {
      const key = dayKey(row.created_at);
      if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
    signupTimeline = [...buckets.entries()].map(([date, count]) => ({ date, count }));

    const columns = moderation
      ? 'id,email,created_at,updated_at,status,suspended_at,suspended_reason,subscription_tier'
      : 'id,email,created_at,updated_at,subscription_tier';

    let list = db
      .from('users')
      .select(columns, { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(USER_PAGE);
    const clean = query.trim();
    if (clean) list = list.ilike('email', `%${clean.replace(/[%_]/g, '')}%`);

    const { data, count, error } = await list;
    if (error) throw error;
    matched = count ?? 0;

    type Raw = {
      id: string;
      email: string | null;
      created_at: string;
      updated_at: string | null;
      status?: string | null;
      suspended_at?: string | null;
      suspended_reason?: string | null;
      subscription_tier?: string | null;
    };
    const raw = (data ?? []) as unknown as Raw[];
    const ids = raw.map((row) => row.id);

    // One round trip per child table, filtered to the visible page.
    const perUser = async (table: string) => {
      if (!ids.length) return new Map<string, number>();
      const { data: childRows, error: childError } = await db.from(table).select('user_id').in('user_id', ids);
      if (childError) return new Map<string, number>();
      const map = new Map<string, number>();
      for (const row of (childRows ?? []) as { user_id: string }[]) {
        map.set(row.user_id, (map.get(row.user_id) ?? 0) + 1);
      }
      return map;
    };
    const [appCounts, resumeCounts, letterCounts, suspendedResult] = await Promise.all([
      perUser('applications'),
      perUser('resumes'),
      perUser('cover_letters'),
      moderation
        ? db.from('users').select('id', { count: 'exact', head: true }).eq('status', 'suspended')
        : Promise.resolve({ count: null }),
    ]);
    suspended = moderation ? suspendedResult.count ?? 0 : null;

    rows = raw.map((row) => ({
      id: row.id,
      email: row.email,
      joinedAt: row.created_at,
      lastActiveAt: row.updated_at ?? null,
      applications: appCounts.get(row.id) ?? 0,
      resumes: resumeCounts.get(row.id) ?? 0,
      coverLetters: letterCounts.get(row.id) ?? 0,
      status: row.status === 'suspended' ? 'suspended' : 'active',
      suspendedAt: row.suspended_at ?? null,
      suspendedReason: row.suspended_reason ?? null,
      plan: (row.subscription_tier as 'free' | 'pro' | 'creator') ?? 'free',
    }));
  }

  let applicationsByStatus: UsersResponse['applicationsByStatus'] = [];
  let active7d: number | null = null;
  if (applications !== null) {
    const { data } = await db
      .from('applications')
      .select('user_id,status,updated_at')
      .order('updated_at', { ascending: false })
      .limit(5_000);
    const appRows = (data ?? []) as { user_id: string; status: string | null; updated_at: string | null }[];
    applicationsByStatus = tally(appRows, (row) => row.status ?? 'unset').map(([status, count]) => ({ status, count }));
    active7d = new Set(appRows.filter((row) => (row.updated_at ?? '') >= since7).map((row) => row.user_id)).size;
  }

  return {
    provisioning: { present, missing },
    moderation,
    totals: { users, signups7d, signups30d, active7d, suspended, applications, resumes, coverLetters },
    applicationsByStatus,
    signupTimeline,
    query,
    matched,
    users: rows,
  };
}

/* ------------------------------------------------------------------ templates */

export const TEMPLATES_TABLE = 'admin_templates';

export function builtinTemplates(): BuiltinTemplate[] {
  return [
    ...NICHES.map((niche) => ({
      id: `builtin-letter-${niche.id}`,
      kind: 'cover_letter' as const,
      label: niche.label,
      blurb: niche.blurb,
    })),
    ...RESUME_TEMPLATES.map((template) => ({
      id: `builtin-resume-${template}`,
      kind: 'resume' as const,
      label: template.charAt(0).toUpperCase() + template.slice(1),
      blurb: 'Shipped resume layout, rendered by the PDF and DOCX exporters.',
    })),
  ];
}

export async function readTemplates(db: SupabaseClient): Promise<TemplatesResponse> {
  const present: string[] = [];
  const missing: string[] = [];

  let stored: StoredTemplate[] = [];
  const templates = await db
    .from(TEMPLATES_TABLE)
    .select('id,kind,label,blurb,body,updated_at')
    .order('kind')
    .order('label');

  if (templates.error) {
    if (isMissingTable(templates.error)) missing.push(TEMPLATES_TABLE);
    else throw templates.error;
  } else {
    present.push(TEMPLATES_TABLE);
    stored = (templates.data ?? []).map((row) => ({
      id: String(row.id),
      kind: row.kind as StoredTemplate['kind'],
      name: String(row.label),
      slug: String(row.blurb ?? ''),
      body: String(row.body ?? ''),
      updatedAt: (row.updated_at as string | null) ?? null,
      updatedBy: null,
      label: String(row.label),
      blurb: (row.blurb as string | null) ?? null,
    }));
  }

  let tags: TagRow[] = [];
  const jobs = await db.from('jobs').select('skills').eq('is_active', true).limit(5_000);
  if (jobs.error) {
    if (isMissingTable(jobs.error)) missing.push('jobs');
    else throw jobs.error;
  } else {
    present.push('jobs');
    const counts = new Map<string, number>();
    for (const row of (jobs.data ?? []) as { skills: string[] | null }[]) {
      for (const skill of row.skills ?? []) {
        const key = skill.trim().toLowerCase();
        if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }
    tags = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 40)
      .map(([tag, count]) => ({ tag, jobs: count }));
  }

  return {
    provisioning: { present, missing },
    builtins: builtinTemplates(),
    stored,
    tags,
    editable: present.includes(TEMPLATES_TABLE),
  };
}

/* ------------------------------------------------------------------- feedback */

export const FEEDBACK_TABLE = 'lesson_feedback';

const COURSE_TITLES = new Map(COURSES.map((course) => [course.slug, course.title]));
const LESSON_TITLES = new Map(
  COURSES.flatMap((course) =>
    (course.lessons ?? []).map((lesson, index) => [`${course.slug}#${index}`, lesson.title] as const),
  ),
);

export async function readFeedback(db: SupabaseClient): Promise<FeedbackResponse> {
  const { data, error } = await db
    .from(FEEDBACK_TABLE)
    .select('id,course_slug,lesson_index,lesson_title,rating,comment,user_id,created_at')
    .order('created_at', { ascending: false })
    .limit(1_000);

  if (error) {
    if (!isMissingTable(error)) throw error;
    return {
      provisioning: { present: [], missing: [FEEDBACK_TABLE] },
      totals: { responses: 0, helpful: 0, unhelpful: 0, comments: 0, avgRating: null },
      lessons: [],
      recent: [],
    };
  }

  type Raw = {
    id: string;
    course_slug: string;
    lesson_index: number;
    lesson_title: string | null;
    rating: 1 | -1;
    comment: string | null;
    user_id: string | null;
    created_at: string;
  };
  const raw = (data ?? []) as Raw[];

  // Lesson titles come from the catalogue where possible, so a renamed lesson
  // does not fragment its own history across two labels.
  const titleFor = (slug: string, index: number, stored: string | null) =>
    LESSON_TITLES.get(`${slug}#${index}`) ?? stored ?? `Lesson ${index + 1}`;

  const recent: FeedbackRow[] = raw.slice(0, 120).map((row) => ({
    id: row.id,
    courseSlug: row.course_slug,
    courseTitle: COURSE_TITLES.get(row.course_slug) ?? row.course_slug,
    lessonIndex: row.lesson_index,
    lessonTitle: titleFor(row.course_slug, row.lesson_index, row.lesson_title),
    // lesson_feedback stores a binary rating: 1 = helpful, -1 = unhelpful.
    helpful: row.rating === 1,
    rating: null,
    comment: row.comment,
    signedIn: Boolean(row.user_id),
    createdAt: row.created_at,
  }));

  const grouped = new Map<string, FeedbackLesson>();
  for (const row of raw) {
    const key = `${row.course_slug}#${row.lesson_index}`;
    const entry =
      grouped.get(key) ??
      {
        courseSlug: row.course_slug,
        courseTitle: COURSE_TITLES.get(row.course_slug) ?? row.course_slug,
        lessonIndex: row.lesson_index,
        lessonTitle: titleFor(row.course_slug, row.lesson_index, row.lesson_title),
        responses: 0,
        helpful: 0,
        unhelpful: 0,
        avgRating: null,
      };
    entry.responses += 1;
    if (row.rating === 1) entry.helpful += 1;
    if (row.rating === -1) entry.unhelpful += 1;
    grouped.set(key, entry);
  }

  const lessons = [...grouped.values()]
    // Worst first: the point of this table is finding the lesson that is failing.
    .sort((a, b) => b.unhelpful - a.unhelpful || b.responses - a.responses);

  return {
    provisioning: { present: [FEEDBACK_TABLE], missing: [] },
    totals: {
      responses: raw.length,
      helpful: raw.filter((row) => row.rating === 1).length,
      unhelpful: raw.filter((row) => row.rating === -1).length,
      comments: raw.filter((row) => str(row.comment)).length,
      avgRating: null,
    },
    lessons,
    recent,
  };
}

/* --------------------------------------------------------------------- audit */

export const AUDIT_TABLE = 'admin_audit_log';

/**
 * Best effort by design. An admin action must not fail because the audit
 * table has not been created yet, but it should still be recorded when it can.
 */
export type AuditResult = { error: unknown | null; correlationId: string | null };

export async function recordAudit(
  db: SupabaseClient,
  entry: { actorId: string; actorEmail: string; action: string; subject?: string | null; detail?: Record<string, unknown> },
): Promise<AuditResult> {
  try {
    const { error } = await db.from(AUDIT_TABLE).insert({
      actor_id: entry.actorId,
      actor_email: entry.actorEmail,
      action: entry.action,
      subject: entry.subject ?? null,
      detail: entry.detail ?? {},
    });
    if (!error) return { error: null, correlationId: null };
    const correlationId = crypto.randomUUID();
    console.error(`[admin-audit:${correlationId}] ${entry.action} was not recorded`, error);
    return { error, correlationId };
  } catch (error) {
    const correlationId = crypto.randomUUID();
    console.error(`[admin-audit:${correlationId}] ${entry.action} threw while recording`, error);
    return { error, correlationId };
  }
}
