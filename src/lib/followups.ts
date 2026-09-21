/**
 * Shared source of truth for the tracker's local storage.
 *
 * The tracker page and the nav bell both read the same two keys. Keeping the
 * shape, the defaults and the "is this chaseable" rule in one file is the only
 * thing stopping the badge count and the on-page count from quietly disagreeing.
 */

export const STATUSES = ['Saved', 'Applied', 'Interviewing', 'Offer', 'Rejected', 'Ghosted'] as const;
export type Status = (typeof STATUSES)[number];

/** Statuses where chasing them still makes sense. */
export const CHASEABLE: readonly Status[] = ['Applied', 'Interviewing'];

export type App = {
  id: string;
  role: string;
  company: string;
  url: string;
  status: Status;
  notes: string;
  appliedAt: string; // ISO date, YYYY-MM-DD
};

export const STORE = 'ally-applications';
export const STORE_DAYS = 'ally-followup-days';
/** Overdue app ids the user has already opened in the bell. Badge stays clear until a new one appears. */
export const STORE_SEEN = 'ally-followup-seen';
export const DEFAULT_DAYS = 5;

/** Fired on `window` after the tracker writes, so same-tab listeners update.
 *  The native `storage` event only fires in *other* tabs. */
export const APPS_CHANGED = 'ally:applications-changed';

export function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export function daysSince(iso: string) {
  const then = new Date(iso + 'T00:00:00');
  if (Number.isNaN(then.getTime())) return 0;
  return Math.max(0, Math.floor((Date.now() - then.getTime()) / 86_400_000));
}

function isApp(value: unknown): value is App {
  if (!value || typeof value !== 'object') return false;
  const a = value as Record<string, unknown>;
  return typeof a.id === 'string' && typeof a.appliedAt === 'string' && typeof a.status === 'string';
}

/** Never throws. Bad JSON in storage should degrade to an empty badge, not a
 *  blank page — the nav renders on every route. */
export function readApps(): App[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORE) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter(isApp) : [];
  } catch {
    return [];
  }
}

export function readFollowUpDays(): number {
  if (typeof window === 'undefined') return DEFAULT_DAYS;
  try {
    const n = Number(localStorage.getItem(STORE_DAYS));
    return Number.isFinite(n) && n > 0 ? n : DEFAULT_DAYS;
  } catch {
    return DEFAULT_DAYS;
  }
}

export function needsFollowUp(a: App, days: number) {
  return CHASEABLE.includes(a.status) && daysSince(a.appliedAt) >= days;
}

export function overdue(apps: App[], days: number): App[] {
  return apps
    .filter((a) => needsFollowUp(a, days))
    .sort((a, b) => a.appliedAt.localeCompare(b.appliedAt)); // oldest, most embarrassing, first
}

export function readSeenFollowUps(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORE_SEEN) ?? '[]');
    return new Set(Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : []);
  } catch {
    return new Set();
  }
}

/** Mark every currently overdue application as seen so the badge clears. */
export function markFollowUpsSeen(ids: string[]) {
  if (typeof window === 'undefined') return;
  try {
    const next = JSON.stringify([...new Set(ids)].sort());
    if (localStorage.getItem(STORE_SEEN) === next) return;
    localStorage.setItem(STORE_SEEN, next);
  } catch {
    /* ignore quota / private mode */
  }
  announceAppsChanged();
}

export function unseenFollowUps(overdueApps: App[]): App[] {
  const seen = readSeenFollowUps();
  return overdueApps.filter((a) => !seen.has(a.id));
}

export function announceAppsChanged() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(APPS_CHANGED));
}

/** Subscribe to both same-tab writes and other-tab `storage` events. */
export function subscribeApps(fn: () => void) {
  if (typeof window === 'undefined') return () => {};
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key === STORE || e.key === STORE_DAYS || e.key === STORE_SEEN) fn();
  };
  window.addEventListener(APPS_CHANGED, fn);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(APPS_CHANGED, fn);
    window.removeEventListener('storage', onStorage);
  };
}
