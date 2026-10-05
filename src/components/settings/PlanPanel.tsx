'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  FREE_COVER_LETTER_LIMIT,
  FREE_RESUME_LIMIT,
  type SubscriptionAccount,
} from '@/lib/subscription';
import { PRO_ACCESS_DAYS, PRO_PRICE_PESOS, formatPlanDate, tierLabel } from '@/lib/plans';
import { startCheckout } from '@/lib/useSubscription';

/**
 * "Current plan", above the preferences form.
 *
 * The account is read on the server and passed in, so this never renders a
 * plan the session does not actually have. The only thing it does on its own
 * is start checkout.
 *
 * Wording matters here: Hosted Checkout access is prepaid for a fixed window
 * and does not auto-renew, so there is nothing to cancel and this must never
 * say "renews on".
 */

function Row({ label, value, tone }: { label: string; value: string; tone?: 'good' | 'warn' }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2.5">
      <span className="text-sm" style={{ color: 'var(--color-muted)' }}>
        {label}
      </span>
      <span
        className="text-[0.9375rem] font-semibold"
        style={{
          color:
            tone === 'good' ? 'var(--color-accent-deep)' : tone === 'warn' ? '#a3384f' : 'var(--color-ink)',
        }}
      >
        {value}
      </span>
    </div>
  );
}

function Meter({ label, used, limit }: { label: string; used: number; limit: number }) {
  const left = Math.max(0, limit - used);
  const pct = Math.min(100, Math.round((Math.min(used, limit) / limit) * 100));
  const low = left <= 2;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm" style={{ color: 'var(--color-muted)' }}>
          {label}
        </span>
        <span className="text-sm font-semibold" style={{ color: low ? '#a3384f' : 'var(--color-ink)' }}>
          {left} of {limit} left
        </span>
      </div>
      <div className="bar mt-2">
        <span style={{ width: `${pct}%`, background: low ? '#d4674a' : 'var(--color-accent)' }} />
      </div>
    </div>
  );
}

export default function PlanPanel({
  account,
  justPaid,
}: {
  account: SubscriptionAccount;
  /** True right after PayMongo sends the browser back with checkout=success. */
  justPaid?: boolean;
}) {
  const [busy, setBusy] = useState<'checkout' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const paid = account.subscription_tier !== 'free' && account.subscription_status === 'active';
  const ends = formatPlanDate(account.subscription_ends_at);

  const upgrade = async () => {
    setBusy('checkout');
    setError(null);
    try {
      const url = await startCheckout();
      window.location.assign(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not open checkout.');
      setBusy(null);
    }
  };

  return (
    <section className="px-5 pt-14 md:px-8 md:pt-20">
      <div className="mx-auto max-w-5xl">
        <div className="card overflow-hidden">
          <div
            className="flex flex-wrap items-center justify-between gap-4 px-6 py-5 md:px-8"
            style={{ background: paid ? 'var(--color-ink)' : 'var(--color-paper-2)' }}
          >
            <div>
              <p className="eyebrow" style={{ color: paid ? '#5fd0bf' : 'var(--color-accent-deep)' }}>
                Current plan
              </p>
              <h2
                className="font-display mt-1.5 text-2xl font-extrabold tracking-tight"
                style={{ color: paid ? '#fff' : 'var(--color-ink)' }}
              >
                {tierLabel(account.subscription_tier)}
              </h2>
            </div>

            {paid ? null : (
              <Link href="/pricing" className="btn btn-ghost !py-2.5 !text-sm">
                Compare plans
              </Link>
            )}
          </div>

          <div className="px-6 py-6 md:px-8">
            {justPaid ? (
              <p
                className="mb-5 rounded-2xl px-4 py-3 text-[0.9375rem] leading-relaxed"
                style={{ background: 'var(--color-accent-soft)', color: 'var(--color-accent-deep)' }}
              >
                Payment received, thank you. If this still says Free, the confirmation from PayMongo is a few
                seconds behind. Reload the page.
              </p>
            ) : null}

            {paid ? (
              <div className="divide-y" style={{ borderColor: 'var(--color-line)' }}>
                <Row label="Status" value="Active" tone="good" />
                {ends ? <Row label="Access runs until" value={ends} /> : null}
                <Row label="Cover letters" value="Unlimited" />
                <Row label="Resume exports" value="Unlimited" />
                <Row label="Saved jobs" value="Unlimited" />
              </div>
            ) : (
              <>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Meter label="Cover letters" used={account.cover_letter_uses} limit={FREE_COVER_LETTER_LIMIT} />
                  <Meter label="Resume exports" used={account.resume_uses} limit={FREE_RESUME_LIMIT} />
                </div>
                <p className="mt-5 text-[0.9375rem] leading-relaxed" style={{ color: 'var(--color-muted)' }}>
                  These are lifetime counts, not monthly. Pro removes them and opens every premium course for ₱
                  {PRO_PRICE_PESOS}, which buys {PRO_ACCESS_DAYS} days.
                </p>
              </>
            )}

            {account.subscription_status === 'past_due' ? (
              <p className="mt-5 text-[0.9375rem] font-semibold" style={{ color: '#a3384f' }}>
                Your last payment did not go through, so paid features are off until it clears.
              </p>
            ) : null}

            {error ? (
              <p role="alert" className="mt-5 text-[0.9375rem] font-semibold" style={{ color: '#a3384f' }}>
                {error}
              </p>
            ) : null}

            <div className="mt-7 flex flex-wrap gap-3">
              {paid ? (
                <Link href="/pricing" className="btn btn-ghost">
                  What is included
                </Link>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => void upgrade()}
                    disabled={busy === 'checkout'}
                    className="btn btn-primary"
                  >
                    {busy === 'checkout' ? 'Opening checkout…' : `Upgrade to Pro, ₱${PRO_PRICE_PESOS}`}
                  </button>
                  <Link href="/pricing" className="btn btn-ghost">
                    See all plans
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
