-- Migration jobs queue for multi-instance processing
-- Safe to run multiple times; uses IF NOT EXISTS where possible.

create extension if not exists pgcrypto;

create table if not exists public.migration_jobs (
  id uuid primary key default gen_random_uuid(),
  user_key text not null default (current_setting('request.jwt.claims', true)::json ->> 'sub'),
  payload jsonb not null,
  priority int not null default 100,
  status text not null default 'queued' check (status in ('queued','processing','completed','failed','cancelled')),
  attempts int not null default 0,
  max_attempts int not null default 3,
  locked_by text,
  locked_at timestamptz,
  run_at timestamptz not null default now(),
  results jsonb,
  logs jsonb not null default '[]'::jsonb,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists migration_jobs_queue_idx on public.migration_jobs (status, run_at, priority, created_at);
create index if not exists migration_jobs_user_idx on public.migration_jobs (user_key, created_at);

alter table public.migration_jobs enable row level security;

-- Users can read their own jobs
drop policy if exists "migration_jobs_select_own" on public.migration_jobs;
create policy "migration_jobs_select_own"
on public.migration_jobs for select using (
  user_key = (current_setting('request.jwt.claims', true)::json ->> 'sub')
);

-- Users can modify their own jobs (e.g., cancel)
drop policy if exists "migration_jobs_modify_own" on public.migration_jobs;
create policy "migration_jobs_modify_own"
on public.migration_jobs for all using (
  user_key = (current_setting('request.jwt.claims', true)::json ->> 'sub')
)
with check (
  user_key = (current_setting('request.jwt.claims', true)::json ->> 'sub')
);

-- Enqueue helper: runs as caller; RLS applies
create or replace function public.fn_migration_jobs_enqueue(
  p_payload jsonb,
  p_priority int default 100,
  p_run_at timestamptz default now()
)
returns uuid
language plpgsql
as $$
declare
  v_id uuid;
begin
  insert into public.migration_jobs(payload, priority, run_at)
  values (coalesce(p_payload, '{}'::jsonb), coalesce(p_priority, 100), coalesce(p_run_at, now()))
  returning id into v_id;
  return v_id;
end;
$$;

-- Claim next jobs: security definer to bypass RLS for workers
create or replace function public.fn_migration_jobs_claim(
  p_worker_id text,
  p_limit int default 1
)
returns setof public.migration_jobs
language plpgsql
security definer
as $$
declare
  v_job public.migration_jobs%rowtype;
begin
  for v_job in
    select * from public.migration_jobs
     where status = 'queued'
       and run_at <= now()
     order by priority asc, run_at asc, created_at asc
     for update skip locked
     limit p_limit
  loop
    update public.migration_jobs
       set status = 'processing', attempts = attempts + 1,
           locked_by = p_worker_id, locked_at = now(), updated_at = now()
     where id = v_job.id
     returning * into v_job;
    return next v_job;
  end loop;
end;
$$;

-- Complete a job and record results or error
create or replace function public.fn_migration_jobs_complete(
  p_job_id uuid,
  p_status text,
  p_results jsonb default null,
  p_logs jsonb default null,
  p_last_error text default null
)
returns void
language plpgsql
security definer
as $$
begin
  update public.migration_jobs
     set status = p_status,
         results = coalesce(p_results, results),
         logs = coalesce(p_logs, logs),
         last_error = coalesce(p_last_error, last_error),
         updated_at = now()
   where id = p_job_id;
end;
$$;

