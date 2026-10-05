'use client';

import { useEffect, useState } from 'react';

/**
 * "How did it go?" — shown once every module of a course is marked done.
 * One tap, saved locally so it never asks twice, and mirrored to the server
 * (best effort) so real ratings exist somewhere the team can read them.
 */

function key(slug: string) {
  return `vrsfd:course-rating:${slug}`;
}

function Star({ filled }: { filled: boolean }) {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden
      fill={filled ? 'var(--color-accent)' : 'none'}
      stroke={filled ? 'var(--color-accent)' : 'var(--color-line-3)'}
      strokeWidth="1.6" strokeLinejoin="round">
      <path d="M12 2.8l2.9 5.9 6.5.95-4.7 4.6 1.1 6.45L12 17.65 6.2 20.7l1.1-6.45L2.6 9.65l6.5-.95L12 2.8z" />
    </svg>
  );
}

export default function CourseRating({ slug, courseTitle }: { slug: string; courseTitle: string }) {
  const [rated, setRated] = useState<number | null>(null);
  const [hover, setHover] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrating saved rating once
    setHydrated(true);
    try {
      const saved = Number(window.localStorage.getItem(key(slug)) || 0);
      if (saved >= 1 && saved <= 5) setRated(saved);
    } catch {
      /* fine */
    }
  }, [slug]);

  const rate = (n: number) => {
    setRated(n);
    try {
      window.localStorage.setItem(key(slug), String(n));
    } catch {
      /* fine */
    }
    void fetch('/api/course-feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, rating: n }),
    }).catch(() => undefined);
  };

  if (!hydrated) return null;

  return (
    <div className="mt-6 rounded-2xl border border-teal-pale bg-teal-wash/60 p-5 sm:p-6">
      {rated ? (
        <>
          <p className="font-display text-lg font-semibold text-ink">Salamat! 🎉</p>
          <p className="mt-1 text-[0.9375rem] leading-relaxed text-ink-2">
            {rated >= 4
              ? 'Glad it landed. The exercise outputs you made along the way are portfolio pieces — use them in your next application.'
              : 'Noted — that rating goes straight to the team and shapes what gets reworked first.'}
          </p>
          <div className="mt-3 flex gap-1" aria-label={`You rated this course ${rated} out of 5`}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Star key={n} filled={n <= rated} />
            ))}
          </div>
        </>
      ) : (
        <>
          <p className="font-display text-lg font-semibold text-ink">
            Every module done. How did it go<span className="text-teal-deep">?</span>
          </p>
          <p className="mt-1 text-[0.9375rem] leading-relaxed text-ink-2">
            You finished {courseTitle}. One tap — it genuinely shapes what we improve next.
          </p>
          <div className="mt-3 flex gap-1" role="radiogroup" aria-label="Rate this course from 1 to 5 stars">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={false}
                aria-label={`${n} star${n === 1 ? '' : 's'}`}
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(0)}
                onClick={() => rate(n)}
                className="rounded-lg p-1 transition-transform hover:scale-110"
              >
                <Star filled={n <= hover} />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
