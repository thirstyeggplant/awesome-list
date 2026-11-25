// /items: every item, filtered by facets, 50 at a time.
import { MAX_MATCHES, MAX_PAGE, PAGE_SIZE } from '../config.js';
import type { Db } from '../db.js';
import { NO_FILTERS, type FacetIndex, type Filters } from '../facets.js';
import { html, type Html } from '../html.js';
import { ITEM_KINDS, REPO_STATUSES } from '../../enums.js';
import { filterCount, IN_STEPS, ITEM_SORTS, serialiseItems, STAR_STEPS, type ItemsQuery } from '../query.js';
import { itemIds } from '../search.js';
import type { Terms } from '../terms.js';
import { chip, itemRows, num, pager, plural } from './components.js';
import type { Ctx } from './context.js';
import { layout } from './layout.js';
import { page, type ViewResult } from './result.js';

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

interface FacetValue { label: string; href: string; count: number; on: boolean }

function facetBlock(title: string, values: readonly FacetValue[], open = true): Html {
  if (values.length === 0) return html``;
  return html`<details class="facet"${open ? html` open` : ''}><summary>${title}</summary><ul>${values.map(
    (v) => html`<li${v.on ? html` class="on"` : ''}><a href="${v.href}"${v.on ? html` aria-current="true"` : ''}>${v.label}</a> <span class="num">${num(v.count)}</span></li>`,
  )}</ul></details>`;
}

export async function itemsPage(ctx: Ctx, db: Db, facets: FacetIndex, terms: Terms, q: ItemsQuery): Promise<ViewResult> {
  const f = await resolveFilters(ctx, db, facets, terms, q);
  if (f === null) return null;
  const beyond = q.page > MAX_PAGE;
  const sort = q.sort ?? (q.q !== null ? 'relevance' : 'lists');
  const result = facets.run(f, sort, beyond ? 1 : q.page, PAGE_SIZE);
  const ids = beyond ? [] : result.ids;
  const items = await db.itemsByIds(ids);
  const href = (change: Partial<ItemsQuery>): string => `/items${serialiseItems({ ...q, page: 1, ...change })}`;

  const c = result.counts;
  const top = (arr: Uint32Array, ns: string, limit: number, chosen: readonly string[]): FacetValue[] => {
    const values: (FacetValue & { slug: string })[] = [];
    arr.forEach((n, id) => {
      if (n === 0 && chosen.length === 0) return;
      const t = terms.byId.get(id);
      if (!t || t.ns !== ns) return;
      const on = chosen.includes(t.slug);
      if (n > 0 || on) values.push({ label: t.label, slug: t.slug, href: '', count: n, on });
    });
    values.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
    const kept = values.slice(0, limit);
    for (const v of values.slice(limit)) if (v.on) kept.push(v);
    return kept.map((v) => {
      const slug = v.slug;
      const change: Partial<ItemsQuery> =
        ns === 'topic' ? { topic: v.on ? q.topic.filter((t) => t !== slug) : [slug] } : { [ns]: v.on ? null : slug };
      return { ...v, href: href(change) };
    });
  };

  const kinds = ITEM_KINDS.map((k, i) => ({
    label: k, count: c.kind[i] ?? 0, on: q.kind === k, href: href({ kind: q.kind === k ? null : k }),
  })).filter((v) => v.count > 0 || v.on);
  const statuses = REPO_STATUSES.map((s, i) => ({
    label: s, count: c.status[i + 1] ?? 0, on: q.status === s, href: href({ status: q.status === s ? null : s }),
  })).filter((v) => v.count > 0 || v.on);
  const categories = ctx.categories
    .map((cat) => ({
      label: cat.name, count: c.category[cat.id] ?? 0, on: q.category === cat.slug,
      href: href({ category: q.category === cat.slug ? null : cat.slug }),
    }))
    .filter((v) => v.count > 0 || v.on);
  const listValues: FacetValue[] = [];
  c.list.forEach((n, id) => {
    const l = ctx.listById.get(id);
    if (!l) return;
    const on = q.list === l.slug;
    if (n > 0 || on) listValues.push({ label: l.name, count: n, on, href: href({ list: on ? null : l.slug }) });
  });
  listValues.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  const lists = [...listValues.slice(0, 10), ...listValues.slice(10).filter((v) => v.on)];
  const stars = STAR_STEPS.map((s, i) => ({
    label: `${num(s)}+ stars`, count: c.stars[i] ?? 0, on: q.stars === s, href: href({ stars: q.stars === s ? null : s }),
  }));
  const inLists = IN_STEPS.map((s, i) => ({
    label: `in ${s}+ lists`, count: c.in[i] ?? 0, on: q.in === s, href: href({ in: q.in === s ? null : s }),
  }));

  const rail = html`<aside class="rail">
${facetBlock('Kind', kinds)}
${facetBlock('Status', statuses)}
${facetBlock('Language', top(c.lang, 'lang', 15, q.lang === null ? [] : [q.lang]))}
${facetBlock('Licence', top(c.license, 'license', 100, q.license === null ? [] : [q.license]), false)}
${facetBlock('Topic', top(c.topic, 'topic', 20, q.topic), false)}
${facetBlock('Category', categories, false)}
${facetBlock('List', lists, false)}
${facetBlock('Stars', stars)}
${facetBlock('Named by', inLists)}
</aside>`;

  const chips: Html[] = [];
  const remove = (label: string, change: Partial<ItemsQuery>): void => {
    chips.push(chip(`${label} ×`, href(change)));
  };
  if (q.q !== null) remove(`“${q.q}”`, { q: null });
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

  const sorts = [...(q.q !== null ? ['relevance'] : []), ...ITEM_SORTS].map((s) => {
    const on = sort === s;
    const target = s === 'relevance' || (s === 'lists' && q.q === null) ? null : (s as ItemsQuery['sort']);
    return on ? html`<strong>${s}</strong>` : html`<a href="${href({ sort: target })}">${s}</a>`;
  });
  const pages = Math.ceil(result.total / PAGE_SIZE);
  const prev = q.page > 1 && !beyond ? `/items${serialiseItems({ ...q, page: q.page - 1 })}` : null;
  const next = q.page < pages && q.page < MAX_PAGE ? `/items${serialiseItems({ ...q, page: q.page + 1 })}` : null;

  const main = html`<div class="with-rail">${rail}<div class="results">
<h1>Items</h1>
<form class="search-box" action="/items" method="get"><input type="search" name="q" value="${q.q ?? ''}" aria-label="Search items" placeholder="Search items">${hidden(q)}<button type="submit">Search</button></form>
${chips.length > 0 ? html`<p class="chips filters">${chips} <a href="/items">Clear all</a></p>` : ''}
<p class="result-count">${plural(result.total, 'item')}${q.q !== null && f.matches !== null && f.matches.length >= MAX_MATCHES ? ' (the best matches only)' : ''} · sort by ${sorts.map((s, i) => (i === 0 ? s : html` · ${s}`))}</p>
${beyond ? html`<p class="narrow-down">Paging stops at page ${MAX_PAGE}. Narrow the filters to see more.</p>` : ''}
${beyond ? '' : itemRows(items, true)}
${pager(prev, next)}
</div></div>`;
  return page(
    layout(ctx, {
      title: q.q !== null ? `Items matching “${q.q}”` : 'Items',
      description: `${num(result.total)} things named by awesome lists.`,
      canonical: `/items${serialiseItems(q)}`,
      noindex: q.q !== null || filterCount(q) >= 2 || q.sort !== null || beyond,
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
