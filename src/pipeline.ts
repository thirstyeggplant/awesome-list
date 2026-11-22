// From a source of lists to the rows of the dataset: look the lists up, read
// each readme, parse it, make every address canonical, and look up the
// repositories the lists name.
import { canonicalUrl } from './canonical.js';
import { keyOf, type GitHub, type RepoInfo, type RepoLookup } from './fetch/github.js';
import { pickReadme } from './fetch/readme.js';
import {
  ItemRow, ListingRow, ListRow, type ItemKind, type ListRef, type Override, type RepoMeta, type RepoStatus,
} from './model.js';
import { choose, LOW_SHARE, type Choice } from './parse/index.js';
import type { ReadmeReader, Source } from './sources/index-list.js';
import { summaryOf, type Summaries } from './summaries.js';

/** Reads one file of a repository at a commit; null when it is not there. */
export interface Files {
  read(owner: string, repo: string, commit: string, path: string): Promise<string | null>;
}

export interface PipelineDeps {
  source: Source;
  github: GitHub;
  files: Files;
  /** The override for a list, by its lower-case owner/repo. */
  override: (id: string) => Override | undefined;
  /** Our own summaries of lists, by list id. */
  summaries: Summaries;
  now: () => Date;
  log: (line: string) => void;
}

export interface PipelineOptions {
  limit?: number;
  only?: string;
  enrich: boolean;
  /** How many readmes are downloaded at once. */
  concurrency?: number;
}

export interface RunInfo {
  started: string;
  finished: string;
  pointsSpent: number;
  counts: { lists: number; items: number; listings: number };
}

export interface Dataset {
  lists: ListRow[];
  items: ItemRow[];
  listings: ListingRow[];
  run: RunInfo;
}

/** A repository that has not been pushed to for this long is quiet. */
const QUIET_AFTER_MS = 2 * 365.25 * 24 * 60 * 60 * 1000;

export function repoStatusOf(info: RepoInfo, now: Date): RepoStatus {
  if (info.archived) return 'archived';
  if (info.pushedAt === null) return 'quiet';
  return now.getTime() - Date.parse(info.pushedAt) > QUIET_AFTER_MS ? 'quiet' : 'active';
}

/** Reads the root readme of any repository, through the same client and cache. */
export function rootReadmeReader(github: GitHub, files: Files): ReadmeReader {
  return async (owner, repo) => {
    const found = (await github.lookup([{ owner, repo }], { withTree: true })).get(keyOf({ owner, repo }));
    if (found?.kind !== 'found' || found.info.headOid === null) return null;
    const readme = pickReadme(found.info.rootEntries ?? []);
    if (!readme?.markdown) return null;
    return files.read(owner, repo, found.info.headOid, readme.path);
  };
}

async function mapPool<T, R>(inputs: readonly T[], size: number, fn: (input: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array<R>(inputs.length);
  let next = 0;
  const worker = async (): Promise<void> => {
    while (next < inputs.length) {
      const i = next;
      next += 1;
      out[i] = await fn(inputs[i] as T);
    }
  };
  await Promise.all(Array.from({ length: Math.min(size, inputs.length) }, worker));
  return out;
}

interface Found {
  url: string;
  id: string;
  kind: ItemKind;
  host: string;
}

interface ListOutcome {
  row: ListRow;
  listings: (Omit<ListingRow, 'itemId'> & { found: Found })[];
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function readList(
  ref: ListRef,
  lookup: RepoLookup | undefined,
  deps: PipelineDeps,
): Promise<ListOutcome> {
  const askedAs = `${ref.owner}/${ref.repo}`;
  const row: ListRow = {
    id: askedAs.toLowerCase(),
    askedAs,
    category: ref.category,
    subcategory: ref.subcategory,
    nameInIndex: ref.nameInIndex,
    sourceDescription: ref.sourceDescription,
    summary: null,
    summaryStale: false,
    stars: null,
    pushedAt: null,
    archived: null,
    license: null,
    readmePath: null,
    readmeOid: null,
    parser: null,
    parserReason: null,
    status: 'unparsed',
    linksSeen: 0,
    linksUsed: 0,
    itemsMade: 0,
  };
  const unparsed = (reason: string): ListOutcome => ({ row: { ...row, status: 'unparsed', reason }, listings: [] });

  if (lookup === undefined || lookup.kind === 'failed') {
    return unparsed(`could not look the repository up: ${lookup?.message ?? 'no answer'}`);
  }
  if (lookup.kind === 'gone') {
    return { row: { ...row, status: 'gone', reason: 'GitHub has no repository by this name' }, listings: [] };
  }

  const { info } = lookup;
  Object.assign(row, {
    id: info.nameWithOwner.toLowerCase(),
    stars: info.stars,
    pushedAt: info.pushedAt,
    archived: info.archived,
    license: info.license,
  });

  const override = deps.override(row.askedAs.toLowerCase()) ?? deps.override(row.id);
  if (override?.skip !== undefined) return unparsed(`left out on request: ${override.skip}`);
  if (info.headOid === null) return unparsed('the repository is empty');
  row.readmeOid = info.headOid;

  let paths: string[];
  if (override?.files) {
    paths = override.files;
    row.readmePath = paths.join(', ');
  } else {
    const readme = pickReadme(info.rootEntries ?? []);
    if (readme === null) return unparsed('no readme at the root of the repository');
    row.readmePath = readme.path;
    if (!readme.markdown) return unparsed(`the readme is ${readme.path}, which is not Markdown`);
    paths = [readme.path];
  }

  const [owner = ref.owner, repo = ref.repo] = info.nameWithOwner.split('/');
  const texts: string[] = [];
  for (const path of paths) {
    let text: string | null;
    try {
      text = await deps.files.read(owner, repo, info.headOid, path);
    } catch (error) {
      return unparsed(`could not download ${path}: ${message(error)}`);
    }
    if (text === null) return unparsed(`${path} is not in the repository`);
    texts.push(text);
  }

  let choice: Choice;
  try {
    choice = choose(texts.join('\n\n'), override?.parser);
  } catch (error) {
    return unparsed(`the parser failed: ${message(error)}`);
  }
  row.parser = choice.parser;
  row.parserReason = choice.reason;
  row.linksSeen = choice.result.linksSeen;

  const listings: ListOutcome['listings'] = [];
  for (const item of choice.result.items) {
    const c = canonicalUrl(item.url);
    if (c === null) continue;
    const listing: ListOutcome['listings'][number] = {
      listId: row.id,
      section: item.section,
      name: item.name,
      sourceDescription: item.sourceDescription,
      summary: null,
      extraLinks: item.extraLinks,
      position: listings.length,
      found: { url: item.url, ...c },
    };
    if (item.parentName !== undefined) listing.parentName = item.parentName;
    listings.push(listing);
  }
  row.itemsMade = listings.length;
  row.linksUsed = Math.min(row.linksSeen, listings.reduce((n, l) => n + 1 + l.extraLinks.length, 0));

  if (listings.length === 0) {
    return { row: { ...row, status: 'unparsed', reason: `no items found among ${row.linksSeen} links` }, listings };
  }
  const share = row.linksSeen === 0 ? 1 : listings.length / row.linksSeen;
  if (share < LOW_SHARE) {
    row.status = 'partial';
    row.reason = `${listings.length} items from ${row.linksSeen} links`;
  } else {
    row.status = 'ok';
  }
  return { row, listings };
}

function pickRefs(refs: ListRef[], options: PipelineOptions): ListRef[] {
  let picked = refs;
  if (options.only !== undefined) {
    const want = options.only.toLowerCase();
    picked = picked.filter((r) => `${r.owner}/${r.repo}`.toLowerCase() === want);
    if (picked.length === 0) {
      const [owner = '', repo = ''] = options.only.split('/');
      picked = [{ owner, repo, category: null, subcategory: null, nameInIndex: null, sourceDescription: null }];
    }
  }
  if (options.limit !== undefined) picked = picked.slice(0, options.limit);
  return picked;
}

export async function buildDataset(deps: PipelineDeps, options: PipelineOptions): Promise<Dataset> {
  const started = deps.now();
  const refs = pickRefs(await deps.source(), options);
  deps.log(`${refs.length} lists to read`);

  const lookups = await deps.github.lookup(refs.map((r) => ({ owner: r.owner, repo: r.repo })), { withTree: true });
  deps.log(`looked up ${lookups.size} list repositories`);

  let done = 0;
  const outcomes = await mapPool(refs, options.concurrency ?? 8, async (ref) => {
    const outcome = await readList(ref, lookups.get(keyOf(ref)), deps);
    done += 1;
    if (done % 50 === 0) deps.log(`read ${done} of ${refs.length} lists`);
    return outcome;
  });

  // Two names in the source can lead to one repository after a rename: keep the first.
  const byId = new Map<string, ListOutcome>();
  for (const o of outcomes) if (!byId.has(o.row.id)) byId.set(o.row.id, o);
  const kept = [...byId.values()];

  // Look up every repository the lists name.
  const repoIds = new Set<string>();
  for (const o of kept) for (const l of o.listings) if (l.found.kind === 'repo') repoIds.add(l.found.id);
  const meta = new Map<string, { id: string; repo?: RepoMeta }>();
  if (options.enrich && repoIds.size > 0) {
    const names = [...repoIds].sort().map((id) => {
      const [owner = '', repo = ''] = id.slice('https://github.com/'.length).split('/');
      return { owner, repo };
    });
    deps.log(`looking up ${names.length} repositories named by the lists`);
    const answers = await deps.github.lookup(names, { withTree: false });
    const now = deps.now();
    for (const name of names) {
      const asked = `https://github.com/${keyOf(name)}`;
      const answer = answers.get(keyOf(name));
      if (answer?.kind === 'found') {
        const info = answer.info;
        const repo: RepoMeta = {
          nameWithOwner: info.nameWithOwner,
          stars: info.stars,
          pushedAt: info.pushedAt,
          archived: info.archived,
          fork: info.fork,
          license: info.license,
          language: info.language,
          topics: info.topics,
          sourceDescription: info.description,
          status: repoStatusOf(info, now),
        };
        const id = `https://github.com/${info.nameWithOwner.toLowerCase()}`;
        if (id !== asked) repo.renamedFrom = `${name.owner}/${name.repo}`;
        meta.set(asked, { id, repo });
      } else if (answer?.kind === 'gone') {
        meta.set(asked, {
          id: asked,
          repo: {
            nameWithOwner: `${name.owner}/${name.repo}`, stars: null, pushedAt: null, archived: null, fork: null,
            license: null, language: null, topics: [], sourceDescription: null, status: 'gone',
          },
        });
      }
    }
  }

  const items = new Map<string, ItemRow & { lists: Set<string> }>();
  const listings: ListingRow[] = [];
  for (const o of kept) {
    for (const l of o.listings) {
      const { found, ...rest } = l;
      const enriched = found.kind === 'repo' ? meta.get(found.id) : undefined;
      const itemId = enriched?.id ?? found.id;
      let item = items.get(itemId);
      if (!item) {
        item = { id: itemId, kind: found.kind, host: found.host, listCount: 0, lists: new Set() };
        if (enriched?.repo) item.repo = enriched.repo;
        items.set(itemId, item);
      }
      item.lists.add(rest.listId);
      listings.push(ListingRow.parse({ itemId, ...rest }));
    }
  }

  const itemRows = [...items.values()]
    .map(({ lists, ...item }) => ItemRow.parse({ ...item, listCount: lists.size }))
    .sort((a, b) => compare(a.id, b.id));
  const listRows = kept
    .map((o) => {
      const { summary, stale } = summaryOf(deps.summaries, o.row.id, o.row.sourceDescription);
      return ListRow.parse({ ...o.row, summary, summaryStale: stale });
    }).sort((a, b) => compare(a.id, b.id));
  listings.sort((a, b) => compare(a.listId, b.listId) || a.position - b.position);

  return {
    lists: listRows,
    items: itemRows,
    listings,
    run: {
      started: started.toISOString(),
      finished: deps.now().toISOString(),
      pointsSpent: deps.github.pointsSpent,
      counts: { lists: listRows.length, items: itemRows.length, listings: listings.length },
    },
  };
}

function compare(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
