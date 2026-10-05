'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/AuthContext';
import { REFERRAL_SOURCES, type ReferralSourceId } from '@/lib/referral-sources';

/**
 * The attribution question, for everyone who slipped past the signup form —
 * mainly Google sign-ups, where there is no form to put a dropdown on.
 *
 * Shows once, after sign-in, when the account has no referral_source yet, and
 * it has no close button on purpose: one tap on a source and one on Save is
 * the whole ask. Mounted from the root layout like the other overlays, so it
 * opts out of the focused routes (auth, admin) the same way they do.
 *
 * Fails open everywhere: if the column is missing, the network is down, or
 * storage is blocked, the site keeps working and the modal simply stays away.
 */

// Scoped per account so a second person on the same browser still gets asked.
const doneKey = (uid: string) => `vrs-src-answered:${uid}`;

const HIDDEN_PREFIXES = [
  '/admin',
  '/login',
  '/signup',
  '/auth',
  '/forgot-password',
  '/reset-password',
  '/offline',
];

function alreadyDone(uid: string) {
  try {
    return localStorage.getItem(doneKey(uid)) === '1';
  } catch {
    // Storage blocked: we could not remember an answer anyway, so skip rather
    // than ask on every page view.
    return true;
  }
}

function markDone(uid: string) {
  try {
    localStorage.setItem(doneKey(uid), '1');
  } catch {
    /* the DB row is the real record; this is just to skip the lookup */
  }
}

export default function ReferralSourceModal() {
  const pathname = usePathname() ?? '/';
  const { status, user, ready } = useAuth();
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<ReferralSourceId | null>(null);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  const hidden = HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const signedIn = ready && status === 'in' && Boolean(user);

  useEffect(() => {
    if (!signedIn || !user || hidden || alreadyDone(user.id)) return;
    let alive = true;

    void (async () => {
      try {
        const { data, error } = await createClient()
          .from('users')
          .select('referral_source')
          .eq('id', user.id)
          .maybeSingle();
        if (!alive || error) return;
        const source = (data as { referral_source?: string | null } | null)?.referral_source;
        if (source) {
          markDone(user.id);
          return;
        }
        setOpen(true);
      } catch {
        /* offline or mid-deploy; try again next page load */
      }
    })();

    return () => {
      alive = false;
    };
  }, [signedIn, user, hidden]);

  if (!open) return null;

  const save = async () => {
    if (!picked || !user) return;
    setSaving(true);
    setFailed(false);
    try {
      // Saved through a server route (service key) because browsers cannot
      // update public.users directly under RLS. Only mark "answered" once the
      // server confirms the write, so the answer is never silently lost.
      const res = await fetch('/api/referral-source', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ source: picked }),
      });
      if (!res.ok) {
        setFailed(true);
        return; // keep the modal up; Save comes back for another try
      }
      markDone(user.id);
      setOpen(false);
    } catch {
      // Offline or mid-deploy: keep the modal up so they can tap Save again.
      setFailed(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Where did you hear about Verse?"
      className="fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center"
      style={{ background: 'rgba(28,26,23,0.55)', backdropFilter: 'blur(3px)' }}
    >
      <div className="card w-full max-w-md p-6 md:p-7" style={{ maxHeight: 'calc(100vh - 2rem)', overflowY: 'auto' }}>
        <p className="eyebrow" style={{ color: 'var(--color-accent-deep)' }}>
          One quick question
        </p>
        <h2 className="font-display mt-2 text-2xl font-extrabold tracking-tight">
          Where did you hear about Verse<span className="dot">?</span>
        </h2>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>
          Ten seconds, once, and it genuinely helps us put Verse where the next VA will find it.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Pick a source">
          {REFERRAL_SOURCES.map((s) => {
            const on = picked === s.id;
            return (
              <button
                key={s.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setPicked(s.id)}
                className="min-h-[44px] rounded-xl px-3 py-2.5 text-left text-[0.875rem] font-semibold transition-colors"
                style={{
                  border: `1.5px solid ${on ? 'var(--color-accent)' : 'var(--color-line-2)'}`,
                  background: on ? 'var(--color-accent-soft)' : 'var(--color-surface)',
                  color: on ? 'var(--color-accent-deep)' : 'var(--color-ink-2)',
                }}
              >
                {s.label}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => void save()}
          disabled={!picked || saving}
          className="btn btn-primary mt-5 w-full !py-3"
          style={{ opacity: picked ? 1 : 0.5 }}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        {failed ? (
          <p className="mt-2 text-center text-sm font-semibold" style={{ color: '#a04020' }} role="alert">
            That didn&rsquo;t save — please tap Save again.
          </p>
        ) : null}
      </div>
    </div>
  );
}
