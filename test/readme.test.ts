import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FileStore, NotCached, pickReadme, type Download } from '../src/fetch/readme.js';

describe('pickReadme', () => {
  const blob = (name: string): { name: string; type: string } => ({ name, type: 'blob' });

  it('prefers Markdown, whatever the case of the name', () => {
    expect(pickReadme([blob('license'), blob('README.rst'), blob('Readme.MD')])).toEqual({ path: 'Readme.MD', markdown: true });
    expect(pickReadme([blob('readme')])).toEqual({ path: 'readme', markdown: true });
  });

  it('names a readme in another markup, to be marked unparsed', () => {
    expect(pickReadme([blob('README.org')])).toEqual({ path: 'README.org', markdown: false });
  });

  it('finds nothing when there is no readme file', () => {
    expect(pickReadme([blob('index.md'), { name: 'README.md', type: 'tree' }])).toBeNull();
  });
});

describe('FileStore', () => {
  let dir: string;
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'awesome-list-test-'));
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('downloads a file at a commit once, then reads it from the cache', async () => {
    const asked: string[] = [];
    const download: Download = (url) => {
      asked.push(url);
      return Promise.resolve({ status: 200, text: '# Made up' });
    };
    const store = new FileStore({ cacheDir: dir, download, offline: false });
    expect(await store.read('example-owner', 'list', 'c0ffee', 'README.md')).toBe('# Made up');
    expect(await store.read('example-owner', 'list', 'c0ffee', 'README.md')).toBe('# Made up');
    expect(asked).toEqual(['https://raw.githubusercontent.com/example-owner/list/c0ffee/README.md']);

    const offline = new FileStore({ cacheDir: dir, download, offline: true });
    expect(await offline.read('example-owner', 'list', 'c0ffee', 'README.md')).toBe('# Made up');
    await expect(offline.read('example-owner', 'list', 'beef', 'README.md')).rejects.toBeInstanceOf(NotCached);
    expect(asked).toHaveLength(1);
  });

  it('says null for a file that is not there, and tries again on a server error', async () => {
    const statuses = [500, 200];
    const store = new FileStore({
      cacheDir: dir,
      download: (url) => Promise.resolve(url.endsWith('gone.md') ? { status: 404, text: '' } : { status: statuses.shift() ?? 500, text: 'ok' }),
      offline: false,
      sleep: () => Promise.resolve(),
    });
    expect(await store.read('o', 'r', 'c', 'gone.md')).toBeNull();
    expect(await store.read('o', 'r', 'c', 'README.md')).toBe('ok');
  });
});
