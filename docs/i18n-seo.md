# Translations and SEO

A design, with groups A, B and C of section 8 built (and the smoke checks of step 22); section 9 says where the code differs from what is written here. It covers two things the owner asked for: the site in the top 10 languages, and SEO that is complete.

It was written against the code as of 2026-11-25: `src/site/app.ts`, `views/*`, `build/static.ts`, `docs/site.md`, `docs/cloudflare.md`, and the build in `out/` (671 lists, 116,162 items, 59,424 of them indexable, 26 categories, 7,885 owners in the sitemap).

## 1. Languages

English and nine more. Chosen by where developers are (GitHub's yearly country counts) and how much of the web is read in the language, leaving out countries whose developers work in English (India, Nigeria, the Philippines). The ranking is from memory of public reports, not measured here; check it against the site's own traffic after three months and swap the last one if it is wrong.

| Language | Path | `hreflang` | `<html lang>` | Intl locale | `og:locale` | Why |
| --- | --- | --- | --- | --- | --- | --- |
| English | (none) | `en` | `en` | `en-US` | `en_US` | The source |
| Chinese, simplified | `/zh` | `zh-Hans` | `zh-Hans` | `zh-CN` | `zh_CN` | Largest developer population after the US and India |
| Spanish | `/es` | `es` | `es` | `es` | `es_ES` | Spain and Latin America |
| Portuguese | `/pt` | `pt` | `pt-BR` | `pt-BR` | `pt_BR` | Brazil is a top-five GitHub country; written as in Brazil |
| Japanese | `/ja` | `ja` | `ja` | `ja-JP` | `ja_JP` | Large, reads little English |
| German | `/de` | `de` | `de` | `de-DE` | `de_DE` | |
| French | `/fr` | `fr` | `fr` | `fr-FR` | `fr_FR` | France and French-speaking Africa |
| Russian | `/ru` | `ru` | `ru` | `ru-RU` | `ru_RU` | |
| Korean | `/ko` | `ko` | `ko` | `ko-KR` | `ko_KR` | |
| Indonesian | `/id` | `id` | `id` | `id-ID` | `id_ID` | Large and growing developer population |

- **Right to left: none.** Arabic was left out: many speakers, but a small share of developer reading. So there is no RTL work now. Two cheap things keep it possible later: `dir` comes from the locale table (always `ltr` today), and new CSS uses logical properties (`margin-inline-start`, not `margin-left`). `site.css` has 31 physical left/right declarations; they stay until a RTL language is added.
- `/zh` leaves room for `/zh-hant`. Paths are lower case, because the app already answers 301 for upper case.
- The locale table is one module, `src/site/i18n/locales.ts`. Nothing else names a language.

## 2. Addresses, choosing a language, caching

**Addresses.** English stays where it is. Every other language is the same path behind its prefix: `/es`, `/es/lists`, `/es/lists/{owner}/{repo}`, `/es/items?lang=go`, `/es/gh/{owner}/{repo}`, `/es/about`. The query string is the same in every language (parameter names and values are not translated).

- No prefix collides with a route (`/lists`, `/items`, `/item`, `/gh`, `/search`, `/about`, `/api`, `/assets`, `/_data`, `/sitemaps`).
- `/en` and `/en/…` answer 301 to the unprefixed address.
- `/es/` answers 301 to `/es` (the existing trailing-slash rule).
- Not prefixed, ever: `/api/quick`, `/item?url=`, `/healthz`, `/assets/…`, `/_data/…`, the sitemaps, `robots.txt`.
- The `redirect` table holds unprefixed paths. The app strips the prefix, looks up, and puts the prefix back on the target.
- A 404 under a prefix is the 404 page in that language. An unknown prefix is an ordinary English 404.

**In the app.** `createApp` strips the prefix first and makes a `Loc` for the request: `{ locale, m (the messages), n(), plural(), day(), href(path), data }`. `ctx` for a request is the shared base plus `loc`. Every internal link goes through `loc.href('/lists/x')`, which adds the prefix. Views stop writing `href="/…"` by hand.

**Choosing a language.** The server never looks at `Accept-Language`, a cookie or the visitor's country. A URL always answers in its own language, for people and crawlers alike. No redirect by language, anywhere.

- **The switcher** is a `<nav aria-label="Language">` in the footer, on every page: ten links to this same page in each language, each written in its own name (`Español`, `日本語`) with `lang` and `hreflang` on the link, the current one marked `aria-current="true"`. Plain links, no script.
- **A suggestion, not a redirect.** A few lines in `quick.js`: when `navigator.languages` has a better match than the page's language, and the visitor has not dismissed it (`localStorage`), a one-line bar appears under the header: "Leer esta página en español" and a close button. The sentence for each language sits on the switcher link as `data-suggest`, so the script holds no text. Without script or storage there is no bar; the switcher is always there.

**Caching.** Workers Caching keys on the URL, and the language is in the URL, so nothing changes: no `Vary`, the same `Cache-Control`, the same ETag (the build id). The Worker adds `Content-Language` to HTML answers; it is informative only. `/api/quick` stays one address for all languages: its JSON holds names and counts, no chrome, and the script adds the prefix to the links it builds.

## 3. Which pages are translated

Every page type renders in every language, so a reader who picked Spanish stays in Spanish. But only pages with words of ours in them are offered to search engines in ten languages.

| Page | In 10 languages | Indexed per language | Why |
| --- | --- | --- | --- |
| `/` | yes | yes | Category names and all chrome are translated |
| `/lists`, `/lists?category=x`, and their `page=N` | yes | yes | Category names and our summaries on every row |
| `/lists/{owner}/{repo}` (671) | yes | yes | Title, description, summary, facts and attribution are ours and translated |
| `/items` (the bare address only) | yes | yes | A hub; the entry to the facets |
| `/about` | yes | yes | All our words |
| `/items?…` with any parameter | yes | no: canonical to the English address | Rows are names; only labels differ |
| `/gh/{owner}/{repo}`, `/item/{h}` (116,162) | yes | no: canonical to the English address | See below |
| `/gh/{owner}` | yes | no: canonical to the English address | Names and rows only |
| `/search`, 404 | yes | no: `noindex`, as now | |

**Why item pages are not indexed per language.** An item page is a name, a link, tags, the names of lists and section headings in the curators' words. Translated, only the labels change ("Stars", "Last push", "In 4 lists"). Google's own rule is that localized pages count as duplicates when the main content is not translated. 59,424 indexable items × 10 would be 594,000 near-identical URLs: thin, a waste of crawl budget, and a risk to how the whole site is judged. So a localized item page has `rel="canonical"` to its English address, no `hreflang`, and is not in any sitemap. The English page is the one indexed. A page that is `noindex` in English is `noindex` in every language.

**Why list pages are indexed per language.** The summary, title, description and attribution are real translated text, and there are only 6,710 of them. The entries below are still names in the source's words, so a search engine may fold some languages together anyway; `hreflang` tells it which to show to whom. That is acceptable.

**The rule in one place.** `indexedIn(route, query): 'each' | 'english' | 'none'` in `src/site/i18n/indexing.ts`. The layout, the sitemap writer and the tests all ask it. `each`: self-canonical with `hreflang`. `english`: canonical to the English address, no `hreflang`. `none`: `noindex,follow`.

Crawlers will still find the localized item addresses through links on localized list pages. That is up to about a million addresses that answer with a canonical elsewhere. They are not blocked in `robots.txt`: a blocked address can be indexed bare, without its canonical being read. The cost is requests (10 million a month are included) and one indexed read each.

## 4. What is translated

**Translated:**

- Every string the code writes: navigation, headings, labels of facts and facets, buttons, placeholders, `aria-label`s, the footer, attribution sentences, the rot sentences, empty states, the pager, the 404, titles and meta descriptions, the About page, and the words the two scripts write.
- The 26 category names.
- Our 671 list summaries.
- Words for the enums when shown as labels: kinds (repo, package, video, paper, article, site), repository states (active, quiet, archived, gone), list states, sort names, yes/no.
- Numbers, plurals and dates.

**Not translated:**

- Names of lists, items and owners; `aka` names; addresses.
- Section headings (the curators' words). Subcategory labels on the home page (they are list names).
- Topic chips show the topic's label (GitHub's slug), the same in every language. A filter that is on is said in words with the facet's translated title ("Language: Go", `common.filterChip`).
- Language, licence and topic labels (`terms.json`). They are proper names or GitHub's topic slugs.
- The word "awesome" in "awesome list". It names the genre.
- Query parameter names and values.
- A list's `reason` for being unparsed, if it is free text; give it message keys if it is an enum.

**How UI strings are organised.**

```
src/site/i18n/
  locales.ts            the table in section 1; LOCALES, Locale, localeOfPath()
  messages/en.ts        export const en = { … } ; export type Messages = typeof en  (the shape, with literal types widened)
  messages/es.ts …      export const es: Messages = { … }     one file per language
  messages/index.ts     MESSAGES: Record<Locale, Messages>
  format.ts             fmt(), plural(), n(), day()
  indexing.ts           indexedIn()
  ui-hashes.json        per language, per key: the hash of the English it was translated from
```

- Keys are grouped by where they are used: `nav.lists`, `list.facts.lastPush`, `item.rot.archived`, `meta.list.title`. About 180 keys.
- A message is a string with `{name}` placeholders, or a plural: `{ one: '{n} list', other: '{n} lists' }`. Each language gives the categories its `Intl.PluralRules` needs (Russian: one, few, many, other; Chinese, Japanese, Korean, Indonesian: other only). `other` is required by the type.
- Because every language file is typed as `Messages`, a missing or misspelt key fails `pnpm typecheck`. Placeholders are checked by a test (section 7), not by types.
- A message that holds markup uses numbered tags, never raw HTML: `'Keep a list and want it left out? <1>Open an issue</1>.'`. `fmt(msg, { 1: (inner) => html\`<a href="…">${inner}</a>\` })` escapes the text and wraps the tagged part. Translators can move the link in the sentence; they cannot write HTML.
- `plural()` uses `Intl.PluralRules`, `n()` uses `Intl.NumberFormat`, `day()` uses `Intl.DateTimeFormat` with `timeZone: 'UTC'`. One formatter per locale, made on first use and kept. The `MONTHS` array and `toLocaleString('en-US')` in `views/components.ts` go.
- **To verify on the first deploy:** that the Workers runtime has ICU data for all ten locales. Node does, so tests alone will not show it. The nightly smoke test fetches `/de` and `/ru` and checks one formatted number and one plural (section 7). If the runtime falls back to English rules, write the plural rule and separators for the ten locales by hand in `format.ts`; it is about thirty lines.
- **Scripts.** `quick.js` and `listfilter.js` hold six English strings ("Lists", "Items", "Tags", "N lists", "N of M", "Collapse all" / "Expand all") and `toLocaleString('en-US')`. The server puts the translated strings on the elements as `data-*` attributes (the CSP forbids inline script), and the scripts read `document.documentElement.lang` for numbers and `data-prefix` for links.

**Category names** are data (the index's headings), so they are files, not message keys: one per language, `translations/categories.{lang}.json`, `{ "Platforms": "Plattformen", … }`. The key is the English name, so a renamed category is simply missing until translated.

**Summaries:** `translations/lists.{lang}.json`, the same shape and keys as `summaries/lists.json`:

```json
{ "0pandadev/awesome-windows": { "summary": "…", "enHash": "3f9a1c0b7d2e" } }
```

`enHash` is the first 12 hex characters of the SHA-256 of the English summary it was translated from (the same function as `sourceHash` in `src/summaries.ts`). A summary without it is read, shown and counted as "without enHash": whether it is current cannot be told. `pnpm check-translations --hash-lists {lang}` gives every such summary the hash of the current English, for a file just translated from it.

**Missing and stale.**

- Missing (a new list, a new category): the English text is shown, with `lang="en"` on that element.
- Stale (`enHash` differs from the current English): the old translation is still shown. A slightly old sentence in the reader's language is better than a switch of language mid-page.
- `pnpm check-translations` (a script beside `check-summaries`) prints, per language, the missing, the stale and the unknown keys. `pnpm build-site` writes the same counts into `out/d1/build.json`. Neither fails the build for summaries or categories: a new list must not stop the nightly job.
- UI strings are stricter. A test fails when a key's English changed and `ui-hashes.json` was not updated for a language. Whoever changes an English string retranslates it in the same change.

Translations are made from our English summary and nothing else. Whoever writes them does not read `out/private/` or a source's description.

## 5. D1, rows, static files, the bundle

**No new rows, no new columns, no new table.** A load stays at about 0.57M rows written.

- **UI messages** are TypeScript in the Worker bundle: ten files of about 180 short strings, roughly 150 KB before compression. The bundle limit is 64 MiB. They are plain object literals, so the cost at start is negligible against the 1 s limit.
- **Summaries and category names** are static files written by the build: `/_data/i18n/{lang}.json`, `{ "categories": { slug: name }, "summaries": { listSlug: text } }`, one per non-English language. English summaries are 132 KB with hashes, about 75 KB of text; a language's file will be 80 to 150 KB. Nine files, about 1 MB together, against limits of 100,000 files and 25 MiB each.
- The Worker loads a language's file once per isolate, on the first request in that language, with the same `once()` as `terms.json`. Never at start. English requests load nothing new.
- Views read a summary through `loc.summary(list)` and a category name through `loc.category(cat)`; both fall back to the English already in memory.
- **The build id** must change when a translation changes, or the ETag would serve an old page. UI messages are under `src/site/`, which `codeHash()` already covers. Add the bytes of the nine `i18n` files to the hash in `build/cli.ts`.
- **Search is English.** `list_fts` indexes the English summary and category. A search for a translated word finds nothing; names, which is what people search, are the same in every language. A later step can append the nine translations to `list_fts.summary` (same 671 rows, so no rows added). It would help the space-separated languages only: the `unicode61` tokenizer does not split Chinese or Japanese.

## 6. SEO

### What exists now

`<title>` ("{page} · Shelf"), a meta description on most pages, a canonical with params in a fixed order, `noindex,follow` on listing pages with `q`, two or more filters or a sort, on unindexable items, thin owners, search and the 404; a real 404 status; sitemaps (`pages`, `lists`, `owners`, `items-1`, `items-2`) and `robots.txt`; one `h1` on most pages; scripts deferred; no fonts or images to load.

### Gaps

1. `<html lang="en">` is fixed. No `hreflang` anywhere.
2. No Open Graph or Twitter tags. No structured data.
3. No favicon, no manifest, no `theme-color`. `/favicon.ico` reaches the Worker, which renders the 404 page and runs two full-text queries for "favicon ico" on every browser's first visit.
4. The home page has no `h1`, and its title is just "Shelf".
5. `/about` has no meta description.
6. An item's description is generic ("X: named by 3 awesome lists.") and its title has nothing but the name.
7. Every sitemap entry has `lastmod` = the data date, every night. A date that changes when the page does not teaches crawlers to ignore it.
8. The 26 category pages (`/lists?category=x`) are indexable but in no sitemap.
9. `/items` filter links are an unbounded space for crawlers. Single-filter pages for all 44,090 terms are indexable, most of them thin, and each pages to 200.
10. `robots.txt` does not keep crawlers off `/_data/` (8 MB of binaries).

### Head, on every page

In this order, all from `views/layout.ts`:

```html
<html lang="{lang}" dir="ltr">
<meta charset> <meta viewport>
<title>
<meta name="description">
<link rel="canonical">                      absolute; per indexedIn()
<meta name="robots" content="noindex,follow">   only when 'none'
<link rel="alternate" hreflang="…">         only when 'each': all ten, then x-default
<meta property="og:…"> <meta name="twitter:card">
<meta name="theme-color" content="#faf8f3" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#16171a" media="(prefers-color-scheme: dark)">
<link rel="icon" href="/favicon.ico" sizes="32x32"> <link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png"> <link rel="manifest" href="/site.webmanifest">
<link rel="stylesheet"> <script defer>
<script type="application/ld+json">        only on self-canonical pages
```

### hreflang

- On every page that is `each`: eleven `<link rel="alternate">`, one per language (itself included) and `x-default` pointing at English. Absolute addresses, the same path and the same query in the fixed order.
- One function, `alternates(path, query)`, makes them for the head, the switcher and the sitemaps, so they cannot disagree. Reciprocity follows: every language's page emits the same eleven.
- Pages that are `english` or `none` carry none. A canonical to another address and a `hreflang` set on the same page contradict each other.

### Titles and descriptions

Titles aim at 60 characters or fewer (30 for Chinese, Japanese and Korean), descriptions at 70 to 160 (80). The site name goes last. All are message keys under `meta.*`.

| Page | Title | Description |
| --- | --- | --- |
| Home | `Shelf: {lists} awesome lists and everything in them` | `An index of {lists} awesome lists and the {items} projects they name, by category, language, licence and topic.` |
| `/lists` | `All {lists} awesome lists · Shelf` | `{lists} awesome lists with their sizes, stars and our own one-line summaries.` |
| `/lists?category=x` | `{Category}: {n} awesome lists · Shelf` | `{n} awesome lists on {Category}, with sizes, stars and summaries.` |
| page N of either | the title, then `, page {N}` | the same |
| List | `{name} ({repo}): awesome list of {n} items · Shelf`, `{repo}` the repository's name (`awesome-nodejs`), which is what people search for; cut at the colon, the name and the parenthesis stay | Our summary, then ` {n} items in {m} sections.` when it still fits |
| Item (repo), in one list | `{owner}/{repo}: in the {list} awesome list · Shelf` (`meta.item.repoTitleOne`) | as below |
| Item (repo) | `{owner}/{repo}: in {n} awesome lists · Shelf` | Sentences, each a message, added while the whole fits: `{name} is named by {n} awesome lists: {A}, {B}, {C}.` (in one list: `{name} is in the {list} awesome list, under {section}.`), `Listed under {section} in {list}.`, `Alongside {X}, {Y}, {Z}.`, `{Language}, {licence}, {stars} stars.` Each only when known |
| Item (other), in one list | `{name}: in the {list} awesome list · Shelf` (`meta.item.titleOne`) | the same sentences, with the host in the first and no facts |
| Item (other) | `{name}: in {n} awesome lists · Shelf` | `{name} ({host}) is named by {n} awesome lists: {A}, {B}, {C}.` |
| Owner | `{display}: lists and projects · Shelf` | as now |
| `/items` | `{items} projects named by awesome lists · Shelf` | `Browse {items} projects by language, licence, topic, stars and how many lists name them.` |
| `/items?one filter` | `{label}: {n} projects in awesome lists · Shelf` | the same pattern with the label |
| About | `About Shelf` | `What Shelf shows, where it comes from, and how a list is left out.` |

A title that would run over drops the tail after the colon, never the name.

### Open Graph and Twitter

`og:type` (`website`), `og:site_name`, `og:title` (the title without the site name), `og:description`, `og:url` (the canonical), `og:locale`, `og:locale:alternate` for the others on `each` pages, `og:image` with `og:image:width`, `og:image:height` and `og:image:alt`, and `twitter:card` = `summary_large_image`. Twitter reads the `og:` tags for the rest.

**One static image**, 1200×630, under 100 KB: the name on the paper colour, no other words, so it serves every language. Nothing is generated per page. It is at `/assets/{hash}/og.png`, and the tag gives the absolute address.

### Structured data

JSON-LD in one `<script type="application/ld+json">`. The CSP does not block it: it is a data block, not script. One helper, `jsonLd(value)`, serialises it and writes `<` as `<` so no name can close the tag. Only what the page shows and we know to be true.

| Page | Types |
| --- | --- |
| Home | `WebSite` (`name`, `url`, `inLanguage`, `description`: the home's summary sentence, `dateModified`: the data date, `potentialAction`: a `SearchAction` on `{origin}{prefix}/search?q={search_term_string}`). Google no longer draws a search box from this; it costs nothing |
| `/lists`, category pages | `CollectionPage` with `mainEntity`: an `ItemList` of the rows on the page (`position`, `url`, `name`), and `BreadcrumbList` on a category page; a category's adds `description` (its summary sentences) |
| List | `BreadcrumbList` (Lists › Category › name, as the visible crumbs); `CollectionPage` with `name`, `description` (our summary), `url`, `inLanguage`, `isPartOf` (the `WebSite`), `isBasedOn` (the GitHub address), `mainEntity`: an `ItemList` with `numberOfItems` only, `dateModified` (the list's last push, never after the data date) and `encoding` (a `MediaObject`, `text/markdown`, its `.md` copy). No 3,000 `ListItem`s: they would double the page |
| Item (repo) | `BreadcrumbList` (Lists › the list with the most stars › the item); `SoftwareSourceCode`: `name`, `codeRepository`, `programmingLanguage` when known, `license` as `https://spdx.org/licenses/{id}` only for an SPDX id, `keywords` (the topics), `isPartOf` (up to 5 lists as `CollectionPage`), `description` (the plain text of the first two summary sentences: ours, made of facts), `dateModified` (its last push), `isAccessibleForFree` left out |
| Item (other), indexable | `BreadcrumbList`; `WebPage` with `isPartOf` (the `WebSite`), `description` (as above) and `about`: a `Thing` with its name only (its own address is a third party's) |
| Owner (indexable) | `CollectionPage` with `description` (its summary sentence), `about` a `Thing` (the login and its GitHub address; not `ProfilePage`, which needs a `Person` or `Organization` the data cannot tell) and an `ItemList` of the lists they keep, then their first 20 projects |
| `/items`, bare and one filter, page 1 | `CollectionPage` with an `ItemList` of the 50 rows (`itemListElement` from `itemListLd` in `components.ts`, as `/lists`); one language, topic, licence or kind adds `description` (its summary sentences) |
| List (also) | `hasPart`: up to 30 top-level sections as `WebPageElement` (name, the page's address with the anchor) |
| About | `FAQPage`: the first five questions of the page with its own answers as plain text. The only `FAQPage` on the site: no item page has one, and no page has a `QAPage` |
| Search, 404 | none |

Never: a curator's or an owner's description (an item's `description` is our own sentence made of facts), `author` (we do not know whether an owner is a person), `aggregateRating` or any rating from stars, `dateModified` we cannot stand behind, `Organization` for the site.

### Canonical and noindex for query pages

Kept: params in the fixed order; `noindex,follow` for `q`, two or more filters, a non-default sort, and beyond page 200.

Added, in English and so in every language:

- `/items` with one filter and `page` greater than 1 is `noindex,follow`. Page 1 stays indexable.
- `/items` with one filter and fewer than 5 results is `noindex,follow` (thin).
- Facet and sort links whose target is `noindex` get `rel="nofollow"`. It is a hint, but it keeps most crawlers out of the combinations.
- `page=1` is never written (already so). A page past the last is a 404, not an empty 200; check and fix if it is not.

### Sitemaps

```
/sitemap.xml                  the index
/sitemaps/pages.xml           /, /lists, /items, /about, the 26 category pages; each in ten languages
/sitemaps/lists-{lang}.xml    671 list pages each; ten files
/sitemaps/owners.xml          English only, as now
/sitemaps/items-{n}.xml       English only, as now, 40,000 each
```

- Every `<url>` in `pages.xml` and `lists-*.xml` carries the eleven `<xhtml:link rel="alternate" hreflang="…">`, from the same `alternates()`. A `lists-{lang}.xml` is under 1 MB.
- Totals: 300 + 6,710 + 7,885 + 59,424 ≈ 74,300 addresses. Every file is far under 50,000 addresses and 50 MB.
- **`lastmod`.** List pages: the list's last push day (that is when its content last changed), never later than the data date. `pages.xml`: the data date. Items and owners: no `lastmod`; we do not track when a page of theirs changed, and a nightly date on 67,000 unchanged pages is false.
- The index's `<lastmod>` for a file is the latest in it, or left out.

### robots.txt

```
# Shelf welcomes search engines, answer engines and AI crawlers. See /llms.txt.
User-agent: *
User-agent: GPTBot               … and the twelve others of AI_CRAWLERS, in one group
Allow: /
Disallow: /api/
Disallow: /_data/
Disallow: /search
Disallow: /zh/search      one line per language
…
Sitemap: {origin}/sitemap.xml
```

Written from the locale table and `AI_CRAWLERS` in `src/site/config.ts`: GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-SearchBot, Claude-User, PerplexityBot, Perplexity-User, Google-Extended, Applebot-Extended, CCBot, Amazonbot, meta-externalagent. One group, because a crawler that finds its own name ignores the `*` group, so they must share its rules. Each name was checked on 2026-11-27 against its operator's page: developers.openai.com/api/docs/bots, support.claude.com/en/articles/8896518, docs.perplexity.ai/guides/bots, developers.google.com/search/docs/crawling-indexing/google-common-crawlers, support.apple.com/en-us/119829, commoncrawl.org/ccbot, developer.amazon.com/amazonbot, developers.facebook.com/docs/sharing/webmasters/web-crawlers. In the Cloudflare dashboard, "Block AI bots" and a managed `robots.txt` must stay off, or they override this file.

### For answer engines

`/llms.txt` (the llms.txt form: an `h1`, a blockquote, how to read the addresses and cite the site, then each category's lists linking to their Markdown copies) and `/lists/{owner}/{repo}.md` are static files, English only, our summaries and the facts. The copies are `X-Robots-Tag: noindex` so they are not indexed as duplicates of the HTML; crawlers may still read them, which is their purpose. No `llms-full.txt` (it would be over 15 MB) and no Markdown copy of an item.

### The rest

- **404.** Already a real 404, `noindex`, no canonical, cached 60 s. Add static `/favicon.ico`, `/favicon.svg`, `/apple-touch-icon.png` and `/site.webmanifest` so those requests never reach the Worker.
- **Manifest.** `name`, `short_name`, `start_url: "/"`, `display: "browser"`, `background_color` and `theme_color` (the paper colour), two icons. English only; it is not an installable app.
- **Headings.** One `h1` a page. Home gets one: a line saying what the site is (the same words as its title, without the name), above the search box. List pages already go `h1`, then `h2` "Contents" and the sections from `h2` down. Facet rails use `<summary>`, not headings; leave them.
- **Internal links.** Home links every list; a list links every item; an item links its lists, their sections, its owner and twelve neighbours. Add: on a list page, after the entries, "More in {category}": up to 8 other lists of the category by stars. Add `translate="no"` on names of items, lists and owners and on tag chips, so a browser's own translation leaves them alone.
- **Speed.** Nothing new blocks rendering: no fonts, one image (referenced only by `og:image`, never loaded by the page), CSS of 9 KB, scripts deferred. The head grows by about 1.5 KB. Check the largest list page in each language stays within the Worker's CPU time; translation adds a lookup per string and nothing per row beyond `n()` and `plural()`, which must use the kept formatters.
- **Type.** The serif stack has no Chinese, Japanese or Korean faces. Add `:lang(zh)`, `:lang(ja)`, `:lang(ko)` rules that put the system's own faces first. A row is one line of 2rem; check German and Russian labels do not wrap it.
- **Search Console.** After the first deploy: submit `/sitemap.xml`, and read the International Targeting and Pages reports after two weeks for `hreflang` errors and "duplicate, Google chose different canonical".

## 7. Tests

All in vitest against the node adapter and the fixture, as now (`test/site/`). New file `test/site/i18n.test.ts` and `test/site/seo.test.ts`.

**Languages**

1. **Types.** `pnpm typecheck` fails on a missing key (by construction).
2. **Placeholders.** For every key and language: the set of `{name}` placeholders and numbered tags equals the English one; a plural has every category `Intl.PluralRules(locale)` can return.
3. **Stale UI.** The hash of each English message equals `ui-hashes.json` for every language.
4. **Not left in English.** For every key and language, the value differs from the English, except keys on a short allowlist in the test (for example a key whose value is "GitHub").
5. **No English in the chrome.** A test-only locale whose every message is wrapped (`⟦…⟧`) is registered. Every route of the fixture is rendered in it. Every text node and every `aria-label`, `placeholder`, `title`, `alt`, `content` and `data-*` message attribute must be wrapped, or be made only of the fixture's data strings (names, section titles, slugs, tags), numbers and punctuation. Anything else is a string someone wrote into a view by hand.
6. **Every language renders.** For each of the ten: every route of the fixture answers 200 with the right `<html lang>`, a non-empty title and description within the length bounds, and no `{` left from an unfilled placeholder.
7. **Links keep the language.** In a `/es` page, every internal `href` and form `action` starts with `/es/` or is `/es`, except `/assets/…`, the static icons and the switcher's links.
8. **Fallbacks.** A list with no translation shows the English summary with `lang="en"`; a stale one shows the translation and is counted in `build.json`.
9. **Prefix routing.** `/en/lists` answers 301 to `/lists`; `/ES/lists` to `/es/lists`; `/es/` to `/es`; a renamed repository under `/es/gh/…` redirects to the new address under `/es`; `/xx/lists` is a 404.
10. **Numbers and plurals.** `plural` for 1, 2, 5, 21 and 1,000 in Russian; `n(116162)` in German, French and English.

**SEO**

11. **Reciprocity.** For every `each` route of the fixture, fetch all ten; each must list the same eleven alternates, each alternate must answer 200 and be self-canonical, and `x-default` must be the English address.
12. **Canonical rules.** A localized item, owner and filtered `/items` page has a canonical to the English address and no `hreflang`. A page with `noindex` has no `hreflang`. No page has both `noindex` and a canonical to another address.
13. **JSON-LD.** Every `application/ld+json` block parses; each `@type` has its required properties; every address in it is absolute and on the origin (or GitHub for `isBasedOn` and `codeRepository`); no item block has `description`, `author` or a rating. The hostile-name fixture (`</script>` in a name) does not break out.
14. **Sitemaps.** Every file is well-formed XML under 50,000 addresses; every `<loc>` answers 200, is self-canonical and is not `noindex` (checked for all of the fixture); the `xhtml:link` set of each entry equals the page's own `hreflang` set; no item or owner address appears under a language prefix; `lastmod` of a list is its push day.
15. **robots.txt** disallows `/search` under every prefix and names the sitemap.
16. **Head.** Each page has exactly one `h1`, one title, one description, one canonical or none, the Open Graph set, and the icons. `/favicon.ico` and the manifest are static files.
17. **The existing rule holds.** The test that no description reaches a page runs for every language, and also reads the `i18n` files.

**After deploy** (the nightly smoke test, `scripts/smoke-languages.ts`): `/de` contains `116.162`-style grouping for the items count and `/ru/lists` contains the right plural form; `/es` has `<html lang="es"`. Node works out the expected text from the same messages and the counts in `out/d1/build.json`. A failure rolls back, as now.

## 8. The work, in order

Each step leaves `pnpm check` passing and can be merged alone.

**A. SEO that needs no translation** (ship first; it helps English at once)

1. `views/layout.ts`: Open Graph, Twitter, `theme-color`, icon and manifest links; `Page` gains `jsonLd?` and `og?`. `html.ts`: `jsonLd()`.
2. `src/site/assets/`: `og.png`, `favicon.svg`, `favicon.ico`, `apple-touch-icon.png`, `site.webmanifest`. `build/static.ts`: `readAssets` takes images; the four root files are written unhashed; `_headers` caches them for a day.
3. Titles and descriptions per the table: `views/home.ts` (and its `h1`), `lists.ts`, `list.ts`, `item.ts`, `items.ts`, `owner.ts`, `about.ts`.
4. JSON-LD per the table, in the same views. "More in {category}" in `list.ts`. `translate="no"` in `components.ts`.
5. `views/items.ts`, `views/lists.ts`: the added `noindex` rules and `rel="nofollow"` on facet and sort links.
6. `build/static.ts` and `build/cli.ts`: category pages in `pages.xml`, the `lastmod` rules, `/_data/` in `robots.txt`.
7. `test/site/seo.test.ts`: tests 13 to 16 for English. Update `docs/site.md`.

**B. The i18n frame, English only**

8. `src/site/i18n/locales.ts`, `format.ts`, `messages/en.ts`, `messages/index.ts`, with English as the only locale.
9. Move every string out of `views/*.ts` into `en.ts`, view by view; replace `num`, `plural`, `fmtDay`, `monthYear`, `fmtIso` in `components.ts` with the `Loc` ones. `views/context.ts`: `loc` on `Ctx`.
10. `assets/quick.js`, `assets/listfilter.js`: read strings, locale and prefix from `data-*`.
11. The wrapped test locale and tests 2, 5 and 10. At the end of this step the site is byte-for-byte what it was, apart from attributes.

**C. Routing and indexing**

12. `app.ts`: strip the prefix, make `Loc`, the `/en` redirect, the redirect table under a prefix, `Content-Language`. Every link through `loc.href`.
13. `src/site/i18n/indexing.ts`; `layout.ts`: `lang`, `dir`, canonical by `indexedIn`, `hreflang`, the switcher in the footer; `quick.js`: the suggestion bar; `site.css`: the switcher, the bar, the `:lang()` font rules.
14. `build/static.ts`, `build/cli.ts`: `lists-{lang}.xml`, `xhtml:link`, `robots.txt` from the locale table.
15. `src/translations.ts` (reading and checking the files, `enHash`), `scripts/check-translations.ts`, the `check-translations` script in `package.json`. `build/cli.ts`: write `/_data/i18n/{lang}.json`, add them to the build id, counts in `build.json`. `app.ts`: load them with `once()`. `loc.summary`, `loc.category`.
16. Tests 6 to 9, 11, 12, 14, 15, 17, run with one real extra locale holding a handful of strings, so the frame is proved before the translations exist.

**D. The translations** (content only, no code; one commit per language so each can be reviewed)

17. `translations/glossary.md`: for each language, the fixed words: list, item, section, "named by", "listed alongside", archived, quiet, gone; that "awesome" stays; the tone (plain, informal "you" where the language makes one choose).
18. UI strings: `messages/{lang}.ts` and `ui-hashes.json`. About 180 keys × 9 = about 1,600 strings.
19. `translations/categories.{lang}.json`: 26 × 9 = 234 names.
20. `translations/lists.{lang}.json`: 671 × 9 = 6,039 sentences, about 75 KB of English per language. Work in batches of about 100 lists; after each batch run `pnpm check-translations`, which also checks: the key exists in `summaries/lists.json`; `enHash` is current; one sentence; no markup or control characters; at most 200 characters (100 for Chinese, Japanese, Korean); product names found in the English (words with a capital or a digit inside, such as "TensorFlow.js") appear unchanged. Translate from our English summary only.
21. Add the nine locales to `locales.ts`. Tests 3, 4 and 6 now cover them all.

**E. After the first deploy**

22. `.github/workflows/nightly.yml`: the three smoke checks. Confirm the runtime's ICU; fall back to hand-written rules if needed.
23. Submit the sitemap; read the reports after two weeks; revisit the tenth language after three months of traffic.
24. `docs/site.md`: the routes, "Caching and crawling" and "Not in this version" (take out "translations" and "share images").

## 9. As built

Groups A, B and C (steps 1 to 16) and the smoke checks of step 22 are in the code. Where it differs from the text above, and why:

- **Ten locales are registered; nine are still English.** `messages/{lang}.ts` for the nine are copies of `en.ts`, typed as `Messages`, with `// TODO translate` at the top, for translators to replace. `pnpm check-translations` reports a file identical to the English as untranslated; tests 3 and 4 skip such a language, and test 2 asks for every plural category only once a language is translated. While a plural is still the English one, the English rules choose its form, so `/ru/lists` says "671 lists", not "671 list". The summaries and category names of all nine are written (`translations/`).
- **A language's link in the switcher carries `data-suggest` only once its messages are translated**, so the bar never offers "Read this page in English" in the name of German.
- **`ui-hashes.json` is filled by a command.** After translating a messages file, `pnpm check-translations --stamp {lang}` records the English each message was translated from. It starts as `{}`.
- **Short lists of names use a message (`common.separator`), not `Intl.ListFormat`,** which joins Chinese names with nothing between them and adds "und" in German.
- **The product-name check is advice.** Acronyms (AI, GDPR, APIs) are left out, since many languages have their own, and a name not kept is listed "to check by eye" rather than failing the script.
- **The wrapped test locale (test 5) is not registered.** `createApp` takes `messages` to use in place of a language's own, and the test renders English with every message wrapped.
- **Not prefixed means not answered under a prefix.** `/es/api/quick`, `/es/item?url=` and `/es/healthz` are 404.
- **`/lists` with a licence or status filter** is `noindex,follow`: nobody searches for those slices. Only the bare address, a category and their pages are indexed, and in every language (`each`).
- **Narrower `/items` indexing (design v3).** Every page past the first is `noindex`, bare included (every item is in a sitemap); so are `owner` and `list` (the owner and list pages are the canonical homes of those rows), `category`, `status`, `stars` and `in`, a topic in `TOPIC_STOP`, and a topic with fewer than 20 results (5 for `lang`, `license`, `kind`). The pages that stay are offered in `sitemaps/browse.xml`, English only. Paginated pages carry `<link rel="prev">` and `"next"`, absolute and in their own language.
- **More titles and descriptions:** the list title carries the repository's name, an item in one list names that list, and an item's description is built of sentences (section 6, the table).
- **A `noindex` page keeps its canonical to its own address in its own language** (as English pages already did), never to another language.
- **A category page's `h1` is the category's name.** The JSON-LD of an item also has `url`. A list whose reason for being read in part is the pipeline's "N items from M links" says it in words (`count.itemsFromLinks`); any other reason is shown in English, marked `lang="en"`.
- **The manifest is written by the build** from `SITE_NAME`, with two icons (`/favicon.svg` and the 180-pixel `/apple-touch-icon.png`). The other three root files and `og.png` are in `src/site/assets/`.
- **Not byte for byte (step 11).** Dates now come from `Intl.DateTimeFormat` (`Jun 2, 2026` in English, not `2 Jun 2026`), an apostrophe inside a message is written `&#39;`, and names carry `translate="no"`.
- **Summary sentences (design v4).** Each is one message under `sum.*`, `item.q.*` and `item.a.*` (with `item.alongsideNote`, `entry.*`, `common.dot`, `common.filterChip`, `items.mostlyIn`, `list.aboutTitle`, `facts.owner`, `facts.markdown` and `about.fresh*`, `about.ai*`), in all ten languages and stamped. A sentence is never assembled from fragments, so each language orders its own words; a short list of names inside one uses `common.separator`, so "A, B, C" has no "and". `common.dot`, `entry.stars`, `common.filterChip` and `facts.markdown` may be the same as the English. The words "the lists' own descriptions" and "description" in them mean the curators'; the sentences describe only facts.
- **Not done:** step 17 (the glossary), the messages of step 18, step 21's "add the nine locales" (they are already registered), and steps 23 and 24 beyond what `docs/site.md` now says.

## Not in this design

Per-page share images; translated section headings or item names; machine translation at run time or in the nightly job; a language cookie or any redirect by language; regional variants (`es-MX`, `pt-PT`, `zh-Hant`); right-to-left layout; search in the translated text; translated query parameters.
