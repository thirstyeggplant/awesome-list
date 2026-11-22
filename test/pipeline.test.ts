import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { keyOf, type GitHub, type LookupOptions, type RepoInfo, type RepoLookup, type RepoName } from '../src/fetch/github.js';
import type { ListRef, Override } from '../src/model.js';
import { filesOf } from '../src/output.js';
import { buildDataset, type Files } from '../src/pipeline.js';
import { coverageOf } from '../src/report.js';
import { sourceHash, type Summaries } from '../src/summaries.js';

const fixture = (name: string): string => readFileSync(new URL(`fixtures/${name}`, import.meta.url), 'utf8');

function info(nameWithOwner: string, extra: Partial<RepoInfo> = {}): RepoInfo {
  return {
    nameWithOwner,
    stars: 10,
    pushedAt: '2026-06-01T00:00:00Z',
    archived: false,
    fork: false,
    license: 'CC0-1.0',
    language: null,
    topics: [],
    description: 'Words the owner wrote.',
    defaultBranch: 'main',
    headOid: 'c0ffee',
    rootEntries: [{ name: 'readme.md', type: 'blob' }],
    ...extra,
  };
}

/** A GitHub that knows a few made-up repositories and counts what it is asked. */
class StandIn implements GitHub {
  pointsSpent = 0;
  asked: RepoName[][] = [];
  withTree: boolean[] = [];
  constructor(private readonly known: Record<string, RepoLookup>) {}
  lookup(names: readonly RepoName[], options: LookupOptions): Promise<Map<string, RepoLookup>> {
    this.withTree.push(options.withTree);
    this.asked.push([...names]);
    this.pointsSpent += 1;
    return Promise.resolve(new Map(names.map((n) => [keyOf(n), this.known[keyOf(n)] ?? { kind: 'gone' }])));
  }
}

const ref = (owner: string, repo: string, category = 'Things'): ListRef => ({
  owner, repo, category, subcategory: null, nameInIndex: repo, sourceDescription: `About ${repo}.`,
});

function setup(overrides: Record<string, Override> = {}, summaries: Summaries = new Map()): { github: StandIn; deps: Parameters<typeof buildDataset>[0] } {
  const github = new StandIn({
    'example-owner/awesome-pocket': { kind: 'found', info: info('example-owner/awesome-pocket') },
    'example-owner/awesome-home': { kind: 'found', info: info('Example-Owner/Awesome-Home-Servers') },
    'example-owner/awesome-orgmode': { kind: 'found', info: info('example-owner/awesome-orgmode', { rootEntries: [{ name: 'README.org', type: 'blob' }] }) },
    'example-owner/awesome-empty': { kind: 'found', info: info('example-owner/awesome-empty', { rootEntries: [] }) },
    'example-owner/awesome-skip': { kind: 'found', info: info('example-owner/awesome-skip') },
    'example-owner/awesome-broken': { kind: 'found', info: info('example-owner/awesome-broken') },
    'example-owner/quillpad': { kind: 'found', info: info('example-owner/quillpad', { archived: true }) },
    'example-owner/slate-board': { kind: 'found', info: info('example-owner/slate-board', { pushedAt: '2020-01-01T00:00:00Z' }) },
    'example-owner/quill-spell': { kind: 'found', info: info('New-Owner/Quill-Spell') },
    'new-owner/quill-spell': { kind: 'found', info: info('New-Owner/Quill-Spell') },
  });
  const texts: Record<string, string> = {
    'example-owner/awesome-pocket': fixture('bullets.md'),
    'example-owner/awesome-home-servers': `${fixture('several-links.md')}\n- [Quill Spell](https://github.com/new-owner/quill-spell) - Named again.\n`,
    'example-owner/awesome-broken': '',
  };
  const files: Files = {
    read: (owner, repo) => Promise.resolve(texts[`${owner}/${repo}`.toLowerCase()] ?? null),
  };
  return {
    github,
    deps: {
      source: () => Promise.resolve([
        ref('example-owner', 'awesome-pocket'),
        ref('example-owner', 'awesome-home'),
        ref('example-owner', 'awesome-orgmode'),
        ref('example-owner', 'awesome-empty'),
        ref('example-owner', 'awesome-skip'),
        ref('example-owner', 'awesome-broken'),
        ref('example-owner', 'awesome-vanished'),
      ]),
      github,
      files,
      override: (id) => overrides[id],
      summaries,
      now: () => new Date('2026-11-01T00:00:00Z'),
      log: () => undefined,
    },
  };
}

describe('buildDataset', () => {
  it('reads every list, and says why when it cannot', async () => {
    const { deps } = setup({ 'example-owner/awesome-skip': { skip: 'the maintainer asked' } });
    const data = await buildDataset(deps, { enrich: true });
    const byId = Object.fromEntries(data.lists.map((l) => [l.id, l]));
    expect(byId['example-owner/awesome-pocket']).toMatchObject({ status: 'ok', parser: 'bullets', itemsMade: 6, linksSeen: 6, stars: 10 });
    expect(byId['example-owner/awesome-home-servers']).toMatchObject({ askedAs: 'example-owner/awesome-home', status: 'ok' });
    expect(byId['example-owner/awesome-orgmode']).toMatchObject({ status: 'unparsed', reason: 'the readme is README.org, which is not Markdown' });
    expect(byId['example-owner/awesome-empty']).toMatchObject({ status: 'unparsed', reason: 'no readme at the root of the repository' });
    expect(byId['example-owner/awesome-skip']).toMatchObject({ status: 'unparsed', reason: 'left out on request: the maintainer asked' });
    expect(byId['example-owner/awesome-broken']).toMatchObject({ status: 'unparsed', reason: 'no items found among 0 links' });
    expect(byId['example-owner/awesome-vanished']).toMatchObject({ status: 'gone' });
    expect(data.listings.filter((l) => l.listId === 'example-owner/awesome-skip')).toEqual([]);
  });

  it('makes one item of a repository named under an old and a new name, and counts its lists', async () => {
    const { deps } = setup();
    const data = await buildDataset(deps, { enrich: true });
    const spell = data.items.find((i) => i.id === 'https://github.com/new-owner/quill-spell');
    expect(spell).toMatchObject({ kind: 'repo', listCount: 2, repo: { status: 'active', renamedFrom: 'example-owner/quill-spell' } });
    expect(data.items.find((i) => i.id === 'https://github.com/example-owner/quill-spell')).toBeUndefined();
    expect(data.items.find((i) => i.id === 'https://github.com/example-owner/quillpad')?.repo?.status).toBe('archived');
    expect(data.items.find((i) => i.id === 'https://github.com/example-owner/slate-board')?.repo?.status).toBe('quiet');
    expect(data.items.find((i) => i.id === 'https://github.com/example-owner/pixel-barn')).toBeUndefined();
    expect(data.items.find((i) => i.id === 'https://example.org/turtle?lang=en')).toMatchObject({ kind: 'site', listCount: 1 });
  });

  it('keeps listings in list order, with positions and sections', async () => {
    const { deps } = setup();
    const data = await buildDataset(deps, { enrich: false });
    const pocket = data.listings.filter((l) => l.listId === 'example-owner/awesome-pocket');
    expect(pocket.map((l) => [l.position, l.name, l.section])).toEqual([
      [0, 'Quillpad', ['Editors']],
      [1, 'Inkwell', ['Editors']],
      [2, 'Slate Board', ['Editors']],
      [3, 'No Words', ['Editors']],
      [4, 'Quill Spell', ['Editors', 'Plugins']],
      [5, 'Turtle Shell', ['Shells']],
    ]);
    expect(data.items.every((i) => i.repo === undefined)).toBe(true);
  });

  it('asks GitHub only for the lists when not enriching, and in batches otherwise', async () => {
    const plain = setup();
    await buildDataset(plain.deps, { enrich: false });
    expect(plain.github.asked).toHaveLength(1);
    const rich = setup();
    await buildDataset(rich.deps, { enrich: true });
    expect(rich.github.asked).toHaveLength(2);
    expect(rich.github.withTree).toEqual([true, false]);
  });

  it('takes --only and --limit', async () => {
    const { deps } = setup();
    expect((await buildDataset(deps, { enrich: false, limit: 2 })).lists).toHaveLength(2);
    const only = await buildDataset(deps, { enrich: false, only: 'Example-Owner/Awesome-Pocket' });
    expect(only.lists.map((l) => l.id)).toEqual(['example-owner/awesome-pocket']);
  });

  it('sets our summary on a list by its current name, and marks it stale when the source changed', async () => {
    const summaries: Summaries = new Map([
      ['example-owner/awesome-pocket', { summary: 'Editors and shells for pockets.', sourceHash: sourceHash('About awesome-pocket.') }],
      ['example-owner/awesome-home-servers', { summary: 'Servers for a home.', sourceHash: sourceHash('Words from before.') }],
    ]);
    const data = await buildDataset(setup({}, summaries).deps, { enrich: false });
    const byId = Object.fromEntries(data.lists.map((l) => [l.id, l]));
    expect(byId['example-owner/awesome-pocket']).toMatchObject({ summary: 'Editors and shells for pockets.', summaryStale: false });
    expect(byId['example-owner/awesome-home-servers']).toMatchObject({ summary: 'Servers for a home.', summaryStale: true });
    expect(byId['example-owner/awesome-empty']).toMatchObject({ summary: null, summaryStale: false });
    expect(coverageOf(data).summaries).toEqual({ withSummary: 2, withoutSummary: 5, stale: 1 });
    const published = filesOf(data).get('lists.jsonl') ?? '';
    expect(published).toContain('Editors and shells for pockets.');
    expect(published).not.toContain('About awesome-pocket.');
  });

  it('gives the same files for the same input', async () => {
    const a = await buildDataset(setup().deps, { enrich: true });
    const b = await buildDataset(setup().deps, { enrich: true });
    const strip = (m: Map<string, string>): string[] =>
      [...m].filter(([path]) => !['run.json', 'coverage.md'].includes(path)).map(([path, text]) => `${path}\n${text}`);
    expect(strip(filesOf(a))).toEqual(strip(filesOf(b)));
  });
});

describe('outputs', () => {
  it('leaves every curator description out of the public files, and keeps it in private/', async () => {
    const data = await buildDataset(setup().deps, { enrich: true });
    const files = filesOf(data);
    for (const name of ['lists.jsonl', 'items.jsonl', 'listings.jsonl']) {
      const text = files.get(name) ?? '';
      expect(text.length).toBeGreaterThan(0);
      expect(text).not.toContain('sourceDescription');
      expect(text).not.toContain('Words the owner wrote.');
      expect(text).not.toContain('A tiny editor for notes.');
      expect(files.get(`private/${name}`)).toContain('sourceDescription');
    }
    expect(files.get('private/listings.jsonl')).toContain('A tiny editor for notes.');
    expect(files.get('private/items.jsonl')).toContain('Words the owner wrote.');
  });

  it('counts coverage by status, parser, kind and how many lists name an item', async () => {
    const data = await buildDataset(setup().deps, { enrich: true });
    const c = coverageOf(data);
    expect(c.listsByStatus).toEqual({ ok: 2, partial: 0, unparsed: 4, gone: 1 });
    expect(c.listsByParser.bullets).toBe(3);
    expect(c.itemsInLists.atLeast2).toBe(1);
    expect(c.repos.renamed).toBe(1);
    expect(c.repos.archived).toBe(1);
    expect(c.lists.find((l) => l.id === 'example-owner/awesome-pocket')?.share).toBe(1);
  });
});
