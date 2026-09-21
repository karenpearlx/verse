import type { SupabaseClient } from '@supabase/supabase-js';

export type SubscriptionTier = 'free' | 'pro' | 'creator';
export type SubscriptionStatus = 'active' | 'cancelled' | 'past_due' | null;

export type SubscriptionAccount = {
  subscription_tier: SubscriptionTier;
  subscription_status: SubscriptionStatus;
  subscription_ends_at: string | null;
  paymongo_customer_id: string | null;
  paymongo_subscription_id: string | null;
  cover_letter_uses: number;
  resume_uses: number;
};

export const FREE_COVER_LETTER_LIMIT = 10;
export const FREE_RESUME_LIMIT = 10;
export const FREE_SAVED_JOB_LIMIT = 20;
export const PRO_PRICE_CENTAVOS = 19_900;

export const DEFAULT_SUBSCRIPTION: SubscriptionAccount = {
  subscription_tier: 'free',
  subscription_status: null,
  subscription_ends_at: null,
  paymongo_customer_id: null,
  paymongo_subscription_id: null,
  cover_letter_uses: 0,
  resume_uses: 0,
};

export function hasPaidAccess(account: Pick<SubscriptionAccount, 'subscription_tier' | 'subscription_status' | 'subscription_ends_at'>) {
  if (!['pro', 'creator'].includes(account.subscription_tier) || account.subscription_status !== 'active') return false;
  return !account.subscription_ends_at || new Date(account.subscription_ends_at).getTime() > Date.now();
}

export async function readSubscription(supabase: SupabaseClient, userId: string): Promise<SubscriptionAccount> {
  const { data, error } = await supabase
    .from('users')
    .select('subscription_tier,subscription_status,subscription_ends_at,paymongo_customer_id,paymongo_subscription_id,cover_letter_uses,resume_uses')
    .eq('id', userId)
    .maybeSingle();

  // Keep the app usable during a staged deploy before the migration is run.
  if (error || !data) return { ...DEFAULT_SUBSCRIPTION };
  return { ...DEFAULT_SUBSCRIPTION, ...(data as Partial<SubscriptionAccount>) };
}
