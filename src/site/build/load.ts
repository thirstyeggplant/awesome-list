// Reads the public files of out/ and gives every row the shape and the id it has in the database.
// Reads the four files in INPUT_FILES and nothing else.
import { createReadStream } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createInterface } from 'node:readline';
import type { z } from 'zod';
import { PublicItemRow, PublicListingRow, PublicListRow } from '../../model.js';
import { anchorsByPath, sectionOutline, slugify } from '../keys.js';
import { itemKeys, shortHash } from './item-keys.js';

/** The list whose entries are the other lists; its order is the index's order. */
export const INDEX_LIST = 'sindresorhus/awesome';

export type PublicList = z.infer<typeof PublicListRow>;
export type PublicItem = z.infer<typeof PublicItemRow>;
export type PublicListing = z.infer<typeof PublicListingRow>;

/** The three files the build reads, and the run's record for the data date. Nothing else. */
export const INPUT_FILES = ['lists.jsonl', 'items.jsonl', 'listings.jsonl', 'run.json'] as const;

async function readJsonl<T>(path: string, schema: z.ZodType<T>): Promise<T[]> {
  const rows: T[] = [];
  const lines = createInterface({ input: createReadStream(path, 'utf8'), crlfDelay: Infinity });
  let n = 0;
  for await (const line of lines) {
    n++;
    if (line.trim() === '') continue;
    const parsed = schema.safeParse(JSON.parse(line));
    if (!parsed.success) throw new Error(`${path}:${n}: ${parsed.error.message}`);
    rows.push(parsed.data);
  }
  return rows;
}

export interface Raw {
  lists: PublicList[];
  items: PublicItem[];
  listings: PublicListing[];
  /** When the data was finished, as an ISO time. */
  dataDate: string;
}

export async function readInput(inDir: string): Promise<Raw> {
  const [lists, items, listings, run] = await Promise.all([
    readJsonl(join(inDir, 'lists.jsonl'), PublicListRow),
    readJsonl(join(inDir, 'items.jsonl'), PublicItemRow),
    readJsonl(join(inDir, 'listings.jsonl'), PublicListingRow),
    readFile(join(inDir, 'run.json'), 'utf8'),
  ]);
  const finished = (JSON.parse(run) as { finished?: unknown }).finished;
  if (typeof finished !== 'string') throw new Error('run.json has no "finished" time');
  return { lists, items, listings, dataDate: finished };
}

export function dayOf(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : Math.floor(t / 86_400_000);
}

export interface Category { id: number; name: string; slug: string; position: number; listCount: number }

export interface List {
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
  askedAs: string;
}

export interface Section {
  id: number;
  listId: number;
  path: string[];
  title: string;
  anchor: string;
  /** The anchor of each prefix of the path, outermost first. */
  anchors: string[];
  position: number;
  itemCount: number;
}

export interface Item {
  id: number;
  key: string;
  url: string;
  kind: string;
  host: string;
  name: string;
  aka: string[];
  owner: string | null;
  ownerDisplay: string | null;
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
  pop: number;
  listId: number | null;
  indexable: boolean;
  topicIds: number[];
}

export interface Listing {
  id: number;
  listId: number;
  sectionId: number;
  itemId: number;
  position: number;
  name: string;
  parentName: string | null;
  extraLinks: { text: string; url: string }[];
}

export interface Term { id: number; ns: 'lang' | 'license' | 'topic'; slug: string; label: string; itemCount: number }

export interface Model {
  dataDate: string;
  categories: Category[];
  lists: List[];
  sections: Section[];
  items: Item[];
  listings: Listing[];
  terms: Term[];
  redirects: [string, string][];
}

/** Items: named by more lists first, then more stars (none last), then name, then address. */
export function compareItems(
  a: { listCount: number; stars: number | null; name: string; url: string },
  b: { listCount: number; stars: number | null; name: string; url: string },
): number {
  if (a.listCount !== b.listCount) return b.listCount - a.listCount;
  const sa = a.stars ?? -1;
  const sb = b.stars ?? -1;
  if (sa !== sb) return sb - sa;
  const na = a.name.toLowerCase();
  const nb = b.name.toLowerCase();
  if (na !== nb) return na < nb ? -1 : 1;
  return a.url < b.url ? -1 : a.url > b.url ? 1 : 0;
}

export function popOf(listCount: number, stars: number | null): number {
  return 1 + 0.35 * Math.log(Math.max(1, listCount)) + 0.06 * Math.log(1 + Math.max(0, stars ?? 0));
}

/** The host and path of an address, for an item no list names. */
function hostAndPath(url: string, host: string): string {
  try {
    const u = new URL(url);
    return `${host}${u.pathname.replace(/\/+$/, '')}`;
  } catch {
    return host;
  }
}

/** The name the lists use most (a tie goes to the list with more stars), and up to 5 others. */
export function namesOf(
  uses: readonly { name: string; listStars: number }[],
  fallback: string,
): { name: string; others: string[] } {
  const byName = new Map<string, { name: string; count: number; stars: number }>();
  for (const u of uses) {
    const name = u.name.trim();
    if (name === '') continue;
    const k = name.toLowerCase();
    const e = byName.get(k);
    if (e) {
      e.count++;
      e.stars = Math.max(e.stars, u.listStars);
    } else byName.set(k, { name, count: 1, stars: u.listStars });
  }
  const ranked = [...byName.values()].sort(
    (a, b) => b.count - a.count || b.stars - a.stars || (a.name < b.name ? -1 : a.name > b.name ? 1 : 0),
  );
  const first = ranked[0];
  if (!first) return { name: fallback, others: [] };
  return { name: first.name, others: ranked.slice(1, 6).map((e) => e.name) };
}

function others(names: readonly string[], name: string): string[] {
  const seen = new Set([name.toLowerCase()]);
  const out: string[] = [];
  for (const n of names) {
    if (seen.has(n.toLowerCase())) continue;
    seen.add(n.toLowerCase());
    out.push(n);
    if (out.length === 5) break;
  }
  return out;
}

export function buildModel(raw: Raw, hash: (id: string) => string = shortHash): Model {
  const listById = new Map(raw.lists.map((l) => [l.id, l]));

  // The index's order: categories and lists as the index list names them.
  const indexListings = raw.listings
    .filter((l) => l.listId === INDEX_LIST)
    .sort((a, b) => a.position - b.position);
  const catOrder: string[] = [];
  const listPos = new Map<string, number>();
  for (const l of indexListings) {
    const cat = l.section[0];
    if (cat !== undefined && !catOrder.includes(cat)) catOrder.push(cat);
    const id = l.itemId.startsWith('https://github.com/') ? l.itemId.slice('https://github.com/'.length) : null;
    if (id !== null && listById.has(id) && !listPos.has(id)) listPos.set(id, listPos.size);
  }
  const catNames = [...new Set(raw.lists.map((l) => l.category ?? 'Other'))];
  const orderedCats = [
    ...catOrder.filter((c) => catNames.includes(c)),
    ...catNames.filter((c) => !catOrder.includes(c)).sort(),
  ];
  const categories: Category[] = orderedCats.map((name, i) => ({
    id: i + 1,
    name,
    slug: slugify(name),
    position: i,
    listCount: raw.lists.filter((l) => (l.category ?? 'Other') === name).length,
  }));
  const catId = new Map(categories.map((c) => [c.name, c.id]));
  const nameOfList = (l: PublicList): string => l.nameInIndex ?? l.id.split('/')[1] ?? l.id;
  const unplaced = raw.lists
    .filter((l) => !listPos.has(l.id))
    .sort((a, b) => nameOfList(a).localeCompare(nameOfList(b)));
  for (const l of unplaced) listPos.set(l.id, listPos.size);

  // Items: names from the listings, then ids in the default order.
  const usesByItem = new Map<string, { name: string; listStars: number }[]>();
  for (const l of raw.listings) {
    const stars = listById.get(l.listId)?.stars ?? 0;
    let uses = usesByItem.get(l.itemId);
    if (!uses) usesByItem.set(l.itemId, (uses = []));
    uses.push({ name: l.name, listStars: stars });
  }

  const drafts = raw.items.map((it) => {
    const r = it.repo ?? null;
    const named = namesOf(usesByItem.get(it.id) ?? [], hostAndPath(it.id, it.host));
    const [ownerDisplay = null, repoName = null] = r ? r.nameWithOwner.split('/') : [];
    const name = repoName ?? named.name;
    const aka = others([named.name, ...named.others], name);
    return { it, r, name, aka, ownerDisplay, repoName, stars: r?.stars ?? null, listCount: it.listCount, url: it.id };
  });
  drafts.sort(compareItems);
  const keys = itemKeys(drafts.map((d) => ({ id: d.it.id, nameWithOwner: d.r?.nameWithOwner ?? null })), hash);
  const itemIdOf = new Map(drafts.map((d, i) => [d.it.id, i + 1]));

  // Terms.
  const termCounts = new Map<string, { ns: Term['ns']; label: string; count: number }>();
  const bump = (ns: Term['ns'], label: string): void => {
    const k = `${ns}\0${label}`;
    const e = termCounts.get(k);
    if (e) e.count++;
    else termCounts.set(k, { ns, label, count: 1 });
  };
  for (const d of drafts) {
    if (!d.r) continue;
    if (d.r.language) bump('lang', d.r.language);
    if (d.r.license) bump('license', d.r.license);
    for (const t of new Set(d.r.topics)) bump('topic', t);
  }
  const terms: Term[] = [];
  const termId = new Map<string, number>();
  const slugsTaken = new Set<string>();
  const sortedTerms = [...termCounts.values()].sort(
    (a, b) => a.ns.localeCompare(b.ns) || b.count - a.count || a.label.localeCompare(b.label),
  );
  for (const t of sortedTerms) {
    const base = slugify(t.label) || 'x';
    let slug = base;
    for (let n = 2; slugsTaken.has(`${t.ns}:${slug}`); n++) slug = `${base}-${n}`;
    slugsTaken.add(`${t.ns}:${slug}`);
    const id = terms.length + 1;
    terms.push({ id, ns: t.ns, slug, label: t.label, itemCount: t.count });
    termId.set(`${t.ns}\0${t.label}`, id);
  }

  // Lists: ids by stars, then items.
  const rankedLists = [...raw.lists].sort(
    (a, b) => (b.stars ?? -1) - (a.stars ?? -1) || b.itemsMade - a.itemsMade || (a.id < b.id ? -1 : 1),
  );
  const listIdOf = new Map(rankedLists.map((l, i) => [l.id, i + 1]));

  // Sections and listings, list by list in id order.
  const listingsByList = new Map<string, PublicListing[]>();
  for (const l of raw.listings) {
    let a = listingsByList.get(l.listId);
    if (!a) listingsByList.set(l.listId, (a = []));
    a.push(l);
  }
  const sections: Section[] = [];
  const listings: Listing[] = [];
  const sectionCount = new Map<string, number>();
  for (const l of rankedLists) {
    const own = (listingsByList.get(l.id) ?? []).sort((a, b) => a.position - b.position);
    const order: string[] = [];
    const groups = new Map<string, PublicListing[]>();
    for (const e of own) {
      const k = JSON.stringify(e.section);
      let g = groups.get(k);
      if (!g) {
        groups.set(k, (g = []));
        order.push(k);
      }
      g.push(e);
    }
    const paths = order.map((k) => JSON.parse(k) as string[]);
    const anchors = anchorsByPath(sectionOutline(paths));
    sectionCount.set(l.id, paths.length);
    paths.forEach((path, position) => {
      const id = sections.length + 1;
      const prefixAnchors = path.map((_, i) => anchors.get(JSON.stringify(path.slice(0, i + 1))) ?? 'section');
      const entries = groups.get(order[position] ?? '') ?? [];
      sections.push({
        id,
        listId: listIdOf.get(l.id) ?? 0,
        path,
        title: path[path.length - 1] ?? '',
        anchor: prefixAnchors[prefixAnchors.length - 1] ?? 'entries',
        anchors: prefixAnchors,
        position,
        itemCount: entries.length,
      });
      for (const e of entries) {
        const itemId = itemIdOf.get(e.itemId);
        if (itemId === undefined) throw new Error(`listing in ${e.listId} names an unknown item ${e.itemId}`);
        listings.push({
          id: listings.length + 1,
          listId: listIdOf.get(l.id) ?? 0,
          sectionId: id,
          itemId,
          position: e.position,
          name: e.name,
          parentName: e.parentName ?? null,
          extraLinks: e.extraLinks,
        });
      }
    });
  }

  const lists: List[] = rankedLists.map((l, i) => {
    const [owner = '', repo = ''] = l.id.split('/');
    return {
      id: i + 1,
      slug: l.id,
      owner,
      repo,
      name: nameOfList(l),
      categoryId: catId.get(l.category ?? 'Other') ?? null,
      subcategory: l.subcategory,
      summary: l.summary,
      stars: l.stars,
      pushedDay: dayOf(l.pushedAt),
      archived: l.archived,
      license: l.license,
      status: l.status,
      reason: l.reason ?? null,
      readmePath: l.readmePath,
      readmeOid: l.readmeOid,
      itemsMade: l.itemsMade,
      sectionCount: sectionCount.get(l.id) ?? 0,
      itemId: itemIdOf.get(`https://github.com/${l.id}`) ?? null,
      position: listPos.get(l.id) ?? 0,
      askedAs: l.askedAs,
    };
  });
  const listOfItem = new Map(lists.filter((l) => l.itemId !== null).map((l) => [l.itemId, l.id]));

  const items: Item[] = drafts.map((d, i) => {
    const id = i + 1;
    const r = d.r;
    return {
      id,
      key: keys[i] ?? '',
      url: d.it.id,
      kind: d.it.kind,
      host: d.it.host,
      name: d.name,
      aka: d.aka,
      owner: d.ownerDisplay?.toLowerCase() ?? null,
      ownerDisplay: d.ownerDisplay,
      repoName: d.repoName,
      stars: d.stars,
      pushedDay: dayOf(r?.pushedAt),
      archived: r?.archived ?? null,
      fork: r?.fork ?? null,
      langId: r?.language ? (termId.get(`lang\0${r.language}`) ?? null) : null,
      licenseId: r?.license ? (termId.get(`license\0${r.license}`) ?? null) : null,
      status: r?.status ?? null,
      renamedFrom: r?.renamedFrom ?? null,
      listCount: d.listCount,
      pop: popOf(d.listCount, d.stars),
      listId: listOfItem.get(id) ?? null,
      indexable: r !== null || d.listCount >= 2,
      topicIds: r ? [...new Set(r.topics)].map((t) => termId.get(`topic\0${t}`) ?? 0).filter((t) => t > 0) : [],
    };
  });

  // Redirects: renamed repositories and renamed lists, unless the old address is taken.
  const taken = new Set(items.map((it) => `/${it.key}`));
  const redirects = new Map<string, string>();
  for (const it of items) {
    if (it.renamedFrom === null || it.repoName === null) continue;
    const from = `/gh/${it.renamedFrom.toLowerCase()}`;
    const to = `/${it.key}`;
    if (from !== to && !taken.has(from) && !redirects.has(from)) redirects.set(from, to);
  }
  const listSlugs = new Set(lists.map((l) => l.slug));
  for (const l of lists) {
    const old = l.askedAs.toLowerCase();
    if (old !== l.slug && !listSlugs.has(old)) redirects.set(`/lists/${old}`, `/lists/${l.slug}`);
  }

  return {
    dataDate: raw.dataDate,
    categories,
    lists,
    sections,
    items,
    listings,
    terms,
    redirects: [...redirects],
  };
}
