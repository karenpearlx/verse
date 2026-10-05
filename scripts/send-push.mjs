/**
 * Daily push digest: "N new VA jobs in the last 24 hours."
 *
 * Run by .github/workflows/push-digest.yml once a day, PH morning time.
 * Reads the jobs added since yesterday (created_at is set on insert and never
 * touched by the scraper's upsert, so the count is genuinely-new rows) and
 * sends one notification to every subscribed device. Dead subscriptions —
 * the push service answers 404 or 410 once a browser revokes them — are
 * deleted on the spot, so the table never accumulates corpses.
 *
 * Required env:
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (mailto:…)
 */

import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const vapidPublic = process.env.VAPID_PUBLIC_KEY;
const vapidPrivate = process.env.VAPID_PRIVATE_KEY;

if (!url || !serviceKey) throw new Error('Supabase env missing.');
if (!vapidPublic || !vapidPrivate) throw new Error('VAPID env missing.');

webpush.setVapidDetails(process.env.VAPID_SUBJECT ?? 'mailto:hello@vrsfd.com', vapidPublic, vapidPrivate);

const db = createClient(url, serviceKey, { auth: { persistSession: false } });

const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

// Count plus a couple of titles so the notification reads like news, not a number.
const { count, error: countError } = await db
  .from('jobs')
  .select('id', { count: 'exact', head: true })
  .eq('is_active', true)
  .gte('created_at', since);
if (countError) throw new Error(`Counting new jobs failed: ${countError.message}`);

if (!count) {
  console.log('No new jobs in the last 24 hours; nothing to send.');
  process.exit(0);
}

const { data: samples } = await db
  .from('jobs')
  .select('title')
  .eq('is_active', true)
  .gte('created_at', since)
  .order('created_at', { ascending: false })
  .limit(2);
const names = (samples ?? []).map((row) => row.title).filter(Boolean);

const body =
  names.length > 0
    ? `${count} new job${count === 1 ? '' : 's'} today — ${names.join(', ')}${count > names.length ? ' and more' : ''}.`
    : `${count} new job${count === 1 ? '' : 's'} posted in the last 24 hours.`;

const payload = JSON.stringify({
  title: 'New VA jobs on Verse',
  body,
  url: '/jobs',
  tag: 'verse-digest', // one per day replaces, never stacks
});

const { data: subs, error: subsError } = await db
  .from('push_subscriptions')
  .select('id,endpoint,p256dh,auth');
if (subsError) throw new Error(`Reading subscriptions failed: ${subsError.message}`);

if (!subs?.length) {
  console.log('No push subscriptions yet.');
  process.exit(0);
}

let sent = 0;
let pruned = 0;
let failed = 0;

for (const sub of subs) {
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      payload,
      { TTL: 12 * 60 * 60 }, // stale digests should die, not arrive tomorrow
    );
    sent += 1;
  } catch (cause) {
    const status = cause?.statusCode;
    if (status === 404 || status === 410) {
      await db.from('push_subscriptions').delete().eq('id', sub.id);
      pruned += 1;
    } else {
      failed += 1;
      console.error(`Send failed (${status ?? 'network'}): ${sub.endpoint.slice(0, 60)}…`);
    }
  }
}

console.log(`Digest "${body}" — sent ${sent}, pruned ${pruned} dead, ${failed} failed.`);
