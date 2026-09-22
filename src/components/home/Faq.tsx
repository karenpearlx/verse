import Reveal from "../Reveal";

/**
 * FAQ.
 *
 * Native <details>, same reasoning as the lesson accordion: works with JS off,
 * keyboard and screen-reader correct with no aria bookkeeping, and Chrome's
 * Ctrl+F can find text inside closed answers. Reuses `.lesson` so the hover,
 * focus ring and chevron rotation come from the existing stylesheet.
 *
 * Answers are deliberately literal. If a claim here stops being true, fix the
 * product or fix the line — do not soften it into marketing.
 */

type Item = { q: string; a: string[] };

const FAQ: Item[] = [
  {
    q: "Is Verse really free?",
    a: [
      "There is a free plan and a Pro plan. Free covers the job board, unlimited application tracking, the rate calculator, basic courses, and limited cover letters and resume exports — no trial timer and no card to start.",
      "Pro is ₱199 for 30 days, prepaid (no auto-renew). It unlocks unlimited letters and exports, every premium course (SEO, AI marketing, web development, and the rest), new jobs 24 hours early, interview prep and the follow-up writer. The AI-written letters and graded interview feedback use your own OpenAI or Anthropic key; everything else needs nothing extra. Pay with GCash, Maya, or card through PayMongo. Verse never takes a cut of your pay and is not an agency, so there is no placement fee either way.",
    ],
  },
  {
    q: "What job sites do you pull from?",
    a: [
      "OnlineJobs.ph, RemoteOK and We Work Remotely, refreshed through the day and deduped so the same role does not show up three times.",
      "Every listing links straight back to the original post. Verse never sits between you and the client.",
    ],
  },
  {
    q: "How is this different from other job trackers?",
    a: [
      "Most job trackers are built for the general job market — local roles, corporate jobs, broad platforms — and many charge once you hit a certain number of applications.",
      "Verse is only for Filipino VAs chasing remote clients. That focus is the whole point: the sources are VA boards, the rate calculator is in pesos against real client budgets, the courses are about landing your first client, and the free plan keeps tracking unlimited.",
    ],
  },
  {
    q: "Can I use it on my phone?",
    a: [
      "It is built mobile-first, and you can install it to your home screen like a normal app — open Verse in your browser and tap Add to Home Screen. Pages you have already opened still load when your data drops out.",
    ],
  },
  {
    q: "Do I need an account to look around?",
    a: [
      "No. Browse jobs and use the rate calculator without signing up. An account only exists so your tracker, saved letters and course progress follow you between your phone and your laptop.",
    ],
  },
];

export default function Faq() {
  return (
    <div className="mx-auto max-w-3xl space-y-3">
      {FAQ.map((f, i) => (
        <Reveal key={f.q} delay={i * 60}>
          <details className="lesson card overflow-hidden">
            <summary className="tap flex cursor-pointer list-none items-baseline gap-4 p-6 md:p-7">
              <span className="font-display min-w-0 flex-1 text-lg font-extrabold leading-snug tracking-tight md:text-xl">
                {f.q}
              </span>
              <span
                className="lesson-chev mt-1 grid h-7 w-7 flex-none place-items-center rounded-full"
                style={{ border: "1px solid var(--color-line-2)" }}
                aria-hidden
              >
                <svg width="11" height="7" viewBox="0 0 12 8" fill="none">
                  <path
                    d="M1 1.5 6 6.5 11 1.5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </summary>

            <div className="px-6 pt-4 pb-7 md:px-7">
              {f.a.map((p, pi) => (
                <p
                  key={pi}
                  className="mt-3 text-[0.9375rem] leading-relaxed first:mt-0"
                  style={{ color: "var(--color-ink-2)" }}
                >
                  {p}
                </p>
              ))}
            </div>
          </details>
        </Reveal>
      ))}
    </div>
  );
}
