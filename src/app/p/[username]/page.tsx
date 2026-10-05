import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Fraunces, Lora, Space_Grotesk } from 'next/font/google';
import { createServiceClient } from '@/lib/supabase/service';
import {
  availabilityMeta,
  experienceMeta,
  fromRow,
  nicheLabel,
  PROFILE_COLUMNS,
  type Profile,
  type ProfileRow,
} from '@/lib/profile';
import {
  cleanUsername,
  parseConfig,
  parseTheme,
  themeVars,
  type CourseProof,
  type PortfolioConfig,
  type PortfolioSample,
  type PortfolioTheme,
  type SectionId,
} from '@/lib/portfolio';

export const dynamic = 'force-dynamic';

/* Fonts for the three pairs. Loaded here, not in the root layout, so the rest
 * of the site pays nothing for them. All three are variable fonts, so no
 * weight list — multi-weight arrays break Vercel's Turbopack font resolver. */
const fraunces = Fraunces({ subsets: ['latin'], display: 'swap', variable: '--pf-display' });
const lora = Lora({ subsets: ['latin'], display: 'swap', variable: '--pf-serif' });
const grotesk = Space_Grotesk({ subsets: ['latin'], display: 'swap', variable: '--pf-grotesk' });

type PageProps = { params: Promise<{ username: string }> };

type Loaded = {
  profile: Profile;
  config: PortfolioConfig;
  theme: PortfolioTheme;
  username: string;
};

async function load(usernameRaw: string): Promise<Loaded | null> {
  const username = cleanUsername(usernameRaw);
  if (!username) return null;
  const db = createServiceClient();
  const { data: row, error } = await db
    .from('portfolios')
    .select('user_id,username,published,config,theme')
    .eq('username', username)
    .maybeSingle();
  if (error || !row || !row.published) return null;

  const { data: profileRow } = await db
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('user_id', row.user_id)
    .maybeSingle();

  const profile = fromRow((profileRow as ProfileRow | null) ?? null);
  if (!profile.fullName) return null; // nothing to show yet
  return { profile, config: parseConfig(row.config), theme: parseTheme(row.theme), username };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const data = await load(username);
  if (!data) return { title: 'Portfolio not found', robots: { index: false } };
  const { profile } = data;
  const title = `${profile.fullName} — Virtual Assistant`;
  const description =
    profile.headline ||
    `${profile.fullName}'s virtual assistant portfolio: skills, completed training and work samples.`;
  return {
    title,
    description,
    alternates: { canonical: `/p/${data.username}` },
    openGraph: { title, description, type: 'profile', url: `https://vrsfd.com/p/${data.username}` },
    twitter: { card: 'summary', title, description },
  };
}

/* ------------------------------------------------------------------ */
/* small pieces                                                        */
/* ------------------------------------------------------------------ */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="pf-display text-[0.8125rem] font-bold uppercase tracking-[0.18em]"
      style={{ color: 'var(--pf-accent)' }}
    >
      {children}
    </h2>
  );
}

function CourseCard({ course }: { course: CourseProof }) {
  const pct = course.total ? Math.round((course.done / course.total) * 100) : 0;
  const quizPct = course.quizTotal ? Math.round((course.quizScore / course.quizTotal) * 100) : null;
  return (
    <div className="rounded-2xl p-4" style={{ background: 'var(--pf-surface)', border: '1px solid var(--pf-line)' }}>
      <p className="pf-display text-[1.0625rem] font-bold leading-snug" style={{ color: 'var(--pf-ink)' }}>
        {course.title}
      </p>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full" style={{ background: 'var(--pf-line)' }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'var(--pf-accent)' }} />
      </div>
      <p className="mt-2 text-[0.8125rem]" style={{ color: 'var(--pf-muted)' }}>
        {course.done}/{course.total} modules
        {quizPct != null ? ` · quizzes ${quizPct}%` : ''}
      </p>
    </div>
  );
}

function SampleCard({ sample }: { sample: PortfolioSample }) {
  const body = (
    <>
      {sample.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- arbitrary https hosts; next/image needs a domain allowlist
        <img
          src={sample.imageUrl}
          alt={sample.title || 'Work sample'}
          className="aspect-[16/10] w-full rounded-xl object-cover"
          style={{ border: '1px solid var(--pf-line)' }}
          loading="lazy"
        />
      ) : null}
      {sample.title ? (
        <p className="pf-display mt-3 text-[1.0625rem] font-bold leading-snug" style={{ color: 'var(--pf-ink)' }}>
          {sample.title}
          {sample.url ? <span aria-hidden style={{ color: 'var(--pf-accent)' }}> ↗</span> : null}
        </p>
      ) : null}
      {sample.blurb ? (
        <p className="mt-1.5 text-[0.9375rem] leading-relaxed" style={{ color: 'var(--pf-muted)' }}>
          {sample.blurb}
        </p>
      ) : null}
    </>
  );
  const className = 'block rounded-2xl p-4 transition-transform';
  const style = { background: 'var(--pf-surface)', border: '1px solid var(--pf-line)' };
  return sample.url ? (
    <a href={sample.url} target="_blank" rel="noopener noreferrer nofollow" className={`${className} hover:-translate-y-0.5`} style={style}>
      {body}
    </a>
  ) : (
    <div className={className} style={style}>
      {body}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* page                                                                */
/* ------------------------------------------------------------------ */

export default async function PortfolioPage({ params }: PageProps) {
  const { username } = await params;
  const data = await load(username);
  if (!data) notFound();
  const { profile, config, theme } = data;

  const vars = themeVars(theme);
  const avail = availabilityMeta(profile.availability);
  const rateBits: string[] = [];
  if (profile.hourlyRate != null) rateBits.push(`$${profile.hourlyRate.toLocaleString('en-US')}/hour`);
  if (profile.monthlyRate != null) rateBits.push(`$${profile.monthlyRate.toLocaleString('en-US')}/month`);

  const show = (id: SectionId) => {
    if (!config.sections[id]) return false;
    if (id === 'about') return Boolean(profile.bio);
    if (id === 'skills') return profile.niches.length > 0;
    if (id === 'courses') return config.courses.length > 0;
    if (id === 'samples') return config.samples.length > 0;
    if (id === 'rates') return rateBits.length > 0;
    if (id === 'links') return profile.links.length > 0;
    if (id === 'contact') return Boolean(profile.contactEmail);
    return false;
  };

  const fontClass =
    theme.font === 'editorial'
      ? `${fraunces.variable} ${lora.variable} pf-editorial`
      : theme.font === 'modern'
        ? `${grotesk.variable} pf-modern`
        : `${fraunces.variable} pf-classic`;

  const sections: Record<SectionId, React.ReactNode> = {
    about: (
      <section key="about">
        <SectionTitle>About</SectionTitle>
        <p className="pf-body mt-3 max-w-2xl whitespace-pre-line text-[1.0625rem] leading-relaxed" style={{ color: 'var(--pf-ink)' }}>
          {profile.bio}
        </p>
      </section>
    ),
    skills: (
      <section key="skills">
        <SectionTitle>Skills &amp; niches</SectionTitle>
        <div className="mt-3 flex flex-wrap gap-2">
          {profile.niches.map((n) => (
            <span
              key={n}
              className="rounded-full px-3.5 py-1.5 text-[0.875rem] font-semibold"
              style={{ background: 'var(--pf-surface)', border: '1px solid var(--pf-line)', color: 'var(--pf-ink)' }}
            >
              {nicheLabel(n)}
            </span>
          ))}
          <span
            className="rounded-full px-3.5 py-1.5 text-[0.875rem] font-semibold"
            style={{ background: 'var(--pf-accent)', color: 'var(--pf-accent-ink)' }}
          >
            {experienceMeta(profile.experience).label}
          </span>
        </div>
      </section>
    ),
    courses: (
      <section key="courses">
        <SectionTitle>Training completed on Verse</SectionTitle>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {config.courses.map((c) => (
            <CourseCard key={c.slug} course={c} />
          ))}
        </div>
      </section>
    ),
    samples: (
      <section key="samples">
        <SectionTitle>Work samples</SectionTitle>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {config.samples.map((s, i) => (
            <SampleCard key={i} sample={s} />
          ))}
        </div>
      </section>
    ),
    rates: (
      <section key="rates">
        <SectionTitle>Rates</SectionTitle>
        <div className="mt-3 flex flex-wrap gap-3">
          {rateBits.map((r) => (
            <span
              key={r}
              className="pf-display rounded-2xl px-5 py-3 text-xl font-bold"
              style={{ background: 'var(--pf-surface)', border: '1px solid var(--pf-line)', color: 'var(--pf-ink)' }}
            >
              {r}
            </span>
          ))}
        </div>
      </section>
    ),
    links: (
      <section key="links">
        <SectionTitle>Links</SectionTitle>
        <div className="mt-3 flex flex-wrap gap-2.5">
          {profile.links.map((l) => (
            <a
              key={l.url}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="rounded-full px-4 py-2 text-[0.9375rem] font-semibold underline-offset-4 hover:underline"
              style={{ background: 'var(--pf-surface)', border: '1px solid var(--pf-line)', color: 'var(--pf-ink)' }}
            >
              {l.label} ↗
            </a>
          ))}
        </div>
      </section>
    ),
    contact: (
      <section key="contact">
        <SectionTitle>Contact</SectionTitle>
        <p className="pf-body mt-3 text-[1.0625rem]" style={{ color: 'var(--pf-muted)' }}>
          The fastest way to reach {profile.fullName.split(' ')[0]}:
        </p>
        <a
          href={`mailto:${profile.contactEmail}`}
          className="pf-display mt-4 inline-block rounded-full px-7 py-3.5 text-[1.0625rem] font-bold transition-transform hover:-translate-y-0.5"
          style={{ background: 'var(--pf-accent)', color: 'var(--pf-accent-ink)' }}
        >
          {profile.contactEmail}
        </a>
      </section>
    ),
  };

  return (
    <div
      className={`${fontClass} min-h-screen`}
      style={
        {
          background: 'var(--pf-bg)',
          '--pf-bg': vars.bg,
          '--pf-surface': vars.surface,
          '--pf-ink': vars.ink,
          '--pf-muted': vars.muted,
          '--pf-line': vars.line,
          '--pf-accent': vars.accent,
          '--pf-accent-ink': vars.accentInk,
        } as React.CSSProperties
      }
    >
      {/* Font-pair wiring: .pf-display / .pf-body resolve per pair. */}
      <style>{`
        .pf-classic .pf-display { font-family: var(--pf-display), serif; }
        .pf-classic .pf-body { font-family: var(--font-sans-body), system-ui, sans-serif; }
        .pf-editorial .pf-display { font-family: var(--pf-display), serif; }
        .pf-editorial .pf-body { font-family: var(--pf-serif), Georgia, serif; }
        .pf-modern .pf-display { font-family: var(--pf-grotesk), system-ui, sans-serif; }
        .pf-modern .pf-body { font-family: var(--pf-grotesk), system-ui, sans-serif; }
      `}</style>

      <main className="mx-auto max-w-3xl px-5 pb-16 pt-14 sm:px-8 sm:pt-20">
        {/* Hero */}
        <header>
          {profile.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- storage URL, no domain allowlist needed
            <img
              src={profile.avatarUrl}
              alt={profile.fullName}
              className="h-24 w-24 rounded-2xl object-cover sm:h-28 sm:w-28"
              style={{ border: '1px solid var(--pf-line)' }}
            />
          ) : null}
          <h1
            className="pf-display mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl"
            style={{ color: 'var(--pf-ink)' }}
          >
            {profile.fullName}
          </h1>
          {profile.headline ? (
            <p className="pf-body mt-3 max-w-xl text-lg leading-relaxed" style={{ color: 'var(--pf-muted)' }}>
              {profile.headline}
            </p>
          ) : null}
          <div className="mt-5 flex flex-wrap items-center gap-2 text-[0.875rem]">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-semibold"
              style={{ background: 'var(--pf-surface)', border: '1px solid var(--pf-line)', color: 'var(--pf-ink)' }}
            >
              <span
                aria-hidden
                className="h-2 w-2 rounded-full"
                style={{ background: avail.id === 'available' ? '#34a853' : avail.id === 'busy' ? '#e8a13a' : 'var(--pf-muted)' }}
              />
              {avail.label}
            </span>
            {profile.location ? <span style={{ color: 'var(--pf-muted)' }}>{profile.location}</span> : null}
            {profile.languages.length ? (
              <span style={{ color: 'var(--pf-muted)' }}>· {profile.languages.join(', ')}</span>
            ) : null}
          </div>
        </header>

        <div className="mt-12 space-y-12">{theme.order.filter(show).map((id) => sections[id])}</div>

        {/* Free marketing, as designed. */}
        <footer className="mt-16 border-t pt-6" style={{ borderColor: 'var(--pf-line)' }}>
          <a
            href="https://vrsfd.com/?ref=portfolio"
            className="pf-body text-[0.875rem] underline-offset-4 hover:underline"
            style={{ color: 'var(--pf-muted)' }}
          >
            Built on <strong style={{ color: 'var(--pf-accent)' }}>Verse</strong> — jobs, courses and tools for
            virtual assistants
          </a>
        </footer>
      </main>
    </div>
  );
}
