// The first source of lists: the index of awesome lists kept at
// github.com/sindresorhus/awesome. Its headings are categories; a bullet under
// another bullet is in a subcategory named by that parent bullet.
import { githubRepoOf } from '../canonical.js';
import type { ListRef } from '../model.js';
import { bullets } from '../parse/bullets.js';

export const INDEX_REPO = { owner: 'sindresorhus', repo: 'awesome' } as const;

/** Sections of the index that are not lists of lists. */
const NOT_LISTS = new Set(['related']);

export interface IndexResult {
  lists: ListRef[];
  /** Entries that are not the root of a GitHub repository, or were named twice. */
  passedOver: { name: string; url: string; why: string }[];
}

export function parseIndex(markdown: string): IndexResult {
  const lists: ListRef[] = [];
  const passedOver: IndexResult['passedOver'] = [];
  const seen = new Set<string>();

  for (const item of bullets(markdown).items) {
    const [category = null, plainParent = null] = item.section;
    if (category !== null && NOT_LISTS.has(category.toLowerCase())) continue;
    const repo = githubRepoOf(item.url);
    if (!repo) {
      passedOver.push({ name: item.name, url: item.url, why: 'not the root of a GitHub repository' });
      continue;
    }
    const key = `${repo.owner}/${repo.repo}`;
    if (seen.has(key)) {
      passedOver.push({ name: item.name, url: item.url, why: 'named before in the index' });
      continue;
    }
    seen.add(key);
    // githubRepoOf gives lower case; keep the spelling the index used.
    const spelled = /github\.com\/([^/#?]+)\/([^/#?]+)/i.exec(item.url);
    lists.push({
      owner: spelled?.[1] ?? repo.owner,
      repo: (spelled?.[2] ?? repo.repo).replace(/\.git$/i, ''),
      category,
      subcategory: item.parentName ?? plainParent,
      nameInIndex: item.name,
      sourceDescription: item.sourceDescription,
    });
  }
  return { lists, passedOver };
}

/** Reads a repository's root readme as text, or null when there is none. */
export type ReadmeReader = (owner: string, repo: string) => Promise<string | null>;

/** A source of lists: anything that hands over the repositories to read. */
export type Source = () => Promise<ListRef[]>;

export function indexSource(read: ReadmeReader): Source {
  return async () => {
    const text = await read(INDEX_REPO.owner, INDEX_REPO.repo);
    if (text === null) throw new Error('The readme of the index could not be read.');
    return parseIndex(text).lists;
  };
}
