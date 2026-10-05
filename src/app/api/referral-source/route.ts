import { ApiError, apiError, readJson, stringField } from '@/lib/api';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { isReferralSource } from '@/lib/referral-sources';

export const runtime = 'nodejs';

/**
 * Records the "Where did you hear about Verse?" answer for the signed-in
 * account. Written with the service key because browsers cannot reliably
 * update public.users under RLS in every environment — this is the same
 * trusted-route pattern as /api/course-feedback.
 *
 * First answer wins: once a source is on the account, later calls are
 * accepted but do not overwrite it, so the attribution numbers stay honest.
 */
export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const source = stringField(body.source, 'source', { required: true, max: 40 })!;
    if (!isReferralSource(source)) throw new ApiError(400, 'Unknown source.');

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new ApiError(401, 'Sign in first.');

    const db = createServiceClient();

    // Only fill the blank — never overwrite an existing answer.
    const { data: updated, error: updateError } = await db
      .from('users')
      .update({ referral_source: source })
      .eq('id', user.id)
      .is('referral_source', null)
      .select('id');
    if (updateError) throw updateError;

    // No row updated: either already answered (fine) or the users row does
    // not exist yet for an older account — create it so the answer sticks.
    if (!updated?.length) {
      const { data: existing, error: readError } = await db
        .from('users')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();
      if (readError) throw readError;
      if (!existing) {
        const { error: insertError } = await db
          .from('users')
          .insert({ id: user.id, email: user.email, referral_source: source });
        if (insertError) throw insertError;
      }
    }

    return Response.json({ saved: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return apiError(error);
  }
}
