'use client';

/**
 * Client-side read of the signed-in account's plan.
 *
 * Purely cosmetic: it decides whether to show "4 of 10 letters left" and which
 * button to render. Nothing here grants access. A 401 means signed out, which
 * is a state and not an error, so it never surfaces as a failure message.
 */

import { useCallback, useEffect, useState } from 'react';
import type { SubscriptionTier } from '@/lib/subscription';

export type SubscriptionSnapshot = {
  subscription_tier: SubscriptionTier;
  subscription_status: 'active' | 'cancelled' | 'past_due' | null;
  subscription_ends_at: string | null;
  cover_letter_uses: number;
  resume_uses: number;
  has_paid_access: boolean;
};

export type SubscriptionState =
  | { status: 'loading'; data: null }
  | { status: 'signed-out'; data: null }
  | { status: 'ready'; data: SubscriptionSnapshot };

const LOADING: SubscriptionState = { status: 'loading', data: null };
const SIGNED_OUT: SubscriptionState = { status: 'signed-out', data: null };

export function useSubscription() {
  const [state, setState] = useState<SubscriptionState>(LOADING);

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch('/api/subscription', { cache: 'no-store', signal });
      if (response.status === 401) {
        setState(SIGNED_OUT);
        return;
      }
      if (!response.ok) {
        setState(SIGNED_OUT);
        return;
      }
      const data = (await response.json()) as SubscriptionSnapshot;
      setState({ status: 'ready', data });
    } catch {
      // An offline reload should not paint a broken plan badge.
      if (!signal?.aborted) setState(SIGNED_OUT);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    // Every setState in `load` happens after an await, so this is a fetch on
    // mount rather than the cascading-render pattern the rule is aimed at.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  return { ...state, refresh: () => void load() };
}

/**
 * Start Hosted Checkout and hand the browser to PayMongo.
 *
 * Resolves only on failure: on success the tab is already navigating away.
 */
export async function startCheckout(): Promise<string> {
  const response = await fetch('/api/subscription/checkout', { method: 'POST' });
  const body = (await response.json().catch(() => null)) as
    | { checkout_url?: string; error?: string }
    | null;

  if (response.status === 401) throw new Error('Sign in first, then upgrade.');
  if (!response.ok || !body?.checkout_url) {
    throw new Error(body?.error?.trim() || 'Could not open checkout. Try again in a moment.');
  }
  return body.checkout_url;
}
