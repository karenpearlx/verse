-- Billing / Pro access for PayMongo Hosted Checkout (prepaid 30 days).
-- Required by checkout, webhook activate_pro_checkout, and free-tier tool limits.

-- ---------- users: subscription + usage columns ----------

alter table public.users
  add column if not exists subscription_tier text not null default 'free'
    check (subscription_tier in ('free', 'pro', 'creator')),
  add column if not exists subscription_status text
    check (subscription_status is null or subscription_status in ('active', 'cancelled', 'past_due')),
  add column if not exists subscription_ends_at timestamptz,
  add column if not exists paymongo_customer_id text,
  add column if not exists paymongo_subscription_id text,
  add column if not exists paymongo_checkout_session_id text,
  add column if not exists cover_letter_uses integer not null default 0 check (cover_letter_uses >= 0),
  add column if not exists resume_uses integer not null default 0 check (resume_uses >= 0);

create index if not exists idx_users_paymongo_customer
  on public.users (paymongo_customer_id)
  where paymongo_customer_id is not null;

create index if not exists idx_users_paymongo_subscription
  on public.users (paymongo_subscription_id)
  where paymongo_subscription_id is not null;

-- ---------- subscription event history (idempotent by provider_event_id) ----------

create table if not exists public.subscription_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  provider_event_id text not null,
  event_type text not null,
  from_tier text,
  to_tier text,
  status text,
  amount integer,
  currency text,
  paymongo_resource_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (provider_event_id)
);

create index if not exists idx_subscription_history_user
  on public.subscription_history (user_id, created_at desc);

alter table public.subscription_history enable row level security;

drop policy if exists subscription_history_select_own on public.subscription_history;
create policy subscription_history_select_own
  on public.subscription_history
  for select
  to authenticated
  using (user_id = auth.uid());

-- No client inserts/updates: webhook uses the service role.

-- ---------- activate Pro after Hosted Checkout payment ----------

create or replace function public.activate_pro_checkout(
  event_id text,
  account_id uuid,
  checkout_id text,
  paid_amount integer,
  paid_currency text,
  event_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_from text;
  v_inserted uuid;
begin
  if event_id is null or length(event_id) = 0 then
    raise exception 'event_id required';
  end if;
  if account_id is null then
    raise exception 'account_id required';
  end if;

  select subscription_tier into v_from
  from public.users
  where id = account_id
  for update;

  if not found then
    raise exception 'account not found';
  end if;

  insert into public.subscription_history (
    user_id,
    provider_event_id,
    event_type,
    from_tier,
    to_tier,
    status,
    amount,
    currency,
    paymongo_resource_id,
    metadata
  )
  values (
    account_id,
    event_id,
    'checkout_session.payment.paid',
    v_from,
    case when v_from = 'creator' then 'creator' else 'pro' end,
    'active',
    paid_amount,
    coalesce(paid_currency, 'PHP'),
    checkout_id,
    coalesce(event_metadata, '{}'::jsonb)
  )
  on conflict (provider_event_id) do nothing
  returning id into v_inserted;

  -- Already processed this webhook event.
  if v_inserted is null then
    return;
  end if;

  update public.users
  set
    subscription_tier = case when subscription_tier = 'creator' then 'creator' else 'pro' end,
    subscription_status = 'active',
    subscription_ends_at = (greatest(coalesce(subscription_ends_at, now()), now()) + interval '30 days'),
    paymongo_checkout_session_id = checkout_id,
    updated_at = now()
  where id = account_id;
end;
$$;

revoke all on function public.activate_pro_checkout(text, uuid, text, integer, text, jsonb) from public;
grant execute on function public.activate_pro_checkout(text, uuid, text, integer, text, jsonb) to service_role;

-- ---------- free-tier tool counters ----------

create or replace function public.consume_feature_use(feature_name text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_tier text;
  v_status text;
  v_ends timestamptz;
  v_paid boolean;
  v_used integer;
  v_limit integer;
  v_col text;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  if feature_name = 'cover_letter' then
    v_col := 'cover_letter_uses';
    v_limit := 10;
  elsif feature_name = 'resume' then
    v_col := 'resume_uses';
    v_limit := 10;
  else
    raise exception 'unknown feature';
  end if;

  select subscription_tier, subscription_status, subscription_ends_at
  into v_tier, v_status, v_ends
  from public.users
  where id = v_uid
  for update;

  if not found then
    insert into public.users (id) values (v_uid)
    on conflict (id) do nothing;
    v_tier := 'free';
    v_status := null;
    v_ends := null;
  end if;

  v_paid := v_tier in ('pro', 'creator')
    and v_status = 'active'
    and (v_ends is null or v_ends > now());

  if v_paid then
    return jsonb_build_object(
      'allowed', true,
      'used', 0,
      'usage_limit', null,
      'tier', v_tier
    );
  end if;

  if feature_name = 'cover_letter' then
    update public.users
    set cover_letter_uses = cover_letter_uses + 1, updated_at = now()
    where id = v_uid and cover_letter_uses < v_limit
    returning cover_letter_uses into v_used;
  else
    update public.users
    set resume_uses = resume_uses + 1, updated_at = now()
    where id = v_uid and resume_uses < v_limit
    returning resume_uses into v_used;
  end if;

  if v_used is null then
    if feature_name = 'cover_letter' then
      select cover_letter_uses into v_used from public.users where id = v_uid;
    else
      select resume_uses into v_used from public.users where id = v_uid;
    end if;
    return jsonb_build_object(
      'allowed', false,
      'used', coalesce(v_used, v_limit),
      'usage_limit', v_limit,
      'tier', coalesce(v_tier, 'free')
    );
  end if;

  return jsonb_build_object(
    'allowed', true,
    'used', v_used,
    'usage_limit', v_limit,
    'tier', coalesce(v_tier, 'free')
  );
end;
$$;

revoke all on function public.consume_feature_use(text) from public;
grant execute on function public.consume_feature_use(text) to authenticated;
