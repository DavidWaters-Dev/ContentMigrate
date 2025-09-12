# AI Analysis Architecture & Worker

This document describes how page analysis is enqueued, processed, and written back to the database, and how to run the background worker in Nitro.

## Overview

- Queue: Analysis work is stored in `public.analysis_jobs` with RLS for per-user isolation.
- Enqueue: The UI creates `page_analysis` jobs for selected pages.
- Worker: A Nitro interval plugin claims jobs in small batches and processes them.
- Persistence: Results are saved to `public.audit_pages`, and a site summary is recalculated into `public.audits.summary`.
- Safety: Daily quotas and concurrency caps prevent abuse; archived audits are not flipped back to "ready".

## Data Flow

1) UI enqueues jobs
- Route: `POST /api/analysis/enqueue`
- File: `server/api/analysis/enqueue.post.ts`
- Validates `auditId` and `pageIds[]`, applies daily AI token quota via `addUsage`.
- Inserts rows into `public.analysis_jobs` (status `queued`).

2) Worker claims and processes
- Route: `POST /api/worker/process`
- File: `server/api/worker/process.post.ts`
- Claims jobs with `fn_jobs_claim` and processes each page:
  - Loads page row from `public.audit_pages`.
  - Fetches the page (`fetch`), extracts facts via `app/utils/html.ts` (Cheerio).
  - Calls OpenAI via `app/utils/ai.ts` to get structured analysis.
  - Updates `audit_pages` with `status='analyzed'`, `score`, and `details`.
  - Marks job complete with `fn_jobs_complete`.
- After a batch, recalculates the site summary for each affected audit and updates `public.audits.summary`.
- Note: Archived audits keep their `status` (we do not flip archived back to ready).

3) Nitro background worker loop
- File: `server/plugins/analysis-worker.ts`
- Interval loop that POSTs to `/api/worker/process` with a small batch size.
- Enabled via `ANALYSIS_WORKER=1`.

## Environment Variables

- `OPENAI_API_KEY`: Required for analysis (`app/utils/ai.ts`).
- `SUPABASE_URL`: Your Supabase URL.
- `SUPABASE_SERVICE_ROLE_KEY`: Service role for the worker to bypass RLS. If missing, worker falls back to anon key and may be blocked by RLS.
- `ANALYSIS_WORKER`: Set to `1`/`true` to enable the Nitro worker.
- `WORKER_INTERVAL_MS`: Polling interval (default `3000`).
- `WORKER_BATCH`: Jobs per tick (default `3`, clamped to 1–10).
- `WORKER_ID`: Optional identifier for the worker instance.

## Quotas & Politeness

- Crawl concurrency: Server caps to 2 in `server/api/crawl.post.ts`.
- Daily crawl pages: Enforced via `addUsage(event, 'crawl_pages', ...)`.
- AI token quota: Enforced on enqueue with an estimate in `server/api/analysis/enqueue.post.ts`.
- HTML fetching: Adds a custom UA; includes a default delay in crawler.

## Key Files

- Worker plugin: `server/plugins/analysis-worker.ts`
- Worker route: `server/api/worker/process.post.ts`
- Enqueue route: `server/api/analysis/enqueue.post.ts`
- HTML facts: `app/utils/html.ts`
- AI analysis: `app/utils/ai.ts`
- Supabase admin client: `server/utils/supabaseAdmin.ts`
- Queue schema & helpers: `supabase/migrations/0003_analysis_jobs_queue.sql`

## UI Integration

- Page detail (`app/pages/dashboard/audits/[slug].vue`):
  - `Analyze selected` enqueues jobs and sets audit to `analyzing` (PATCH).
  - In dev: triggers a one-off `/api/worker/process` for fast feedback.
  - In prod: relies on the background worker to process.
  - Phase is derived from DB state: start (no pages) → crawled (pages) → analyzing (`status='analyzing'`) → insights (summary present).

## Enable in Development

1) Set required env in `.env`:
- `OPENAI_API_KEY=...`
- `SUPABASE_URL=...`
- `SUPABASE_SERVICE_ROLE_KEY=...` (recommended for worker)
- `ANALYSIS_WORKER=1`

2) Start the app; the worker logs on boot and processes every few seconds. You can also hit `/api/worker/process` manually.

## Enable in Production

- Provide the same env vars via your process manager or hosting provider.
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is set for the worker to write through RLS.
- Optionally run multiple instances; `fn_jobs_claim` uses `FOR UPDATE SKIP LOCKED` to avoid collisions.

## Security Notes

- Service role key grants broad privileges. Only expose it on the server (Nitro), never to the client.
- `.env` is ignored by Git (`.gitignore`), keep secrets out of version control and logs.

## Troubleshooting

- Worker not processing:
  - Confirm `ANALYSIS_WORKER=1` and `SUPABASE_SERVICE_ROLE_KEY` are set.
  - Check `/api/worker/process` returns claimed/processed counts in logs.
- Analysis errors:
  - Check server logs for `[AI]` messages; verify `OPENAI_API_KEY`.
  - Some pages can block fetch; try a smaller set first.
- Archived audits don’t switch back:
  - Expected. Summary updates but `status` remains archived by design.

## Future Enhancements

- Backoff strategy and max attempts for failed jobs.
- Dedicated `site_consolidation` job after page batches.
- Streaming UI updates via server-sent events.
- Supabase Edge function worker (Deno) as an alternative deployment target.

