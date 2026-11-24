// The tables of out/site.db. See docs/site.md, "The database".

export const DDL = `
PRAGMA page_size = 4096;
CREATE TABLE meta(key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE category(id INTEGER PRIMARY KEY, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE,
  position INTEGER NOT NULL, list_count INTEGER NOT NULL);
CREATE TABLE list(id INTEGER PRIMARY KEY, slug TEXT NOT NULL UNIQUE, owner TEXT NOT NULL, repo TEXT NOT NULL,
  name TEXT NOT NULL, category_id INTEGER, subcategory TEXT, summary TEXT, stars INTEGER, pushed_day INTEGER,
  archived INTEGER, license TEXT, status TEXT NOT NULL, reason TEXT, readme_path TEXT, readme_oid TEXT,
  items_made INTEGER NOT NULL, section_count INTEGER NOT NULL, item_id INTEGER,
  position INTEGER NOT NULL);
CREATE TABLE section(id INTEGER PRIMARY KEY, list_id INTEGER NOT NULL, path TEXT NOT NULL, title TEXT NOT NULL,
  depth INTEGER NOT NULL, anchor TEXT NOT NULL, anchors TEXT NOT NULL, position INTEGER NOT NULL,
  item_count INTEGER NOT NULL);
CREATE INDEX section_list ON section(list_id, position);
CREATE TABLE item(id INTEGER PRIMARY KEY, key TEXT NOT NULL UNIQUE, url TEXT NOT NULL UNIQUE, kind TEXT NOT NULL,
  host TEXT NOT NULL, name TEXT NOT NULL, aka TEXT NOT NULL, owner TEXT, repo_name TEXT, stars INTEGER,
  pushed_day INTEGER, archived INTEGER, fork INTEGER, lang_id INTEGER, license_id INTEGER, status TEXT,
  renamed_from TEXT, list_count INTEGER NOT NULL, pop REAL NOT NULL, list_id INTEGER, indexable INTEGER NOT NULL);
CREATE INDEX item_owner ON item(owner);
CREATE TABLE listing(id INTEGER PRIMARY KEY, list_id INTEGER NOT NULL, section_id INTEGER NOT NULL,
  item_id INTEGER NOT NULL, position INTEGER NOT NULL, name TEXT NOT NULL, parent_name TEXT, extra_links TEXT NOT NULL);
CREATE INDEX listing_list ON listing(list_id, position);
CREATE INDEX listing_item ON listing(item_id);
CREATE TABLE term(id INTEGER PRIMARY KEY, ns TEXT NOT NULL, slug TEXT NOT NULL, label TEXT NOT NULL,
  item_count INTEGER NOT NULL, UNIQUE(ns, slug));
CREATE TABLE item_topic(item_id INTEGER NOT NULL, term_id INTEGER NOT NULL, PRIMARY KEY(item_id, term_id)) WITHOUT ROWID;
CREATE TABLE alongside(item_id INTEGER NOT NULL, rank INTEGER NOT NULL, other_id INTEGER NOT NULL, score REAL NOT NULL,
  PRIMARY KEY(item_id, rank)) WITHOUT ROWID;
CREATE TABLE owner(login TEXT PRIMARY KEY, display TEXT NOT NULL, list_count INTEGER NOT NULL, item_count INTEGER NOT NULL);
CREATE TABLE redirect(from_path TEXT PRIMARY KEY, to_path TEXT NOT NULL);
CREATE VIRTUAL TABLE item_fts USING fts5(name, aka, ident, topics, sections, content='',
  tokenize="unicode61 remove_diacritics 2 tokenchars '+#'", prefix='2 3 4');
CREATE VIRTUAL TABLE list_fts USING fts5(name, repo, summary, category, sections, content='',
  tokenize="unicode61 remove_diacritics 2 tokenchars '+#'", prefix='2 3 4');
CREATE VIRTUAL TABLE section_fts USING fts5(title, path, content='',
  tokenize="unicode61 remove_diacritics 2 tokenchars '+#'", prefix='2 3 4');
`;
