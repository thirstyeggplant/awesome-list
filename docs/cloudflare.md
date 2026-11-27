# Serving the site from Cloudflare Workers and D1

The site runs as a Cloudflare Worker on the Workers Paid plan ($5 a month), with its data in D1. The facts about Cloudflare below were read in its documentation on 2026-11-24.

## What Cloudflare allows

- **D1:** 10 GB per database; 100 KB per SQL statement; 100 bound parameters; 30 s per query; 1,000 queries per invocation; `d1 execute --file` up to 5 GiB. The plan includes 25 billion rows read and 50 million rows written a month (then $0.001 and $1 per million), and 5 GB of storage. Each index adds a written row per insert.
- **FTS5** works in D1. `wrangler d1 export` refuses a database with a virtual table, so this database is never exported: `out/*.jsonl` is the source of truth. Imports must not contain `BEGIN`, `COMMIT` or `PRAGMA`.
- **Read replicas** cost nothing extra. They are switched on per database through the API and used through `env.DB.withSession()`.
- **Workers:** 128 MB of memory, 1 s to start, a 64 MiB bundle. The plan includes 10 million requests and 30 million CPU-ms. Static assets: 100,000 files, 25 MiB each, served before the Worker.
- **Workers Caching** (`"cache": { "enabled": true }`) is a tiered cache in front of the Worker that follows `Cache-Control`. A hit is a billed request but uses no CPU.

## Where the data lives

**D1 holds a fresh database for every build** (`shelf-<buildId>`), slimmed so a load writes few rows.

- `meta`, `category`, `list`, `section` (with its index), `redirect` (WITHOUT ROWID).
- `item` keeps `key UNIQUE`. The `url` index and `item_owner` are gone. Three JSON columns are added:
  - `tags`: `{lang: [slug, label] | null, license: …, topics: [[slug, label]…]}`.
  - `alongside`: up to 12 item ids.
  - `listed`: `[[listId, sectionId, name | null, extraLinks]…]`.
- `listing` is WITHOUT ROWID with `PRIMARY KEY(list_id, position)` and no other index.
- `owner` is WITHOUT ROWID, with `item_ids` as JSON (in the default order, capped at the page's limit).
- `item_fts`, `list_fts`, `section_fts` are as before, contentless.
- `alongside` (1.05M rows), `item_topic`, `term` and `sqlite_stat*` are no longer in the database.

**Static assets** ship with the Worker, so they always match its database:

- `/_data/facets.bin`: the facet arrays.
- `/_data/terms.json`: every term.
- `/assets/{hash}/…`: CSS, JS and the share image.
- `/_data/i18n/{lang}.json`: translated summaries and category names, one per language but English.
- `/favicon.ico`, `/favicon.svg`, `/apple-touch-icon.png`, `/site.webmanifest`.
- `/robots.txt`, `/sitemap.xml`, `/sitemaps/*.xml`: written at build with `SITE_ORIGIN`.

There is no R2 and no KV.

## Facets

`build-site` writes `facets.bin`, about 6.5 MB: a JSON header of offsets, then the typed arrays as `facets.ts` holds them, the three sort orders, and owner logins in index order. The Worker fetches it with `env.ASSETS.fetch` once per isolate, lazily behind a module-level promise, never at start. Only `/items` loads it; only `/items` and `/api/quick` load `terms.json`.

An uncached `/items` reads no rows to filter and 50 rows for the page (`id IN (…)`, with topics taken from `tags`). With `q`, one FTS query comes first.

## Search

D1 FTS5 with the same tables, tokenizer, SQL and ranking. The build writes `INSERT INTO item_fts(rowid, …) VALUES …`, then `INSERT INTO item_fts(item_fts) VALUES('optimize')` for each table.

## The load

`build-site` writes `out/d1/load.sql`: the DDL, then multi-row inserts of at most 50 KB a statement, with no `BEGIN`, `COMMIT` or `PRAGMA`. `out/site.db` for local use is made by running the same file with node:sqlite in one transaction, so there is one load path.

A load writes about 0.70M rows. Every night that is about 21M a month, 42% of what the plan includes. The first remote load prints `rows_written`, and the job fails above 1.3M.

## Code

One request handler and two thin adapters:

- **`src/site/data.ts`:** `interface Sql { all(sql, params): Promise<Row[]>; first(sql, params): Promise<Row | null> }`. `db.ts` becomes async over it.
- **`src/site/adapters/d1.ts`:** `env.DB.withSession('first-unconstrained')` per request.
- **`src/site/adapters/node.ts`:** node:sqlite.
- **`src/site/app.ts`:** `createApp({ sql, loadAsset, origin, buildId })` returns `(Request) => Promise<Response>`. Views are async. On start it reads `meta`, `category` and `list` in one batch.
- **`src/site/worker.ts`:** `export default { fetch }`.
- **`src/site/server.ts`:** `pnpm serve`, a node:http bridge to the same handler that serves `out/site-assets/`.

Nothing in the shared path uses Node: no gzip, `Buffer`, LRU, `node:fs` or `node:crypto` (`crypto.subtle` instead), and no `nodejs_compat`. An ESLint rule forbids `node:*` in `src/site/` except in `build/`, `server.ts` and `adapters/node.ts`. Tests run with vitest against the node adapter, calling the handler with `Request` objects; CI also runs `wrangler deploy --dry-run`.

## HTTP

- Workers Caching does the caching, with no Cache API code. `Cache-Control` is unchanged.
- The ETag is the build id; the Worker answers 304 before any query.
- Cloudflare compresses, so `Content-Encoding`, `Content-Length` and `Vary` are dropped.
- CSP, `nosniff`, the referrer policy and HSTS are on every Worker response. `_headers` covers assets: `/assets/*` immutable for a year; sitemaps and robots `max-age=3600, s-maxage=86400`; `nosniff` on everything.
- Redirects stay in the Worker.
- **Plain http goes to https.** The Worker's first step, before the method or anything in the database: a request whose address is `http:` to any host but `localhost`, `127.0.0.1` or `[::1]` is answered 301 to the same address with `https:` (no port), `Cache-Control: public, max-age=3600` (`httpsAddress` in `src/site/http.ts`). Static files are served before the Worker, so a plain-http request for one of them never reaches it: Cloudflare's "Always Use HTTPS" setting for the zone covers those.
- **www goes to the site's host.** `www.weeklymatcha.com` is a second custom domain of the same Worker (`routes` in `wrangler.json`, which makes its DNS record and certificate). The same first step answers any request to `www.` before the host of `SITE_ORIGIN`, over http or https, 301 to the same path and query on `SITE_ORIGIN`, in one hop. Static files on www are served before the Worker and are not sent on; every page's canonical address names the site's host. Measured on 2026-11-27: Workers Caching keys a page by path and query, not by host, so a page already cached for `weeklymatcha.com` is answered 200 on `www.` from the cache without reaching the Worker; a 301 is not cached (`BYPASS`), so no loop can form. The zone's Redirect Rule "www to root" (Rules → Redirect Rules, the owner's, in the dashboard) runs before the cache and sends every www request on; the Worker's step stays as the fallback.
- **`Strict-Transport-Security: max-age=31536000`** (no `includeSubDomains`, no `preload`) is on every Worker answer, the redirect included, and on every static file through `_headers` (`/*`). A browser ignores it on a plain-http answer (RFC 6797, 8.1), so `pnpm serve` on `http://localhost` is unchanged.
- `/healthz` reads `meta.build_id` and answers 503 when it differs from `env.BUILD_ID`, `no-store`.

## The nightly job

`.github/workflows/nightly.yml`, on `schedule: '17 3 * * *'` and `workflow_dispatch`, with `concurrency: nightly` and `contents: read`:

1. Checkout, pnpm, Node 24; restore `.cache/`.
2. `pnpm build-data` with `GITHUB_TOKEN` from `secrets.PIPELINE_GITHUB_TOKEN`. `out/private/` is never uploaded.
3. `pnpm build-site` with `SITE_ORIGIN` from `vars.SITE_ORIGIN`, then `pnpm test`.
4. Stop if the build id equals the live `/healthz`.
5. `wrangler d1 create shelf-$BUILD`, then read its id from `wrangler d1 list --json`.
6. `wrangler d1 execute shelf-$BUILD --remote --file out/d1/load.sql -y`, then check the counts against `run.json`.
7. Switch on read replication with the API.
8. Write `wrangler.deploy.json` (ignored by git) from `wrangler.json` with `jq`: the database's id and name, and `BUILD_ID`.
9. `wrangler deploy --config wrangler.deploy.json`.
10. Smoke test `/healthz`, `/` and `/items?lang=go`, then `scripts/smoke-languages.ts`: `/de` groups the items count as German does, `/ru/lists` has the Russian plural Node chooses, `/es` has `<html lang="es"` (whether the runtime has ICU data for the languages); on failure, `wrangler rollback`.
11. Delete all but the newest three `shelf-*` databases.

- **Secrets:** `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `PIPELINE_GITHUB_TOKEN` (a fine-grained token with no scopes).
- **Variable:** `SITE_ORIGIN`.
- **The Cloudflare token:** the "Edit Cloudflare Workers" template limited to this account and zone, plus Account → D1 → Edit. The zone must be on Cloudflare.

## Cost

$5 a month at low traffic, and still $5 on a day with 200,000 page views. The only realistic charge beyond it is rows written, about $0.70 for each extra full load past 50M.

## To check on the first run

- How FTS writes and reads are billed.
- That Workers Caching follows `s-maxage`.

`/_data/*` is fetchable by anyone; it is public data.

## Not done

R2, KV, Cloudflare Cron Triggers, Miniflare tests, loads of only what changed, a staging environment, cache purging (each version starts cold), analytics, and backups by export or time travel.
