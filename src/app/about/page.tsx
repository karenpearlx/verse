import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";
import GradientBg from "@/components/GradientBg";

export const metadata: Metadata = {
  title: "About Verse — Built for Filipino Virtual Assistants",
  description:
    "Why Verse exists: one place for Filipino VAs to find work, learn the job, and know what to charge. Free plan and Pro — no agency in the middle.",
};

const PRINCIPLES = [
  {
    kicker: "01",
    title: "Free to start, Pro when you need it",
    body: "No placement fee, no cut of your pay, no ₱15,000 course at the end of a funnel. The free plan covers the board, tracker and rate check. Pro is optional for the month you are applying hard.",
  },
  {
    kicker: "02",
    title: "No agency in the middle",
    body: "You apply directly to the employer, on their site, with your own name on it. Verse never sits between you and a client and never sells your details to a recruiter.",
  },
  {
    kicker: "03",
    title: "Rates out in the open",
    body: "Most VAs undercharge because nobody tells them the number. The rate check exists so you walk into that conversation already knowing what the work is worth.",
  },
  {
    kicker: "04",
    title: "Honest about the parts we cannot fix",
    body: "Some listings are stale. Some employers are chancers. We tell you that instead of dressing up the board as a guarantee.",
  },
];

const TOOLS = [
  { href: "/jobs", label: "Job board", note: "Listings from OnlineJobs.ph, RemoteOK, and We Work Remotely in one view, filtered by rate." },
  { href: "/cover-letter", label: "Cover letter builder", note: "Seventeen niches, your own saved rules, and a draft in under a minute." },
  { href: "/resume", label: "Resume builder", note: "Three clean templates that survive an applicant tracking system." },
  { href: "/tracker", label: "Application tracker", note: "Every application in one place, with follow-up reminders." },
  { href: "/pricing-tool", label: "Rate check", note: "What the market actually pays for the work you do." },
  { href: "/learn", label: "Lessons", note: "From zero to first client, written by people who did it." },
];

export default function About() {
  return (
    <div className="min-h-screen">
      <GradientBg position="bottom" />
      <Nav />

      <section className="px-5 pt-28 md:px-8 md:pt-40">
        <div className="mx-auto max-w-5xl">
          <p className="eyebrow">About</p>
          <h1 className="display-lg mt-4 max-w-3xl">
            Built for the VAs, not the agencies<span className="dot">.</span>
          </h1>
          <p className="lede mt-5 max-w-xl">
            Verse started with a familiar evening: eleven browser tabs open, the same cover
            letter pasted for the ninth time, and no honest answer to the question &ldquo;so
            what&rsquo;s your rate?&rdquo;
          </p>
          <p className="mt-4 max-w-xl text-[0.9375rem] leading-relaxed" style={{ color: "var(--color-muted)" }}>
            Filipino virtual assistants do serious work for clients on the other side of the
            world, then get told what they are worth by people taking a cut. The tools that
            could fix that were scattered across five sites, half of them paid. So this is all
            of them in one place — free to start, with Pro when you want unlimited tools.
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/jobs" className="btn btn-primary">
              Browse the board
            </Link>
            <Link href="/signup" className="btn btn-ghost">
              Make an account
            </Link>
          </div>
        </div>
      </section>

      <section className="px-5 pt-20 md:px-8 md:pt-28">
        <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-2">
          {PRINCIPLES.map((p, i) => (
            <Reveal key={p.title} delay={i * 80}>
              <article className="card h-full p-7 md:p-8">
                <p
                  className="font-display text-xs font-extrabold uppercase tracking-[0.14em]"
                  style={{ color: "var(--color-accent)" }}
                >
                  {p.kicker}
                </p>
                <h2 className="font-display mt-4 text-2xl font-extrabold tracking-tight">{p.title}</h2>
                <p className="mt-3 text-[0.9375rem] leading-relaxed" style={{ color: "var(--color-muted)" }}>
                  {p.body}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="px-5 pt-24 md:px-8 md:pt-32">
        <div className="mx-auto max-w-3xl">
          <h2 className="display-md text-center">
            What&rsquo;s inside<span className="dot">.</span>
          </h2>
          <div className="mt-10 space-y-3">
            {TOOLS.map((t, i) => (
              <Reveal key={t.href} delay={i * 60}>
                <Link
                  href={t.href}
                  className="card flex items-center justify-between gap-5 p-6 transition-transform duration-200 hover:-translate-y-0.5"
                >
                  <span className="min-w-0">
                    <span className="font-display block text-lg font-extrabold tracking-tight">
                      {t.label}
                    </span>
                    <span className="mt-1 block text-[0.9375rem] leading-relaxed" style={{ color: "var(--color-muted)" }}>
                      {t.note}
                    </span>
                  </span>
                  <span aria-hidden className="flex-none" style={{ color: "var(--color-faint)" }}>
                    <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                      <path d="M4 2.5 7.5 6 4 9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>

          <p className="mt-14 text-center text-[0.9375rem] leading-relaxed" style={{ color: "var(--color-muted)" }}>
            Made in the Philippines, by a VA who got tired of the eleven tabs. If something is
            broken or a listing looks like a scam, say so and it gets fixed.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
