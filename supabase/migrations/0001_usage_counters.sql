-- Usage counters table and atomic check+increment function

create table if not exists public.usage_counters (
  user_key text not null,
  period_date date not null,
  action text not null,
  count int not null default 0,
  constraint usage_counters_pk primary key (user_key, period_date, action)
);

alter table public.usage_counters enable row level security;

-- Recreate policies idempotently (CREATE POLICY has no IF NOT EXISTS on some engines)
drop policy if exists "Users can see own usage" on public.usage_counters;
create policy "Users can see own usage"
on public.usage_counters
for select using (
  user_key = (current_setting('request.jwt.claims', true)::json ->> 'sub')
);

drop policy if exists "Users can update own usage" on public.usage_counters;
create policy "Users can update own usage"
on public.usage_counters
for all using (
  user_key = (current_setting('request.jwt.claims', true)::json ->> 'sub')
)
with check (
  user_key = (current_setting('request.jwt.claims', true)::json ->> 'sub')
);

create or replace function public.fn_check_and_increment(
  p_action text,
  p_limit int,
  p_period text default 'day'
)
returns table(allowed boolean, remaining int, current_count int)
language plpgsql
security definer
as $$
declare
  v_user text := (current_setting('request.jwt.claims', true)::json ->> 'sub');
  v_period_date date := case
    when p_period = 'day' then current_date
    when p_period = 'month' then date_trunc('month', now())::date
    else current_date
  end;
  v_count int;
begin
  if v_user is null then
    return query select false, 0, 0;
    return;
  end if;

  insert into public.usage_counters(user_key, period_date, action, count)
  values (v_user, v_period_date, p_action, 0)
  on conflict (user_key, period_date, action) do nothing;

  select count into v_count from public.usage_counters
    where user_key = v_user and period_date = v_period_date and action = p_action
    for update;

  if v_count >= p_limit then
    return query select false, 0, v_count;
    return;
  end if;

  update public.usage_counters
    set count = count + 1
    where user_key = v_user and period_date = v_period_date and action = p_action
    returning count into v_count;

  return query select true, greatest(p_limit - v_count, 0), v_count;
end;
$$;

-- Add function to add arbitrary amounts (e.g., AI tokens) with limit check
create or replace function public.fn_check_and_add_usage(
  p_action text,
  p_amount int,
  p_limit int,
  p_period text default 'day'
)
returns table(allowed boolean, remaining int, current_count int)
language plpgsql
security definer
as $$
declare
  v_user text := (current_setting('request.jwt.claims', true)::json ->> 'sub');
  v_period_date date := case
    when p_period = 'day' then current_date
    when p_period = 'month' then date_trunc('month', now())::date
    else current_date
  end;
  v_count int;
begin
  if v_user is null then
    return query select false, 0, 0;
    return;
  end if;

  insert into public.usage_counters(user_key, period_date, action, count)
  values (v_user, v_period_date, p_action, 0)
  on conflict (user_key, period_date, action) do nothing;

  select count into v_count from public.usage_counters
    where user_key = v_user and period_date = v_period_date and action = p_action
    for update;

  if v_count + p_amount > p_limit then
    return query select false, greatest(p_limit - v_count, 0), v_count;
    return;
  end if;

  update public.usage_counters
    set count = count + p_amount
    where user_key = v_user and period_date = v_period_date and action = p_action
    returning count into v_count;

  return query select true, greatest(p_limit - v_count, 0), v_count;
end;
$$;
