import { ApiError, apiError, jsonObject, paginationFrom, paginationMeta, readJson, requireActiveUser, requireUser, stringField } from '@/lib/api';
import { RESUME_TEMPLATES } from '@/lib/resume';

function templateName(value: unknown, fallback = 'classic') {
  if (value == null) return fallback;
  if (typeof value !== 'string' || !RESUME_TEMPLATES.includes(value as typeof RESUME_TEMPLATES[number])) {
    throw new ApiError(400, `template_name must be one of: ${RESUME_TEMPLATES.join(', ')}.`);
  }
  return value;
}

function resumeContent(value: unknown) {
  const content = jsonObject(value, 'content');
  if (JSON.stringify(content).length > 200_000) throw new ApiError(400, 'Resume content is too large.');
  return content;
}

export async function GET(request: Request) {
  try {
    const { supabase, user } = await requireUser();
    const { limit, offset } = paginationFrom(request);
    const { data, error, count } = await supabase
      .from('resumes')
      .select('id,title,template_name,created_at,updated_at', { count: 'exact' })
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw error;
    const resumes = data ?? [];
    return Response.json({
      resumes,
      templates: RESUME_TEMPLATES,
      pagination: paginationMeta(count, limit, offset, resumes.length),
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireActiveUser();
    const body = await readJson(request);
    const record = {
      user_id: user.id,
      title: stringField(body.title, 'title', { max: 200 }) ?? 'Untitled resume',
      template_name: templateName(body.template_name),
      content: resumeContent(body.content),
    };
    // Saving a resume is free; only the export route spends a use. Charging
    // here too made save-then-download cost 2 of the 10 advertised exports.
    const { data, error } = await supabase.from('resumes').insert(record).select().single();
    if (error) throw error;
    return Response.json({ resume: data }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
