// /search?q=: lists, sections and items at once. ns:value tokens become filters on /items.
import type { Db, ListRow } from '../db.js';
import { html } from '../html.js';
import { slugify } from '../keys.js';
import { EMPTY_ITEMS, liftNamespaces, serialiseItems, withLifted } from '../query.js';
import * as search from '../search.js';
import { itemRows, listRow, num, plural, searchBox } from './components.js';
import type { Ctx } from './context.js';
import { layout } from './layout.js';
import { page, redirect, type ViewResult } from './result.js';

export async function searchPage(ctx: Ctx, db: Db, q: string | null): Promise<ViewResult> {
  if (q !== null) {
    const { rest, lifted } = liftNamespaces(q, slugify);
    if (lifted.length > 0) return redirect(`/items${serialiseItems(withLifted({ ...EMPTY_ITEMS, q: rest }, lifted))}`, 302);
  }
  if (q === null) {
    return page(layout(ctx, { title: 'Search', canonical: '/search', noindex: true, main: html`<h1>Search</h1>${searchBox(null)}` }));
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
<h1>Search</h1>
${searchBox(q)}
${lists.length > 0 ? html`<section><h2>Lists</h2><ol class="rows lists">${lists.map((l) => listRow(ctx, l))}</ol></section>` : ''}
${sections.length > 0 ? html`<section><h2>Sections</h2><ol class="rows">${sections.map((s) => {
  const list = ctx.listById.get(s.listId);
  if (!list) return '';
  return html`<li class="row"><span class="main"><a class="name" href="/lists/${list.slug}#${s.anchor}">${s.path.join(' › ')}</a> <span class="sub">in ${list.name}</span></span><span class="num">${plural(s.itemCount, 'item')}</span></li>`;
})}</ol></section>` : ''}
<section><h2>Items</h2>${items.length > 0 ? itemRows(items, true) : html`<p class="empty">No items match.</p>`}
${total > items.length ? html`<p class="more"><a href="/items${serialiseItems({ ...EMPTY_ITEMS, q })}">All ${num(total)} items</a></p>` : ''}</section>
</div>`;
  return page(layout(ctx, { title: `“${q}”`, canonical: `/search?q=${encodeURIComponent(q)}`, noindex: true, main, q }));
}
