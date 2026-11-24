// A tiny made-up dataset, written as the public files of out/ into a temporary folder.
import { chmodSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildSite } from '../../src/site/build/cli.js';
import { Site } from '../../src/site/router.js';

const DAY = '2026-06-01T00:00:00Z';

function list(id: string, category: string, extra: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id, askedAs: id, category, subcategory: null, nameInIndex: id.split('/')[1], summary: `Things about ${id}.`,
    summaryStale: false, stars: 100, pushedAt: DAY, archived: false, license: 'MIT', readmePath: 'README.md',
    readmeOid: 'abcdef0123456789', parser: 'bullets', parserReason: 'default', status: 'ok', linksSeen: 10,
    linksUsed: 10, itemsMade: 0, ...extra,
  };
}

function repo(nameWithOwner: string, extra: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    nameWithOwner, stars: 10, pushedAt: DAY, archived: false, fork: false, license: 'MIT', language: 'Go',
    topics: [], status: 'active', ...extra,
  };
}

export interface Fixture {
  dir: string;
  dbPath: string;
}

const LANGS = ['Go', 'Rust', 'C++', null] as const;
const LICENSES = ['MIT', 'Apache-2.0', null] as const;
const TOPICS = ['cli', 'web', 'db'] as const;
const STATUSES = ['active', 'quiet', 'archived', 'gone'] as const;

export function fixtureRows(): { lists: Record<string, unknown>[]; items: Record<string, unknown>[]; listings: Record<string, unknown>[] } {
  const lists = [
    list('sindresorhus/awesome', 'Miscellaneous', { stars: 9000, nameInIndex: 'Awesome' }),
    list('alpha/awesome-widgets', 'Languages', { stars: 500, nameInIndex: 'Widgets' }),
    list('beta/awesome-gadgets', 'Tools', { stars: 300, askedAs: 'beta/old-gadgets', nameInIndex: 'Gadgets', license: null }),
    list('gamma/awesome-broken', 'Tools', { stars: 50, status: 'unparsed', reason: 'the readme is in reStructuredText' }),
    list('delta/awesome-hostile', 'Tools', { stars: 20, nameInIndex: '<script>alert(1)</script>', summary: 'A list with "quotes" & <b>tags</b>.' }),
  ];
  const items: Record<string, unknown>[] = [
    { id: 'https://github.com/alpha/awesome-widgets', kind: 'repo', host: 'github.com', repo: repo('alpha/awesome-widgets', { stars: 500 }), listCount: 1 },
    { id: 'https://github.com/beta/awesome-gadgets', kind: 'repo', host: 'github.com', repo: repo('beta/awesome-gadgets', { stars: 300 }), listCount: 1 },
    { id: 'https://github.com/gamma/awesome-broken', kind: 'repo', host: 'github.com', repo: repo('gamma/awesome-broken'), listCount: 1 },
    { id: 'https://github.com/delta/awesome-hostile', kind: 'repo', host: 'github.com', repo: repo('delta/awesome-hostile'), listCount: 1 },
    {
      id: 'https://github.com/acme/rocket', kind: 'repo', host: 'github.com',
      repo: repo('Acme/Rocket', { stars: 5000, topics: ['cli'], renamedFrom: 'acme/old-rocket' }), listCount: 2,
    },
    { id: 'https://example.com/hostile', kind: 'site', host: 'example.com', listCount: 2 },
    { id: 'https://example.com/cpp-tool', kind: 'site', host: 'example.com', listCount: 1 },
    { id: 'https://example.com/c-tool', kind: 'site', host: 'example.com', listCount: 1 },
    { id: 'https://arxiv.org/abs/0000.00001', kind: 'paper', host: 'arxiv.org', listCount: 1 },
  ];
  for (let i = 0; i < 40; i++) {
    const lang = LANGS[i % 4] ?? null;
    items.push({
      id: `https://github.com/own${i % 5}/proj${i}`,
      kind: 'repo',
      host: 'github.com',
      repo: repo(`own${i % 5}/proj${i}`, {
        stars: (i * 337) % 12000,
        language: lang,
        license: LICENSES[i % 3] ?? null,
        topics: TOPICS.filter((_, k) => (i >> k) & 1),
        status: STATUSES[i % 4],
        archived: STATUSES[i % 4] === 'archived',
      }),
      listCount: 1 + (i % 3 === 0 ? 1 : 0),
    });
  }

  const listings: Record<string, unknown>[] = [];
  const add = (listId: string, itemId: string, section: string[], name: string, more: Record<string, unknown> = {}): void => {
    const position = listings.filter((l) => l.listId === listId).length;
    listings.push({ itemId, listId, section, name, summary: null, extraLinks: [], position, ...more });
  };
  // The index: categories in this order, then the lists.
  add('sindresorhus/awesome', 'https://github.com/alpha/awesome-widgets', ['Languages'], 'Widgets');
  add('sindresorhus/awesome', 'https://github.com/beta/awesome-gadgets', ['Tools'], 'Gadgets');
  add('sindresorhus/awesome', 'https://github.com/gamma/awesome-broken', ['Tools'], 'Broken');
  add('sindresorhus/awesome', 'https://github.com/delta/awesome-hostile', ['Tools'], 'Hostile');
  // Widgets.
  add('alpha/awesome-widgets', 'https://github.com/acme/rocket', ['Launchers'], 'Rocket');
  add('alpha/awesome-widgets', 'https://example.com/hostile', ['Launchers', 'Odd ones'], '<img src=x onerror=alert(1)>', {
    extraLinks: [{ text: 'demo', url: 'javascript:alert(1)' }, { text: 'source', url: 'https://example.com/source' }],
  });
  add('alpha/awesome-widgets', 'https://example.com/cpp-tool', ['Languages'], 'c++ tool');
  add('alpha/awesome-widgets', 'https://example.com/c-tool', ['Languages'], 'c tool');
  add('alpha/awesome-widgets', 'https://arxiv.org/abs/0000.00001', ['Papers'], 'A paper about rockets');
  for (let i = 0; i < 40; i++) {
    const listId = i % 2 === 0 ? 'alpha/awesome-widgets' : 'beta/awesome-gadgets';
    add(listId, `https://github.com/own${i % 5}/proj${i}`, ['Projects', `Group ${i % 4}`], `Project ${i}`, i === 7 ? { parentName: 'Project 5' } : {});
    if (i % 3 === 0) {
      const other = listId === 'alpha/awesome-widgets' ? 'beta/awesome-gadgets' : 'alpha/awesome-widgets';
      add(other, `https://github.com/own${i % 5}/proj${i}`, ['More'], `proj${i}`);
    }
  }
  add('beta/awesome-gadgets', 'https://github.com/acme/rocket', ['Rocketry'], 'rocket');
  add('delta/awesome-hostile', 'https://example.com/hostile', ['"><script>x</script>'], 'Hostile');
  for (const l of lists) l.itemsMade = listings.filter((x) => x.listId === l.id).length;
  return { lists, items, listings };
}

const jsonl = (rows: readonly unknown[]): string => rows.map((r) => JSON.stringify(r)).join('\n') + '\n';

/** Writes the files, with an unreadable private/ beside them, and builds the database. */
export async function makeFixture(): Promise<Fixture> {
  const dir = mkdtempSync(join(tmpdir(), 'site-test-'));
  const rows = fixtureRows();
  writeFileSync(join(dir, 'lists.jsonl'), jsonl(rows.lists));
  writeFileSync(join(dir, 'items.jsonl'), jsonl(rows.items));
  writeFileSync(join(dir, 'listings.jsonl'), jsonl(rows.listings));
  writeFileSync(join(dir, 'run.json'), JSON.stringify({ started: DAY, finished: '2026-06-02T12:00:00Z', counts: {} }));
  // The build must never open private/: make it unreadable.
  mkdirSync(join(dir, 'private'));
  writeFileSync(join(dir, 'private', 'lists.jsonl'), 'not json\n');
  chmodSync(join(dir, 'private'), 0o000);
  const dbPath = join(dir, 'site.db');
  await buildSite({ inDir: dir, dbPath });
  return { dir, dbPath };
}

export function siteOf(f: Fixture, options: { sitemapChunk?: number } = {}): Site {
  return new Site({ dbPath: f.dbPath, origin: 'https://example.test', ...options });
}

export function restore(f: Fixture): void {
  chmodSync(join(f.dir, 'private'), 0o755);
}
