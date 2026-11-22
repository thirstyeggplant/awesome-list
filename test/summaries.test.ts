import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  loadSummaries, parseSummaries, sharesRun, sourceHash, summaryOf, SUMMARIES_FILE, wordsOf, type Summaries,
} from '../src/summaries.js';

describe('sourceHash', () => {
  it('is the first 12 hex characters of the SHA-256, and empty for no description', () => {
    expect(sourceHash('abc')).toBe('ba7816bf8f01');
    expect(sourceHash(null)).toBe('');
  });
});

describe('summaryOf', () => {
  const summaries: Summaries = new Map([
    ['example-owner/awesome-pocket', { summary: 'Editors for pockets.', sourceHash: sourceHash('A pocket editor.') }],
    ['example-owner/awesome-blank', { summary: 'Things with no description.', sourceHash: '' }],
  ]);

  it('gives the summary and says it is current when the hash matches', () => {
    expect(summaryOf(summaries, 'example-owner/awesome-pocket', 'A pocket editor.')).toEqual({ summary: 'Editors for pockets.', stale: false });
  });

  it('says it is stale when the source changed', () => {
    expect(summaryOf(summaries, 'example-owner/awesome-pocket', 'A pocket editor, now longer.')).toEqual({ summary: 'Editors for pockets.', stale: true });
    expect(summaryOf(summaries, 'example-owner/awesome-pocket', null)).toEqual({ summary: 'Editors for pockets.', stale: true });
  });

  it('gives null, and not stale, for a list without an entry', () => {
    expect(summaryOf(summaries, 'example-owner/awesome-missing', 'Anything.')).toEqual({ summary: null, stale: false });
  });

  it('matches a source without a description to an empty hash', () => {
    expect(summaryOf(summaries, 'example-owner/awesome-blank', null)).toEqual({ summary: 'Things with no description.', stale: false });
    expect(summaryOf(summaries, 'example-owner/awesome-blank', 'Now it has one.').stale).toBe(true);
  });
});

describe('loadSummaries', () => {
  let dir = '';
  beforeAll(async () => {
    dir = await mkdtemp(join(tmpdir(), 'summaries-'));
  });
  afterAll(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('gives none when the file is missing', async () => {
    expect((await loadSummaries(join(dir, 'nothing.json'))).size).toBe(0);
  });

  it('reads a valid file', async () => {
    const path = join(dir, 'lists.json');
    await writeFile(path, JSON.stringify({ 'example-owner/awesome-pocket': { summary: 'Editors.', sourceHash: 'ba7816bf8f01' } }));
    const summaries = await loadSummaries(path);
    expect(summaries.get('example-owner/awesome-pocket')).toEqual({ summary: 'Editors.', sourceHash: 'ba7816bf8f01' });
  });

  it('refuses a file that is not valid, naming it', async () => {
    const path = join(dir, 'bad.json');
    await writeFile(path, JSON.stringify({ 'example-owner/awesome-pocket': { summary: 'Editors.', sourceHash: 'not a hash' } }));
    await expect(loadSummaries(path)).rejects.toThrow(path);
    expect(() => parseSummaries('{', 'broken.json')).toThrow('broken.json is not JSON');
    expect(() => parseSummaries(JSON.stringify({ a: { summary: 'X.', sourceHash: '', extra: 1 } }))).toThrow();
  });
});

describe('sharesRun', () => {
  it('finds five words in a row, ignoring case and punctuation', () => {
    expect(sharesRun('Tools for building, changing and keeping versions.', 'Tool for building changing and versioning infrastructure.')).toBe(false);
    expect(sharesRun('Tools for Building, changing and versioning.', 'A tool: for building changing and versioning infrastructure.')).toBe(true);
    expect(sharesRun('One two three four.', 'One two three four.')).toBe(false);
    expect(wordsOf('Node.js, the runtime!')).toEqual(['node', 'js', 'the', 'runtime']);
  });
});

describe('the summaries in summaries/lists.json', () => {
  const BANNED = /\b(?:awesome|curated|comprehensive|ultimate|best|amazing)\b/i;
  const EMOJI = /\p{Extended_Pictographic}|\p{Regional_Indicator}|\u{FE0F}/u;

  it('are each one plain sentence of at most 18 words', async () => {
    const summaries = parseSummaries(await readFile(SUMMARIES_FILE, 'utf8'));
    expect(summaries.size).toBeGreaterThan(0);
    const problems: string[] = [];
    for (const [id, { summary }] of summaries) {
      const words = summary.trim().split(/\s+/);
      if (words.length > 18) problems.push(`${id}: ${words.length} words`);
      if (!summary.endsWith('.')) problems.push(`${id}: does not end with a full stop`);
      if (/[.!?](?:\s|$)/.test(summary.slice(0, -1))) problems.push(`${id}: more than one sentence`);
      if (summary !== summary.trim()) problems.push(`${id}: space at an end`);
      if (BANNED.test(summary)) problems.push(`${id}: a banned word`);
      if (EMOJI.test(summary)) problems.push(`${id}: an emoji`);
    }
    expect(problems).toEqual([]);
  });

  it('are sorted by list id', async () => {
    const ids = Object.keys(JSON.parse(await readFile(SUMMARIES_FILE, 'utf8')) as Record<string, unknown>);
    expect(ids).toEqual([...ids].sort());
  });
});
