import { apiError } from '@/lib/api';
import { requireAdmin } from '@/lib/admin/auth';
import { readCourseCompletions } from '@/lib/admin/data';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Finished courses and their star ratings for the admin Content section.
 * requireAdmin gates the door; the read itself uses the service client
 * because course_feedback deliberately has no RLS policies.
 */
export async function GET() {
  try {
    await requireAdmin();
    return Response.json(await readCourseCompletions(createServiceClient()), {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    return apiError(error);
  }
}
