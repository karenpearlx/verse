import Link from 'next/link';
import { hasPaidAccess, type SubscriptionAccount } from '@/lib/subscription';
import { formatPlanDate, tierLabel } from '@/lib/plans';

/**
 * Account rows under the profile form.
 *
 * The phone sheet used to carry Profile, Settings and Plans as three separate
 * buttons. It now carries one tappable account card that lands here, so this
 * is where those two destinations have to be reachable — and on a phone this
 * page is the account, not just the public-facing half of it.
 *
 * Plan state is read on the server and passed down, so this never renders a
 * tier the session does not actually have.
 */

function ChevronIcon() {
  return (
    <svg width="8" height="13" viewBox="0 0 8 13" fill="none" aria-hidden className="flex-none">
      <path
        d="M1.5 1.5 6.5 6.5l-5 5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Row({
  href,
  title,
  note,
  badge,
  icon,
}: {
  href: string;
  title: string;
  note: string;
  badge?: { text: string; good: boolean };
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="account-row flex items-center gap-4 px-5 py-4 md:px-6 md:py-5"
      style={{ color: 'var(--color-ink)' }}
    >
      <span
        aria-hidden
        className="grid h-10 w-10 flex-none place-items-center rounded-xl"
        style={{ background: 'var(--color-paper-2)', color: 'var(--color-ink-2)' }}
      >
        {icon}
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-[0.9375rem] font-semibold">{title}</span>
          {badge && (
            <span
              className="rounded-full px-2 py-0.5 text-[0.6875rem] font-bold tracking-[0.04em]"
              style={{
                background: badge.good ? 'var(--color-accent-soft)' : 'var(--color-paper-2)',
                color: badge.good ? 'var(--color-accent-deep)' : 'var(--color-muted)',
              }}
            >
              {badge.text}
            </span>
          )}
        </span>
        <span className="mt-0.5 block text-sm leading-snug" style={{ color: 'var(--color-muted)' }}>
          {note}
        </span>
      </span>

      <span style={{ color: 'var(--color-faint)' }}>
        <ChevronIcon />
      </span>
    </Link>
  );
}

export default function AccountLinks({ account }: { account: SubscriptionAccount }) {
  const paid = hasPaidAccess(account);
  const ends = formatPlanDate(account.subscription_ends_at);

  return (
    <section className="px-5 pb-20 pt-14 md:px-8 md:pb-28 md:pt-20">
      <div className="mx-auto max-w-6xl">
        <p className="eyebrow">Account</p>
        <h2 className="display-md mt-3">
          The settings behind all this<span className="dot">.</span>
        </h2>

        <div className="card mt-7 max-w-2xl overflow-hidden">
          <Row
            href="/settings"
            title="Settings"
            note="Follow-up reminders, default templates, notifications."
            icon={
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="2.15" stroke="currentColor" strokeWidth="1.5" />
                <path
                  d="M8 1.9l.9 1.5 1.7-.3.5 1.7 1.6.7-.7 1.6.7 1.6-1.6.7-.5 1.7-1.7-.3L8 14.1l-.9-1.5-1.7.3-.5-1.7-1.6-.7.7-1.6-.7-1.6 1.6-.7.5-1.7 1.7.3L8 1.9Z"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinejoin="round"
                />
              </svg>
            }
          />

          <span className="block h-px" style={{ background: 'var(--color-line)' }} />

          <Row
            href={paid ? '/settings' : '/pricing'}
            title="Plan & billing"
            badge={{ text: tierLabel(account.subscription_tier), good: paid }}
            note={
              paid
                ? ends
                  ? `Prepaid access runs to ${ends}. Details in settings.`
                  : 'See your plan in settings.'
                : 'What is included free, and what ₱199 for 30 days adds.'
            }
            icon={
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                <path
                  d="M8 1.9l1.5 3.9 3.9 1.5-3.9 1.5L8 12.7 6.5 8.8 2.6 7.3l3.9-1.5L8 1.9Z"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinejoin="round"
                />
              </svg>
            }
          />

          <span className="block h-px" style={{ background: 'var(--color-line)' }} />

          <Row
            href="/help"
            title="Help & troubleshooting"
            note="Common questions, fixes and step-by-step guides."
            icon={
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6.1" stroke="currentColor" strokeWidth="1.5" />
                <path d="M6.4 6.2a1.7 1.7 0 0 1 3.3.6c0 1.1-1.6 1.3-1.6 2.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M8 11.4h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            }
          />
        </div>
      </div>
    </section>
  );
}
