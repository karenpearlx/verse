'use client';

import { useState, useEffect, useCallback, useRef, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import GradientBg from '@/components/GradientBg';
import PullToRefresh from '@/components/PullToRefresh';
import {
  fetchJobDescription,
  sourceMeta,
  displayCompany,
  formatSalary,
  formatPostedAt,
  JOB_BOARD_SOURCES,
  type Job,
  type JobSort,
  type JobsPageResult,
} from '@/lib/jobs';
import { coverLetterHref, stashJob, markJobsReturn } from '@/lib/job-handoff';
import { track } from '@/lib/analytics';
import { useSavedJobs, jobKey, type SaveNotice } from '@/lib/useSavedJobs';
import SaveJobButton from '@/components/jobs/SaveJobButton';

const SOURCES = JOB_BOARD_SOURCES;
const PER_PAGE = 24;

type SortMode = JobSort;

function parseSort(value: string | null): SortMode {
  return value === 'oldest' || value === 'paid' ? value : 'newest';
}

function buildQuery(input: {
  q: string;
  source: string;
  sort: SortMode;
  page: number;
}) {
  const params = new URLSearchParams();
  if (input.q.trim()) params.set('q', input.q.trim());
  if (input.source !== 'all') params.set('source', input.source);
  if (input.sort !== 'newest') params.set('sort', input.sort);
  if (input.page > 1) params.set('page', String(input.page));
  return params;
}

export default function JobsBoard() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const searchQuery = searchParams.get('q') ?? '';
  const sourceFilter = searchParams.get('source') ?? 'all';
  const sortMode = parseSort(searchParams.get('sort'));
  const rawPage = Math.max(1, Number.parseInt(searchParams.get('page') ?? '1', 10) || 1);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState<Record<string, number>>({ all: 0 });
  const [pageCount, setPageCount] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draftQuery, setDraftQuery] = useState(searchQuery);
  /** Which card is mid-handoff, so only that button shows a spinner. */
  const [preparing, setPreparing] = useState<string | null>(null);
  const { isSaved, toggle: toggleSaved, pending: savingUrl, notice, dismissNotice } = useSavedJobs();
  const listTop = useRef<HTMLDivElement>(null);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  useEffect(() => {
    setDraftQuery(searchQuery);
  }, [searchQuery]);

  const replaceParams = useCallback(
    (next: { q?: string; source?: string; sort?: SortMode; page?: number }) => {
      const params = buildQuery({
        q: next.q ?? searchQuery,
        source: next.source ?? sourceFilter,
        sort: next.sort ?? sortMode,
        page: next.page ?? 1,
      });
      const qs = params.toString();
      startTransition(() => {
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      });
    },
    [pathname, router, searchQuery, sourceFilter, sortMode],
  );

  const loadPage = useCallback(
    async (opts?: { soft?: boolean }) => {
      const params = buildQuery({
        q: searchQuery,
        source: sourceFilter,
        sort: sortMode,
        page: rawPage,
      });
      params.set('pageSize', String(PER_PAGE));
      try {
        if (!opts?.soft) setLoading(true);
        const res = await fetch(`/api/jobs?${params.toString()}`, { cache: 'no-store' });
        const payload = (await res.json()) as JobsPageResult & { error?: string };
        if (!res.ok) throw new Error(payload.error ?? 'Could not load jobs');
        if (!alive.current) return;
        setJobs(payload.jobs);
        setTotal(payload.total);
        setCounts(payload.counts);
        setPageCount(payload.pageCount);
        setError(null);
        if (payload.page !== rawPage && payload.pageCount >= 1) {
          replaceParams({ page: Math.min(rawPage, payload.pageCount) });
        }
      } catch (e) {
        if (alive.current) setError((e as Error)?.message ?? 'Could not load jobs');
      } finally {
        if (alive.current) setLoading(false);
      }
    },
    [rawPage, replaceParams, searchQuery, sortMode, sourceFilter],
  );

  useEffect(() => {
    void loadPage();
  }, [loadPage]);

  /**
   * Pull-to-refresh. Kept apart from the first load on purpose: it never
   * touches `loading`, so the board you are already reading stays on screen
   * while the new one is on the wire instead of collapsing into a spinner under
   * your thumb. A failed refresh keeps the old rows and surfaces the banner.
   */
  const load = useCallback(async () => {
    await loadPage({ soft: true });
  }, [loadPage]);

  const page = Math.min(rawPage, pageCount);
  const start = total === 0 ? 0 : (page - 1) * PER_PAGE;
  const visibleJobs = jobs;

  /** Page changes jump back to the top of the results, not the top of the document. */
  const goToPage = useCallback(
    (next: number) => {
      replaceParams({ page: next });
      const el = listTop.current;
      if (!el) return;
      const reduced =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    },
    [replaceParams],
  );

  /**
   * Send this listing to the builder.
   *
   * The description is fetched here rather than with the board (see
   * fetchJobDescription) and stashed in sessionStorage, so the URL stays short.
   * A failed fetch is not a dead end: we hand over what the card already knows
   * and the builder opens with the title and company filled in.
   */
  const writeLetter = useCallback(
    async (job: Job) => {
      setPreparing(job.id);
      // 'click', not a new event type: the analytics table's check constraint
      // only allows the five long-standing types, so a new one would be
      // rejected at insert and lost.
      track('click', { jobId: job.id, label: 'generate_cover_letter', target: job.original_url });

      let description = '';
      try {
        description = await fetchJobDescription(job.id);
      } catch {
        /* fall through with the summary we already have */
      }

      const company = displayCompany(job);
      const key = stashJob({
        id: job.id,
        title: job.title,
        company,
        url: job.original_url,
        description,
        source: job.source,
        pay: formatSalary(job) ?? '',
        skills: job.skills ?? [],
      });

      // Leaves a breadcrumb so the builder knows it can offer a way back here.
      markJobsReturn();
      router.push(coverLetterHref(key, { title: job.title, company }));
    },
    [router],
  );

  const clearAll = () => {
    setDraftQuery('');
    replaceParams({ q: '', source: 'all', sort: 'newest', page: 1 });
  };

  // Debounce search into the URL so typing does not spam the API.
  useEffect(() => {
    if (draftQuery === searchQuery) return;
    const handle = window.setTimeout(() => {
      replaceParams({ q: draftQuery, page: 1 });
    }, 300);
    return () => window.clearTimeout(handle);
  }, [draftQuery, replaceParams, searchQuery]);

  return (
    <div className="min-h-screen">
      <GradientBg position="left" />
      <Nav />

      <PullToRefresh onRefresh={load}>
        <section className="px-5 pt-28 md:px-8 md:pt-40">
          <div className="mx-auto max-w-5xl">
            <p className="eyebrow">Live job board</p>
            <h1 className="display-lg mt-4">
              Every listing, side by side<span className="dot">.</span>
            </h1>
            <p className="lede mt-5 max-w-xl">
              Pulled from OnlineJobs.ph, RemoteOK, and We Work Remotely. Tap through to apply on
              the original site.
            </p>

            <div className="card mt-10 p-4 md:p-5">
              <div
                className="flex items-center gap-2 rounded-full py-1.5 pl-5 pr-1.5"
                style={{ border: '1px solid var(--color-line-2)' }}
              >
                <input
                  type="search"
                  placeholder="Search roles or skills"
                  value={draftQuery}
                  onChange={(e) => setDraftQuery(e.target.value)}
                  aria-label="Search jobs"
                  className="min-w-0 flex-1 bg-transparent py-2 text-base outline-none"
                />
                <span
                  aria-hidden
                  className="grid h-9 w-9 flex-none place-items-center rounded-full"
                  style={{ background: 'var(--color-accent)' }}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <circle cx="6" cy="6" r="4.4" stroke="#fff" strokeWidth="1.6" />
                    <path d="M9.4 9.4 12.5 12.5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                </span>
              </div>

              {/* Two selects rather than a wrapping row of chips: eight pills
                  ate three lines on a phone and pushed the first card below
                  the fold. Native <select> keeps the iOS wheel and the
                  screen-reader semantics for free. */}
              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div>
                  <label htmlFor="jobs-source" className="sr-only">
                    Filter by source
                  </label>
                  <select
                    id="jobs-source"
                    className="select-pill"
                    data-on={sourceFilter !== 'all'}
                    value={sourceFilter}
                    onChange={(e) => {
                      replaceParams({ source: e.target.value, page: 1 });
                    }}
                  >
                    <option value="all">
                      All sources{loading ? '' : ` (${counts.all ?? 0})`}
                    </option>
                    {SOURCES.map((s) => {
                      const meta = sourceMeta(s);
                      const n = counts[s] ?? 0;
                      // If a source has no jobs yet, show it but disable selection.
                      const empty = !loading && n === 0;
                      return (
                        <option key={s} value={s} disabled={empty}>
                          {meta.label}
                          {loading ? '' : empty ? ' (none yet)' : ` (${n})`}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label htmlFor="jobs-sort" className="sr-only">
                    Sort listings
                  </label>
                  <select
                    id="jobs-sort"
                    className="select-pill"
                    data-on={sortMode !== 'newest'}
                    value={sortMode}
                    onChange={(e) => {
                      replaceParams({ sort: e.target.value as SortMode, page: 1 });
                    }}
                  >
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                    <option value="paid">Only jobs that show pay</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm" aria-live="polite" style={{ color: 'var(--color-muted)' }}>
                {loading
                  ? 'Loading listings…'
                  : total === 0
                    ? `No matches${counts.all ? ` out of ${counts.all} listings` : ''}`
                    : `Showing ${start + 1}–${start + visibleJobs.length} of ${total} listings` +
                      (pageCount > 1 ? ` · page ${page} of ${pageCount}` : '')}
              </p>
              {!loading && (searchQuery || sourceFilter !== 'all' || sortMode !== 'newest') && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-sm underline underline-offset-4"
                  style={{ color: 'var(--color-muted)' }}
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="px-5 pt-6 md:px-8">
          <div className="mx-auto max-w-5xl">
            {/* Scroll anchor for pagination. scroll-mt clears the fixed nav. */}
            <div ref={listTop} style={{ scrollMarginTop: '6.5rem' }} />
            {error && (
              <div className="card p-8 text-center">
                <p className="font-display text-xl font-extrabold tracking-tight">
                  The listings didn&rsquo;t load
                </p>
                <p className="mt-2 text-sm" style={{ color: 'var(--color-muted)' }}>
                  Usually a connection hiccup, not you. Give it another try.
                </p>
                <button type="button" className="btn btn-primary mt-5 !px-6 !py-2.5 !text-sm" onClick={() => void loadPage()}>
                  Try again
                </button>
              </div>
            )}

            {loading && (
              <div className="grid gap-4 md:grid-cols-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="card p-6" style={{ opacity: 0.5 }}>
                    <div className="h-4 w-3/4 rounded-full" style={{ background: 'var(--color-paper-2)' }} />
                    <div className="mt-3 h-3 w-1/3 rounded-full" style={{ background: 'var(--color-paper-2)' }} />
                    <div className="mt-8 h-3 w-1/2 rounded-full" style={{ background: 'var(--color-paper-2)' }} />
                  </div>
                ))}
              </div>
            )}

            {!loading && !error && (
              <div className="grid gap-4 md:grid-cols-2">
                {visibleJobs.map((job) => {
                  const meta = sourceMeta(job.source);
                  const pay = formatSalary(job);
                  return (
                    <article
                      key={job.id}
                      className="card group relative flex min-w-0 flex-col p-6 transition-transform duration-200 hover:-translate-y-0.5 md:p-7"
                    >
                      <div className="mb-3 flex min-w-0 items-start justify-between gap-3">
                        <h2 className="wrap-anywhere font-display min-w-0 text-lg font-extrabold leading-snug tracking-tight">
                          {/* Stretched link: the whole card still opens the
                              listing, but the markup no longer nests a button
                              inside an anchor, which is invalid and swallowed
                              the click on some browsers. */}
                          <a
                            href={job.original_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="stretch-link"
                            onClick={() =>
                              track('job_view', { jobId: job.id, label: job.title, target: job.original_url })
                            }
                          >
                            {job.title}
                          </a>
                        </h2>
                        <div className="flex flex-none items-center gap-1.5">
                          <span
                            className="rounded-md px-2 py-1 text-[0.6875rem] font-semibold"
                            style={{ background: meta.bg, color: meta.fg }}
                          >
                            {meta.short}
                          </span>
                          <SaveJobButton
                            saved={isSaved(job.original_url)}
                            busy={savingUrl === jobKey(job.original_url)}
                            title={job.title}
                            onToggle={() =>
                              void toggleSaved({
                                title: job.title,
                                company: displayCompany(job),
                                url: job.original_url,
                              })
                            }
                          />
                        </div>
                      </div>

                      <p className="wrap-anywhere text-sm" style={{ color: 'var(--color-muted)' }}>
                        {displayCompany(job)}
                      </p>

                      {job.skills && job.skills.length > 0 && (
                        <div className="mt-4 flex min-w-0 flex-wrap gap-1.5">
                          {/* Dedupe first: some upstream rows repeat a skill
                              (e.g. ["Lead Generation","Lead Generation","Sales"]),
                              which both rendered the chip twice and tripped
                              React's duplicate-key warning. */}
                          {[...new Set(job.skills)].slice(0, 4).map((skill) => (
                            <span
                              key={skill}
                              className="wrap-anywhere rounded-md px-2 py-1 text-xs"
                              style={{ background: 'var(--color-paper-2)', color: 'var(--color-ink-2)' }}
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}

                      <div
                        className="mt-4 flex items-baseline justify-between gap-3"
                        style={{ marginTop: 'auto', paddingTop: '1rem' }}
                      >
                        <span
                          className="font-display text-base font-extrabold"
                          style={{ color: pay ? 'var(--color-accent)' : 'var(--color-faint)' }}
                        >
                          {pay ?? 'Rate not listed'}
                        </span>
                        <span className="text-xs" style={{ color: 'var(--color-faint)' }}>
                          {formatPostedAt(job)}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => writeLetter(job)}
                        disabled={preparing === job.id}
                        aria-busy={preparing === job.id}
                        className="btn btn-ghost relative z-[1] mt-4 w-full justify-center !min-h-[44px] !py-2.5 !text-[0.8125rem]"
                      >
                        {preparing === job.id ? (
                          <>
                            <Spinner /> Opening the builder…
                          </>
                        ) : (
                          <>
                            Generate cover letter
                            <span className="sr-only"> for {job.title}</span>
                          </>
                        )}
                      </button>
                    </article>
                  );
                })}
              </div>
            )}

            {!loading && !error && pageCount > 1 && (
              <Pagination page={page} pageCount={pageCount} onGo={goToPage} />
            )}

            {!loading && !error && total === 0 && (
              <div className="card px-6 py-16 text-center">
                <p className="font-display text-xl font-extrabold tracking-tight">
                  Nothing matches that
                </p>
                <p className="mx-auto mt-3 max-w-sm text-[0.9375rem]" style={{ color: 'var(--color-muted)' }}>
                  Try a broader keyword, or clear the source filter.
                </p>
                <button type="button" className="btn btn-ghost mt-6" onClick={clearAll}>
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </section>

        <SaveToast notice={notice} onDismiss={dismissNotice} />

        <Footer tagline="Every listing in one place" />
      </PullToRefresh>
    </div>
  );
}

/**
 * Page numbers with gaps: first, last, and a window around the current page.
 * Returns 'gap' markers rather than rendering them, so the caller keeps
 * control of the markup.
 */
function pageItems(page: number, pageCount: number): Array<number | 'gap'> {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1);

  const window = new Set<number>([1, pageCount, page, page - 1, page + 1]);
  // Keep the strip a steady width when you sit at either end.
  if (page <= 3) [2, 3, 4].forEach((n) => window.add(n));
  if (page >= pageCount - 2) [pageCount - 3, pageCount - 2, pageCount - 1].forEach((n) => window.add(n));

  const nums = [...window].filter((n) => n >= 1 && n <= pageCount).sort((a, b) => a - b);
  const out: Array<number | 'gap'> = [];
  let prev = 0;
  for (const n of nums) {
    if (prev && n - prev > 1) out.push('gap');
    out.push(n);
    prev = n;
  }
  return out;
}

function Pagination({
  page,
  pageCount,
  onGo,
}: {
  page: number;
  pageCount: number;
  onGo: (n: number) => void;
}) {
  const items = pageItems(page, pageCount);
  return (
    <nav
      aria-label="Job board pages"
      className="mt-10 flex flex-wrap items-center justify-center gap-2"
    >
      <button
        type="button"
        className="btn btn-ghost pg-prev !min-h-[44px] !py-2.5 !text-[0.8125rem]"
        onClick={() => onGo(page - 1)}
        disabled={page === 1}
        style={page === 1 ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
      >
        <Chevron /> Prev
      </button>

      {/* On narrow screens the numbers take their own row above Prev/Next,
          otherwise the three groups wrap into three sad stacked rows. */}
      <ol className="order-first flex w-full flex-wrap items-center justify-center gap-1.5 sm:order-none sm:w-auto">
        {items.map((it, i) =>
          it === 'gap' ? (
            <li
              key={`gap-${i}`}
              aria-hidden
              className="px-1 text-sm"
              style={{ color: 'var(--color-faint)' }}
            >
              …
            </li>
          ) : (
            <li key={it}>
              <button
                type="button"
                className="chip !min-h-[44px] !min-w-[44px] justify-center tabular-nums"
                data-on={it === page}
                aria-current={it === page ? 'page' : undefined}
                aria-label={`Page ${it}${it === page ? ', current page' : ''}`}
                onClick={() => it !== page && onGo(it)}
              >
                {it}
              </button>
            </li>
          ),
        )}
      </ol>

      <button
        type="button"
        className="btn btn-ghost !min-h-[44px] !py-2.5 !text-[0.8125rem]"
        onClick={() => onGo(page + 1)}
        disabled={page === pageCount}
        style={page === pageCount ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
      >
        Next <Chevron />
      </button>
    </nav>
  );
}

function Chevron() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden
    >
      <path d="M4 2.5 7.5 6 4 9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      style={{ animation: 'ally-spin .8s linear infinite' }}
    >
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeOpacity=".3" strokeWidth="2" />
      <path d="M14.5 8A6.5 6.5 0 0 0 8 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}


/**
 * One line of feedback after a bookmark, pinned above the mobile bottom nav.
 * It clears itself: nobody wants to dismiss a confirmation.
 */
function SaveToast({
  notice,
  onDismiss,
}: {
  notice: SaveNotice;
  onDismiss: () => void;
}) {
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(onDismiss, notice.tone === 'error' ? 6000 : 3200);
    return () => clearTimeout(t);
  }, [notice, onDismiss]);

  if (!notice) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-40 flex justify-center px-5 md:[--toast-lift:1.5rem]"
      style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + var(--toast-lift, 5.5rem))' }}
      role="status"
      aria-live="polite"
    >
      <div
        className="card-float pointer-events-auto flex max-w-[min(24rem,100%)] items-center gap-2 rounded-full px-4 py-2.5 text-[0.8125rem] font-semibold"
        style={{
          background: notice.tone === 'error' ? '#fbecef' : 'var(--color-surface)',
          color: notice.tone === 'error' ? '#a3384f' : 'var(--color-ink-2)',
        }}
      >
        <span className="wrap-anywhere">{notice.text}</span>
        {notice.action ? (
          <Link
            href={notice.action.href}
            className="flex-none whitespace-nowrap underline underline-offset-2"
            style={{ color: 'var(--color-accent-deep)' }}
          >
            {notice.action.label}
          </Link>
        ) : null}
        <button
          type="button"
          onClick={onDismiss}
          className="ml-1 flex-none text-xs underline underline-offset-2"
          style={{ color: 'var(--color-muted)' }}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
