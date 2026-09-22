/**
 * The dashboard itself, with the data already fetched.
 *
 * Kept apart from the route so the layout can be rendered against fixtures —
 * an auth-walled page is otherwise impossible to check in a browser without a
 * real session, and "it compiled" is not the same as "it looks right at 390px".
 */

import Link from 'next/link';
import FollowUps from '@/components/dashboard/FollowUps';
import CourseRail from '@/components/dashboard/CourseRail';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import GradientBg from '@/components/GradientBg';
import PullToRefreshRoute from '@/components/PullToRefreshRoute';
import { completeness, rateLine, type Profile } from '@/lib/profile';
import { displayCompany, formatPostedAt, formatSalary, sourceMeta } from '@/lib/jobs';
import type { App, Status } from '@/lib/followups';
import type { SuggestedJob } from '@/lib/dashboard';

/** The four buckets worth a number on a home screen. Saved and Ghosted live on /tracker. */
const BUCKETS: { status: Status; label: string; bg: string; fg: string }[] = [
  { status: 'Applied', label: 'Applied', bg: '#eef2ff', fg: '#4453b8' },
  { status: 'Interviewing', label: 'Interviewing', bg: '#e6f4f1', fg: '#0a7d6f' },
  { status: 'Offer', label: 'Offer', bg: '#e9f6ec', fg: '#2f7a45' },
  { status: 'Rejected', label: 'Rejected', bg: '#fbecef', fg: '#a83d55' },
];

/** What is still missing, in the order it is worth fixing. */
function gaps(p: Profile): string[] {
  const out: string[] = [];
  if (!p.fullName) out.push('your name');
  if (!p.headline) out.push('a headline');
  if (!p.bio || p.bio.length < 80) out.push('a short bio');
  if (p.niches.length === 0) out.push('your niches');
  if (p.hourlyRate == null && p.monthlyRate == null) out.push('your rate');
  if (p.links.length === 0) out.push('a portfolio link');
  if (!p.location) out.push('where you are');
  if (p.languages.length === 0) out.push('languages');
  return out;
}


export type DashboardViewProps = {
  name: string;
  profile: Profile;
  profileReady: boolean;
  apps: App[];
  appsReady: boolean;
  jobs: SuggestedJob[];
  avatar: string | null;
};

export default function DashboardView({
  name,
  profile,
  profileReady,
  apps,
  appsReady,
  jobs,
  avatar,
}: DashboardViewProps) {
  const percent = completeness(profile);
  const missing = gaps(profile);

  const counts = new Map<Status, number>();
  for (const a of apps) counts.set(a.status, (counts.get(a.status) ?? 0) + 1);

  return (
    <div className="min-h-screen">
      <GradientBg position="left" />
      <Nav />

      <PullToRefreshRoute>
        {/* ---------- greeting ---------- */}
        <section className="px-5 pt-28 md:px-8 md:pt-36">
          <div className="mx-auto flex max-w-6xl items-center gap-4 md:gap-5">
            {avatar ? (
              // Supabase storage / Google CDN, unproxied on purpose — 64px, no layout cost.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatar}
                alt=""
                width={64}
                height={64}
                referrerPolicy="no-referrer"
                className="h-14 w-14 flex-none rounded-full object-cover md:h-16 md:w-16"
                style={{ border: '1px solid var(--color-line-2)' }}
              />
            ) : (
              <span
                aria-hidden
                className="font-display grid h-14 w-14 flex-none place-items-center rounded-full text-lg font-extrabold md:h-16 md:w-16 md:text-xl"
                style={{ background: 'var(--color-accent-soft)', color: 'var(--color-accent-deep)' }}
              >
                {name.slice(0, 2).toUpperCase()}
              </span>
            )}

            <div className="min-w-0">
              <p className="eyebrow">Your desk</p>
              <h1 className="display-lg mt-2 wrap-anywhere">
                Welcome back, {name}
                <span className="dot">.</span>
              </h1>
            </div>
          </div>

          <div className="mx-auto mt-5 max-w-6xl">
            <p className="lede max-w-xl">
              {apps.length === 0
                ? 'Nothing tracked yet. Find one listing worth your afternoon and the rest of this page fills itself in.'
                : `${apps.length} application${apps.length === 1 ? '' : 's'} on the board${
                    profile.headline ? ` · ${profile.headline}` : ''
                  }`}
            </p>
          </div>
        </section>

        {/* ---------- application counts ---------- */}
        <section className="px-5 pt-10 md:px-8 md:pt-12">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="font-display text-xl font-extrabold tracking-tight">Applications</h2>
              <span className="flex flex-wrap items-baseline gap-4">
                <Link
                  href="/analytics"
                  className="tap text-sm underline underline-offset-2"
                  style={{ color: 'var(--color-accent)' }}
                >
                  See insights
                </Link>
                <Link
                  href="/tracker"
                  className="tap text-sm underline underline-offset-2"
                  style={{ color: 'var(--color-accent)' }}
                >
                  Open the tracker
                </Link>
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
              {BUCKETS.map((b) => (
                <Link
                  key={b.status}
                  href="/tracker"
                  className="lift card p-5 transition-transform"
                  aria-label={`${counts.get(b.status) ?? 0} ${b.label}`}
                >
                  <span
                    className="inline-block rounded-full px-2.5 py-1 text-[0.75rem] font-semibold"
                    style={{ background: b.bg, color: b.fg }}
                  >
                    {b.label}
                  </span>
                  <p className="font-display mt-3 text-4xl font-extrabold tabular-nums tracking-tight">
                    {counts.get(b.status) ?? 0}
                  </p>
                </Link>
              ))}
            </div>

            {!appsReady && (
              <p className="mt-3 text-sm" style={{ color: 'var(--color-muted)' }}>
                We couldn&rsquo;t reach your saved applications just now, so these counts show zero.
                Anything you add in the Tracker is kept safely on this device in the meantime.
              </p>
            )}
          </div>
        </section>

        {/* ---------- follow-ups + profile ---------- */}
        <section className="px-5 pt-6 md:px-8">
          <div className="mx-auto grid max-w-6xl gap-4 lg:grid-cols-[1.15fr_1fr]">
            <FollowUps apps={apps} />

            <div className="card flex flex-col p-6 md:p-7">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-display text-lg font-extrabold tracking-tight">Your profile</h2>
                <span
                  className="font-display text-2xl font-extrabold tabular-nums"
                  style={{ color: percent === 100 ? 'var(--color-accent)' : 'var(--color-ink)' }}
                >
                  {percent}%
                </span>
              </div>

              <div
                className="mt-3.5 h-2 w-full overflow-hidden rounded-full"
                style={{ background: 'var(--color-paper-2)' }}
                role="progressbar"
                aria-valuenow={percent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Profile completion"
              >
                <span
                  className="block h-full rounded-full"
                  style={{
                    width: `${Math.max(percent, 2)}%`,
                    background: percent === 100 ? 'var(--color-accent)' : 'var(--color-ink)',
                  }}
                />
              </div>

              <p className="mt-4 text-[0.9375rem] leading-relaxed" style={{ color: 'var(--color-muted)' }}>
                {!profileReady
                  ? 'Your profile can\u2019t be saved right now — trouble on our side, not yours. Everything else still works. Try again in a few minutes.'
                  : missing.length === 0
                    ? `Nothing missing. ${rateLine(profile) || 'Rates set'} — clients see this version of you first.`
                    : `Still missing ${missing.slice(0, 3).join(', ')}${
                        missing.length > 3 ? `, and ${missing.length - 3} more` : ''
                      }.`}
              </p>

              {profile.niches.length > 0 && (
                <p className="mt-2 text-[0.8125rem]" style={{ color: 'var(--color-muted)' }}>
                  Matching jobs against {profile.niches.length}{' '}
                  {profile.niches.length === 1 ? 'niche' : 'niches'}.
                </p>
              )}

              <div className="mt-auto pt-6">
                <Link
                  href="/profile"
                  className={`btn ${missing.length ? 'btn-primary' : 'btn-ghost'} !py-2.5 !text-sm`}
                >
                  {missing.length ? 'Finish your profile' : 'View profile'}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- courses ---------- */}
        <section className="px-5 pt-12 md:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="font-display text-xl font-extrabold tracking-tight">Where you left off</h2>
              <Link
                href="/courses"
                className="tap text-sm underline underline-offset-2"
                style={{ color: 'var(--color-accent)' }}
              >
                All courses
              </Link>
            </div>
            <div className="mt-4">
              <CourseRail />
            </div>
          </div>
        </section>

        {/* ---------- jobs ---------- */}
        <section className="px-5 pb-4 pt-12 md:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="font-display text-xl font-extrabold tracking-tight">
                {profile.niches.length ? 'Picked for you' : 'Fresh on the board'}
              </h2>
              <Link
                href="/jobs"
                className="tap text-sm underline underline-offset-2"
                style={{ color: 'var(--color-accent)' }}
              >
                Browse all jobs
              </Link>
            </div>

            {jobs.length === 0 ? (
              <div className="card mt-4 px-6 py-12 text-center">
                <p className="font-display text-lg font-extrabold tracking-tight">
                  Job suggestions didn&rsquo;t load just now
                </p>
                <p className="mt-2 text-sm" style={{ color: 'var(--color-muted)' }}>
                  The full board may still work fine.
                </p>
                <Link href="/jobs" className="btn btn-ghost mt-5">
                  Try the job board
                </Link>
              </div>
            ) : (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {jobs.map(({ job, because }) => {
                  const meta = sourceMeta(job.source);
                  const pay = formatSalary(job);
                  return (
                    <a
                      key={job.id}
                      href={job.original_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="lift card flex h-full min-w-0 flex-col p-6 transition-transform"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className="rounded-full px-2.5 py-1 text-[0.6875rem] font-bold uppercase tracking-[0.08em]"
                          style={{ background: meta.bg, color: meta.fg }}
                        >
                          {meta.short}
                        </span>
                        {because && (
                          <span className="text-[0.75rem]" style={{ color: 'var(--color-accent-deep)' }}>
                            matches {because.toLowerCase()}
                          </span>
                        )}
                        <span className="ml-auto text-[0.75rem]" style={{ color: 'var(--color-muted)' }}>
                          {formatPostedAt(job)}
                        </span>
                      </div>

                      <h3 className="wrap-anywhere font-display mt-3.5 text-lg font-extrabold leading-snug tracking-tight">
                        {job.title}
                      </h3>
                      <p className="wrap-anywhere mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>
                        {displayCompany(job)}
                      </p>

                      {/* mt-auto lives on the wrapper: an inline marginTop on the
                          same element beats the utility and strands the footer. */}
                      <div className="mt-auto pt-5">
                        <div
                          className="flex flex-wrap items-center justify-between gap-2 border-t pt-4 text-[0.8125rem]"
                          style={{ borderColor: 'var(--color-line)' }}
                        >
                          <span style={{ color: pay ? 'var(--color-ink-2)' : 'var(--color-muted)' }}>
                            {pay ?? 'Pay not listed'}
                          </span>
                          <span className="font-display font-bold" style={{ color: 'var(--color-accent)' }}>
                            Read it →
                          </span>
                        </div>
                      </div>
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <Footer tagline="Everything in one place. Finally" />
      </PullToRefreshRoute>
    </div>
  );
}

