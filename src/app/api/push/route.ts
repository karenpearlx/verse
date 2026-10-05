import webpush from 'web-push';
import { ApiError, apiError, readJson, requireUser, stringField } from '@/lib/api';
import { createServiceClient } from '@/lib/supabase/service';

export const runtime = 'nodejs';

/**
 * Stores one browser's push subscription against the signed-in account, then
 * immediately sends a real push through it — so flipping the toggle in
 * Settings is also the end-to-end delivery test. The daily job digest
 * (scripts/send-push.mjs, run by GitHub Actions) reads the same table.
 *
 * Writes use the service client because an endpoint can change hands on a
 * shared device: the new sign-in must be able to take over a row the previous
 * account left behind, which row-level security would rightly forbid.
 */

function vapidConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

function configureVapid() {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? 'mailto:hello@vrsfd.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
}

export async function POST(request: Request) {
  try {
    const { user } = await requireUser();
    const body = await readJson(request);
    const endpoint = stringField(body.endpoint, 'endpoint', { required: true, max: 1_000 })!;
    if (!/^https:\/\//.test(endpoint)) throw new ApiError(400, 'endpoint must be an https URL.');
    const keys = (body.keys ?? {}) as Record<string, unknown>;
    const p256dh = stringField(keys.p256dh, 'keys.p256dh', { required: true, max: 300 })!;
    const auth = stringField(keys.auth, 'keys.auth', { required: true, max: 100 })!;

    const db = createServiceClient();
    const { error } = await db
      .from('push_subscriptions')
      .upsert(
        { user_id: user.id, endpoint, p256dh, auth },
        { onConflict: 'endpoint' },
      );
    if (error) throw error;

    // The welcome push proves the whole pipe works. Failure here is reported
    // but does not undo the save — the subscription itself is fine.
    let delivered = false;
    if (vapidConfigured()) {
      configureVapid();
      try {
        await webpush.sendNotification(
          { endpoint, keys: { p256dh, auth } },
          JSON.stringify({
            title: 'Notifications are on',
            body: "You're set. We'll ping this device when new VA jobs land.",
            url: '/jobs',
            tag: 'verse-welcome',
          }),
        );
        delivered = true;
      } catch {
        /* some push services throttle immediate sends; the subscription stands */
      }
    }

    return Response.json({ saved: true, delivered }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const { user } = await requireUser();
    const body = await readJson(request);
    const endpoint = stringField(body.endpoint, 'endpoint', { required: true, max: 1_000 })!;

    const db = createServiceClient();
    // Scoped to the caller's own rows: nobody can unsubscribe someone else's
    // device by guessing an endpoint.
    const { error } = await db
      .from('push_subscriptions')
      .delete()
      .eq('endpoint', endpoint)
      .eq('user_id', user.id);
    if (error) throw error;

    return Response.json({ removed: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return apiError(error);
  }
}
