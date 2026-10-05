import { ApiError, apiError, readJson, stringField } from '@/lib/api';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { DEEP_COURSE_SLUGS } from '@/lib/deep-courses';

export const runtime = 'nodejs';

/**
 * Stores the 1-5 star rating left when someone finishes a course. Works
 * signed out too — progress is local-first, so a reader can finish a free
 * course without an account and their rating still counts. Signed-in raters
 * are deduplicated per course (rate again and it updates).
 */
export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const slug = stringField(body.slug, 'slug', { required: true, max: 80 })!;
    if (!DEEP_COURSE_SLUGS.includes(slug)) throw new ApiError(400, 'Unknown course.');
    const rating = Number(body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new ApiError(400, 'rating must be 1-5.');
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const db = createServiceClient();
    const { error } = user
      ? await db
          .from('course_feedback')
          .upsert({ user_id: user.id, slug, rating }, { onConflict: 'user_id,slug' })
      : await db.from('course_feedback').insert({ slug, rating });
    if (error) throw error;

    return Response.json({ saved: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return apiError(error);
  }
}
