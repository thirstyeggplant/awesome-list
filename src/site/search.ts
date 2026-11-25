// Full-text queries. What a person types is never passed as it is: it is split on whitespace,
// each token double-quoted, and `*` added to the last.
import type { Db, ItemRow, ListRow, SectionRow } from './db.js';

/** A token that holds no letter, digit, + or # cannot match and would empty the whole query. */
const WORDY = /[\p{L}\p{N}+#]/u;

export function ftsQuery(q: string): string | null {
  const tokens = q.split(/\s+/).filter((t) => t !== '' && WORDY.test(t));
  if (tokens.length === 0) return null;
  return tokens.map((t, i) => `"${t.replace(/"/g, '""')}"${i === tokens.length - 1 ? '*' : ''}`).join(' ');
}

/** The same, matching only the name, the other names and the identity (quick search). */
export function quickFtsQuery(q: string): string | null {
  const inner = ftsQuery(q);
  return inner === null ? null : `{name aka ident} : (${inner})`;
}

async function safely<T>(fallback: T, f: () => Promise<T>): Promise<T> {
  try {
    return await f();
  } catch {
    return fallback;
  }
}

export function itemIds(db: Db, q: string, limit: number, quick = false): Promise<number[]> {
  const m = quick ? quickFtsQuery(q) : ftsQuery(q);
  return m === null ? Promise.resolve([]) : safely([], () => db.itemMatches(m, q.trim(), limit));
}

export function itemCount(db: Db, q: string): Promise<number> {
  const m = ftsQuery(q);
  return m === null ? Promise.resolve(0) : safely(0, () => db.itemMatchCount(m));
}

export function listIds(db: Db, q: string, limit: number): Promise<number[]> {
  const m = ftsQuery(q);
  return m === null ? Promise.resolve([]) : safely([], () => db.listMatches(m, limit));
}

export function sections(db: Db, q: string, limit: number): Promise<SectionRow[]> {
  const m = ftsQuery(q);
  return m === null ? Promise.resolve([]) : safely([], () => db.sectionMatches(m, limit));
}

export interface QuickAnswer {
  q: string;
  lists: { name: string; slug: string; items: number }[];
  items: { name: string; sub: string; key: string; kind: string; lists: number; stars: number | null; status: string | null }[];
  tags: { label: string; href: string; count: number }[];
}

export interface TagTerm { ns: string; slug: string; label: string; itemCount: number }

export function subOf(item: ItemRow): string {
  return item.owner ?? item.host;
}

export async function quick(
  db: Db,
  q: string,
  listById: ReadonlyMap<number, ListRow>,
  tags: (q: string) => TagTerm[],
): Promise<QuickAnswer> {
  const [listMatches, itemMatches] = await Promise.all([listIds(db, q, 5), itemIds(db, q, 8, true)]);
  const lists = listMatches
    .map((id) => listById.get(id))
    .filter((l): l is ListRow => l !== undefined)
    .map((l) => ({ name: l.name, slug: l.slug, items: l.itemsMade }));
  const items = (await db.itemsByIds(itemMatches)).map((it) => ({
    name: it.name,
    sub: subOf(it),
    key: it.key,
    kind: it.kind,
    lists: it.listCount,
    stars: it.stars,
    status: it.status,
  }));
  return {
    q,
    lists,
    items,
    tags: tags(q)
      .slice(0, 3)
      .map((t) => ({ label: `${t.ns}:${t.slug}`, href: `/items?${t.ns}=${encodeURIComponent(t.slug)}`, count: t.itemCount })),
  };
}
