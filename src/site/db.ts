// The site's queries over an `Sql`, with typed row readers. One Db per request.
import type { Row, Sql } from './data.js';

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
  /** The paths of the site's CSS and scripts, /assets/{hash}/{name}. */
  assets: { css: string; quick: string; listfilter: string; og: string };
  /** What the home page shows from the terms: the languages with the most items, as [slug, label, count]. */
  top: { langs: [string, string, number][] };
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
  tags: Tags;
}

/** A term as an item carries it: [slug, label]. */
export type TagPair = readonly [string, string];

export interface Tags {
  lang: TagPair | null;
  license: TagPair | null;
  topics: readonly TagPair[];
}

const NO_TAGS: Tags = { lang: null, license: null, topics: [] };

/** One place an item is listed: [listId, sectionId, the name the list uses when it differs, extra links]. */
export type Listed = readonly [number, number, string | null, readonly ExtraLinkRow[]];

/** An item with what its own page needs. */
export interface ItemDetail extends ItemRow {
  alongside: number[];
  listed: Listed[];
}

export interface ExtraLinkRow { text: string; url: string }

/** A listing on its list's page, with the item's facts. */
export interface ListEntry {
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
  /** The name the list uses, when it is not the item's. */
  name: string | null;
  extraLinks: readonly ExtraLinkRow[];
  path: string[];
  anchors: string[];
}

export interface TermRow { id: number; ns: string; slug: string; label: string; itemCount: number }

export interface OwnerRow { login: string; display: string; listCount: number; itemCount: number; itemIds: number[] }

const ITEM_COLUMNS = `i.id, i.key, i.url, i.kind, i.host, i.name, i.aka, i.owner, i.repo_name, i.stars, i.pushed_day,
  i.archived, i.fork, i.lang_id, i.license_id, i.status, i.renamed_from, i.list_count, i.list_id, i.indexable, i.tags`;
const DETAIL_COLUMNS = `${ITEM_COLUMNS}, i.alongside, i.listed`;

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
    tags: json<Tags>(r, 'tags', NO_TAGS),
  };
}

function detailOf(r: Row): ItemDetail {
  return { ...itemOf(r), alongside: json<number[]>(r, 'alongside', []), listed: json<Listed[]>(r, 'listed', []) };
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

function ownerOf(r: Row): OwnerRow {
  return {
    login: str(r, 'login'),
    display: str(r, 'display'),
    listCount: num(r, 'list_count'),
    itemCount: num(r, 'item_count'),
    itemIds: json<number[]>(r, 'item_ids', []),
  };
}

export function metaOf(rows: readonly Row[]): Meta {
  const m = new Map(rows.map((r) => [str(r, 'key'), str(r, 'value')]));
  return {
    buildId: m.get('build_id') ?? '',
    dataFinished: m.get('data_finished') ?? '',
    counts: JSON.parse(m.get('counts') ?? '{}') as Meta['counts'],
    coverage: JSON.parse(
      m.get('coverage') ?? '{"listsByStatus":{},"itemsByKind":{},"reposByStatus":{},"itemsInTwoOrMore":0}',
    ) as Meta['coverage'],
    assets: JSON.parse(m.get('assets') ?? '{"css":"","quick":"","listfilter":"","og":""}') as Meta['assets'],
    top: JSON.parse(m.get('top') ?? '{"langs":[]}') as Meta['top'],
  };
}

export function categoryOf(r: Row): CategoryRow {
  return { id: num(r, 'id'), name: str(r, 'name'), slug: str(r, 'slug'), position: num(r, 'position'), listCount: num(r, 'list_count') };
}

/** What the site holds in memory, read at start in one batch. */
export interface Base {
  meta: Meta;
  categories: CategoryRow[];
  /** Every list, in id order (stars, then items). */
  lists: ListRow[];
}

const ids = (list: readonly number[]): string => JSON.stringify(list);

export class Db {
  constructor(private readonly sql: Sql) {}

  async base(): Promise<Base> {
    const [meta = [], categories = [], lists = []] = await this.sql.batch([
      { sql: 'SELECT key, value FROM meta' },
      { sql: 'SELECT * FROM category ORDER BY position' },
      { sql: 'SELECT * FROM list ORDER BY id' },
    ]);
    return { meta: metaOf(meta), categories: categories.map(categoryOf), lists: lists.map(listOf) };
  }

  async buildId(): Promise<string> {
    const r = await this.sql.first('SELECT value FROM meta WHERE key = ?', ['build_id']);
    return r ? str(r, 'value') : '';
  }

  async sectionsOfList(listId: number): Promise<SectionRow[]> {
    return (await this.sql.all('SELECT * FROM section WHERE list_id = ? ORDER BY position', [listId])).map(sectionOf);
  }

  /** Sections by id, in no order. */
  async sectionsByIds(list: readonly number[]): Promise<Map<number, SectionRow>> {
    if (list.length === 0) return new Map();
    const rows = await this.sql.all('SELECT * FROM section WHERE id IN (SELECT value FROM json_each(?))', [ids(list)]);
    return new Map(rows.map(sectionOf).map((s) => [s.id, s]));
  }

  async entriesOfList(listId: number): Promise<ListEntry[]> {
    const rows = await this.sql.all(
      `SELECT l.position, l.section_id, l.name AS l_name, l.parent_name, l.extra_links, ${ITEM_COLUMNS}
       FROM listing l JOIN item i ON i.id = l.item_id WHERE l.list_id = ? ORDER BY l.position`,
      [listId],
    );
    return rows.map((r) => ({
      sectionId: num(r, 'section_id'),
      position: num(r, 'position'),
      name: str(r, 'l_name'),
      parentName: strOrNull(r, 'parent_name'),
      extraLinks: json<ExtraLinkRow[]>(r, 'extra_links', []),
      item: itemOf(r),
    }));
  }

  async itemByKey(key: string): Promise<ItemDetail | null> {
    const r = await this.sql.first(`SELECT ${DETAIL_COLUMNS} FROM item i WHERE i.key = ?`, [key]);
    return r ? detailOf(r) : null;
  }

  async itemById(id: number): Promise<ItemDetail | null> {
    const r = await this.sql.first(`SELECT ${DETAIL_COLUMNS} FROM item i WHERE i.id = ?`, [id]);
    return r ? detailOf(r) : null;
  }

  /** The item whose address is `url`, among the items with one of `keys`. */
  async itemByUrl(url: string, keys: readonly string[]): Promise<ItemRow | null> {
    const r = await this.sql.first(
      `SELECT ${ITEM_COLUMNS} FROM item i WHERE i.key IN (SELECT value FROM json_each(?)) AND i.url = ?`,
      [JSON.stringify(keys), url],
    );
    return r ? itemOf(r) : null;
  }

  /** Items by id, in the order given. */
  async itemsByIds(list: readonly number[]): Promise<ItemRow[]> {
    if (list.length === 0) return [];
    const rows = (
      await this.sql.all(`SELECT ${ITEM_COLUMNS} FROM item i WHERE i.id IN (SELECT value FROM json_each(?))`, [ids(list)])
    ).map(itemOf);
    const byId = new Map(rows.map((r) => [r.id, r]));
    return list.map((id) => byId.get(id)).filter((r): r is ItemRow => r !== undefined);
  }

  async owner(login: string): Promise<OwnerRow | null> {
    const r = await this.sql.first('SELECT * FROM owner WHERE login = ?', [login]);
    return r ? ownerOf(r) : null;
  }

  async ownerExists(login: string): Promise<boolean> {
    return (await this.sql.first('SELECT 1 AS x FROM owner WHERE login = ?', [login])) !== null;
  }

  async redirect(path: string): Promise<string | null> {
    const r = await this.sql.first('SELECT to_path FROM redirect WHERE from_path = ?', [path]);
    return r ? str(r, 'to_path') : null;
  }

  /** Item ids matching a full-text query, best first: exact name, then bm25 weighted by popularity. */
  async itemMatches(match: string, exact: string, limit: number): Promise<number[]> {
    const rows = await this.sql.all(
      `SELECT i.id FROM item_fts f JOIN item i ON i.id = f.rowid WHERE item_fts MATCH ?
       ORDER BY (i.name = ? COLLATE NOCASE) DESC, bm25(item_fts, 10, 5, 4, 2, 1) * i.pop, i.id LIMIT ?`,
      [match, exact, limit],
    );
    return rows.map((r) => num(r, 'id'));
  }

  async itemMatchCount(match: string): Promise<number> {
    const r = await this.sql.first('SELECT COUNT(*) AS n FROM item_fts WHERE item_fts MATCH ?', [match]);
    return r ? num(r, 'n') : 0;
  }

  async listMatches(match: string, limit: number): Promise<number[]> {
    const rows = await this.sql.all(
      `SELECT l.id FROM list_fts f JOIN list l ON l.id = f.rowid WHERE list_fts MATCH ?
       ORDER BY bm25(list_fts, 10, 6, 4, 2, 1), l.stars DESC, l.id LIMIT ?`,
      [match, limit],
    );
    return rows.map((r) => num(r, 'id'));
  }

  async sectionMatches(match: string, limit: number): Promise<SectionRow[]> {
    const rows = await this.sql.all(
      `SELECT s.* FROM section_fts f JOIN section s ON s.id = f.rowid JOIN list l ON l.id = s.list_id
       WHERE section_fts MATCH ? ORDER BY bm25(section_fts, 6, 1), l.id, s.position LIMIT ?`,
      [match, limit],
    );
    return rows.map(sectionOf);
  }
}
