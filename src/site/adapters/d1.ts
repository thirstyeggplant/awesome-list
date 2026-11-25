// The site's database in the Worker: D1, with a session per request that may read from any replica.
import type { D1Database, D1PreparedStatement } from '@cloudflare/workers-types';
import type { Query, Row, Sql, Value } from '../data.js';

export function d1Sql(db: D1Database): Sql {
  const session = db.withSession('first-unconstrained');
  const prepare = (q: Query): D1PreparedStatement => session.prepare(q.sql).bind(...(q.params ?? []));
  return {
    all: async (sql: string, params: readonly Value[] = []) => (await prepare({ sql, params }).all<Row>()).results,
    first: async (sql: string, params: readonly Value[] = []) => await prepare({ sql, params }).first<Row>(),
    batch: async (queries: readonly Query[]) => (await session.batch<Row>(queries.map(prepare))).map((r) => r.results),
  };
}
