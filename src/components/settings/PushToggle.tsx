'use client';

import { useEffect, useState } from 'react';
import { disablePush, enablePush, pushState, type PushState } from '@/lib/push';

/**
 * The "new job alerts on this device" switch.
 *
 * Deliberately NOT part of the settings draft/save cycle: a push subscription
 * is a browser-level fact, not a preference row, and it needs a user gesture
 * for the permission prompt. So it applies instantly, per device.
 */
export default function PushToggle() {
  const [state, setState] = useState<PushState | 'loading'>('loading');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    void pushState().then((s) => {
      if (alive) setState(s);
    });
    return () => {
      alive = false;
    };
  }, []);

  const on = state === 'on';
  const disabled = busy || state === 'loading' || state === 'unsupported' || state === 'denied';

  const toggle = async () => {
    setBusy(true);
    setNote(null);
    try {
      if (on) {
        await disablePush();
        setState('off');
        setNote('This device will no longer get job alerts.');
      } else {
        const result = await enablePush();
        if (result.ok) {
          setState('on');
          setNote('On — a test notification is on its way to this device.');
        } else {
          setNote(result.reason ?? 'Could not turn alerts on.');
          setState(await pushState());
        }
      }
    } finally {
      setBusy(false);
    }
  };

  const title =
    state === 'loading'
      ? 'Checking this device…'
      : state === 'unsupported'
        ? 'Job alerts are not available in this browser'
        : state === 'denied'
          ? 'Notifications are blocked in your browser settings'
          : on
            ? 'New-job alerts are on for this device'
            : 'New-job alerts are off';

  const blurb =
    state === 'unsupported'
      ? 'On iPhone, add Verse to your home screen first (Share → Add to Home Screen), then this switch works.'
      : state === 'denied'
        ? 'Allow notifications for vrsfd.com in the browser, then flip this switch.'
        : on
          ? 'One notification a day when new jobs land, with the count. No marketing, ever.'
          : 'Get one notification a day when new VA jobs land. Works even when the site is closed.';

  return (
    <div className="mt-3">
      <button
        type="button"
        role="switch"
        aria-checked={on}
        disabled={disabled && !on}
        onClick={() => void toggle()}
        className="panel flex w-full items-center justify-between gap-4 p-4 text-left transition-colors"
        style={{
          borderColor: on ? 'var(--color-accent)' : 'var(--color-line-2)',
          background: on ? 'var(--color-accent-soft)' : 'var(--color-surface)',
          opacity: state === 'unsupported' || state === 'denied' ? 0.7 : 1,
        }}
      >
        <span className="min-w-0">
          <span className="block text-[0.9375rem] font-semibold">{title}</span>
          <span className="mt-0.5 block text-[0.8125rem]" style={{ color: 'var(--color-muted)' }}>
            {blurb}
          </span>
        </span>
        <span
          aria-hidden
          className="relative block h-7 w-12 shrink-0 rounded-full transition-colors"
          style={{ background: on ? 'var(--color-accent)' : 'var(--color-line-2)' }}
        >
          <span
            className="absolute top-1 block h-5 w-5 rounded-full bg-white transition-all"
            style={{ left: on ? '1.5rem' : '0.25rem', boxShadow: '0 1px 3px rgba(28,26,23,.28)' }}
          />
        </span>
      </button>
      {note ? (
        <p role="status" className="mt-2 text-[0.8125rem] leading-relaxed" style={{ color: 'var(--color-muted)' }}>
          {note}
        </p>
      ) : null}
    </div>
  );
}
