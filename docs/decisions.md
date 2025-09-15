Content Migrator — Progress and Decisions

Scope and Positioning
- Standalone tool for crawling, selecting, analyzing and exporting site content to Markdown/YAML/JSON (and optional CSV).
- Removed the legacy SEO audit/worker routes; reused styling, auth (Kinde), quotas (Supabase), and added a focused migration flow.

Crawler Model (URL‑only)
- The crawler discovers and stores URLs (plus minimal metadata), not full HTML.
- HTML is fetched later, only for pages the user selects for migration.
- Benefits: predictable memory/CPU, safer for large sites, easier to apply plan caps, faster UI.

Precision Controls
- Include/Exclude path prefixes (accept path or absolute URL; normalization strips wildcards and normalizes host).
- Applied at sitemap seeds, pre‑fetch checks, and internal enqueue; off‑host URLs are skipped.
- If no sitemap seeds match an include, seeds are derived from origin + include prefixes (e.g., https://site.com/news).

Migration Flow
- Client‑save mode: Server returns AI‑generated content + image URLs. Browser writes files to disk using the File System Access API.
- Server‑save fallback: In local/dev or when desired, writes to ~/Downloads/contentmigrate/Content and media.
- Images: Prefer client download; if some fail due to CORS/size, write images.txt + download.sh manifest for local bulk download.

Frontmatter
- Frontmatter keys are user‑defined via tags (UInputTags). Only those keys are populated.
- Merge order per key: AI → user default → page meta fallback (date, featured image, YouTube ID, etc.).

Concurrency and Safety
- Crawl is polite: concurrency 2 per host, delays, robots.txt respected, host normalized.
- Rate limiting middleware for API paths; usage quotas via Supabase RPC.
- Migration page concurrency is small; job queue via Supabase supports multi‑instance processing.

Plan Caps (suggested)
- Crawl URLs/day per plan (e.g., 1k/10k), Pages migrated/day per plan, AI token budgets.
- Optional soft budgets: time/URL cap and a stop button for long crawls.

Why URL‑Only Crawler
- It keeps the crawl cheap and fast, and defers heavy work to the exact pages users care about. This decision translates easily across tools and helps avoid budget pitfalls.

Architecture (High‑Level)

```mermaid
flowchart TD
  U[User] --> CF[Crawl Form]
  CF -->|POST /api/crawl<br/>Include/Exclude| CR[Crawler (URL‑only)]
  CR -->|Discovered URLs| ST[In‑Memory Crawl State]
  U -->|Import| IF[/POST /api/pages/import-from-crawl/]
  IF --> CP[(content_pages)]
  U --> MP[Migrate Page]
  MP -->|GET /api/pages?q=...&status=...| CP
  U -->|Select batch| MP
  MP -->|POST /api/migrate| MIG[Migrate (Nitro Route)]
  MIG -->|AI: selected_content + page_meta| OAI[(OpenAI)]
  MIG -->|ClientSave=true: md/yml/json + images[]| MP
  MP -->|FS Access API| FS[(User Disk: Content/, media/)]
```

Notes
- The crawler never stores HTML; it only discovers URLs and extracts internal links when strategy is “sitemap+internal”.
- Analysis/migration refetches the HTML for selected pages and runs AI on just the selected content.
- In client‑save mode, the server returns ready‑to‑write content and image URLs; the browser writes files directly to disk.

Filters — How They’re Applied

- Inputs allowed:
  - Path prefixes: `/news`, `/videos/*` (wildcards `*` and `/*` are normalized to a simple prefix)
  - Absolute or host+path: `https://www.site.com/news/*`, `www.site.com/news/*` → both normalize to `/news`
- Matching rules (case‑insensitive on path):
  - Include: a URL is allowed only if its path starts with at least one include prefix
  - Exclude: a URL is rejected if its path starts with any exclude prefix
  - Host: only the root host is allowed; `www.site.com` and `site.com` are treated as the same host
- Enforcement points:
  1) Sitemap seeds are filtered by host and include/exclude
  2) If no seeds match, we seed from origin + include prefixes (e.g., `https://site.com/news`)
  3) Every fetch checks host + include/exclude; off‑path/host URLs are skipped
  4) Internal link enqueue checks include/exclude before adding to the queue
- Logs to watch:
  - `Sitemap seeds after filters: N (include=/news, exclude=none)`
  - `Skipped different host: …`
  - `Skipped by path filter: …`

Examples
- Include `/news`, Exclude `/news/tag` → only `/news` and deeper paths except `/news/tag…`
- Include `www.example.com/videos/*` → normalize to `/videos` and crawl only that subtree
- Include `/news`, `/blog` → crawl both sections, still confined to the same host

Client‑Side Image Downloads

- Behavior:
  - Server returns `images: [{ name, url }]` and does not proxy or store images
  - Browser downloads each image and writes to `media/<slug>/` under the chosen folder
  - If some images fail (CORS, size), the app writes `images.txt` and `download.sh` to `Content/` as a manifest
- Safety/caps:
  - Options allow toggling downloads, max images/page, and max MB/image
  - Markdown references always point to `../media/<slug>/<name>`

Operational Knobs (selected)
- Crawl politeness: `concurrency=2`, delay between requests, robots.txt honored
- Migration concurrency: `MIGRATION_PAGE_CONCURRENCY` (default 2–4 small)
- Rate limit middleware: protects `/api/crawl` and `/api/migrate`
- Plan caps (suggested): discovered URLs/day, migrated pages/day, AI token budgets
