/**
 * "Where did you hear about us?" — the one list every surface shares.
 *
 * Values are fixed keys (never free text) so the admin console can count them
 * without parsing, and so the server can allow-list what it stores. Used by
 * the signup form, the post-login modal, /auth/callback and the admin Revenue
 * section. Add here, and everywhere stays in step.
 */

export const REFERRAL_SOURCES = [
  { id: 'facebook', label: 'Facebook' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'google', label: 'Google search' },
  { id: 'ai', label: 'AI (ChatGPT, Gemini…)' },
  { id: 'friend', label: 'A friend or coworker' },
  { id: 'other', label: 'Somewhere else' },
] as const;

export type ReferralSourceId = (typeof REFERRAL_SOURCES)[number]['id'];

export const REFERRAL_SOURCE_IDS = new Set<string>(REFERRAL_SOURCES.map((s) => s.id));

export function isReferralSource(value: string): value is ReferralSourceId {
  return REFERRAL_SOURCE_IDS.has(value);
}

export function referralSourceLabel(key: string | null | undefined) {
  if (!key) return 'Not answered';
  return REFERRAL_SOURCES.find((s) => s.id === key)?.label ?? key;
}
