// The site's database, opened read-only, with its prepared statements and typed row readers.
import { DatabaseSync, type StatementSync } from 'node:sqlite';

type Row = Record<string, unknown>;

function str(r: Row, k: string): string {
  const v = r[k];
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'bigint') return String(v);
  return '';
}
function strOrNull(r: Row, k: string): string | null {
  const v = r[k];
  return v === null || v === undefined ? null : str(r, k);
}
function num(r: Row, k: string): number {
  const v = r[k];
  if (typeof v === 'number') return v;
  if (typeof v === 'bigint') return Number(v);
  return 0;
}
function numOrNull(r: Row, k: string): number | null {
  const v = r[k];
  return v === null || v === undefined ? null : num(r, k);
}
function boolOrNull(r: Row, k: string): boolean | null {
  const v = numOrNull(r, k);
  return v === null ? null : v !== 0;
}
function json<T>(r: Row, k: string, fallback: T): T {
  try {
    return JSON.parse(str(r, k)) as T;
  } catch {
    return fallback;
  }
}

export interface Meta {
  buildId: string;
  dataFinished: string;
  counts: Record<string, number>;
  coverage: {
    listsByStatus: Record<string, number>;
    itemsByKind: Record<string, number>;
    reposByStatus: Record<string, number>;
    itemsInTwoOrMore: number;
  };
}

export interface CategoryRow { id: number; name: string; slug: string; position: number; listCount: number }

export interface ListRow {
  id: number;
  slug: string;
  owner: string;
  repo: string;
  name: string;
  categoryId: number | null;
  subcategory: string | null;
  summary: string | null;
  stars: number | null;
  pushedDay: number | null;
  archived: boolean | null;
  license: string | null;
  status: string;
  reason: string | null;
  readmePath: string | null;
  readmeOid: string | null;
  itemsMade: number;
  sectionCount: number;
  itemId: number | null;
  position: number;
}

export interface SectionRow {
  id: number;
  listId: number;
  path: string[];
  title: string;
  depth: number;
  anchor: string;
  anchors: string[];
  position: number;
  itemCount: number;
}

export interface ItemRow {
  id: number;
  key: string;
  url: string;
  kind: string;
  host: string;
  name: string;
  aka: string[];
  owner: string | null;
  repoName: string | null;
  stars: number | null;
  pushedDay: number | null;
  archived: boolean | null;
  fork: boolean | null;
  langId: number | null;
  licenseId: number | null;
  status: string | null;
  renamedFrom: string | null;
  listCount: number;
  listId: number | null;
  indexable: boolean;
}

export interface ExtraLinkRow { text: string; url: string }

/** A listing on its list's page, with the item's facts. */
export interface ListEntry {
  id: number;
  sectionId: number;
  position: number;
  name: string;
  parentName: string | null;
  extraLinks: ExtraLinkRow[];
  item: ItemRow;
}

/** A listing on its item's page, with the list and the section. */
export interface ItemListing {
  listId: number;
  name: string;
  extraLinks: ExtraLinkRow[];
  path: string[];
  anchors: string[];
}

export interface TermRow { id: number; ns: string; slug: string; label: string; itemCount: number }

export interface OwnerRow { login: string; display: string; listCount: number; itemCount: number }

const ITEM_COLUMNS = `i.id, i.key, i.url, i.kind, i.host, i.name, i.aka, i.owner, i.repo_name, i.stars, i.pushed_day,
  i.archived, i.fork, i.lang_id, i.license_id, i.status, i.renamed_from, i.list_count, i.list_id, i.indexable`;

function itemOf(r: Row): ItemRow {
  return {
    id: num(r, 'id'),
    key: str(r, 'key'),
    url: str(r, 'url'),
    kind: str(r, 'kind'),
    host: str(r, 'host'),
    name: str(r, 'name'),
    aka: json<string[]>(r, 'aka', []),
    owner: strOrNull(r, 'owner'),
    repoName: strOrNull(r, 'repo_name'),
    stars: numOrNull(r, 'stars'),
    pushedDay: numOrNull(r, 'pushed_day'),
    archived: boolOrNull(r, 'archived'),
    fork: boolOrNull(r, 'fork'),
    langId: numOrNull(r, 'lang_id'),
    licenseId: numOrNull(r, 'license_id'),
    status: strOrNull(r, 'status'),
    renamedFrom: strOrNull(r, 'renamed_from'),
    listCount: num(r, 'list_count'),
    listId: numOrNull(r, 'list_id'),
    indexable: num(r, 'indexable') !== 0,
  };
}

function listOf(r: Row): ListRow {
  return {
    id: num(r, 'id'),
    slug: str(r, 'slug'),
    owner: str(r, 'owner'),
    repo: str(r, 'repo'),
    name: str(r, 'name'),
    categoryId: numOrNull(r, 'category_id'),
    subcategory: strOrNull(r, 'subcategory'),
    summary: strOrNull(r, 'summary'),
    stars: numOrNull(r, 'stars'),
    pushedDay: numOrNull(r, 'pushed_day'),
    archived: boolOrNull(r, 'archived'),
    license: strOrNull(r, 'license'),
    status: str(r, 'status'),
    reason: strOrNull(r, 'reason'),
    readmePath: strOrNull(r, 'readme_path'),
    readmeOid: strOrNull(r, 'readme_oid'),
    itemsMade: num(r, 'items_made'),
    sectionCount: num(r, 'section_count'),
    itemId: numOrNull(r, 'item_id'),
    position: num(r, 'position'),
  };
}

function sectionOf(r: Row): SectionRow {
  return {
    id: num(r, 'id'),
    listId: num(r, 'list_id'),
    path: json<string[]>(r, 'path', []),
    title: str(r, 'title'),
    depth: num(r, 'depth'),
    anchor: str(r, 'anchor'),
    anchors: json<string[]>(r, 'anchors', []),
    position: num(r, 'position'),
    itemCount: num(r, 'item_count'),
  };
}

function termOf(r: Row): TermRow {
  return { id: num(r, 'id'), ns: str(r, 'ns'), slug: str(r, 'slug'), label: str(r, 'label'), itemCount: num(r, 'item_count') };
}

function ownerOf(r: Row): OwnerRow {
  return { login: str(r, 'login'), display: str(r, 'display'), listCount: num(r, 'list_count'), itemCount: num(r, 'item_count') };
}

/** The columns facets.ts reads, one row per item in id order. */
export interface ItemColumnsRow {
  id: number;
  kind: string;
  status: string | null;
  langId: number | null;
  licenseId: number | null;
  stars: number | null;
  pushedDay: number | null;
  listCount: number;
  owner: string | null;
  name: string;
}

export class Db {
  readonly db: DatabaseSync;
  private readonly cache = new Map<string, StatementSync>();

  constructor(path: string) {
    this.db = new DatabaseSync(path, { readOnly: true });
    this.db.exec('PRAGMA query_only = 1; PRAGMA mmap_size = 268435456;');
  }

  close(): void {
    this.db.close();
  }

  private st(sql: string): StatementSync {
    let s = this.cache.get(sql);
    if (!s) this.cache.set(sql, (s = this.db.prepare(sql)));
    return s;
  }

  private all(sql: string, ...params: (string | number | null)[]): Row[] {
    return this.st(sql).all(...params);
  }

  private get(sql: string, ...params: (string | number | null)[]): Row | undefined {
    return this.st(sql).get(...params);
  }

  meta(): Meta {
    const m = new Map(this.all('SELECT key, value FROM meta').map((r) => [str(r, 'key'), str(r, 'value')]));
    return {
      buildId: m.get('build_id') ?? '',
      dataFinished: m.get('data_finished') ?? '',
      counts: JSON.parse(m.get('counts') ?? '{}') as Meta['counts'],
      coverage: JSON.parse(
        m.get('coverage') ?? '{"listsByStatus":{},"itemsByKind":{},"reposByStatus":{},"itemsInTwoOrMore":0}',
      ) as Meta['coverage'],
    };
  }

  categories(): CategoryRow[] {
    return this.all('SELECT * FROM category ORDER BY position').map((r) => ({
      id: num(r, 'id'),
      name: str(r, 'name'),
      slug: str(r, 'slug'),
      position: num(r, 'position'),
      listCount: num(r, 'list_count'),
    }));
  }

  /** Every list, in id order (stars, then items). */
  lists(): ListRow[] {
    return this.all('SELECT * FROM list ORDER BY id').map(listOf);
  }

  terms(): TermRow[] {
    return this.all('SELECT * FROM term ORDER BY id').map(termOf);
  }

  sectionsOfList(listId: number): SectionRow[] {
    return this.all('SELECT * FROM section WHERE list_id = ? ORDER BY position', listId).map(sectionOf);
  }

  entriesOfList(listId: number): ListEntry[] {
    return this.all(
      `SELECT l.id AS l_id, l.section_id, l.position, l.name AS l_name, l.parent_name, l.extra_links, ${ITEM_COLUMNS}
       FROM listing l JOIN item i ON i.id = l.item_id WHERE l.list_id = ? ORDER BY l.position`,
      listId,
    ).map((r) => ({
      id: num(r, 'l_id'),
      sectionId: num(r, 'section_id'),
      position: num(r, 'position'),
      name: str(r, 'l_name'),
      parentName: strOrNull(r, 'parent_name'),
      extraLinks: json<ExtraLinkRow[]>(r, 'extra_links', []),
      item: itemOf(r),
    }));
  }

  itemByKey(key: string): ItemRow | null {
    const r = this.get(`SELECT ${ITEM_COLUMNS} FROM item i WHERE i.key = ?`, key);
    return r ? itemOf(r) : null;
  }

  itemByUrl(url: string): ItemRow | null {
    const r = this.get(`SELECT ${ITEM_COLUMNS} FROM item i WHERE i.url = ?`, url);
    return r ? itemOf(r) : null;
  }

  itemById(id: number): ItemRow | null {
    const r = this.get(`SELECT ${ITEM_COLUMNS} FROM item i WHERE i.id = ?`, id);
    return r ? itemOf(r) : null;
  }

  /** Items by id, in the order given. */
  itemsByIds(ids: readonly number[]): ItemRow[] {
    if (ids.length === 0) return [];
    const rows = this.all(
      `SELECT ${ITEM_COLUMNS} FROM item i WHERE i.id IN (SELECT value FROM json_each(?))`,
      JSON.stringify(ids),
    ).map(itemOf);
    const byId = new Map(rows.map((r) => [r.id, r]));
    return ids.map((id) => byId.get(id)).filter((r): r is ItemRow => r !== undefined);
  }

  /** The topic term ids of each item. */
  topicsOf(ids: readonly number[]): Map<number, number[]> {
    const out = new Map<number, number[]>();
    if (ids.length === 0) return out;
    for (const r of this.all(
      'SELECT item_id, term_id FROM item_topic WHERE item_id IN (SELECT value FROM json_each(?))',
      JSON.stringify(ids),
    )) {
      const id = num(r, 'item_id');
      let a = out.get(id);
      if (!a) out.set(id, (a = []));
      a.push(num(r, 'term_id'));
    }
    return out;
  }

  /** Where an item is listed, ordered by the list's stars. */
  listingsOfItem(itemId: number): ItemListing[] {
    return this.all(
      `SELECT l.list_id, l.name, l.extra_links, s.path, s.anchors
       FROM listing l JOIN list li ON li.id = l.list_id JOIN section s ON s.id = l.section_id
       WHERE l.item_id = ? ORDER BY li.id, l.position`,
      itemId,
    ).map((r) => ({
      listId: num(r, 'list_id'),
      name: str(r, 'name'),
      extraLinks: json<ExtraLinkRow[]>(r, 'extra_links', []),
      path: json<string[]>(r, 'path', []),
      anchors: json<string[]>(r, 'anchors', []),
    }));
  }

  alongsideOf(itemId: number): ItemRow[] {
    return this.all(
      `SELECT ${ITEM_COLUMNS} FROM alongside a JOIN item i ON i.id = a.other_id WHERE a.item_id = ? ORDER BY a.rank`,
      itemId,
    ).map(itemOf);
  }

  owner(login: string): OwnerRow | null {
    const r = this.get('SELECT * FROM owner WHERE login = ?', login);
    return r ? ownerOf(r) : null;
  }

  /** Owners with a list or at least two items, for the sitemap. */
  ownersToCrawl(): string[] {
    return this.all('SELECT login FROM owner WHERE list_count > 0 OR item_count >= 2 ORDER BY login').map((r) =>
      str(r, 'login'),
    );
  }

  itemsOfOwner(login: string, limit: number): ItemRow[] {
    return this.all(`SELECT ${ITEM_COLUMNS} FROM item i WHERE i.owner = ? ORDER BY i.id LIMIT ?`, login, limit).map(
      itemOf,
    );
  }

  redirect(path: string): string | null {
    const r = this.get('SELECT to_path FROM redirect WHERE from_path = ?', path);
    return r ? str(r, 'to_path') : null;
  }

  /** How many other lists name the item. */
  otherListsNaming(itemId: number, listId: number): number {
    const r = this.get('SELECT COUNT(DISTINCT list_id) AS n FROM listing WHERE item_id = ? AND list_id <> ?', itemId, listId);
    return r ? num(r, 'n') : 0;
  }

  /** Keys of indexable items in id order. */
  indexableKeys(): string[] {
    return this.all('SELECT key FROM item WHERE indexable = 1 ORDER BY id').map((r) => str(r, 'key'));
  }

  itemColumns(): ItemColumnsRow[] {
    return this.all(
      'SELECT id, kind, status, lang_id, license_id, stars, pushed_day, list_count, owner, name FROM item ORDER BY id',
    ).map((r) => ({
      id: num(r, 'id'),
      kind: str(r, 'kind'),
      status: strOrNull(r, 'status'),
      langId: numOrNull(r, 'lang_id'),
      licenseId: numOrNull(r, 'license_id'),
      stars: numOrNull(r, 'stars'),
      pushedDay: numOrNull(r, 'pushed_day'),
      listCount: num(r, 'list_count'),
      owner: strOrNull(r, 'owner'),
      name: str(r, 'name'),
    }));
  }

  /** [item, topic term] pairs in item order. */
  itemTopicPairs(): [number, number][] {
    return this.all('SELECT item_id, term_id FROM item_topic ORDER BY item_id, term_id').map((r) => [
      num(r, 'item_id'),
      num(r, 'term_id'),
    ]);
  }

  /** [item, list] pairs, distinct, in item order. */
  itemListPairs(): [number, number][] {
    return this.all('SELECT DISTINCT item_id, list_id FROM listing ORDER BY item_id, list_id').map((r) => [
      num(r, 'item_id'),
      num(r, 'list_id'),
    ]);
  }

  /** Item ids matching a full-text query, best first: exact name, then bm25 weighted by popularity. */
  itemMatches(match: string, exact: string, limit: number): number[] {
    return this.all(
      `SELECT i.id FROM item_fts f JOIN item i ON i.id = f.rowid WHERE item_fts MATCH ?
       ORDER BY (i.name = ? COLLATE NOCASE) DESC, bm25(item_fts, 10, 5, 4, 2, 1) * i.pop, i.id LIMIT ?`,
      match,
      exact,
      limit,
    ).map((r) => num(r, 'id'));
  }

  itemMatchCount(match: string): number {
    const r = this.get('SELECT COUNT(*) AS n FROM item_fts WHERE item_fts MATCH ?', match);
    return r ? num(r, 'n') : 0;
  }

  listMatches(match: string, limit: number): number[] {
    return this.all(
      `SELECT l.id FROM list_fts f JOIN list l ON l.id = f.rowid WHERE list_fts MATCH ?
       ORDER BY bm25(list_fts, 10, 6, 4, 2, 1), l.stars DESC, l.id LIMIT ?`,
      match,
      limit,
    ).map((r) => num(r, 'id'));
  }

  sectionMatches(match: string, limit: number): SectionRow[] {
    return this.all(
      `SELECT s.* FROM section_fts f JOIN section s ON s.id = f.rowid JOIN list l ON l.id = s.list_id
       WHERE section_fts MATCH ? ORDER BY bm25(section_fts, 6, 1), l.id, s.position LIMIT ?`,
      match,
      limit,
    ).map(sectionOf);
  }
}
