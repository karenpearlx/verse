-- "Where did you hear about us" attribution, asked once at signup.
-- Email signups carry the answer in auth metadata (copied here by the trigger);
-- Google signups write it from /auth/callback via the normal update-own-row policy.

alter table public.users add column if not exists referral_source text;

-- Keep the signup trigger in step: copy the answer across at account creation.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.users (id, email, referral_source)
  values (new.id, new.email, nullif(new.raw_user_meta_data ->> 'referral_source', ''))
  on conflict (id) do update set email = excluded.email;

  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

-- The admin console's Revenue section reads conversions for everyone, through
-- the same is_ally_admin() gate the rest of the console uses (admin-schema.sql).
drop policy if exists "Admins read subscription history" on public.subscription_history;
create policy "Admins read subscription history" on public.subscription_history
  for select to authenticated
  using ((select public.is_ally_admin()));

-- Backfill anything already sitting in auth metadata.
update public.users u
set referral_source = a.raw_user_meta_data ->> 'referral_source'
from auth.users a
where a.id = u.id
  and u.referral_source is null
  and nullif(a.raw_user_meta_data ->> 'referral_source', '') is not null;
