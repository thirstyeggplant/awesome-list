// /: the search box, the counts, every list by category, and the items named by the most lists.
import type { Db, ListRow } from '../db.js';
import { html, type Html } from '../html.js';
import { EMPTY_ITEMS, encodeParam, serialiseItems } from '../query.js';
import { categoryName, entries, link, listEntries, searchBox, webSite } from './components.js';
import type { Ctx } from './context.js';
import { itemsNoindex } from './items.js';
import { layout } from './layout.js';
import { page, type ViewResult } from './result.js';
import { shareRow } from './share.js';

/** A category's lists in the index's order, as one run of names; a subcategory's label before its lists. */
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
      out.push(html`<li class="sub" translate="no">${l.subcategory}:</li>`);
    }
    out.push(html`<li><a href="${href(l)}" translate="no">${l.name}</a></li>`);
  }
  return html`<ul class="run">${out}</ul>`;
}

export { webSite } from './components.js';

/** Lists shown under "Start here". */
const START_HERE = 8;
/** Items named by the most lists, as rows. */
const MOST_NAMED = 8;

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
  const top = await db.itemsByIds(Array.from({ length: MOST_NAMED }, (_, i) => i + 1));
  const h1 = loc.plural(m.home.h1, lists);
  // ctx.lists is in the order of stars.
  const start = ctx.lists.filter((l) => l.status !== 'unparsed').slice(0, START_HERE);
  /** The three lists of a category with the most stars, named under it when it is folded. */
  const peek = (catId: number): string =>
    loc.list(ctx.lists.filter((l) => l.categoryId === catId).slice(0, 3).map((l) => l.name));
  const langs = ctx.meta.top.langs.map(
    ([slug, label, n]) => html`<li><a href="${loc.href(`/items?lang=${encodeParam(slug)}`)}"><span translate="no">${label}</span> <span class="n">${loc.n(n)}</span></a></li>`,
  );
  const twoOrMore = { ...EMPTY_ITEMS, in: 2 };
  const head = { route: 'home' as const, title: h1, headTitle: loc.plural(m.meta.home.title, lists, { site: ctx.siteName }), canonical: '/' };
  const main = html`<div class="home">
<header class="hero">
<h1>${h1}</h1>
<p class="lede">${loc.t(m.home.counts, {
    lists: loc.plural(m.count.lists, lists),
    items: loc.plural(m.count.items, c.items ?? 0),
    listings: loc.plural(m.count.listings, c.listings ?? 0),
    date: loc.dayIso(ctx.meta.dataFinished),
  })}</p>
${searchBox(loc, null)}
</header>
${langs.length > 0 ? html`<h2 class="label">${m.home.browseByLanguage}</h2>
<ul class="run langs-run">${langs}<li>${link(loc, '/items', m.home.allProjects, { cls: 'all' })}</li></ul>` : ''}
<h2>${m.home.startHere}</h2>
${listEntries(ctx, start)}
<p class="more">${link(loc, '/lists', loc.plural(m.home.allLists, lists))}</p>
<h2>${m.home.mostNamed}</h2>
${entries(ctx, top, { topics: true })}
<p class="more">${link(loc, `/items${serialiseItems(twoOrMore)}`, m.home.namedByTwo, itemsNoindex(twoOrMore) ? { rel: 'nofollow' } : {})}</p>
<h2>${m.home.byCategory}</h2>
<div class="categories">
${ctx.categories.map(
  (cat) => html`<details class="category" id="${cat.slug}"><summary><h3><a href="${loc.href(`/lists?category=${cat.slug}`)}">${categoryName(loc, cat)}</a> <span class="count">${loc.n(cat.listCount)}</span></h3><span class="peek" translate="no">${peek(cat.id)}</span></summary>
${categoryLists(ctx, byCat.get(cat.id) ?? [])}</details>`,
)}
</div>
${shareRow(ctx, head)}
</div>`;
  return page(
    layout(ctx, {
      ...head,
      description: loc.plural(m.meta.home.description, lists, { items: loc.n(c.items ?? 0) }),
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
