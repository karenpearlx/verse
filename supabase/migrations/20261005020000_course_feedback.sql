-- 1-5 star "How did it go?" ratings left at the end of a course.
-- Written only by the API route with the service key; no client access, so
-- RLS is enabled with no policies on purpose.

-- A course_feedback table from an earlier experiment may already exist with a
-- different shape (no slug column). Move it aside rather than dropping it, so
-- nothing is ever lost, then build the real one.
do $$
begin
  if exists (
    select from information_schema.tables
    where table_schema = 'public' and table_name = 'course_feedback'
  ) and not exists (
    select from information_schema.columns
    where table_schema = 'public' and table_name = 'course_feedback' and column_name = 'slug'
  ) then
    alter table public.course_feedback rename to course_feedback_legacy;
  end if;
end $$;

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
