'use client';

import Link from 'next/link';
import { useState } from 'react';
import { PLANS, PRO_ACCESS_DAYS, type Plan } from '@/lib/plans';
import { startCheckout, useSubscription } from '@/lib/useSubscription';

function Tick({ dark }: { dark?: boolean }) {
  return (
    <svg width="15" height="12" viewBox="0 0 15 12" fill="none" aria-hidden className="mt-1 flex-none">
      <path
        d="M1.4 6.1 5.2 9.9 13.4 1.7"
        stroke={dark ? '#5fd0bf' : 'var(--color-accent)'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Spinner() {
  return (
    <span
      aria-hidden
      className="inline-block h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent"
      style={{ animation: 'ally-spin .7s linear infinite', opacity: 0.7 }}
    />
  );
}

/** The one button that changes with who is looking at it. */
function PlanAction({
  plan,
  authed,
  currentTier,
  hasPaidAccess,
}: {
  plan: Plan;
  authed: boolean;
  currentTier: string | null;
  hasPaidAccess: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Creator applications are paused until there is time to run them properly.
  if (plan.id === 'creator') {
    return (
      <p
        className="mt-7 rounded-full px-4 py-3 text-center text-sm font-semibold"
        style={{ background: 'var(--color-paper-2)', color: 'var(--color-muted)' }}
      >
        Coming soon
      </p>
    );
  }

  if (plan.id === 'free') {
    if (!authed) {
      return (
        <Link href="/signup" className="btn btn-ghost mt-7 w-full">
          Create a free account
        </Link>
      );
    }
    return (
      <p
        className="mt-7 rounded-full px-4 py-3 text-center text-sm font-semibold"
        style={{ background: 'var(--color-paper-2)', color: 'var(--color-muted)' }}
      >
        {hasPaidAccess ? 'Included in your plan' : 'Your current plan'}
      </p>
    );
  }

  // Pro.
  if (hasPaidAccess) {
    return (
      <p
        className="mt-7 rounded-full px-4 py-3 text-center text-sm font-semibold"
        style={{ background: 'rgba(95,208,191,0.16)', color: '#5fd0bf' }}
      >
        {currentTier === 'creator' ? 'Included in Creator' : 'Your current plan'}
      </p>
    );
  }

  if (!authed) {
    return (
      <Link href="/login?next=/pricing" className="btn btn-primary mt-7 w-full">
        Sign in to upgrade
      </Link>
    );
  }

  const upgrade = async () => {
    setBusy(true);
    setError(null);
    try {
      const url = await startCheckout();
      window.location.assign(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not open checkout.');
      setBusy(false);
    }
  };

  return (
    <>
      <button type="button" onClick={() => void upgrade()} disabled={busy} className="btn btn-primary mt-7 w-full">
        {busy ? (
          <>
            <Spinner /> Opening checkout…
          </>
        ) : (
          'Upgrade to Pro'
        )}
      </button>
      {error ? (
        <p role="alert" className="mt-3 text-[0.8125rem] leading-relaxed" style={{ color: '#ff9d8a' }}>
          {error}
        </p>
      ) : null}
    </>
  );
}

function Card({
  plan,
  authed,
  currentTier,
  hasPaidAccess,
}: {
  plan: Plan;
  authed: boolean;
  currentTier: string | null;
  hasPaidAccess: boolean;
}) {
  const dark = Boolean(plan.featured);
  const isCurrent = authed && (hasPaidAccess ? currentTier === plan.id : plan.id === 'free');

  return (
    <div
      className="relative flex h-full flex-col p-7 md:p-8"
      style={
        dark
          ? { background: 'var(--color-ink)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-float)' }
          : {
              background: 'var(--color-surface)',
              border: '1px solid var(--color-line)',
              borderRadius: 'var(--radius-card)',
            }
      }
    >
      <div className="flex items-center gap-2.5">
        <h2
          className="font-display text-lg font-extrabold uppercase tracking-[0.12em]"
          style={{ color: dark ? '#5fd0bf' : 'var(--color-accent-deep)' }}
        >
          {plan.name}
        </h2>
        {isCurrent ? (
          <span
            className="rounded-full px-2.5 py-1 text-[0.6875rem] font-bold uppercase tracking-[0.08em]"
            style={
              dark
                ? { background: 'rgba(95,208,191,0.18)', color: '#5fd0bf' }
                : { background: 'var(--color-accent-soft)', color: 'var(--color-accent-deep)' }
            }
          >
            Current
          </span>
        ) : null}
      </div>

      <p className="mt-5 flex items-baseline gap-2">
        <span
          className="font-display text-[2.75rem] font-extrabold leading-none tracking-tight"
          style={{ color: dark ? '#fff' : 'var(--color-ink)' }}
        >
          {plan.price ?? 'Soon'}
        </span>
        <span className="text-sm" style={{ color: dark ? '#a9a6a1' : 'var(--color-faint)' }}>
          {plan.cadence}
        </span>
      </p>

      <p
        className="mt-4 text-[0.9375rem] leading-relaxed"
        style={{ color: dark ? '#a9a6a1' : 'var(--color-muted)' }}
      >
        {plan.blurb}
      </p>

      <ul className="mt-7 space-y-3">
        {plan.features.map((f) => (
          <li key={f} className="flex gap-3 text-[0.9375rem] leading-snug">
            <Tick dark={dark} />
            <span style={{ color: dark ? '#e8e6e3' : 'var(--color-ink-2)' }}>{f}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto">
        <PlanAction plan={plan} authed={authed} currentTier={currentTier} hasPaidAccess={hasPaidAccess} />
      </div>
    </div>
  );
}

export default function PlanCards() {
  const { status, data } = useSubscription();
  const authed = status === 'ready';
  const hasPaidAccess = Boolean(data?.has_paid_access);
  const currentTier = data?.subscription_tier ?? null;

  return (
    <>
      <div className="grid gap-5 lg:grid-cols-3 lg:items-stretch">
        {PLANS.map((plan) => (
          <Card
            key={plan.id}
            plan={plan}
            authed={authed}
            currentTier={currentTier}
            hasPaidAccess={hasPaidAccess}
          />
        ))}
      </div>

      <p className="mt-6 text-sm leading-relaxed" style={{ color: 'var(--color-faint)' }}>
        Card, GCash and Maya, through PayMongo. One Pro payment buys {PRO_ACCESS_DAYS} days of access and does not
        renew itself, so nothing is charged again unless you come back and pay for another month.
      </p>
    </>
  );
}
