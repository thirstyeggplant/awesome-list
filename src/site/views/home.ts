// /: the search box, the counts, every list by category, and the items named by the most lists.
import type { Db, ListRow } from '../db.js';
import { html, type Html } from '../html.js';
import { categoryName, itemRows, searchBox } from './components.js';
import type { Ctx } from './context.js';
import { layout } from './layout.js';
import { page, type ViewResult } from './result.js';

/** A category's lists in the index's order, each subcategory's lists indented under their parent. */
function categoryLists(ctx: Ctx, lists: readonly ListRow[]): Html {
  const href = (l: ListRow): string => ctx.loc.href(`/lists/${l.slug}`);
  const out: Html[] = [];
  let parent: string | null = null;
  for (const l of lists) {
    if (l.subcategory === null) {
      parent = l.name;
      out.push(html`<li><a href="${href(l)}" translate="no">${l.name}</a></li>`);
      continue;
    }
    if (l.subcategory !== parent) {
      parent = l.subcategory;
      out.push(html`<li class="parent-label" translate="no">${l.subcategory}</li>`);
    }
    out.push(html`<li class="sub-list"><a href="${href(l)}" translate="no">${l.name}</a></li>`);
  }
  return html`<ul class="grid">${out}</ul>`;
}

/** The WebSite of structured data, as the home page and the list pages name it. */
export function webSite(ctx: Ctx): Record<string, unknown> {
  return {
    '@type': 'WebSite',
    name: ctx.siteName,
    url: ctx.origin + ctx.loc.href('/'),
    inLanguage: ctx.loc.info.hreflang,
  };
}

export async function homePage(ctx: Ctx, db: Db): Promise<ViewResult> {
  const { loc } = ctx;
  const m = loc.m;
  const byCat = new Map<number, ListRow[]>();
  for (const l of [...ctx.lists].sort((a, b) => a.position - b.position)) {
    const c = l.categoryId ?? 0;
    let a = byCat.get(c);
    if (!a) byCat.set(c, (a = []));
    a.push(l);
  }
  const c = ctx.meta.counts;
  const lists = c.lists ?? 0;
  const top = await db.itemsByIds(Array.from({ length: 12 }, (_, i) => i + 1));
  const h1 = loc.plural(m.home.h1, lists);
  const main = html`<div class="home">
<h1 class="home-title">${h1}</h1>
${searchBox(loc, null)}
<p class="counts">${loc.t(m.home.counts, {
    lists: loc.plural(m.count.lists, lists),
    items: loc.plural(m.count.items, c.items ?? 0),
    listings: loc.plural(m.count.listings, c.listings ?? 0),
    date: loc.dayIso(ctx.meta.dataFinished),
  })}</p>
${ctx.categories.map(
  (cat) => html`<section class="category"><h2 id="${cat.slug}"><a href="${loc.href(`/lists?category=${cat.slug}`)}">${categoryName(loc, cat)}</a> <span class="count">${loc.n(cat.listCount)}</span></h2>
${categoryLists(ctx, byCat.get(cat.id) ?? [])}</section>`,
)}
<section class="most"><h2>${m.home.mostNamed}</h2>${itemRows(loc, top)}</section>
</div>`;
  return page(
    layout(ctx, {
      route: 'home',
      title: h1,
      headTitle: loc.plural(m.meta.home.title, lists, { site: ctx.siteName }),
      description: loc.plural(m.meta.home.description, lists, { items: loc.n(c.items ?? 0) }),
      canonical: '/',
      main,
      jsonLd: [
        {
          '@context': 'https://schema.org',
          ...webSite(ctx),
          potentialAction: {
            '@type': 'SearchAction',
            target: { '@type': 'EntryPoint', urlTemplate: `${ctx.origin}${loc.prefix}/search?q={search_term_string}` },
            'query-input': 'required name=search_term_string',
          },
        },
      ],
    }),
  );
}
