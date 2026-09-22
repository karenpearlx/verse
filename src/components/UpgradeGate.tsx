import Link from 'next/link';
import { PRO_PRICE_PESOS } from '@/lib/plans';

/**
 * The wall a Free or signed-out visitor sees instead of a Pro tool.
 *
 * Server component on purpose: the gate is decided on the server from the
 * session, so nothing paid is ever sent to the browser and then hidden.
 */
export default function UpgradeGate({
  eyebrow,
  title,
  description,
  bullets = [],
  signedIn,
  next,
}: {
  eyebrow: string;
  title: string;
  description: string;
  bullets?: string[];
  signedIn: boolean;
  /** Path to come back to after signing in. */
  next: string;
}) {
  return (
    <div className="rounded-[28px] px-7 py-11 md:px-12 md:py-14" style={{ background: 'var(--color-ink)' }}>
      <p className="eyebrow" style={{ color: '#5fd0bf' }}>
        {eyebrow}
      </p>
      <h2 className="display-md mt-3" style={{ color: '#fff' }}>
        {title}
        <span style={{ color: '#5fd0bf' }}>.</span>
      </h2>
      <p className="mt-4 max-w-lg text-[0.9375rem] leading-relaxed" style={{ color: '#a9a6a1' }}>
        {description}
      </p>

      {bullets.length > 0 ? (
        <ul className="mt-7 grid gap-3 sm:grid-cols-2">
          {bullets.map((b) => (
            <li key={b} className="flex gap-3 text-[0.9375rem] leading-snug" style={{ color: '#e8e6e3' }}>
              <svg width="15" height="12" viewBox="0 0 15 12" fill="none" aria-hidden className="mt-1 flex-none">
                <path
                  d="M1.4 6.1 5.2 9.9 13.4 1.7"
                  stroke="#5fd0bf"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-9 flex flex-wrap items-center gap-3">
        {signedIn ? (
          <>
            <Link href="/pricing" className="btn btn-primary">
              See Pro, ₱{PRO_PRICE_PESOS} for 30 days
            </Link>
            <Link href="/jobs" className="btn btn-ghost">
              Back to the board
            </Link>
          </>
        ) : (
          <>
            <Link href={`/signup?next=${encodeURIComponent(next)}`} className="btn btn-primary">
              Create a free account
            </Link>
            <Link href={`/login?next=${encodeURIComponent(next)}`} className="btn btn-ghost">
              Already have one? Sign in
            </Link>
            <Link href="/pricing" className="btn btn-ghost">
              What Pro includes
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
