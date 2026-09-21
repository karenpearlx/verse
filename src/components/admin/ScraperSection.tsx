'use client';

import { useState } from 'react';
import type { ScraperResponse, ScraperRun } from '@/lib/admin/types';
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

function duration(ms: number | null) {
  if (ms == null || ms < 0) return '—';
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${String(seconds % 60).padStart(2, '0')}s`;
}

function RunStatus({ status }: { status: ScraperRun['status'] }) {
  if (status === 'success') return <Tag tone="good">Finished</Tag>;
  if (status === 'running') return <Tag tone="warn">Running</Tag>;
  if (status === 'stalled') return <Tag tone="bad">Abandoned</Tag>;
  return <Tag tone="bad">Failed</Tag>;
}

export default function ScraperSection() {
  const [live, setLive] = useState(false);
  // Poll hard while something is in flight, gently the rest of the time.
  const { data, error, loading, refreshing, reload } = useAdminResource<ScraperResponse>(
    '/api/admin/scraper',
    live ? 3_000 : 30_000,
  );

  const [confirming, setConfirming] = useState(false);
  const [openRun, setOpenRun] = useState<ScraperRun | null>(null);
  const [busy, setBusy] = useState(false);
  const [triggerError, setTriggerError] = useState<string | null>(null);

  const running = data?.running ?? null;
  // Derived, not stored: the poll rate follows the server's view of the world,
  // so a run started from another tab speeds this one up too.
  if (Boolean(running) !== live) setLive(Boolean(running));

  const lastFinished = data?.runs.find((run) => run.status !== 'running');

  const trigger = async () => {
    setBusy(true);
    setTriggerError(null);
    try {
      // Returns as soon as the run row exists. The scrape itself keeps going
      // on the server, so closing this tab no longer kills it.
      const response = await fetch('/api/admin/scrape', { method: 'POST', credentials: 'same-origin' });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error ?? `Failed with ${response.status}.`);
      setConfirming(false);
      setLive(true);
      reload();
    } catch (cause) {
      setTriggerError(cause instanceof Error ? cause.message : 'Could not start the scrape.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ad-fade space-y-5">
      <SectionTitle
        index="02 / Scraper"
        title="Where the jobs come from"
        sub="Counts and timestamps are counted in the database itself, so they show what actually landed, not what a run claimed to do."
      />

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="ad-btn"
          data-variant="primary"
          onClick={() => setConfirming(true)}
          disabled={busy || Boolean(running)}
        >
          {busy ? 'Starting…' : running ? 'Scrape in progress' : 'Run scraper now'}
        </button>
        <button type="button" className="ad-btn" onClick={reload} disabled={refreshing}>
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
        {running ? (
          <span className="ad-live">
            <span className="ad-pulse" aria-hidden />
            Live, started {when(running.startedAt)}
          </span>
        ) : null}
        <span className="ml-auto text-xs" style={{ color: 'var(--color-faint)' }}>
          {running ? 'Updating every 3s' : 'Updating every 30s'}
        </span>
      </div>

      {error ? <ErrorState message={error} onRetry={reload} /> : null}
      {triggerError ? <ErrorState message={triggerError} /> : null}
      {data?.problem ? <Note tone="warn">{data.problem}</Note> : null}

      {loading && !data ? (
        <div className="ad-panel p-5">
          <Skeleton rows={4} />
        </div>
      ) : null}

      {data ? (
        <>
          {data.provisioning.missing.includes('scraper_runs') ? (
            <Note tone="warn">
              Run history is not being kept. The <code className="ad-mono">scraper_runs</code> table does not
              exist yet, so the job counts below are real but nothing can be triggered from here. Apply{' '}
              <code className="ad-mono">supabase/admin-schema.sql</code> to start logging runs.
            </Note>
          ) : null}

          {data.strays.length ? (
            <Note tone="warn">
              <p className="font-semibold" style={{ color: 'var(--ad-warn)' }}>
                Something else is writing to this database
              </p>
              <p className="mt-1">
                {data.strays.map((stray) => (
                  <span key={stray.source} className="block">
                    <code className="ad-mono">{stray.source}</code> — {num(stray.jobCount)} listings, newest{' '}
                    {when(stray.lastScrapedAt)}
                  </span>
                ))}
              </p>
              <p className="mt-2">
                These use a source name Verse does not scrape today (for example an old Indeed import). Stale
                leftovers are harmless. Only worry if a weird source keeps getting <em>new</em> listings —
                that can mean another old cron is still pointed at this same database.
              </p>
            </Note>
          ) : null}

          <StatStrip cols={4}>
            <Stat label="Jobs indexed" value={num(data.totalJobs)} foot="Across every source" />
            {data.sources.map((source) => (
              <Stat
                key={source.key}
                label={source.label}
                value={num(source.jobCount)}
                foot={
                  source.enabled
                    ? `${num(source.activeCount)} live · scraped ${when(source.lastScrapedAt)}`
                    : 'Not configured'
                }
              />
            ))}
          </StatStrip>

          {running ? (
            <Panel
              title="Run in progress"
              hint="Output as the scraper produces it, refreshed every few seconds."
              flush
            >
              <pre className="ad-log">{running.message?.trim() || 'Waiting for the first line of output…'}</pre>
            </Panel>
          ) : lastFinished ? (
            <Panel
              title="Last run"
              hint={`${stamp(lastFinished.startedAt)} · took ${duration(lastFinished.durationMs)}`}
              action={<RunStatus status={lastFinished.status} />}
              flush
            >
              <pre className="ad-log">{lastFinished.message?.trim() || 'No output recorded.'}</pre>
            </Panel>
          ) : null}

          <Panel title="Sources" flush>
            <div className="ad-scroll">
              <table className="ad-table ad-stack">
                <thead>
                  <tr>
                    <th>Source</th>
                    <th>Status</th>
                    <th className="ad-right">Jobs</th>
                    <th className="ad-right">Live</th>
                    <th className="ad-right">Last scrape</th>
                    <th className="ad-right">Newest posting</th>
                  </tr>
                </thead>
                <tbody>
                  {data.sources.map((source) => (
                    <tr key={source.key}>
                      <td data-label="Source">
                        <span className="font-semibold" style={{ color: 'var(--color-ink)' }}>
                          {source.label}
                        </span>
                        {source.note ? (
                          <p className="mt-1 max-w-md text-xs leading-snug" style={{ color: 'var(--color-muted)' }}>
                            {source.note}
                          </p>
                        ) : null}
                      </td>
                      <td data-label="Status">
                        {source.enabled ? <Tag tone="good">Active</Tag> : <Tag tone="warn">Needs a token</Tag>}
                      </td>
                      <td className="ad-right font-semibold" data-label="Jobs">
                        {num(source.jobCount)}
                      </td>
                      <td className="ad-right" data-label="Live">
                        {num(source.activeCount)}
                      </td>
                      <td className="ad-right" data-label="Last scrape">
                        {when(source.lastScrapedAt)}
                      </td>
                      <td className="ad-right" data-label="Newest posting">
                        {when(source.newestPostedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel title="Recent runs" hint="Newest first. Open one to read its log." flush>
            {data.runs.length ? (
              <div className="ad-scroll">
                <table className="ad-table ad-stack">
                  <thead>
                    <tr>
                      <th>Started</th>
                      <th>Status</th>
                      <th className="ad-right">Jobs</th>
                      <th className="ad-right">Took</th>
                      <th className="ad-right">Log</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.runs.map((run) => (
                      <tr key={run.id}>
                        <td data-label="Started">{stamp(run.startedAt)}</td>
                        <td data-label="Status">
                          <RunStatus status={run.status} />
                        </td>
                        <td className="ad-right font-semibold" data-label="Jobs">
                          {num(run.jobCount)}
                        </td>
                        <td className="ad-right" data-label="Took">
                          {duration(run.durationMs)}
                        </td>
                        <td className="ad-right" data-label="Log">
                          <button
                            type="button"
                            className="ad-btn"
                            onClick={() => setOpenRun(run)}
                            disabled={!run.message}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty>No runs logged yet.</Empty>
            )}
          </Panel>
        </>
      ) : null}

      <Dialog
        open={confirming}
        title="Run the scraper?"
        onClose={() => (busy ? undefined : setConfirming(false))}
        footer={
          <>
            <button type="button" className="ad-btn" onClick={() => setConfirming(false)} disabled={busy}>
              Cancel
            </button>
            <button type="button" className="ad-btn" data-variant="primary" onClick={trigger} disabled={busy}>
              {busy ? 'Starting…' : 'Yes, run it'}
            </button>
          </>
        }
      >
        <p className="text-sm leading-relaxed" style={{ color: 'var(--color-ink-2)' }}>
          This hits OnlineJobs.ph, RemoteOK, and We Work Remotely live and upserts what it finds. Existing listings are updated
          rather than duplicated. It runs on the server, so you can close this tab and the log will still be
          here when you come back. Both sites rate-limit, so avoid firing it repeatedly.
        </p>
      </Dialog>

      <Dialog open={Boolean(openRun)} title="Run log" onClose={() => setOpenRun(null)}>
        <pre className="ad-log" style={{ borderRadius: 12 }}>
          {openRun?.message?.trim() || 'No output recorded.'}
        </pre>
      </Dialog>
    </div>
  );
}
