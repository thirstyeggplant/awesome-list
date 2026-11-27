// /search?q=: lists, sections and items at once. ns:value tokens become filters on /items.
import type { Db, ListRow } from '../db.js';
import { html } from '../html.js';
import { slugify } from '../keys.js';
import { EMPTY_ITEMS, liftNamespaces, serialiseItems, withLifted } from '../query.js';
import * as search from '../search.js';
import { itemRows, link, listRows, searchBox } from './components.js';
import type { Ctx } from './context.js';
import { layout } from './layout.js';
import { page, redirect, type ViewResult } from './result.js';

export async function searchPage(ctx: Ctx, db: Db, q: string | null): Promise<ViewResult> {
  const { loc } = ctx;
  const m = loc.m;
  if (q !== null) {
    const { rest, lifted } = liftNamespaces(q, slugify);
    if (lifted.length > 0) return redirect(loc.href(`/items${serialiseItems(withLifted({ ...EMPTY_ITEMS, q: rest }, lifted))}`), 302);
  }
  if (q === null) {
    return page(layout(ctx, { route: 'search', title: m.search.h1, canonical: '/search', noindex: true, main: html`<div class="search-page"><h1>${m.search.h1}</h1>${searchBox(loc, null)}</div>` }));
  }
  const [listIds, sections, itemIds, total] = await Promise.all([
    search.listIds(db, q, 8),
    search.sections(db, q, 10),
    search.itemIds(db, q, 30),
    search.itemCount(db, q),
  ]);
  const lists = listIds.map((id) => ctx.listById.get(id)).filter((l): l is ListRow => l !== undefined);
  const items = await db.itemsByIds(itemIds);
  const main = html`<div class="search-page">
<h1>${m.search.h1}</h1>
${searchBox(loc, q)}
${lists.length > 0 ? html`<section><h2>${m.search.lists}</h2>${listRows(ctx, lists)}</section>` : ''}
${sections.length > 0 ? html`<section><h2>${m.search.sections}</h2><ol class="rows">${sections.map((s) => {
  const list = ctx.listById.get(s.listId);
  if (!list) return '';
  return html`<li class="row section-row"><span class="main"><span class="who">${link(loc, `/lists/${list.slug}#${s.anchor}`, s.path.join(' › '), { cls: 'name' })} <span class="sub">${loc.h(m.search.inList, { list: html`<span translate="no">${list.name}</span>` })}</span></span></span><span class="num in">${loc.plural(m.count.items, s.itemCount)}</span></li>`;
})}</ol></section>` : ''}
<section><h2>${m.search.items}</h2>${items.length > 0 ? itemRows(loc, items, true) : html`<p class="empty">${m.search.noItems}</p>`}
${total > items.length ? html`<p class="more">${link(loc, `/items${serialiseItems({ ...EMPTY_ITEMS, q })}`, loc.plural(m.search.allItems, total))}</p>` : ''}</section>
</div>`;
  return page(layout(ctx, { route: 'search', title: loc.t(m.common.searchChip, { q }), canonical: `/search?q=${encodeURIComponent(q)}`, noindex: true, main, q }));
}
