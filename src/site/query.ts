// The parameters of /items, /lists and /search: parsed, checked, and written back in one fixed order.
// Unknown parameters are ignored; a value that cannot be right makes the page a 404 (null here).
import { ITEM_KINDS, LIST_STATUSES, REPO_STATUSES } from '../enums.js';

export const ITEM_SORTS = ['lists', 'stars', 'updated', 'name'] as const;
export const LIST_SORTS = ['stars', 'items', 'updated', 'name'] as const;
export const STAR_STEPS = [100, 1000, 10000] as const;
export const IN_STEPS = [2, 5, 10] as const;

export type ItemSort = (typeof ITEM_SORTS)[number];
export type ListSort = (typeof LIST_SORTS)[number];

export interface ItemsQuery {
  q: string | null;
  kind: string | null;
  status: string | null;
  lang: string | null;
  license: string | null;
  /** Repeatable; every one must hold. Kept sorted and without repeats. */
  topic: string[];
  list: string | null;
  category: string | null;
  owner: string | null;
  stars: number | null;
  in: number | null;
  /** null is the default: relevance with q, else lists. */
  sort: ItemSort | null;
  page: number;
}

export interface ListsQuery {
  q: string | null;
  category: string | null;
  license: string | null;
  status: string | null;
  /** null is the default: relevance with q, else stars. */
  sort: ListSort | null;
  page: number;
}

export const EMPTY_ITEMS: ItemsQuery = {
  q: null, kind: null, status: null, lang: null, license: null, topic: [], list: null, category: null,
  owner: null, stars: null, in: null, sort: null, page: 1,
};

export const EMPTY_LISTS: ListsQuery = { q: null, category: null, license: null, status: null, sort: null, page: 1 };

const SLUG = /^[a-z0-9][a-z0-9.+-]{0,99}$/;
const LIST_SLUG = /^[a-z0-9._-]{1,100}\/[a-z0-9._-]{1,100}$/;
const LOGIN = /^[a-z0-9][a-z0-9._-]{0,99}$/;
const PAGE = /^[1-9][0-9]{0,5}$/;

class Invalid extends Error {}

function first(params: URLSearchParams, name: string): string | null {
  const v = params.get(name);
  if (v === null) return null;
  const t = v.trim();
  return t === '' ? null : t;
}

/** What a person typed, tidied: whitespace collapsed, at most 200 characters. */
export function tidyQ(q: string | null): string | null {
  if (q === null) return null;
  const t = q.replace(/\s+/g, ' ').trim().slice(0, 200);
  return t === '' ? null : t;
}

function oneOf<T extends string | number>(value: string | null, allowed: readonly T[]): T | null {
  if (value === null) return null;
  const found = allowed.find((a) => String(a) === value.toLowerCase());
  if (found === undefined) throw new Invalid(value);
  return found;
}

function matching(value: string | null, re: RegExp): string | null {
  if (value === null) return null;
  const v = value.toLowerCase();
  if (!re.test(v)) throw new Invalid(value);
  return v;
}

function page(value: string | null): number {
  if (value === null) return 1;
  if (!PAGE.test(value)) throw new Invalid(value);
  return Number(value);
}

export function parseItemsQuery(params: URLSearchParams): ItemsQuery | null {
  try {
    const topics = params.getAll('topic').map((t) => t.trim()).filter((t) => t !== '');
    return {
      q: tidyQ(first(params, 'q')),
      kind: oneOf(first(params, 'kind'), ITEM_KINDS),
      status: oneOf(first(params, 'status'), REPO_STATUSES),
      lang: matching(first(params, 'lang'), SLUG),
      license: matching(first(params, 'license'), SLUG),
      topic: [...new Set(topics.map((t) => matching(t, SLUG) ?? ''))].sort(),
      list: matching(first(params, 'list'), LIST_SLUG),
      category: matching(first(params, 'category'), SLUG),
      owner: matching(first(params, 'owner'), LOGIN),
      stars: oneOf(first(params, 'stars'), STAR_STEPS),
      in: oneOf(first(params, 'in'), IN_STEPS),
      sort: oneOf(first(params, 'sort'), ITEM_SORTS),
      page: page(first(params, 'page')),
    };
  } catch (e) {
    if (e instanceof Invalid) return null;
    throw e;
  }
}

export function parseListsQuery(params: URLSearchParams): ListsQuery | null {
  try {
    return {
      q: tidyQ(first(params, 'q')),
      category: matching(first(params, 'category'), SLUG),
      license: matching(first(params, 'license'), SLUG),
      status: oneOf(first(params, 'status'), LIST_STATUSES),
      sort: oneOf(first(params, 'sort'), LIST_SORTS),
      page: page(first(params, 'page')),
    };
  } catch (e) {
    if (e instanceof Invalid) return null;
    throw e;
  }
}

export function encodeParam(value: string): string {
  return encodeURIComponent(value).replace(/%2F/g, '/').replace(/%3A/g, ':').replace(/%20/g, '+');
}

function write(pairs: readonly (readonly [string, string | number | null])[]): string {
  const parts = pairs
    .filter((p): p is readonly [string, string | number] => p[1] !== null)
    .map(([k, v]) => `${k}=${encodeParam(String(v))}`);
  return parts.length === 0 ? '' : `?${parts.join('&')}`;
}

/** The query string of /items, in the fixed order, defaults left out. */
export function serialiseItems(q: ItemsQuery): string {
  return write([
    ['q', q.q],
    ['kind', q.kind],
    ['status', q.status],
    ['lang', q.lang],
    ['license', q.license],
    ...q.topic.map((t) => ['topic', t] as const),
    ['list', q.list],
    ['category', q.category],
    ['owner', q.owner],
    ['stars', q.stars],
    ['in', q.in],
    ['sort', q.sort],
    ['page', q.page === 1 ? null : q.page],
  ]);
}

export function serialiseLists(q: ListsQuery): string {
  return write([
    ['q', q.q],
    ['category', q.category],
    ['license', q.license],
    ['status', q.status],
    ['sort', q.sort],
    ['page', q.page === 1 ? null : q.page],
  ]);
}

/** How many filters (not q, sort or page) a query has. */
export function filterCount(q: ItemsQuery): number {
  return (
    [q.kind, q.status, q.lang, q.license, q.list, q.category, q.owner, q.stars, q.in].filter((v) => v !== null).length +
    q.topic.length
  );
}

export const LIFTED = ['lang', 'license', 'kind', 'status', 'topic'] as const;
export type Lifted = (typeof LIFTED)[number];

/**
 * `ns:value` tokens of a search, taken out as filters. The value is made a slug
 * by `slug` (for lang, license and topic) or lower-cased (kind, status).
 */
export function liftNamespaces(
  q: string,
  slug: (text: string) => string,
): { rest: string | null; lifted: { ns: Lifted; value: string }[] } {
  const rest: string[] = [];
  const lifted: { ns: Lifted; value: string }[] = [];
  for (const token of q.split(/\s+/)) {
    const m = /^([a-z]+):(.+)$/i.exec(token);
    const ns = m?.[1]?.toLowerCase();
    const value = m?.[2];
    if (ns !== undefined && value !== undefined && (LIFTED as readonly string[]).includes(ns)) {
      const n = ns as Lifted;
      lifted.push({ ns: n, value: n === 'kind' || n === 'status' ? value.toLowerCase() : slug(value) });
    } else if (token !== '') rest.push(token);
  }
  return { rest: tidyQ(rest.join(' ')), lifted };
}

/** An items query with lifted filters set (a later topic adds; a later other value replaces). */
export function withLifted(base: ItemsQuery, lifted: readonly { ns: Lifted; value: string }[]): ItemsQuery {
  const q: ItemsQuery = { ...base, topic: [...base.topic] };
  for (const { ns, value } of lifted) {
    if (ns === 'topic') q.topic = [...new Set([...q.topic, value])].sort();
    else q[ns] = value;
  }
  return q;
}
