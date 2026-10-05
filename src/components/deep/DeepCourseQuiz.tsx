'use client';

import { useEffect, useMemo, useState } from 'react';
import type { DeepCourseQuestion } from '@/lib/deep-course-types';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

function bestKey(slug: string) {
  return `vrsfd:final-quiz:${slug}`;
}

export default function DeepCourseQuiz({ slug, questions }: { slug: string; questions: DeepCourseQuestion[] }) {
  const [picked, setPicked] = useState<Record<number, number>>({});
  const [checked, setChecked] = useState(false);
  const [best, setBest] = useState<number | null>(null);

  const answered = Object.keys(picked).length;
  const score = useMemo(
    () => questions.reduce((n, q, i) => (picked[i] === q.answer ? n + 1 : n), 0),
    [picked, questions],
  );

  useEffect(() => {
    try {
      const saved = Number(window.localStorage.getItem(bestKey(slug)) ?? NaN);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrating saved score
      if (Number.isFinite(saved)) setBest(saved);
    } catch {
      /* fine */
    }
  }, [slug]);

  function choose(qi: number, oi: number) {
    if (checked) return;
    setPicked((prev) => ({ ...prev, [qi]: oi }));
  }

  function check() {
    setChecked(true);
    const final = questions.reduce((n, q, i) => (picked[i] === q.answer ? n + 1 : n), 0);
    if (best === null || final > best) {
      setBest(final);
      try {
        window.localStorage.setItem(bestKey(slug), String(final));
      } catch {
        /* fine */
      }
    }
  }

  return (
    <section id="quiz" className="scroll-mt-32">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="font-display text-[1.75rem] font-semibold text-ink">Would you get this right on the job?</h2>
        <p className="text-[0.8125rem] tabular-nums text-muted">
          {checked ? `${score} of ${questions.length} correct` : `${answered} of ${questions.length} answered`}
        </p>
      </div>
      <p className="mt-2 max-w-xl text-[0.9375rem] leading-relaxed text-ink-2">
        Situations that come up in real work. Pick an answer for each, then check.
        {best !== null ? ` Your best so far: ${best} of ${questions.length}.` : ' Your best score is saved in this browser.'}
      </p>

      <ol className="mt-8 space-y-5">
        {questions.map((q, qi) => {
          const choice = picked[qi];
          const right = checked && choice === q.answer;
          const wrong = checked && choice !== undefined && choice !== q.answer;
          return (
            <li
              key={qi}
              className={`rounded-2xl border bg-card p-5 shadow-tile transition-colors sm:p-6 ${
                right ? 'border-teal-pale' : wrong ? 'border-clay-bright/50' : 'border-line'
              }`}
            >
              <p className="flex gap-3 font-display text-[1.0625rem] font-semibold leading-snug text-ink">
                <span className="tabular-nums text-teal-deep">{String(qi + 1).padStart(2, '0')}</span>
                {q.q}
              </p>

              <div className="mt-4 space-y-2" role="radiogroup" aria-label={q.q}>
                {q.options.map((opt, oi) => {
                  const selected = choice === oi;
                  const isAnswer = checked && oi === q.answer;
                  const isBadPick = checked && selected && oi !== q.answer;
                  return (
                    <label
                      key={oi}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-[0.9375rem] leading-relaxed transition-colors ${
                        isAnswer
                          ? 'border-teal-pale bg-teal-wash text-ink'
                          : isBadPick
                            ? 'border-clay-bright/50 bg-clay-wash text-ink'
                            : selected
                              ? 'border-teal-pale bg-teal-wash/50 text-ink'
                              : 'border-line-2 bg-card text-ink-2 hover:bg-paper-2'
                      }`}
                    >
                      <input
                        type="radio"
                        className="sr-only"
                        name={`q-${qi}`}
                        checked={selected}
                        onChange={() => choose(qi, oi)}
                        disabled={checked}
                      />
                      <span
                        aria-hidden="true"
                        className={`mt-px inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[0.6875rem] font-bold ${
                          isAnswer
                            ? 'border-transparent bg-teal text-white'
                            : isBadPick
                              ? 'border-transparent bg-clay text-white'
                              : selected
                                ? 'border-teal-deep text-teal-deep'
                                : 'border-line-3 text-muted'
                        }`}
                      >
                        {LETTERS[oi]}
                      </span>
                      {opt}
                    </label>
                  );
                })}
              </div>

              {checked ? (
                <p className="mt-3.5 rounded-xl border border-line-2 bg-paper-2/70 px-4 py-3 text-[0.875rem] leading-relaxed text-ink-2">
                  <span className="font-semibold text-ink">{right ? 'Correct. ' : 'Not quite. '}</span>
                  {q.explain}
                </p>
              ) : null}
            </li>
          );
        })}
      </ol>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {checked ? (
          <button
            type="button"
            className="btn btn-ghost !px-6 !py-3 !text-sm"
            onClick={() => {
              setChecked(false);
              setPicked({});
            }}
          >
            Try again
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-primary !px-6 !py-3 !text-sm disabled:cursor-not-allowed disabled:opacity-50"
            disabled={answered === 0}
            onClick={check}
          >
            Check my answers
          </button>
        )}
        {!checked && answered > 0 && answered < questions.length ? (
          <p className="text-[0.8125rem] text-muted">
            {questions.length - answered} still unanswered — you can check anyway.
          </p>
        ) : null}
      </div>
    </section>
  );
}
