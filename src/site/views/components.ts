// The pieces pages are made of: rows, chips, the rot mark, facts, crumbs, the pager, attribution.
// Names of lists, items and owners and tag chips carry translate="no", so a browser's own translation leaves
// them alone.
import { QUIET_DAYS } from '../config.js';
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
  return html`<a class="chip" translate="no" href="${loc.href(`/items?${ns}=${encodeParam(slug)}`)}">${ns}:${slug}</a>`;
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
  /** Show its topics among the chips. */
  topics?: boolean;
  child?: boolean;
  extras?: readonly { text: string; url: string }[];
}

export function itemRow(loc: Loc, item: ItemRow, o: ItemRowOptions = {}): Html {
  const name = o.name ?? item.name;
  const chips = tagsOf(loc, item, o.topics ?? false).slice(0, 3);
  const extras = (o.extras ?? []).map((e) => outbound(e.url, e.text, { rel: 'nofollow noopener', cls: 'extra' }));
  return html`<li class="row${o.child ? ' child' : ''}"><span class="main"><a class="name" translate="no" href="${loc.href(itemPath(item))}">${
    item.status === 'gone' ? html`<s>${name}</s>` : name
  }</a> <span class="sub" translate="no">${item.owner ?? item.host}</span>${rot(loc, itemRot(item))}${
    chips.length > 0 ? html` <span class="chips">${join(chips, ' ')}</span>` : ''
  }${extras.length > 0 ? html` <span class="extras">${join(extras, ' ')}</span>` : ''}</span><span class="num stars">${
    item.stars === null ? '' : html`${loc.n(item.stars)}<span class="unit"> ★</span>`
  }</span><span class="num">${loc.plural(loc.m.count.lists, item.listCount)}</span><span class="num year">${yearOf(item.pushedDay)}</span></li>`;
}

export function itemRows(loc: Loc, items: readonly ItemRow[], topics = false): Html {
  if (items.length === 0) return html`<p class="empty">${loc.m.common.nothingHere}</p>`;
  return html`<ol class="rows">${items.map((it) => itemRow(loc, it, { topics }))}</ol>`;
}

export function listRow(ctx: Ctx, list: ListRow): Html {
  const { loc } = ctx;
  const cat = list.categoryId === null ? undefined : ctx.categoryById.get(list.categoryId);
  const summary = loc.summary(list);
  return html`<li class="row list-row"><span class="main"><a class="name serif" translate="no" href="${loc.href(`/lists/${list.slug}`)}">${list.name}</a> <span class="sub" translate="no">${
    list.slug
  }</span>${rot(loc, listRot(list, ctx.dataDay))}${
    cat ? html` <a class="chip" href="${loc.href(`/lists?category=${cat.slug}`)}">${categoryName(loc, cat)}</a>` : ''
  }</span><span class="num">${loc.plural(loc.m.count.items, list.itemsMade)}</span><span class="num stars">${
    list.stars === null ? '' : html`${loc.n(list.stars)}<span class="unit"> ★</span>`
  }</span><span class="num year">${yearOf(list.pushedDay)}</span>${
    summary ? html`<span class="summary"${summary.en ? html` lang="en"` : ''}>${summary.text}</span>` : ''
  }</li>`;
}

export function facts(pairs: readonly (readonly [string, Part])[]): Html {
  const shown = pairs.filter(([, v]) => v !== null && v !== '' && v !== undefined && v !== false);
  return html`<dl class="facts">${shown.map(([k, v]) => html`<div><dt>${k}</dt><dd>${v}</dd></div>`)}</dl>`;
}

export function crumbs(loc: Loc, parts: readonly Part[]): Html {
  return html`<nav class="crumbs" aria-label="${loc.m.site.breadcrumb}">${join(parts, html`<span class="sep"> › </span>`)}</nav>`;
}

/** Previous and next. Both are inside the site; `rel` marks a target that is noindex. */
export function pager(loc: Loc, prev: string | null, next: string | null, rel?: string): Html {
  if (prev === null && next === null) return html``;
  const a = (path: string, text: string): Html => link(loc, path, text, rel === undefined ? {} : { rel });
  return html`<nav class="pager">${prev === null ? html`<span></span>` : a(prev, loc.m.common.previous)}${
    next === null ? html`<span></span>` : a(next, loc.m.common.next)
  }</nav>`;
}

export function searchBox(loc: Loc, value: string | null, label = loc.m.common.searchListsAndItems): Html {
  return html`<form class="search-box" action="${loc.href('/search')}" method="get" role="search"><input type="search" name="q" value="${
    value ?? ''
  }" aria-label="${label}" placeholder="${label}"><button type="submit">${loc.m.common.search}</button></form>`;
}

/** "12 lists · sort by stars · items · …": the count, then the sort words, the current one in bold. */
export function sortLine(loc: Loc, count: Part, sorts: readonly Html[]): Html {
  return loc.h(loc.m.common.sortBy, { count, sorts: join(sorts, ' · ') });
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
