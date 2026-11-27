// pnpm build-site [--in out] [--out out]
// Reads the public files of the dataset and writes, under --out:
//   d1/load.sql      the whole database as SQL for D1 (DDL, then multi-row inserts), and d1/build.json;
//   site-assets/     the static files that ship with the Worker (assets, icons, facets.bin, terms.json, the translations
//                    in _data/i18n/{code}.json, sitemaps, robots, _headers);
//   site.db          the same load.sql run with node:sqlite in one transaction, for `pnpm serve` and the tests.
// Each is written beside its place first and moved there at the end.
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, renameSync, rmSync, statSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { categoryCoverage, readLanguage, summaryCoverage, TRANSLATIONS_DIR } from '../../translations.js';
import { LOCAL_ORIGIN, OWNER_ITEMS, SITE_NAME, TOPIC_STOP } from '../config.js';
import { encodeParam } from '../query.js';
import { OTHER_LOCALES } from '../i18n/locales.js';
import { encodeFacets } from '../facets-file.js';
import { alongside, type SectionEntries } from './alongside.js';
import { facetData } from './facet-data.js';
import { ftsRows } from './fts.js';
import { buildModel, readInput, type Model } from './load.js';
import { ownersOf } from './owners.js';
import { DDL, INDEX_ROWS } from './schema.js';
import { LoadWriter, type LoadStats, type SqlValue } from './sql.js';
import { headersFile, readAssets, readRootFiles, robots, sitemaps, writeFile, type AssetFile } from './static.js';

export interface BuildOptions {
  inDir: string;
  /** Where d1/, site-assets/ and site.db go. */
  outDir: string;
  /** The site's origin, for the sitemaps and robots.txt. */
  origin: string;
  /** Item URLs in one items-{n}.xml (tests). */
  sitemapChunk?: number;
  /** Override the hash used for item keys (tests). */
  hash?: (id: string) => string;
  /** Where translations/lists.{code}.json and categories.{code}.json are (default: this repository's). */
  translationsDir?: string;
}

/** What the build found of one language's translations, written into build.json. */
export interface TranslationCounts {
  summaries: { translated: number; missing: number; stale: number; unhashed: number; unknown: number };
  categories: { translated: number; missing: number; unknown: number };
  problems: string[];
}

/**
 * /_data/i18n/{code}.json for every language but English: category names by slug and our summaries by list slug.
 * A stale summary is still written (an old sentence in the reader's language beats a switch of language).
 */
export function i18nFiles(model: Pick<Model, 'lists' | 'categories'>, dir: string): {
  files: Map<string, string>;
  counts: Record<string, TranslationCounts>;
} {
  const english = new Map(model.lists.filter((l) => l.summary !== null).map((l) => [l.slug, l.summary ?? '']));
  const files = new Map<string, string>();
  const counts: Record<string, TranslationCounts> = {};
  for (const locale of OTHER_LOCALES) {
    const t = readLanguage(dir, locale);
    const categories: Record<string, string> = {};
    for (const c of model.categories) {
      const name = t.categories.get(c.name);
      if (name !== undefined && name.trim() !== '') categories[c.slug] = name;
    }
    const summaries: Record<string, string> = {};
    for (const l of model.lists) {
      const tr = t.lists.get(l.slug);
      if (l.summary !== null && tr !== undefined && tr.summary.trim() !== '') summaries[l.slug] = tr.summary;
    }
    files.set(`_data/i18n/${locale}.json`, JSON.stringify({ categories, summaries }));
    const s = summaryCoverage(english, t);
    const c = categoryCoverage(model.categories.map((x) => x.name), t);
    counts[locale] = {
      summaries: { translated: s.translated, missing: s.missing.length, stale: s.stale.length, unhashed: s.unhashed.length, unknown: s.unknown.length },
      categories: { translated: c.translated, missing: c.missing.length, unknown: c.unknown.length },
      problems: t.problems,
    };
  }
  return { files, counts };
}

export interface BuildResult {
  buildId: string;
  translations: Record<string, TranslationCounts>;
  ms: number;
  counts: Record<string, number>;
  load: LoadStats & { rowsWritten: number };
  paths: { loadSql: string; assets: string; db: string };
  bytes: { facets: number; terms: number; db: number };
}

const b = (v: boolean | null): number | null => (v === null ? null : v ? 1 : 0);

function countBy<T>(rows: readonly T[], key: (r: T) => string | null): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of rows) {
    const k = key(r);
    if (k !== null) out[k] = (out[k] ?? 0) + 1;
  }
  return out;
}

const SITE_DIR = fileURLToPath(new URL('../', import.meta.url));
const CODE_FILES = ['../../model.ts', '../../enums.ts', '../../canonical.ts'].map((f) => fileURLToPath(new URL(f, import.meta.url)));

/** Every file of the site's code, so a change of code is a new build id (and a new ETag). */
function codeHash(): string {
  const files = (d: string): string[] =>
    readdirSync(d)
      .sort()
      .flatMap((f) => (statSync(join(d, f)).isDirectory() ? files(join(d, f)) : [join(d, f)]));
  const h = createHash('sha256');
  for (const f of [...files(SITE_DIR), ...CODE_FILES]) h.update(f.slice(SITE_DIR.length)).update(readFileSync(f));
  return h.digest('hex');
}

/** Languages on the home page's line of them. */
export const TOP_LANGS = 12;

/** meta.top: what the home page shows without reading terms.json, the languages with the most items. */
export function topOf(model: Pick<Model, 'terms'>): { langs: [string, string, number][] } {
  const langs = model.terms
    .filter((t) => t.ns === 'lang')
    .sort((a, b) => b.itemCount - a.itemCount || a.label.localeCompare(b.label))
    .slice(0, TOP_LANGS)
    .map((t): [string, string, number] => [t.slug, t.label, t.itemCount]);
  return { langs };
}

/** At least this many items for a language, licence or kind page in browse.xml; a topic needs BROWSE_TOPIC. */
export const BROWSE_MIN = 20;
export const BROWSE_TOPIC = 50;

/**
 * The one-filter pages of /items offered in browse.xml: each well above the page's own thin threshold, so every
 * address listed is indexed. English only, like every /items page with a filter.
 */
export function browseAddresses(model: Pick<Model, 'terms'>, kinds: Readonly<Record<string, number>>): string[] {
  const out: string[] = [];
  for (const t of model.terms) {
    const enough = t.ns === 'topic' ? t.itemCount >= BROWSE_TOPIC && !TOPIC_STOP.has(t.slug) : t.itemCount >= BROWSE_MIN;
    if (enough) out.push(`/items?${t.ns}=${encodeParam(t.slug)}`);
  }
  for (const [kind, n] of Object.entries(kinds)) if (n >= BROWSE_MIN) out.push(`/items?kind=${encodeParam(kind)}`);
  return out;
}

/** Lists kept as related to a list, and the fewest projects two lists must share to be. */
export const RELATED_KEEP = 6;
export const RELATED_MIN_SHARED = 3;

/**
 * The lists most like each list, by the projects both name: [listId, shared] pairs, best first. The score is
 * shared / sqrt(itemsA × itemsB) over distinct items; a pair needs RELATED_MIN_SHARED in common; ties go to the
 * other list's stars (a lower id). One more column on the same rows, no rows of its own.
 */
export function relatedLists(listings: readonly { listId: number; itemId: number }[]): Map<number, [number, number][]> {
  const itemsOf = new Map<number, Set<number>>();
  const listsOf = new Map<number, Set<number>>();
  for (const l of listings) {
    let a = itemsOf.get(l.listId);
    if (!a) itemsOf.set(l.listId, (a = new Set<number>()));
    a.add(l.itemId);
    let b = listsOf.get(l.itemId);
    if (!b) listsOf.set(l.itemId, (b = new Set<number>()));
    b.add(l.listId);
  }
  const shared = new Map<number, Map<number, number>>();
  for (const lists of listsOf.values()) {
    if (lists.size < 2) continue;
    const ids = [...lists];
    for (const a of ids) {
      let m = shared.get(a);
      if (!m) shared.set(a, (m = new Map<number, number>()));
      for (const b of ids) if (b !== a) m.set(b, (m.get(b) ?? 0) + 1);
    }
  }
  const out = new Map<number, [number, number][]>();
  for (const [a, m] of shared) {
    const size = itemsOf.get(a)?.size ?? 0;
    const ranked = [...m]
      .filter(([, n]) => n >= RELATED_MIN_SHARED)
      .map(([b, n]) => ({ b, n, score: n / Math.sqrt(size * (itemsOf.get(b)?.size ?? 1)) }))
      .sort((x, y) => y.score - x.score || x.b - y.b)
      .slice(0, RELATED_KEEP);
    if (ranked.length > 0) out.set(a, ranked.map((r): [number, number] => [r.b, r.n]));
  }
  return out;
}

interface LoadInput {
  model: Model;
  meta: [string, string][];
  owners: ReturnType<typeof ownersOf>;
}

type Listed = [number, number, string | null, { text: string; url: string }[]];

/** The statements of load.sql, in order. */
function writeLoad(w: LoadWriter, { model, meta, owners }: LoadInput): void {
  const related = relatedLists(model.listings);
  for (const s of DDL) w.statement(s);
  w.insert('meta', ['key', 'value'], meta);
  w.insert(
    'category',
    ['id', 'name', 'slug', 'position', 'list_count'],
    model.categories.map((c) => [c.id, c.name, c.slug, c.position, c.listCount]),
  );
  w.insert(
    'list',
    ['id', 'slug', 'owner', 'repo', 'name', 'category_id', 'subcategory', 'summary', 'stars', 'pushed_day', 'archived',
      'license', 'status', 'reason', 'readme_path', 'readme_oid', 'items_made', 'section_count', 'item_id', 'position',
      'related'],
    model.lists.map((l) => [
      l.id, l.slug, l.owner, l.repo, l.name, l.categoryId, l.subcategory, l.summary, l.stars, l.pushedDay,
      b(l.archived), l.license, l.status, l.reason, l.readmePath, l.readmeOid, l.itemsMade, l.sectionCount,
      l.itemId, l.position, JSON.stringify(related.get(l.id) ?? []),
    ]),
  );
  w.insert(
    'section',
    ['id', 'list_id', 'path', 'title', 'depth', 'anchor', 'anchors', 'position', 'item_count'],
    model.sections.map((s) => [
      s.id, s.listId, JSON.stringify(s.path), s.title, s.path.length, s.anchor, JSON.stringify(s.anchors),
      s.position, s.itemCount,
    ]),
  );

  // Listed alongside: up to 12 ids per item, best first.
  const entries = new Map<number, { itemId: number; position: number }[]>();
  for (const l of model.listings) {
    let e = entries.get(l.sectionId);
    if (!e) entries.set(l.sectionId, (e = []));
    e.push({ itemId: l.itemId, position: l.position });
  }
  const sections: SectionEntries[] = [...entries.values()].map((e) => ({ entries: e.sort((a, c) => a.position - c.position) }));
  const along = new Map<number, number[]>();
  const rows = alongside(sections, (id) => {
    const it = model.items[id - 1];
    return { listCount: it?.listCount ?? 0, stars: it?.stars ?? null };
  });
  for (const r of rows) {
    let a = along.get(r.itemId);
    if (!a) along.set(r.itemId, (a = []));
    a.push(r.otherId);
  }

  // Where each item is listed: listings come list by list in id order (the lists' stars), then by position.
  const listed = new Map<number, Listed[]>();
  for (const l of model.listings) {
    const item = model.items[l.itemId - 1];
    if (!item) continue;
    const shown = l.name.trim() !== '' && l.name.trim().toLowerCase() !== item.name.toLowerCase() ? l.name : null;
    let a = listed.get(l.itemId);
    if (!a) listed.set(l.itemId, (a = []));
    a.push([l.listId, l.sectionId, shown, l.extraLinks]);
  }

  const term = new Map(model.terms.map((t) => [t.id, [t.slug, t.label] as const]));
  const pair = (id: number | null): readonly [string, string] | null => (id === null ? null : (term.get(id) ?? null));
  function* items(): Generator<SqlValue[]> {
    for (const i of model.items) {
      const tags = {
        lang: pair(i.langId),
        license: pair(i.licenseId),
        topics: i.topicIds.map((t) => term.get(t)).filter((t) => t !== undefined),
      };
      yield [
        i.id, i.key, i.url, i.kind, i.host, i.name, JSON.stringify(i.aka), i.owner, i.repoName, i.stars, i.pushedDay,
        b(i.archived), b(i.fork), i.langId, i.licenseId, i.status, i.renamedFrom, i.listCount, i.pop, i.listId,
        i.indexable ? 1 : 0, JSON.stringify(tags), JSON.stringify(along.get(i.id) ?? []),
        JSON.stringify(listed.get(i.id) ?? []),
      ];
    }
  }
  w.insert(
    'item',
    ['id', 'key', 'url', 'kind', 'host', 'name', 'aka', 'owner', 'repo_name', 'stars', 'pushed_day', 'archived', 'fork',
      'lang_id', 'license_id', 'status', 'renamed_from', 'list_count', 'pop', 'list_id', 'indexable', 'tags', 'alongside',
      'listed'],
    items(),
  );
  w.insert(
    'listing',
    ['list_id', 'position', 'section_id', 'item_id', 'name', 'parent_name', 'extra_links'],
    model.listings.map((l) => [l.listId, l.position, l.sectionId, l.itemId, l.name, l.parentName, JSON.stringify(l.extraLinks)]),
  );
  const itemsOf = new Map<string, number[]>();
  for (const it of model.items) {
    if (it.owner === null) continue;
    let a = itemsOf.get(it.owner);
    if (!a) itemsOf.set(it.owner, (a = []));
    if (a.length < OWNER_ITEMS) a.push(it.id);
  }
  w.insert(
    'owner',
    ['login', 'display', 'list_count', 'item_count', 'item_ids'],
    owners.map((o) => [o.login, o.display, o.listCount, o.itemCount, JSON.stringify(itemsOf.get(o.login) ?? [])]),
  );
  w.insert('redirect', ['from_path', 'to_path'], model.redirects);

  // Full-text search, then each table merged into one segment.
  const termLabel = new Map(model.terms.map((t) => [t.id, t.label]));
  const fts = ftsRows(model.items, model.lists, model.sections, model.listings, model.categories, (id) => termLabel.get(id) ?? '');
  w.insert(
    'item_fts',
    ['rowid', 'name', 'aka', 'ident', 'topics', 'sections'],
    fts.items.map((r) => [r.id, r.name, r.aka, r.ident, r.topics, r.sections]),
  );
  w.insert(
    'list_fts',
    ['rowid', 'name', 'repo', 'summary', 'category', 'sections'],
    fts.lists.map((r) => [r.id, r.name, r.repo, r.summary, r.category, r.sections]),
  );
  w.insert('section_fts', ['rowid', 'title', 'path'], fts.sections.map((r) => [r.id, r.title, r.path]));
  for (const t of ['item_fts', 'list_fts', 'section_fts']) w.statement(`INSERT INTO ${t}(${t}) VALUES('optimize')`);
}

/** An estimate of the rows a load writes: each row, each index entry it adds, and each full-text document. */
export function rowsWritten(stats: LoadStats): number {
  let n = 0;
  for (const [table, rows] of Object.entries(stats.rows)) n += rows * (1 + (INDEX_ROWS[table] ?? 0));
  return n;
}

function swap(tmp: string, final: string): void {
  rmSync(final, { recursive: true, force: true });
  renameSync(tmp, final);
}

function removeDb(path: string): void {
  for (const p of [path, `${path}-journal`, `${path}-wal`, `${path}-shm`]) rmSync(p, { force: true });
}

export async function buildSite(options: BuildOptions): Promise<BuildResult> {
  const started = performance.now();
  const origin = options.origin.replace(/\/+$/, '');
  const raw = await readInput(options.inDir);
  const model = buildModel(raw, options.hash);
  const owners = ownersOf(model.lists, model.items);
  const counts = {
    lists: model.lists.length,
    items: model.items.length,
    listings: model.listings.length,
    sections: model.sections.length,
    categories: model.categories.length,
    owners: owners.length,
    terms: model.terms.length,
  };
  const coverage = {
    listsByStatus: countBy(model.lists, (l) => l.status),
    itemsByKind: countBy(model.items, (i) => i.kind),
    reposByStatus: countBy(model.items, (i) => i.status),
    itemsInTwoOrMore: model.items.filter((i) => i.listCount >= 2).length,
  };
  const assets: AssetFile[] = readAssets(join(SITE_DIR, 'assets'));
  const assetPath = (name: string): string => {
    const a = assets.find((x) => x.name === name);
    if (!a) throw new Error(`missing asset ${name}`);
    return a.path;
  };
  const assetPaths = {
    css: assetPath('site.css'), quick: assetPath('quick.js'), listfilter: assetPath('listfilter.js'), og: assetPath('og.png'),
  };
  const rootFiles = readRootFiles(join(SITE_DIR, 'assets'), SITE_NAME);
  // The translations are part of the build: a changed one must change the ETag.
  const i18n = i18nFiles(model, options.translationsDir ?? TRANSLATIONS_DIR);
  const i18nHash = createHash('sha256');
  for (const [path, body] of i18n.files) i18nHash.update(path).update(body);
  const buildId = createHash('sha256')
    .update(`${model.dataDate}\n${JSON.stringify(counts)}\n${assets.map((a) => a.hash).join(' ')}\n${codeHash()}\n${i18nHash.digest('hex')}`)
    .digest('hex')
    .slice(0, 12);
  const meta: [string, string][] = [
    ['build_id', buildId],
    ['data_finished', model.dataDate],
    ['counts', JSON.stringify(counts)],
    ['coverage', JSON.stringify(coverage)],
    ['assets', JSON.stringify(assetPaths)],
    ['top', JSON.stringify(topOf(model))],
  ];

  const tag = `tmp-${process.pid}`;
  const d1Dir = join(options.outDir, 'd1');
  const assetsDir = join(options.outDir, 'site-assets');
  const dbPath = join(options.outDir, 'site.db');
  const d1Tmp = `${d1Dir}.${tag}`;
  const assetsTmp = `${assetsDir}.${tag}`;
  const dbTmp = `${dbPath}.${tag}`;
  const clean = (): void => {
    for (const p of [d1Tmp, assetsTmp]) rmSync(p, { recursive: true, force: true });
    removeDb(dbTmp);
  };
  clean();

  try {
    // The load.
    const chunks: string[] = [];
    const w = new LoadWriter((t) => chunks.push(t));
    writeLoad(w, { model, meta, owners });
    const sql = chunks.join('');
    writeFile(d1Tmp, 'load.sql', sql);
    const load = { ...w.stats, rowsWritten: rowsWritten(w.stats) };
    writeFile(
      d1Tmp,
      'build.json',
      `${JSON.stringify({ buildId, dataFinished: model.dataDate, counts, load, translations: i18n.counts }, null, 2)}\n`,
    );

    // The same file, in one transaction, for local use.
    const db = new DatabaseSync(dbTmp);
    try {
      db.exec('PRAGMA journal_mode = OFF; PRAGMA synchronous = OFF;');
      db.exec('BEGIN');
      db.exec(sql);
      db.exec('COMMIT');
    } finally {
      db.close();
    }

    // The static files.
    for (const a of assets) writeFile(assetsTmp, a.path, a.body);
    for (const [path, body] of rootFiles) writeFile(assetsTmp, path, body);
    for (const [path, body] of i18n.files) writeFile(assetsTmp, path, body);
    const facets = writeFile(assetsTmp, '_data/facets.bin', encodeFacets(facetData(model)));
    const terms = writeFile(
      assetsTmp,
      '_data/terms.json',
      JSON.stringify(model.terms.map((t) => [t.id, t.ns, t.slug, t.label, t.itemCount])),
    );
    const files = sitemaps({
      origin,
      dataDay: model.dataDate.slice(0, 10),
      categories: model.categories.map((c) => c.slug),
      lists: model.lists.map((l) => ({ slug: l.slug, pushedDay: l.pushedDay })),
      owners: owners.filter((o) => o.listCount > 0 || o.itemCount >= 2).map((o) => o.login),
      browse: browseAddresses(model, coverage.itemsByKind),
      itemKeys: model.items.filter((i) => i.indexable).map((i) => i.key),
      ...(options.sitemapChunk === undefined ? {} : { chunk: options.sitemapChunk }),
    });
    for (const [path, body] of files) writeFile(assetsTmp, path, body);
    writeFile(assetsTmp, 'robots.txt', robots(origin));
    writeFile(assetsTmp, '_headers', headersFile());

    swap(d1Tmp, d1Dir);
    swap(assetsTmp, assetsDir);
    removeDb(dbPath);
    renameSync(dbTmp, dbPath);
    return {
      buildId,
      translations: i18n.counts,
      ms: performance.now() - started,
      counts,
      load,
      paths: { loadSql: join(d1Dir, 'load.sql'), assets: assetsDir, db: dbPath },
      bytes: { facets, terms, db: statSync(dbPath).size },
    };
  } catch (e) {
    clean();
    throw e;
  }
}

const mb = (n: number): string => `${(n / 1e6).toFixed(1)} MB`;

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: { in: { type: 'string', default: 'out' }, out: { type: 'string' } },
    strict: true,
  });
  const inDir = values.in;
  const r = await buildSite({ inDir, outDir: values.out ?? inDir, origin: process.env.SITE_ORIGIN ?? LOCAL_ORIGIN });
  console.log(`build ${r.buildId} in ${(r.ms / 1000).toFixed(1)} s: ${JSON.stringify(r.counts)}`);
  console.log(
    `${r.paths.loadSql}: ${mb(r.load.bytes)}, ${r.load.statements} statements (longest ${r.load.longest} bytes), ` +
      `about ${r.load.rowsWritten.toLocaleString('en-US')} rows written`,
  );
  console.log(`${r.paths.assets}: facets.bin ${mb(r.bytes.facets)}, terms.json ${mb(r.bytes.terms)}`);
  console.log(`${r.paths.db}: ${mb(r.bytes.db)}`);
  const t = Object.entries(r.translations).map(
    ([l, c]) => `${l} ${c.summaries.translated}/${c.summaries.translated + c.summaries.missing} (${c.summaries.stale} stale, ${c.summaries.unhashed} without enHash)`,
  );
  console.log(`translated summaries: ${t.join(', ')}`);
  for (const [l, c] of Object.entries(r.translations)) for (const p of c.problems) console.log(`${l}: ${p}`);
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e: unknown) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  });
}
