import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";
import StartTrack from "@/components/StartTrack";
import GradientBg from "@/components/GradientBg";

const TRACKS = [
  {
    kicker: "Track 01",
    title: "Before you apply",
    minutes: "28 min",
    lessons: [
      "What a VA actually does all day",
      "Picking a niche that pays more than general admin",
      "The equipment and internet floor clients expect",
      "Setting up a workspace that survives a brownout",
    ],
  },
  {
    kicker: "Track 02",
    title: "Getting hired",
    minutes: "41 min",
    lessons: [
      "A cover letter that sounds like a person",
      "Portfolio pieces when you have no clients yet",
      "Reading a job post for red flags",
      "The interview questions that always come up",
      "Following up without sounding desperate",
    ],
  },
  {
    kicker: "Track 03",
    title: "Getting paid properly",
    minutes: "33 min",
    lessons: [
      "Quoting a rate out loud without flinching",
      "Hourly vs monthly retainer, and when to switch",
      "Raising your rate with an existing client",
      "Wise, Payoneer, and what the fees really cost",
    ],
  },
  {
    kicker: "Track 04",
    title: "Staying hired",
    minutes: "25 min",
    lessons: [
      "Writing an update your client actually reads",
      "Saying no to scope creep",
      "Building SOPs so you become hard to replace",
    ],
  },
];

const FAQ = [
  {
    q: "Do I need a degree?",
    a: "No. Almost no client asks. They ask for proof you can do the task and communicate in writing. That's it.",
  },
  {
    q: "How long before my first client?",
    a: "Realistically four to ten weeks of consistent applying. People who send five tailored applications a day get there faster than people who send fifty copy-pasted ones.",
  },
  {
    q: "Is this free?",
    a: "The starter lessons are free. The full career-skill courses are on Pro. Verse makes nothing off placements and never sits between you and a client.",
  },
];

export default function Learn() {
  return (
    <div className="min-h-screen">
      <GradientBg position="right" />
      <Nav />

      <section className="px-5 pt-28 md:px-8 md:pt-40">
        <div className="mx-auto max-w-5xl">
          <p className="eyebrow">Learn the work</p>
          <h1 className="display-lg mt-4 max-w-3xl">
            From zero to your first client<span className="dot">.</span>
          </h1>
          <p className="lede mt-5 max-w-xl">
            Short, practical lessons written by VAs who actually did it. No ₱15,000 bootcamp, no
            recruiter upsell at the end.
          </p>
          <p className="mt-3 max-w-xl text-[0.9375rem]" style={{ color: "var(--color-muted)" }}>
            These free lessons are the warm-up. The full written courses — with exercises, rate
            tables and portfolio pieces — live in <Link href="/courses" className="underline underline-offset-2">Courses</Link>.
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <StartTrack />
            <Link href="/courses" className="btn btn-ghost">
              Browse courses
            </Link>
          </div>
        </div>
      </section>

      <section className="px-5 pt-16 md:px-8 md:pt-24">
        <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-2">
          {TRACKS.map((t, i) => (
            <Reveal key={t.title} delay={i * 80}>
              <article className="card h-full p-7 md:p-8">
                <div className="flex items-baseline justify-between gap-3">
                  <p
                    className="font-display text-xs font-extrabold uppercase tracking-[0.14em]"
                    style={{ color: "var(--color-accent)" }}
                  >
                    {t.kicker}
                  </p>
                  <span
                    className="rounded-full px-2.5 py-1 text-xs"
                    style={{ background: "var(--color-paper-2)", color: "var(--color-muted)" }}
                  >
                    {t.minutes}
                  </span>
                </div>

                <h2 className="font-display mt-4 text-2xl font-extrabold tracking-tight">
                  {t.title}
                </h2>

                <ul className="mt-5 space-y-3">
                  {t.lessons.map((l, li) => (
                    <li key={l} className="flex gap-3 text-[0.9375rem]">
                      <span
                        className="font-display mt-px w-5 flex-none text-xs font-bold"
                        style={{ color: "var(--color-faint)" }}
                      >
                        {String(li + 1).padStart(2, "0")}
                      </span>
                      <span style={{ color: "var(--color-ink-2)" }}>{l}</span>
                    </li>
                  ))}
                </ul>

                {i === 0 ? (
                  <Link
                    href="/learn/start"
                    className="tap mt-6 inline-flex items-center gap-2 text-[0.9375rem] font-semibold"
                    style={{ color: "var(--color-accent)" }}
                  >
                    Read track 01 <span aria-hidden>→</span>
                  </Link>
                ) : (
                  <p className="mt-6 text-sm" style={{ color: "var(--color-faint)" }}>
                    Coming soon — we&rsquo;re writing this one now
                  </p>
                )}
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="px-5 pt-24 md:px-8 md:pt-32">
        <div className="mx-auto max-w-3xl">
          <h2 className="display-md text-center">
            Questions people actually ask<span className="dot">.</span>
          </h2>
          <div className="mt-10 space-y-4">
            {FAQ.map((f, i) => (
              <Reveal key={f.q} delay={i * 70}>
                <div className="card p-6 md:p-7">
                  <h3 className="font-display text-lg font-extrabold tracking-tight">{f.q}</h3>
                  <p
                    className="mt-2.5 text-[0.9375rem] leading-relaxed"
                    style={{ color: "var(--color-muted)" }}
                  >
                    {f.a}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <Footer tagline="Start from zero, get hired anyway" />
    </div>
  );
}
