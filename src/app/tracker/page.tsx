'use client';

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import Nav from '@/components/Nav';
import GradientBg from '@/components/GradientBg';
import PullToRefresh from '@/components/PullToRefresh';
import Footer from '@/components/Footer';
import {
  type App,
  type Status,
  STATUSES,
  STORE,
  announceAppsChanged,
  daysAgo,
  daysSince,
  needsFollowUp as isOverdue,
} from '@/lib/followups';
import { STATUS_STYLE } from '@/lib/tracker-status';
import KanbanBoard from '@/components/tracker/KanbanBoard';
import { readView, serverView, subscribeView, writeView, type View } from '@/lib/tracker-view';
import AppDetail from '@/components/tracker/AppDetail';
import ReviewPrompt from '@/components/ReviewPrompt';
import { clampFollowUpDays, persistPreferences } from '@/lib/preferences';
import { usePreferences } from '@/lib/usePreferences';
import { useAuth } from '@/lib/AuthContext';
import {
  createApplication,
  deleteApplication,
  isHttpUrl,
  listApplications,
  patchApplication,
} from '@/lib/tracker-remote';

/** Common thresholds, plus whatever custom number /settings holds. */
const DAY_CHOICES = (current: number) =>
  Array.from(new Set([3, 5, 7, 10, 14, current])).sort((a, b) => a - b);

const SEED: App[] = [
  {
    id: 's1',
    role: 'Executive Assistant to Founder',
    company: 'Northwind Labs',
    url: 'https://www.onlinejobs.ph/jobseekers/job/executive-assistant-1701954',
    status: 'Interviewing',
    notes: 'Second call booked. They asked about Notion + inbox triage.',
    appliedAt: daysAgo(2),
  },
  {
    id: 's2',
    role: 'SEO Content Manager',
    company: 'Peakline Media',
    url: 'https://remoteok.com/remote-jobs/seo-content-manager',
    status: 'Applied',
    notes: 'Sent portfolio + 2 sample briefs.',
    appliedAt: daysAgo(7),
  },
  {
    id: 's3',
    role: 'Ops Coordinator',
    company: 'Salt & Stone',
    url: 'https://www.onlinejobs.ph/jobseekers/job/ops-coordinator-1660483',
    status: 'Applied',
    notes: '',
    appliedAt: daysAgo(6),
  },
];

function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

/** Rows that came with the page, not from the person using it. */
const SEED_IDS = new Set(SEED.map((s) => s.id));

/** localStorage flag: "stop offering to move my device list up". */
const IMPORT_DISMISSED = 'ally-tracker-import-dismissed';

function readLocalApps(): App[] {
  try {
    const raw = localStorage.getItem(STORE);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) ? (parsed as App[]) : [];
  } catch {
    return [];
  }
}

function errorText(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <Tracker />
    </Suspense>
  );
}

function Tracker() {
  const params = useSearchParams();
  const router = useRouter();
  const [apps, setApps] = useState<App[]>([]);
  const [ready, setReady] = useState(false);
  // Account preference, mirrored locally — the bell, /settings and this select
  // all read the same value, so they cannot disagree.
  const { followUpDays } = usePreferences();
  const setFollowUpDays = (value: number) => {
    void persistPreferences({ followUpDays: clampFollowUpDays(value) });
  };
  // Deep link from the nav bell: /tracker?filter=followup
  const [filter, setFilter] = useState<'all' | 'followup' | Status>(
    params.get('filter') === 'followup' ? 'followup' : 'all',
  );
  const view = useSyncExternalStore(subscribeView, readView, serverView);
  const [detailId, setDetailId] = useState<string | null>(null);
  // Where focus goes when the detail sheet closes — the card that opened it.
  const detailOpener = useRef<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ role: '', company: '', url: '', status: 'Applied' as Status, notes: '' });
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  // `true` is permanent for this account. A false result is deliberately not
  // cached, so another Offer change checks the database again across devices.
  const hasReviewed = useRef(false);
  const checkingReview = useRef(false);

  // Where this list actually lives. "cloud" only after the API answers.
  const { status: authStatus, ready: authReady } = useAuth();

  // Redirect to login if not signed in
  useEffect(() => {
    if (authStatus === 'out') {
      router.replace('/login?next=/tracker');
    }
  }, [authStatus, router]);

  const [mode, setMode] = useState<'local' | 'cloud'>('local');
  const [syncError, setSyncError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // Rows sitting in this browser that the account has never seen.
  const [strays, setStrays] = useState<App[]>([]);
  const [importing, setImporting] = useState(false);
  const cloud = mode === 'cloud';

  // load — localStorage while signed out, the account once we know who you are
  useEffect(() => {
    if (!authReady) return;
    let alive = true;

    // Snapshot the device list before the account list replaces it, so nothing
    // typed while signed out quietly disappears.
    const local = readLocalApps().filter((a) => !SEED_IDS.has(a.id));
    void (async () => {
      if (authStatus === 'out') {
        const stored = readLocalApps();
        setApps(stored.length ? stored : SEED);
        setMode('local');
        setStrays([]);
        setReady(true);
        return;
      }
      try {
        const rows = await listApplications();
        if (!alive) return;
        setApps(rows);
        setMode('cloud');
        setSyncError(null);
        const dismissed = localStorage.getItem(IMPORT_DISMISSED) === '1';
        setStrays(!dismissed && rows.length === 0 && local.length > 0 ? local : []);
      } catch (error) {
        if (!alive) return;
        setApps(local.length ? local : readLocalApps());
        setMode('local');
        setSyncError(errorText(error, 'Could not reach your account.'));
      } finally {
        if (alive) setReady(true);
      }
    })();

    return () => {
      alive = false;
    };
  }, [authReady, authStatus]);

  /**
   * Pull-to-refresh. Signed in, this re-reads the account — which is the whole
   * point on a phone that has had the tab open since yesterday, or that just
   * came back from applying on another device. Signed out there is no server to
   * ask, so it re-reads this browser's list (another tab may have written it).
   * Deliberately separate from the loader above: this must not flip `ready`
   * back to false and empty the page mid-gesture.
   */
  const refresh = useCallback(async () => {
    if (!authReady) return;
    if (authStatus === 'out') {
      const stored = readLocalApps();
      setApps(stored.length ? stored : SEED);
      return;
    }
    try {
      const rows = await listApplications();
      setApps(rows);
      setMode('cloud');
      setSyncError(null);
    } catch (error) {
      // Stay on the rows we have; the banner explains why they are stale.
      setSyncError(errorText(error, 'Could not reach your account.'));
    }
  }, [authReady, authStatus]);

  // mirror — the nav bell reads localStorage, so it has to stay in step
  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORE, JSON.stringify(apps));
    announceAppsChanged(); // same-tab listeners (the nav bell) don't get `storage`
  }, [apps, ready]);

  const chooseView = (next: View) => {
    setDetailId(null);
    // The board already shows every status as its own lane, so a single-status
    // filter would leave five empty columns and one real one.
    if (next === 'board' && filter !== 'all' && filter !== 'followup') setFilter('all');
    writeView(next);
  };

  const openDetail = (id: string) => {
    detailOpener.current = document.activeElement as HTMLElement | null;
    setDetailId(id);
  };

  const closeDetail = () => {
    setDetailId(null);
    detailOpener.current?.focus?.();
    detailOpener.current = null;
  };

  const needsFollowUp = (a: App) => isOverdue(a, followUpDays);

  // Read fresh out of `apps` every render, so an edit made in the sheet shows
  // up in the sheet rather than in a stale copy taken when it opened.
  const detail = detailId ? (apps.find((a) => a.id === detailId) ?? null) : null;

  const followUpCount = useMemo(() => apps.filter(needsFollowUp).length, [apps, followUpDays]);

  const visible = useMemo(() => {
    const list =
      filter === 'all'
        ? apps
        : filter === 'followup'
          ? apps.filter(needsFollowUp)
          : apps.filter((a) => a.status === filter);
    return [...list].sort((a, b) => {
      const fa = needsFollowUp(a) ? 0 : 1;
      const fb = needsFollowUp(b) ? 0 : 1;
      if (fa !== fb) return fa - fb;
      return b.appliedAt.localeCompare(a.appliedAt);
    });
  }, [apps, filter, followUpDays]);

  const clearForm = () => {
    setDraft({ role: '', company: '', url: '', status: 'Applied', notes: '' });
    setFormError(null);
    setOpen(false);
  };

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.role.trim() && !draft.url.trim()) return;
    setFormError(null);

    if (cloud) {
      // job_url is NOT NULL on the applications table, so the link stops being
      // optional the moment this list belongs to an account.
      if (!isHttpUrl(draft.url)) {
        setFormError('Paste the listing link. Your account keeps a URL with every application.');
        return;
      }
      setSaving(true);
      try {
        const saved = await createApplication(draft);
        setApps((prev) => [saved, ...prev]);
        clearForm();
      } catch (error) {
        setFormError(errorText(error, 'Could not save that application.'));
      } finally {
        setSaving(false);
      }
      return;
    }

    const host = hostOf(draft.url);
    setApps((prev) => [
      {
        id: crypto.randomUUID(),
        role: draft.role.trim() || 'Untitled role',
        company: draft.company.trim() || host || '—',
        url: draft.url.trim(),
        status: draft.status,
        notes: draft.notes.trim(),
        appliedAt: daysAgo(0),
      },
      ...prev,
    ]);
    clearForm();
  };

  const checkForReview = useCallback(async () => {
    if (hasReviewed.current || checkingReview.current) return;
    checkingReview.current = true;
    try {
      const response = await fetch('/api/reviews', { cache: 'no-store' });
      if (!response.ok) return;
      const result = (await response.json()) as { hasReviewed?: boolean };
      if (result.hasReviewed) {
        hasReviewed.current = true;
      } else {
        setReviewOpen(true);
      }
    } catch {
      // A celebration should never turn a successful status update into an
      // error. A later Offer transition gets another chance to ask.
    } finally {
      checkingReview.current = false;
    }
  }, []);

  /** Optimistic everywhere; in cloud mode a failed write rolls the row back. */
  const patch = (id: string, p: Partial<App>) => {
    const before = apps.find((a) => a.id === id);
    const becameOffer = before?.status !== 'Offer' && p.status === 'Offer';
    setApps((prev) => prev.map((a) => (a.id === id ? { ...a, ...p } : a)));
    if (!cloud || !before) return;
    void patchApplication(id, p)
      .then(() => {
        // Trigger from the user action only, never from loading an existing
        // Offer. Waiting for the write also avoids celebrating a failed move.
        if (becameOffer) void checkForReview();
      })
      .catch((error: unknown) => {
        setApps((prev) => prev.map((a) => (a.id === id ? before : a)));
        setSyncError(errorText(error, 'That change did not save.'));
      });
  };

  const remove = (id: string) => {
    const before = apps.find((a) => a.id === id);
    setConfirmDelete(null);
    setApps((prev) => prev.filter((a) => a.id !== id));
    if (!cloud || !before) return;
    void deleteApplication(id).catch((error: unknown) => {
      setApps((prev) => (prev.some((a) => a.id === id) ? prev : [before, ...prev]));
      setSyncError(errorText(error, 'That application did not delete.'));
    });
  };

  /** Move the signed-out list into the account, one row at a time. */
  const importStrays = async () => {
    setImporting(true);
    const moved: App[] = [];
    let skipped = 0;
    for (const a of strays) {
      if (!isHttpUrl(a.url)) {
        skipped += 1;
        continue;
      }
      try {
        moved.push(await createApplication(a));
      } catch {
        skipped += 1;
      }
    }
    setApps((prev) => [...moved, ...prev]);
    setStrays([]);
    localStorage.setItem(IMPORT_DISMISSED, '1');
    setImporting(false);
    if (skipped) {
      setSyncError(
        `${skipped} ${skipped === 1 ? 'entry' : 'entries'} could not move up — an application needs a valid listing link to live in your account.`,
      );
    }
  };

  const dismissStrays = () => {
    localStorage.setItem(IMPORT_DISMISSED, '1');
    setStrays([]);
  };

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const a of apps) c[a.status] = (c[a.status] ?? 0) + 1;
    return c;
  }, [apps]);

  // Don't render while redirecting unauthenticated users
  if (authStatus === 'out' || !authReady) {
    return (
      <div className="min-h-screen">
        <GradientBg position="right" />
        <Nav />
        <div className="flex items-center justify-center pt-40">
          <div className="text-center">
            <p style={{ color: 'var(--color-ink-2)' }}>One moment — taking you to sign in so your tracker can load.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <GradientBg position="right" />
      <Nav />

      <PullToRefresh onRefresh={refresh}>
        <section className="px-5 pt-28 md:px-8 md:pt-40">
          <div className="mx-auto max-w-5xl">
            <p className="eyebrow">Application tracker</p>
            <h1 className="display-lg mt-4">
              Everything you&rsquo;ve sent<span className="dot">.</span>
            </h1>
            <p className="lede mt-5 max-w-xl">
              One list instead of twelve browser tabs. Anything untouched past{' '}
              {followUpDays} days gets flagged so you actually follow up.
            </p>

            <p className="mt-4">
              <Link
                href="/analytics"
                className="tap text-sm font-semibold underline underline-offset-2"
                style={{ color: 'var(--color-accent-deep)' }}
              >
                See what it all adds up to
              </Link>
            </p>

            {/* summary */}
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="card p-5">
                <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                  Tracked
                </p>
                <p className="font-display mt-1 text-3xl font-extrabold tracking-tight">
                  {ready ? apps.length : '—'}
                </p>
              </div>
              <div className="card p-5">
                <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                  In play
                </p>
                <p className="font-display mt-1 text-3xl font-extrabold tracking-tight">
                  {ready ? (counts.Applied ?? 0) + (counts.Interviewing ?? 0) : '—'}
                </p>
              </div>
              <div className="card p-5" style={followUpCount ? { background: '#fdf0e8' } : undefined}>
                <p className="text-sm" style={{ color: followUpCount ? '#8a4318' : 'var(--color-muted)' }}>
                  Need a nudge
                </p>
                <p
                  className="font-display mt-1 text-3xl font-extrabold tracking-tight"
                  style={{ color: followUpCount ? '#b5581f' : undefined }}
                >
                  {ready ? followUpCount : '—'}
                </p>
              </div>
            </div>

            {/* controls */}
            <div className="card mt-5 p-4 md:p-5">
              <div className="flex flex-wrap items-center gap-3">
                <button type="button" className="btn btn-primary" onClick={() => setOpen((v) => !v)}>
                  {open ? 'Cancel' : '+ Add application'}
                </button>

                <div
                  className="ml-auto flex gap-1 rounded-full p-1"
                  role="group"
                  aria-label="Layout"
                  style={{ background: 'var(--color-paper-2)' }}
                >
                  {(['list', 'board'] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => chooseView(v)}
                      aria-pressed={view === v}
                      className="tap-control rounded-full px-4 py-1.5 text-sm font-semibold capitalize"
                      style={
                        view === v
                          ? { background: 'var(--color-ink)', color: '#fff' }
                          : { color: 'var(--color-muted)' }
                      }
                    >
                      {v}
                    </button>
                  ))}
                </div>

                <label
                  className="flex flex-none items-center gap-2 text-sm whitespace-nowrap"
                  style={{ color: 'var(--color-muted)' }}
                >
                  Remind after
                  <select
                    value={followUpDays}
                    onChange={(e) => setFollowUpDays(Number(e.target.value))}
                    className="h-11 rounded-full px-3 pr-8 text-sm font-semibold leading-none"
                    style={{ border: '1px solid var(--color-line-2)', background: '#fff', color: 'var(--color-ink)' }}
                  >
                    {DAY_CHOICES(followUpDays).map((d) => (
                      <option key={d} value={d}>
                        {d} days
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {open && (
                <form onSubmit={add} className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label htmlFor="url" className="mb-1.5 block text-sm font-medium">
                      Job listing URL{' '}
                      {cloud && (
                        <span style={{ color: 'var(--color-muted)' }}>(required)</span>
                      )}
                    </label>
                    <input
                      id="url"
                      className="field"
                      type="url"
                      required={cloud}
                      placeholder="https://www.onlinejobs.ph/jobseekers/job/…"
                      value={draft.url}
                      onChange={(e) => setDraft({ ...draft, url: e.target.value })}
                    />
                  </div>
                  <div>
                    <label htmlFor="role" className="mb-1.5 block text-sm font-medium">
                      Role
                    </label>
                    <input
                      id="role"
                      className="field"
                      placeholder="Executive Assistant"
                      value={draft.role}
                      onChange={(e) => setDraft({ ...draft, role: e.target.value })}
                    />
                  </div>
                  <div>
                    <label htmlFor="company" className="mb-1.5 block text-sm font-medium">
                      Company
                    </label>
                    <input
                      id="company"
                      className="field"
                      placeholder="Northwind Labs"
                      value={draft.company}
                      onChange={(e) => setDraft({ ...draft, company: e.target.value })}
                    />
                  </div>
                  <div>
                    <label htmlFor="status" className="mb-1.5 block text-sm font-medium">
                      Status
                    </label>
                    <select
                      id="status"
                      className="field"
                      value={draft.status}
                      onChange={(e) => setDraft({ ...draft, status: e.target.value as Status })}
                    >
                      {STATUSES.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="notes" className="mb-1.5 block text-sm font-medium">
                      Notes
                    </label>
                    <textarea
                      id="notes"
                      className="field"
                      rows={2}
                      placeholder="What you sent, who you spoke to, anything to remember."
                      value={draft.notes}
                      onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    {formError && (
                      <p className="mb-3 text-[0.8125rem] font-medium" style={{ color: '#a83d55' }} role="alert">
                        {formError}
                      </p>
                    )}
                    <button type="submit" className="btn btn-ink w-full !py-3.5" disabled={saving}>
                      {saving ? 'Saving…' : 'Save application'}
                    </button>
                  </div>
                </form>
              )}

              {/* filters */}
              <div className="mt-5 flex flex-wrap gap-2">
                <button type="button" className="chip" data-on={filter === 'all'} onClick={() => setFilter('all')}>
                  All <Pill n={apps.length} on={filter === 'all'} />
                </button>
                <button
                  type="button"
                  className="chip"
                  data-on={filter === 'followup'}
                  onClick={() => setFilter('followup')}
                >
                  Needs follow-up <Pill n={followUpCount} on={filter === 'followup'} />
                </button>
                {view === 'list' &&
                  STATUSES.map((s) => (
                    <button key={s} type="button" className="chip" data-on={filter === s} onClick={() => setFilter(s)}>
                      {s} <Pill n={counts[s] ?? 0} on={filter === s} />
                    </button>
                  ))}
              </div>
            </div>
          </div>
        </section>

        {/* list */}
        <section className="px-5 pt-6 md:px-8">
          <div className="mx-auto max-w-5xl space-y-4">
            {strays.length > 0 && (
              <div className="card p-5 md:p-6" style={{ background: '#fdf0e8' }}>
                <p className="font-display text-base font-extrabold tracking-tight" style={{ color: '#8a4318' }}>
                  {strays.length} {strays.length === 1 ? 'application is' : 'applications are'} still
                  only on this device
                </p>
                <p className="mt-1.5 text-[0.875rem] leading-relaxed" style={{ color: '#8a4318' }}>
                  Move them into your account and they follow you to every device. Anything without a
                  listing link stays behind.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="btn btn-ink !py-2.5 !text-sm"
                    onClick={() => void importStrays()}
                    disabled={importing}
                  >
                    {importing ? 'Moving…' : 'Move them up'}
                  </button>
                  <button type="button" className="btn btn-ghost !py-2.5 !text-sm" onClick={dismissStrays}>
                    No thanks
                  </button>
                </div>
              </div>
            )}

            {syncError && (
              <div
                className="card p-4 text-[0.875rem] leading-relaxed md:p-5"
                role="status"
                style={{ background: '#fbecef', color: '#a83d55' }}
              >
                {syncError}
              </div>
            )}
          </div>
        </section>

        {/* board */}
        {ready && view === 'board' && (
          <section className="px-5 pt-4 md:px-8">
            <div className="mx-auto max-w-7xl">
              <KanbanBoard
                apps={visible}
                followUpDays={followUpDays}
                isOverdue={needsFollowUp}
                onMove={(id, status) => patch(id, { status })}
                onOpen={openDetail}
              />
              <p className="mt-2 text-center text-xs" style={{ color: 'var(--color-faint)' }}>
                Drag a card to another column to change its status. On a keyboard: tab to a card&rsquo;s
                handle, press Space, then the arrow keys.
              </p>
            </div>
          </section>
        )}

        <section className="px-5 pt-4 md:px-8">
          <div className="mx-auto max-w-5xl space-y-4">
            {ready &&
              view === 'list' &&
              visible.map((a) => {
                const flag = needsFollowUp(a);
                const st = STATUS_STYLE[a.status];
                const age = daysSince(a.appliedAt);
                const host = hostOf(a.url);
                return (
                  <article key={a.id} className="card min-w-0 p-6 md:p-7">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h2 className="wrap-anywhere font-display text-lg font-extrabold leading-snug tracking-tight">
                          {a.role}
                        </h2>
                        <p className="wrap-anywhere mt-0.5 text-sm" style={{ color: 'var(--color-muted)' }}>
                          {a.company}
                          {host && (
                            <>
                              {' · '}
                              <a
                                href={a.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="tap underline underline-offset-2"
                              >
                                {host}
                              </a>
                            </>
                          )}
                        </p>
                      </div>

                      <select
                        aria-label={`Status for ${a.role}`}
                        value={a.status}
                        onChange={(e) => patch(a.id, { status: e.target.value as Status })}
                        className="tap-control h-9 flex-none rounded-full px-3 pr-7 text-[0.8125rem] font-semibold leading-none"
                        style={{ background: st.bg, color: st.fg, border: 'none' }}
                      >
                        {STATUSES.map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    {flag && (
                      <div
                        className="mt-4 flex items-start gap-2.5 rounded-xl p-3"
                        style={{ background: '#fdf0e8' }}
                      >
                        <span aria-hidden>🔔</span>
                        <p className="text-[0.8125rem] leading-relaxed" style={{ color: '#8a4318' }}>
                          No movement in <strong>{age} days</strong>. A one-line follow-up is the
                          cheapest thing you can do today.
                        </p>
                      </div>
                    )}

                    {editingNotes === a.id ? (
                      <div className="mt-4">
                        <label htmlFor={`notes-${a.id}`} className="sr-only">
                          Notes for {a.role}
                        </label>
                        <textarea
                          id={`notes-${a.id}`}
                          className="field"
                          rows={3}
                          autoFocus
                          value={noteDraft}
                          onChange={(e) => setNoteDraft(e.target.value)}
                        />
                        <button
                          type="button"
                          className="btn btn-ghost mt-2 !py-2 !text-sm"
                          onClick={() => {
                            setEditingNotes(null);
                            if (noteDraft !== a.notes) patch(a.id, { notes: noteDraft });
                          }}
                        >
                          Done
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setNoteDraft(a.notes);
                          setEditingNotes(a.id);
                        }}
                        className="wrap-anywhere mt-4 block w-full rounded-xl p-3 text-left text-[0.875rem] leading-relaxed"
                        style={{
                          background: 'var(--color-paper-2)',
                          color: a.notes ? 'var(--color-ink-2)' : 'var(--color-faint)',
                        }}
                      >
                        {a.notes || 'Add a note…'}
                      </button>
                    )}

                    <div
                      className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4 text-xs"
                      style={{ borderColor: 'var(--color-line)', color: 'var(--color-faint)' }}
                    >
                      <span>
                        {age === 0 ? 'Added today' : `${age} day${age === 1 ? '' : 's'} ago`}
                      </span>
                      <div className="flex flex-wrap gap-3">
                        {a.status === 'Saved' && (
                          <button
                            type="button"
                            onClick={() => patch(a.id, { status: 'Applied' })}
                            className="tap font-semibold underline underline-offset-2"
                            style={{ color: 'var(--color-accent-deep)' }}
                          >
                            Mark applied
                          </button>
                        )}
                        <Link
                          href={`/cover-letter?role=${encodeURIComponent(a.role)}&company=${encodeURIComponent(a.company)}`}
                          className="tap underline underline-offset-2"
                        >
                          {a.status === 'Saved' ? 'Write cover letter' : 'Write a follow-up'}
                        </Link>
                        {confirmDelete === a.id ? (
                          <span className="flex items-center gap-3">
                            <span style={{ color: 'var(--color-ink-2)' }}>Delete for good?</span>
                            <button
                              type="button"
                              onClick={() => remove(a.id)}
                              className="tap font-semibold underline underline-offset-2"
                              style={{ color: '#a83d55' }}
                            >
                              Yes, delete
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDelete(null)}
                              className="tap underline underline-offset-2"
                            >
                              Keep
                            </button>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDelete(a.id)}
                            className="tap underline underline-offset-2"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}

            {ready && (view === 'list' ? visible.length === 0 : apps.length === 0) && (
              <div className="card px-6 py-16 text-center">
                <p className="font-display text-xl font-extrabold tracking-tight">Nothing here yet</p>
                <p className="mx-auto mt-3 max-w-sm text-[0.9375rem]" style={{ color: 'var(--color-muted)' }}>
                  {filter === 'all'
                    ? 'Add your first application, or save one straight from the job board.'
                    : 'Nothing in this bucket right now.'}
                </p>
                <Link href="/jobs" className="btn btn-ghost mt-6">
                  Browse jobs
                </Link>
              </div>
            )}

            <p className="pt-2 text-center text-sm" style={{ color: 'var(--color-faint)' }}>
                {cloud
                  ? 'Saved to your account. Same list on every device you sign in on.'
                  : 'Saved on this device for now — we couldn\u2019t reach your account, so this list hasn\u2019t synced yet. It will catch up on the next refresh.'}
              </p>
          </div>
        </section>

        <Footer tagline="Track every application. Miss nothing" />
      </PullToRefresh>

      {detail && (
        <AppDetail
          app={detail}
          overdue={needsFollowUp(detail)}
          onPatch={(p) => patch(detail.id, p)}
          onDelete={() => {
            remove(detail.id);
            closeDetail();
          }}
          onClose={closeDetail}
        />
      )}

      {reviewOpen && (
        <ReviewPrompt
          onClose={() => setReviewOpen(false)}
          onSubmitted={() => {
            hasReviewed.current = true;
            setReviewOpen(false);
          }}
        />
      )}
    </div>
  );
}

function Pill({ n, on }: { n: number; on: boolean }) {
  return (
    <span
      className="ml-1 rounded-full px-1.5 py-0.5 text-[0.6875rem] font-semibold tabular-nums"
      style={{
        background: on ? 'rgba(255,255,255,.18)' : 'var(--color-paper-2)',
        color: on ? '#fff' : 'var(--color-muted)',
      }}
    >
      {n}
    </span>
  );
}
