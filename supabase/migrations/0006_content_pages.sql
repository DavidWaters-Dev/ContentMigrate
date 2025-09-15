-- Content pages storage for selective migration

create table if not exists public.content_crawls (
  id uuid primary key default gen_random_uuid(),
  user_key text not null default (current_setting('request.jwt.claims', true)::json ->> 'sub'),
  root_url text not null,
  strategy text not null default 'sitemap+internal',
  include_prefixes text[] not null default '{}',
  exclude_prefixes text[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.content_crawls enable row level security;
drop policy if exists "content_crawls_select_own" on public.content_crawls;
create policy "content_crawls_select_own" on public.content_crawls for select using (
  user_key = (current_setting('request.jwt.claims', true)::json ->> 'sub')
);
drop policy if exists "content_crawls_modify_own" on public.content_crawls;
create policy "content_crawls_modify_own" on public.content_crawls for all using (
  user_key = (current_setting('request.jwt.claims', true)::json ->> 'sub')
) with check (
  user_key = (current_setting('request.jwt.claims', true)::json ->> 'sub')
);

create table if not exists public.content_pages (
  id uuid primary key default gen_random_uuid(),
  user_key text not null default (current_setting('request.jwt.claims', true)::json ->> 'sub'),
  crawl_id uuid references public.content_crawls(id) on delete set null,
  url text not null,
  path text generated always as (substring(url from 'https?://[^/]+(.*)$')) stored,
  status text not null default 'new' check (status in ('new','migrated')),
  migrated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint content_pages_user_url_unique unique (user_key, url)
);
create index if not exists content_pages_user_status_idx on public.content_pages(user_key, status, created_at desc);
create index if not exists content_pages_user_path_idx on public.content_pages(user_key, path);

alter table public.content_pages enable row level security;
drop policy if exists "content_pages_select_own" on public.content_pages;
create policy "content_pages_select_own" on public.content_pages for select using (
  user_key = (current_setting('request.jwt.claims', true)::json ->> 'sub')
);
drop policy if exists "content_pages_modify_own" on public.content_pages;
create policy "content_pages_modify_own" on public.content_pages for all using (
  user_key = (current_setting('request.jwt.claims', true)::json ->> 'sub')
) with check (
  user_key = (current_setting('request.jwt.claims', true)::json ->> 'sub')
);

-- Mark pages migrated helper (batch by url)
create or replace function public.fn_pages_mark_migrated(p_urls text[])
returns void language plpgsql security definer as $$
declare v_user text := (current_setting('request.jwt.claims', true)::json ->> 'sub');
begin
  update public.content_pages
     set status = 'migrated', migrated_at = now(), updated_at = now()
   where user_key = v_user and url = any(p_urls);
end;$$;

