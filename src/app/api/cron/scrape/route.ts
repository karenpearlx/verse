import { timingSafeEqual } from 'node:crypto';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { ApiError, apiError } from '@/lib/api';
import { createServiceClient } from '@/lib/supabase/service';
import { RUNS_TABLE } from '@/lib/admin/data';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300;

const RUN_TIMEOUT_MS = 10 * 60_000;
const LOG_LIMIT = 20_000;

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const header = request.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) return false;
  const token = header.slice('Bearer '.length).trim();
  if (token.length !== secret.length) return false;
  try {
    return timingSafeEqual(Buffer.from(token), Buffer.from(secret));
  } catch {
    return false;
  }
}

/**
 * Scheduled scrape entrypoint. Prefer the GitHub Action in
 * `.github/workflows/scrape-jobs.yml` (every 30 minutes). This route exists so
 * a Vercel Cron (Pro) or any external scheduler can trigger the same script
 * with `Authorization: Bearer $CRON_SECRET`.
 */
export async function POST(request: Request) {
  try {
    if (!authorized(request)) throw new ApiError(401, 'Unauthorized.');

    const supabase = createServiceClient();
    const { data: active } = await supabase
      .from(RUNS_TABLE)
      .select('id,started_at')
      .eq('status', 'running')
      .limit(1);
    if (active?.[0] && Date.now() - Date.parse(active[0].started_at) < RUN_TIMEOUT_MS) {
      throw new ApiError(409, 'A scrape is already running.');
    }

    const startedAt = new Date().toISOString();
    const { data: run, error } = await supabase
      .from(RUNS_TABLE)
      .insert({
        source: 'all',
        status: 'running',
        job_count: 0,
        message: 'Cron scrape starting…',
        started_at: startedAt,
      })
      .select('id')
      .single();
    if (error || !run) throw new ApiError(503, error?.message ?? 'Could not open a run.');

    const result = await runScrape(String(run.id), startedAt);
    return Response.json(result, { status: result.ok ? 200 : 500, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return apiError(error);
  }
}

async function runScrape(runId: string, startedAt: string) {
  const supabase = createServiceClient();
  const script = path.join(process.cwd(), 'scripts', 'scrape-jobs.mjs');
  const child = spawn(process.execPath, [script], { cwd: process.cwd(), env: process.env });

  let log = '';
  const append = (chunk: Buffer) => {
    log = `${log}${chunk.toString()}`.slice(-LOG_LIMIT);
  };
  child.stdout?.on('data', append);
  child.stderr?.on('data', append);

  const timer = setTimeout(() => child.kill('SIGKILL'), RUN_TIMEOUT_MS);
  const code: number | null = await new Promise((resolve) => {
    child.once('error', () => resolve(-1));
    child.once('close', resolve);
  });
  clearTimeout(timer);

  const clean = log.trim();
  const indexed = Number(clean.match(/Finished\. (\d+) jobs indexed\./)?.[1] ?? 0);
  const ok = code === 0;
  await supabase
    .from(RUNS_TABLE)
    .update({
      status: ok ? 'success' : 'error',
      job_count: ok ? indexed : 0,
      message: clean || (ok ? 'Finished with no output.' : `Exited with code ${code}.`),
      finished_at: new Date().toISOString(),
      started_at: startedAt,
    })
    .eq('id', runId);

  return { ok, runId, indexed, code, message: clean.slice(-2000) };
}
