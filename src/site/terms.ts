// /_data/terms.json: every language, licence and topic, as [id, ns, slug, label, itemCount]. Only /items and
// /api/quick read it.
import type { TermRow } from './db.js';

export interface Terms {
  byId: ReadonlyMap<number, TermRow>;
  /** By `ns:slug`. */
  bySlug: ReadonlyMap<string, TermRow>;
  /** Most items first. */
  byCount: readonly TermRow[];
  maxId: number;
}

export function parseTerms(text: string): Terms {
  const rows = JSON.parse(text) as [number, string, string, string, number][];
  const terms: TermRow[] = rows.map(([id, ns, slug, label, itemCount]) => ({ id, ns, slug, label, itemCount }));
  return {
    byId: new Map(terms.map((t) => [t.id, t])),
    bySlug: new Map(terms.map((t) => [`${t.ns}:${t.slug}`, t])),
    byCount: [...terms].sort((a, b) => b.itemCount - a.itemCount || a.id - b.id),
    maxId: terms.reduce((m, t) => Math.max(m, t.id), 0),
  };
}
