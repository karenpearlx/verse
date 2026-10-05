'use client';

import { useState, useSyncExternalStore } from 'react';
import { createClient } from '@/lib/supabase/client';
import { readOptOut, subscribeOptOut, writeOptOut } from '@/lib/admin/privacy';
import HealthPanel from './HealthPanel';
import { Note, Panel, SectionTitle, Switch, stamp } from './ui';

export default function SettingsSection({
  email,
  lastSignInAt,
}: {
  email: string;
  lastSignInAt: string | null;
}) {
  // Read straight from the browser rather than mirroring it into an effect, so
  // the toggle cannot flash the wrong state on load.
  const optOut = useSyncExternalStore(subscribeOptOut, readOptOut, () => false);
  const ready = useSyncExternalStore(subscribeOptOut, () => true, () => false);
  const [signingOut, setSigningOut] = useState(false);
  const [privacyBusy, setPrivacyBusy] = useState(false);
  const [privacyError, setPrivacyError] = useState<string | null>(null);
  const [resetBusy, setResetBusy] = useState(false);
  const [resetResult, setResetResult] = useState<{ success?: boolean; message?: string; error?: string } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const setExcluded = async (next: boolean) => {
    setPrivacyBusy(true);
    setPrivacyError(null);
    try {
      const response = await fetch('/api/admin/analytics/exclude', {
        method: next ? 'POST' : 'DELETE',
        credentials: 'same-origin',
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error ?? 'Could not update analytics exclusion.');
      writeOptOut(next);
    } catch (error) {
      setPrivacyError(error instanceof Error ? error.message : 'Could not update analytics exclusion.');
    } finally {
      setPrivacyBusy(false);
    }
  };

  const signOut = async () => {
    setSigningOut(true);
    try {
      await createClient().auth.signOut();
    } finally {
      window.location.href = '/admin/login';
    }
  };

  const resetAnalytics = async () => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    setResetBusy(true);
    setResetResult(null);
    try {
      const response = await fetch('/api/admin/analytics/reset', {
        method: 'POST',
        credentials: 'same-origin',
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setResetResult({ error: payload?.error ?? 'Failed to reset analytics.' });
      } else {
        setResetResult({ success: true, message: payload?.message ?? 'Analytics cleared.' });
      }
    } catch (error) {
      setResetResult({ error: error instanceof Error ? error.message : 'Failed to reset analytics.' });
    } finally {
      setResetBusy(false);
      setConfirmReset(false);
    }
  };

  return (
    <div className="ad-fade space-y-5">
      <SectionTitle
        index="06 / Settings"
        title="Access and privacy"
        sub="What is wired up, what is not, who is signed in, and how this browser is treated by the analytics you are looking at."
      />

      <HealthPanel />

      <Panel title="Reset analytics data">
        <p className="text-sm leading-relaxed" style={{ color: 'var(--color-ink-2)' }}>
          This permanently deletes all page views, clicks, searches, and other analytics events from the database.
          Use this to start fresh or clear test data before launch.
        </p>
        {resetResult?.error && (
          <p role="alert" className="mt-3 text-sm" style={{ color: 'var(--ad-bad)' }}>{resetResult.error}</p>
        )}
        {resetResult?.success && (
          <p role="status" className="mt-3 text-sm" style={{ color: 'var(--ad-good)' }}>{resetResult.message}</p>
        )}
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            className="ad-btn"
            data-variant="danger"
            onClick={resetAnalytics}
            disabled={resetBusy}
          >
            {resetBusy ? 'Clearing…' : confirmReset ? 'Click again to confirm' : 'Clear all analytics'}
          </button>
          {confirmReset && !resetBusy && (
            <button
              type="button"
              className="ad-btn"
              onClick={() => setConfirmReset(false)}
            >
              Cancel
            </button>
          )}
        </div>
      </Panel>

      <Panel title="Exclude this device from analytics">
        <Switch
          checked={optOut}
          onChange={(next) => { void setExcluded(next); }}
          label={
            !ready
              ? 'Checking this device…'
              : privacyBusy
                ? 'Updating exclusion…'
                : optOut
                ? 'This browser is excluded'
                : 'This browser is being counted'
          }
        />
        {privacyError ? <p role="alert" className="mt-3 text-sm" style={{ color: 'var(--ad-bad)' }}>{privacyError}</p> : null}
        <div className="mt-4 space-y-3 text-sm leading-relaxed" style={{ color: 'var(--color-ink-2)' }}>
          <p>
            Your own visits inflate every number on the analytics tab, especially early on when traffic is small.
            Turning this on writes a flag to this browser so events are dropped before they are sent.
          </p>
          <p>
            It is per-browser, not per-person. Clearing site data or switching to your phone turns counting back
            on, so set it again there. Pages under /admin are never tracked, and a browser sending Do Not Track
            or Global Privacy Control is ignored regardless of this switch.
          </p>
        </div>
        <Note>
          <strong>On IP addresses:</strong> Verse never stores the raw address. Exclusions use a keyed one-way hash,
          and visitor history uses a separate random browser identifier that is hashed before it reaches the database.
          Event tracking does not collect form values, emails, or phone numbers.
        </Note>
      </Panel>

      <Panel title="Signed in as">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="ad-micro">Admin account</dt>
            <dd className="mt-1 text-sm font-semibold">{email}</dd>
          </div>
          <div>
            <dt className="ad-micro">Last sign in</dt>
            <dd className="mt-1 text-sm">{stamp(lastSignInAt)}</dd>
          </div>
        </dl>
        <p className="mt-4 text-sm leading-relaxed" style={{ color: 'var(--color-ink-2)' }}>
          Admin access is checked on the server against a Supabase session and an email allowlist held in the{' '}
          <code className="ad-mono">ADMIN_EMAILS</code> environment variable. Nothing on this page is gated by
          client-side JavaScript alone, so editing the bundle does not get anybody in.
        </p>
        <button type="button" className="ad-btn mt-4" data-variant="danger" onClick={signOut} disabled={signingOut}>
          {signingOut ? 'Signing out…' : 'Sign out'}
        </button>
      </Panel>
    </div>
  );
}
