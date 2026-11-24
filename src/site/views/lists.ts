// /lists: every list, filtered and sorted in memory.
import { MAX_PAGE, PAGE_SIZE } from '../config.js';
import type { Db, ListRow } from '../db.js';
import { html, type Html } from '../html.js';
import { slugify } from '../keys.js';
import { LIST_STATUSES } from '../../model.js';
import { serialiseLists, type ListsQuery } from '../query.js';
import { listIds } from '../search.js';
import { chip, listRow, num, pager, plural } from './components.js';
import type { Ctx } from './context.js';
import { layout } from './layout.js';
import { page, type ViewResult } from './result.js';

type Dim = 'category' | 'license' | 'status';

function value(ctx: Ctx, l: ListRow, d: Dim): string | null {
  if (d === 'category') return l.categoryId === null ? null : (ctx.categoryById.get(l.categoryId)?.slug ?? null);
  if (d === 'license') return l.license === null ? null : slugify(l.license);
  return l.status;
}

export function listsPage(ctx: Ctx, db: Db, q: ListsQuery): ViewResult {
  if (q.category !== null && !ctx.categoryBySlug.has(q.category)) return null;
  if (q.license !== null && !ctx.lists.some((l) => l.license !== null && slugify(l.license) === q.license)) return null;

  let pool: ListRow[] = [...ctx.lists];
  if (q.q !== null) {
    pool = listIds(db, q.q, 1000)
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

  const counts = (d: Dim): Map<string, number> => {
    const m = new Map<string, number>();
    for (const l of pool) {
      if (!passes(l, d)) continue;
      const v = value(ctx, l, d);
      if (v !== null) m.set(v, (m.get(v) ?? 0) + 1);
    }
    return m;
  };
  const label = (d: Dim, v: string): string => {
    if (d === 'category') return ctx.categoryBySlug.get(v)?.name ?? v;
    if (d === 'license') return ctx.lists.find((l) => l.license !== null && slugify(l.license) === v)?.license ?? v;
    return v;
  };
  const facet = (d: Dim, title: string, order: (a: [string, number], b: [string, number]) => number): Html => {
    const entries = [...counts(d)].sort(order);
    return html`<details class="facet" open><summary>${title}</summary><ul>${entries.map(([v, n]) => {
      const on = chosen[d] === v;
      const href = `/lists${serialiseLists({ ...q, [d]: on ? null : v, page: 1 })}`;
      return html`<li${on ? html` class="on"` : ''}><a href="${href}"${on ? html` aria-current="true"` : ''}>${label(d, v)}</a> <span class="num">${num(n)}</span></li>`;
    })}</ul></details>`;
  };
  const catPos = new Map(ctx.categories.map((c) => [c.slug, c.position]));
  const rail = html`<aside class="rail">
${facet('category', 'Category', (a, b) => (catPos.get(a[0]) ?? 0) - (catPos.get(b[0]) ?? 0))}
${facet('license', 'Licence', (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))}
${facet('status', 'Status', (a, b) => LIST_STATUSES.indexOf(a[0] as never) - LIST_STATUSES.indexOf(b[0] as never))}
</aside>`;

  const total = rows.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const beyond = q.page > MAX_PAGE;
  const shown = beyond ? [] : rows.slice((q.page - 1) * PAGE_SIZE, q.page * PAGE_SIZE);
  const prev = q.page > 1 && !beyond ? `/lists${serialiseLists({ ...q, page: q.page - 1 })}` : null;
  const next = q.page < pages && q.page < MAX_PAGE ? `/lists${serialiseLists({ ...q, page: q.page + 1 })}` : null;
  const chips = [
    q.q !== null ? chip(`“${q.q}” ×`, `/lists${serialiseLists({ ...q, q: null, page: 1 })}`) : null,
    ...dims.map((d) => {
      const v = chosen[d];
      return v === null ? null : chip(`${d}:${v} ×`, `/lists${serialiseLists({ ...q, [d]: null, page: 1 })}`);
    }),
  ].filter((c): c is Html => c !== null);
  const sorts = (['stars', 'items', 'updated', 'name'] as const).map((s) => {
    const on = sort === s;
    const href = `/lists${serialiseLists({ ...q, sort: s === 'stars' && q.q === null ? null : s, page: 1 })}`;
    return on ? html`<strong>${s}</strong>` : html`<a href="${href}">${s}</a>`;
  });
  const filters = [q.category, q.license, q.status].filter((v) => v !== null).length;
  const main = html`<div class="with-rail">${rail}<div class="results">
<h1>Lists</h1>
<form class="search-box" action="/lists" method="get"><input type="search" name="q" value="${q.q ?? ''}" aria-label="Filter lists" placeholder="Filter lists"><button type="submit">Filter</button></form>
${chips.length > 0 ? html`<p class="chips filters">${chips} <a href="/lists">Clear all</a></p>` : ''}
<p class="result-count">${plural(total, 'list')} · sort by ${sorts.map((s, i) => (i === 0 ? s : html` · ${s}`))}</p>
${beyond ? html`<p class="narrow-down">Paging stops at page ${MAX_PAGE}. Narrow the filters to see more.</p>` : ''}
<ol class="rows lists">${shown.map((l) => listRow(ctx, l))}</ol>
${pager(prev, next)}
</div></div>`;
  return page(
    layout(ctx, {
      title: 'Lists',
      description: `${num(ctx.lists.length)} awesome lists, with their sizes, stars and our own summaries.`,
      canonical: `/lists${serialiseLists(q)}`,
      noindex: q.q !== null || filters >= 2 || q.sort !== null || beyond,
      main,
    }),
  );
}
