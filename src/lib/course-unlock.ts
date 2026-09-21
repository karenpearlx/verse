import 'server-only';

import { createHmac, timingSafeEqual } from 'node:crypto';

/** Shared secret unlock links for marketplace sales (e.g. Raket). Not one-time — cookie lasts years. */
const COOKIE_PREFIX = 'verse_course_unlock_';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 365 * 5; // 5 years — effectively unlimited for buyers

function parseUnlockKeys(): Record<string, string> {
  const raw = process.env.COURSE_UNLOCK_KEYS?.trim();
  if (!raw) return {};
  const out: Record<string, string> = {};
  for (const part of raw.split(',')) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const colon = trimmed.indexOf(':');
    if (colon <= 0) continue;
    const slug = trimmed.slice(0, colon).trim().toLowerCase();
    const key = trimmed.slice(colon + 1).trim();
    if (slug && key) out[slug] = key;
  }
  return out;
}

function equal(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  try {
    return timingSafeEqual(left, right);
  } catch {
    return false;
  }
}

function tokenFor(slug: string, secret: string) {
  return createHmac('sha256', secret).update(`unlock:${slug}`).digest('base64url');
}

export function courseUnlockCookieName(slug: string) {
  return `${COOKIE_PREFIX}${slug.replace(/[^a-z0-9-]/gi, '')}`;
}

export function courseUnlockMaxAge() {
  return MAX_AGE_SECONDS;
}

/** True when ?access= matches the configured secret for this course slug. */
export function isValidCourseUnlockAccess(slug: string, access: string | null | undefined) {
  if (!access) return false;
  const secret = parseUnlockKeys()[slug.trim().toLowerCase()];
  if (!secret) return false;
  return equal(access.trim(), secret);
}

/** Cookie value that proves this browser unlocked the course. */
export function courseUnlockCookieValue(slug: string) {
  const secret = parseUnlockKeys()[slug.trim().toLowerCase()];
  if (!secret) return null;
  return tokenFor(slug.trim().toLowerCase(), secret);
}

export function hasCourseUnlockCookie(slug: string, cookieValue: string | undefined) {
  if (!cookieValue) return false;
  const expected = courseUnlockCookieValue(slug);
  if (!expected) return false;
  return equal(cookieValue, expected);
}
