'use client';

import type { CourseCompletionsResponse } from '@/lib/admin/data';
import { useAdminResource } from './useAdminResource';
import { Empty, ErrorState, Note, Panel, Skeleton, Stat, StatStrip, num, when } from './ui';

function Stars({ n }: { n: number }) {
  return (
    <span aria-label={`${n} out of 5`} title={`${n} / 5`} style={{ letterSpacing: 2 }}>
      {'★'.repeat(Math.round(n))}
      <span style={{ opacity: 0.25 }}>{'★'.repeat(5 - Math.round(n))}</span>
    </span>
  );
}

/**
 * Who is actually finishing courses. Each row comes from the "How did it go?"
 * card, which only appears once every module of a course is marked done —
 * so a rating here is a completion, with the stars as the bonus signal.
 */
export default function CourseCompletionsPanel() {
  const { data, error, loading, refreshing, reload } =
    useAdminResource<CourseCompletionsResponse>('/api/admin/course-ratings');

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <button type="button" className="ad-btn ml-auto" onClick={reload} disabled={refreshing}>
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {error ? <ErrorState message={error} onRetry={reload} /> : null}

      {loading && !data ? (
        <div className="ad-panel p-5">
          <Skeleton rows={4} />
        </div>
      ) : null}

      {data && !data.ready ? (
        <Note tone="warn">
          <p className="font-semibold" style={{ color: 'var(--ad-warn)' }}>
            Completions cannot be recorded yet
          </p>
          <p className="mt-1">
            The <code className="ad-mono">course_feedback</code> table does not exist. Run{' '}
            <code className="ad-mono">supabase/migrations/20261005020000_course_feedback.sql</code> once and
            every finished course lands here.
          </p>
        </Note>
      ) : null}

      {data?.ready ? (
        <>
          <StatStrip cols={3}>
            <Stat label="Courses finished" value={num(data.totals.completions)} />
            <Stat
              label="Average rating"
              value={data.totals.avgRating === null ? '—' : `${data.totals.avgRating} / 5`}
            />
            <Stat label="Courses with finishers" value={num(data.courses.length)} />
          </StatStrip>

          <Panel
            title="By course"
            hint="A rating only appears after every module is done, so this is the completion board."
            flush
          >
            {data.courses.length ? (
              <div className="ad-scroll">
                <table className="ad-table ad-stack">
                  <thead>
                    <tr>
                      <th>Course</th>
                      <th className="ad-right">Finished</th>
                      <th className="ad-right">Avg rating</th>
                      <th className="ad-right">Last finish</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.courses.map((course) => (
                      <tr key={course.slug}>
                        <td data-label="Course">
                          <span className="block font-semibold" style={{ color: 'var(--color-ink)' }}>
                            {course.title}
                          </span>
                          <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                            {course.slug}
                          </span>
                        </td>
                        <td data-label="Finished" className="ad-right">
                          {num(course.completions)}
                        </td>
                        <td data-label="Avg rating" className="ad-right">
                          <Stars n={course.avgRating} /> {course.avgRating}
                        </td>
                        <td data-label="Last finish" className="ad-right">
                          {when(course.lastAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty>Nobody has finished a course yet. The first completion shows up here on its own.</Empty>
            )}
          </Panel>

          <Panel title="Recent finishes" hint="Newest first, up to the last 25." flush>
            {data.recent.length ? (
              <div className="ad-scroll">
                <table className="ad-table ad-stack">
                  <thead>
                    <tr>
                      <th>Course</th>
                      <th className="ad-right">Rating</th>
                      <th className="ad-right">Account</th>
                      <th className="ad-right">When</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recent.map((row, i) => (
                      <tr key={`${row.slug}-${row.at}-${i}`}>
                        <td data-label="Course">{row.title}</td>
                        <td data-label="Rating" className="ad-right">
                          <Stars n={row.rating} />
                        </td>
                        <td data-label="Account" className="ad-right">
                          {row.signedIn ? 'Signed in' : 'Guest'}
                        </td>
                        <td data-label="When" className="ad-right">
                          {when(row.at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty>No finishes yet.</Empty>
            )}
          </Panel>
        </>
      ) : null}
    </div>
  );
}
