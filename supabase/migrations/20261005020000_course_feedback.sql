-- 1-5 star "How did it go?" ratings left at the end of a course.
-- Written only by the API route with the service key; no client access, so
-- RLS is enabled with no policies on purpose.

create table if not exists public.course_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  slug text not null,
  rating smallint not null check (rating between 1 and 5),
  created_at timestamptz not null default now()
);

create index if not exists idx_course_feedback_slug on public.course_feedback (slug);

-- One rating per signed-in user per course: a second tap updates, not stacks.
-- NULL user_ids are distinct by default, so anonymous ratings still insert.
create unique index if not exists uq_course_feedback_user_slug
  on public.course_feedback (user_id, slug);

alter table public.course_feedback enable row level security;
