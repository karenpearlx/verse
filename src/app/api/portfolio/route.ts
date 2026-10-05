import { ApiError, apiError, readJson, requireActiveUser, requireUser } from '@/lib/api';
import { createServiceClient } from '@/lib/supabase/service';
import { hasPaidAccess, readSubscription } from '@/lib/subscription';
import { cleanUsername, isDefaultTheme, parseConfig, parseTheme } from '@/lib/portfolio';

export const runtime = 'nodejs';

/**
 * The portfolio editor's backend. All writes go through here (service key)
 * so RLS on public.portfolios can stay owner-read-only, and so the Pro gate
 * on custom themes is enforced somewhere a browser cannot reach.
 */

/** GET -> own portfolio; GET ?check=<name> -> username availability. */
export async function GET(request: Request) {
  try {
    const { user } = await requireUser();
    const db = createServiceClient();
    const check = new URL(request.url).searchParams.get('check');

    if (check !== null) {
      const username = cleanUsername(check);
      if (!username) return Response.json({ available: false, reason: 'invalid' });
      const { data, error } = await db
        .from('portfolios')
        .select('user_id')
        .eq('username', username)
        .maybeSingle();
      if (error) throw error;
      const available = !data || data.user_id === user.id;
      return Response.json({ available }, { headers: { 'Cache-Control': 'no-store' } });
    }

    const { data, error } = await db
      .from('portfolios')
      .select('username,published,config,theme')
      .eq('user_id', user.id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return Response.json({ portfolio: null }, { headers: { 'Cache-Control': 'no-store' } });
    return Response.json(
      {
        portfolio: {
          username: data.username,
          published: Boolean(data.published),
          config: parseConfig(data.config),
          theme: parseTheme(data.theme),
        },
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const { supabase, user } = await requireActiveUser();
    const body = await readJson(request);

    const username = cleanUsername(body.username);
    if (!username) {
      throw new ApiError(400, 'Usernames are 3-30 characters: lowercase letters, numbers and hyphens.');
    }
    const published = body.published === true;
    const config = parseConfig(body.config);
    const theme = parseTheme(body.theme);

    // Custom themes are the Pro part. The default look is free for everyone.
    if (!isDefaultTheme(theme)) {
      const paid = hasPaidAccess(await readSubscription(supabase, user.id));
      if (!paid) {
        throw new ApiError(403, 'Custom themes are a Pro feature. Your portfolio works on the default theme for free.');
      }
    }

    const db = createServiceClient();
    const { data: taken, error: checkError } = await db
      .from('portfolios')
      .select('user_id')
      .eq('username', username)
      .maybeSingle();
    if (checkError) throw checkError;
    if (taken && taken.user_id !== user.id) {
      throw new ApiError(409, 'That username is taken — try another.');
    }

    const { error } = await db.from('portfolios').upsert(
      {
        user_id: user.id,
        username,
        published,
        config: config as unknown as Record<string, unknown>,
        theme: theme as unknown as Record<string, unknown>,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );
    if (error) throw error;

    return Response.json(
      { saved: true, url: `https://vrsfd.com/p/${username}` },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    return apiError(error);
  }
}
