import { ApiError, apiError, readJson, requireActiveUser, requireUser, stringField, urlField, uuidField } from '@/lib/api';
import { FREE_SAVED_JOB_LIMIT, hasPaidAccess, readSubscription } from '@/lib/subscription';

const STATUSES = ['saved', 'applied', 'follow_up', 'interviewing', 'offer', 'accepted', 'rejected', 'withdrawn'] as const;

function editableFields(body: Record<string, unknown>) {
  const patch: Record<string, unknown> = {};
  if ('job_url' in body) patch.job_url = urlField(body.job_url, 'job_url', true);
  if ('job_title' in body) patch.job_title = stringField(body.job_title, 'job_title', { max: 300 });
  if ('company' in body) patch.company = stringField(body.company, 'company', { max: 300 });
  if ('notes' in body) patch.notes = stringField(body.notes, 'notes', { max: 20_000 });
  if ('status' in body) {
    if (typeof body.status !== 'string' || !STATUSES.includes(body.status as typeof STATUSES[number])) {
      throw new ApiError(400, `status must be one of: ${STATUSES.join(', ')}.`);
    }
    patch.status = body.status;
  }
  if ('links' in body) {
    if (!Array.isArray(body.links) || body.links.length > 20) throw new ApiError(400, 'links must be an array with at most 20 items.');
    patch.links = body.links.map((item) => urlField(item, 'link', true));
  }
  if ('follow_up_date' in body) {
    if (body.follow_up_date == null || body.follow_up_date === '') patch.follow_up_date = null;
    else if (typeof body.follow_up_date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.follow_up_date)) {
      patch.follow_up_date = body.follow_up_date;
    } else throw new ApiError(400, 'follow_up_date must use YYYY-MM-DD.');
  }
  if (!Object.keys(patch).length) throw new ApiError(400, 'No editable fields were provided.');
  return patch;
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { supabase, user } = await requireUser();
    const { id } = await context.params;
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('id', uuidField(id))
      .eq('user_id', user.id)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new ApiError(404, 'Application not found.');
    return Response.json({ application: data });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { supabase, user } = await requireActiveUser();
    const { id } = await context.params;
    const patch = editableFields(await readJson(request));

    // Moving a row into "saved" counts against the free limit exactly like
    // creating one there — otherwise create-as-applied-then-flip bypasses it.
    if (patch.status === 'saved') {
      const [{ data: current, error: currentError }, account, { count, error: countError }] = await Promise.all([
        supabase.from('applications').select('status').eq('id', uuidField(id)).eq('user_id', user.id).maybeSingle(),
        readSubscription(supabase, user.id),
        supabase.from('applications').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'saved'),
      ]);
      if (currentError) throw currentError;
      if (countError) throw countError;
      const alreadySaved = current?.status === 'saved';
      if (!alreadySaved && !hasPaidAccess(account) && (count ?? 0) >= FREE_SAVED_JOB_LIMIT) {
        throw new ApiError(403, `Free plans can save up to ${FREE_SAVED_JOB_LIMIT} jobs. Upgrade to Pro for unlimited saved jobs.`);
      }
    }

    const { data, error } = await supabase
      .from('applications')
      .update(patch)
      .eq('id', uuidField(id))
      .eq('user_id', user.id)
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new ApiError(404, 'Application not found.');
    return Response.json({ application: data });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { supabase, user } = await requireActiveUser();
    const { id } = await context.params;
    const { data, error } = await supabase
      .from('applications')
      .delete()
      .eq('id', uuidField(id))
      .eq('user_id', user.id)
      .select('id')
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new ApiError(404, 'Application not found.');
    return new Response(null, { status: 204 });
  } catch (error) {
    return apiError(error);
  }
}
