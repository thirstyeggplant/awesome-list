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

A 4px grid: `--s1` 0.25rem, `--s2` 0.5, `--s3` 0.75, `--s4` 1, `--s5` 1.5, `--s6` 2, `--s7` 3, `--s8` 4. A row is `--row` (2.25rem); a field or button `--control` (2.25rem), the home page's search 2.75rem. Corners: 6px on fields, buttons and cards, 4px on chips, 10px on the dialog. The page is at most 76rem wide with a gutter of 1.5rem (1rem on a phone); prose is at most 44rem; a rail is 15rem. Three layout tokens: `--side` (18rem, the facts column of an item page and of a list's head), `--card` (17rem, the narrowest a card in a grid may be) and `--row-phone` (3.5rem, the least height of an item row in a narrow container).

## The pieces

- **Header.** The mark (the favicon's four books, drawn inline in the theme's colours) and the name; Lists, Items, About, the one being read marked with `aria-current="page"` and a line of the accent under it; the search field at the right, on a sunk fill. On a phone the search field takes a second row. The home page leaves the header's field out: its own is right below. The phone's header is in "On a phone" below.
- **Footer.** A sunk band: the name and the sentence about what is indexed at the left; the three sections and the ten languages at the right.
- **Row** (`.row.item`). `who` (name, owner or host, state), then at most two topic chips, then four columns: **Language** (plain text in `--ink-2`, a link to `/items?lang=`; for a thing that is not a repository or a site, its kind, linking to `/items?kind=`), **Stars**, **Lists** (the number only, and only when two or more: 93% of items are in one list, so the cell is empty for them) and **Updated** (the year of the last push, with an `aria-label` that says so). The licence is not on a row. Chips are topics only, and only where the page asks for them (`/items`, search, an owner, an item's "Listed alongside" and "More from"): never one in `TOPIC_STOP` (`hacktoberfest`, `awesome`…) or the item's own language. A list page's rows have no chips. The name is ink at weight 500 and is never cut before the owner beside it is; the rest is muted. Pointed at, the row takes `--hover`. In a container narrower than 38rem the row becomes two lines: see "On a phone".
- **Header row** (`.rows-head`). The column labels over a group of rows (Name, Language, Stars, Lists, Updated; for lists Name, Items, Stars, Updated), on the rows' own grid, in the upper-case label style, `aria-hidden` (each cell says what it is). `itemRows` and `listRows` write one before their `<ol>`, inside a `.rowset` container; a list page has one, in its sticky filter bar, wide screens only. Not shown in a narrow container.
- **List row** (`.list-row`). The list's name in the serif, its `owner/repo` in mono, its category (left out on a page of one category); items, stars and year at the right; our summary on a second line in `--ink-2`. A list we could not read says "not read yet" in the state's box where the count of items would be.
- **Card** (`.card`, in a `.cards` grid of `minmax(var(--card), 1fr)`). A list: its name in the serif at `--f-lg` (the link, which covers the card), our summary in `--ink-2` at `--f-md` clamped to three lines, then one muted line: items · category (· projects in common, for a related list). `--surface` on the paper, a `--rule` border, `--radius`, no shadow; pointed at, the border is `--rule-strong`. Used for "Start here" on the home page and "Related lists" on a list page.
- **Chip** (`.chip`). A sunk fill, no border; the namespace (`lang:`) dimmer than the value. A filter that is on is `--accent-soft` with a ×.
- **Facts** (`.facts`). A definition list between two hairlines: an upper-case label over each value. In the side column of an item page and of a list's head (wide screens), each fact is one line, label at the left and value at the right.
- **Rail** (`.rail`, `.toc-rail`). Upper-case group labels; values as ink links with their counts at the right; the chosen value in the accent with a mark before it. Under 56rem a rail is a sheet: see "On a phone".
- **Sort line.** The count in ink at weight 600, then the sort words; the current one is underlined in the accent.
- **Pager.** Two bordered buttons at the two ends, and between them "Page N of M" in muted text.
- **Buttons.** `.btn` is bordered; `.btn.primary` is the accent. A page has at most one primary: on an item page it is the one outbound link ("Open on GitHub ↗", "Visit {host} ↗"), with the address under it in mono as text, not a second link.
- **Quick search.** A dialog with the only shadow on the site; the option chosen takes `--accent-soft`.

## Page by page

- **Home.** A head: the `h1`, the large search field, the line of counts, and "Browse by language": the twelve languages with the most items (from `meta.top`) and "All projects". Then "Start here": the twelve lists with the most stars that could be read, as cards, four across at 1280px, and "All 671 lists". Then "Named by the most lists": eight rows with topics and a link to those named by two or more. Last, "All lists by category": rail and content, the rail the 26 categories with their counts (sticky), the content each category as an `h3` with its lists in columns of names.
- **`/lists`.** Rail of facets; `h1`, the filter field, chips of what is on, the sort line, list rows, the pager.
- **A list.** The head, in two columns at 56rem and wider: at the left the breadcrumb, the name, `owner/repo`, our summary at `--f-lg`, "See also" and the three lists most like it, two buttons (read the original, primary; suggest a change); at the right (`--side`) the facts as lines. Then rail (contents, sticky) and entries: a sticky filter bar with the one header row under its field, sections with a serif heading, a count and a `#` that shows when pointed at or focused (always, on a touch screen). Three levels of heading: 22px over a hairline, 18px, 16px. After the entries, "Related lists" (up to six cards with the projects both name) and "More in {category}" (up to eight list rows, none already shown as related).
- **`/items`.** As `/lists`, with item rows. With exactly one filter and no search, the `h1` is the filter ("Go", "archived") with the count under it in muted text; the same on `/lists` for a licence or a status.
- **An item.** The wide shell. A breadcrumb (Lists › the list with the most stars that names it › its section path), the name with its owner dimmed, the primary button and the address, then two columns at 56rem and wider: at the left "In N lists" (each list's name, its size at the right, its section path under it), "Listed alongside" and "More from {owner}" (up to six of the owner's other projects, then a link to the owner); at the right (`--side`, sticky) the facts as lines, "Facts from GitHub as of…", and the topics as chips under an upper-case label. No `lang:`, `license:` or `status:` chips: the facts say and link the same.
- **An owner.** The login, the GitHub address, a muted line of how many lists they keep and how many of their projects lists name; then headings and rows.
- **Search.** Under the field, a line of jumps with counts (Lists 8 · Sections 10 · Items 1,234) to the three groups.
- **404.** A short column.
- **About.** Prose at `--f-lg`, 1.7, at most 44rem.

## On a phone

A phone is not the desktop page squeezed: what is beside the content on a wide screen is behind one tap on a narrow one, and the content starts sooner. Two widths matter: under 56rem the rails go, under 40rem the header and the heads are the phone's. Rows fold by their container (38rem).

- **Sheets, without script.** A rail (`.sheet`) is not shown under 56rem. A link to its id (`#_filters`, `#_contents`) shows it over the whole screen (`:target`), with a head that says what it is and a × that links away from it. Choosing a value or a section is following a link, so the sheet closes by itself; the browser's back closes it too. The page behind does not scroll (`html:has(.sheet:target)`). The ids begin with `_` so that no section of a list can have the same one.
- **Filters** (`/lists`, `/items`). The Filter button stands beside the search field, where the field's own button is on a wide screen (the keyboard's key submits the field). The filters that are on are a row of chips under it, each removed with a tap, scrolled sideways when they are many. In the sheet every value is a row 44px tall with its count.
- **A list.** The facts are a few lines of label and value, not a grid; the two actions are text links on one line; the bar that stays at the top is one row: the filter field, with "N of M" inside it once something is typed, and Contents, which opens the sheet of sections. Collapse all is left out: the sheet does its work. The first entries are on the first screen.
- **Home.** The search field first; the line of languages scrolls sideways on one line. Six cards, one across, then "All 671 lists". Each category is a `<details>`: 26 rows of name and count, each with a muted second line naming its three lists with the most stars (`.peek`), opened in place to the names of its lists in two columns. On a wide screen the same `<details>` are all shown open by the stylesheet (`::details-content`), so the server sends one page; a wide browser without that pseudo-element shows the folded rows, which still work.
- **Row.** Two lines, about 62px: the name (16px) with the stars at the right; under it, in `--f-sm`, the owner · language · "in N lists" · year, then the state's box. The row is a wrapping flex box; `.main`, `.who` and `.nums` are `display: contents` and the cells are ordered, a zero-height `::after` breaking the line; an empty cell is not shown and every other cell after the first has a `·` before it. The Lists cell holds both forms (`.short`, the number, on a wide screen; `.long`, "in 2 lists", here). No chips: the item page has them. Eleven or twelve rows a screen instead of seven.
- **List row.** The name, `owner/repo`, the category, our summary, then one line of items, stars and year.
- **A list's head.** One column: the facts as a few lines of label and value after the two actions.
- **An item.** One column: breadcrumb, name, button, the state's sentence, facts, topics, In N lists, Listed alongside, More from the owner, attribution.
- **Listings.** The sort line is one line that scrolls sideways.
- **Header.** Two rows, 100px: the mark and name with the search field beside them; then Lists, Items and About as three equal tabs, which fit in every language at 320px. A tap on the field opens quick search (there is no key to press), and a tap beside the dialog closes it. The bar that offers another language is one line, 36px, fixed at the foot of the window (`position: fixed`, appended to `<body>`), so showing it moves nothing on the page.
- **Touch.** A field, a button, a tab, a row's name, a value in a sheet, a link of the footer: 44px. Fields are 16px so iOS does not zoom. The chips inside a row are 26px, on purpose: they are a second way to the same filters, and three targets of 44px would crowd the name. Links inside a sentence are as tall as their line.
- **Edges.** `viewport-fit=cover`, and the gutters are at least the safe-area insets (`--gl`, `--gr`); a sheet and the footer add the bottom inset.

## What changed in the markup, and why

- `layout.ts`: `viewport-fit=cover`; the header's search field is left out on the home and search pages, which have their own; the header has the mark, marks the current section and puts the navigation before the search; the footer is two columns with the section links; `theme-color` follows the new dark paper.
- `components.ts`: a row's name, owner and state are wrapped in `.who`, so the chips can move to a second line in a narrow container; a chip's namespace is a `.ns` span; the count and the sort words of the sort line are in `.total` and `.sorts`; the pager's links and the search button are buttons. A row's three numbers are in `.nums`; `sheetHead` is the head of a rail when it is a sheet.
- `home.ts`: the head is a `<header>`; the categories have a contents rail (the word is the list page's "Contents"); each category is a `<details>` with its `h2` in the `<summary>` and the category's id on it.
- `list.ts`: the two actions are buttons; the facts follow the summary inside the head; the contents rail is the one copy of the contents (the `<details>` copy is gone) and is a sheet with a head; the filter field and its count are in `.filter-field`; a Contents link opens the sheet.
- `item.ts`: a listing's section path is on its own line.
- `lists.ts`, `items.ts`: the × of a removable chip is its own span.
- `search.ts`: a section found is a row of two columns (`.section-row`).

No new words: every label is a message that already existed. One test changed with the markup: the pattern for a chip in `test/site/i18n.test.ts` allows the space that taking the tags out leaves after the namespace. The hooks of the scripts are as they were: `#list-filter`, `#list-count`, `#entries` with `li.row`, `section` and `data-depth`, `#collapse-all`, `body.collapsed`, `header.top`, `.top-search input`, `nav.langs a[hreflang]`, `dialog#quick` and its ids.

## Weight

`site.css` is about 34 KB, about 8 KB compressed (over the 32 KB the design aimed at: the cards, the header row, the item page's grid and the phone row's flex form); no font, no image but the icons, no new script. The row's two-line form uses a container query, the palette `light-dark()`, the primary button's hover `color-mix()`: all in the browsers the site already needed for `light-dark()`.
