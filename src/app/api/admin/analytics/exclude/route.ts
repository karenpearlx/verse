import { createHmac } from 'node:crypto';
import { ApiError, apiError } from '@/lib/api';
import { requireAdmin } from '@/lib/admin/auth';
import { recordAudit } from '@/lib/admin/data';

function clientIp(request: Request) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || null;
}
function hashFor(request: Request) {
  const secret = process.env.ANALYTICS_HASH_SECRET;
  const ip = clientIp(request);
  if (!secret) throw new ApiError(503, 'ANALYTICS_HASH_SECRET is not configured.');
  if (!ip) throw new ApiError(503, 'The server could not determine this device IP.');
  return createHmac('sha256', secret).update(ip).digest('hex');
}
function cookie(excluded: boolean) {
  return excluded
    ? 'ally_analytics_excluded=1; Path=/; Max-Age=31536000; HttpOnly; Secure; SameSite=Lax'
    : 'ally_analytics_excluded=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax';
}

export async function POST(request: Request) {
  try {
    const { supabase, user, email } = await requireAdmin();
    const hash = hashFor(request);
    const { error } = await supabase.from('analytics_exclusions').upsert({
      ip_hash: hash, label: 'Admin device', created_by: user.id,
    });
    if (error) throw error;
    const audit = await recordAudit(supabase, {
      actorId: user.id,
      actorEmail: email,
      action: 'analytics.exclusion.enable',
      subject: hash.slice(0, 16),
    });
    if (audit.error) {
      console.error(`[admin-action:${audit.correlationId}] Analytics exclusion changed without an audit row.`);
    }
    return Response.json({ excluded: true }, { headers: { 'Set-Cookie': cookie(true), 'Cache-Control': 'no-store' } });
  } catch (error) { return apiError(error); }
}

export async function DELETE(request: Request) {
  try {
    const { supabase, user, email } = await requireAdmin();
    const hash = hashFor(request);
    const { error } = await supabase.from('analytics_exclusions').delete().eq('ip_hash', hash);
    if (error) throw error;
    const audit = await recordAudit(supabase, {
      actorId: user.id,
      actorEmail: email,
      action: 'analytics.exclusion.disable',
      subject: hash.slice(0, 16),
    });
    if (audit.error) {
      console.error(`[admin-action:${audit.correlationId}] Analytics exclusion changed without an audit row.`);
    }
    return Response.json({ excluded: false }, { headers: { 'Set-Cookie': cookie(false), 'Cache-Control': 'no-store' } });
  } catch (error) { return apiError(error); }
}
