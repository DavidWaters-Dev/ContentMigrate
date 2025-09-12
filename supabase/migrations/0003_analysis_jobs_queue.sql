-- Analysis jobs queue with claim/complete helpers

create table if not exists public.analysis_jobs (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid not null references public.audits(id) on delete cascade,
  page_id uuid references public.audit_pages(id) on delete cascade,
  type text not null check (type in ('page_analysis','site_consolidation')),
  priority int not null default 100,
  status text not null default 'queued' check (status in ('queued','processing','completed','failed','cancelled')),
  attempts int not null default 0,
  max_attempts int not null default 3,
  locked_by text,
  locked_at timestamptz,
  run_at timestamptz not null default now(),
  last_error text,
  tokens_used int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists analysis_jobs_queue_idx on public.analysis_jobs (status, run_at, priority, created_at);
create index if not exists analysis_jobs_audit_idx on public.analysis_jobs (audit_id);

alter table public.analysis_jobs enable row level security;

drop policy if exists "analysis_jobs_select_own" on public.analysis_jobs;
create policy "analysis_jobs_select_own"
on public.analysis_jobs for select using (
  exists (
    select 1 from public.audits a
    where a.id = analysis_jobs.audit_id
      and a.user_key = (current_setting('request.jwt.claims', true)::json ->> 'sub')
  )
);

drop policy if exists "analysis_jobs_modify_own" on public.analysis_jobs;
create policy "analysis_jobs_modify_own"
on public.analysis_jobs for all using (
  exists (
    select 1 from public.audits a
    where a.id = analysis_jobs.audit_id
      and a.user_key = (current_setting('request.jwt.claims', true)::json ->> 'sub')
  )
)
with check (
  exists (
    select 1 from public.audits a
    where a.id = analysis_jobs.audit_id
      and a.user_key = (current_setting('request.jwt.claims', true)::json ->> 'sub')
  )
);

-- Claim next jobs (service role should call this). Returns up to p_limit rows.
create or replace function public.fn_jobs_claim(
  p_worker_id text,
  p_types text[] default null,
  p_limit int default 1
)
returns setof public.analysis_jobs
language plpgsql
security definer
as $$
declare
  v_job public.analysis_jobs%rowtype;
begin
  for v_job in
    select * from public.analysis_jobs
     where status = 'queued'
       and run_at <= now()
       and (p_types is null or type = any(p_types))
     order by priority asc, run_at asc, created_at asc
     for update skip locked
     limit p_limit
  loop
    update public.analysis_jobs
       set status = 'processing', attempts = attempts + 1,
           locked_by = p_worker_id, locked_at = now(), updated_at = now()
     where id = v_job.id
     returning * into v_job;
    return next v_job;
  end loop;
end;
$$;

-- Complete a job and record tokens used (if any)
create or replace function public.fn_jobs_complete(
  p_job_id uuid,
  p_status text,
  p_tokens_used int default 0,
  p_last_error text default null
)
returns void
language plpgsql
security definer
as $$
begin
  update public.analysis_jobs
     set status = p_status,
         tokens_used = coalesce(tokens_used,0) + coalesce(p_tokens_used,0),
         last_error = coalesce(p_last_error, last_error),
         updated_at = now()
   where id = p_job_id;
end;
$$;

