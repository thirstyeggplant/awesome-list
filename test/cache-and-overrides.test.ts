import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CachedGitHub } from '../src/fetch/cached-github.js';
import type { GitHub, RepoLookup } from '../src/fetch/github.js';
import { loadOverrides } from '../src/overrides.js';

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'awesome-list-test-'));
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('CachedGitHub', () => {
  it('writes down what it was told online and answers from that offline', async () => {
    const answer: RepoLookup = { kind: 'gone' };
    const inner: GitHub = {
      pointsSpent: 3,
      lookup: (names) => Promise.resolve(new Map(names.map((n) => [`${n.owner}/${n.repo}`, answer]))),
    };
    const online = new CachedGitHub(inner, dir);
    await online.lookup([{ owner: 'example-owner', repo: 'list' }], { withTree: true });
    expect(online.pointsSpent).toBe(3);

    const offline = new CachedGitHub(null, dir);
    const result = await offline.lookup(
      [{ owner: 'example-owner', repo: 'list' }, { owner: 'example-owner', repo: 'other' }],
      { withTree: true },
    );
    expect(result.get('example-owner/list')).toEqual({ kind: 'gone' });
    expect(result.get('example-owner/other')).toMatchObject({ kind: 'failed' });
    expect(offline.pointsSpent).toBe(0);
    expect((await offline.lookup([{ owner: 'example-owner', repo: 'list' }], { withTree: false })).get('example-owner/list'))
      .toMatchObject({ kind: 'failed' });
  });
});

describe('loadOverrides', () => {
  it('reads one file per list, by owner and repository', async () => {
    await mkdir(join(dir, 'Example-Owner'), { recursive: true });
    await writeFile(join(dir, 'Example-Owner', 'Awesome-Thing.json'), JSON.stringify({ parser: 'table' }));
    await writeFile(join(dir, 'Example-Owner', 'notes.txt'), 'not an override');
    const found = await loadOverrides(dir);
    expect([...found]).toEqual([['example-owner/awesome-thing', { parser: 'table' }]]);
  });

  it('refuses an override that names a parser that does not exist', async () => {
    await mkdir(join(dir, 'o'), { recursive: true });
    await writeFile(join(dir, 'o', 'r.json'), JSON.stringify({ parser: 'nonesuch' }));
    await expect(loadOverrides(dir)).rejects.toThrow(/does not exist/);
  });

  it('finds none when there is no folder', async () => {
    expect((await loadOverrides(join(dir, 'missing'))).size).toBe(0);
  });
});
