import { createClient } from '@/lib/supabase/server';
import { ApiError } from '@/lib/api';
import { isAdminEmail } from './config';

export type AdminIdentity = {
  id: string;
  email: string;
  role: 'admin' | 'superadmin';
  lastSignInAt: string | null;
};

/**
 * Two independent gates, both server-side.
 *
 *  1. ADMIN_EMAILS, an environment allowlist. Fails closed when unset.
 *  2. A row in public.admin_users with an admin role.
 *
 * supabase.auth.getUser() re-validates the JWT against the auth server, so a
 * forged cookie does not get you in. Never gate on a client-supplied email.
 * The service-role client exists only in server-only modules (checkout,
 * webhook, cron, analytics); admin reads still go through RLS where possible.
 */
export async function getAdminIdentity(): Promise<AdminIdentity | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  if (!isAdminEmail(data.user.email)) return null;
  const { data: admin } = await supabase
    .from('admin_users')
    .select('role')
    .eq('user_id', data.user.id)
    .in('role', ['admin', 'superadmin'])
    .maybeSingle();
  if (!admin) return null;
  return {
    id: data.user.id,
    email: data.user.email ?? '',
    role: admin.role as 'admin' | 'superadmin',
    lastSignInAt: data.user.last_sign_in_at ?? null,
  };
}

/** Throwing check for route handlers. 401 when signed out, 403 when not an admin. */
export async function requireAdmin() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new ApiError(401, 'Sign in to continue.');
  if (!isAdminEmail(data.user.email)) throw new ApiError(403, 'This account is not a Verse admin.');
  const { data: admin, error: adminError } = await supabase
    .from('admin_users')
    .select('role')
    .eq('user_id', data.user.id)
    .in('role', ['admin', 'superadmin'])
    .maybeSingle();
  if (adminError || !admin) throw new ApiError(403, 'This account is not a Verse admin.');
  return {
    supabase,
    user: data.user,
    email: data.user.email ?? '',
    role: admin.role as 'admin' | 'superadmin',
  };
}
