'use client';

import { useState } from 'react';
import type { DeepCourseQuestion } from '@/lib/deep-course-types';

const LETTERS = ['A', 'B', 'C', 'D', 'E'];

export type QuickCheckResult = { score: number; total: number; at: string };

export function quickCheckKey(slug: string) {
  return `vrsfd:module-quiz:${slug}`;
}

export function readQuickChecks(slug: string): Record<number, QuickCheckResult> {
  try {
    const raw = window.localStorage.getItem(quickCheckKey(slug));
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? (parsed as Record<number, QuickCheckResult>) : {};
  } catch {
    return {};
  }
}

/**
 * The 2–3 question check at the end of every module. Answers get instant
 * right/wrong feedback with an explanation, the result is tracked per module,
 * and a perfect score offers to mark the module done — the quiz is the proof.
 */
export default function ModuleQuickCheck({
  slug,
  moduleN,
  questions,
  done,
  onPass,
  onRecorded,
}: {
  slug: string;
  moduleN: number;
  questions: DeepCourseQuestion[];
  done: boolean;
  onPass: () => void;
  onRecorded?: () => void;
}) {
  const [picked, setPicked] = useState<Record<number, number>>({});
  const [saved, setSaved] = useState<QuickCheckResult | null>(null);

  const answered = Object.keys(picked).length;
  const complete = answered === questions.length;
  const score = questions.reduce((n, q, i) => (picked[i] === q.answer ? n + 1 : n), 0);
  const perfect = complete && score === questions.length;

  const record = (next: Record<number, number>) => {
    if (Object.keys(next).length !== questions.length) return;
    const result: QuickCheckResult = {
      score: questions.reduce((n, q, i) => (next[i] === q.answer ? n + 1 : n), 0),
      total: questions.length,
      at: new Date().toISOString(),
    };
    setSaved(result);
    try {
      const all = readQuickChecks(slug);
      all[moduleN] = result;
      window.localStorage.setItem(quickCheckKey(slug), JSON.stringify(all));
    } catch {
      /* tracking is a nicety */
    }
    onRecorded?.();
  };

  const choose = (qi: number, oi: number) => {
    if (picked[qi] !== undefined) return; // one shot per question, like real work
    const next = { ...picked, [qi]: oi };
    setPicked(next);
    record(next);
  };

  return (
    <div className="mt-6 rounded-2xl border border-line bg-paper-2/60 p-4 sm:p-5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-display text-[0.9375rem] font-semibold text-ink">
          Quick check <span className="font-normal text-muted">· {questions.length} questions</span>
        </p>
        {complete ? (
          <p className="text-[0.8125rem] font-semibold tabular-nums" style={{ color: perfect ? 'var(--color-accent-deep)' : 'var(--color-muted)' }}>
            {score}/{questions.length}
          </p>
        ) : null}
      </div>

      <ol className="mt-3 space-y-4">
        {questions.map((q, qi) => {
          const choice = picked[qi];
          const answeredThis = choice !== undefined;
          return (
            <li key={qi}>
              <p className="text-[0.875rem] font-semibold leading-snug text-ink">{q.q}</p>
              <div className="mt-2 space-y-1.5" role="radiogroup" aria-label={q.q}>
                {q.options.map((opt, oi) => {
                  const isAnswer = answeredThis && oi === q.answer;
                  const isBadPick = answeredThis && choice === oi && oi !== q.answer;
                  return (
                    <button
                      key={oi}
                      type="button"
                      disabled={answeredThis}
                      onClick={() => choose(qi, oi)}
                      className={`flex w-full items-start gap-2.5 rounded-xl border px-3 py-2.5 text-left text-[0.875rem] leading-relaxed transition-colors ${
                        isAnswer
                          ? 'border-teal-pale bg-teal-wash text-ink'
                          : isBadPick
                            ? 'border-clay-bright/50 bg-clay-wash text-ink'
                            : answeredThis
                              ? 'border-line-2 bg-card text-muted'
                              : 'border-line-2 bg-card text-ink-2 hover:bg-paper-2'
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`mt-px inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[0.6875rem] font-bold ${
                          isAnswer
                            ? 'border-transparent bg-teal text-white'
                            : isBadPick
                              ? 'border-transparent bg-clay text-white'
                              : 'border-line-3 text-muted'
                        }`}
                      >
                        {LETTERS[oi]}
                      </span>
                      {opt}
                    </button>
                  );
                })}
              </div>
              {answeredThis ? (
                <p className="mt-2 rounded-xl bg-card px-3 py-2 text-[0.8125rem] leading-relaxed text-ink-2">
                  <span className="font-semibold text-ink">{choice === q.answer ? 'Correct. ' : 'Not quite. '}</span>
                  {q.explain}
                </p>
              ) : null}
            </li>
          );
        })}
      </ol>

      {complete && saved ? (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {perfect && !done ? (
            <button type="button" onClick={onPass} className="btn btn-primary !px-5 !py-2.5 !text-[0.8125rem]">
              Perfect score — mark module done
            </button>
          ) : (
            <p className="text-[0.8125rem] leading-relaxed text-muted">
              {perfect
                ? 'Perfect score. This module is yours.'
                : 'Worth a second look at the ones you missed — then reopen the module tomorrow and see if it stuck.'}
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
