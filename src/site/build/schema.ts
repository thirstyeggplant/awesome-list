// The tables of the site's database, the same in D1 and in out/site.db. See docs/site.md, "The database".
// No PRAGMA here: D1 refuses one in an import.

export const DDL = [
  'CREATE TABLE meta(key TEXT PRIMARY KEY, value TEXT NOT NULL)',
  `CREATE TABLE category(id INTEGER PRIMARY KEY, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE,
  position INTEGER NOT NULL, list_count INTEGER NOT NULL)`,
  `CREATE TABLE list(id INTEGER PRIMARY KEY, slug TEXT NOT NULL UNIQUE, owner TEXT NOT NULL, repo TEXT NOT NULL,
  name TEXT NOT NULL, category_id INTEGER, subcategory TEXT, summary TEXT, stars INTEGER, pushed_day INTEGER,
  archived INTEGER, license TEXT, status TEXT NOT NULL, reason TEXT, readme_path TEXT, readme_oid TEXT,
  items_made INTEGER NOT NULL, section_count INTEGER NOT NULL, item_id INTEGER, position INTEGER NOT NULL,
  related TEXT NOT NULL DEFAULT '[]')`,
  `CREATE TABLE section(id INTEGER PRIMARY KEY, list_id INTEGER NOT NULL, path TEXT NOT NULL, title TEXT NOT NULL,
  depth INTEGER NOT NULL, anchor TEXT NOT NULL, anchors TEXT NOT NULL, position INTEGER NOT NULL,
  item_count INTEGER NOT NULL)`,
  'CREATE INDEX section_list ON section(list_id, position)',
  // tags: {"lang": [slug, label] | null, "license": …, "topics": [[slug, label]…]};
  // alongside: up to 12 item ids; listed: [[listId, sectionId, name | null, extraLinks]…] by the list's stars.
  `CREATE TABLE item(id INTEGER PRIMARY KEY, key TEXT NOT NULL UNIQUE, url TEXT NOT NULL, kind TEXT NOT NULL,
  host TEXT NOT NULL, name TEXT NOT NULL, aka TEXT NOT NULL, owner TEXT, repo_name TEXT, stars INTEGER,
  pushed_day INTEGER, archived INTEGER, fork INTEGER, lang_id INTEGER, license_id INTEGER, status TEXT,
  renamed_from TEXT, list_count INTEGER NOT NULL, pop REAL NOT NULL, list_id INTEGER, indexable INTEGER NOT NULL,
  tags TEXT NOT NULL, alongside TEXT NOT NULL, listed TEXT NOT NULL)`,
  `CREATE TABLE listing(list_id INTEGER NOT NULL, position INTEGER NOT NULL, section_id INTEGER NOT NULL,
  item_id INTEGER NOT NULL, name TEXT NOT NULL, parent_name TEXT, extra_links TEXT NOT NULL,
  PRIMARY KEY(list_id, position)) WITHOUT ROWID`,
  // item_ids: the owner's items in the default order, as many as the owner page shows.
  `CREATE TABLE owner(login TEXT PRIMARY KEY, display TEXT NOT NULL, list_count INTEGER NOT NULL,
  item_count INTEGER NOT NULL, item_ids TEXT NOT NULL) WITHOUT ROWID`,
  'CREATE TABLE redirect(from_path TEXT PRIMARY KEY, to_path TEXT NOT NULL) WITHOUT ROWID',
  `CREATE VIRTUAL TABLE item_fts USING fts5(name, aka, ident, topics, sections, content='',
  tokenize="unicode61 remove_diacritics 2 tokenchars '+#'", prefix='2 3 4')`,
  `CREATE VIRTUAL TABLE list_fts USING fts5(name, repo, summary, category, sections, content='',
  tokenize="unicode61 remove_diacritics 2 tokenchars '+#'", prefix='2 3 4')`,
  `CREATE VIRTUAL TABLE section_fts USING fts5(title, path, content='',
  tokenize="unicode61 remove_diacritics 2 tokenchars '+#'", prefix='2 3 4')`,
] as const;

/** Index rows each insert into a table adds beside the row itself, for the estimate of rows written. */
export const INDEX_ROWS: Readonly<Record<string, number>> = {
  meta: 1, // the text primary key of a rowid table is an index
  category: 1,
  list: 1,
  section: 1,
  item: 1,
  listing: 0,
  owner: 0,
  redirect: 0,
};
