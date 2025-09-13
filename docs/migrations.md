Supabase Migrations for Content Migrator

Run these SQL files in your Supabase project (via SQL Editor or CLI) in order:

1) `supabase/migrations/0001_usage_counters.sql`
   - Adds `usage_counters` and daily/monthly quota functions.

2) `supabase/migrations/0004_refactor_usage_tokens.sql`
   - Consolidates quota logic into `fn_usage_add` with timezone support.

3) `supabase/migrations/0002_migration_jobs_queue.sql`
   - Creates `migration_jobs` queue with claim/complete RPC functions.
   - RLS allows users to view their own jobs; worker functions run as security definer.

Environment variables required in the app:

- `SUPABASE_URL` and `SUPABASE_KEY` (anon) — for user-bound requests and RLS.
- `SUPABASE_SERVICE_ROLE_KEY` — for the worker to claim/complete jobs across users.
- `NUXT_KINDE_CLIENT_SECRET` — used to re-sign Kinde JWT claims so Supabase RLS sees `sub`.

Worker configuration:

- `MIGRATION_WORKER=1` to enable the local worker loop (default).
- `MIGRATION_WORKER_BATCH=3` to control batch size per tick.
- `MIGRATION_INTERVAL_MS=3000` to control polling frequency.

Rate limiting (optional, in-app):

- `RATE_LIMIT_WINDOW_MS` (default 60000)
- `RATE_LIMIT_MAX` (default 60)
- `RATE_LIMIT_PREFIXES` (comma-separated, default `/api/crawl,/api/migrate`)

