'use client';

import { useCallback, useEffect, useState } from 'react';
import type { UserRow, UsersResponse } from '@/lib/admin/types';
import { BarRows, Timeline } from './charts';
import { useAdminResource } from './useAdminResource';
import {
  Dialog,
  Empty,
  ErrorState,
  Note,
  Panel,
  SectionTitle,
  Skeleton,
  Stat,
  StatStrip,
  Tag,
  num,
  stamp,
  when,
} from './ui';

export default function UsersSection() {
  const [term, setTerm] = useState('');
  const [query, setQuery] = useState('');

  // The field is debounced rather than wired to a submit button: typing an
  // email and waiting is the whole interaction, and a stray Enter should not
  // be the difference between a search and nothing happening.
  useEffect(() => {
    const id = setTimeout(() => setQuery(term.trim()), 300);
    return () => clearTimeout(id);
  }, [term]);

  const { data, error, loading, refreshing, reload } = useAdminResource<UsersResponse>(
    `/api/admin/users${query ? `?q=${encodeURIComponent(query)}` : ''}`,
  );

  const [target, setTarget] = useState<UserRow | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [planBusy, setPlanBusy] = useState<string | null>(null);

  const openModeration = useCallback((user: UserRow) => {
    setActionError(null);
    setReason(user.suspendedReason ?? '');
    setTarget(user);
  }, []);

  const togglePlan = async (user: UserRow) => {
    const newPlan = user.plan === 'pro' ? 'free' : 'pro';
    setPlanBusy(user.id);
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ plan: newPlan }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error ?? `Failed with ${response.status}.`);
      reload();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Could not update plan.');
    } finally {
      setPlanBusy(null);
    }
  };

  const applyModeration = async () => {
    if (!target) return;
    const next = target.status === 'suspended' ? 'active' : 'suspended';
    setBusy(true);
    setActionError(null);
    try {
      const response = await fetch(`/api/admin/users/${target.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ status: next, reason: next === 'suspended' ? reason : null }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error ?? `Failed with ${response.status}.`);
      setTarget(null);
      reload();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Could not update that account.');
    } finally {
      setBusy(false);
    }
  };

  const suspending = target?.status !== 'suspended';

  return (
    <div className="ad-fade space-y-5">
      <SectionTitle
        index="04 / People"
        title="Who is using Verse"
        sub="Signups, activity, and what each account has saved. A dash means the table behind that number does not exist yet, which is different from a zero."
      />

      <div className="flex flex-wrap items-center gap-2">
        <div className="ad-search">
          <input
            className="ad-input"
            type="search"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Search by email"
            aria-label="Search accounts by email"
          />
        </div>
        <button type="button" className="ad-btn ml-auto" onClick={reload} disabled={refreshing}>
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {error ? <ErrorState message={error} onRetry={reload} /> : null}

      {loading && !data ? (
        <div className="ad-panel p-5">
          <Skeleton rows={4} />
        </div>
      ) : null}

      {data ? (
        <>
          {data.provisioning.missing.length ? (
            <Note tone="warn">
              <p className="font-semibold" style={{ color: 'var(--ad-warn)' }}>
                Some tables are missing
              </p>
              <p className="mt-1">
                Not created yet:{' '}
                {data.provisioning.missing.map((table, index) => (
                  <span key={table}>
                    {index > 0 ? ', ' : ''}
                    <code className="ad-mono">{table}</code>
                  </span>
                ))}
                . Run <code className="ad-mono">supabase/schema.sql</code> in the SQL editor and these fill in on
                the next refresh.
              </p>
            </Note>
          ) : null}

          <StatStrip cols={4}>
            <Stat label="Total accounts" value={num(data.totals.users)} />
            <Stat
              label="New in 7 days"
              value={num(data.totals.signups7d)}
              foot={`${num(data.totals.signups30d)} in the last 30`}
            />
            <Stat label="Active in 7 days" value={num(data.totals.active7d)} foot="Touched an application" />
            <Stat label="Applications tracked" value={num(data.totals.applications)} />
          </StatStrip>

          <StatStrip cols={4}>
            <Stat label="Resumes saved" value={num(data.totals.resumes)} />
            <Stat label="Cover letters saved" value={num(data.totals.coverLetters)} />
            <Stat label="Suspended" value={num(data.totals.suspended)} foot="Read-only accounts" />
            <Stat
              label="Applications per account"
              value={
                data.totals.applications != null && data.totals.users
                  ? (data.totals.applications / data.totals.users).toFixed(1)
                  : '—'
              }
              foot="Average across everybody"
            />
          </StatStrip>

          <div className="grid gap-5 xl:grid-cols-2">
            <Panel title="Signups" hint="Last 30 days.">
              {data.signupTimeline.length ? (
                <Timeline
                  data={data.signupTimeline.map((point) => ({
                    date: point.date,
                    views: point.count,
                    sessions: 0,
                  }))}
                  primaryLabel="Signups"
                  height={140}
                />
              ) : (
                <Empty>No signup data yet.</Empty>
              )}
            </Panel>

            <Panel title="Applications by status">
              <BarRows
                rows={data.applicationsByStatus.map((row) => ({ label: row.status, value: row.count }))}
                emptyText="No applications tracked yet."
              />
            </Panel>
          </div>

          <Panel
            title={query ? `Accounts matching “${query}”` : 'Accounts'}
            hint={
              data.matched
                ? `${num(Math.min(data.matched, data.users.length))} shown of ${num(data.matched)}. Newest first.`
                : undefined
            }
            flush
          >
            {!data.moderation ? (
              <div className="p-4 pb-0 sm:p-5 sm:pb-0">
                <Note tone="warn">
                  Suspending is switched off. <code className="ad-mono">public.users</code> has no{' '}
                  <code className="ad-mono">status</code> column yet. Run{' '}
                  <code className="ad-mono">supabase/2026-08-04-admin-hardening.sql</code> to turn it on.
                </Note>
              </div>
            ) : null}

            {data.users.length ? (
              <div className="ad-scroll">
                <table className="ad-table ad-stack">
                  <thead>
                    <tr>
                      <th>Account</th>
                      <th>Joined</th>
                      <th className="ad-right">Apps</th>
                      <th className="ad-right">Resumes</th>
                      <th className="ad-right">Letters</th>
                      <th>Plan</th>
                      <th className="ad-right">Manage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.users.map((user) => (
                      <tr key={user.id} data-suspended={user.status === 'suspended'}>
                        <td data-label="Account">
                          <span className="block max-w-[18rem] truncate font-semibold" style={{ color: 'var(--color-ink)' }}>
                            {user.email ?? 'No email on file'}
                          </span>
                          <span className="mt-1 flex flex-wrap items-center gap-1.5">
                            {user.status === 'suspended' ? <Tag tone="bad">Suspended</Tag> : null}
                            <span className="ad-mono text-xs" style={{ color: 'var(--color-faint)' }}>
                              {user.id.slice(0, 8)}
                            </span>
                          </span>
                          {user.suspendedReason ? (
                            <span className="mt-1 block max-w-sm text-xs" style={{ color: 'var(--ad-bad)' }}>
                              {user.suspendedReason}
                            </span>
                          ) : null}
                        </td>
                        <td data-label="Joined">
                          {stamp(user.joinedAt)}
                          <span className="block text-xs" style={{ color: 'var(--color-faint)' }}>
                            last write {when(user.lastActiveAt)}
                          </span>
                        </td>
                        <td className="ad-right font-semibold" data-label="Apps">
                          {num(user.applications)}
                        </td>
                        <td className="ad-right" data-label="Resumes">
                          {num(user.resumes)}
                        </td>
                        <td className="ad-right" data-label="Letters">
                          {num(user.coverLetters)}
                        </td>
                        <td data-label="Plan">
                          <div className="flex items-center gap-2">
                            <Tag tone={user.plan === 'pro' ? 'good' : user.plan === 'creator' ? 'good' : undefined}>
                              {user.plan === 'pro' ? 'Pro' : user.plan === 'creator' ? 'Creator' : 'Free'}
                            </Tag>
                            <button
                              type="button"
                              className="ad-btn"
                              style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                              disabled={planBusy === user.id}
                              onClick={() => togglePlan(user)}
                            >
                              {planBusy === user.id ? '...' : user.plan === 'pro' ? '→ Free' : '→ Pro'}
                            </button>
                          </div>
                        </td>
                        <td className="ad-right" data-label="Manage">
                          <button
                            type="button"
                            className="ad-btn"
                            data-variant={user.status === 'suspended' ? undefined : 'danger'}
                            disabled={!data.moderation}
                            title={data.moderation ? undefined : 'Run the moderation SQL first'}
                            onClick={() => openModeration(user)}
                          >
                            {user.status === 'suspended' ? 'Restore' : 'Suspend'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty>{query ? 'No account matches that email.' : 'No accounts yet.'}</Empty>
            )}
          </Panel>
        </>
      ) : null}

      <Dialog
        open={Boolean(target)}
        title={suspending ? 'Suspend this account?' : 'Restore this account?'}
        onClose={() => (busy ? undefined : setTarget(null))}
        footer={
          <>
            <button type="button" className="ad-btn" onClick={() => setTarget(null)} disabled={busy}>
              Cancel
            </button>
            <button
              type="button"
              className="ad-btn"
              data-variant={suspending ? 'danger' : 'primary'}
              onClick={applyModeration}
              disabled={busy}
            >
              {busy ? 'Working…' : suspending ? 'Suspend' : 'Restore'}
            </button>
          </>
        }
      >
        <p className="text-sm leading-relaxed" style={{ color: 'var(--color-ink-2)' }}>
          <strong>{target?.email ?? target?.id}</strong>
        </p>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-ink-2)' }}>
          {suspending
            ? 'They keep everything they have saved and can still sign in and read. Every write is refused: no new applications, resumes or letters. It is reversible, and it is not a deletion — removing an account for real is a Supabase dashboard job.'
            : 'Writing is switched back on immediately. Nothing they saved was touched while they were suspended.'}
        </p>
        {suspending ? (
          <div className="mt-4">
            <label className="ad-micro" htmlFor="suspend-reason">
              Reason, for your own records
            </label>
            <input
              id="suspend-reason"
              className="ad-input mt-1.5"
              value={reason}
              maxLength={300}
              onChange={(event) => setReason(event.target.value)}
              placeholder="e.g. spam applications"
            />
          </div>
        ) : null}
        {actionError ? (
          <div className="mt-3">
            <ErrorState message={actionError} />
          </div>
        ) : null}
      </Dialog>
    </div>
  );
}
