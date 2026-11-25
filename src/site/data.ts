// What the site asks of a database. Two adapters: D1 in the Worker (adapters/d1.ts), node:sqlite locally
// (adapters/node.ts). Parameters are bound, never written into the SQL.

export type Value = string | number | null;
export type Row = Record<string, unknown>;

export interface Query {
  sql: string;
  params?: readonly Value[];
}

export interface Sql {
  all(sql: string, params?: readonly Value[]): Promise<Row[]>;
  first(sql: string, params?: readonly Value[]): Promise<Row | null>;
  /** Several reads in one round trip, each answered in order. */
  batch(queries: readonly Query[]): Promise<Row[][]>;
}
