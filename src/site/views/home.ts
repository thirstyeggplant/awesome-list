// /: the search box, the counts, every list by category, and the items named by the most lists.
import type { Db, ListRow } from '../db.js';
import { html, join, type Html } from '../html.js';
import { EMPTY_ITEMS, encodeParam, serialiseItems } from '../query.js';
import { categoryName, itemRows, link, searchBox, webSite } from './components.js';
import type { Ctx } from './context.js';
import { itemsNoindex } from './items.js';
import { layout } from './layout.js';
import { page, type ViewResult } from './result.js';
import { shareRow } from './share.js';

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

export { webSite } from './components.js';

/** Lists shown as cards under "Start here". */
const START_HERE = 12;
/** Items named by the most lists, as rows. */
const MOST_NAMED = 8;

/** A list as a card: its name (the link, over the whole card), our summary, its size and category. */
export function listCard(ctx: Ctx, l: ListRow, extra?: string): Html {
  const { loc } = ctx;
  const cat = l.categoryId === null ? undefined : ctx.categoryById.get(l.categoryId);
  const summary = loc.summary(l);
  const facts: Html[] = [html`${loc.plural(loc.m.count.items, l.itemsMade)}`];
  if (cat) facts.push(categoryName(loc, cat));
  if (extra !== undefined) facts.push(html`${extra}`);
  return html`<li class="card"><a class="card-name serif" href="${loc.href(`/lists/${l.slug}`)}" translate="no">${l.name}</a>${
    summary ? html`<p class="card-summary"${summary.en ? html` lang="en"` : ''}>${summary.text}</p>` : ''
  }<p class="card-meta">${join(facts, ' · ')}</p></li>`;
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
  const top = await db.itemsByIds(Array.from({ length: MOST_NAMED }, (_, i) => i + 1));
  const h1 = loc.plural(m.home.h1, lists);
  // ctx.lists is in the order of stars.
  const start = ctx.lists.filter((l) => l.status !== 'unparsed').slice(0, START_HERE);
  /** The three lists of a category with the most stars, named under it when it is folded. */
  const peek = (catId: number): string =>
    loc.list(ctx.lists.filter((l) => l.categoryId === catId).slice(0, 3).map((l) => l.name));
  const langs = ctx.meta.top.langs.map(
    ([slug, label, n]) => html`<a href="${loc.href(`/items?lang=${encodeParam(slug)}`)}"><span translate="no">${label}</span> <span class="n">${loc.n(n)}</span></a>`,
  );
  const twoOrMore = { ...EMPTY_ITEMS, in: 2 };
  const contents = html`<ol class="toc-list">${ctx.categories.map(
    (cat) => html`<li><a href="#${cat.slug}">${categoryName(loc, cat)}</a> <span class="num">${loc.n(cat.listCount)}</span></li>`,
  )}</ol>`;
  const head = { route: 'home' as const, title: h1, headTitle: loc.plural(m.meta.home.title, lists, { site: ctx.siteName }), canonical: '/' };
  const main = html`<div class="home">
<header class="hero">
<h1 class="home-title">${h1}</h1>
${searchBox(loc, null)}
<p class="counts">${loc.t(m.home.counts, {
    lists: loc.plural(m.count.lists, lists),
    items: loc.plural(m.count.items, c.items ?? 0),
    listings: loc.plural(m.count.listings, c.listings ?? 0),
    date: loc.dayIso(ctx.meta.dataFinished),
  })}</p>
${langs.length > 0 ? html`<p class="by-lang"><span class="label">${m.home.browseByLanguage}</span> ${join(langs, html`<span class="sep"> · </span>`)}<span class="sep"> · </span>${link(loc, '/items', m.home.allProjects, { cls: 'all' })}</p>` : ''}
${shareRow(ctx, head)}
</header>
<section class="home-part"><h2>${m.home.startHere}</h2>
<ul class="cards">${start.map((l) => listCard(ctx, l))}</ul>
<p class="more">${link(loc, '/lists', loc.plural(m.home.allLists, lists))}</p></section>
<section class="home-part most"><h2>${m.home.mostNamed}</h2>${itemRows(loc, top, true)}
<p class="more">${link(loc, `/items${serialiseItems(twoOrMore)}`, m.home.namedByTwo, itemsNoindex(twoOrMore) ? { rel: 'nofollow' } : {})}</p></section>
<h2 class="home-part-title">${m.home.byCategory}</h2>
<div class="list-layout">
<nav class="toc toc-rail" aria-label="${m.list.contents}"><p class="rail-title">${m.list.contents}</p>${contents}</nav>
<div class="home-body">
${ctx.categories.map(
  (cat) => html`<details class="category" id="${cat.slug}"><summary><h3><a href="${loc.href(`/lists?category=${cat.slug}`)}">${categoryName(loc, cat)}</a> <span class="count">${loc.n(cat.listCount)}</span></h3><span class="peek" translate="no">${peek(cat.id)}</span></summary>
${categoryLists(ctx, byCat.get(cat.id) ?? [])}</details>`,
)}
</div></div>
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
