// What every view may read: the site's settings and the small tables held in memory.
import type { CategoryRow, ListRow, Meta, TermRow } from '../db.js';

export interface Assets {
  css: string;
  quick: string;
  listfilter: string;
}

export interface Ctx {
  siteName: string;
  origin: string;
  meta: Meta;
  /** The data date as a day number (days since 1970-01-01). */
  dataDay: number;
  assets: Assets;
  lists: readonly ListRow[];
  listById: ReadonlyMap<number, ListRow>;
  listBySlug: ReadonlyMap<string, ListRow>;
  categories: readonly CategoryRow[];
  categoryById: ReadonlyMap<number, CategoryRow>;
  categoryBySlug: ReadonlyMap<string, CategoryRow>;
  termById: ReadonlyMap<number, TermRow>;
  /** By `ns:slug`. */
  termBySlug: ReadonlyMap<string, TermRow>;
}
