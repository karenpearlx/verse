import Reveal from "../Reveal";

/**
 * Old way / with Verse.
 *
 * Two columns, deliberately unequal in weight: the "old way" panel sits flat on
 * paper-2 with no shadow, the Verse panel is a real raised card. The contrast is
 * carried by elevation and colour, not by shouting.
 *
 * Text colours stay on ink-2/muted rather than faint — faint is 2.6:1 on white
 * and fails AA for body copy.
 */

const OLD = [
  "Checking OLJ, RemoteOK and We Work Remotely separately, every single day",
  "Applications living in a spreadsheet you stopped updating in March",
  "Guessing your rate, then quoting low because you guessed nervous",
  "Learning the job from whichever YouTube video autoplayed next",
];

function newItems(jobs?: string) {
  return [
    jobs
      ? `One feed, ${jobs} VA jobs, refreshed through the day`
      : "One feed with every VA job we can find, refreshed through the day",
    "Unlimited applications tracked, with follow-up nudges",
    "A rate calculator with market-range estimates from collected listings",
    "Short structured courses — free tracks plus Pro specialisms (SEO, web, and more) at ₱199 for 30 days",
  ];
}

function Cross() {
  return (
    <span
      className="mt-0.5 grid h-5 w-5 flex-none place-items-center rounded-full"
      style={{ background: "#f6e3dd", color: "#b04f31" }}
      aria-hidden
    >
      <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
        <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      </svg>
    </span>
  );
}

function Check() {
  return (
    <span
      className="mt-0.5 grid h-5 w-5 flex-none place-items-center rounded-full text-white"
      style={{ background: "var(--color-accent)" }}
      aria-hidden
    >
      <svg width="11" height="9" viewBox="0 0 12 10" fill="none">
        <path
          d="M1 5.2 4.3 8.5 11 1.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export default function Compare({ jobs }: { jobs?: string }) {
  return (
    <div className="grid gap-5 md:grid-cols-2 md:gap-6">
      <Reveal>
        <div
          className="h-full rounded-[28px] p-7 md:p-9"
          style={{ background: "var(--color-paper-2)", border: "1px solid var(--color-line)" }}
        >
          <p
            className="font-display text-xs font-extrabold uppercase tracking-[0.16em]"
            style={{ color: "#b04f31" }}
          >
            The old way
          </p>
          <h3 className="display-md mt-3" style={{ color: "var(--color-ink-2)" }}>
            Six tabs and a spreadsheet
          </h3>
          <ul className="mt-7 space-y-4">
            {OLD.map((t) => (
              <li key={t} className="flex gap-3.5">
                <Cross />
                <span className="text-[0.9375rem] leading-relaxed" style={{ color: "var(--color-ink-2)" }}>
                  {t}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Reveal>

      <Reveal delay={110}>
        <div className="card lift h-full p-7 md:p-9">
          <p className="eyebrow">With Verse</p>
          <h3 className="display-md mt-3">
            One tab, and it remembers
            <span className="dot">.</span>
          </h3>
          <ul className="mt-7 space-y-4">
            {newItems(jobs).map((t) => (
              <li key={t} className="flex gap-3.5">
                <Check />
                <span className="text-[0.9375rem] leading-relaxed" style={{ color: "var(--color-ink-2)" }}>
                  {t}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Reveal>
    </div>
  );
}
