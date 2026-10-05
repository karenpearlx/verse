import { apiError } from '@/lib/api';
import { requireAdmin } from '@/lib/admin/auth';
import { readAttribution } from '@/lib/admin/data';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const { supabase } = await requireAdmin();
    const raw = Number(new URL(request.url).searchParams.get('days') ?? 90);
    const days = [30, 90, 365].includes(raw) ? raw : 90;
    return Response.json(await readAttribution(supabase, days), {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    return apiError(error);
  }
}
