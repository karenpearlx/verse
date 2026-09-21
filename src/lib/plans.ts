/**
 * Plan copy, in one place.
 *
 * The numbers here are display copy only. Every limit is enforced server side
 * (consume_feature_use for letters and exports, the applications API routes
 * for saved jobs), so nothing on this page is load bearing for access. It just
 * has to agree with the constants in subscription.ts, which is why it imports
 * them instead of restating them.
 */

import { CONTACT_EMAIL } from './contact';
import {
  FREE_COVER_LETTER_LIMIT,
  FREE_RESUME_LIMIT,
  FREE_SAVED_JOB_LIMIT,
  PRO_PRICE_CENTAVOS,
  type SubscriptionTier,
} from './subscription';

export const PRO_PRICE_PESOS = Math.round(PRO_PRICE_CENTAVOS / 100);

/** Hosted Checkout is prepaid, so this is the length of one purchase. */
export const PRO_ACCESS_DAYS = 30;

export type Plan = {
  id: SubscriptionTier;
  name: string;
  /** Null on Creator, which is application only and has no listed price. */
  price: string | null;
  cadence: string;
  blurb: string;
  features: string[];
  /** The dark, foregrounded card. */
  featured?: boolean;
};

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: '₱0',
    cadence: 'forever',
    blurb: 'Everything you need to run a normal job hunt, with counters on the expensive parts.',
    features: [
      'The full job board and filters',
      'Application tracker',
      'Rate calculator',
      'Basic courses',
      `${FREE_COVER_LETTER_LIMIT} cover letters, lifetime`,
      `${FREE_RESUME_LIMIT} resume exports, lifetime`,
      `${FREE_SAVED_JOB_LIMIT} saved jobs`,
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: `₱${PRO_PRICE_PESOS}`,
    cadence: 'for 30 days',
    blurb: 'For the month you are actually applying. Prepaid — no auto-renew, nothing counts down while you work.',
    featured: true,
    features: [
      'Unlimited cover letters',
      'Unlimited resume exports',
      'Unlimited saved jobs',
      'Every premium course',
      'New jobs 24 hours before free accounts',
      'AI interview prep with written feedback',
      'Follow-up email writer',
    ],
  },
  {
    id: 'creator',
    name: 'Creator',
    price: null,
    cadence: 'by application',
    blurb: 'For VAs who already teach. Bring the skill, we handle hosting and payments.',
    features: [
      'Everything in Pro',
      'Host and sell your own courses',
      'Keep 90% of your course sales',
      'Your name on the course page',
    ],
  },
];

const CREATOR_SUBJECT = 'Creator application';
const CREATOR_BODY = [
  'Hi Verse team,',
  '',
  "I'd like to teach on Verse.",
  '',
  'What I do:',
  'What I want to teach:',
  'Where you can see my work:',
].join('\n');

export const CREATOR_MAILTO =
  `mailto:${CONTACT_EMAIL}` +
  `?subject=${encodeURIComponent(CREATOR_SUBJECT)}` +
  `&body=${encodeURIComponent(CREATOR_BODY)}`;

export function tierLabel(tier: SubscriptionTier): string {
  if (tier === 'pro') return 'Pro';
  if (tier === 'creator') return 'Creator';
  return 'Free';
}

/** "6 August 2026" — used for renewal and access-end lines. */
export function formatPlanDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-PH', { day: 'numeric', month: 'long', year: 'numeric' });
}
