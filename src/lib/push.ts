'use client';

/**
 * Browser side of push notifications.
 *
 * The flow: ask permission, subscribe this browser's push manager with our
 * VAPID public key, and hand the subscription to the server, which stores it
 * and immediately sends a real "you're set" push — so enabling the toggle is
 * also the end-to-end test.
 *
 * The service worker only registers on the production site (see PWA.tsx), so
 * on localhost this reports 'unsupported' rather than hanging on a worker
 * that will never arrive.
 */

export type PushState = 'unsupported' | 'denied' | 'off' | 'on';

export function pushSupported() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/** The standard base64url → Uint8Array dance the Push API insists on. */
function vapidKeyBytes(key: string) {
  const padded = key + '='.repeat((4 - (key.length % 4)) % 4);
  const raw = atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

async function registration() {
  if (!pushSupported()) return null;
  try {
    return (await navigator.serviceWorker.getRegistration('/')) ?? null;
  } catch {
    return null;
  }
}

/** Where this browser currently stands, for painting the settings toggle. */
export async function pushState(): Promise<PushState> {
  if (!pushSupported()) return 'unsupported';
  if (Notification.permission === 'denied') return 'denied';
  const reg = await registration();
  if (!reg) return 'unsupported';
  try {
    const sub = await reg.pushManager.getSubscription();
    return sub ? 'on' : 'off';
  } catch {
    return 'off';
  }
}

export async function enablePush(): Promise<{ ok: boolean; reason?: string }> {
  const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!key) return { ok: false, reason: 'Push is not configured on this deployment yet.' };

  const reg = await registration();
  if (!reg) return { ok: false, reason: 'This browser (or this environment) does not support push.' };

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return { ok: false, reason: 'Notifications are blocked for this site in your browser settings.' };
  }

  let sub: PushSubscription;
  try {
    sub =
      (await reg.pushManager.getSubscription()) ??
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKeyBytes(key),
      }));
  } catch {
    return { ok: false, reason: 'Could not subscribe this browser. Try again in a moment.' };
  }

  const response = await fetch('/api/push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sub.toJSON()),
  });
  if (response.status === 401) {
    await sub.unsubscribe().catch(() => undefined);
    return { ok: false, reason: 'Sign in first — alerts are tied to your account.' };
  }
  if (!response.ok) {
    await sub.unsubscribe().catch(() => undefined);
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    return { ok: false, reason: body?.error ?? 'The server could not save this device.' };
  }
  return { ok: true };
}

export async function disablePush() {
  const reg = await registration();
  const sub = await reg?.pushManager.getSubscription();
  if (!sub) return;
  const endpoint = sub.endpoint;
  await sub.unsubscribe().catch(() => undefined);
  await fetch('/api/push', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint }),
  }).catch(() => undefined);
}
