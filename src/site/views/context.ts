// What every view may read: the site's settings, the small tables held in memory, and the request's language.
import type { CategoryRow, ListRow, Meta } from '../db.js';
import type { Loc } from '../i18n/loc.js';

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
  /** The language of this request: messages, formatters, addresses, translated summaries and categories. */
  loc: Loc;
  /** The address asked for, without its language prefix (path and query), for the language switcher. */
  here: string;
}
