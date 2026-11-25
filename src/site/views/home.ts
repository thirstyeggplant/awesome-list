import type { Db, ListRow } from '../db.js';
import { html, type Html } from '../html.js';
import { fmtIso, itemRows, num, searchBox } from './components.js';
import type { Ctx } from './context.js';
import { layout } from './layout.js';
import { page, type ViewResult } from './result.js';

/** A category's lists in the index's order, each subcategory's lists indented under their parent. */
function categoryLists(lists: readonly ListRow[]): Html {
  const out: Html[] = [];
  let parent: string | null = null;
  for (const l of lists) {
    if (l.subcategory === null) {
      parent = l.name;
      out.push(html`<li><a href="/lists/${l.slug}">${l.name}</a></li>`);
      continue;
    }
    if (l.subcategory !== parent) {
      parent = l.subcategory;
      out.push(html`<li class="parent-label">${l.subcategory}</li>`);
    }
    out.push(html`<li class="sub-list"><a href="/lists/${l.slug}">${l.name}</a></li>`);
  }
  return html`<ul class="grid">${out}</ul>`;
}

export async function homePage(ctx: Ctx, db: Db): Promise<ViewResult> {
  const byCat = new Map<number, ListRow[]>();
  for (const l of [...ctx.lists].sort((a, b) => a.position - b.position)) {
    const c = l.categoryId ?? 0;
    let a = byCat.get(c);
    if (!a) byCat.set(c, (a = []));
    a.push(l);
  }
  const c = ctx.meta.counts;
  const top = await db.itemsByIds(Array.from({ length: 12 }, (_, i) => i + 1));
  const main = html`<div class="home">
${searchBox(null)}
<p class="counts">${num(c.lists ?? 0)} lists · ${num(c.items ?? 0)} items · ${num(c.listings ?? 0)} listings · data of ${fmtIso(ctx.meta.dataFinished)}</p>
${ctx.categories.map(
  (cat) => html`<section class="category"><h2 id="${cat.slug}"><a href="/lists?category=${cat.slug}">${cat.name}</a> <span class="count">${num(cat.listCount)}</span></h2>
${categoryLists(byCat.get(cat.id) ?? [])}</section>`,
)}
<section class="most"><h2>Named by the most lists</h2>${itemRows(top)}</section>
</div>`;
  return page(
    layout(ctx, {
      title: ctx.siteName,
      description: `An index of ${num(c.lists ?? 0)} awesome lists and the ${num(c.items ?? 0)} things they name.`,
      canonical: '/',
      main,
    }),
  );
}
