# AI SEO Auditor (Nuxt)

This app crawls websites, analyzes pages with AI, and presents a consolidated SEO report. It uses Nuxt UI, Supabase (RLS), and a Nitro background worker to process analysis jobs.

Project docs: see docs/analysis-worker.md for the AI worker design and ops details.

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

- Apply the SQL in supabase/migrations to your Supabase project (via Supabase SQL editor or CLI).
  - Creates `audits`, `audit_pages`, and `analysis_jobs` with RLS and helper functions.

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

5) Optional: Enable the background analysis worker

Set env and run dev or start:

```bash
ANALYSIS_WORKER=1 WORKER_BATCH=3 WORKER_INTERVAL_MS=3000 npm run dev
```

The worker pulls from the queue and processes pages. See docs/analysis-worker.md for tuning and deployment.

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

- AI analysis worker: docs/analysis-worker.md
