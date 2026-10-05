import { COURSE_TOOLS } from '@/lib/course-tools';

const COST_STYLE: Record<string, { bg: string; color: string }> = {
  Free: { bg: 'var(--color-accent-soft)', color: 'var(--color-accent-deep)' },
  'Free tier': { bg: 'var(--color-paper-2)', color: 'var(--color-ink-2)' },
  'Paid (client provides)': { bg: '#f7e8dd', color: '#8a4a28' },
};

/**
 * The working toolbox for a course: what to install or bookmark before
 * module 1. Server-rendered — pure data, no interactivity needed.
 */
export default function CourseToolbox({ slug }: { slug: string }) {
  const tools = COURSE_TOOLS[slug];
  if (!tools?.length) return null;

  return (
    <div className="mt-8 overflow-hidden rounded-2xl border border-line bg-card shadow-tile">
      <div className="border-b border-line px-5 py-4 sm:px-6">
        <h3 className="font-display text-[1.0625rem] font-semibold text-ink">The toolbox</h3>
        <p className="mt-1 text-[0.875rem] leading-relaxed text-muted">
          Set these up before module 1 — the exercises assume them. Anything marked{' '}
          <span className="font-semibold">paid</span> is normally the client&rsquo;s seat, not yours to buy.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[0.875rem]">
          <thead>
            <tr className="border-b border-line-2 text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-muted">
              <th className="px-5 py-2.5 sm:px-6">Tool</th>
              <th className="px-4 py-2.5">What you&rsquo;ll use it for</th>
              <th className="px-5 py-2.5 text-right sm:px-6">Cost</th>
            </tr>
          </thead>
          <tbody>
            {tools.map((tool) => {
              const style = COST_STYLE[tool.cost] ?? COST_STYLE['Free tier'];
              return (
                <tr key={tool.name} className="border-b border-line-2 last:border-b-0 align-top">
                  <td className="whitespace-nowrap px-5 py-3 font-semibold text-ink sm:px-6">{tool.name}</td>
                  <td className="px-4 py-3 leading-relaxed text-ink-2">{tool.use}</td>
                  <td className="whitespace-nowrap px-5 py-3 text-right sm:px-6">
                    <span
                      className="inline-flex rounded-full px-2.5 py-1 text-[0.6875rem] font-semibold"
                      style={{ background: style.bg, color: style.color }}
                    >
                      {tool.cost}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
