import Link from "next/link";
import Nav from "@/components/Nav";
import RevealWords from "@/components/RevealWords";
import StatsStrip, { type Stat } from "@/components/StatsStrip";
import PointerCard from "@/components/PointerCard";
import { countActiveJobs, formatJobCount } from "@/lib/jobs";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";
import SectionHead from "@/components/SectionHead";
import BrowserMock from "@/components/mock/BrowserMock";
import PhoneMock from "@/components/mock/PhoneMock";
import FloatCards from "@/components/mock/FloatCards";
import ToolkitCards from "@/components/mock/ToolkitCards";
import TrackerMock from "@/components/mock/TrackerMock";
import GradientBg from "@/components/GradientBg";
import Compare from "@/components/home/Compare";
import Steps from "@/components/home/Steps";
import Testimonials from "@/components/home/Testimonials";
import Faq from "@/components/home/Faq";
import HomeContent from "@/components/home/HomeContent";

const LEARN = [
  {
    k: "01",
    t: "Start from zero",
    d: "What a VA actually does all day, which skills pay, and the setup you need before you apply anywhere.",
  },
  {
    k: "02",
    t: "Write an application that lands",
    d: "The short, human cover letter format that gets replies, plus the red flags that get you skipped.",
  },
  {
    k: "03",
    t: "Charge properly",
    d: "How to quote a rate, when to raise it, and what to say when a client says the budget is tight.",
  },
];

export default async function Home() {
  const jobCount = await countActiveJobs();
  const trackedLabel = jobCount ? formatJobCount(jobCount) : "Live";

  const STATS: Stat[] = [
    jobCount
      ? { display: trackedLabel, to: Math.floor(jobCount / 100) * 100, suffix: "+", label: "listings tracked" }
      : { display: "Live", label: "listings tracked" },
    { display: "3", to: 3, label: "job sources merged" },
    { display: "₱199", label: "Pro for 30 days" },
  ];

  return (
    <div className="min-h-screen relative">
      <GradientBg position="center" />
      <Nav />

      <HomeContent>
      {/* ── HERO ───────────────────────────────────────────── */}
      <section className="px-5 pb-4 pt-28 md:px-8 md:pt-40">
        <div className="mx-auto max-w-6xl">
          <p className="eyebrow rise" style={{ animationDelay: "60ms" }}>
            Now live for Filipino VAs
          </p>

          <RevealWords
            text="Your VA career, all in one place"
            as="h1"
            className="display-xl mt-5 max-w-4xl"
            dot
            immediate
            delay={140}
            stagger={62}
          />

          <div className="rise mt-8" style={{ animationDelay: "230ms" }}>
            <p className="lede max-w-lg">
              Find jobs, learn the skills, know your worth. Everything a VA needs - beginner or pro - in one place.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/jobs" className="btn btn-primary">
                Browse jobs
                <svg width="15" height="12" viewBox="0 0 16 12" fill="none" aria-hidden>
                  <path
                    d="M1 6h13m-4.5-4.5L14 6l-4.5 4.5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
              <Link href="/pricing-tool" className="btn btn-ghost">
                Check your rate
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* browser mockup */}
      <section className="px-5 pt-14 md:px-8 md:pt-20">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <BrowserMock />
          </Reveal>
          <Reveal delay={120}>
            <p className="mt-8 text-center text-sm md:text-base" style={{ color: "var(--color-muted)" }}>
              Free to start. No agency, no placement fee.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── STATS STRIP ────────────────────────────────────── */}
      <section className="px-5 pt-24 md:px-8 md:pt-32">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <StatsStrip stats={STATS} />
          </Reveal>
        </div>
      </section>

      {/* ── OLD WAY VS ALLY ────────────────────────────────── */}
      <section className="px-5 pt-24 md:px-8 md:pt-36">
        <div className="mx-auto max-w-6xl">
          <SectionHead
            eyebrow="The difference"
            title="Job hunting, minus the admin"
            sub="Nothing here is new work. It is the same job hunt you are already doing, with the tedious half taken off your plate."
          />
          <div className="mt-14 md:mt-20">
            <Compare jobs={jobCount ? trackedLabel : undefined} />
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────── */}
      <section className="px-5 pt-28 md:px-8 md:pt-40">
        <div className="mx-auto max-w-6xl">
          <SectionHead
            eyebrow="How it works"
            title="Three steps, one evening"
            sub="No onboarding call, no setup wizard. Open the feed and you are already on step one."
          />
          <div className="mt-14 md:mt-20">
            <Steps />
          </div>
        </div>
      </section>

      {/* ── RATE CHECK ─────────────────────────────────────── */}
      <section className="px-5 pt-24 md:px-8 md:pt-36">
        <div className="mx-auto max-w-6xl">
          <SectionHead
            eyebrow="Rate check"
            title="Stop guessing what to charge"
            sub="Pick your skills and your years. Verse estimates a defendable range from collected listing data — not a live quote."
          />
          <Reveal delay={100} className="mt-14 md:mt-20">
            <PhoneMock />
          </Reveal>
        </div>
      </section>

      {/* ── JOB BOARD / FLOATING CARDS ─────────────────────── */}
      <section className="px-5 pt-28 md:px-8 md:pt-40">
        <div className="mx-auto max-w-6xl">
          <SectionHead
            eyebrow="Live job board"
            title="Every listing, side by side"
            sub="One search across three platforms, deduped and sorted. Tap through to apply on the original site — Verse never sits between you and the client."
          />
          <Reveal delay={100} className="mt-14 md:mt-24">
            <FloatCards tracked={trackedLabel} />
          </Reveal>
        </div>
      </section>

      {/* ── TOOLKIT (members) ──────────────────────────────── */}
      <section className="px-5 pt-28 md:px-8 md:pt-40">
        <div className="mx-auto max-w-6xl">
          <SectionHead
            eyebrow="Included when you sign up"
            title="The boring parts, handled"
            sub="Applying is mostly admin. Verse does the admin so the only thing left is deciding which jobs are worth your evening."
          />

          <Reveal delay={100} className="mt-14 md:mt-20">
            <ToolkitCards />
          </Reveal>

          <Reveal delay={120} className="mx-auto mt-6 max-w-4xl">
            <TrackerMock />
          </Reveal>

          <Reveal delay={160}>
            <p className="mt-8 text-center text-sm" style={{ color: "var(--color-muted)" }}>
              Core tools come with a free account. Pro unlocks unlimited letters, exports and premium courses.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── LEARN ──────────────────────────────────────────── */}
      <section className="px-5 pt-28 md:px-8 md:pt-40">
        <div className="mx-auto max-w-6xl">
          <SectionHead
            eyebrow="Learn the work"
            title="From zero to your first client"
            sub="Short, practical lessons written by VAs who actually did it — no ₱15,000 bootcamp required."
          />

          <div className="mt-14 grid gap-5 md:mt-20 md:grid-cols-3">
            {LEARN.map((c, i) => (
              <Reveal key={c.k} delay={i * 90}>
                <PointerCard as="article" className="card lift h-full p-7 md:p-8">
                  <p
                    className="card-index font-display text-sm font-extrabold tracking-[0.1em]"
                    style={{ color: "var(--color-accent)" }}
                  >
                    {c.k}
                  </p>
                  <h3 className="font-display mt-5 text-xl font-extrabold tracking-tight">{c.t}</h3>
                  <p className="mt-3 text-[0.9375rem] leading-relaxed" style={{ color: "var(--color-muted)" }}>
                    {c.d}
                  </p>
                </PointerCard>
              </Reveal>
            ))}
          </div>

          <Reveal delay={200}>
            <div className="mt-8 text-center">
              <Link href="/learn" className="btn btn-ghost">
                See all lessons
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── TESTIMONIALS ───────────────────────────────────── */}
      <section className="px-5 pt-28 md:px-8 md:pt-40">
        <div className="mx-auto max-w-6xl">
          <SectionHead
            eyebrow="What VAs say"
            title="Coming from real people"
            sub="Quoted with permission. More land here as people write in."
          />
          <div className="mt-14 md:mt-20">
            <Testimonials />
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────── */}
      <section className="px-5 pt-28 md:px-8 md:pt-40">
        <div className="mx-auto max-w-6xl">
          <SectionHead
            eyebrow="Questions"
            title="The things everyone asks"
            sub="Straight answers. If something is not built yet, it says so."
          />
          <div className="mt-14 md:mt-20">
            <Faq />
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────── */}
      <section className="px-5 pt-28 md:px-8 md:pt-40">
        <div className="mx-auto max-w-4xl">
          <Reveal>
            <div
              className="rounded-[28px] px-7 py-14 text-center md:px-16 md:py-20"
              style={{ background: "var(--color-ink)" }}
            >
              <p className="eyebrow" style={{ color: "#5fd0bf" }}>
                Free to start
              </p>
              <h2 className="display-lg mt-4" style={{ color: "#fff" }}>
                Know your worth, then go get it
                <span style={{ color: "#5fd0bf" }}>.</span>
              </h2>
              <p className="mx-auto mt-5 max-w-md text-[0.9375rem] leading-relaxed" style={{ color: "#a9a6a1" }}>
                Make an account to save jobs, track applications, and get alerts when something in
                your range shows up.
              </p>
              <div className="mt-9 flex flex-wrap justify-center gap-3">
                <Link href="/signup" className="btn btn-primary">
                  Create free account
                </Link>
                <Link
                  href="/jobs"
                  className="btn"
                  style={{ background: "rgba(255,255,255,.09)", color: "#fff" }}
                >
                  Just show me the jobs
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <Footer />
      </HomeContent>
    </div>
  );
}
