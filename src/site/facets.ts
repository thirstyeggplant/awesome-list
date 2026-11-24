// The facets of /items, in memory: the items' columns as typed arrays in id order, one pass per request.
// An item that fails no filter counts in every facet and in the result; one that fails exactly one
// counts only in that filter's facet, so each facet says what choosing another value would give.
import { ITEM_KINDS, REPO_STATUSES } from '../model.js';
import type { Db, ListRow } from './db.js';
import { IN_STEPS, STAR_STEPS, type ItemSort } from './query.js';

export const DIMENSIONS = ['kind', 'status', 'lang', 'license', 'topic', 'list', 'category', 'stars', 'in'] as const;
export type Dimension = (typeof DIMENSIONS)[number];
const BIT: Record<Dimension, number> = {
  kind: 1, status: 2, lang: 4, license: 8, topic: 16, list: 32, category: 64, stars: 128, in: 256,
};

/** Filters as numbers. -1 or an empty array is "not set". */
export interface Filters {
  kind: number;
  status: number;
  lang: number;
  license: number;
  topics: number[];
  list: number;
  category: number;
  owner: number;
  stars: number;
  in: number;
  /** Item ids from full-text search, best first; null without q. */
  matches: readonly number[] | null;
}

export const NO_FILTERS: Filters = {
  kind: -1, status: -1, lang: -1, license: -1, topics: [], list: -1, category: -1, owner: -1, stars: -1, in: -1,
  matches: null,
};

export interface FacetCounts {
  kind: Uint32Array;
  status: Uint32Array;
  lang: Uint32Array;
  license: Uint32Array;
  topic: Uint32Array;
  list: Uint32Array;
  category: Uint32Array;
  /** Counts at or above each of STAR_STEPS. */
  stars: number[];
  /** Counts at or above each of IN_STEPS. */
  in: number[];
}

export interface FacetResult {
  total: number;
  /** The item ids of the page, in order. */
  ids: number[];
  counts: FacetCounts;
}

function csr(n: number, pairs: readonly [number, number][]): { start: Uint32Array; values: Uint32Array } {
  const start = new Uint32Array(n + 1);
  for (const [id] of pairs) {
    const at = id; // ids are 1..n; index id-1, counted into start[id]
    if (at >= 1 && at <= n) start[at] = (start[at] ?? 0) + 1;
  }
  for (let i = 1; i <= n; i++) start[i] = (start[i] ?? 0) + (start[i - 1] ?? 0);
  const values = new Uint32Array(start[n] ?? 0);
  const fill = start.slice(0, n);
  for (const [id, v] of pairs) {
    if (id < 1 || id > n) continue;
    const at = fill[id - 1] ?? 0;
    values[at] = v;
    fill[id - 1] = at + 1;
  }
  return { start, values };
}

export class FacetIndex {
  readonly n: number;
  readonly kind: Uint8Array;
  readonly status: Uint8Array;
  readonly lang: Uint16Array;
  readonly license: Uint16Array;
  readonly stars: Int32Array;
  readonly pushed: Int32Array;
  readonly listCount: Uint16Array;
  readonly owner: Int32Array;
  readonly topicStart: Uint32Array;
  readonly topicIds: Uint32Array;
  readonly listStart: Uint32Array;
  readonly listIds: Uint32Array;
  readonly listCategory: Uint16Array;
  readonly ownerIndex = new Map<string, number>();
  private readonly orders: Record<Exclude<ItemSort, 'lists'>, Uint32Array>;
  private readonly termSize: number;
  private readonly listSize: number;
  private readonly categorySize: number;

  constructor(db: Db, lists: readonly ListRow[], termCount: number, categoryCount: number) {
    const rows = db.itemColumns();
    const n = rows.length;
    this.n = n;
    this.kind = new Uint8Array(n);
    this.status = new Uint8Array(n);
    this.lang = new Uint16Array(n);
    this.license = new Uint16Array(n);
    this.stars = new Int32Array(n);
    this.pushed = new Int32Array(n);
    this.listCount = new Uint16Array(n);
    this.owner = new Int32Array(n);
    const names: string[] = new Array<string>(n);
    rows.forEach((r, i) => {
      if (r.id !== i + 1) throw new Error('item ids are not 1..n in order');
      this.kind[i] = Math.max(0, (ITEM_KINDS as readonly string[]).indexOf(r.kind));
      this.status[i] = r.status === null ? 0 : (REPO_STATUSES as readonly string[]).indexOf(r.status) + 1;
      this.lang[i] = r.langId ?? 0;
      this.license[i] = r.licenseId ?? 0;
      this.stars[i] = r.stars ?? -1;
      this.pushed[i] = r.pushedDay ?? -1;
      this.listCount[i] = Math.min(65535, r.listCount);
      if (r.owner === null) this.owner[i] = -1;
      else {
        let o = this.ownerIndex.get(r.owner);
        if (o === undefined) this.ownerIndex.set(r.owner, (o = this.ownerIndex.size));
        this.owner[i] = o;
      }
      names[i] = r.name.toLowerCase();
    });
    const topics = csr(n, db.itemTopicPairs());
    this.topicStart = topics.start;
    this.topicIds = topics.values;
    const listed = csr(n, db.itemListPairs());
    this.listStart = listed.start;
    this.listIds = listed.values;
    this.listSize = lists.reduce((m, l) => Math.max(m, l.id), 0) + 1;
    this.listCategory = new Uint16Array(this.listSize);
    for (const l of lists) this.listCategory[l.id] = l.categoryId ?? 0;
    this.termSize = termCount + 1;
    this.categorySize = categoryCount + 1;

    const ids = (): number[] => Array.from({ length: n }, (_, i) => i);
    const by = (key: Int32Array): Uint32Array =>
      Uint32Array.from(ids().sort((a, b) => (key[b] ?? 0) - (key[a] ?? 0) || a - b));
    this.orders = {
      stars: by(this.stars),
      updated: by(this.pushed),
      name: Uint32Array.from(
        ids().sort((a, b) => {
          const x = names[a] ?? '';
          const y = names[b] ?? '';
          return x < y ? -1 : x > y ? 1 : a - b;
        }),
      ),
    };
  }

  /** One pass: the result count, the facet counts and the ids of one page. */
  run(f: Filters, sort: ItemSort | 'relevance', page: number, pageSize: number): FacetResult {
    const n = this.n;
    const counts: FacetCounts = {
      kind: new Uint32Array(ITEM_KINDS.length),
      status: new Uint32Array(REPO_STATUSES.length + 1),
      lang: new Uint32Array(this.termSize),
      license: new Uint32Array(this.termSize),
      topic: new Uint32Array(this.termSize),
      list: new Uint32Array(this.listSize),
      category: new Uint32Array(this.categorySize),
      stars: STAR_STEPS.map(() => 0),
      in: IN_STEPS.map(() => 0),
    };
    let inMatch: Uint8Array | null = null;
    if (f.matches !== null) {
      inMatch = new Uint8Array(n);
      for (const id of f.matches) if (id >= 1 && id <= n) inMatch[id - 1] = 1;
    }
    const passes = new Uint8Array(n);
    const catSeen = new Int32Array(this.categorySize).fill(-1);
    let total = 0;

    for (let i = 0; i < n; i++) {
      if (inMatch !== null && inMatch[i] === 0) continue;
      if (f.owner >= 0 && this.owner[i] !== f.owner) continue;
      let mask = 0;
      let failed = 0;
      if (f.kind >= 0 && this.kind[i] !== f.kind) { mask |= BIT.kind; failed++; }
      if (f.status >= 0 && this.status[i] !== f.status) { mask |= BIT.status; failed++; }
      if (f.lang >= 0 && this.lang[i] !== f.lang) { mask |= BIT.lang; failed++; }
      if (f.license >= 0 && this.license[i] !== f.license) { mask |= BIT.license; failed++; }
      if (failed > 1) continue;
      const stars = this.stars[i] ?? -1;
      const lc = this.listCount[i] ?? 0;
      if (f.stars >= 0 && stars < f.stars) { mask |= BIT.stars; failed++; }
      if (f.in >= 0 && lc < f.in) { mask |= BIT.in; failed++; }
      if (failed > 1) continue;
      const t0 = this.topicStart[i] ?? 0;
      const t1 = this.topicStart[i + 1] ?? 0;
      if (f.topics.length > 0) {
        for (const want of f.topics) {
          let has = false;
          for (let t = t0; t < t1; t++) if (this.topicIds[t] === want) { has = true; break; }
          if (!has) { mask |= BIT.topic; failed++; break; }
        }
      }
      if (failed > 1) continue;
      const l0 = this.listStart[i] ?? 0;
      const l1 = this.listStart[i + 1] ?? 0;
      if (f.list >= 0) {
        let has = false;
        for (let l = l0; l < l1; l++) if (this.listIds[l] === f.list) { has = true; break; }
        if (!has) { mask |= BIT.list; failed++; }
      }
      if (f.category >= 0) {
        let has = false;
        for (let l = l0; l < l1; l++) if (this.listCategory[this.listIds[l] ?? 0] === f.category) { has = true; break; }
        if (!has) { mask |= BIT.category; failed++; }
      }
      if (failed > 1) continue;

      const all = mask === 0;
      if (all) {
        total++;
        passes[i] = 1;
      }
      if (all || mask === BIT.kind) inc(counts.kind, this.kind[i] ?? 0);
      if (all || mask === BIT.status) inc(counts.status, this.status[i] ?? 0);
      if (all || mask === BIT.lang) inc(counts.lang, this.lang[i] ?? 0);
      if (all || mask === BIT.license) inc(counts.license, this.license[i] ?? 0);
      if (all || mask === BIT.topic) for (let t = t0; t < t1; t++) inc(counts.topic, this.topicIds[t] ?? 0);
      if (all || mask === BIT.list) for (let l = l0; l < l1; l++) inc(counts.list, this.listIds[l] ?? 0);
      if (all || mask === BIT.category) {
        for (let l = l0; l < l1; l++) {
          const c = this.listCategory[this.listIds[l] ?? 0] ?? 0;
          if (catSeen[c] !== i) {
            catSeen[c] = i;
            inc(counts.category, c);
          }
        }
      }
      if (all || mask === BIT.stars) STAR_STEPS.forEach((s, k) => { if (stars >= s) counts.stars[k] = (counts.stars[k] ?? 0) + 1; });
      if (all || mask === BIT.in) IN_STEPS.forEach((s, k) => { if (lc >= s) counts.in[k] = (counts.in[k] ?? 0) + 1; });
    }

    const ids: number[] = [];
    const skip = (page - 1) * pageSize;
    let seen = 0;
    const take = (i: number): boolean => {
      if (passes[i] !== 1) return false;
      seen++;
      if (seen > skip) ids.push(i + 1);
      return ids.length >= pageSize;
    };
    if (sort === 'relevance' && f.matches !== null) {
      for (const id of f.matches) if (id >= 1 && id <= n && take(id - 1)) break;
    } else if (sort === 'lists' || sort === 'relevance') {
      for (let i = 0; i < n; i++) if (take(i)) break;
    } else {
      for (const i of this.orders[sort]) if (take(i)) break;
    }
    return { total, ids, counts };
  }
}

function inc(arr: Uint32Array, i: number): void {
  arr[i] = (arr[i] ?? 0) + 1;
}
