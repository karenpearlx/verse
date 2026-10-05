-- One row per browser that opted into push notifications.
-- Written by the app server (service role) with the user id taken from the
-- session; the daily digest sender reads the lot and prunes dead endpoints.

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_push_subscriptions_user
  on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

-- Users can see and remove their own device subscriptions.
drop policy if exists "Own push subscriptions" on public.push_subscriptions;
create policy "Own push subscriptions"
  on public.push_subscriptions
  for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
