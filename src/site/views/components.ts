// The pieces pages are made of: rows, chips, the rot mark, facts, crumbs, the pager, attribution.
import { QUIET_DAYS } from '../config.js';
import type { ItemRow, ListRow } from '../db.js';
import { html, inbound, join, outbound, type Html, type Part } from '../html.js';
import { encodeParam } from '../query.js';
import type { Ctx } from './context.js';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function dayToDate(day: number): Date {
  return new Date(day * 86_400_000);
}

export function fmtDay(day: number | null): string {
  if (day === null) return '';
  const d = dayToDate(day);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()] ?? ''} ${d.getUTCFullYear()}`;
}

export function monthYear(day: number): string {
  const d = dayToDate(day);
  return `${MONTHS[d.getUTCMonth()] ?? ''} ${d.getUTCFullYear()}`;
}

export function yearOf(day: number | null): string {
  return day === null ? '' : String(dayToDate(day).getUTCFullYear());
}

export function fmtIso(iso: string): string {
  const t = Date.parse(iso);
  return Number.isNaN(t) ? iso : fmtDay(Math.floor(t / 86_400_000));
}

export function num(n: number | null): string {
  return n === null ? '' : n.toLocaleString('en-US');
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${num(n)} ${n === 1 ? one : many}`;
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

export function rot(word: RotWord | null): Html {
  return word === null ? html`` : html` <span class="rot rot-${word}">${word}</span>`;
}

export function chip(label: string, href: string): Html {
  return html`<a class="chip" href="${href}">${label}</a>`;
}

/** A tag chip such as lang:go, linking to /items?lang=go. */
export function tag(ns: string, slug: string): Html {
  return chip(`${ns}:${slug}`, `/items?${ns}=${encodeParam(slug)}`);
}

/** The tags of an item: language, licence, kind (when it says something), status, then topics. */
export function tagsOf(ctx: Ctx, item: ItemRow, topics: readonly number[] = [], withStatus = false): Html[] {
  const out: Html[] = [];
  const term = (id: number | null): void => {
    const t = id === null ? undefined : ctx.termById.get(id);
    if (t) out.push(tag(t.ns, t.slug));
  };
  term(item.langId);
  term(item.licenseId);
  if (item.kind !== 'repo' && item.kind !== 'site') out.push(tag('kind', item.kind));
  if (withStatus && item.status !== null) out.push(tag('status', item.status));
  for (const t of topics) term(t);
  return out;
}

export function itemPath(item: Pick<ItemRow, 'key'>): string {
  return `/${item.key}`;
}

export interface ItemRowOptions {
  /** The name to show, when the list names it otherwise. */
  name?: string;
  topics?: readonly number[];
  child?: boolean;
  extras?: readonly { text: string; url: string }[];
}

export function itemRow(ctx: Ctx, item: ItemRow, o: ItemRowOptions = {}): Html {
  const name = o.name ?? item.name;
  const chips = tagsOf(ctx, item, o.topics ?? []).slice(0, 3);
  const extras = (o.extras ?? []).map((e) => outbound(e.url, e.text, { rel: 'nofollow noopener', cls: 'extra' }));
  return html`<li class="row${o.child ? ' child' : ''}"><span class="main"><a class="name" href="${itemPath(item)}">${
    item.status === 'gone' ? html`<s>${name}</s>` : name
  }</a> <span class="sub">${item.owner ?? item.host}</span>${rot(itemRot(item))}${
    chips.length > 0 ? html` <span class="chips">${join(chips, ' ')}</span>` : ''
  }${extras.length > 0 ? html` <span class="extras">${join(extras, ' ')}</span>` : ''}</span><span class="num stars">${
    item.stars === null ? '' : html`${num(item.stars)}<span class="unit"> ★</span>`
  }</span><span class="num">${plural(item.listCount, 'list')}</span><span class="num year">${yearOf(item.pushedDay)}</span></li>`;
}

export function itemRows(ctx: Ctx, items: readonly ItemRow[], topics?: ReadonlyMap<number, number[]>): Html {
  if (items.length === 0) return html`<p class="empty">Nothing here.</p>`;
  return html`<ol class="rows">${items.map((it) => itemRow(ctx, it, { topics: topics?.get(it.id) ?? [] }))}</ol>`;
}

export function listRow(ctx: Ctx, list: ListRow): Html {
  const cat = list.categoryId === null ? undefined : ctx.categoryById.get(list.categoryId);
  return html`<li class="row list-row"><span class="main"><a class="name serif" href="/lists/${list.slug}">${list.name}</a> <span class="sub">${
    list.slug
  }</span>${rot(listRot(list, ctx.dataDay))}${
    cat ? html` <a class="chip" href="/lists?category=${cat.slug}">${cat.name}</a>` : ''
  }</span><span class="num">${plural(list.itemsMade, 'item')}</span><span class="num stars">${
    list.stars === null ? '' : html`${num(list.stars)}<span class="unit"> ★</span>`
  }</span><span class="num year">${yearOf(list.pushedDay)}</span>${
    list.summary ? html`<span class="summary">${list.summary}</span>` : ''
  }</li>`;
}

export function facts(pairs: readonly (readonly [string, Part])[]): Html {
  const shown = pairs.filter(([, v]) => v !== null && v !== '' && v !== undefined && v !== false);
  return html`<dl class="facts">${shown.map(([k, v]) => html`<div><dt>${k}</dt><dd>${v}</dd></div>`)}</dl>`;
}

export function crumbs(parts: readonly Part[]): Html {
  return html`<nav class="crumbs" aria-label="Breadcrumb">${join(parts, html`<span class="sep"> › </span>`)}</nav>`;
}

export function pager(prev: string | null, next: string | null): Html {
  if (prev === null && next === null) return html``;
  return html`<nav class="pager">${prev === null ? html`<span></span>` : inbound(prev, '← Previous')}${
    next === null ? html`<span></span>` : inbound(next, 'Next →')
  }</nav>`;
}

export function searchBox(value: string | null, label = 'Search lists and items'): Html {
  return html`<form class="search-box" action="/search" method="get" role="search"><input type="search" name="q" value="${
    value ?? ''
  }" aria-label="${label}" placeholder="${label}"><button type="submit">Search</button></form>`;
}
