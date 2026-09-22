import Link from 'next/link';
import { deepCourseFlags } from '@/lib/deep-courses';
import { COURSES_INDEX, type DeepCourseCard } from '@/lib/deep-courses/index-meta';

function Tick() {
  return (
    <span className="mt-1 shrink-0 text-teal">
      <svg
        aria-hidden="true"
        viewBox="0 0 12 12"
        className="h-2.5 w-2.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M2 6.3 4.7 9 10 3.2" />
      </svg>
    </span>
  );
}

function Pill({ children, tone }: { children: React.ReactNode; tone: 'leaf' | 'clay' | 'teal' }) {
  const tones = {
    leaf: 'bg-leaf-wash text-leaf',
    clay: 'bg-clay-wash text-clay',
    teal: 'bg-accent-soft text-accent-deep',
  } as const;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-transparent px-2.5 py-1 text-[0.6875rem] font-semibold tracking-wide ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

function LockIcon() {
  return (
    <svg width="11" height="12" viewBox="0 0 12 13" fill="none" aria-hidden className="flex-none">
      <rect x="1.6" y="5.4" width="8.8" height="6.4" rx="1.8" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3.9 5.4V3.9a2.1 2.1 0 0 1 4.2 0v1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function Card({ c, paid }: { c: DeepCourseCard; paid: boolean }) {
  const flags = deepCourseFlags(c.slug);
  const premium = Boolean(flags?.premium);
  const locked = premium && !paid;

  return (
    <li>
      <div className="card relative flex h-full flex-col p-6 transition-colors hover:border-teal-pale md:p-7">
        <div className="flex items-center justify-between gap-3">
          <p className="eyebrow">{c.kicker}</p>
          {premium ? (
            <Pill tone="clay">
              {locked ? <LockIcon /> : null}
              {paid ? 'Pro · unlocked' : 'Pro'}
            </Pill>
          ) : (
            <Pill tone="leaf">{c.badge}</Pill>
          )}
        </div>

        <h2 className="mt-3 font-display text-[1.375rem] font-semibold leading-snug text-ink">
          <Link className="after:absolute after:inset-0 hover:text-teal-deep" href={`/courses/${c.slug}`}>
            {c.title}
          </Link>
        </h2>

        <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-ink-2">{c.blurb}</p>

        <ul className="mt-5 space-y-1.5">
          {c.bullets.map((b) => (
            <li key={b} className="flex gap-2.5 text-[0.8125rem] text-muted">
              <Tick />
              {b}
            </li>
          ))}
        </ul>

        <div className="relative mt-auto flex items-center justify-between gap-3 pt-5">
          <p className="text-[0.8125rem] text-muted">{c.duration}</p>
          <span className="text-sm font-semibold text-teal-deep">
            {locked ? `Read ${flags?.previewCount ?? 3} free →` : 'Start'}
          </span>
        </div>
      </div>
    </li>
  );
}

export default function DeepCourseIndex({ paid }: { paid: boolean }) {
  const cards = COURSES_INDEX.cards;
  const freeCount = cards.filter((c) => !deepCourseFlags(c.slug)?.premium).length;
  const proCount = cards.length - freeCount;

  return (
    <>
      <section className="px-5 pt-28 md:px-8 md:pt-40">
        <div className="mx-auto w-full max-w-6xl">
          <div className="max-w-3xl">
            <p className="eyebrow">Courses</p>
            <h1 className="mt-3 font-display text-[2.5rem] font-semibold leading-[1.05] tracking-tight text-ink sm:text-[3.25rem]">
              {COURSES_INDEX.heading}
            </h1>
            <p className="mt-4 max-w-2xl text-[1.0625rem] leading-relaxed text-ink-2">{COURSES_INDEX.lede}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Pill tone="teal">{cards.length} written courses</Pill>
              <Pill tone="leaf">{freeCount} free for everyone</Pill>
              <Pill tone="clay">{proCount} unlock with Pro</Pill>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        <p className="max-w-2xl text-[0.9375rem] leading-relaxed text-ink-2">{COURSES_INDEX.intro}</p>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-card p-6 shadow-tile sm:p-7">
          <div className="max-w-xl">
            <p className="font-display text-lg font-semibold text-ink">New to VA work? Start here.</p>
            <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-ink-2">
              The Complete VA Starter is free and takes you from zero to your first paid client — most people begin
              with it before picking a career skill.
            </p>
          </div>
          <Link className="btn btn-primary !px-6 !py-3 !text-sm" href="/courses/complete-va-starter">
            Start the free course
          </Link>
        </div>

        <ul className="mt-10 grid gap-5 lg:grid-cols-3">
          {cards.map((c) => (
            <Card key={c.slug} c={c} paid={paid} />
          ))}
        </ul>

        {!paid ? (
          <div className="mt-10 rounded-2xl border border-teal-pale bg-teal-wash/60 p-6 sm:p-8">
            <p className="font-display text-lg font-semibold text-ink">
              {proCount} of the {cards.length} courses unlock with Pro
            </p>
            <p className="mt-1.5 max-w-2xl text-[0.9375rem] leading-relaxed text-ink-2">
              You can read the first three modules of each one for free, so you know exactly what you are getting. Pro
              is ₱199 for 30 days (no auto-renew) and opens every module, every worked example, the rate tables and all
              the copy-paste templates.
            </p>
            <div className="mt-4 flex flex-wrap gap-2.5">
              <Link className="btn btn-primary !px-6 !py-3 !text-sm" href="/pricing">
                See what Pro includes
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
