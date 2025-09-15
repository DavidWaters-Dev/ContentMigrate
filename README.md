# Content Migrator (Nuxt)

This app crawls a site, lets you select pages, and uses AI to convert content to Markdown for Nuxt Content. It preserves the existing styling and auth workflows (Kinde + Supabase), and adds configurable frontmatter, output folders, and local image saving.

Key features:

- Crawl + select pages (reusing existing workflow)
- AI conversion to Markdown with configurable frontmatter
- Save `.md`, optional `.yml` and `.json` sidecars to a chosen `content/` folder
- Download and rewrite images into a chosen `public/` folder
- LocalStorage keeps a log of converted pages (shows a "Converted" badge)

Note: This repository is now a standalone content migration tool. The previous SEO audit flow has been removed. A Supabase-backed job queue and worker throttle migration jobs for safe concurrency.

## Getting Started

1) Copy env template and fill in values

```bash
cp .env.example .env
```

Required keys (see comments in .env.example):

- `OPENAI_API_KEY` (server-only)
- `SUPABASE_URL`, `SUPABASE_KEY` (anon/public key for client), and `SUPABASE_SERVICE_ROLE_KEY` (server-only for worker)
- `NUXT_KINDE_*` Kinde auth settings

2) Install dependencies

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

3) Run database migrations

- Apply the SQL in:
  - `supabase/migrations/0001_usage_counters.sql`
  - `supabase/migrations/0004_refactor_usage_tokens.sql`
  - `supabase/migrations/0002_migration_jobs_queue.sql`
  See `docs/migrations.md` for details.

4) Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

5) Background processing (Supabase queue)

- Enable env: `MIGRATION_WORKER=1`, `SUPABASE_SERVICE_ROLE_KEY`.
- API:
  - `POST /api/migrate/enqueue` → `{ jobId, plannedPages }` (reserves quota when configured)
  - `GET /api/migrate/jobs/:id/status` → `{ status, results, logs }` (RLS: only job owner sees)
- Worker ticks `POST /api/migrate/worker-tick` internally and claims jobs via `fn_migration_jobs_claim`.
 - Concurrency:
   - `MIGRATION_WORKER_BATCH` (default 3) — max jobs claimed per tick
   - `MIGRATION_WORKER_CONCURRENCY` (default 1) — max jobs processed in parallel per tick
   - `MIGRATION_PAGE_CONCURRENCY` (default 2) — per-job page conversion concurrency

## Usage (Migration)

1. Visit `/migrate`.
2. Enter a site URL and start a crawl.
3. When pages are fetched, select the ones to convert.
4. Enable “Save with browser file picker” and click “Choose folder” (e.g., `/Users/you/Downloads/migration`).
5. Run migration. Files are written to your Downloads folder under `contentmigrate/`:
   - `Content/` for Markdown files (`<slug>.md`) and optional `.yml`/`.json`
   - `media/` for images (`media/<slug>/*`)
6. Converted pages are tracked in LocalStorage and marked with a badge in the list.
7. Visit `/jobs` to view your queued/completed migration jobs and details.

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

## Documentation

- Migrations: `docs/migrations.md`
- Tips for selectors, prompts, and folder strategies (coming soon)
