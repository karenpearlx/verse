import { NextResponse } from 'next/server';
import {
  courseUnlockCookieName,
  courseUnlockCookieValue,
  courseUnlockMaxAge,
  isValidCourseUnlockAccess,
} from '@/lib/course-unlock';

/**
 * Marketplace unlock: GET /api/course-unlock?slug=seo-specialist&access=SECRET
 * Sets a long-lived cookie, then sends the buyer to the course. Same link works forever.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const slug = (url.searchParams.get('slug') ?? '').trim().toLowerCase();
  const access = url.searchParams.get('access');

  if (!slug || !/^[a-z0-9-]{1,80}$/.test(slug)) {
    return NextResponse.redirect(new URL('/courses', url.origin));
  }

  const destination = new URL(`/courses/${slug}`, url.origin);

  if (!isValidCourseUnlockAccess(slug, access)) {
    destination.searchParams.set('unlock', 'invalid');
    return NextResponse.redirect(destination);
  }

  const token = courseUnlockCookieValue(slug);
  if (!token) {
    destination.searchParams.set('unlock', 'invalid');
    return NextResponse.redirect(destination);
  }

  const response = NextResponse.redirect(destination);
  response.cookies.set(courseUnlockCookieName(slug), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: courseUnlockMaxAge(),
  });
  return response;
}
