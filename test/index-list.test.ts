import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { indexSource, parseIndex } from '../src/sources/index-list.js';

const text = readFileSync(new URL('fixtures/index.md', import.meta.url), 'utf8');

describe('parseIndex', () => {
  it('gives every list with its category, subcategory and the words of the index', () => {
    const { lists, passedOver } = parseIndex(text);
    expect(lists).toEqual([
      {
        owner: 'example-owner', repo: 'awesome-toaster', category: 'Platforms', subcategory: null,
        nameInIndex: 'Toaster OS', sourceDescription: 'Software for toasters.',
      },
      {
        owner: 'example-owner', repo: 'awesome-crumbs', category: 'Platforms', subcategory: 'Toaster OS',
        nameInIndex: 'Crumb Tools', sourceDescription: 'Cleaning up after toast.',
      },
      {
        owner: 'Example-Owner', repo: 'Awesome-Steam', category: 'Platforms', subcategory: 'Kettles',
        nameInIndex: 'Steam', sourceDescription: null,
      },
      {
        owner: 'example-owner', repo: 'awesome-bracket', category: 'Languages', subcategory: null,
        nameInIndex: 'Bracket', sourceDescription: 'A language of brackets.',
      },
    ]);
    expect(passedOver.map((p) => p.why)).toEqual(['not the root of a GitHub repository', 'named before in the index']);
  });

  it('is a source: a function that hands over the lists', async () => {
    const source = indexSource((owner, repo) => Promise.resolve(owner === 'sindresorhus' && repo === 'awesome' ? text : null));
    expect((await source()).length).toBe(4);
    await expect(indexSource(() => Promise.resolve(null))()).rejects.toThrow(/could not be read/);
  });
});
