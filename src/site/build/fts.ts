// What goes into the three full-text tables.
import type { Category, Item, List, Listing, Section } from './load.js';

/** Owner and repository, or the words of the host and path, cut at 200 characters. */
export function identOf(item: Pick<Item, 'ownerDisplay' | 'repoName' | 'host' | 'url'>): string {
  if (item.ownerDisplay !== null && item.repoName !== null) return `${item.ownerDisplay} ${item.repoName}`;
  let path: string;
  try {
    path = decodeURIComponent(new URL(item.url).pathname);
  } catch {
    path = '';
  }
  return `${item.host} ${path}`.replace(/[^\p{L}\p{N}+#]+/gu, ' ').trim().slice(0, 200);
}

export interface FtsRows {
  items: { id: number; name: string; aka: string; ident: string; topics: string; sections: string }[];
  lists: { id: number; name: string; repo: string; summary: string; category: string; sections: string }[];
  sections: { id: number; title: string; path: string }[];
}

export function ftsRows(
  items: readonly Item[],
  lists: readonly List[],
  sections: readonly Section[],
  listings: readonly Listing[],
  categories: readonly Category[],
  topicLabel: (termId: number) => string,
): FtsRows {
  const listById = new Map(lists.map((l) => [l.id, l]));
  const sectionById = new Map(sections.map((s) => [s.id, s]));
  const words = new Map<number, Set<string>>();
  for (const l of listings) {
    let w = words.get(l.itemId);
    if (!w) words.set(l.itemId, (w = new Set()));
    for (const t of sectionById.get(l.sectionId)?.path ?? []) w.add(t);
    const list = listById.get(l.listId);
    if (list) w.add(list.name);
  }
  const titlesByList = new Map<number, Set<string>>();
  for (const s of sections) {
    let t = titlesByList.get(s.listId);
    if (!t) titlesByList.set(s.listId, (t = new Set()));
    for (const p of s.path) t.add(p);
  }
  const catName = new Map(categories.map((c) => [c.id, c.name]));
  return {
    items: items.map((it) => ({
      id: it.id,
      name: it.name,
      aka: it.aka.join(' '),
      ident: identOf(it),
      topics: it.topicIds.map(topicLabel).join(' '),
      sections: [...(words.get(it.id) ?? [])].join(' '),
    })),
    lists: lists.map((l) => ({
      id: l.id,
      name: l.name,
      repo: `${l.owner} ${l.repo}`,
      summary: l.summary ?? '',
      category: [l.categoryId === null ? '' : (catName.get(l.categoryId) ?? ''), l.subcategory ?? ''].join(' ').trim(),
      sections: [...(titlesByList.get(l.id) ?? [])].join(' '),
    })),
    sections: sections
      .filter((s) => s.path.length > 0)
      .map((s) => ({ id: s.id, title: s.title, path: s.path.join(' ') })),
  };
}
