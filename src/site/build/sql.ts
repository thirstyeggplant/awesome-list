// SQL text for out/d1/load.sql: values as literals, rows gathered into multi-row inserts of a bounded size.
// D1 takes at most 100 KB a statement and no BEGIN, COMMIT or PRAGMA in an import.

export type SqlValue = string | number | null;

/** The most bytes in one multi-row insert; one row longer than this is a statement of its own. */
export const STATEMENT_BYTES = 50_000;
/** D1's limit for one statement. */
export const D1_STATEMENT_LIMIT = 100_000;

/** A value as an SQLite literal. Control characters are written with char() so no statement holds one. */
export function literal(v: SqlValue): string {
  if (v === null) return 'NULL';
  if (typeof v === 'number') {
    if (!Number.isFinite(v)) throw new Error(`not a finite number: ${v}`);
    return String(v);
  }
  const parts: string[] = [];
  let run = '';
  for (const ch of v) {
    const code = ch.codePointAt(0) ?? 0;
    if (code < 0x20 || code === 0x7f) {
      parts.push(`'${run.replace(/'/g, "''")}'`, `char(${code})`);
      run = '';
    } else run += ch;
  }
  parts.push(`'${run.replace(/'/g, "''")}'`);
  return parts.length === 1 ? (parts[0] ?? "''") : `(${parts.filter((p) => p !== "''").join('||')})`;
}

const bytes = (s: string): number => Buffer.byteLength(s, 'utf8');

export interface LoadStats {
  statements: number;
  bytes: number;
  /** Rows inserted, by table (the full-text tables as well). */
  rows: Record<string, number>;
  /** The longest statement, in bytes. */
  longest: number;
}

/** Writes statements to `out`, each ending with ";\n", and counts them. */
export class LoadWriter {
  readonly stats: LoadStats = { statements: 0, bytes: 0, rows: {}, longest: 0 };
  constructor(private readonly out: (text: string) => void) {}

  statement(sql: string): void {
    const text = `${sql};\n`;
    const n = bytes(text);
    if (n > D1_STATEMENT_LIMIT) throw new Error(`a statement of ${n} bytes is over D1's limit: ${sql.slice(0, 80)}…`);
    this.stats.statements++;
    this.stats.bytes += n;
    this.stats.longest = Math.max(this.stats.longest, n);
    this.out(text);
  }

  /** Multi-row inserts of `rows` into `table(columns)`, at most STATEMENT_BYTES each. */
  insert(table: string, columns: readonly string[], rows: Iterable<readonly SqlValue[]>): void {
    const head = `INSERT INTO ${table}(${columns.join(', ')}) VALUES\n`;
    const headBytes = bytes(head);
    let values: string[] = [];
    let size = headBytes;
    const flush = (): void => {
      if (values.length === 0) return;
      this.statement(head + values.join(',\n'));
      values = [];
      size = headBytes;
    };
    let count = 0;
    for (const row of rows) {
      if (row.length !== columns.length) throw new Error(`${table}: ${row.length} values for ${columns.length} columns`);
      const tuple = `(${row.map(literal).join(',')})`;
      const n = bytes(tuple) + 2;
      if (values.length > 0 && size + n > STATEMENT_BYTES) flush();
      values.push(tuple);
      size += n;
      count++;
    }
    flush();
    this.stats.rows[table] = (this.stats.rows[table] ?? 0) + count;
  }
}

/**
 * Splits SQL text into statements at semicolons outside quotes. Enough for what LoadWriter writes
 * (no comments, no triggers), for the tests and the check of a load.
 */
export function splitStatements(text: string): string[] {
  const out: string[] = [];
  let start = 0;
  let quote: string | null = null;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quote !== null) {
      if (c === quote) {
        if (text[i + 1] === quote) i++;
        else quote = null;
      }
    } else if (c === "'" || c === '"') quote = c;
    else if (c === ';') {
      const s = text.slice(start, i).trim();
      if (s !== '') out.push(s);
      start = i + 1;
    }
  }
  const rest = text.slice(start).trim();
  if (rest !== '') out.push(rest);
  return out;
}
