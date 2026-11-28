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

/** A chip for a term, such as a topic: its label, linking to /items?topic=cli. */
export function tag(loc: Loc, ns: string, slug: string, label = slug): Html {
  return html`<a class="chip" translate="no" href="${loc.href(`/items?${ns}=${encodeParam(slug)}`)}">${label}</a>`;
}

export function itemPath(item: Pick<ItemRow, 'key'>): string {
  return `/${item.key}`;
}

/** A category's name in the request's language, marked lang="en" when it is not translated yet. */
export function categoryName(loc: Loc, cat: CategoryRow): Html {
  return loc.shown(loc.category(cat));
}

export interface EntryOptions {
  /** The name to show, when the list names it otherwise. */
  name?: string;
  /** Up to three of its topics, as #slug. */
  topics?: boolean;
  child?: boolean;
  extras?: readonly { text: string; url: string }[];
  /** A language left out because the page already says it (a list's main language). */
  hideLang?: string | null;
  /** The year of the data: a push in that year is the unmarked case. */
  dataYear: number;
}

/** The topics an entry shows: at most three, none that says nothing or repeats the language. */
export function rowTopics(item: ItemRow): string[] {
  const lang = item.tags.lang?.[0];
  return item.tags.topics.map(([slug]) => slug).filter((s) => !TOPIC_STOP.has(s) && s !== lang).slice(0, 3);
}

/** The parts of an entry's line of facts, in reading order, each left out when it has nothing to say. */
export function entryParts(loc: Loc, item: ItemRow, o: EntryOptions): Part[] {
  const parts: Part[] = [item.owner ?? item.host];
  if (item.tags.lang) {
    if (item.tags.lang[0] !== o.hideLang) parts.push(item.tags.lang[1]);
  } else if (item.kind !== 'repo' && item.kind !== 'site') {
    parts.push((loc.m.kind as Record<string, string>)[item.kind] ?? item.kind);
  }
  if (item.stars !== null) parts.push(loc.t(loc.m.entry.stars, { n: loc.n(item.stars) }));
  if (item.listCount >= 2) parts.push(loc.plural(loc.m.count.inLists, item.listCount));
  const year = yearOf(item.pushedDay);
  if (year !== '' && year !== String(o.dataYear)) parts.push(loc.t(loc.m.entry.updated, { year }));
  if (o.topics) {
    const t = rowTopics(item);
    if (t.length > 0) parts.push(html`<span translate="no">${t.map((s) => `#${s}`).join(' ')}</span>`);
  }
  return parts;
}

/**
 * One item as a line of text: its name (the only link), then what is known, joined by dots; the state's box last.
 * On a phone the facts go under the name. See docs/design.md.
 */
export function entry(loc: Loc, item: ItemRow, o: EntryOptions): Html {
  const name = o.name ?? item.name;
  const word = itemRot(item);
  const extras = (o.extras ?? []).map((e) => outbound(e.url, e.text, { rel: 'nofollow noopener', cls: 'extra' }));
  return html`<li${o.child ? html` class="child"` : ''}><a href="${loc.href(itemPath(item))}" translate="no">${
    item.status === 'gone' ? html`<s>${name}</s>` : name
  }</a> <span class="m">${join(entryParts(loc, item, o), loc.m.common.dot)}${
    word === null ? '' : html` <b class="rot rot-${word}">${loc.m.status[word]}</b>`
  }</span>${extras.length > 0 ? html` ${join(extras, ' ')}` : ''}</li>`;
}

/** The year of the data, from the data date. */
export function dataYearOf(ctx: Pick<Ctx, 'dataDay'>): number {
  return new Date(ctx.dataDay * 86_400_000).getUTCFullYear();
}

export function entries(ctx: Ctx, items: readonly ItemRow[], o: { topics?: boolean } = {}): Html {
  const { loc } = ctx;
  if (items.length === 0) return html`<p class="empty">${loc.m.common.nothingHere}</p>`;
  const dataYear = dataYearOf(ctx);
  return html`<ol class="entries">${items.map((it) => entry(loc, it, { topics: o.topics === true, dataYear }))}</ol>`;
}

export interface ListEntryOptions {
  /** Leave out the category (the page is already one category). */
  noCategory?: boolean;
  /** One more fact at the end of the line, such as how many projects a related list names too. */
  extra?: string;
}

/** A list: its name in the serif, owner/repo, our summary, then one line of facts. */
export function listEntry(ctx: Ctx, list: ListRow, o: ListEntryOptions = {}): Html {
  const { loc } = ctx;
  const cat = list.categoryId === null || o.noCategory ? undefined : ctx.categoryById.get(list.categoryId);
  const summary = loc.summary(list);
  const parts: Part[] = [];
  // A list we could not read has no count to give: its state says so.
  if (list.status === 'unparsed') parts.push(html`<b class="rot rot-quiet">${(loc.m.listStatus as Record<string, string>)[list.status] ?? list.status}</b>`);
  else parts.push(loc.plural(loc.m.count.items, list.itemsMade));
  if (list.stars !== null) parts.push(loc.t(loc.m.entry.stars, { n: loc.n(list.stars) }));
  const year = yearOf(list.pushedDay);
  if (year !== '' && year !== String(dataYearOf(ctx))) parts.push(loc.t(loc.m.entry.updated, { year }));
  if (cat) parts.push(categoryName(loc, cat));
  if (o.extra !== undefined) parts.push(o.extra);
  const word = listRot(list, ctx.dataDay);
  return html`<li><a class="serif" href="${loc.href(`/lists/${list.slug}`)}" translate="no">${list.name}</a> <span class="m mono" translate="no">${list.slug}</span>${
    summary ? html`<p class="s"${summary.en ? html` lang="en"` : ''}>${summary.text}</p>` : ''
  }<p class="m">${join(parts, loc.m.common.dot)}${word === null ? '' : html` <b class="rot rot-${word}">${loc.m.status[word]}</b>`}</p></li>`;
}

export function listEntries(ctx: Ctx, lists: readonly ListRow[], o: ListEntryOptions = {}): Html {
  if (lists.length === 0) return html`<p class="empty">${ctx.loc.m.common.nothingHere}</p>`;
  return html`<ol class="entries lists">${lists.map((l) => listEntry(ctx, l, o))}</ol>`;
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
  ctx: Ctx, name: string, path: string, total: number, rows: readonly { path: string; name: string }[], firstPosition: number, description?: string,
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    ...(description === undefined ? {} : { description }),
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
