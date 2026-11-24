// pnpm build-site [--in out] [--db out/site.db]
// Reads the public files of the dataset and writes the site's database, to a temporary file first.
import { createHash } from 'node:crypto';
import { rmSync, renameSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { alongside, type SectionEntries } from './alongside.js';
import { ftsRows } from './fts.js';
import { buildModel, readInput, type Model } from './load.js';
import { ownersOf } from './owners.js';
import { DDL } from './schema.js';

export interface BuildOptions {
  inDir: string;
  dbPath: string;
  /** Override the hash used for item keys (tests). */
  hash?: (id: string) => string;
}

export interface BuildResult { dbPath: string; ms: number; counts: Record<string, number> }

const b = (v: boolean | null): number | null => (v === null ? null : v ? 1 : 0);

function countBy<T>(rows: readonly T[], key: (r: T) => string | null): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of rows) {
    const k = key(r);
    if (k !== null) out[k] = (out[k] ?? 0) + 1;
  }
  return out;
}

function write(db: DatabaseSync, model: Model): Record<string, number> {
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

  const run = (sql: string, rows: readonly (readonly (string | number | null)[])[]): void => {
    const st = db.prepare(sql);
    for (const r of rows) st.run(...r);
  };

  db.exec('BEGIN');
  const buildId = createHash('sha256').update(`${model.dataDate}\n${JSON.stringify(counts)}`).digest('hex').slice(0, 12);
  run('INSERT INTO meta(key, value) VALUES (?, ?)', [
    ['build_id', buildId],
    ['data_finished', model.dataDate],
    ['counts', JSON.stringify(counts)],
    ['coverage', JSON.stringify(coverage)],
  ]);
  run(
    'INSERT INTO category(id, name, slug, position, list_count) VALUES (?, ?, ?, ?, ?)',
    model.categories.map((c) => [c.id, c.name, c.slug, c.position, c.listCount]),
  );
  run(
    `INSERT INTO list(id, slug, owner, repo, name, category_id, subcategory, summary, stars, pushed_day, archived,
      license, status, reason, readme_path, readme_oid, items_made, section_count, item_id, position)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    model.lists.map((l) => [
      l.id, l.slug, l.owner, l.repo, l.name, l.categoryId, l.subcategory, l.summary, l.stars, l.pushedDay,
      b(l.archived), l.license, l.status, l.reason, l.readmePath, l.readmeOid, l.itemsMade, l.sectionCount,
      l.itemId, l.position,
    ]),
  );
  run(
    `INSERT INTO section(id, list_id, path, title, depth, anchor, anchors, position, item_count)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    model.sections.map((s) => [
      s.id, s.listId, JSON.stringify(s.path), s.title, s.path.length, s.anchor, JSON.stringify(s.anchors),
      s.position, s.itemCount,
    ]),
  );
  run(
    `INSERT INTO item(id, key, url, kind, host, name, aka, owner, repo_name, stars, pushed_day, archived, fork,
      lang_id, license_id, status, renamed_from, list_count, pop, list_id, indexable)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    model.items.map((i) => [
      i.id, i.key, i.url, i.kind, i.host, i.name, JSON.stringify(i.aka), i.owner, i.repoName, i.stars, i.pushedDay,
      b(i.archived), b(i.fork), i.langId, i.licenseId, i.status, i.renamedFrom, i.listCount, i.pop, i.listId,
      i.indexable ? 1 : 0,
    ]),
  );
  run(
    `INSERT INTO listing(id, list_id, section_id, item_id, position, name, parent_name, extra_links)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    model.listings.map((l) => [
      l.id, l.listId, l.sectionId, l.itemId, l.position, l.name, l.parentName, JSON.stringify(l.extraLinks),
    ]),
  );
  run(
    'INSERT INTO term(id, ns, slug, label, item_count) VALUES (?, ?, ?, ?, ?)',
    model.terms.map((t) => [t.id, t.ns, t.slug, t.label, t.itemCount]),
  );
  run(
    'INSERT INTO item_topic(item_id, term_id) VALUES (?, ?)',
    model.items.flatMap((i) => i.topicIds.map((t) => [i.id, t])),
  );
  run(
    'INSERT INTO owner(login, display, list_count, item_count) VALUES (?, ?, ?, ?)',
    owners.map((o) => [o.login, o.display, o.listCount, o.itemCount]),
  );
  run('INSERT INTO redirect(from_path, to_path) VALUES (?, ?)', model.redirects);

  // Listed alongside.
  const entries = new Map<number, { itemId: number; position: number }[]>();
  for (const l of model.listings) {
    let e = entries.get(l.sectionId);
    if (!e) entries.set(l.sectionId, (e = []));
    e.push({ itemId: l.itemId, position: l.position });
  }
  const sections: SectionEntries[] = [...entries.values()].map((e) => ({
    entries: e.sort((a, c) => a.position - c.position),
  }));
  const itemById = model.items;
  const rows = alongside(sections, (id) => {
    const it = itemById[id - 1];
    return { listCount: it?.listCount ?? 0, stars: it?.stars ?? null };
  });
  run(
    'INSERT INTO alongside(item_id, rank, other_id, score) VALUES (?, ?, ?, ?)',
    rows.map((r) => [r.itemId, r.rank, r.otherId, r.score]),
  );

  // Full-text search.
  const termLabel = new Map(model.terms.map((t) => [t.id, t.label]));
  const fts = ftsRows(model.items, model.lists, model.sections, model.listings, model.categories, (id) =>
    termLabel.get(id) ?? '',
  );
  run(
    'INSERT INTO item_fts(rowid, name, aka, ident, topics, sections) VALUES (?, ?, ?, ?, ?, ?)',
    fts.items.map((r) => [r.id, r.name, r.aka, r.ident, r.topics, r.sections]),
  );
  run(
    'INSERT INTO list_fts(rowid, name, repo, summary, category, sections) VALUES (?, ?, ?, ?, ?, ?)',
    fts.lists.map((r) => [r.id, r.name, r.repo, r.summary, r.category, r.sections]),
  );
  run('INSERT INTO section_fts(rowid, title, path) VALUES (?, ?, ?)', fts.sections.map((r) => [r.id, r.title, r.path]));
  db.exec('COMMIT');
  return { ...counts, alongside: rows.length };
}

function removeFiles(path: string): void {
  for (const p of [path, `${path}-journal`, `${path}-wal`, `${path}-shm`]) rmSync(p, { force: true });
}

export async function buildSite(options: BuildOptions): Promise<BuildResult> {
  const started = performance.now();
  const raw = await readInput(options.inDir);
  const model = buildModel(raw, options.hash);
  const tmp = `${options.dbPath}.tmp-${process.pid}`;
  removeFiles(tmp);
  const db = new DatabaseSync(tmp);
  let counts: Record<string, number>;
  try {
    db.exec('PRAGMA journal_mode = OFF; PRAGMA synchronous = OFF;');
    db.exec(DDL);
    counts = write(db, model);
    db.exec("INSERT INTO item_fts(item_fts) VALUES ('optimize')");
    db.exec("INSERT INTO list_fts(list_fts) VALUES ('optimize')");
    db.exec("INSERT INTO section_fts(section_fts) VALUES ('optimize')");
    db.exec('VACUUM');
    db.exec('ANALYZE');
    db.exec('PRAGMA optimize');
  } catch (e) {
    db.close();
    removeFiles(tmp);
    throw e;
  }
  db.close();
  renameSync(tmp, options.dbPath);
  return { dbPath: options.dbPath, ms: performance.now() - started, counts };
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: { in: { type: 'string', default: 'out' }, db: { type: 'string' } },
    strict: true,
  });
  const inDir = values.in;
  const dbPath = values.db ?? `${inDir}/site.db`;
  const result = await buildSite({ inDir, dbPath });
  console.log(`wrote ${result.dbPath} in ${(result.ms / 1000).toFixed(1)} s: ${JSON.stringify(result.counts)}`);
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e: unknown) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  });
}
