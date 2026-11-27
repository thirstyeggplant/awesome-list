# awesome-list

A free library of every awesome list and everything in them.

People keep hundreds of curated "awesome" lists on GitHub, each a readme of links on one subject. This project reads all of them and turns them into one dataset: the lists, the sections inside them, the things they name, and every place a list names a thing, with current facts about each GitHub repository. A thing named by seven lists is one entry that knows all seven.

The site is live at **[weeklymatcha.com](https://weeklymatcha.com)**: every list, section and item, in ten languages. This repository holds the data pipeline and the site.

Share: [X](https://x.com/intent/post?text=Shelf%3A%20every%20awesome%20list%20and%20everything%20in%20them&url=https%3A%2F%2Fweeklymatcha.com%2F) · [Bluesky](https://bsky.app/intent/compose?text=Shelf%3A%20every%20awesome%20list%20and%20everything%20in%20them%20https%3A%2F%2Fweeklymatcha.com%2F) · [LinkedIn](https://www.linkedin.com/sharing/share-offsite/?url=https%3A%2F%2Fweeklymatcha.com%2F) · [Reddit](https://www.reddit.com/submit?url=https%3A%2F%2Fweeklymatcha.com%2F&title=Shelf%3A%20every%20awesome%20list%20and%20everything%20in%20them) · [Hacker News](https://news.ycombinator.com/submitlink?u=https%3A%2F%2Fweeklymatcha.com%2F&t=Shelf%3A%20every%20awesome%20list%20and%20everything%20in%20them)

## What the pipeline does

1. Gets the lists to read from a source. The first source is the index of lists at github.com/sindresorhus/awesome; more sources can be added later.
2. Looks up each list's repository on GitHub, to find its readme and the commit it is at.
3. Downloads the readme from raw.githubusercontent.com and keeps it in `.cache/`, so a second run downloads only what changed.
4. Parses the Markdown into a tree and reads the entries out of it: bullets, tables, a heading per entry, or a line per entry.
5. Gives every address one canonical form, so the same project named by different lists becomes one item.
6. Looks up every GitHub repository the lists name (stars, last push, archived, licence, language, topics, renames) and writes the dataset with a coverage report.

## Running it

You need Node 22 or later, pnpm, and a GitHub token: `GITHUB_TOKEN` in the environment, or a signed-in `gh` command line.

```sh
pnpm install
pnpm build-data --limit 30      # a quick try with the first 30 lists
pnpm build-data                 # every list
```

Options: `--limit N` reads the first N lists, `--only owner/repo` reads one list, `--no-enrich` skips looking up the repositories the lists name, `--offline` uses only what is in `.cache/`, `--out DIR` writes somewhere other than `out/`, and `--floor N` stops the run if fewer than N GraphQL points are left (1,500 unless told). A full run spends roughly 600 of the 5,000 points an hour a token has, and takes about an hour, most of it waiting on GitHub.

`pnpm check` runs the type checker, the linter and the tests. The tests never use the network.

## What it writes

Into `out/`: `lists.jsonl`, `items.jsonl` and `listings.jsonl`, a coverage report (`coverage.md`, `coverage.json`) and `run.json`. The fields are described in [docs/data.md](docs/data.md).

Every item links back to each list that named it. The descriptions shown on the site are our own wording, not copied from the lists, so the published files leave the lists' descriptions out. They are kept in `out/private/` only to write our own summaries from and to notice when the original changes. Our one-line summary of each list is in `summaries/lists.json`, and `pnpm check-summaries` says which are missing, which are out of date, and which repeat the original's words.

## Leaving a list out

If you maintain a list and would rather it was not included, open an issue in this repository. We will add a file `overrides/<owner>/<repo>.json` with a `skip` reason, and the next run will not read it.

## Not built yet

- publishing the data every night
- our own summaries of items (lists have theirs, in `summaries/lists.json`)
- lists from sources other than the one index, up to about ten thousand
- readmes that are not Markdown, and lists spread over several files

## Licence

The code is under the MIT licence. The lists belong to their curators.
