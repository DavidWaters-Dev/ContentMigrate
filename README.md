# Content Migrator (Nuxt)

This app crawls a site, lets you select pages, and uses AI to convert content to Markdown for Nuxt Content. It preserves the existing styling and auth workflows (Kinde + Supabase), and adds configurable frontmatter, output folders, and local image saving.

Key features:

- Crawl + select pages (reusing existing workflow)
- AI conversion to Markdown with configurable frontmatter
- Save `.md`, optional `.yml` and `.json` sidecars to a chosen `content/` folder
- Download and rewrite images into a chosen `public/` folder
- LocalStorage keeps a log of converted pages (shows a "Converted" badge)

Note: This repository is now a standalone content migration tool. The previous SEO audit flow has been removed. A lightweight in‑memory worker queue throttles migration jobs for safe concurrency.

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

3) Run database migrations (optional for quotas)

- Apply the SQL in `supabase/migrations/0001_usage_counters.sql` and `0004_refactor_usage_tokens.sql` if you want daily/monthly quota tracking with Supabase RPC (`fn_usage_add`).

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

5) Background processing

Set `MIGRATION_WORKER=1` (default) to enable a small in‑memory worker that processes enqueued migration jobs sequentially. Endpoints:

- `POST /api/migrate/enqueue` → `{ jobId }`
- `GET /api/migrate/jobs/:id/status` → `{ status, results, logs }`

Dev tip: Interval is configurable via `MIGRATION_INTERVAL_MS`.

## Usage (Migration)

1. Visit `/migrate`.
2. Enter a site URL and start a crawl.
3. When pages are fetched, select the ones to convert.
4. Configure content folder, media folder, frontmatter keys, and optional selector/prompt.
5. Run migration. Files will be written to your project (e.g., `content/...`, `public/images/...`).
6. Converted pages are tracked in LocalStorage and marked with a badge in the list.

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

- Coming soon: tips for selectors, prompts, and folder strategies
