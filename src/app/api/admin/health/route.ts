import { apiError } from '@/lib/api';
import { requireAdmin } from '@/lib/admin/auth';
import { isMissingTable } from '@/lib/admin/data';
import type { HealthCheck, HealthResponse } from '@/lib/admin/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const SETUP_FILE = 'supabase/2026-08-04-admin-hardening.sql';
const FEEDBACK_SETUP_FILE = 'supabase/2026-08-04-lesson-feedback.sql';
const BILLING_SETUP_FILE = 'supabase/migrations/20260819000005_billing_paymongo.sql';

/** Tables the console reads. A missing one degrades a panel, it does not break it. */
const TABLES: { name: string; label: string; critical: boolean; setup?: string }[] = [
  { name: 'jobs', label: 'Job listings', critical: true },
  { name: 'users', label: 'Accounts', critical: true },
  { name: 'analytics_events', label: 'Analytics events', critical: false },
  { name: 'scraper_runs', label: 'Scraper run history', critical: false },
  { name: 'admin_templates', label: 'Custom templates', critical: false },
  { name: 'job_categories', label: 'Curated categories', critical: false },
  { name: 'lesson_feedback', label: 'Lesson feedback', critical: false, setup: FEEDBACK_SETUP_FILE },
  { name: 'admin_audit_log', label: 'Admin audit log', critical: false },
  { name: 'subscription_history', label: 'Pro payment history', critical: false, setup: BILLING_SETUP_FILE },
];

/**
 * A real probe, not a guess — but only where a probe can actually tell you
 * something.
 *
 * PostgREST only reports an RLS refusal as an error for INSERT, because that
 * is the one command with a WITH CHECK to violate. An UPDATE or DELETE that
 * RLS filters down to nothing is indistinguishable from one that legitimately
 * matched no rows: both answer 204. So this probes INSERT, with a body that
 * is missing every required column. Two outcomes, both safe:
 *
 *   42501 → the anon role is not allowed to insert. Locked.
 *   23502 → it got as far as the NOT NULL check, so the insert was permitted.
 *
 * Nothing is ever written either way. UPDATE and DELETE grants cannot be
 * tested from out here and are checked in SQL instead; see the setup file.
 */
async function probeAnonInsert(table: string): Promise<HealthCheck['status']> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return 'unknown';
  try {
    const response = await fetch(`${url}/rest/v1/${table}`, {
      method: 'POST',
      cache: 'no-store',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'content-type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({}),
      signal: AbortSignal.timeout(8_000),
    });
    if (response.status === 401 || response.status === 403) return 'ok';
    const payload = (await response.json().catch(() => null)) as { code?: string } | null;
    if (payload?.code === '42501') return 'ok';
    if (payload?.code === '23502' || payload?.code === '23505' || response.ok) return 'bad';
    return 'unknown';
  } catch {
    return 'unknown';
  }
}

export async function GET() {
  try {
    const { supabase } = await requireAdmin();

    const tableChecks = await Promise.all(
      TABLES.map(async (table): Promise<HealthCheck & { missing: boolean }> => {
        // A real one-row read, not a HEAD count. A head request against a
        // table PostgREST has never heard of does not always surface the
        // PGRST205 as an error through supabase-js, which had this panel
        // cheerfully reporting two non-existent tables as fine.
        const { error } = await supabase.from(table.name).select('*').limit(1);
        const missing = Boolean(error && isMissingTable(error));
        if (!error) {
          return { id: `table:${table.name}`, label: table.label, status: 'ok', detail: `public.${table.name} is readable.`, missing: false };
        }
        if (missing) {
          return {
            id: `table:${table.name}`,
            label: table.label,
            status: table.critical ? 'bad' : 'warn',
            detail: `public.${table.name} does not exist. Run ${table.setup ?? SETUP_FILE}.`,
            missing: true,
          };
        }
        return { id: `table:${table.name}`, label: table.label, status: 'warn', detail: error.message, missing: false };
      }),
    );

    const statusColumn = await supabase.from('users').select('status').limit(1);
    const moderationReady = !statusColumn.error;
    const billingColumn = await supabase
      .from('users')
      .select('subscription_tier,subscription_ends_at,paymongo_checkout_session_id')
      .limit(1);
    const billingReady = !billingColumn.error;

    const checks: HealthCheck[] = [
      {
        id: 'security:jobs-write',
        label: 'Public write access to listings',
        status: await probeAnonInsert('jobs'),
        detail:
          'The anon key ships in the browser bundle, so it should read listings and nothing else. "Open" means anyone with devtools can add fake jobs to the site. This tests inserts only; the update and delete grants have to be checked in SQL, which the setup file explains.',
      },
      {
        id: 'env:admin-emails',
        label: 'Admin allowlist',
        status: process.env.ADMIN_EMAILS?.trim() ? 'ok' : 'bad',
        detail: 'ADMIN_EMAILS gates this console. With it unset, nobody can get in, including you.',
      },
      {
        id: 'env:analytics-secret',
        label: 'Analytics hashing key',
        status: process.env.ANALYTICS_HASH_SECRET?.trim() ? 'ok' : 'warn',
        detail: 'ANALYTICS_HASH_SECRET is what turns an IP into a one-way hash. Without it, events are dropped rather than stored raw.',
      },
      {
        id: 'env:service-role',
        label: 'Scraper write key',
        status: process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ? 'ok' : 'warn',
        detail:
          'The scraper currently writes with the public anon key. Once public write access is closed off, it needs SUPABASE_SERVICE_ROLE_KEY or every run will fail.',
      },
      {
        id: 'env:upwork',
        label: 'Upwork source',
        status: process.env.UPWORK_ACCESS_TOKEN?.trim() ? 'ok' : 'warn',
        detail: 'UPWORK_ACCESS_TOKEN is not set, so Upwork contributes no listings. Everything else works without it.',
      },
      {
        id: 'env:paymongo',
        label: 'PayMongo Pro checkout',
        status: process.env.PAYMONGO_SECRET_KEY?.trim() ? 'ok' : 'warn',
        detail: process.env.PAYMONGO_SECRET_KEY?.trim()
          ? 'PAYMONGO_SECRET_KEY is set. Also set PAYMONGO_WEBHOOK_SECRET and point the PayMongo webhook at /api/webhooks/paymongo.'
          : 'PAYMONGO_SECRET_KEY is missing, so Upgrade to Pro returns “Payments are not configured yet.”',
      },
      {
        id: 'env:paymongo-webhook',
        label: 'PayMongo webhook secret',
        status: process.env.PAYMONGO_WEBHOOK_SECRET?.trim() ? 'ok' : 'warn',
        detail: 'PAYMONGO_WEBHOOK_SECRET verifies checkout_session.payment.paid so Pro activates after GCash/Maya/card payment.',
      },
      {
        id: 'feature:moderation',
        label: 'Account suspension',
        status: moderationReady ? 'ok' : 'warn',
        detail: moderationReady
          ? 'public.users has the status column, so accounts can be suspended and restored.'
          : `Suspending is switched off until the status column exists. Run ${SETUP_FILE}.`,
      },
      {
        id: 'feature:billing',
        label: 'Pro billing columns',
        status: billingReady ? 'ok' : 'warn',
        detail: billingReady
          ? 'public.users has subscription and PayMongo columns, so checkout can activate Pro.'
          : `Pro checkout needs billing columns. Run ${BILLING_SETUP_FILE} in the Supabase SQL editor.`,
      },
      ...tableChecks.map((check): HealthCheck => ({ id: check.id, label: check.label, status: check.status, detail: check.detail })),
    ];

    const missingTables = tableChecks.filter((check) => check.missing).map((check) => check.id.replace('table:', ''));
    const needsSetup =
      missingTables.length > 0 ||
      !moderationReady ||
      !billingReady ||
      checks.some((check) => check.id === 'security:jobs-write' && check.status === 'bad');

    const payload: HealthResponse = {
      checks,
      missingTables,
      setupFile: needsSetup ? SETUP_FILE : null,
      checkedAt: new Date().toISOString(),
    };
    return Response.json(payload, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return apiError(error);
  }
}
