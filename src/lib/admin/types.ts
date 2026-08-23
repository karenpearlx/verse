export type Provisioning = { present: string[]; missing: string[] };

/* ---------------------------------------------------------------- analytics */

export type TimelinePoint = { date: string; views: number; sessions: number; visitors: number };
export type PageRow = { path: string; views: number; sessions: number; visitors: number; avgScroll: number | null };
export type ReferrerRow = { source: string; visits: number };
export type ClickRow = { label: string; target: string; count: number; lastAt: string | null };
export type JobViewRow = { title: string; views: number; jobId: string; source: string | null };
export type SearchRow = { query: string; count: number };
export type FilterRow = { filter: string; value: string; count: number };
export type SessionRow = {
  sessionId: string;
  firstSeen: string;
  lastSeen: string;
  views: number;
  entryPath: string | null;
  referrer: string | null;
};
export type VisitorRow = {
  visitorId: string;
  firstSeen: string;
  lastSeen: string;
  views: number;
  sessions: number;
  referrer: string | null;
};
export type AnalyticsResponse = {
  provisioning: Provisioning;
  rangeDays: number;
  /** True when the event volume hit the read ceiling, so totals are a floor. */
  truncated: boolean;
  totals: {
    pageViews: number | null;
    uniqueVisitors: number | null;
    sessions: number | null;
    activeVisitors: number | null;
    clicks: number | null;
    jobViews: number | null;
    avgScrollDepth: number | null;
  };
  timeline: TimelinePoint[];
  pages: PageRow[];
  referrers: ReferrerRow[];
  clicks: ClickRow[];
  topJobs: JobViewRow[];
  searches: SearchRow[];
  filters: FilterRow[];
  sessions: SessionRow[];
  visitors: VisitorRow[];
};

/* ------------------------------------------------------------------ scraper */

export type ScraperSourceKey = 'olj' | 'remoteok' | 'wwr';
export type ScraperSource = {
  key: ScraperSourceKey;
  label: string;
  enabled: boolean;
  note: string | null;
  jobCount: number;
  activeCount: number;
  lastScrapedAt: string | null;
  newestPostedAt: string | null;
};
export type ScraperRun = {
  id: string;
  source: string;
  status: 'running' | 'success' | 'error' | 'stalled';
  jobCount: number;
  message: string | null;
  startedAt: string;
  finishedAt: string | null;
  durationMs: number | null;
};
export type ScraperResponse = {
  provisioning: Provisioning;
  sources: ScraperSource[];
  totalJobs: number;
  /** Rows written under a source key the app does not recognise. */
  strays: { source: string; jobCount: number; lastScrapedAt: string | null }[];
  running: ScraperRun | null;
  runs: ScraperRun[];
  problem: string | null;
};
export type ScraperTriggerResponse = { runId: string | null; startedAt: string };

/* -------------------------------------------------------------------- people */

export type UserRow = {
  id: string;
  email: string | null;
  joinedAt: string | null;
  lastActiveAt: string | null;
  applications: number;
  resumes: number;
  coverLetters: number;
  status: 'active' | 'suspended';
  suspendedAt: string | null;
  suspendedReason: string | null;
  plan: 'free' | 'pro' | 'creator';
};
export type UsersResponse = {
  provisioning: Provisioning;
  /** False when public.users has no status column yet, so suspending is off. */
  moderation: boolean;
  totals: {
    users: number | null;
    signups7d: number | null;
    signups30d: number | null;
    active7d: number | null;
    suspended: number | null;
    applications: number | null;
    resumes: number | null;
    coverLetters: number | null;
  };
  applicationsByStatus: { status: string; count: number }[];
  signupTimeline: { date: string; count: number }[];
  query: string;
  matched: number;
  users: UserRow[];
};

/* ----------------------------------------------------------------- templates */

export type TemplateKind = 'cover_letter' | 'resume' | 'tag';
export type BuiltinTemplate = { id: string; kind: TemplateKind; label: string; blurb: string };
export type StoredTemplate = {
  id: string;
  kind: TemplateKind;
  name: string;
  slug: string;
  body: string;
  updatedAt: string | null;
  updatedBy: string | null;
  label: string;
  blurb: string | null;
};
export type TagRow = { tag: string; jobs: number };
export type TemplatesResponse = {
  provisioning: Provisioning;
  builtins: BuiltinTemplate[];
  stored: StoredTemplate[];
  tags: TagRow[];
  editable: boolean;
};
export type TemplateInput = { kind: TemplateKind; label: string; blurb?: string | null; body?: string | null };

/* ------------------------------------------------------------------ feedback */

export type FeedbackRow = {
  id: string;
  courseSlug: string;
  courseTitle: string;
  lessonIndex: number;
  lessonTitle: string | null;
  helpful: boolean | null;
  rating: number | null;
  comment: string | null;
  signedIn: boolean;
  createdAt: string;
};
export type FeedbackLesson = {
  courseSlug: string;
  courseTitle: string;
  lessonIndex: number;
  lessonTitle: string;
  responses: number;
  helpful: number;
  unhelpful: number;
  avgRating: number | null;
};
export type FeedbackResponse = {
  provisioning: Provisioning;
  totals: { responses: number; helpful: number; unhelpful: number; comments: number; avgRating: number | null };
  lessons: FeedbackLesson[];
  recent: FeedbackRow[];
};

/* -------------------------------------------------------------------- health */

export type HealthCheck = {
  id: string;
  label: string;
  status: 'ok' | 'warn' | 'bad' | 'unknown';
  detail: string;
};
export type HealthResponse = {
  checks: HealthCheck[];
  missingTables: string[];
  /** Non-null when there is SQL the admin still needs to paste into Supabase. */
  setupFile: string | null;
  checkedAt: string;
};
