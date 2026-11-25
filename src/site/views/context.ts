// What every view may read: the site's settings and the small tables held in memory.
import type { CategoryRow, ListRow, Meta } from '../db.js';

export type Assets = Meta['assets'];

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
}
