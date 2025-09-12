-- Refactor usage functions to a single tokens-friendly function

-- Optional: index to speed up counter lookups
create index if not exists usage_counters_idx on public.usage_counters (user_key, action, period_date);

-- Drop legacy helpers if present
drop function if exists public.fn_check_and_increment(text, int, text);
drop function if exists public.fn_check_and_add_usage(text, int, int, text);

-- Unified function to add arbitrary usage with a limit
create or replace function public.fn_usage_add(
  p_action text,
  p_amount int,
  p_limit int,
  p_period text default 'day',
  p_timezone text default 'UTC'
)
returns table(allowed boolean, remaining int, current_count int)
language plpgsql
security definer
as $$
declare
  v_user text := (current_setting('request.jwt.claims', true)::json ->> 'sub');
  v_now timestamptz := (now() at time zone p_timezone);
  v_period_date date := case
    when p_period = 'day' then date(v_now)
    when p_period = 'month' then date_trunc('month', v_now)::date
    else date(v_now)
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

