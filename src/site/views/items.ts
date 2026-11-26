// /items: every item, filtered by facets, 50 at a time.
import { MAX_MATCHES, MAX_PAGE, PAGE_SIZE } from '../config.js';
import type { Db } from '../db.js';
import { NO_FILTERS, type FacetIndex, type Filters } from '../facets.js';
import { html, type Html } from '../html.js';
import { ITEM_KINDS, REPO_STATUSES } from '../../enums.js';
import { filterCount, IN_STEPS, ITEM_SORTS, serialiseItems, STAR_STEPS, type ItemsQuery } from '../query.js';
import { itemIds } from '../search.js';
import type { Terms } from '../terms.js';
import { itemRows, link, pager, sortLine } from './components.js';
import type { Ctx } from './context.js';
import { layout } from './layout.js';
import { page, type ViewResult } from './result.js';

/** Below this many results a page of /items with one filter is thin, and noindex. */
export const THIN_ITEMS = 5;

/**
 * Whether a page of /items is kept out of search engines: a search, two filters, a sort, past the paging, and
 * for one filter, a later page or fewer than THIN_ITEMS results. `total` is the page's result count, when known.
 */
export function itemsNoindex(q: ItemsQuery, total = Number.POSITIVE_INFINITY): boolean {
  const filters = filterCount(q);
  if (q.q !== null || filters >= 2 || q.sort !== null || q.page > MAX_PAGE) return true;
  return filters === 1 && (q.page > 1 || total < THIN_ITEMS);
}

/** The query as numbers for the facet index, or null when a value names nothing (a 404). */
export async function resolveFilters(
  ctx: Ctx,
  db: Db,
  facets: FacetIndex,
  terms: Terms,
  q: ItemsQuery,
): Promise<Filters | null> {
  const term = (ns: string, slug: string | null): number | null => {
    if (slug === null) return -1;
    return terms.bySlug.get(`${ns}:${slug}`)?.id ?? null;
  };
  const lang = term('lang', q.lang);
  const license = term('license', q.license);
  const topics = q.topic.map((t) => term('topic', t));
  if (lang === null || license === null || topics.some((t) => t === null)) return null;
  const list = q.list === null ? -1 : (ctx.listBySlug.get(q.list)?.id ?? null);
  const category = q.category === null ? -1 : (ctx.categoryBySlug.get(q.category)?.id ?? null);
  if (list === null || category === null) return null;
  let owner = -1;
  if (q.owner !== null) {
    if (!(await db.ownerExists(q.owner))) return null;
    owner = facets.ownerIndex.get(q.owner) ?? Number.MAX_SAFE_INTEGER;
  }
  return {
    ...NO_FILTERS,
    kind: q.kind === null ? -1 : (ITEM_KINDS as readonly string[]).indexOf(q.kind),
    status: q.status === null ? -1 : (REPO_STATUSES as readonly string[]).indexOf(q.status) + 1,
    lang,
    license,
    topics: topics.filter((t): t is number => t !== null),
    list,
    category,
    owner,
    stars: q.stars ?? -1,
    in: q.in ?? -1,
    matches: q.q === null ? null : await itemIds(db, q.q, MAX_MATCHES),
  };
}

interface FacetValue { label: Html | string; href: string; count: number; on: boolean; rel?: string }

function facetBlock(ctx: Ctx, title: string, values: readonly FacetValue[], open = true): Html {
  if (values.length === 0) return html``;
  return html`<details class="facet"${open ? html` open` : ''}><summary>${title}</summary><ul>${values.map(
    (v) => html`<li${v.on ? html` class="on"` : ''}><a href="${ctx.loc.href(v.href)}"${v.rel ? html` rel="${v.rel}"` : ''}${v.on ? html` aria-current="true"` : ''}>${v.label}</a> <span class="num">${ctx.loc.n(v.count)}</span></li>`,
  )}</ul></details>`;
}

/** What the one filter of a query is, in words: "Go", "archived", "1,000+ stars"… */
function filterLabel(ctx: Ctx, terms: Terms, q: ItemsQuery): string | null {
  const { loc } = ctx;
  const m = loc.m;
  const term = (ns: string, slug: string): string => terms.bySlug.get(`${ns}:${slug}`)?.label ?? slug;
  if (q.kind !== null) return (m.kind as Record<string, string>)[q.kind] ?? q.kind;
  if (q.status !== null) return (m.status as Record<string, string>)[q.status] ?? q.status;
  if (q.lang !== null) return term('lang', q.lang);
  if (q.license !== null) return term('license', q.license);
  if (q.topic[0] !== undefined) return term('topic', q.topic[0]);
  if (q.list !== null) return ctx.listBySlug.get(q.list)?.name ?? q.list;
  if (q.category !== null) {
    const cat = ctx.categoryBySlug.get(q.category);
    return cat ? loc.category(cat).text : q.category;
  }
  if (q.owner !== null) return q.owner;
  if (q.stars !== null) return loc.t(m.items.starsAtLeast, { n: loc.n(q.stars) });
  if (q.in !== null) return loc.t(m.items.inAtLeast, { n: loc.n(q.in) });
  return null;
}

export async function itemsPage(ctx: Ctx, db: Db, facets: FacetIndex, terms: Terms, q: ItemsQuery): Promise<ViewResult> {
  const { loc } = ctx;
  const m = loc.m;
  const f = await resolveFilters(ctx, db, facets, terms, q);
  if (f === null) return null;
  const beyond = q.page > MAX_PAGE;
  const sort = q.sort ?? (q.q !== null ? 'relevance' : 'lists');
  const result = facets.run(f, sort, beyond ? 1 : q.page, PAGE_SIZE);
  const pages = Math.ceil(result.total / PAGE_SIZE);
  // A page past the last is not there (paging past 200 says to narrow the filters instead).
  if (q.page > 1 && q.page > pages && !beyond) return null;
  const ids = beyond ? [] : result.ids;
  const items = await db.itemsByIds(ids);
  const target = (change: Partial<ItemsQuery>): ItemsQuery => ({ ...q, page: 1, ...change });
  const href = (t: ItemsQuery): string => `/items${serialiseItems(t)}`;
  /** A facet value: its target, and rel="nofollow" when that page is noindex (`count` is its result count). */
  const value = (label: Html | string, count: number, on: boolean, change: Partial<ItemsQuery>): FacetValue => {
    const t = target(change);
    const v: FacetValue = { label, count, on, href: href(t) };
    if (itemsNoindex(t, on ? Number.POSITIVE_INFINITY : count)) v.rel = 'nofollow';
    return v;
  };

  const c = result.counts;
  const top = (arr: Uint32Array, ns: string, limit: number, chosen: readonly string[]): FacetValue[] => {
    const values: { label: string; slug: string; count: number; on: boolean }[] = [];
    arr.forEach((n, id) => {
      if (n === 0 && chosen.length === 0) return;
      const t = terms.byId.get(id);
      if (!t || t.ns !== ns) return;
      const on = chosen.includes(t.slug);
      if (n > 0 || on) values.push({ label: t.label, slug: t.slug, count: n, on });
    });
    values.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
    const kept = values.slice(0, limit);
    for (const v of values.slice(limit)) if (v.on) kept.push(v);
    return kept.map((v) => {
      const slug = v.slug;
      const change: Partial<ItemsQuery> =
        ns === 'topic' ? { topic: v.on ? q.topic.filter((t) => t !== slug) : [slug] } : { [ns]: v.on ? null : slug };
      return value(html`<span translate="no">${v.label}</span>`, v.count, v.on, change);
    });
  };

  const kinds = ITEM_KINDS.map((k, i) => value(m.kind[k], c.kind[i] ?? 0, q.kind === k, { kind: q.kind === k ? null : k }))
    .filter((v) => v.count > 0 || v.on);
  const statuses = REPO_STATUSES.map((s, i) => value(m.status[s], c.status[i + 1] ?? 0, q.status === s, { status: q.status === s ? null : s }))
    .filter((v) => v.count > 0 || v.on);
  const categories = ctx.categories
    .map((cat) => value(loc.shown(loc.category(cat)), c.category[cat.id] ?? 0, q.category === cat.slug, { category: q.category === cat.slug ? null : cat.slug }))
    .filter((v) => v.count > 0 || v.on);
  const listValues: (FacetValue & { name: string })[] = [];
  c.list.forEach((n, id) => {
    const l = ctx.listById.get(id);
    if (!l) return;
    const on = q.list === l.slug;
    if (n > 0 || on) listValues.push({ ...value(html`<span translate="no">${l.name}</span>`, n, on, { list: on ? null : l.slug }), name: l.name });
  });
  listValues.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  const lists = [...listValues.slice(0, 10), ...listValues.slice(10).filter((v) => v.on)];
  const stars = STAR_STEPS.map((s, i) =>
    value(loc.t(m.items.starsAtLeast, { n: loc.n(s) }), c.stars[i] ?? 0, q.stars === s, { stars: q.stars === s ? null : s }));
  const inLists = IN_STEPS.map((s, i) =>
    value(loc.t(m.items.inAtLeast, { n: loc.n(s) }), c.in[i] ?? 0, q.in === s, { in: q.in === s ? null : s }));

  const rail = html`<aside class="rail" id="filters">
${facetBlock(ctx, m.items.kind, kinds)}
${facetBlock(ctx, m.items.status, statuses)}
${facetBlock(ctx, m.items.language, top(c.lang, 'lang', 15, q.lang === null ? [] : [q.lang]))}
${facetBlock(ctx, m.items.licence, top(c.license, 'license', 100, q.license === null ? [] : [q.license]), false)}
${facetBlock(ctx, m.items.topic, top(c.topic, 'topic', 20, q.topic), false)}
${facetBlock(ctx, m.items.category, categories, false)}
${facetBlock(ctx, m.items.list, lists, false)}
${facetBlock(ctx, m.items.stars, stars)}
${facetBlock(ctx, m.items.namedBy, inLists)}
</aside>`;

  const chips: Html[] = [];
  const remove = (label: string, change: Partial<ItemsQuery>): void => {
    chips.push(html`<a class="chip on" translate="no" href="${loc.href(href(target(change)))}">${label}<span class="x"> ×</span></a>`);
  };
  if (q.q !== null) remove(loc.t(m.common.searchChip, { q: q.q }), { q: null });
  if (q.kind !== null) remove(`kind:${q.kind}`, { kind: null });
  if (q.status !== null) remove(`status:${q.status}`, { status: null });
  if (q.lang !== null) remove(`lang:${q.lang}`, { lang: null });
  if (q.license !== null) remove(`license:${q.license}`, { license: null });
  for (const t of q.topic) remove(`topic:${t}`, { topic: q.topic.filter((x) => x !== t) });
  if (q.list !== null) remove(`list:${q.list}`, { list: null });
  if (q.category !== null) remove(`category:${q.category}`, { category: null });
  if (q.owner !== null) remove(`owner:${q.owner}`, { owner: null });
  if (q.stars !== null) remove(`stars:${q.stars}+`, { stars: null });
  if (q.in !== null) remove(`in:${q.in}+`, { in: null });

  const sorts = [...(q.q !== null ? ['relevance' as const] : []), ...ITEM_SORTS].map((s) => {
    const word = m.sort[s];
    if (sort === s) return html`<strong>${word}</strong>`;
    const t = target({ sort: s === 'relevance' || (s === 'lists' && q.q === null) ? null : s });
    return link(loc, href(t), word, itemsNoindex(t) ? { rel: 'nofollow' } : {});
  });
  const prev = q.page > 1 && !beyond ? `/items${serialiseItems({ ...q, page: q.page - 1 })}` : null;
  const next = q.page < pages && q.page < MAX_PAGE ? `/items${serialiseItems({ ...q, page: q.page + 1 })}` : null;
  // Later pages are noindex whenever there is a filter.
  const pagerRel = filterCount(q) > 0 || q.q !== null || q.sort !== null ? 'nofollow' : undefined;

  const filters = filterCount(q);
  const label = filters === 1 ? filterLabel(ctx, terms, q) : null;
  let title: string;
  let description: string;
  if (q.q !== null) {
    title = loc.t(m.meta.items.matching, { q: q.q });
    description = loc.plural(m.meta.items.description, result.total);
  } else if (label !== null) {
    title = loc.plural(m.meta.items.filteredTitle, result.total, { label });
    description = loc.plural(m.meta.items.filteredDescription, result.total, { label });
  } else if (filters === 0) {
    title = loc.plural(m.meta.items.title, result.total);
    description = loc.plural(m.meta.items.description, result.total);
  } else {
    title = m.items.h1;
    description = loc.plural(m.meta.items.description, result.total);
  }
  if (q.page > 1) title = loc.t(m.meta.page, { title, page: loc.n(q.page) });

  const main = html`<div class="with-rail">${rail}<div class="results">
<h1>${m.items.h1}</h1>
<form class="search-box" action="${loc.href('/items')}" method="get"><input type="search" name="q" value="${q.q ?? ''}" aria-label="${m.items.searchItems}" placeholder="${m.items.searchItems}">${hidden(q)}<button type="submit" class="btn">${m.common.search}</button></form>
${chips.length > 0 ? html`<p class="chips filters">${chips} ${link(loc, '/items', m.common.clearAll)}</p>` : ''}
<p class="result-count"><a class="to-filters" href="#filters">${m.common.filter}</a>${sortLine(loc, html`${loc.plural(m.count.items, result.total)}${q.q !== null && f.matches !== null && f.matches.length >= MAX_MATCHES ? m.items.bestOnly : ''}`, sorts)}</p>
${beyond ? html`<p class="narrow-down">${loc.t(m.common.pagingStops, { n: loc.n(MAX_PAGE) })}</p>` : ''}
${beyond ? '' : itemRows(loc, items, true)}
${pager(loc, prev, next, pagerRel)}
</div></div>`;
  return page(
    layout(ctx, {
      route: 'items',
      title,
      description,
      canonical: `/items${serialiseItems(q)}`,
      noindex: itemsNoindex(q, result.total),
      main,
      q: q.q,
    }),
  );
}

/** The filters as hidden fields, so a new search keeps them. */
function hidden(q: ItemsQuery): Html {
  const pairs: [string, string | number | null][] = [
    ['kind', q.kind], ['status', q.status], ['lang', q.lang], ['license', q.license],
    ...q.topic.map((t) => ['topic', t] as [string, string]),
    ['list', q.list], ['category', q.category], ['owner', q.owner], ['stars', q.stars], ['in', q.in], ['sort', q.sort],
  ];
  return html`${pairs
    .filter((p): p is [string, string | number] => p[1] !== null)
    .map(([k, v]) => html`<input type="hidden" name="${k}" value="${String(v)}">`)}`;
}
