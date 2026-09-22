import { createClient } from '@/lib/supabase/server';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function requireUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new ApiError(401, 'Sign in to continue.');
  return { supabase, user };
}

/**
 * Authenticate a mutating request and reject suspended accounts.
 *
 * Reads intentionally use requireUser(): suspension preserves access to saved
 * data. RLS repeats this write guard so a caller cannot bypass the API by
 * sending requests directly to Supabase REST.
 */
export async function requireActiveUser() {
  const { supabase, user } = await requireUser();
  const { data: row, error } = await supabase
    .from('users')
    .select('status')
    .eq('id', user.id)
    .maybeSingle();

  // Older databases may not have the moderation column yet. The RLS migration
  // is the enforcement boundary once installed, so do not lock every account
  // out merely because this compatibility lookup failed.
  if (!error && row?.status === 'suspended') {
    throw new ApiError(403, 'This account is suspended. Email support if you think that is a mistake.');
  }

  return { supabase, user };
}

export async function consumeFeatureUse(
  supabase: Awaited<ReturnType<typeof createClient>>,
  feature: 'cover_letter' | 'resume',
) {
  const { data, error } = await supabase.rpc('consume_feature_use', { feature_name: feature });
  if (error) throw error;
  const result = (Array.isArray(data) ? data[0] : data) as {
    allowed?: boolean;
    used?: number;
    usage_limit?: number | null;
    tier?: string;
  } | null;
  if (!result?.allowed) {
    const label = feature === 'resume' ? 'resume exports' : 'cover letters';
    throw new ApiError(
      403,
      `You've used your ${result?.usage_limit ?? 10} free ${label} — everything you already made is safe and stays yours. Pro is ₱199 for 30 days, no auto-renew, and removes the limit.`,
    );
  }
  return result;
}

type PostgrestErrorLike = { code?: unknown };

/** Translate stable Postgres/PostgREST codes without relying on message text. */
export function postgrestStatus(error: unknown): number | null {
  if (!error || typeof error !== 'object') return null;
  const code = (error as PostgrestErrorLike).code;
  if (code === 'PGRST116') return 404;
  if (code === '23505') return 409;
  if (code === '23503') return 409;
  if (code === '23514') return 400;
  if (code === '23502') return 400;
  if (code === '42501') return 403;
  if (code === '22P02') return 400;
  if (code === 'PGRST204') return 500;
  return null;
}

function postgrestMessage(error: unknown): string | null {
  if (!error || typeof error !== 'object') return null;
  const message = (error as { message?: unknown }).message;
  return typeof message === 'string' && message.trim() ? message.trim() : null;
}

export function apiError(error: unknown) {
  if (error instanceof ApiError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  if (error && typeof error === 'object' && (error as { code?: string }).code === 'P0001') {
    const message = (error as { message?: string }).message || 'That action is not available on your current plan.';
    return Response.json({ error: message }, { status: 403 });
  }
  const mappedStatus = postgrestStatus(error);
  if (mappedStatus != null) {
    const code = (error as PostgrestErrorLike).code;
    const dbMessage = postgrestMessage(error);
    // Check / not-null violations: the DB message names the constraint and is
    // the fastest way to spot a missing migration (e.g. status lacks 'saved').
    const message = (code === '23514' || code === '23502' || code === 'PGRST204') && dbMessage
      ? dbMessage
      : mappedStatus === 404
        ? 'The requested item was not found.'
        : mappedStatus === 409
          ? 'That change conflicts with existing data.'
          : mappedStatus === 403
            ? 'You do not have permission to make that change.'
            : 'The request contains an invalid value.';
    return Response.json({ error: message }, { status: mappedStatus });
  }
  // Other PostgREST/Postgres errors: operational text only, no stack traces.
  const fallback = postgrestMessage(error);
  if (fallback && error && typeof error === 'object' && typeof (error as { code?: unknown }).code === 'string') {
    console.error(error);
    return Response.json({ error: fallback }, { status: 500 });
  }
  console.error(error);
  return Response.json({ error: 'Unexpected server error.' }, { status: 500 });
}

export function paginationFrom(request: Request) {
  const params = new URL(request.url).searchParams;
  const rawLimit = params.get('limit');
  const rawOffset = params.get('offset');
  const limit = rawLimit == null ? 20 : Number(rawLimit);
  const offset = rawOffset == null ? 0 : Number(rawOffset);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new ApiError(400, 'limit must be a whole number from 1 to 100.');
  }
  if (!Number.isInteger(offset) || offset < 0 || offset > 1_000_000) {
    throw new ApiError(400, 'offset must be a whole number from 0 to 1000000.');
  }
  return { limit, offset };
}

export function paginationMeta(total: number | null, limit: number, offset: number, returned: number) {
  const count = total ?? 0;
  return {
    limit,
    offset,
    total: count,
    has_more: offset + returned < count,
  };
}

export async function readJson(request: Request) {
  try {
    return await request.json() as Record<string, unknown>;
  } catch {
    throw new ApiError(400, 'Request body must be valid JSON.');
  }
}

export function stringField(value: unknown, name: string, options: { required?: boolean; max?: number } = {}) {
  if (value == null || value === '') {
    if (options.required) throw new ApiError(400, `${name} is required.`);
    return null;
  }
  if (typeof value !== 'string') throw new ApiError(400, `${name} must be a string.`);
  const clean = value.trim();
  if (options.required && !clean) throw new ApiError(400, `${name} is required.`);
  if (options.max && clean.length > options.max) throw new ApiError(400, `${name} is too long.`);
  return clean || null;
}

export function urlField(value: unknown, name: string, required = false) {
  const clean = stringField(value, name, { required, max: 2_048 });
  if (!clean) return null;
  try {
    const url = new URL(clean);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
    return url.toString();
  } catch {
    throw new ApiError(400, `${name} must be a valid http or https URL.`);
  }
}

export function uuidField(value: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    throw new ApiError(400, 'Invalid id.');
  }
  return value;
}

export function jsonObject(value: unknown, name: string) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ApiError(400, `${name} must be an object.`);
  }
  return value as Record<string, unknown>;
}
