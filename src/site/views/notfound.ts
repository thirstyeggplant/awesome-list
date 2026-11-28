// The 404 page: the same shell, a search box filled from the address, and a few suggestions.
import type { Db } from '../db.js';
import { html } from '../html.js';
import * as search from '../search.js';
import { link, searchBox } from './components.js';
import type { Ctx } from './context.js';
import { layout } from './layout.js';

/** The words to search for: the path's last segment, made readable. */
export function lastSegment(path: string): string {
  const seg = path.split('/').filter((s) => s !== '').pop() ?? '';
  let text: string;
  try {
    text = decodeURIComponent(seg);
  } catch {
    text = seg;
  }
  return text.replace(/[-_.+]+/g, ' ').trim().slice(0, 64);
}

export async function notFoundPage(ctx: Ctx, db: Db, path: string): Promise<string> {
  const { loc } = ctx;
  const words = lastSegment(path);
  const suggestions: { href: string; name: string }[] = [];
  if (words.length >= 2) {
    const [listIds, itemIds] = await Promise.all([search.listIds(db, words, 2), search.itemIds(db, words, 5, true)]);
    for (const id of listIds) {
      const l = ctx.listById.get(id);
      if (l) suggestions.push({ href: `/lists/${l.slug}`, name: l.name });
    }
    for (const it of await db.itemsByIds(itemIds)) {
      if (suggestions.length >= 5) break;
      suggestions.push({ href: `/${it.key}`, name: it.name });
    }
  }
  const main = html`<div class="notfound">
<h1>${loc.m.notFound.h1}</h1>
${searchBox(loc, words)}
${suggestions.length > 0 ? html`<h2>${loc.m.notFound.perhaps}</h2><ul>${suggestions.slice(0, 5).map((s) => html`<li>${link(loc, s.href, html`<span translate="no">${s.name}</span>`)}</li>`)}</ul>` : ''}
</div>`;
  return layout(ctx, { route: 'notfound', title: loc.m.notFound.h1, canonical: null, noindex: true, main });
}
