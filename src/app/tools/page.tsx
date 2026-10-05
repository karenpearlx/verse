import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";
import GradientBg from "@/components/GradientBg";

export const metadata: Metadata = {
  title: "Free Virtual Assistant Tools — Resume, Rates & Tracker",
  description:
    "Free VA tools in one place: rate calculator, resume builder, cover letter generator, interview prep, follow-up writer and application tracker.",
};

/**
 * The toolkit hub.
 *
 * Rate check and Interview used to be two more links in an already-crowded
 * header, and the builders were only reachable from a job card. This is the
 * one page that admits they are the same kind of thing: something you open
 * mid-application, use for four minutes, and close.
 *
 * Ordered by where they fall in an actual application, not by importance:
 * work out the number, write the letter, fix the resume, prep the call, chase
 * the silence. Someone landing here cold should be able to read it top to
 * bottom as the shape of the job hunt.
 */

const S = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden focusable="false">
      {children}
    </svg>
  );
}

type Tool = {
  href: string;
  kicker: string;
  label: string;
  blurb: string;
  /** The line under the button — what you walk away holding. */
  outcome: string;
  tint: string;
  ink: string;
  icon: React.ReactNode;
};

const TOOLS: Tool[] = [
  {
    href: "/pricing-tool",
    kicker: "01",
    label: "Rate check",
    blurb:
      "What clients typically list for your kind of work, in pesos and in dollars, by experience level. Market-range estimates you can check before the call.",
    outcome: "A range you can say out loud",
    tint: "var(--color-teal-wash)",
    ink: "var(--color-teal-deep)",
    icon: (
      <Icon>
        <circle cx="12" cy="12" r="8.4" {...S} />
        <path d="M14.4 9.2a2.9 2.9 0 0 0-2.5-1.2c-1.5 0-2.6.8-2.6 2s1 1.7 2.6 2c1.7.3 2.7.8 2.7 2.1s-1.1 2-2.7 2a3 3 0 0 1-2.6-1.3" {...S} />
        <path d="M12 6.1v1.9M12 16.1V18" {...S} />
      </Icon>
    ),
  },
  {
    href: "/cover-letter",
    kicker: "02",
    label: "Cover letter builder",
    blurb:
      "Seventeen niches and your own saved rules, so the draft already sounds like you instead of like a template you have to un-template.",
    outcome: "A first draft in under a minute",
    tint: "var(--color-clay-wash)",
    ink: "var(--color-clay-deep)",
    icon: (
      <Icon>
        <path d="M6 3.8h7.4L18.4 9v11.2H6Z" {...S} />
        <path d="M13.2 3.8V9h5.2" {...S} />
        <path d="M9 13.2h6.2M9 16.4h4" {...S} />
      </Icon>
    ),
  },
  {
    href: "/resume",
    kicker: "03",
    label: "Resume builder",
    blurb:
      "Three clean templates that survive an applicant tracking system. No two-column art project that reads as one garbled paragraph on the other end.",
    outcome: "A PDF you can send anywhere",
    tint: "var(--color-indigo-wash)",
    ink: "var(--color-indigo)",
    icon: (
      <Icon>
        <rect x="4.6" y="3.4" width="14.8" height="17.2" rx="2.2" {...S} />
        <circle cx="12" cy="9.4" r="2.3" {...S} />
        <path d="M8.2 16.6a3.9 3.9 0 0 1 7.6 0" {...S} />
      </Icon>
    ),
  },
  {
    href: "/interview-prep",
    kicker: "04",
    label: "Interview prep",
    blurb:
      "The questions clients keep asking, the ones worth asking back, and a way to rehearse the rate conversation before it is happening live at 11pm.",
    outcome: "Answers you have already said once",
    tint: "var(--color-leaf-wash)",
    ink: "var(--color-leaf)",
    icon: (
      <Icon>
        <path d="M4.2 6.4A2.2 2.2 0 0 1 6.4 4.2h11.2a2.2 2.2 0 0 1 2.2 2.2v7.4a2.2 2.2 0 0 1-2.2 2.2H10l-4.2 3.6a.6.6 0 0 1-1-.5V16H6.4a2.2 2.2 0 0 1-2.2-2.2Z" {...S} />
        <path d="M9.9 8.7a2.2 2.2 0 0 1 4.2.8c0 1.5-2.1 1.7-2.1 3" {...S} />
        <path d="M12 14.3h.01" {...S} strokeWidth={2} />
      </Icon>
    ),
  },
  {
    href: "/follow-up-email",
    kicker: "05",
    label: "Follow-up writer",
    blurb:
      "For the applications that went quiet. One short, non-desperate message that gives the client an easy way to reply.",
    outcome: "A nudge that does not read as begging",
    tint: "var(--color-teal-wash)",
    ink: "var(--color-teal-deep)",
    icon: (
      <Icon>
        <rect x="3.4" y="5.6" width="17.2" height="12.8" rx="2.2" {...S} />
        <path d="m3.9 7.1 8.1 5.6 8.1-5.6" {...S} />
      </Icon>
    ),
  },
  {
    href: "/tracker",
    kicker: "06",
    label: "Application tracker",
    blurb:
      "Every application on one board — applied, interviewing, offer — with follow-up dates attached, so nothing goes quiet just because you forgot which tab it was in.",
    outcome: "Nothing slips through the cracks",
    tint: "var(--color-clay-wash)",
    ink: "var(--color-clay-deep)",
    icon: (
      <Icon>
        <rect x="4.4" y="4.6" width="15.2" height="15.8" rx="2.4" {...S} />
        <path d="M8.6 3.2h6.8v2.9H8.6z" {...S} />
        <path d="m8.7 12.6 2.1 2.1 4.5-4.5" {...S} />
      </Icon>
    ),
  },
  {
    href: "/portfolio",
    kicker: "07 · NEW",
    label: "Public portfolio",
    blurb:
      "One shareable page — vrsfd.com/p/you — built from your profile, finished courses and work samples. Paste one link into every application instead of a bare resume.",
    outcome: "A link that does the convincing for you",
    tint: "var(--color-teal-wash)",
    ink: "var(--color-teal-deep)",
    icon: (
      <Icon>
        <circle cx="9" cy="9.2" r="2.6" {...S} />
        <path d="M4.4 18.2c.7-2.6 2.5-4 4.6-4s3.9 1.4 4.6 4" {...S} />
        <path d="M14.8 7.4h4.8M14.8 10.8h4.8M14.8 14.2h2.4" {...S} />
        <rect x="2" y="3.4" width="20" height="17.2" rx="2.6" {...S} />
      </Icon>
    ),
  },
];

export default function ToolsPage() {
  return (
    <div className="min-h-screen">
      <GradientBg position="right" />
      <Nav />

      <section className="px-5 pt-28 md:px-8 md:pt-40">
        <div className="mx-auto max-w-5xl">
          <p className="eyebrow">Toolkit</p>
          <h1 className="display-lg mt-4 max-w-3xl">
            Seven things, for the messy middle of an application<span className="dot">.</span>
          </h1>
          <p className="lede mt-5 max-w-xl">
            The job board finds the work. These are for everything between finding it and
            getting paid for it. Free plan covers the basics; Pro is there when you are applying hard.
          </p>
        </div>
      </section>

      <section className="px-5 pt-12 pb-6 md:px-8 md:pt-16">
        <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-2">
          {TOOLS.map((t, i) => (
            // The new portfolio card is featured full-width on purpose.
            <Reveal key={t.href} delay={i * 70} className={t.href === "/portfolio" ? "md:col-span-2" : undefined}>
              <article className="card tool-card relative h-full p-6 md:p-7">
                <div className="flex items-start gap-4">
                  <span
                    aria-hidden
                    className="grid h-12 w-12 flex-none place-items-center rounded-2xl"
                    style={{ background: t.tint, color: t.ink }}
                  >
                    {t.icon}
                  </span>

                  <div className="min-w-0 flex-1">
                    <span
                      className="text-[0.6875rem] font-bold tracking-[0.16em]"
                      style={{ color: "var(--color-faint)" }}
                    >
                      {t.kicker}
                    </span>
                    <h2 className="font-display mt-1 text-xl font-extrabold leading-snug tracking-tight">
                      <Link href={t.href} className="stretch-link">
                        {t.label}
                      </Link>
                    </h2>
                    <p
                      className="mt-2.5 text-[0.9375rem] leading-relaxed"
                      style={{ color: "var(--color-ink-2)" }}
                    >
                      {t.blurb}
                    </p>
                  </div>
                </div>

                <div
                  className="mt-5 flex items-center justify-between gap-3 border-t pt-4"
                  style={{ borderColor: "var(--color-line)" }}
                >
                  <span className="text-sm font-semibold" style={{ color: t.ink }}>
                    {t.outcome}
                  </span>
                  <span
                    aria-hidden
                    className="tool-card-arrow grid h-8 w-8 flex-none place-items-center rounded-full"
                  >
                    <svg width="9" height="14" viewBox="0 0 8 13" fill="none">
                      <path
                        d="M1.5 1.5 6.5 6.5l-5 5"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="px-5 pb-20 pt-6 md:px-8 md:pb-28">
        <div className="mx-auto max-w-5xl">
          <div
            className="panel flex flex-wrap items-center justify-between gap-4 p-6 md:p-7"
            style={{ background: "var(--color-paper-2)" }}
          >
            <p className="max-w-md text-[0.9375rem] leading-relaxed" style={{ color: "var(--color-ink-2)" }}>
              Something not doing what you expected, or you cannot find where a tool saved your
              work? The help page has the fixes.
            </p>
            <Link href="/help" className="btn btn-ghost">
              Help &amp; troubleshooting
            </Link>
          </div>
        </div>
      </section>

      <Footer tagline="Everything between finding the job and getting paid" />
    </div>
  );
}
