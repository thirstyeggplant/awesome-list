# The site

How the site is built from the data in `out/`. Stage 2 of the plan. The name is a placeholder (`SITE_NAME` in `src/site/config.ts`); the origin comes from the environment (`SITE_ORIGIN`).

## The rule that shapes everything

The site shows names, sections, links and facts, and our own words. It never shows a curator's or a repository owner's description. The build reads only the public files at the top of `out/`, never `out/private/`.

## Addresses

An item's URL never goes in the path.

- An item with a `repo` object is `/gh/{owner}/{repo}` (lower case).
- Every other item is `/item/{h}`, where `h` is the first 10 hex characters of sha256(id). The build fails on a collision.
- `/item?url=…` canonicalises the address with `src/canonical.ts` and answers 301 to the item, or 404.
- A repository's `renamedFrom` becomes a redirect: the old `/gh/a/b` answers 301 to the new one.

| Route | Shows, top to bottom |
| --- | --- |
| `/` | The `h1`, the search box, one line of counts and the data date; a contents rail of the categories; categories in the index's order, each an `h2` with its lists as a dense multi-column grid of names (subcategory lists indented under their parent); a strip of the 12 items named by most lists; footer |
| `/lists` | Params `q, category, license, status, sort=stars\|items\|updated\|name, page`. Rows: name, `owner/repo`, our summary, category, item count, stars, last push, rot mark |
| `/lists/{owner}/{repo}` | The list page, below |
| `/items` | Params `q, kind, status, lang, license, topic` (repeatable, AND), `list, category, owner, stars=100\|1000\|10000, in=2\|5\|10, sort=lists\|stars\|updated\|name, page`. Removable filter chips; a facet rail (kind, status, language top 15, licence, topic top 20, category, list top 10, stars, "in N+ lists"); the result count; 50 rows; previous and next |
| `/gh/{owner}/{repo}`, `/item/{h}` | The item page, below |
| `/gh/{owner}` | Owner page: the login with a GitHub link; "Lists they keep"; "Their projects named by lists" (100 item rows in the default sort, then a link to `/items?owner=`) |
| `/search?q=` | Lists (up to 8), sections (up to 10, each linking to its anchor in its list), items (the first 30, then "All N items" to `/items?q=`). `ns:value` tokens in `q` (lang, license, kind, status, topic) become filters, with a 302 to `/items?…` |
| `/about` | What this is, the rule above, attribution, how a list is left out, coverage numbers, the data date |
| `/api/quick?q=` | JSON for quick search |
| `/sitemap.xml`, `/sitemaps/*.xml`, `/robots.txt`, `/healthz`, `/assets/{hash}/…` | Crawling, health, static files |
| `/favicon.ico`, `/favicon.svg`, `/apple-touch-icon.png`, `/site.webmanifest` | Icons and the manifest, static files cached for a day |

**Languages** (`docs/i18n-seo.md`). English has no prefix; nine more languages are every route above behind `/zh`, `/es`, `/pt`, `/ja`, `/de`, `/fr`, `/ru`, `/ko` and `/id` (the table is `src/site/i18n/locales.ts`). `/en/…` answers 301 to the address without it; `/api/quick`, `/item?url=` and `/healthz` have no prefix. A URL always answers in its own language: nothing looks at `Accept-Language`, and the footer has a switcher to the same page in each language. Words are message keys (`src/site/i18n/messages/`); our summaries and category names come from `translations/`, through `/_data/i18n/{lang}.json`, with the English shown (marked `lang="en"`) where one is missing.

Across routes:

- **Tags** are chips such as `lang:go`, `license:mit`, `kind:paper`, `status:archived`, `topic:cli`, linking to `/items?lang=go` and so on. There is no `/tags` route.
- **Params** are written in a fixed order; unknown params are ignored; an invalid value is a 404.
- **Paging** stops at page 200; beyond it the page says to narrow the filters.
- **404** is the same shell: "Nothing at this address", a search box filled from the path's last segment, and up to 5 suggestions. Paths in upper case or with a trailing slash answer 301 to their canonical form.

### The list page

1. Breadcrumb (the category).
2. `h1` the name, then `owner/repo` as the first link on the page, to GitHub.
3. Our summary.
4. Facts: stars, last push, licence, N items in M sections, "named by K other lists" (to its own item page), rot mark.
5. "Read the original on GitHub" and "Suggest a change" (both to the list's repository).
6. A filter for the page.
7. Sticky contents: a left rail on wide screens; on narrow ones the same rail opens over the page from a Contents link (`#_contents`).
8. Sections in the list's order, each with an anchored heading and its item rows; entries with a `parentName` indented; `extraLinks` as small trailing links.
9. Attribution.

An `unparsed` list replaces 6 to 8 with "We could not read this list's entries yet ({reason})."

A list of 3,000 entries is one server-rendered page, so find-in-page, anchors and crawlers all work. Each section is a `<section>` with `content-visibility: auto; contain-intrinsic-size: auto 20rem`. The contents shows the top two heading levels with counts. The filter (a few dozen lines of script) hides rows and empty sections that do not match, says "N of M", and writes `#q=`. Sections are not collapsed by default, because that breaks find-in-page; "Collapse all" toggles them.

### The item page

There is no description, so the page is made of what the lists and GitHub say about it.

1. `h1` the name (for a repository, `owner /` dimmed and linking to the owner page). Under it, the address as the main outbound link (`rel="nofollow noopener"`), and "Also listed as: …" from `aka`.
2. When the item is itself a list here: "This is itself a list in the library: open it".
3. The rot mark with a sentence: "Archived by its owner." / "No pushes since Mar 2023." / "GitHub no longer has this repository", the name struck through.
4. Facts as a grid: stars, last push, language, licence, fork, kind, host, renamed from. Then the tag chips. "Facts from GitHub as of {data date}."
5. **In N lists**: one row per listing, ordered by the list's stars: the list's name (a link, first), the section path as breadcrumbs linking to the anchor in the list, "listed as '{name}'" when that differs, and the extra links. The section paths are the description, in the curators' structure, without their prose.
6. **Listed alongside**: up to 12 item rows. Not called alternatives, because that cannot be checked.
7. Attribution and "Suggest a change", which points at the lists above.

**Listed alongside.** Y is alongside X when they share a section of some list. The score is the sum over shared sections of `1 / log2(2 + sectionSize)`, so small, specific sections count most. In a section of more than 80 entries only the 5 on each side by position count. Ties go to Y's `list_count`, then stars, then distance in position. The top 12 are kept.

## The database

The site runs as a Cloudflare Worker that reads D1 (see `docs/cloudflare.md`); `pnpm serve` runs the same handler over node:http and node:sqlite. `pnpm build-site` writes, under `out/`:

- `d1/load.sql`: the DDL, then multi-row inserts of at most 50 KB a statement, and `optimize` for each full-text table. No `BEGIN`, `COMMIT` or `PRAGMA`, no statement over D1's 100 KB, no control character in a statement (they are written with `char()`). This is the only load path: the nightly job runs it into a fresh D1 database, and the build runs it with node:sqlite in one transaction to make `site.db`. `d1/build.json` has the build id, the counts and an estimate of the rows the load writes.
- `site.db`: for `pnpm serve` and the tests, opened read-only with `PRAGMA query_only=1`. It has no `sqlite_stat*`, like the D1 database.
- `site-assets/`: the static files that ship with the Worker (below).

The build id is a hash of the data date, the counts, the assets and the site's code, so a change of code is a new build too.

```
meta(key PK, value)                     -- build_id, data_finished, counts, coverage, assets (their hashed paths)
category(id PK, name, slug UNIQUE, position, list_count)
list(id PK, slug UNIQUE, owner, repo, name, category_id, subcategory, summary, stars, pushed_day,
     archived, license, status, reason, readme_path, readme_oid, items_made, section_count, item_id, position)
section(id PK, list_id, path JSON, title, depth, anchor, anchors JSON, position, item_count)   INDEX(list_id, position)
item(id PK,  -- given in the default order, so ORDER BY id is the default ranking
     key UNIQUE, url, kind, host, name, aka JSON, owner, repo_name, stars, pushed_day, archived, fork,
     lang_id, license_id, status, renamed_from, list_count, pop REAL, list_id, indexable,
     tags JSON,       -- {"lang": [slug, label] | null, "license": …, "topics": [[slug, label]…]}
     alongside JSON,  -- up to 12 item ids, best first
     listed JSON)     -- [[listId, sectionId, name | null, extraLinks]…] by the list's stars, then position;
                      --   name only when it differs from the item's
listing(list_id, position, section_id, item_id, name, parent_name, extra_links JSON,
        PRIMARY KEY(list_id, position)) WITHOUT ROWID
owner(login PK, display, list_count, item_count, item_ids JSON) WITHOUT ROWID   -- item_ids: the owner page's 100
redirect(from_path PK, to_path) WITHOUT ROWID
```

There is no index on `item.url` and none on `item.owner`, and no `term`, `item_topic` or `alongside` table: what a page needs of them is in the JSON columns, and the rest is in the static files. `/item?url=` works out the keys an address can have (`item/{h}` with `crypto.subtle`, and `gh/{owner}/{repo}` for a GitHub address) and reads the item with one of them whose `url` is the address.

`item.name` is the repository's name for a repository. Otherwise it is the name the lists use most (a tie goes to the list with more stars), else the host and path. `aka` holds up to 5 other names the lists use.

**Full-text search.** Three contentless FTS5 tables (`content=''`), the rowid the entity's id, `tokenize="unicode61 remove_diacritics 2 tokenchars '+#'"` (so `c++` and `c#` survive), `prefix='2 3 4'`. They work the same in D1.

| Table | Columns (bm25 weight) |
| --- | --- |
| `item_fts` | `name` (10), `aka` (5), `ident` (4: owner and repo, or host and path words, cut at 200 characters), `topics` (2), `sections` (1: the distinct section titles and the names of its lists) |
| `list_fts` | `name` (10), `repo` (6), `summary` (4), `category` (2), `sections` (1) |
| `section_fts` | `title` (6), `path` (1) |

What a person types is never passed as it is: it is split on whitespace, each token double-quoted, and `*` added to the last.

**The static files** (`out/site-assets/`, served before the Worker, so they always match its database):

- `/_data/facets.bin`: the facet arrays (below), with a JSON header of offsets (`src/site/facets-file.ts`).
- `/_data/terms.json`: every language, licence and topic as `[id, ns, slug, label, itemCount]`.
- `/_data/i18n/{lang}.json`: one per language but English, `{ categories: { slug: name }, summaries: { listSlug: text } }`, read once per isolate on the first request in that language. Their bytes are part of the build id.
- `/assets/{hash}/…`: the CSS, the scripts and `og.png`, the one share image.
- `/favicon.ico`, `/favicon.svg`, `/apple-touch-icon.png`, `/site.webmanifest`, unhashed.
- `/sitemap.xml`, `/sitemaps/*.xml`, `/robots.txt`, written with `SITE_ORIGIN`; and `_headers`.

**Facets in memory.** The build writes the items' columns in id order as typed arrays: kind and status as `Uint8Array`; language, licence and list count as `Uint16Array`; stars and the day of the last push as `Int32Array`; item → topics and item → lists as CSR arrays; a permutation for each other sort; and the owner logins. The Worker fetches `facets.bin` once per isolate, on the first `/items`, never at start; only `/items` loads it, and only `/items` and `/api/quick` load `terms.json`. A request:

1. With `q`, takes the matching rowids from `item_fts` (at most 20,000).
2. Passes over the items once, making a mask of the filters each one fails. An item that fails none counts in every facet and in the result. An item that fails exactly one counts only in that filter's facet, so each facet says what choosing another value would give.
3. Walks the chosen order to take the 50 ids of the page.
4. Reads those 50 rows in one query (`id IN (…)`), their topics from `tags`.

`meta`, `category` and `list` (671 rows) are read in one batch when the handler starts and held in memory; `/lists` is filtered there. List, item and owner pages are indexed lookups.

**Code.** `src/site/app.ts` is the handler: `createApp({ sql, loadAsset, origin, buildId })` gives `(Request) => Promise<Response>`. `src/site/data.ts` is what it asks of a database (`all`, `first`, `batch`), with two adapters: `adapters/d1.ts` (a D1 session per request, `first-unconstrained`) and `adapters/node.ts` (node:sqlite). `worker.ts` is the Worker; `server.ts` is `pnpm serve`, which serves `out/site-assets/` (with its `_headers`) and then the handler. Nothing else in `src/site/` uses Node, outside `build/`: ESLint refuses `node:*` imports and `Buffer` or `process` there.

## Ranking

- **Items**: `list_count` descending, stars descending (none last), name. Being named by many curators is the signal only this site has; stars break the tie among the 108,000 items in one list.
- **Lists**: stars, then items. The home page keeps the index's order.
- **Search**: an exact name first, then `bm25(item_fts, 10, 5, 4, 2, 1) * pop` ascending, then id, where `pop = 1 + 0.35·ln(list_count) + 0.06·ln(1 + stars)`, stored at build. Popularity reorders close matches but does not beat a match on the name with a match on sections only. Lists: `bm25(list_fts, 10, 6, 4, 2, 1)`, then stars.
- **Quick search** matches `{name aka ident}` only, in the same order.

## Quick search

`GET /api/quick?q=` (2 to 64 characters) answers `{q, lists: [{name, slug, items}] (≤5), items: [{name, sub, key, kind, lists, stars, status}] (≤8), tags: [{label, href, count}] (≤3)}`. Ctrl/⌘-K or `/` opens a `<dialog>` with a combobox, and so does a tap on the header's search field on a phone; Esc or a tap beside it closes it. Typing waits 120 ms, cancels the last request and caches answers for the visit. ↑ and ↓ move through one list of options; Enter opens the one chosen, or `/search?q=` when none is. Without script, the form in the header goes to `/search`.

## The look

`docs/design.md` has the design: the palette, the type scale, the spacing, the pieces and each page's layout. In short: a catalogue on paper and ink with one green; a serif for titles and the names of lists, the system sans for everything that is scanned; names are ink, not link-coloured; a rail at the left and the content at the right on every browsing page. System fonts only. Light and dark follow the system (`light-dark()`); there is no switch. The tokens are at the top of `src/site/assets/site.css`.

Components: the header (the mark and name, Lists, Items, About, search); `row` (for items and lists; two lines in a narrow container); `chip` (a sunk fill, the namespace dimmed); `rot` (a word in a hairline box: "archived" in `--warn`, "quiet" in `--muted`, "gone" in `--gone`, never colour alone); `facts`; `facet` (a `<details>` of links with counts); `crumbs`; a section heading with its count and `#` anchor; `toc`; `pager`; `btn`; `attribution`; the quick-search dialog; the footer (what is indexed, the sections, the languages).

## Caching and crawling

| Answer | Cache-Control | Set by |
| --- | --- | --- |
| HTML | `public, max-age=300, s-maxage=86400, stale-while-revalidate=604800` | the Worker |
| `/api/quick` | `public, max-age=3600, s-maxage=86400` | the Worker |
| `/assets/{hash}/…` | `public, max-age=31536000, immutable` | `_headers` |
| sitemaps, robots | `public, max-age=3600, s-maxage=86400` | `_headers` |
| icons, manifest | `public, max-age=86400` | `_headers` |
| 404 | `public, max-age=60` | the Worker |
| `/healthz` | `no-store` | the Worker |

- Workers Caching (`"cache": { "enabled": true }` in `wrangler.json`) keeps answers in front of the Worker by their `Cache-Control`; there is no cache code and nothing kept in memory between requests but the start batch, the facets and the terms. Cloudflare compresses, so no answer carries `Content-Encoding`, `Content-Length` or `Vary`.
- The ETag is the build id (`W/"{buildId}"`). The Worker has it as `BUILD_ID` and answers a matching `If-None-Match` with 304 before any query.
- `/healthz` reads `meta.build_id` and answers `ok {buildId}`, or 503 when it differs from the Worker's `BUILD_ID`; `no-store`, never 304.
- `Content-Security-Policy: default-src 'self'`: no inline script or style, no request to anyone else (so no avatars). `X-Content-Type-Options: nosniff` and `Referrer-Policy: strict-origin-when-cross-origin` on every answer of the Worker; `_headers` puts `nosniff` on every static file.
- Redirects (renames, case, a trailing slash, `/item?url=`) are the Worker's.
- The Worker adds `Content-Language` to HTML answers (informative only). The language is in the URL, so caching and the ETag are unchanged.
- Which pages are indexed in which languages is one function, `indexedIn` in `src/site/i18n/indexing.ts`: the home, `/lists` (bare, a category, and their pages), list pages, `/items` (bare) and `/about` are indexed in every language, self-canonical with eleven `hreflang` alternates; item, owner and filtered pages are canonical to the English address in every language, with no alternates; `noindex` pages are `noindex` in every language.
- Every page has a canonical link, params in the fixed order. A listing page with `q`, two or more filters, or a sort other than the default is `noindex,follow`; so is `/items` with one filter past page 1 or with fewer than 5 results. Facet and sort links to a `noindex` page carry `rel="nofollow"`. A page past the last is a 404.
- An item page is indexable only when it has repository facts or is in two lists or more. The rest are `noindex,follow` and are not in the sitemaps.
- Every page has Open Graph and Twitter tags (one static image), `theme-color`, the icons and the manifest. Self-canonical pages carry JSON-LD: `WebSite` on the home page, `CollectionPage` with an `ItemList` on `/lists` and list pages, `BreadcrumbList` on category and list pages, `SoftwareSourceCode` on a repository's page.
- `/sitemap.xml` is an index of `pages.xml` (the home, `/lists`, `/items`, `/about` and the category pages, in ten languages), `lists-{lang}.xml` (ten files), `owners.xml` (owners with a list or at least 2 items) and `items-{n}.xml` of 40,000 each. Pages and lists carry their `xhtml:link` alternates; owners and items are English only. `lastmod`: a list's last push (never after the data date), the data date for `pages.xml`, none for owners and items. They are static files, written by the build.
- `robots.txt`: `Allow: /`, `Disallow: /api/`, `Disallow: /_data/`, `Disallow: /search` in every language, and the sitemap.

## Attribution

- List page: "This page is an index of **{name}**, a list kept by {owner} and its contributors at github.com/{owner}/{repo}. The selection and order are theirs; the summary above is ours. Read at commit {oid7} on {date}." Then the licence, if any.
- Item page: "Named by the lists above. Follow a list to read what its curators say about it."
- Footer: "{SITE_NAME} indexes names, sections and links. Descriptions belong to the lists and are not copied here. Keep a list and want it left out? Open an issue." Then the language switcher.

## Not in this version

Trending and star history; item descriptions; accounts, saved items, comments; a theme switch; avatars, favicons or any request to another site; category, tag and section routes; choosing several values of one facet; RSS; a JSON API beyond quick search; downloads of the data; analytics; share images per page; translated section headings or item names; checking links beyond GitHub's `gone`; search that forgives typos.
