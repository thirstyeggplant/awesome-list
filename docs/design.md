# The look

The design of the site's pages: what it is for, the tokens, and how each page type is laid out. The styles are one file, `src/site/assets/site.css`; the markup is in `src/site/views/`. `docs/site.md` says what each page shows; this says how it looks.

## What it is for

A catalogue that is read: 671 lists, 116,162 names, almost every word a link. So:

- **One reading column.** Every page is one column of 44rem (`--page`), centred. The header's bar and the footer's inner box are the same width, so the brand, the `h1` and the first letter of every entry share one left edge on every page. Nothing sits beside the text: no sidebar, no facts column, no grid of cards, no column of numbers.
- **A project is a line of text, not a row of cells.** Its name, then what is known, in reading order, joined by middle dots. It wraps like text; nothing is right-aligned, and every value says what it is ("★ 4,795", "in 2 lists", "updated 2022"), so there are no column headers.
- **Facts are a sentence, then a definition list.** Every page opens under its `h1` with sentences made of its own data (`docs/site.md`, "Summary sentences"); the facts follow as label-beside-value lines in the column.
- **A rail is marginalia.** Filters and contents hang in the left margin, outside the column, only when the window has room (76rem and wider); below that they are a drawer opened by a button. The column is the same width either way.
- **Quiet links.** Names in entries and runs are ink; the accent is for the current thing, hover and focus. Links inside a sentence are underlined in a faint rule.
- **Calm.** Paper and ink, one green, hairlines. No shadows but the dialog's and the drawer's dim, no gradients, no motion but a colour fading in 120 ms.

## Palette

Light and dark follow the system (`color-scheme: light dark`, `light-dark()`); there is no switch.

| Token | Light | Dark | For |
| --- | --- | --- | --- |
| `--paper` | `#faf8f3` | `#141517` | The page |
| `--surface` | `#ffffff` | `#1c1e21` | Fields, the dialog |
| `--sunk` | `#f1eee6` | `#202226` | Chips, the header's search field, the footer |
| `--hover` | `#f5f2eb` | `#1a1b1e` | An option pointed at in quick search |
| `--ink` | `#1c1b19` | `#eceae4` | Text, names |
| `--ink-2` | `#4a4741` | `#c2bfb7` | Summaries, secondary text |
| `--muted` | `#69655d` | `#9a968d` | Counts, owners, labels |
| `--rule` | `#e5e1d6` | `#2a2c31` | Hairlines |
| `--rule-strong` | `#cfc9bb` | `#3d4047` | Borders of buttons |
| `--field` | `#888275` | `#6d717a` | Borders of fields: 3:1 against what is around them |
| `--accent` | `#1f5f4a` | `#84cfad` | Prose links, current, focus, the primary button |
| `--on-accent` | `#ffffff` | `#10231b` | Text on the accent |
| `--accent-soft` | `#e2eee7` | `#1c2f28` | A filter that is on, the option chosen in quick search |
| `--warn` | `#7d5200` | `#e0b354` | "archived", notices |
| `--gone` | `#9b2c2c` | `#ee9a9a` | "gone" |
| `--mark` | `#fff1b8` | `#4a4010` | `<mark>` |

Every pair of text and background used is at least 4.5:1 (AA), worked out from the values above. The lowest are muted text on `--accent-soft` (4.8:1) and on a sunk fill (5.0:1 light, 5.4:1 dark). A state is never colour alone: it is always the word.

## Type

System fonts only. No font file is shipped: it costs no bytes and no request, nothing shifts when a font arrives, and Chinese, Japanese and Korean need the system's faces anyway.

- `--serif`: Iowan Old Style, Palatino, Charter, Georgia. The site's name, `h1` to `h3`, a list's name.
- `--sans`: `system-ui`. Everything else.
- `--mono`: `ui-monospace`. Addresses, `owner/repo`, commit hashes.
- Under `:lang(zh|ja|ko)` the sans becomes that language's system face; the serif keeps the Latin faces first and falls to that language's serif for its own script. Headings lose their negative tracking, lines are a little taller (1.7), and Japanese headings break between phrases (`word-break: auto-phrase`).

Five sizes and two heading sizes, in rem so the reader's own size and 200% zoom hold. The body went from 15 to 16px and secondary text from 13 to 14px, because the page is read, not scanned across; the column is narrower than the old one, so a line stays near 75 characters.

| Token | Size | For |
| --- | --- | --- |
| `--f-xs` | 0.75 (12px) | Upper-case labels, chips, the state box |
| `--f-sm` | 0.875 (14px) | An entry's facts, the rail, the footer, notes, the sort line |
| `--f-base` | 1 (16px) | The body, an entry's name, summaries in list entries |
| `--f-lg` | 1.125 (18px) | The lede (a page's summary sentences), About's prose |
| `--f-xl` | 1.25 (20px) | `h3`, a list's name in a list entry |
| `--f-2xl` | 1.5 (24px) | `h2` |
| `--f-3xl` | 1.75 to 2.25, fluid | `h1` |

Body line height 1.6; headings 1.2 with `text-wrap: balance`; paragraphs `text-wrap: pretty`.

## Space and shape

A 4px grid: `--s1` 0.25rem … `--s8` 4rem. `--s7` above an `h2` and `--s3` under it; `--s5` between the lede and what follows; an entry has `--s2` above and below (about 40px a line), `--s3` on a phone (about 62px for two lines). A field or button is `--control` (2.25rem; 2.75rem on a phone). Corners: 6px on fields and buttons, 4px on chips, 10px on the dialog. The gutter is 1.5rem (1rem on a phone), never less than the safe-area insets (`--gl`, `--gr`). A rail is `--rail` (13rem). Two breakpoints and no container query: 40rem (phone) and 76rem (rail in the margin): 44 + 2 × (13 + 1.5) + 2 × 1.5 = 76.

## The shell

```html
<header class="top"><div class="bar">…</div></header>
<main id="main"><div class="page">
  …the column…
  <aside|nav class="rail sheet" id="_filters|_contents"><div class="rail-in">…</div></aside>   <!-- /lists, /items, a list -->
</div></main>
<footer class="foot"><div class="foot-in">…</div></footer>
```

`.bar`, `.page` and `.foot-in` are `max-width: var(--page)` with the gutter as padding. From 76rem a rail is absolutely placed in the left margin of `.page` (`inset-inline-end: 100%`), its inner box sticky. Below 76rem it is a drawer: hidden, and shown by its id (`:target`) fixed at the left, 22rem wide (the whole screen under 40rem), with the page dimmed by a `box-shadow` spread; its head says what it is and its × links away. A tap on the dim does not close it without script; the browser's back does. `Page.shape` is gone and `<body>` has no class.

## The pieces

- **Header.** The mark (the favicon's four books, drawn inline in the theme's colours) and the name; Lists, Items, About, the one being read marked with `aria-current="page"` and a line of the accent under it; the search field at the right, on a sunk fill. The home and search pages leave the header's field out: their own is right below.
- **Footer.** A sunk band: the name and the sentence about what is indexed; the three sections and the ten languages.
- **Entry** (`entry`, `entries` in `components.ts`; `ol.entries`). `<li><a>name</a> <span class="m">facts</span></li>`: three elements, four with a state. The facts, joined with `m.common.dot`: who (owner, else host); the language (or, for a thing that is not a repository or a site, its kind), left out on a list page when it is the list's main language (`mainLang`); `★ {n}`; "in N lists" from two; "updated {year}" unless the year is the data's own; up to three topics as `#slug` where the page asks (`/items`, search, an owner, an item's "alongside" and "more from"); then the state's box. The facts are plain text: the name is the only link, besides a list's own extra links after it. On a phone the name is a 44px line of its own and the facts go under it.
- **List entry** (`listEntry`; `ol.entries.lists`). The name in the serif at `--f-xl`, `owner/repo` in mono, our summary on its own line in `--ink-2`, then one muted line: items (or "not read yet" in the state's box), stars, updated year, the category (left out on a page of one category), how many projects a related list shares, the state.
- **Lede** (`.lede`). The page's summary sentences at `--f-lg`, names in them as links underlined in a faint rule.
- **Facts** (`.facts`). A definition list in the column, the label (`--f-sm`, muted, sentence case) beside its value, the same at every width, between two hairlines. Dates are `<time datetime>`.
- **Chip** (`.chip`). A sunk fill; a topic shows its label only. A filter that is on is `--accent-soft` and says what it is: "Language: Go ×" (`m.common.filterChip`).
- **Run** (`ul.run`). Names as one wrapping run of links with a middle dot after each (drawn by the stylesheet, so a line never starts with one); a subcategory's label is muted text ending in a colon on its own line. On a phone a run's lines are 44px.
- **Rail** (`.rail`). An upper-case title; facets as `<details>` with values as ink links and counts at the right; the chosen value in the accent with a mark before it; a list's contents as two levels with counts.
- **Sort line, pager, crumbs, buttons, the state box, quick search, the language bar.** As before, at the new sizes. A page has at most one primary button: on an item page the one outbound link, with the address beside it in mono (hidden on a phone).
- **Share row** (`.share`, `src/site/views/share.ts`). At the foot of the column on every page that has one, after the attribution, over a hairline: the label "Share", then small icons (18px, `currentColor`, muted; the accent when pointed at), then Copy link and Share… where script can do them. On a phone the label is hidden and the icons are 44 × 42px.

## Page by page

- **Home.** `h1`; the lede (what the site is and the data date); the search box; "Browse by language" (an `h2` drawn as a label) as a run of the 12 languages and All projects; "Start here": 8 list entries and "All 671 lists"; "Named by the most lists": 8 entries with topics; "All lists by category": the 26 categories as `<details>`, folded at every width, each summary the category's name (`h3`, a link), its count and a muted line naming its three lists with the most stars, opened to a run of its lists; the share row. Every list link stays in the HTML.
- **`/lists`.** `h1`; a lede (a category's sentences, or the bare page's one line); the filter field and, below 76rem, the Filter button; chips; the sort line; list entries; the pager; the rail.
- **A list.** Crumbs; the name; `owner/repo ↗` (the page's first outbound link); our summary as the lede; `p.about-list`, the list's sentences ending in "Read the original on GitHub ↗ · Suggest a change"; See also; the sticky bar (the filter with "N of M" inside it, and Contents below 76rem); the sections with their entries; Related lists; More in {category}; About this list: the facts (with the Markdown copy), the attribution, the share row; the contents rail.
- **`/items`.** `h1`; the lede (one language, topic, licence or kind: its sentences; otherwise the count); with a language, "Lists mostly in {language}"; the search field and Filter; chips; the sort line; entries with topics; the pager; the share row where there is one; the rail of nine facets.
- **An item.** Crumbs; `owner /` dimmed and the name, the state's box after it; the lede; the primary button and the address; Also listed as; the facts (a repository: stars, last push, language, licence, owner, named by, fork, renamed from; anything else: kind, host, named by) and "Facts from GitHub as of"; the topics; then the questions as `h2`: "Which awesome lists name {name}?" (one list entry per listing: the list, "listed as", the section path, its size), "Is {name} still maintained?" (one sentence), "What is listed alongside {name}?" (a note that the lists do not call them alternatives, 12 entries); More from {owner}; the attribution; the share row.
- **An owner.** `h1`; the lede; the GitHub address; Lists they keep; Their projects named by lists; the share row.
- **Search.** `h1`, the field, a line of jumps, then list entries, sections (as entries: the path, then the list and its size), entries with topics.
- **About.** The column, prose at `--f-lg`; its `h2`s are the visitor's questions.
- **404.** The column, a search box and a few links.

## On a phone

Under 40rem, the same markup in the same order; only this differs:

- An entry is two lines: the name (44px to tap), then its facts. A list entry: the name, the summary, the facts.
- Fields and buttons are 44px; fields are 16px so iOS does not zoom. Crumbs, a section path, a run's links, `owner/repo` and "more" links are 44px tall to tap; a link inside a sentence is as tall as its line.
- The header is two rows: the mark and name with the search field; then Lists, Items and About as three equal tabs. A tap on the field opens quick search.
- The filters that are on are a row of chips that scrolls sideways; the sort line scrolls sideways; the drawer is the whole screen.
- The language bar is one line fixed at the foot of the window, so showing it moves nothing.
- `viewport-fit=cover`, and the gutters are at least the safe-area insets.

## Weight

Measured on 2026-11-27 with `pnpm serve` on the same data, before (main at `c889645`) and after; Brotli at quality 11:

| | Before | After |
| --- | --- | --- |
| `/lists/avelino/awesome-go` | 1,575,604 bytes, 41,102 elements, 81.9 KB Brotli | 499,235 bytes, 12,194 elements, 74.6 KB Brotli |
| `/items` | 59,061 bytes, 1,403 elements | 36,545 bytes, 799 elements |
| `/gh/gin-gonic/gin` | 21,868 bytes | 16,428 bytes |
| `site.css` | 35,510 bytes, 7.5 KB Brotli | 24,439 bytes, 5.6 KB Brotli |

(Elements counted as start tags in the HTML.) The list page meets its byte and element targets; its Brotli size falls less than its raw size, since the cells it lost were repetitive. The stylesheet is just over the 24 KB aimed at and under the test's cap of 26,000 bytes. No font, no image but the icons, no new script or request.
