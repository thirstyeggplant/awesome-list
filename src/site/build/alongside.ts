// Listed alongside: Y is alongside X when they share a section of some list.
// The score is the sum over shared sections of 1 / log2(2 + sectionSize); in a section of more
// than `big` entries only the `window` entries on each side by position count.
import { ALONGSIDE_BIG_SECTION, ALONGSIDE_KEEP, ALONGSIDE_WINDOW } from '../config.js';

export interface SectionEntries {
  /** The entries in position order. */
  entries: readonly { itemId: number; position: number }[];
}

export interface Facts { listCount: number; stars: number | null }

export interface AlongsideRow { itemId: number; rank: number; otherId: number; score: number }

export interface AlongsideOptions { keep?: number; big?: number; window?: number }

export function alongside(
  sections: readonly SectionEntries[],
  facts: (itemId: number) => Facts,
  options: AlongsideOptions = {},
): AlongsideRow[] {
  const keep = options.keep ?? ALONGSIDE_KEEP;
  const big = options.big ?? ALONGSIDE_BIG_SECTION;
  const window = options.window ?? ALONGSIDE_WINDOW;

  // Where each item stands: [section, index in section].
  const where = new Map<number, [number, number][]>();
  sections.forEach((s, si) => {
    s.entries.forEach((e, ei) => {
      let w = where.get(e.itemId);
      if (!w) where.set(e.itemId, (w = []));
      w.push([si, ei]);
    });
  });

  const rows: AlongsideRow[] = [];
  const ids = [...where.keys()].sort((a, b) => a - b);
  for (const x of ids) {
    const occurrences = where.get(x) ?? [];
    const score = new Map<number, number>();
    const dist = new Map<number, number>();
    // Occurrences grouped by section, so a shared section counts once.
    const bySection = new Map<number, number[]>();
    for (const [si, ei] of occurrences) {
      let a = bySection.get(si);
      if (!a) bySection.set(si, (a = []));
      a.push(ei);
    }
    for (const [si, indexes] of bySection) {
      const entries = sections[si]?.entries ?? [];
      const size = entries.length;
      const weight = 1 / Math.log2(2 + size);
      const near = new Map<number, number>();
      for (const i of indexes) {
        const from = size > big ? Math.max(0, i - window) : 0;
        const to = size > big ? Math.min(size - 1, i + window) : size - 1;
        const px = entries[i]?.position ?? 0;
        for (let j = from; j <= to; j++) {
          const e = entries[j];
          if (!e || e.itemId === x) continue;
          const d = Math.abs(e.position - px);
          const was = near.get(e.itemId);
          if (was === undefined || d < was) near.set(e.itemId, d);
        }
      }
      for (const [y, d] of near) {
        score.set(y, (score.get(y) ?? 0) + weight);
        const was = dist.get(y);
        if (was === undefined || d < was) dist.set(y, d);
      }
    }
    if (score.size === 0) continue;
    const ranked = [...score.keys()].sort((a, b) => {
      const sa = score.get(a) ?? 0;
      const sb = score.get(b) ?? 0;
      if (sa !== sb) return sb - sa;
      const fa = facts(a);
      const fb = facts(b);
      if (fa.listCount !== fb.listCount) return fb.listCount - fa.listCount;
      const ta = fa.stars ?? -1;
      const tb = fb.stars ?? -1;
      if (ta !== tb) return tb - ta;
      const da = dist.get(a) ?? 0;
      const db = dist.get(b) ?? 0;
      if (da !== db) return da - db;
      return a - b;
    });
    ranked.slice(0, keep).forEach((y, rank) => {
      rows.push({ itemId: x, rank, otherId: y, score: score.get(y) ?? 0 });
    });
  }
  return rows;
}
