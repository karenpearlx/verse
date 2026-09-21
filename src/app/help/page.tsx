import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";
import GradientBg from "@/components/GradientBg";
import { CONTACT_EMAIL, CONTACT_IS_PLACEHOLDER } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Help",
  description:
    "Verse help: answers to the common questions, fixes for the things that go wrong, and step-by-step guides for the tracker, the builders and installing the app.",
};

/**
 * Support, in three passes.
 *
 * Questions people ask before they trust the thing, fixes for the four or five
 * ways it actually breaks, then the walkthroughs. Native <details> throughout,
 * same as the marketing FAQ: works with JS off, keyboard and screen reader
 * correct without aria bookkeeping, and browser find-in-page can still see
 * text inside a closed answer.
 *
 * Rule for anything written here: describe what the product does today. If a
 * fix stops working, fix the product or fix the line — do not soften it.
 */

type Entry = { q: string; a: string[] };

const FAQ: Entry[] = [
  {
    q: "Is Verse free?",
    a: [
      "The job board, unlimited application tracking, the rate check and the free course tracks cost nothing, with no trial timer and no card.",
      "Pro is ₱199 for 30 days (prepaid, no auto-renew) and unlocks every premium course plus unlimited resume and cover letter use. Pay with GCash, Maya, or card. Verse never takes a cut of your pay and is not an agency, so there is no placement fee either way.",
    ],
  },
  {
    q: "Where do the listings come from?",
    a: [
      "OnlineJobs.ph, RemoteOK and We Work Remotely, refreshed through the day and deduped so the same role does not appear three times.",
      "Every card links back to the original post. You apply on the client's site, under your own name.",
    ],
  },
  {
    q: "Do I need an account?",
    a: [
      "Not to browse jobs or use the rate check. An account exists so your tracker, saved letters and course progress follow you from your phone to your laptop.",
    ],
  },
  {
    q: "Can I use it on my phone?",
    a: [
      "It is built phone-first and installs to your home screen like a normal app. Pages you have already opened keep loading when your data drops out.",
    ],
  },
  {
    q: "Will an employer know I used Verse?",
    a: [
      "No. Nothing is stamped on your letter or resume, and Verse never contacts an employer on your behalf or shares your profile with recruiters.",
    ],
  },
  {
    q: "How do I cancel Pro?",
    a: [
      "Profile, then Plans and pricing. Pro is prepaid for a fixed window rather than auto-renewing, so cancelling stops the next charge and you keep access until the date shown on that page.",
    ],
  },
];

type Fix = { symptom: string; cause: string; steps: string[] };

const FIXES: Fix[] = [
  {
    symptom: "Google sign-in bounced me back to the login page",
    cause:
      "Usually a stale session cookie from an older version of the site, or a browser blocking third-party cookies in a private window.",
    steps: [
      "Try once more — the second attempt succeeds in most cases.",
      "Still stuck: sign in with email and password instead, on the same login page.",
      "In a private or incognito window, allow cookies for vrsfd.com or use a normal window.",
    ],
  },
  {
    symptom: "The job board is empty, or stuck on \u201cLoading listings\u2026\u201d",
    cause: "Almost always a filter still applied, or the board never finished its first fetch.",
    steps: [
      "Check the two dropdowns above the list. \u201cRate listed only\u201d hides every post without a published rate, which is a lot of them.",
      "Tap Clear filters, next to the results count.",
      "Pull down on the list to refresh it.",
      "If the count still reads zero listings, the sync is behind — it catches up within the hour.",
    ],
  },
  {
    symptom: "A course module is locked",
    cause:
      "The advanced tracks give you three modules free, then ask for Pro. Or you are signed out and progress is not being read.",
    steps: [
      "Check you are signed in — the lock also appears to visitors.",
      "If you have Pro and it still locks, open Profile then Plans and pricing to confirm the plan shows as active.",
      "Sign out and back in once; the plan is read at sign-in.",
    ],
  },
  {
    symptom: "My tracker, letters or course progress vanished",
    cause: "Nearly always a different account. Google sign-in and email sign-up create separate accounts even on the same address.",
    steps: [
      "Open Profile and check which email is shown at the top.",
      "If it is not the one you started with, sign out and sign back in the way you did the first time.",
      "Nothing is deleted when this happens — the work is sitting on the other account.",
    ],
  },
  {
    symptom: "The app looks broken or shows old content after an update",
    cause: "A cached version of the site is still installed on your device.",
    steps: [
      "Pull down to refresh the page.",
      "If it persists, close the app fully and reopen it.",
      "Last resort: remove it from your home screen and add it again. Your account data is on the server, not the device, so nothing is lost.",
    ],
  },
  {
    symptom: "A resume or letter will not download",
    cause: "Usually the browser blocking the file, or the free limit reached.",
    steps: [
      "Check for a blocked-download notice at the top or bottom of the browser.",
      "In the in-app browser inside Facebook or Messenger, downloads often fail silently — open Verse in Chrome or Safari instead.",
      "If you are at the free limit, Profile then Plans and pricing shows how many you have left.",
    ],
  },
];

type Guide = { n: string; title: string; time: string; steps: string[] };

const GUIDES: Guide[] = [
  {
    n: "01",
    title: "Apply to your first job and track it",
    time: "5 minutes",
    steps: [
      "Open Jobs and use the source dropdown to narrow the board, or search a role like \u201cexecutive assistant\u201d.",
      "On a card you like, tap Write cover letter. The title, company and description carry over on their own.",
      "Edit the draft, copy it, then tap through to the original post and apply there.",
      "The application lands in your Tracker as Applied. Set a follow-up reminder while it is fresh.",
    ],
  },
  {
    n: "02",
    title: "Work out what to charge",
    time: "3 minutes",
    steps: [
      "Open Tools, then Rate check.",
      "Pick your service and your experience level honestly — inflating it gives you a number you cannot defend on a call.",
      "Read the whole range, not the top of it. The low end is your walk-away, not your opener.",
      "Save the number to your profile so it is already filled in on future applications.",
    ],
  },
  {
    n: "03",
    title: "Build a resume that survives the filter",
    time: "15 minutes",
    steps: [
      "Open Tools, then Resume builder.",
      "Import an existing resume if you have one — it saves retyping the history.",
      "Pick a template. All three are single-column on purpose: two-column designs get read as one scrambled paragraph by most applicant tracking systems.",
      "Download the PDF and keep one master version. Tweak the summary per application rather than rebuilding it each time.",
    ],
  },
  {
    n: "04",
    title: "Install Verse on your phone",
    time: "1 minute",
    steps: [
      "Android: open vrsfd.com in Chrome, tap the three dots, then Add to home screen.",
      "iPhone: open it in Safari, tap Share, then Add to Home Screen. It has to be Safari — Chrome on iOS cannot install it.",
      "Open it from the icon after that. Pages you have already visited still load with no signal.",
    ],
  },
  {
    n: "05",
    title: "Chase an application that went quiet",
    time: "2 minutes",
    steps: [
      "Wait five to seven working days after applying. Sooner reads as anxious.",
      "In Tracker, open the application and tap the follow-up option.",
      "Keep it to three lines and give the client an easy out — a yes-or-no question beats \u201cany update?\u201d",
      "One follow-up, then a second a week later. After that, move on and mark it Closed.",
    ],
  },
];

function Accordion({ items }: { items: Entry[] }) {
  return (
    <div className="space-y-3">
      {items.map((f, i) => (
        <Reveal key={f.q} delay={i * 50}>
          <details className="lesson card overflow-hidden">
            <summary className="tap flex cursor-pointer list-none items-baseline gap-4 p-5 md:p-6">
              <span className="font-display min-w-0 flex-1 text-[1.0625rem] font-extrabold leading-snug tracking-tight md:text-lg">
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
            <div className="px-5 pb-6 pt-2 md:px-6">
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

/**
 * The id lives on the section wrapper rather than this heading block, so an
 * anchor jump lands on a container that actually holds the content under it.
 */
function SectionHeading({
  eyebrow,
  title,
  sub,
}: {
  eyebrow: string;
  title: string;
  sub: string;
}) {
  return (
    <div>
      <Reveal>
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="display-md mt-3">
          {title}
          <span className="dot">.</span>
        </h2>
        <p className="mt-3 max-w-xl text-[0.9375rem] leading-relaxed" style={{ color: "var(--color-muted)" }}>
          {sub}
        </p>
      </Reveal>
    </div>
  );
}

export default function HelpPage() {
  return (
    <div className="min-h-screen">
      <GradientBg position="bottom" />
      <Nav />

      <section className="px-5 pt-28 md:px-8 md:pt-40">
        <div className="mx-auto max-w-3xl">
          <p className="eyebrow">Help</p>
          <h1 className="display-lg mt-4">
            Stuck on something<span className="dot">?</span>
          </h1>
          <p className="lede mt-5 max-w-xl">
            The questions people ask most, the handful of things that genuinely go wrong and how
            to get past them, and walkthroughs for the parts worth doing properly once.
          </p>

          <nav aria-label="Jump to a section" className="mt-8 flex flex-wrap gap-2">
            <a href="#faqs" className="chip">
              Questions
            </a>
            <a href="#fixes" className="chip">
              Something is broken
            </a>
            <a href="#guides" className="chip">
              Step by step
            </a>
          </nav>
        </div>
      </section>

      <section className="px-5 pt-14 md:px-8 md:pt-20">
        <div id="faqs" className="mx-auto max-w-3xl" style={{ scrollMarginTop: "6.5rem" }}>
          <SectionHeading
            eyebrow="Questions"
            title="The ones that come up every week"
            sub="If the answer here is not the answer you are getting from the product, the product is wrong and we want to know."
          />
          <div className="mt-7">
            <Accordion items={FAQ} />
          </div>
        </div>
      </section>

      <section className="px-5 pt-16 md:px-8 md:pt-24">
        <div id="fixes" className="mx-auto max-w-3xl" style={{ scrollMarginTop: "6.5rem" }}>
          <SectionHeading
            eyebrow="Troubleshooting"
            title="When something is not behaving"
            sub="Each one starts with why it happens, because knowing the cause usually makes the fix obvious."
          />

          <div className="mt-7 space-y-3">
            {FIXES.map((f, i) => (
              <Reveal key={f.symptom} delay={i * 50}>
                <details className="lesson card overflow-hidden">
                  <summary className="tap flex cursor-pointer list-none items-baseline gap-4 p-5 md:p-6">
                    <span className="font-display min-w-0 flex-1 text-[1.0625rem] font-extrabold leading-snug tracking-tight md:text-lg">
                      {f.symptom}
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

                  <div className="px-5 pb-6 pt-2 md:px-6">
                    <p
                      className="rounded-xl p-3.5 text-[0.875rem] leading-relaxed"
                      style={{ background: "var(--color-paper-2)", color: "var(--color-ink-2)" }}
                    >
                      <span className="font-semibold" style={{ color: "var(--color-ink)" }}>
                        Why it happens.{" "}
                      </span>
                      {f.cause}
                    </p>

                    <ol className="mt-4 space-y-2.5">
                      {f.steps.map((s, si) => (
                        <li key={si} className="flex gap-3">
                          <span
                            aria-hidden
                            className="mt-0.5 grid h-5 w-5 flex-none place-items-center rounded-full text-[0.6875rem] font-bold tabular-nums"
                            style={{ background: "var(--color-accent-soft)", color: "var(--color-accent-deep)" }}
                          >
                            {si + 1}
                          </span>
                          <span
                            className="text-[0.9375rem] leading-relaxed"
                            style={{ color: "var(--color-ink-2)" }}
                          >
                            {s}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 pt-16 md:px-8 md:pt-24">
        <div id="guides" className="mx-auto max-w-3xl" style={{ scrollMarginTop: "6.5rem" }}>
          <SectionHeading
            eyebrow="Step by step"
            title="Do it properly once"
            sub="Five walkthroughs. None of them take longer than a coffee, and each one saves you repeating the same fifteen minutes on every application."
          />

          <div className="mt-7 space-y-4">
            {GUIDES.map((g, i) => (
              <Reveal key={g.title} delay={i * 50}>
                <article className="card p-6 md:p-7">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span
                      className="text-[0.6875rem] font-bold tracking-[0.16em]"
                      style={{ color: "var(--color-accent)" }}
                    >
                      {g.n}
                    </span>
                    <h3 className="font-display min-w-0 flex-1 text-xl font-extrabold leading-snug tracking-tight">
                      {g.title}
                    </h3>
                    <span
                      className="rounded-full px-2.5 py-1 text-[0.6875rem] font-semibold"
                      style={{ background: "var(--color-paper-2)", color: "var(--color-muted)" }}
                    >
                      {g.time}
                    </span>
                  </div>

                  <ol className="mt-5 space-y-3">
                    {g.steps.map((s, si) => (
                      <li key={si} className="flex gap-3.5">
                        <span
                          aria-hidden
                          className="mt-0.5 grid h-6 w-6 flex-none place-items-center rounded-full text-xs font-bold tabular-nums"
                          style={{ background: "var(--color-ink)", color: "#fff" }}
                        >
                          {si + 1}
                        </span>
                        <span
                          className="text-[0.9375rem] leading-relaxed"
                          style={{ color: "var(--color-ink-2)" }}
                        >
                          {s}
                        </span>
                      </li>
                    ))}
                  </ol>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 pb-20 pt-16 md:px-8 md:pb-28 md:pt-24">
        <div className="mx-auto max-w-3xl">
          <div className="card p-7 text-center md:p-10">
            <h2 className="display-md">
              Still stuck<span className="dot">?</span>
            </h2>
            <p className="lede mx-auto mt-4 max-w-md">
              Nothing here matching what you are seeing means it is probably a bug, not you. Say
              what you tapped and what happened and it gets looked at.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              {/* No dead mailto: while the published address is still the
                  placeholder, a "contact us" button that silently goes nowhere
                  is worse than not offering one. */}
              {!CONTACT_IS_PLACEHOLDER && (
                <a
                  href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Verse help")}`}
                  className="btn btn-primary"
                >
                  Email support
                </a>
              )}
              <Link href="/tools" className={CONTACT_IS_PLACEHOLDER ? "btn btn-primary" : "btn btn-ghost"}>
                Back to the tools
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer tagline="Built for VAs, answered like a person" />
    </div>
  );
}
