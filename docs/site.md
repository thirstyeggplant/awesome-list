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
| `/` | The `h1`; the summary sentence (what the site is, the counts, the data date); the search box; "Browse by language" (the 12 languages with the most items, from `meta.top`, and All projects, as one wrapping run); "Start here": the 8 lists with the most stars that could be read, as list entries, and a link to all lists; "Named by the most lists": 8 entries and a link to `/items?in=2`; "All lists by category": the categories in the index's order, each a `<details>` folded at every width (its name as an `h3`, its count, its three lists with the most stars), opened to a run of its lists; the share row |
| `/lists` | Params `q, category, license, status, sort=stars\|items\|updated\|name, page`. A lede (a category's sentences, else one line); list entries: name, `owner/repo`, our summary, then items, stars, the year of the last push when it is not this year, category, state |
| `/lists/{owner}/{repo}` | The list page, below |
| `/items` | Params `q, kind, status, lang, license, topic` (repeatable, AND), `list, category, owner, stars=100\|1000\|10000, in=2\|5\|10, sort=lists\|stars\|updated\|name, page`. Removable filter chips ("Language: Go ×"); a facet rail (kind, status, language top 15, licence, topic top 15 leaving out `TOPIC_STOP` unless chosen, category, list top 10, stars, "in N+ lists"); with one filter and no `q`, the `h1` is the filter and the lede says it in sentences (a language also names the lists mostly in it); the result count; 50 entries; previous, "Page N of M" and next |
| `/gh/{owner}/{repo}`, `/item/{h}` | The item page, below |
| `/gh/{owner}` | Owner page: the login, a sentence of how many lists they keep and how many of their projects lists name, the GitHub link; "Lists they keep"; "Their projects named by lists" (100 entries in the default sort, then a link to `/items?owner=`); the share row |
| `/search?q=` | A line of jumps with counts; lists (up to 8), sections (up to 10, each linking to its anchor in its list), items (the first 30, then "All N items" to `/items?q=`), each group a `<section>` with the id the jump names. `ns:value` tokens in `q` (lang, license, kind, status, topic) become filters, with a 302 to `/items?…` |
| `/about` | What this is, then the visitor's questions as headings: what is shown, where it comes from and who is credited, how fresh the data is, how a list is left out, whether AI assistants and crawlers may use it, how much it covers. A `FAQPage` of the first five |
| `/api/quick?q=` | JSON for quick search |
| `/sitemap.xml`, `/sitemaps/*.xml`, `/robots.txt`, `/healthz`, `/assets/{hash}/…` | Crawling, health, static files |
| `/llms.txt`, `/lists/{owner}/{repo}.md` | For answer engines: what the site is and every list by category; each list as Markdown, by section. Static files, English only |
| `/favicon.ico`, `/favicon.svg`, `/apple-touch-icon.png`, `/site.webmanifest` | Icons and the manifest, static files cached for a day |

**Languages** (`docs/i18n-seo.md`). English has no prefix; nine more languages are every route above behind `/zh`, `/es`, `/pt`, `/ja`, `/de`, `/fr`, `/ru`, `/ko` and `/id` (the table is `src/site/i18n/locales.ts`). `/en/…` answers 301 to the address without it; `/api/quick`, `/item?url=` and `/healthz` have no prefix. A URL always answers in its own language: nothing looks at `Accept-Language`, and the footer has a switcher to the same page in each language. Words are message keys (`src/site/i18n/messages/`); our summaries and category names come from `translations/`, through `/_data/i18n/{lang}.json`, with the English shown (marked `lang="en"`) where one is missing.

Across routes:

- **Tags.** There is no `/tags` route. An item page shows its topics as chips with their labels, linking to `/items?topic=cli`; its language and licence are facts. An entry shows up to three topics as `#slug` text where the page asks (none in `TOPIC_STOP` in `src/site/config.ts` or equal to its language), and its language as text; entries hold no links but the name.
- **Params** are written in a fixed order; unknown params are ignored; an invalid value is a 404.
- **Paging** stops at page 200; beyond it the page says to narrow the filters.
- **404** is the same shell: "Nothing at this address", a search box filled from the path's last segment, and up to 5 suggestions. Paths in upper case or with a trailing slash answer 301 to their canonical form.

### The list page

One column, top to bottom:

1. Breadcrumb (the category).
2. `h1` the name, then `owner/repo ↗`, the first outbound link on the page, to GitHub.
3. Our summary, as the lede.
4. The list's sentences (`sum.list.*`): what it is and who keeps it, how many entries in how many sections, its stars and last push, its three largest sections (linked to their anchors), its five projects with the most stars, its main language (linked to `/items?lang=`); then "Read the original on GitHub ↗ · Suggest a change" as text links.
5. "See also": the three lists most like it (`list.related`), when it has any.
6. A sticky bar: the filter, and "Contents" (which opens the drawer of contents) below 76rem.
7. Sections in the list's order, each with an anchored heading and its entries (no topics; the list's main language left out); entries with a `parentName` indented; `extraLinks` as small trailing links.
8. "Related lists": up to 6 list entries, each with how many projects both name.
9. "More in {category}": up to 8 other lists of the category by stars, leaving out those shown as related.
10. "About this list": the facts (stars, last push, licence, entries, named by, state, the Markdown copy), the attribution, the share row.
11. The contents (top two heading levels with counts): in the left margin from 76rem, a drawer below.

An `unparsed` list replaces 6, 7 and 11 with "We could not read this list's entries yet ({reason})."

A list of 3,000 entries is one server-rendered page, so find-in-page, anchors and crawlers all work. Each section is a `<section>` with `content-visibility: auto; contain-intrinsic-size: auto 20rem`. The contents shows the top two heading levels with counts. The filter (a few dozen lines of script) hides entries and empty sections that do not match, says "N of M", and writes `#q=`. Sections are never collapsed, because that breaks find-in-page; the contents do that job. Each section has `contain-intrinsic-size: auto 30rem`.

### The item page

There is no description of anyone else's, so the page is made of what the lists and GitHub say about it, in the order of a visitor's questions.

1. A breadcrumb from the list with the most stars that names it: Lists › that list › its section path, each section linking to its anchor.
2. `h1` the name (for a repository, `owner /` dimmed and linking to the owner page), the state's box after it.
3. The lede (`sum.item.*`): what it is ("gin is a Go repository by gin-gonic on GitHub with 89,600 stars." / "… is a website at {host}."), which lists name it and under which section ("2 awesome lists name it: Go (under Web Frameworks), Microservices (under Go)."), and, for a repository, its last push.
4. One primary button, the only outbound link (`rel="nofollow noopener"`, the address in `title`): "Open on GitHub ↗" or "Visit {host} ↗"; the address beside it as text; "Also listed as: …" from `aka`; "This is itself a list in the library: open it" when it is one.
5. Facts: for a repository stars, last push, language, licence, owner, named by, fork (only when it is one), renamed from; for anything else kind, host, named by. Then "Facts from GitHub as of {data date}." and the topics as chips.
6. **Which awesome lists name {name}?**: one entry per listing, by the list's stars: the list's name, "listed as '{name}'" when that differs, the section path as links to the anchors, the list's size and the extra links.
7. **Is {name} still maintained?** (repositories with a known push): one sentence of what GitHub says and when: "Its last push was on {date} and it is not archived, as of {date}." / no push for two years / "No. Its owner archived it; …" / "GitHub no longer has this repository." It never says "yes".
8. **What is listed alongside {name}?**: up to 12 entries, under a note that the lists do not say they are alternatives.
9. **More from {owner}** (repositories): up to 6 other items of the owner (`owner.item_ids`), then "All N projects by {owner}".
10. Attribution, and the share row.

**Listed alongside.** Y is alongside X when they share a section of some list. The score is the sum over shared sections of `1 / log2(2 + sectionSize)`, so small, specific sections count most. In a section of more than 80 entries only the 5 on each side by position count. Ties go to Y's `list_count`, then stars, then distance in position. The top 12 are kept.

## Summary sentences

Every indexable page opens under its `h1` with one to three sentences made only of the page's own data: home, a category of `/lists`, a list, `/items` with one language, topic, licence or kind (page 1, no search), an item and an owner. They are in `src/site/views/sentences.ts`, one function per page returning the HTML (names as links, dates as `<time>`) and the plain text; the plain text is the page's meta description (cut at a sentence's end to fit 160, or 80 in Chinese, Japanese and Korean; a list keeps our summary as its description) and its JSON-LD `description`, so the three cannot disagree. Each sentence is one message under `sum.*` (and `item.a.*`), in ten languages; a sentence whose data is missing is left out whole. Section titles are quoted as titles ("under Web Frameworks"); nothing is inferred from them, and no curator's or owner's words are used.

## Sharing

A list, an item, an owner, the home page and `/items` with exactly one language or one topic (no search, the default sort, page 1) carry a share row (`shareRow` in `src/site/views/share.ts`; the look is in `docs/design.md`). It shares the page's canonical address, the same one its `<link rel="canonical">` names (`canonicalOf` in `layout.ts`: an item or an owner shares the English address from every language, a list or the home page its own language's), and the page's title (`og:title`; on the home page its whole `<title>`).

- Plain links, which work without script, each opening a new tab with `rel="noopener noreferrer"`: `https://x.com/intent/post?text=&url=`, `https://bsky.app/intent/compose?text=` (title and address), `https://www.linkedin.com/sharing/share-offsite/?url=`, `https://www.reddit.com/submit?url=&title=`, `https://news.ycombinator.com/submitlink?u=&t=`, and `mailto:?subject=&body=` (no new tab: it opens the mail program). Every value is `encodeURIComponent`; nothing else is added.
- Two buttons, `hidden` in the markup and shown by `quick.js`: Copy link (where `navigator.clipboard` exists), which then says "Copied" for two seconds in a `role="status"`, `aria-live="polite"` span; Share… (where `navigator.share` exists), which opens the system's share sheet. No inline script: the CSP is unchanged.
- The words are `share.*` in the ten message files.

Search, filter combinations and 404 have none. The README shares the home page with the same links.

## The database

The site runs as a Cloudflare Worker that reads D1 (see `docs/cloudflare.md`); `pnpm serve` runs the same handler over node:http and node:sqlite. `pnpm build-site` writes, under `out/`:

- `d1/load.sql`: the DDL, then multi-row inserts of at most 50 KB a statement, and `optimize` for each full-text table. No `BEGIN`, `COMMIT` or `PRAGMA`, no statement over D1's 100 KB, no control character in a statement (they are written with `char()`). This is the only load path: the nightly job runs it into a fresh D1 database, and the build runs it with node:sqlite in one transaction to make `site.db`. `d1/build.json` has the build id, the counts and an estimate of the rows the load writes.
- `site.db`: for `pnpm serve` and the tests, opened read-only with `PRAGMA query_only=1`. It has no `sqlite_stat*`, like the D1 database.
- `site-assets/`: the static files that ship with the Worker (below).

The build id is a hash of the data date, the counts, the assets and the site's code, so a change of code is a new build too.

```
meta(key PK, value)                     -- build_id, data_finished, counts, coverage, assets (their hashed paths),
                                        --   top: {"langs": [[slug, label, items]…]} the 12 languages with the most items,
                                        --        "langLists": {slug: [listId…]} up to 6 lists by stars where the language is
                                        --        that of at least half (and at least 10) of the repositories with one;
                                        --        for languages with at least 20 items
category(id PK, name, slug UNIQUE, position, list_count)
list(id PK, slug UNIQUE, owner, repo, name, category_id, subcategory, summary, stars, pushed_day,
     archived, license, status, reason, readme_path, readme_oid, items_made, section_count, item_id, position,
     related JSON)    -- up to 6 [listId, shared]: the lists naming the most of the same items, scored
                      --   shared / sqrt(itemsA × itemsB), at least 3 shared, ties to the other list's stars
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
- `/llms.txt` (about 175 KB): what the site is, how its addresses read, how to cite it, and every list by category with our summary, its size and stars, linking to its Markdown copy. English only.
- `/lists/{owner}/{repo}.md` (671 files, about 20 MB, the largest about 470 KB): a list as Markdown: its name, our summary, its source and commit, its facts, then its sections as headings by depth and one line per entry (`[name](url) · language · stars · pushed · licence · in N lists · state · its page here`). English only; never a curator's description. The build fails if a list's repository name ends in `.md`. `_headers` gives these and `llms.txt` `text/markdown; charset=utf-8` and the crawl cache, and the `.md` copies `X-Robots-Tag: noindex` (`_headers` applies to static files only, so list pages under `/lists/` are untouched). A list page names its copy in `<link rel="alternate" type="text/markdown">`, in its facts and in its JSON-LD `encoding`.

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

`docs/design.md` has the design: the palette, the type scale, the spacing, the pieces and each page's layout. In short: one reading column of 44rem on every page, paper and ink with one green; a serif for titles and the names of lists, the system sans for the rest; a project is a line of text; facts are sentences and a definition list; filters and contents hang in the margin from 76rem and are a drawer below. System fonts only. Light and dark follow the system (`light-dark()`); there is no switch. The tokens are at the top of `src/site/assets/site.css`.

Components: the header (the mark and name, Lists, Items, About, search); `entry` and `listEntry` (a line of text; two lines on a phone); `chip` (a sunk fill, a label); `rot` (a word in a hairline box: "archived" in `--warn`, "quiet" in `--muted`, "gone" in `--gone`, never colour alone); `facts`; `facet` (a `<details>` of links with counts); `crumbs`; a section heading with its count and `#` anchor; `toc`; `pager`; `btn`; `attribution`; the quick-search dialog; the footer (what is indexed, the sections, the languages).

## Caching and crawling

| Answer | Cache-Control | Set by |
| --- | --- | --- |
| HTML | `public, max-age=300, s-maxage=86400, stale-while-revalidate=604800` | the Worker |
| `/api/quick` | `public, max-age=3600, s-maxage=86400` | the Worker |
| `/assets/{hash}/…` | `public, max-age=31536000, immutable` | `_headers` |
| sitemaps, robots, `llms.txt`, a list's `.md` | `public, max-age=3600, s-maxage=86400` | `_headers` |
| icons, manifest | `public, max-age=86400` | `_headers` |
| 404 | `public, max-age=60` | the Worker |
| `/healthz` | `no-store` | the Worker |

- Workers Caching (`"cache": { "enabled": true }` in `wrangler.json`) keeps answers in front of the Worker by their `Cache-Control`; there is no cache code and nothing kept in memory between requests but the start batch, the facets and the terms. Cloudflare compresses, so no answer carries `Content-Encoding`, `Content-Length` or `Vary`.
- The ETag is the build id (`W/"{buildId}"`). The Worker has it as `BUILD_ID` and answers a matching `If-None-Match` with 304 before any query.
- `/healthz` reads `meta.build_id` and answers `ok {buildId}`, or 503 when it differs from the Worker's `BUILD_ID`; `no-store`, never 304.
- `Content-Security-Policy: default-src 'self'`: no inline script or style, no request to anyone else (so no avatars). `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin` and `Strict-Transport-Security: max-age=31536000` on every answer of the Worker; `_headers` puts `nosniff` and the same HSTS on every static file. Plain http to any host but this computer is answered 301 to https before anything else (`docs/cloudflare.md`, HTTP).
- Redirects (renames, case, a trailing slash, `/item?url=`) are the Worker's.
- The Worker adds `Content-Language` to HTML answers (informative only). The language is in the URL, so caching and the ETag are unchanged.
- Which pages are indexed in which languages is one function, `indexedIn` in `src/site/i18n/indexing.ts`: the home, `/lists` (bare, a category, and their pages), list pages, `/items` (bare) and `/about` are indexed in every language, self-canonical with eleven `hreflang` alternates; item, owner and filtered pages are canonical to the English address in every language, with no alternates; `noindex` pages are `noindex` in every language.
- Every page has a canonical link, params in the fixed order. A listing page with `q`, two or more filters, or a sort other than the default is `noindex,follow`. On `/items` so is every page past the first, a filter on `owner` or `list` (their own pages are the home of those rows), on `category`, `status`, `stars` or `in`, a `topic` in `TOPIC_STOP` or with fewer than 20 results, and a `lang`, `license` or `kind` with fewer than 5 (`itemsNoindex`). On `/lists` a licence or a status is `noindex` too (`listsNoindex`). Facet, sort and pager links to a `noindex` page carry `rel="nofollow"`; a row's language link stays followed. Paginated pages have `<link rel="prev">` and `"next"`. A page past the last is a 404.
- An item page is indexable only when two lists or more name it, or it is a repository with at least `INDEXABLE_STARS` (100) stars, and never when GitHub no longer has it (`indexableItem` in `build/load.ts`). The rest (about 80,000 of 116,162) are `noindex,follow` and are not in the sitemaps; their links are still followed. `items-{n}.xml` keeps the default order, strongest first.
- Every page has Open Graph and Twitter tags (one static image, with `og:image:alt`; `twitter:card` `summary_large_image`, `twitter:title` and `twitter:description` the same as the `og:` ones), `theme-color`, the icons and the manifest. Self-canonical pages carry JSON-LD: `WebSite` on the home page (with `description` and `dateModified`, the data date); `CollectionPage` with an `ItemList` of the rows on `/lists`, `/items` (bare and one filter, page 1) and owner pages (the lists they keep, then 20 projects; `about` a `Thing` with the GitHub address, not a `ProfilePage`); on list pages a `CollectionPage` with `hasPart` (up to 30 top-level sections as `WebPageElement`); `BreadcrumbList` on category, list and item pages; `SoftwareSourceCode` with `isPartOf` (up to 5 lists), `description` (our first two summary sentences) and `dateModified` (its last push) on a repository's page, and `WebPage` with `about` a `Thing` (its name only) and the same `description` on any other indexable item. A list's `CollectionPage` adds `dateModified` (its last push, never after the data date) and `encoding` (its Markdown copy); owners, a category of `/lists` and a one-filter `/items` add `description`. `FAQPage` is on About only.
- `/sitemap.xml` is an index of `pages.xml` (the home, `/lists`, `/items`, `/about` and the category pages, in ten languages), `lists-{lang}.xml` (ten files), `browse.xml` (English only, no `lastmod`: `/items?lang=` and `?license=` and `?kind=` with at least 20 items, `?topic=` with at least 50 and not in `TOPIC_STOP`; each above the page's own thin threshold, so each is indexed), `owners.xml` (owners with a list or at least 2 items) and `items-{n}.xml` of 40,000 each. Pages and lists carry their `xhtml:link` alternates; owners and items are English only. `lastmod`: a list's last push (never after the data date), the data date for `pages.xml`, none for owners and items. They are static files, written by the build.
- `robots.txt`: one group of `User-agent: *` and the thirteen answer engines and AI crawlers of `AI_CRAWLERS` in `config.ts` (so they get the same rules), `Allow: /`, `Disallow: /api/`, `Disallow: /_data/`, `Disallow: /search` in every language, and the sitemap, under a comment that welcomes them and points at `/llms.txt`. The owner must keep Cloudflare's "Block AI bots" and managed `robots.txt` off for the zone.

## Attribution

- List page: "This page is an index of **{name}**, a list kept by {owner} and its contributors at github.com/{owner}/{repo}. The selection and order are theirs; the summary above is ours. Read at commit {oid7} on {date}." Then the licence, if any.
- Item page: "Named by the lists above. Follow a list to read what its curators say about it."
- Footer: "{SITE_NAME} indexes names, sections and links. Descriptions belong to the lists and are not copied here. Keep a list and want it left out? Open an issue." Then the language switcher.

## Not in this version

Trending and star history; item descriptions; accounts, saved items, comments; a theme switch; avatars, favicons or any request to another site; category, tag and section routes; choosing several values of one facet; RSS; a JSON API beyond quick search; downloads of the data; analytics; share images per page; translated section headings or item names; checking links beyond GitHub's `gone`; search that forgives typos.
