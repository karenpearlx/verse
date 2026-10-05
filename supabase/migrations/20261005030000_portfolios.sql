-- Public portfolios: vrsfd.com/p/<username>.
--
-- One row per account. The public page is rendered server-side with the
-- service key, and all writes go through /api/portfolio, so RLS stays
-- owner-only: nothing here is readable or writable from a browser directly.

create table if not exists public.portfolios (
  user_id uuid primary key references auth.users (id) on delete cascade,
  username text not null,
  published boolean not null default false,
  -- Section toggles, work samples, course snapshot. Parsed and clamped by the
  -- API on write and by the renderer on read; the DB only guards size.
  config jsonb not null default '{}'::jsonb,
  -- Theme preset, accent, font pair, section order. Same discipline.
  theme jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint portfolios_username_shape check (username ~ '^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$'),
  constraint portfolios_config_size check (pg_column_size(config) < 100000),
  constraint portfolios_theme_size check (pg_column_size(theme) < 10000)
);

create unique index if not exists uq_portfolios_username on public.portfolios (lower(username));

alter table public.portfolios enable row level security;

drop policy if exists "Owners read own portfolio" on public.portfolios;
create policy "Owners read own portfolio" on public.portfolios
  for select using ((select auth.uid()) = user_id);

-- Keep updated_at honest (reuses the shared trigger function if present).
do $$
begin
  if exists (select 1 from pg_proc where proname = 'set_updated_at') then
    drop trigger if exists portfolios_set_updated_at on public.portfolios;
    create trigger portfolios_set_updated_at before update on public.portfolios
      for each row execute function set_updated_at();
  end if;
end $$;

-- Storage bucket for work-sample images, same pattern as avatars:
-- public read, authenticated users write only inside their own folder.
insert into storage.buckets (id, name, public)
values ('portfolio', 'portfolio', true)
on conflict (id) do nothing;

drop policy if exists "Portfolio images are public" on storage.objects;
create policy "Portfolio images are public" on storage.objects
  for select using (bucket_id = 'portfolio');

drop policy if exists "Users upload own portfolio images" on storage.objects;
create policy "Users upload own portfolio images" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'portfolio' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Users update own portfolio images" on storage.objects;
create policy "Users update own portfolio images" on storage.objects
  for update to authenticated
  using (bucket_id = 'portfolio' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Users delete own portfolio images" on storage.objects;
create policy "Users delete own portfolio images" on storage.objects
  for delete to authenticated
  using (bucket_id = 'portfolio' and (storage.foldername(name))[1] = (select auth.uid())::text);
