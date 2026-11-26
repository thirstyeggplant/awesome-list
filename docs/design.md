# The look

The design of the site's pages: what it is for, the tokens, and how each page type is laid out. The styles are one file, `src/site/assets/site.css`; the markup is in `src/site/views/`. `docs/site.md` says what each page shows; this says how it looks.

## What it is for

A catalogue that is read and scanned: 671 lists, 116,497 names, almost every word a link. So:

- **Quiet links.** When everything is a link, colour on every link is noise. Names in rows, grids and rails are ink; the accent is kept for prose links, the current thing, hover and focus. A name underlines when pointed at.
- **Hierarchy from type, not boxes.** A serif for what is a title (the site's name, headings, the names of lists), the system sans for everything that is scanned, mono only for addresses and `owner/repo`. Small upper-case labels name groups of facts and filters.
- **One layout for browsing.** A rail at the left (what to jump to or filter by), the content at the right. The home page, `/lists`, `/items` and a list page all use it, so the eye learns it once.
- **Dense where the data is, roomy around it.** Rows stay one line, 2.25rem tall. Space goes between groups: above a heading, around the page's head, in the footer.
- **Calm.** Paper and ink, one green, hairlines. No shadows but the dialog's, no gradients, no motion but a colour fading in 120 ms.

## Palette

Light and dark follow the system (`color-scheme: light dark`, `light-dark()`); there is no switch.

| Token | Light | Dark | For |
| --- | --- | --- | --- |
| `--paper` | `#faf8f3` | `#141517` | The page |
| `--surface` | `#ffffff` | `#1c1e21` | Fields, the dialog |
| `--sunk` | `#f1eee6` | `#202226` | Chips, the header's search field, the footer |
| `--hover` | `#f5f2eb` | `#1a1b1e` | A row pointed at |
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
- Under `:lang(zh|ja|ko)` the sans becomes that language's system face; the serif keeps the Latin faces first, so names in Latin letters look as they do in English, and falls to that language's serif (Songti, Hiragino Mincho, Nanum Myeongjo) for its own script. Headings lose their negative tracking, lines are a little taller, and Japanese headings break between phrases where the browser can (`word-break: auto-phrase`).

The scale, in rem so the reader's own size and 200% zoom hold:

| Token | Size | For |
| --- | --- | --- |
| `--f-xs` | 0.75 (12px) | Upper-case labels, chips |
| `--f-sm` | 0.8125 (13px) | Counts, owners, rails |
| `--f-md` | 0.875 (14px) | Navigation, notes, the footer |
| `--f-base` | 0.9375 (15px) | Rows, the body |
| `--f-lg` | 1.0625 (17px) | A list's summary, prose on About |
| `--f-xl` | 1.25 (20px) | `h3`, a category on the home page |
| `--f-2xl` | 1.5 (24px) | `h2` |
| `--f-3xl` | 1.75 to 2.5, fluid | `h1` |

Body line height 1.55; headings 1.2 with `text-wrap: balance`. Numbers in columns are tabular and right-aligned.

## Space and shape

A 4px grid: `--s1` 0.25rem, `--s2` 0.5, `--s3` 0.75, `--s4` 1, `--s5` 1.5, `--s6` 2, `--s7` 3, `--s8` 4. A row is `--row` (2.25rem); a field or button `--control` (2.25rem), the home page's search 2.75rem. Corners: 6px on fields and buttons, 4px on chips, 10px on the dialog. The page is at most 76rem wide with a gutter of 1.5rem (1rem on a phone); prose is at most 44rem; a rail is 15rem.

## The pieces

- **Header.** The mark (the favicon's four books, drawn inline in the theme's colours) and the name; Lists, Items, About, the one being read marked with `aria-current="page"` and a line of the accent under it; the search field at the right, on a sunk fill. On a phone the search field takes a second row. The home page leaves the header's field out: its own is right below.
- **Footer.** A sunk band: the name and the sentence about what is indexed at the left; the three sections and the ten languages at the right.
- **Row** (`.row`). `who` (name, owner or host, state) then `chips`, then three right-aligned columns: stars, lists, year. The name is ink at weight 500 and is never cut before the owner beside it is; the rest is muted. Pointed at, the row takes `--hover`. Chips that do not fit are dropped whole, never cut. In a container narrower than 38rem (a phone, or a narrow column) the row becomes two lines: who and the count of lists, then chips, stars and year.
- **List row** (`.list-row`). The list's name in the serif, its `owner/repo` in mono, its category; items, stars and year at the right; our summary on a second line in `--ink-2`.
- **Chip** (`.chip`). A sunk fill, no border; the namespace (`lang:`) dimmer than the value. A filter that is on is `--accent-soft` with a ×.
- **Facts** (`.facts`). A definition list between two hairlines: an upper-case label over each value.
- **Rail** (`.rail`, `.toc-rail`). Upper-case group labels; values as ink links with their counts at the right; the chosen value in the accent with a mark before it. On `/lists` and `/items` at phone width the rail follows the results and a "Filter" link above them jumps to it.
- **Sort line.** The count in ink at weight 600, then the sort words; the current one is underlined in the accent.
- **Pager.** Two bordered buttons at the two ends.
- **Buttons.** `.btn` is bordered; `.btn.primary` is the accent. A page has at most one primary.
- **Quick search.** A dialog with the only shadow on the site; the option chosen takes `--accent-soft`.

## Page by page

- **Home.** A head: the `h1`, the large search field, the line of counts. Then rail and content: the rail is the 26 categories with their counts (sticky; a `<details>` on a phone); the content is each category as an `h2` with its lists in columns of names. Last, the items named by the most lists, as rows.
- **`/lists`.** Rail of facets; `h1`, the filter field, chips of what is on, the sort line, list rows, the pager.
- **A list.** The head: breadcrumb, the name, `owner/repo`, our summary at `--f-lg`, the facts, two buttons (read the original, primary; suggest a change). Then rail (contents, sticky) and entries: a sticky filter bar, sections with a serif heading, a count and a `#` that shows when pointed at or focused (always, on a touch screen). Three levels of heading: 22px over a hairline, 18px, 16px.
- **`/items`.** As `/lists`, with item rows.
- **An item.** One column of 52rem: the name with its owner dimmed, the address, the facts, the chips, the lists that name it (the list's name over the path of its section), what it is listed alongside.
- **An owner, search, 404.** Headings and rows; the 404 is a short column.
- **About.** Prose at `--f-lg`, 1.7, at most 44rem.

## What changed in the markup, and why

- `layout.ts`: the header has the mark, marks the current section and puts the navigation before the search; the footer is two columns with the section links; `theme-color` follows the new dark paper.
- `components.ts`: a row's name, owner and state are wrapped in `.who`, so the chips can move to a second line in a narrow container; a chip's namespace is a `.ns` span; the count and the sort words of the sort line are in `.total` and `.sorts`; the pager's links and the search button are buttons.
- `home.ts`: the head is a `<header>`; the categories have a contents rail (the word is the list page's "Contents").
- `list.ts`: the two actions are buttons; the facts follow the summary inside the head.
- `item.ts`: a listing's section path is on its own line.
- `lists.ts`, `items.ts`: the rail has an id and a "Filter" link (an existing word) jumps to it on a phone; the × of a removable chip is its own span.
- `search.ts`: a section found is a row of two columns (`.section-row`).

No new words: every label is a message that already existed. One test changed with the markup: the pattern for a chip in `test/site/i18n.test.ts` allows the space that taking the tags out leaves after the namespace. The hooks of the scripts are as they were: `#list-filter`, `#list-count`, `#entries` with `li.row`, `section` and `data-depth`, `#collapse-all`, `body.collapsed`, `header.top`, `nav.langs a[hreflang]`, `dialog#quick` and its ids.

## Weight

`site.css` is about 22 KB, under 6 KB compressed; no font, no image but the icons, no new script. The row's two-line form uses a container query, the palette `light-dark()`, the primary button's hover `color-mix()`: all in the browsers the site already needed for `light-dark()`.
