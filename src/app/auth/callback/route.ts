import { NextResponse, type NextRequest } from "next/server";
import { requestOrigin, safeNextPath } from "@/lib/supabase/origin";
import { createRouteHandlerClient } from "@/lib/supabase/route";

/**
 * Exchanges the OAuth/PKCE auth code for a session.
 *
 * Cookie writes must land on the redirect response. Using cookies() from
 * next/headers alone can drop Set-Cookie on NextResponse.redirect, and the
 * PKCE verifier must still be present on the request when we exchange.
 *
 * The auth code is single-use. A duplicate navigation (seen with service-worker
 * navigation preload) burns it and returns "invalid flow state". We map that
 * to a retryable login error; the SW no longer double-fetches /auth/*.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const origin = requestOrigin(request);
  const code = url.searchParams.get("code");
  const flowId = url.searchParams.get("sb_flow_id");
  const oauthError = url.searchParams.get("error_description") || url.searchParams.get("error");
  const next = safeNextPath(url.searchParams.get("next"));

  if (oauthError && !code) {
    const destination = new URL("/login", origin);
    destination.searchParams.set("error", oauthError);
    return NextResponse.redirect(destination);
  }

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=Missing+authentication+code", origin));
  }

  const redirect = NextResponse.redirect(new URL(next, origin));

  let supabase;
  try {
    ({ supabase } = createRouteHandlerClient(request, redirect));
  } catch {
    return NextResponse.redirect(new URL("/login?error=Auth+is+not+configured", origin));
  }

  const { data: exchanged, error } = await supabase.auth.exchangeCodeForSession(
    code,
    flowId ? { flowId } : undefined,
  );

  if (!error) {
    await recordReferralSource(request, redirect, supabase, exchanged.user?.id);
  }

  if (error) {
    // A parallel exchange may have already succeeded and set cookies on a
    // discarded response; if this request can already see a user, proceed.
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      return redirect;
    }

    const destination = new URL("/login", origin);
    const message = /invalid flow state|flow state/i.test(error.message)
      ? "Google sign-in hit a glitch. Please try Continue with Google once more."
      : error.message;
    destination.searchParams.set("error", message);
    return NextResponse.redirect(destination);
  }

  return redirect;
}

/**
 * The signup form's "where did you hear about us" answer. Email signups carry
 * it in auth metadata; the Google flow can't, so the form drops it in a
 * short-lived cookie and this picks it up after the exchange.
 *
 * First answer wins (`referral_source is null`), and every failure is
 * swallowed: attribution is never worth breaking a sign-in over, and the
 * column may simply not exist until the migration has run.
 */
const SOURCE_KEYS = new Set(["facebook", "tiktok", "instagram", "youtube", "google", "friend", "other"]);

async function recordReferralSource(
  request: NextRequest,
  redirect: NextResponse,
  supabase: ReturnType<typeof createRouteHandlerClient>["supabase"],
  userId: string | undefined,
) {
  const raw = request.cookies.get("vrs-src")?.value;
  if (!raw) return;
  redirect.cookies.set("vrs-src", "", { path: "/", maxAge: 0 });
  if (!userId) return;
  const source = decodeURIComponent(raw);
  if (!SOURCE_KEYS.has(source)) return;
  try {
    await supabase.from("users").update({ referral_source: source }).eq("id", userId).is("referral_source", null);
  } catch {
    /* see above */
  }
}
