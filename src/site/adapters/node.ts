// The site's database and static files on this computer: out/site.db with node:sqlite, read-only, and
// out/site-assets/ from the disk. For `pnpm serve` and the tests.
import { readFile } from 'node:fs/promises';
import { normalize, join, sep } from 'node:path';
import { DatabaseSync, type StatementSync } from 'node:sqlite';
import type { Query, Row, Sql, Value } from '../data.js';

export interface NodeSql extends Sql {
  close(): void;
}

export function nodeSql(path: string): NodeSql {
  const db = new DatabaseSync(path, { readOnly: true });
  db.exec('PRAGMA query_only = 1; PRAGMA mmap_size = 268435456;');
  const cache = new Map<string, StatementSync>();
  const st = (sql: string): StatementSync => {
    let s = cache.get(sql);
    if (!s) cache.set(sql, (s = db.prepare(sql)));
    return s;
  };
  const all = (q: Query): Row[] => st(q.sql).all(...(q.params ?? []));
  return {
    all: (sql: string, params: readonly Value[] = []) => Promise.resolve(all({ sql, params })),
    first: (sql: string, params: readonly Value[] = []) => Promise.resolve(st(sql).get(...params) ?? null),
    batch: (queries: readonly Query[]) => Promise.resolve(queries.map(all)),
    close: () => {
      db.close();
    },
  };
}

/** The path of a static file under `dir`, or null for a path that would leave it. */
export function fileOf(dir: string, path: string): string | null {
  let decoded: string;
  try {
    decoded = decodeURIComponent(path);
  } catch {
    return null;
  }
  if (decoded.includes('\0')) return null;
  const file = normalize(join(dir, decoded));
  return file.startsWith(normalize(dir) + sep) ? file : null;
}

/** Static files from a folder, answered as the Worker's ASSETS binding answers them: the bytes, or a 404. */
export function fileAssets(dir: string): (path: string) => Promise<Response> {
  return async (path) => {
    const file = fileOf(dir, path);
    if (file === null) return new Response('Not found\n', { status: 404 });
    try {
      return new Response(await readFile(file));
    } catch {
      return new Response('Not found\n', { status: 404 });
    }
  };
}
