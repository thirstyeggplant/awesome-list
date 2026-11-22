# The data

`pnpm build-data` writes these files into `out/` (or the folder given with `--out`). Each `.jsonl` file holds one JSON object per line, sorted so that two runs can be compared line by line: lists and items by `id`, listings by `listId` and then `position`.

| File | What it holds |
| --- | --- |
| `lists.jsonl` | one row per list |
| `items.jsonl` | one row per distinct thing the lists name |
| `listings.jsonl` | one row for each time a list names an item |
| `private/*.jsonl` | the same three files, with the `sourceDescription` fields kept |
| `coverage.md`, `coverage.json` | how much of each list was read, totals, and how many lists have a summary, have none, or have a stale one |
| `run.json` | when the run started and finished, the GraphQL points it spent, and the counts |

The files at the top of `out/` are the ones meant to be published. They leave out every `sourceDescription`: those are the words of the lists' curators and of repository owners, kept in `private/` only so that we can write our own summaries from them and notice when the original changes. Every row is checked against the schemas in `src/model.ts` before it is written.

## Lists

| Field | Meaning |
| --- | --- |
| `id` | `owner/repo` in lower case, as the repository is named now (after a rename, the new name) |
| `askedAs` | `owner/repo` as the source of lists wrote it |
| `category`, `subcategory` | where the source placed the list; `subcategory` is the parent entry for a list nested under another, else null |
| `nameInIndex` | the name the source gave the list |
| `sourceDescription` | the source's description of the list (private files only) |
| `summary` | our own one-sentence description of the list, from `summaries/lists.json`; null when there is none |
| `summaryStale` | true when the source's description of the list has changed since the summary was written, so the summary should be read again; false when there is no summary |
| `stars`, `pushedAt`, `archived`, `license` | from GitHub; `license` is an SPDX identifier or null |
| `readmePath` | the file that was read, at the root of the repository |
| `readmeOid` | the commit it was read at |
| `parser` | which parser made the items: `bullets`, `table`, `headings` or `paragraphs` |
| `parserReason` | why that parser was used |
| `status` | `ok`, `partial` (items were made from under 30% of the links seen), `unparsed` (no items; `reason` says why) or `gone` (GitHub has no repository by that name) |
| `reason` | present when the status needs explaining |
| `linksSeen` | http(s) links in the readme outside the contents, contributing, licence and footnote sections, badges left out, links in raw HTML counted |
| `linksUsed` | of those, how many became an item or an extra link of one |
| `itemsMade` | how many listings the list gave |

## Items

| Field | Meaning |
| --- | --- |
| `id` | the canonical address (see below) |
| `kind` | `repo`, `package`, `video`, `paper`, `article` or `site`, told from the host |
| `host` | the host in lower case, without `www.` |
| `repo` | for a GitHub repository that was looked up: `nameWithOwner`, `stars`, `pushedAt`, `archived`, `fork`, `license`, `language`, `topics` (at most ten), `status` and, after a rename, `renamedFrom`; the private file also has the repository's own `sourceDescription` |
| `listCount` | how many different lists name it |

A repository's `status` is `archived` if it is archived, `quiet` if nothing was pushed to it in two years, `gone` if GitHub has no repository by that name, and `active` otherwise. When a repository was renamed, the item takes the new name and `renamedFrom` keeps the one the lists used, so a list that uses the old name and one that uses the new name point at one item.

### The canonical address

The host is lower-cased and loses `www.`; a trailing slash, a `.git` ending, a `#readme` fragment and any `utm_*` parameter are removed. The root of a GitHub repository becomes `https://github.com/owner/repo`, all in lower case. Nothing else about an address is changed: the path keeps its case, and `http` stays `http`.

## Listings

| Field | Meaning |
| --- | --- |
| `itemId` | the item |
| `listId` | the list that names it; every listing links back to its list |
| `section` | the headings above the entry, outermost first, without the document's title; a bullet without a link that holds others adds its words here |
| `name` | the name the list gives it |
| `sourceDescription` | the words that follow the name in the list (private files only) |
| `summary` | our own description; null for now |
| `extraLinks` | other links in the same entry, such as a demo or the source code, each `{ text, url }` as written |
| `position` | the order of the entry in its list, from 0 |
| `parentName` | when the entry is nested under another entry, that entry's name |

A list may name the same item more than once, in different sections; each is a listing.

## Our summaries of lists

`summaries/lists.json` is kept in the repository, by hand. It holds one entry per list, keyed by the list's `id` and sorted by it:

```json
{ "owner/repo": { "summary": "Libraries, tools and learning material for the Go programming language.", "sourceHash": "0123456789ab" } }
```

`summary` is one sentence in our own words, at most 18 words, saying what a reader finds in the list and on what subject. `sourceHash` is the first 12 hex characters of the SHA-256 of the source's description of the list as it was when the summary was written, or `''` when the source gave none. The file never holds the source's words; the hash is only there so that a run can tell they changed. A missing file means no summaries. `src/summaries.ts` reads it, and a run sets `summary` and `summaryStale` on each list from it.

`pnpm check-summaries` compares the file with the last run's `out/private/lists.jsonl` and names, by id only, every list without a summary, every stale summary, and every summary that shares five or more words in a row with the source's description. The tests check that every summary is one sentence ending with a full stop, at most 18 words, without emoji or words such as "awesome", "curated" or "best".

## How a list is read

The default parser, `bullets`, makes an item of every bullet that starts with a link to an http(s) address. Images, badges, emoji and bold or italic wrapping in front of the link are looked past. A bullet that starts with a short name and then a bare address (`Name - https://…`) is also an item; a bullet that is only an address is not. Relative links and anchors are never items.

When `bullets` makes fewer than five items, or items from fewer than 30% of the links seen, the other parsers are tried: `table` (a row of a table, named by its first link), `headings` (a heading with a link, described by the paragraph under it) and `paragraphs` (a paragraph or a line that starts with a link). One of them is taken only if it makes at least one and a half times as many items, and at least three more. A file in `overrides/` can name the parser instead.

Readmes in another markup (reStructuredText, Org, Textile and the like), repositories without a readme at the root, and lists whose entries live in other files are marked `unparsed` with the reason. They are not read yet.

## Overrides

`overrides/<owner>/<repo>.json` changes how one list is read:

```json
{ "parser": "table", "files": ["docs/list.md"], "skip": "why the list is left out", "note": "anything worth knowing" }
```

All fields are optional. `parser` names a parser. `files` reads these paths of the repository, in order, instead of its readme. `skip` leaves the list out: it is not downloaded, and it gets no listings.
