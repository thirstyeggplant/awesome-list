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
| `/` | Search box; one line of counts and the data date; categories in the index's order, each an `h2` with its lists as a dense multi-column grid of names (subcategory lists indented under their parent); a strip of the 12 items named by most lists; footer |
| `/lists` | Params `q, category, license, status, sort=stars\|items\|updated\|name, page`. Rows: name, `owner/repo`, our summary, category, item count, stars, last push, rot mark |
| `/lists/{owner}/{repo}` | The list page, below |
| `/items` | Params `q, kind, status, lang, license, topic` (repeatable, AND), `list, category, owner, stars=100\|1000\|10000, in=2\|5\|10, sort=lists\|stars\|updated\|name, page`. Removable filter chips; a facet rail (kind, status, language top 15, licence, topic top 20, category, list top 10, stars, "in N+ lists"); the result count; 50 rows; previous and next |
| `/gh/{owner}/{repo}`, `/item/{h}` | The item page, below |
| `/gh/{owner}` | Owner page: the login with a GitHub link; "Lists they keep"; "Their projects named by lists" (100 item rows in the default sort, then a link to `/items?owner=`) |
| `/search?q=` | Lists (up to 8), sections (up to 10, each linking to its anchor in its list), items (the first 30, then "All N items" to `/items?q=`). `ns:value` tokens in `q` (lang, license, kind, status, topic) become filters, with a 302 to `/items?…` |
| `/about` | What this is, the rule above, attribution, how a list is left out, coverage numbers, the data date |
| `/api/quick?q=` | JSON for quick search |
| `/sitemap.xml`, `/sitemaps/*.xml`, `/robots.txt`, `/healthz`, `/assets/{hash}/…` | Crawling, health, static files |

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
7. Sticky contents: a left rail on wide screens, a `<details>` on narrow ones.
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

`pnpm build-site` writes `out/site.db`, then runs `VACUUM`, `ANALYZE` and `PRAGMA optimize`. The server opens it read-only with `PRAGMA query_only=1` and a 256 MB `mmap_size`. It uses Node's built-in `node:sqlite`.

```
meta(key PK, value)                     -- build_id, data_finished, counts
category(id PK, name, slug UNIQUE, position, list_count)
list(id PK, slug UNIQUE, owner, repo, name, category_id, subcategory, summary, stars, pushed_day,
     archived, license, status, reason, readme_path, readme_oid, items_made, section_count, item_id)
section(id PK, list_id, path JSON, title, depth, anchor, position, item_count)   INDEX(list_id, position)
item(id PK,  -- given in the default order, so ORDER BY id is the default ranking
     key UNIQUE, url UNIQUE, kind, host, name, aka JSON, owner, repo_name, stars, pushed_day,
     archived, fork, lang_id, license_id, status, list_count, pop REAL, list_id, indexable)   INDEX(owner)
listing(id PK, list_id, section_id, item_id, position, name, parent_name, extra_links JSON)
     INDEX(list_id, position)  INDEX(item_id)
term(id PK, ns, slug, label, item_count, UNIQUE(ns, slug))    -- ns: lang | license | topic
item_topic(item_id, term_id, PRIMARY KEY(item_id, term_id)) WITHOUT ROWID
alongside(item_id, rank, other_id, score, PRIMARY KEY(item_id, rank)) WITHOUT ROWID
owner(login PK, display, list_count, item_count)
redirect(from_path PK, to_path)
```

`item.name` is the repository's name for a repository. Otherwise it is the name the lists use most (a tie goes to the list with more stars), else the host and path. `aka` holds up to 5 other names the lists use.

**Full-text search.** Three contentless FTS5 tables (`content=''`), the rowid the entity's id, `tokenize="unicode61 remove_diacritics 2 tokenchars '+#'"` (so `c++` and `c#` survive), `prefix='2 3 4'`.

| Table | Columns (bm25 weight) |
| --- | --- |
| `item_fts` | `name` (10), `aka` (5), `ident` (4: owner and repo, or host and path words, cut at 200 characters), `topics` (2), `sections` (1: the distinct section titles and the names of its lists) |
| `list_fts` | `name` (10), `repo` (6), `summary` (4), `category` (2), `sections` (1) |
| `section_fts` | `title` (6), `path` (1) |

What a person types is never passed as it is: it is split on whitespace, each token double-quoted, and `*` added to the last.

**Facets in memory.** At start, `facets.ts` reads `item` in id order into typed arrays: kind, status and licence as `Uint8Array`; language and list count as `Uint16Array`; stars and the day of the last push as `Int32Array`; item → topics and item → lists as CSR arrays, with list → category as a lookup; and a permutation for each other sort. A request:

1. With `q`, takes the matching rowids from `item_fts` (at most 20,000).
2. Passes over the items once, making a mask of the filters each one fails. An item that fails none counts in every facet and in the result. An item that fails exactly one counts only in that filter's facet, so each facet says what choosing another value would give.
3. Walks the chosen order to take the 50 ids of the page.
4. Reads those 50 rows, and their topics, in two queries.

`/lists` has 671 rows, held in memory. List, item and owner pages are indexed lookups.

## Ranking

- **Items**: `list_count` descending, stars descending (none last), name. Being named by many curators is the signal only this site has; stars break the tie among the 108,000 items in one list.
- **Lists**: stars, then items. The home page keeps the index's order.
- **Search**: an exact name first, then `bm25(item_fts, 10, 5, 4, 2, 1) * pop` ascending, then id, where `pop = 1 + 0.35·ln(list_count) + 0.06·ln(1 + stars)`, stored at build. Popularity reorders close matches but does not beat a match on the name with a match on sections only. Lists: `bm25(list_fts, 10, 6, 4, 2, 1)`, then stars.
- **Quick search** matches `{name aka ident}` only, in the same order.

## Quick search

`GET /api/quick?q=` (2 to 64 characters) answers `{q, lists: [{name, slug, items}] (≤5), items: [{name, sub, key, kind, lists, stars, status}] (≤8), tags: [{label, href, count}] (≤3)}`. Ctrl/⌘-K or `/` opens a `<dialog>` with a combobox; Esc closes it. Typing waits 120 ms, cancels the last request and caches answers for the visit. ↑ and ↓ move through one list of options; Enter opens the one chosen, or `/search?q=` when none is. Without script, the form in the header goes to `/search`.

## The look

A reading-room catalogue: paper, ink, one accent, hairlines; no cards, shadows, gradients or hero. System fonts only: serif for headings and list names, sans for the rest, mono for tags and addresses, tabular figures aligned right. Light and dark follow the system (`light-dark()`); there is no switch. The content column is at most 72rem; listing pages have a 15rem facet rail at the left; item and about pages use a 46rem measure. A row is one line, 2rem tall: the name, the owner or host dimmed, up to 3 chips, then stars, "N lists" and the year of the last push at the right. A list row's summary wraps onto a second line.

```css
:root{color-scheme:light dark;
--bg:light-dark(#faf8f3,#16171a); --surface:light-dark(#fff,#1d1f23);
--ink:light-dark(#1c1b19,#e8e6e1); --muted:light-dark(#6b6862,#9a978f);
--rule:light-dark(#e4e0d6,#2c2e33); --accent:light-dark(#1f5f4a,#7fc8a9);
--warn:light-dark(#8a5a00,#e0b354); --gone:light-dark(#9b2c2c,#e58a8a);
--mark:light-dark(#fff1b8,#4a4010);
--serif:"Iowan Old Style",Charter,"Palatino Linotype",Georgia,serif;
--sans:system-ui,-apple-system,"Segoe UI",sans-serif; --mono:ui-monospace,Menlo,Consolas,monospace;
--s1:.25rem;--s2:.5rem;--s3:1rem;--s4:1.5rem;--s5:2.5rem; --row:2rem; --radius:3px; --measure:46rem; --wide:72rem;}
```

Components: the header (name, search, Lists, Items, About); `row` (for items and lists); `chip` (mono, hairline border, no fill); `rot` (a word: "archived" in `--warn`, "quiet" in `--muted`, "gone" in `--gone`, never colour alone); `facts`; `facet` (a `<details>` of links with counts); `crumbs`; a section heading with its count and `#` anchor; `toc`; `pager`; `attribution`; the quick-search dialog.

## Caching and crawling

| Answer | Cache-Control |
| --- | --- |
| HTML | `public, max-age=300, s-maxage=86400, stale-while-revalidate=604800` |
| `/api/quick` | `public, max-age=3600, s-maxage=86400` |
| `/assets/{hash}/…` | `public, max-age=31536000, immutable` |
| sitemaps, robots | `public, max-age=3600, s-maxage=86400` |
| 404 | `public, max-age=60` |
| `/healthz` | `no-store` |

- The ETag is the build id (a hash of the data date and the assets), so a 304 is one comparison. Answers are gzipped with `Vary: Accept-Encoding`, and the last 500 rendered pages are kept in memory.
- `Content-Security-Policy: default-src 'self'`: no inline script or style, no request to anyone else (so no avatars). `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`.
- Every page has a canonical link, params in the fixed order. A listing page with `q`, two or more filters, or a sort other than the default is `noindex,follow`.
- An item page is indexable only when it has repository facts or is in two lists or more. The rest are `noindex,follow` and are not in the sitemaps.
- `/sitemap.xml` is an index of `pages.xml`, `lists.xml`, `owners.xml` (owners with a list or at least 2 items) and `items-{n}.xml` of 40,000 each. `lastmod` is the data date.
- `robots.txt`: `Allow: /`, `Disallow: /api/`, `Disallow: /search`, and the sitemap.

## Attribution

- List page: "This page is an index of **{name}**, a list kept by {owner} and its contributors at github.com/{owner}/{repo}. The selection and order are theirs; the summary above is ours. Read at commit {oid7} on {date}." Then the licence, if any.
- Item page: "Named by the lists above. Follow a list to read what its curators say about it."
- Footer: "{SITE_NAME} indexes names, sections and links. Descriptions belong to the lists and are not copied here. Keep a list and want it left out? Open an issue."

## Not in this version

Trending and star history; item descriptions; accounts, saved items, comments; a theme switch; avatars, favicons or any request to another site; category, tag and section routes; choosing several values of one facet; RSS; a JSON API beyond quick search; downloads of the data; analytics; translations; share images; checking links beyond GitHub's `gone`; search that forgives typos.
