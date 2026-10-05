'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DeepCourseModule } from '@/lib/deep-course-types';
import ModuleQuickCheck, { readQuickChecks, type QuickCheckResult } from '@/components/deep/ModuleQuickCheck';
import CourseRating from '@/components/deep/CourseRating';

const WORD = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];

type Props = {
  slug: string;
  /** For the completion card. */
  courseTitle: string;
  /** Only the modules this reader may see — locked bodies never reach the client. */
  modules: DeepCourseModule[];
  /** Full module count for the course, for progress and upsell copy. */
  totalCount: number;
  /** true when the track is paid and the reader has not unlocked it */
  locked: boolean;
  previewCount: number;
  /** true when the reader is signed in on a paid plan */
  paid: boolean;
  priceLabel: string;
  premiumTrackCount: number;
};

function storageKey(slug: string) {
  return `vrsfd:course-progress:${slug}`;
}

function checksKey(slug: string) {
  return `vrsfd:course-checks:${slug}`;
}

export default function DeepCourseModules({
  slug,
  courseTitle,
  modules,
  totalCount,
  locked,
  previewCount,
  paid,
  priceLabel,
  premiumTrackCount,
}: Props) {
  // Defence in depth: the server already slices, but never show past the preview.
  const visible = useMemo(
    () => (locked ? modules.slice(0, previewCount) : modules),
    [locked, modules, previewCount],
  );
  const [done, setDone] = useState<number[]>([]);
  const [checks, setChecks] = useState<Record<number, QuickCheckResult>>({});
  const [hydrated, setHydrated] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrating saved progress once per slug
    setHydrated(true);
    try {
      const raw = window.localStorage.getItem(storageKey(slug));
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) setDone(parsed.filter((n): n is number => typeof n === 'number'));
      }
      setChecks(readQuickChecks(slug));
    } catch {
      /* progress is a nicety, never a blocker */
    }
  }, [slug]);

  // "Try it now" checkboxes live inside pre-rendered HTML, so they are plain
  // uncontrolled inputs: restored once after hydration, persisted with one
  // delegated listener. Key per box is "moduleN:index".
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    let ticked = new Set<string>();
    try {
      const raw = window.localStorage.getItem(checksKey(slug));
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) ticked = new Set(parsed.filter((v): v is string => typeof v === 'string'));
    } catch {
      /* fine */
    }

    for (const holder of root.querySelectorAll<HTMLElement>('[data-module-n]')) {
      const n = holder.dataset.moduleN;
      holder.querySelectorAll<HTMLInputElement>('input[data-check]').forEach((box, i) => {
        box.checked = ticked.has(`${n}:${i}`);
      });
    }

    const onChange = (event: Event) => {
      const box = event.target as HTMLInputElement | null;
      if (!box?.matches('input[data-check]')) return;
      const holder = box.closest<HTMLElement>('[data-module-n]');
      if (!holder) return;
      const boxes = Array.from(holder.querySelectorAll<HTMLInputElement>('input[data-check]'));
      const key = `${holder.dataset.moduleN}:${boxes.indexOf(box)}`;
      if (box.checked) ticked.add(key);
      else ticked.delete(key);
      try {
        window.localStorage.setItem(checksKey(slug), JSON.stringify([...ticked]));
      } catch {
        /* fine */
      }
    };

    root.addEventListener('change', onChange);
    return () => root.removeEventListener('change', onChange);
  }, [slug]);

  const persist = useCallback(
    (next: number[]) => {
      setDone(next);
      try {
        window.localStorage.setItem(storageKey(slug), JSON.stringify(next));
      } catch {
        /* private mode, quota, whatever — carry on */
      }
    },
    [slug],
  );

  const toggle = useCallback(
    (n: number) => {
      persist(done.includes(n) ? done.filter((x) => x !== n) : [...done, n]);
    },
    [done, persist],
  );

  const completed = done.filter((n) => n >= 1 && n <= totalCount).length;
  const pct = totalCount ? Math.round((completed / totalCount) * 100) : 0;
  const remaining = totalCount - visible.length;

  // The module bodies are pre-rendered HTML, so the copy buttons inside them are
  // wired with one delegated listener. That survives any re-render of the markup.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    async function onClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      const btn = target?.closest<HTMLButtonElement>('button[data-copy-template]');
      if (!btn) return;
      const holder = btn.closest('[data-template-block]');
      if (!holder) return;

      const bodyEl = holder.querySelector('[data-template-body]') ?? holder.querySelector('pre');
      let text = bodyEl?.textContent?.trim() ?? '';
      if (!text) {
        // Some templates are tables. Tab separated pastes straight into Sheets.
        const table = holder.querySelector('table');
        if (table) {
          text = Array.from(table.querySelectorAll('tr'))
            .map((tr) =>
              Array.from(tr.querySelectorAll('th, td'))
                .map((cell) => (cell.textContent ?? '').trim().replace(/\s+/g, ' '))
                .join('\t'),
            )
            .join('\n');
        }
      }
      if (!text) return;

      const label = btn.querySelector('span');
      const restore = btn.firstChild;
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        return; // clipboard blocked, the text is still on screen to select
      }
      if (restore && restore.nodeType === Node.TEXT_NODE) {
        restore.textContent = 'Copied';
        window.setTimeout(() => {
          restore.textContent = 'Copy';
        }, 1600);
      }
      if (label) label.textContent = ' template copied to clipboard';
    }

    root.addEventListener('click', onClick);
    return () => root.removeEventListener('click', onClick);
  }, []);

  const heading = `The ${WORD[totalCount] ?? totalCount} modules`;

  return (
    <section id="modules" className="scroll-mt-32" ref={rootRef}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="font-display text-[1.75rem] font-semibold text-ink">{heading}</h2>
        <p className="text-[0.8125rem] tabular-nums text-muted">
          {hydrated ? completed : 0} of {totalCount} done
        </p>
      </div>

      <div
        className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-paper-3"
        role="progressbar"
        aria-valuenow={hydrated ? pct : 0}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Course progress"
      >
        <div
          className="h-full rounded-full bg-teal transition-[width] duration-500 ease-out"
          style={{ width: `${hydrated ? pct : 0}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-muted-2">Progress is saved in this browser only. Nothing is sent anywhere.</p>

      <ol className="mt-7 space-y-3">
        {visible.map((m) => {
          const isDone = hydrated && done.includes(m.n);
          return (
            <li key={m.n}>
              <details
                className={`group overflow-hidden rounded-2xl border bg-card shadow-tile transition-colors ${
                  isDone ? 'border-teal-pale' : 'border-line'
                }`}
              >
                <summary className="flex cursor-pointer list-none items-start gap-4 px-5 py-4 marker:hidden hover:bg-paper-2/70 [&::-webkit-details-marker]:hidden">
                  <span className="mt-0.5 shrink-0">
                    <span className="inline-flex h-5 w-5 items-center justify-center">
                      {isDone ? (
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 12 12"
                          className="h-3.5 w-3.5 text-teal"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.25"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M2 6.3 4.7 9 10 3.2" />
                        </svg>
                      ) : (
                        <span className="font-display text-sm font-extrabold tracking-[0.1em] text-accent">
                          {String(m.n).padStart(2, '0')}
                        </span>
                      )}
                    </span>
                  </span>

                  <span className="min-w-0 flex-1">
                    <h3 className="font-display text-[1.0625rem] font-semibold leading-snug text-ink">{m.title}</h3>
                    {m.outcome ? (
                      <span className="mt-1 block text-[0.875rem] leading-relaxed text-muted">{m.outcome}</span>
                    ) : null}
                    {m.badges.length || (hydrated && checks[m.n]) ? (
                      <span className="mt-2 flex flex-wrap gap-1.5">
                        {m.badges.map((b) => (
                          <span
                            key={b}
                            className="rounded-full border border-line-2 bg-paper-2 px-2 py-[0.15rem] text-[0.6875rem] font-semibold text-muted"
                          >
                            {b}
                          </span>
                        ))}
                        {hydrated && checks[m.n] ? (
                          <span
                            className={`rounded-full border border-transparent px-2 py-[0.15rem] text-[0.6875rem] font-semibold tabular-nums ${
                              checks[m.n].score === checks[m.n].total
                                ? 'bg-teal-wash text-teal-deep'
                                : 'bg-paper-2 text-muted'
                            }`}
                          >
                            Quick check {checks[m.n].score}/{checks[m.n].total}
                          </span>
                        ) : null}
                      </span>
                    ) : null}
                  </span>

                  <span className="ml-auto flex shrink-0 items-center gap-3 pt-0.5">
                    {m.minutes ? (
                      <span className="hidden text-[0.75rem] tabular-nums text-muted-2 sm:inline">{m.minutes} min</span>
                    ) : null}
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 12 12"
                      className="h-3 w-3 text-muted transition-transform duration-200 group-open:rotate-180"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M2.5 4.25 6 7.75l3.5-3.5" />
                    </svg>
                  </span>
                </summary>

                <div className="border-t border-line px-5 py-5 sm:px-6" data-module-n={m.n}>
                  {/* Authored course body, generated at build time. Not user input. */}
                  <div className="space-y-5" dangerouslySetInnerHTML={{ __html: m.html }} />
                  {m.quiz?.length ? (
                    <ModuleQuickCheck
                      slug={slug}
                      moduleN={m.n}
                      questions={m.quiz}
                      done={isDone}
                      onRecorded={() => setChecks(readQuickChecks(slug))}
                      onPass={() => {
                        if (!done.includes(m.n)) persist([...done, m.n]);
                      }}
                    />
                  ) : null}
                  <button
                    type="button"
                    onClick={() => toggle(m.n)}
                    aria-pressed={isDone}
                    className={`mt-5 inline-flex h-9 items-center gap-2 rounded-full border px-4 text-[0.8125rem] font-semibold transition-colors ${
                      isDone
                        ? 'border-transparent bg-teal-wash text-teal-deep hover:bg-teal-pale'
                        : 'border-line-input bg-card text-ink hover:bg-paper-2'
                    }`}
                  >
                    {isDone ? 'Done' : 'Mark module done'}
                  </button>
                </div>
              </details>
            </li>
          );
        })}
      </ol>

      {hydrated && !locked && totalCount > 0 && completed === totalCount ? (
        <CourseRating slug={slug} courseTitle={courseTitle} />
      ) : null}

      {locked ? (
        <div className="mt-5 rounded-2xl border border-teal-pale bg-teal-wash/60 p-5 sm:p-6">
          <p className="font-display text-lg font-semibold text-ink">The rest of this course unlocks with Pro</p>
          <p className="mt-1.5 max-w-xl text-[0.9375rem] leading-relaxed text-ink-2">
            {remaining} more {remaining === 1 ? 'module' : 'modules'}, the worked examples, the rate tables and every
            copy-paste template. Pro is {priceLabel} and covers all {premiumTrackCount} premium courses.
          </p>
          <div className="mt-4 flex flex-wrap gap-2.5">
            <Link className="btn btn-primary !px-6 !py-3 !text-sm" href={paid ? '/settings' : '/pricing'}>
              Unlock with Pro
            </Link>
            <Link className="btn btn-ghost !px-6 !py-3 !text-sm" href="/courses">
              Browse the free courses
            </Link>
          </div>
        </div>
      ) : null}
    </section>
  );
}
