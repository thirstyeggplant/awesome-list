// The pieces pages are made of: rows, chips, the rot mark, facts, crumbs, the pager, attribution.
// Names of lists, items and owners and tag chips carry translate="no", so a browser's own translation leaves
// them alone.
import { QUIET_DAYS, TOPIC_STOP } from '../config.js';
import type { CategoryRow, ItemRow, ListRow } from '../db.js';
import { html, join, outbound, type Html, type Part } from '../html.js';
import type { Loc } from '../i18n/loc.js';
import { encodeParam } from '../query.js';
import type { Ctx } from './context.js';

export function yearOf(day: number | null): string {
  return day === null ? '' : String(new Date(day * 86_400_000).getUTCFullYear());
}

export type RotWord = 'archived' | 'quiet' | 'gone';

export function itemRot(item: Pick<ItemRow, 'status'>): RotWord | null {
  return item.status === 'archived' || item.status === 'quiet' || item.status === 'gone' ? item.status : null;
}

export function listRot(list: ListRow, dataDay: number): RotWord | null {
  if (list.status === 'gone') return 'gone';
  if (list.archived === true) return 'archived';
  if (list.pushedDay !== null && list.pushedDay < dataDay - QUIET_DAYS) return 'quiet';
  return null;
}

export function rot(loc: Loc, word: RotWord | null): Html {
  return word === null ? html`` : html` <span class="rot rot-${word}">${loc.m.status[word]}</span>`;
}

/** A link inside the site, in the request's language. */
export function link(loc: Loc, path: string, text: Part, attrs: { cls?: string; rel?: string; current?: boolean } = {}): Html {
  return html`<a href="${loc.href(path)}"${attrs.cls ? html` class="${attrs.cls}"` : ''}${attrs.rel ? html` rel="${attrs.rel}"` : ''}${
    attrs.current ? html` aria-current="true"` : ''
  }>${text}</a>`;
}

/** A tag chip such as lang:go, linking to /items?lang=go. Query syntax, the same in every language. */
export function tag(loc: Loc, ns: string, slug: string): Html {
  return html`<a class="chip" translate="no" href="${loc.href(`/items?${ns}=${encodeParam(slug)}`)}"><span class="ns">${ns}:</span>${slug}</a>`;
}

/** The tags of an item: language, licence, kind (when it says something), status, then topics. */
export function tagsOf(loc: Loc, item: ItemRow, withTopics = false, withStatus = false): Html[] {
  const out: Html[] = [];
  if (item.tags.lang) out.push(tag(loc, 'lang', item.tags.lang[0]));
  if (item.tags.license) out.push(tag(loc, 'license', item.tags.license[0]));
  if (item.kind !== 'repo' && item.kind !== 'site') out.push(tag(loc, 'kind', item.kind));
  if (withStatus && item.status !== null) out.push(tag(loc, 'status', item.status));
  if (withTopics) for (const [slug] of item.tags.topics) out.push(tag(loc, 'topic', slug));
  return out;
}

export function itemPath(item: Pick<ItemRow, 'key'>): string {
  return `/${item.key}`;
}

/** A category's name in the request's language, marked lang="en" when it is not translated yet. */
export function categoryName(loc: Loc, cat: CategoryRow): Html {
  return loc.shown(loc.category(cat));
}

export interface ItemRowOptions {
  /** The name to show, when the list names it otherwise. */
  name?: string;
  /** Show up to two of its topics as chips. */
  topics?: boolean;
  child?: boolean;
  extras?: readonly { text: string; url: string }[];
}

/** The topics a row shows: at most two, none that says nothing or repeats the language. */
export function rowTopics(item: ItemRow): string[] {
  const lang = item.tags.lang?.[0];
  return item.tags.topics.map(([slug]) => slug).filter((s) => !TOPIC_STOP.has(s) && s !== lang).slice(0, 2);
}

/** The language column: the language of a repository, else the kind of a thing that is not a site. */
function langCell(loc: Loc, item: ItemRow): Html {
  if (item.tags.lang) {
    return html`<a href="${loc.href(`/items?lang=${encodeParam(item.tags.lang[0])}`)}" translate="no">${item.tags.lang[1]}</a>`;
  }
  if (item.kind === 'repo' || item.kind === 'site') return html``;
  const word = (loc.m.kind as Record<string, string>)[item.kind] ?? item.kind;
  return html`<a href="${loc.href(`/items?kind=${encodeParam(item.kind)}`)}">${word}</a>`;
}

/**
 * One item: name, owner or host, state, topics; then language, stars, lists (only when two or more) and the
 * year of the last push. In a narrow container the row is two lines: see docs/design.md.
 */
export function itemRow(loc: Loc, item: ItemRow, o: ItemRowOptions = {}): Html {
  const name = o.name ?? item.name;
  const chips = o.topics ? rowTopics(item).map((t) => tag(loc, 'topic', t)) : [];
  const extras = (o.extras ?? []).map((e) => outbound(e.url, e.text, { rel: 'nofollow noopener', cls: 'extra' }));
  const lists = item.listCount >= 2 ? loc.plural(loc.m.count.inLists, item.listCount) : '';
  const year = yearOf(item.pushedDay);
  return html`<li class="row item${o.child ? ' child' : ''}"><span class="main"><span class="who"><a class="name" translate="no" href="${loc.href(itemPath(item))}">${
    item.status === 'gone' ? html`<s>${name}</s>` : name
  }</a> <span class="sub" translate="no">${item.owner ?? item.host}</span>${rot(loc, itemRot(item))}</span>${
    chips.length > 0 ? html` <span class="chips">${join(chips, ' ')}</span>` : ''
  }${extras.length > 0 ? html` <span class="extras">${join(extras, ' ')}</span>` : ''}</span><span class="nums"><span class="num lang">${langCell(loc, item)}</span><span class="num stars">${
    item.stars === null ? '' : html`${loc.n(item.stars)}<span class="unit"> ★</span>`
  }</span><span class="num in">${
    lists === '' ? '' : html`<span class="short" title="${lists}">${loc.n(item.listCount)}</span><span class="long">${lists}</span>`
  }</span><span class="num year"${year === '' ? '' : html` aria-label="${loc.m.facts.lastPush} ${year}"`}>${year}</span></span></li>`;
}

/** The labels over a group of item rows, on the rows' own grid. Not read out: each cell says what it is. */
export function itemRowsHead(loc: Loc): Html {
  const c = loc.m.common.columns;
  return html`<div class="rows-head" aria-hidden="true"><span>${c.name}</span><span>${c.language}</span><span class="r">${c.stars}</span><span class="r">${c.lists}</span><span class="r">${c.updated}</span></div>`;
}

export function itemRows(loc: Loc, items: readonly ItemRow[], topics = false): Html {
  if (items.length === 0) return html`<p class="empty">${loc.m.common.nothingHere}</p>`;
  return html`<div class="rowset">${itemRowsHead(loc)}<ol class="rows">${items.map((it) => itemRow(loc, it, { topics }))}</ol></div>`;
}

export interface ListRowOptions {
  /** Leave out the category chip (the page is already one category). */
  noCategory?: boolean;
}

export function listRow(ctx: Ctx, list: ListRow, o: ListRowOptions = {}): Html {
  const { loc } = ctx;
  const cat = list.categoryId === null || o.noCategory ? undefined : ctx.categoryById.get(list.categoryId);
  const summary = loc.summary(list);
  // A list we could not read has no count to give: its state says so.
  const items = list.status === 'unparsed'
    ? html`<span class="rot rot-quiet">${(loc.m.listStatus as Record<string, string>)[list.status] ?? list.status}</span>`
    : loc.plural(loc.m.count.items, list.itemsMade);
  return html`<li class="row list-row"><span class="main"><span class="who"><a class="name serif" translate="no" href="${loc.href(`/lists/${list.slug}`)}">${list.name}</a> <span class="sub mono" translate="no">${
    list.slug
  }</span>${rot(loc, listRot(list, ctx.dataDay))}</span>${
    cat ? html` <span class="chips"><a class="chip" href="${loc.href(`/lists?category=${cat.slug}`)}">${categoryName(loc, cat)}</a></span>` : ''
  }</span><span class="nums"><span class="num in">${items}</span><span class="num stars">${
    list.stars === null ? '' : html`${loc.n(list.stars)}<span class="unit"> ★</span>`
  }</span><span class="num year">${yearOf(list.pushedDay)}</span></span>${
    summary ? html`<span class="summary"${summary.en ? html` lang="en"` : ''}>${summary.text}</span>` : ''
  }</li>`;
}

/** List rows under their labels: name, items, stars, updated. */
export function listRows(ctx: Ctx, lists: readonly ListRow[], o: ListRowOptions = {}): Html {
  const c = ctx.loc.m.common.columns;
  return html`<div class="rowset"><div class="rows-head lists" aria-hidden="true"><span>${c.name}</span><span class="r">${c.items}</span><span class="r">${c.stars}</span><span class="r">${c.updated}</span></div><ol class="rows lists">${lists.map(
    (l) => listRow(ctx, l, o),
  )}</ol></div>`;
}

export function facts(pairs: readonly (readonly [string, Part])[]): Html {
  const shown = pairs.filter(([, v]) => v !== null && v !== '' && v !== undefined && v !== false);
  return html`<dl class="facts">${shown.map(([k, v]) => html`<div><dt>${k}</dt><dd>${v}</dd></div>`)}</dl>`;
}

/**
 * The head of a rail that opens as a sheet on a phone (the address's #id shows it): its title, and a link that
 * closes it by going to `back`. Not shown on a wide screen.
 */
export function sheetHead(loc: Loc, title: string, back: string): Html {
  return html`<p class="sheet-head"><span class="rail-title">${title}</span><a class="sheet-close" href="#${back}" aria-label="${loc.m.lang.close}">×</a></p>`;
}

export function crumbs(loc: Loc, parts: readonly Part[]): Html {
  return html`<nav class="crumbs" aria-label="${loc.m.site.breadcrumb}">${join(parts, html`<span class="sep"> › </span>`)}</nav>`;
}

/** Previous, where the reader is, and next. Both are inside the site; `rel` marks a target that is noindex. */
export function pager(loc: Loc, prev: string | null, next: string | null, rel?: string, at?: { page: number; pages: number }): Html {
  if (prev === null && next === null) return html``;
  const a = (path: string, text: string): Html => link(loc, path, text, rel === undefined ? { cls: 'btn' } : { cls: 'btn', rel });
  return html`<nav class="pager">${prev === null ? html`<span></span>` : a(prev, loc.m.common.previous)}${
    at === undefined ? '' : html`<span class="page-of">${loc.t(loc.m.common.pageOf, { page: loc.n(at.page), pages: loc.n(at.pages) })}</span>`
  }${next === null ? html`<span></span>` : a(next, loc.m.common.next)}</nav>`;
}

/** The WebSite of structured data, as the pages that are part of it name it. */
export function webSite(ctx: Ctx): Record<string, unknown> {
  return { '@type': 'WebSite', name: ctx.siteName, url: absolute(ctx, '/'), inLanguage: ctx.loc.info.hreflang };
}

/** A CollectionPage whose main entity is the list of rows on the page, as /lists and /items describe themselves. */
export function itemListLd(
  ctx: Ctx, name: string, path: string, total: number, rows: readonly { path: string; name: string }[], firstPosition: number,
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    url: absolute(ctx, path),
    inLanguage: ctx.loc.info.hreflang,
    isPartOf: webSite(ctx),
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: total,
      itemListElement: rows.map((r, i) => ({ '@type': 'ListItem', position: firstPosition + i, url: absolute(ctx, r.path), name: r.name })),
    },
  };
}

export function searchBox(loc: Loc, value: string | null, label = loc.m.common.searchListsAndItems): Html {
  return html`<form class="search-box" action="${loc.href('/search')}" method="get" role="search"><input type="search" name="q" value="${
    value ?? ''
  }" aria-label="${label}" placeholder="${label}"><button type="submit" class="btn primary">${loc.m.common.search}</button></form>`;
}

/** "12 lists · sort by stars · items · …": the count, then the sort words, the current one in bold. */
export function sortLine(loc: Loc, count: Part, sorts: readonly Html[]): Html {
  return loc.h(loc.m.common.sortBy, { count: html`<span class="total">${count}</span>`, sorts: html`<span class="sorts">${join(sorts, ' · ')}</span>` });
}

/** An absolute address inside the site, in the request's language (for structured data). */
export function absolute(ctx: Ctx, path: string): string {
  return ctx.origin + ctx.loc.href(path);
}

/** A BreadcrumbList of structured data: [name, path] from the outermost. */
export function breadcrumbLd(ctx: Ctx, trail: readonly (readonly [string, string])[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: absolute(ctx, path) })),
  };
}
