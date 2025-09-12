-- Audits and pages schema with RLS, for multi-tenant isolation

create table if not exists public.audits (
  id uuid primary key default gen_random_uuid(),
  user_key text not null default (current_setting('request.jwt.claims', true)::json ->> 'sub'),
  name text not null,
  slug text not null,
  target_url text not null,
  status text not null default 'draft' check (status in ('draft','crawling','crawled','analyzing','ready','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint audits_user_slug_unique unique (user_key, slug)
);

alter table public.audits enable row level security;

drop policy if exists "audits_select_own" on public.audits;
create policy "audits_select_own"
on public.audits for select using (
  user_key = (current_setting('request.jwt.claims', true)::json ->> 'sub')
);

drop policy if exists "audits_modify_own" on public.audits;
create policy "audits_modify_own"
on public.audits for all using (
  user_key = (current_setting('request.jwt.claims', true)::json ->> 'sub')
)
with check (
  user_key = (current_setting('request.jwt.claims', true)::json ->> 'sub')
);

create table if not exists public.audit_pages (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid not null references public.audits(id) on delete cascade,
  url text not null,
  score int,
  status text not null default 'new' check (status in ('new','crawled','analyzed','error')),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint audit_pages_unique_url unique (audit_id, url)
);

alter table public.audit_pages enable row level security;

drop policy if exists "audit_pages_select_own" on public.audit_pages;
create policy "audit_pages_select_own"
on public.audit_pages for select using (
  exists (
    select 1 from public.audits a
    where a.id = audit_pages.audit_id
      and a.user_key = (current_setting('request.jwt.claims', true)::json ->> 'sub')
  )
);

drop policy if exists "audit_pages_modify_own" on public.audit_pages;
create policy "audit_pages_modify_own"
on public.audit_pages for all using (
  exists (
    select 1 from public.audits a
    where a.id = audit_pages.audit_id
      and a.user_key = (current_setting('request.jwt.claims', true)::json ->> 'sub')
  )
)
with check (
  exists (
    select 1 from public.audits a
    where a.id = audit_pages.audit_id
      and a.user_key = (current_setting('request.jwt.claims', true)::json ->> 'sub')
  )
);

