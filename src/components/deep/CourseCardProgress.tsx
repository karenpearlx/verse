'use client';

import { useEffect, useState } from 'react';
import { MODULE_COUNTS } from '@/lib/deep-courses/module-counts';

/**
 * The thin "3 of 8 modules done" strip on a /courses card. Reads the same
 * localStorage the course page writes, renders nothing until there is real
 * progress — an untouched card stays clean.
 */
export default function CourseCardProgress({ slug }: { slug: string }) {
  const [done, setDone] = useState(0);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(`vrsfd:course-progress:${slug}`);
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrating saved progress
      if (Array.isArray(parsed)) setDone(parsed.filter((n) => typeof n === 'number').length);
    } catch {
      /* fine */
    }
  }, [slug]);

  const total = MODULE_COUNTS[slug] ?? 0;
  if (!done || !total) return null;

  const pct = Math.min(100, Math.round((done / total) * 100));
  const complete = done >= total;

  return (
    <div className="mt-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[0.75rem] font-semibold tabular-nums" style={{ color: complete ? 'var(--color-accent-deep)' : 'var(--color-muted)' }}>
          {complete ? 'Completed 🎉' : `${done} of ${total} modules done`}
        </p>
        <p className="text-[0.75rem] tabular-nums text-muted">{pct}%</p>
      </div>
      <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-paper-3">
        <div className="h-full rounded-full bg-teal transition-[width] duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
