'use client';

import { useState } from 'react';
import type { AttributionResponse } from '@/lib/admin/types';

import { BarRows, Timeline } from './charts';
import { useAdminResource } from './useAdminResource';
import {
  Empty,
  ErrorState,
  Note,
  Panel,
  SectionTitle,
  Skeleton,
  Stat,
  StatStrip,
  num,
  stamp,
} from './ui';

const RANGES = [30, 90, 365] as const;

/** Centavos in, "₱1,234" out. Revenue is money, so it never renders as a bare number. */
function peso(centavos: number | null | undefined) {
  if (centavos == null) return '—';
  return `₱${new Intl.NumberFormat('en-PH', { maximumFractionDigits: 0 }).format(centavos / 100)}`;
}

export default function AttributionSection() {
  const [days, setDays] = useState<number>(90);
  const { data, error, loading, refreshing, reload } = useAdminResource<AttributionResponse>(
    `/api/admin/attribution?days=${days}`,
  );

  const historyMissing = data?.provisioning.missing.includes('subscription_history');

  return (
    <div className="ad-fade space-y-5">
      <SectionTitle
        index="02 / Revenue"
        title="Who pays, and where they came from"
        sub="Every row is a real PayMongo payment recorded by the webhook — nothing here is estimated. Sources are what people picked at signup under 'where did you hear about us'."
      />

      <div className="flex flex-wrap items-center gap-2">
        {RANGES.map((range) => (
          <button
            key={range}
            type="button"
            className="ad-btn"
            data-variant={days === range ? 'primary' : undefined}
            onClick={() => setDays(range)}
          >
            Last {range} days
          </button>
        ))}
        <button type="button" className="ad-btn ml-auto" onClick={reload} disabled={refreshing}>
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {error ? <ErrorState message={error} onRetry={reload} /> : null}

      {loading && !data ? (
        <div className="ad-panel p-5">
          <Skeleton rows={5} />
        </div>
      ) : null}

      {historyMissing ? (
        <Note tone="warn">
          <p className="font-semibold" style={{ color: 'var(--ad-warn)' }}>
            No payment history table yet
          </p>
          <p className="mt-1">
            The <code className="ad-mono">subscription_history</code> table does not exist, so revenue
            shows blank rather than zero. Run the billing migration in the Supabase SQL editor and this
            fills in on the next refresh.
          </p>
        </Note>
      ) : null}

      {data?.sourcesMissing ? (
        <Note tone="warn">
          <p className="font-semibold" style={{ color: 'var(--ad-warn)' }}>
            Signup sources are not being stored yet
          </p>
          <p className="mt-1">
            Run <code className="ad-mono">supabase/migrations/20261005000000_referral_source.sql</code> in
            the Supabase SQL editor. Conversions still count; the &ldquo;where they came from&rdquo;
            breakdown starts filling in from the next signup.
          </p>
        </Note>
      ) : null}

      {data ? (
        <>
          <StatStrip cols={5}>
            <Stat
              label="Revenue"
              value={historyMissing ? '—' : peso(data.totals.revenueCentavos)}
              foot={`Last ${data.rangeDays} days`}
            />
            <Stat
              label="Pro conversions"
              value={historyMissing ? '—' : num(data.totals.conversions)}
              foot={`${num(data.totals.conversions7d)} in the last 7 days`}
            />
            <Stat label="Paying right now" value={num(data.totals.payingNow)} foot="Active Pro or Creator" />
            <Stat label="Accounts" value={num(data.totals.signups)} foot="All signups, all time" />
            <Stat
              label="Told us their source"
              value={num(data.totals.answeredSource)}
              foot="Answered the signup question"
            />
          </StatStrip>

          <Panel title="Conversions over time" hint="Each bar is a day; the count is paid checkouts.">
            <Timeline
              data={data.timeline.map((point) => ({
                date: point.date,
                views: point.conversions,
                sessions: 0,
              }))}
              primaryLabel="Pro conversions"
            />
          </Panel>

          <div className="grid gap-5 xl:grid-cols-2">
            <Panel title="Who converted" hint="Most recent first." flush>
              {data.conversions.length ? (
                <div className="ad-scroll">
                  <table className="ad-table ad-stack">
                    <thead>
                      <tr>
                        <th>Account</th>
                        <th>When</th>
                        <th className="ad-right">Paid</th>
                        <th>Heard about us</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.conversions.map((row, i) => (
                        <tr key={`${row.email ?? 'unknown'}-${row.occurredAt}-${i}`}>
                          <td className="ad-mono max-w-[14rem] truncate" data-label="Account" title={row.email ?? ''}>
                            {row.email ?? '(account deleted)'}
                          </td>
                          <td data-label="When">{stamp(row.occurredAt)}</td>
                          <td className="ad-right font-semibold" data-label="Paid">
                            {peso(row.amount)}
                          </td>
                          <td data-label="Heard about us">{row.source ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Empty>No paid checkouts in this range yet.</Empty>
              )}
            </Panel>

            <Panel
              title="Where signups come from"
              hint="All accounts by self-reported source; the count on the right is signups, the note under each bar is how many of them went Pro."
            >
              <BarRows
                rows={data.sources.map((row) => ({
                  label: row.source,
                  value: row.signups,
                  hint: row.conversions
                    ? `${num(row.conversions)} converted to Pro (${Math.round((row.conversions / Math.max(row.signups, 1)) * 100)}%)`
                    : undefined,
                }))}
                emptyText={
                  data.sourcesMissing
                    ? 'Run the referral_source migration to start collecting this.'
                    : 'Nobody has answered the signup question yet.'
                }
              />
            </Panel>
          </div>
        </>
      ) : null}
    </div>
  );
}
