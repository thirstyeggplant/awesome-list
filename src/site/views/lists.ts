// /lists: every list, filtered and sorted in memory.
import { MAX_PAGE, PAGE_SIZE } from '../config.js';
import type { Db, ListRow } from '../db.js';
import { html, type Html } from '../html.js';
import { slugify } from '../keys.js';
import { LIST_STATUSES } from '../../enums.js';
import { serialiseLists, type ListsQuery } from '../query.js';
import { listIds } from '../search.js';
import { breadcrumbLd, itemListLd, link, listEntries, pager, sortLine, sheetHead } from './components.js';
import type { Ctx } from './context.js';
import { layout } from './layout.js';
import { page, type ViewResult } from './result.js';

type Dim = 'category' | 'license' | 'status';

function value(ctx: Ctx, l: ListRow, d: Dim): string | null {
  if (d === 'category') return l.categoryId === null ? null : (ctx.categoryById.get(l.categoryId)?.slug ?? null);
  if (d === 'license') return l.license === null ? null : slugify(l.license);
  return l.status;
}

/**
 * Whether a page of /lists is kept out of search engines: a search, two filters, a sort, past the paging, or a
 * licence or a status (slices nobody searches for). The bare page, a category and their pages stay.
 */
export function listsNoindex(q: ListsQuery): boolean {
  const filters = [q.category, q.license, q.status].filter((v) => v !== null).length;
  return q.q !== null || filters >= 2 || q.sort !== null || q.page > MAX_PAGE || q.license !== null || q.status !== null;
}

export async function listsPage(ctx: Ctx, db: Db, q: ListsQuery): Promise<ViewResult> {
  const { loc } = ctx;
  const m = loc.m;
  if (q.category !== null && !ctx.categoryBySlug.has(q.category)) return null;
  if (q.license !== null && !ctx.lists.some((l) => l.license !== null && slugify(l.license) === q.license)) return null;

  let pool: ListRow[] = [...ctx.lists];
  if (q.q !== null) {
    pool = (await listIds(db, q.q, 1000))
      .map((id) => ctx.listById.get(id))
      .filter((l): l is ListRow => l !== undefined);
  }
  const chosen: Record<Dim, string | null> = { category: q.category, license: q.license, status: q.status };
  const dims: Dim[] = ['category', 'license', 'status'];
  const passes = (l: ListRow, except: Dim | null): boolean =>
    dims.every((d) => d === except || chosen[d] === null || value(ctx, l, d) === chosen[d]);
  let rows = pool.filter((l) => passes(l, null));
  const sort = q.sort ?? (q.q !== null ? null : 'stars');
  if (sort === 'items') rows = [...rows].sort((a, b) => b.itemsMade - a.itemsMade || a.id - b.id);
  else if (sort === 'updated') rows = [...rows].sort((a, b) => (b.pushedDay ?? -1) - (a.pushedDay ?? -1) || a.id - b.id);
  else if (sort === 'name') rows = [...rows].sort((a, b) => a.name.localeCompare(b.name) || a.id - b.id);
  else if (sort === 'stars') rows = [...rows].sort((a, b) => a.id - b.id);

  const total = rows.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  // A page past the last is not there (paging past 200 says to narrow the filters instead).
  if (q.page > pages && q.page <= MAX_PAGE) return null;

  const counts = (d: Dim): Map<string, number> => {
    const out = new Map<string, number>();
    for (const l of pool) {
      if (!passes(l, d)) continue;
      const v = value(ctx, l, d);
      if (v !== null) out.set(v, (out.get(v) ?? 0) + 1);
    }
    return out;
  };
  const label = (d: Dim, v: string): Html => {
    if (d === 'category') {
      const cat = ctx.categoryBySlug.get(v);
      return cat ? loc.shown(loc.category(cat)) : html`${v}`;
    }
    if (d === 'license') return html`${ctx.lists.find((l) => l.license !== null && slugify(l.license) === v)?.license ?? v}`;
    return html`${(m.listStatus as Record<string, string>)[v] ?? v}`;
  };
  const to = (change: Partial<ListsQuery>): ListsQuery => ({ ...q, page: 1, ...change });
  /** A link to another page of /lists, rel="nofollow" when that page is noindex. */
  const go = (target: ListsQuery, text: Html | string, current = false): Html =>
    link(loc, `/lists${serialiseLists(target)}`, text, { current, ...(listsNoindex(target) ? { rel: 'nofollow' } : {}) });
  const facet = (d: Dim, title: string, order: (a: [string, number], b: [string, number]) => number): Html => {
    const entries = [...counts(d)].sort(order);
    return html`<details class="facet" open><summary>${title}</summary><ul>${entries.map(([v, n]) => {
      const on = chosen[d] === v;
      return html`<li${on ? html` class="on"` : ''}>${go(to({ [d]: on ? null : v }), label(d, v), on)} <span class="num">${loc.n(n)}</span></li>`;
    })}</ul></details>`;
  };
  const catPos = new Map(ctx.categories.map((c) => [c.slug, c.position]));
  const rail = html`<aside class="rail sheet" id="_filters">
${sheetHead(loc, m.common.filter, 'results')}
${facet('category', m.lists.category, (a, b) => (catPos.get(a[0]) ?? 0) - (catPos.get(b[0]) ?? 0))}
${facet('license', m.lists.licence, (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))}
${facet('status', m.lists.status, (a, b) => LIST_STATUSES.indexOf(a[0] as never) - LIST_STATUSES.indexOf(b[0] as never))}
</aside>`;

  const beyond = q.page > MAX_PAGE;
  const shown = beyond ? [] : rows.slice((q.page - 1) * PAGE_SIZE, q.page * PAGE_SIZE);
  const prev = q.page > 1 && !beyond ? `/lists${serialiseLists({ ...q, page: q.page - 1 })}` : null;
  const next = q.page < pages && q.page < MAX_PAGE ? `/lists${serialiseLists({ ...q, page: q.page + 1 })}` : null;
  const chip = (text: string, target: ListsQuery): Html =>
    html`<a class="chip on" href="${loc.href(`/lists${serialiseLists(target)}`)}">${text}<span class="x"> ×</span></a>`;
  const chips = [
    q.q !== null ? chip(loc.t(m.common.searchChip, { q: q.q }), to({ q: null })) : null,
    ...dims.map((d) => {
      const v = chosen[d];
      return v === null ? null : chip(`${d}:${v}`, to({ [d]: null }));
    }),
  ].filter((c): c is Html => c !== null);
  const sorts = (['stars', 'items', 'updated', 'name'] as const).map((s) => {
    const word = m.sort[s];
    return sort === s ? html`<strong>${word}</strong>` : go(to({ sort: s === 'stars' && q.q === null ? null : s }), word);
  });

  // The title: all lists, a category, or a listing that is not offered to search engines in its own words.
  const cat = q.category === null ? undefined : ctx.categoryBySlug.get(q.category);
  const onlyCategory = q.q === null && q.license === null && q.status === null;
  const catName = cat ? loc.category(cat).text : '';
  let title: string = m.lists.h1;
  let description = loc.plural(m.meta.lists.description, total);
  if (cat && onlyCategory) {
    title = loc.plural(m.meta.category.title, total, { category: catName });
    description = loc.plural(m.meta.category.description, total, { category: catName });
  } else if (!cat && onlyCategory) {
    title = loc.plural(m.meta.lists.title, total);
  }
  if (q.page > 1) title = loc.t(m.meta.page, { title, page: loc.n(q.page) });
  // The h1 says the one filter: a category's name, a licence, a status.
  const onlyOne = q.q === null && [q.category, q.license, q.status].filter((v) => v !== null).length === 1;
  const h1 = cat && onlyCategory
    ? loc.shown(loc.category(cat))
    : onlyOne && q.license !== null
      ? label('license', q.license)
      : onlyOne && q.status !== null
        ? label('status', q.status)
        : html`${m.lists.h1}`;
  const canonical = `/lists${serialiseLists(q)}`;

  const main = html`<div class="with-rail">${rail}<div class="results" id="results">
<h1>${h1}</h1>
<form class="search-box" action="${loc.href('/lists')}" method="get"><input type="search" name="q" value="${q.q ?? ''}" aria-label="${m.lists.filterLists}" placeholder="${m.lists.filterLists}"><button type="submit" class="btn">${m.common.filter}</button><a class="btn to-sheet" href="#_filters">${m.common.filter}</a></form>
${chips.length > 0 ? html`<p class="chips filters">${chips} ${link(loc, '/lists', m.common.clearAll, { cls: 'clear' })}</p>` : ''}
<p class="result-count">${sortLine(loc, loc.plural(m.count.lists, total), sorts)}</p>
${beyond ? html`<p class="narrow-down">${loc.t(m.common.pagingStops, { n: loc.n(MAX_PAGE) })}</p>` : ''}
${listEntries(ctx, shown, { noCategory: q.category !== null })}
${pager(loc, prev, next, undefined, { page: q.page, pages: Math.min(pages, MAX_PAGE) })}
</div></div>`;

  const ld: unknown[] = [
    itemListLd(ctx, title, canonical, total, shown.map((l) => ({ path: `/lists/${l.slug}`, name: l.name })), (q.page - 1) * PAGE_SIZE + 1),
  ];
  if (cat && onlyCategory) ld.push(breadcrumbLd(ctx, [[m.nav.lists, '/lists'], [catName, `/lists?category=${cat.slug}`]]));

  return page(
    layout(ctx, {
      route: 'lists',
      title,
      description,
      canonical,
      noindex: listsNoindex(q),
      main,
      prev,
      next,
      jsonLd: ld,
    }),
  );
}
