// The sentences that open a page (docs/site.md, "Summary sentences"): one function per page, each made only of
// the page's own data, each returning the HTML (names as links) and the plain text (for the meta description and
// the structured data), so the three cannot disagree. A sentence whose data is missing is left out whole.
import { QUIET_DAYS } from '../config.js';
import type { ItemDetail, ItemListing, ItemRow, ListEntry, ListRow, OwnerRow } from '../db.js';
import { html, join, type Html, type Part } from '../html.js';
import type { Plural } from '../i18n/format.js';
import type { Loc } from '../i18n/loc.js';
import { encodeParam } from '../query.js';
import { itemPath } from './components.js';
import type { Ctx } from './context.js';

/** Something said, as HTML and as plain text; `parts` the text of each sentence, when it is several. */
export interface Said { html: Html; text: string; parts?: readonly string[] }

type Value = string | Said;

/** A message with its values, as HTML and as text. */
export function say(loc: Loc, msg: string, vars: Readonly<Record<string, Value>> = {}): Said {
  const h: Record<string, Part> = {};
  const t: Record<string, string> = {};
  for (const [k, v] of Object.entries(vars)) {
    h[k] = typeof v === 'string' ? v : v.html;
    t[k] = typeof v === 'string' ? v : v.text;
  }
  return { html: loc.h(msg, h), text: loc.t(msg, t) };
}

/** A plural message for a count, with `{n}` the formatted count. */
export function sayPlural(loc: Loc, forms: Plural, count: number, vars: Readonly<Record<string, Value>> = {}): Said {
  return say(loc, loc.form(forms, count), { ...vars, n: loc.n(count) });
}

/** Names joined as the language joins a short list. */
export function sayList(loc: Loc, parts: readonly Said[]): Said {
  return { html: join(parts.map((p) => p.html), loc.m.common.separator), text: parts.map((p) => p.text).join(loc.m.common.separator) };
}

/** Sentences one after another. */
export function sentences(loc: Loc, parts: readonly (Said | null)[]): Said {
  const kept = parts.filter((p): p is Said => p !== null);
  const sep = loc.info.cjk ? '' : ' ';
  return { html: join(kept.map((p) => p.html), sep), text: kept.map((p) => p.text).join(sep), parts: kept.map((p) => p.text) };
}

/** A name, as a link inside the site; a browser's own translation leaves it alone. */
export function named(loc: Loc, path: string, name: string): Said {
  return { html: html`<a href="${loc.href(path)}" translate="no">${name}</a>`, text: name };
}

/** A name that is not a link. */
function plain(name: string, mono = false): Said {
  return { html: mono ? html`<span class="mono" translate="no">${name}</span>` : html`<span translate="no">${name}</span>`, text: name };
}

/** A day as a <time>. */
export function sayDay(loc: Loc, day: number): Said {
  return { html: loc.time(day), text: loc.day(day) };
}

function dataDayOf(ctx: Ctx): Said {
  return sayDay(ctx.loc, ctx.dataDay);
}

/** As much of a text as fits in a description, cut at the end of a sentence. */
export function fitDescription(loc: Loc, parts: readonly string[]): string {
  const limit = loc.info.cjk ? 80 : 160;
  let out = parts[0] ?? '';
  const sep = loc.info.cjk ? '' : ' ';
  for (const s of parts.slice(1)) if (out.length + sep.length + s.length <= limit) out += sep + s;
  return out;
}

/** 5.1: what the site is, and how fresh. */
export function homeSummary(ctx: Ctx): Said {
  const { loc } = ctx;
  const c = ctx.meta.counts;
  return say(loc, loc.m.sum.home, {
    site: ctx.siteName,
    lists: loc.plural(loc.m.count.lists, c.lists ?? 0),
    items: loc.plural(loc.m.count.items, c.items ?? 0),
    date: dataDayOf(ctx),
  });
}

/** 5.2: a category of /lists, and its lists with the most stars. */
export function categorySummary(ctx: Ctx, categoryName: Said, lists: readonly ListRow[]): Said {
  const { loc } = ctx;
  const names = sayList(loc, lists.slice(0, 3).map((l) => named(loc, `/lists/${l.slug}`, l.name)));
  return sayPlural(loc, loc.m.sum.category, lists.length, { category: categoryName, names });
}

interface TocLike { title: string; anchor: string; depth: number; count: number }

/** 5.3: a list, after our own summary. */
export function listSummary(
  ctx: Ctx, list: ListRow, entries: readonly ListEntry[], toc: readonly TocLike[], mainLang: readonly [string, string] | null,
): Said {
  const { loc } = ctx;
  const s = loc.m.sum.list;
  const base = { name: plain(list.name), repo: plain(list.slug, true), owner: plain(list.owner) };
  if (list.status === 'unparsed') return say(loc, s.whatUnread, base);
  const out: (Said | null)[] = [
    say(loc, s.what, {
      ...base,
      items: loc.plural(loc.m.count.items, entries.length || list.itemsMade),
      sections: loc.plural(loc.m.count.sections, list.sectionCount),
    }),
  ];
  if (list.stars !== null && list.pushedDay !== null) {
    out.push(say(loc, s.github, { stars: loc.plural(loc.m.count.stars, list.stars), date: sayDay(loc, Math.min(list.pushedDay, ctx.dataDay)) }));
  }
  const top = toc.filter((e) => e.depth === 1);
  if (top.length >= 4) {
    const biggest = [...top].sort((a, b) => b.count - a.count).slice(0, 3);
    out.push(say(loc, s.sections, {
      sections: sayList(loc, biggest.map((e) => ({ html: html`<a href="#${e.anchor}">${e.title}</a> (${loc.n(e.count)})`, text: `${e.title} (${loc.n(e.count)})` }))),
    }));
  }
  const seen = new Set<number>();
  const starred: ItemRow[] = [];
  for (const e of entries) {
    if (e.item.stars === null || seen.has(e.item.id)) continue;
    seen.add(e.item.id);
    starred.push(e.item);
  }
  if (starred.length >= 5) {
    starred.sort((a, b) => (b.stars ?? 0) - (a.stars ?? 0));
    out.push(say(loc, s.top, { names: sayList(loc, starred.slice(0, 5).map((it) => named(loc, itemPath(it), it.name))) }));
  }
  if (mainLang !== null) out.push(say(loc, s.lang, { language: named(loc, `/items?lang=${encodeParam(mainLang[0])}`, mainLang[1]) }));
  return sentences(loc, out);
}

/** 5.4: /items with exactly one of lang, topic, license or kind, page 1, no search. */
export function itemsSummary(ctx: Ctx, which: 'lang' | 'topic' | 'license' | 'kind', label: string, total: number, top: readonly ItemRow[]): Said {
  const { loc } = ctx;
  const s = loc.m.sum.items;
  const out: (Said | null)[] = [sayPlural(loc, s[which], total, { label: plain(label) })];
  if (top.length > 0) out.push(say(loc, s.top, { names: sayList(loc, top.slice(0, 5).map((it) => named(loc, itemPath(it), it.name))) }));
  out.push(say(loc, loc.m.sum.asOf, { date: dataDayOf(ctx) }));
  return sentences(loc, out);
}

/** 5.5, sentences one and two: what it is, and which lists name it (the description is made of these two). */
export function itemSummary(ctx: Ctx, item: ItemDetail, listings: readonly ItemListing[], display: string): { first: Said; second: Said | null; third: Said | null } {
  const { loc } = ctx;
  const s = loc.m.sum.item;
  const isRepo = item.repoName !== null && item.owner !== null;
  const name = plain(isRepo ? (item.repoName ?? item.name) : item.name);
  let first: Said;
  if (isRepo) {
    const owner = named(loc, `/gh/${item.owner ?? ''}`, display);
    const lang = item.tags.lang;
    if (item.stars === null) first = say(loc, s.repoPlain, { name, owner });
    else {
      const stars = loc.plural(loc.m.count.stars, item.stars);
      first = lang
        ? say(loc, s.repoLang, { name, owner, stars, language: named(loc, `/items?lang=${encodeParam(lang[0])}`, lang[1]) })
        : say(loc, s.repo, { name, owner, stars });
    }
  } else {
    const kinds = s.kind as Record<string, string>;
    first = say(loc, kinds[item.kind] ?? s.kind.site, { name, host: plain(item.host) });
  }
  // The lists, in the order of `listed`: each once, with the innermost section it is under there.
  const byList = new Map<number, ItemListing>();
  for (const l of listings) if (!byList.has(l.listId)) byList.set(l.listId, l);
  const parts: Said[] = [];
  for (const l of [...byList.values()].slice(0, 3)) {
    const list = ctx.listById.get(l.listId);
    if (!list) continue;
    const listName = named(loc, `/lists/${list.slug}`, list.name);
    const section = l.path[l.path.length - 1] ?? '';
    parts.push(section === '' ? listName : say(loc, s.listUnder, { list: listName, section: plain(section) }));
  }
  if (byList.size > 3) parts.push(sayPlural(loc, s.more, byList.size - 3));
  const second = parts.length === 0 ? null : sayPlural(loc, s.lists, byList.size, { lists: sayList(loc, parts) });
  const third = isRepo && item.pushedDay !== null ? say(loc, s.pushed, { date: sayDay(loc, item.pushedDay) }) : null;
  return { first, second, third };
}

/** 5.5: the answer under "Is {name} still maintained?"; null when nothing is known. */
export function maintainedAnswer(ctx: Ctx, item: ItemRow): Said | null {
  const { loc } = ctx;
  const a = loc.m.item.a;
  if (item.status === 'gone') return say(loc, loc.m.item.gone);
  if (item.pushedDay === null) return null;
  const date = sayDay(loc, item.pushedDay);
  const asOf = dataDayOf(ctx);
  if (item.status === 'archived' || item.archived === true) return say(loc, a.archived, { date });
  if (item.status === 'quiet' || item.pushedDay < ctx.dataDay - QUIET_DAYS) return say(loc, a.quiet, { date, asOf });
  return say(loc, a.active, { date, asOf });
}

/** 5.6: an owner. */
export function ownerSummary(ctx: Ctx, owner: OwnerRow): Said {
  const { loc } = ctx;
  const s = loc.m.sum.owner;
  const vars = { display: plain(owner.display), lists: loc.plural(loc.m.count.lists, owner.listCount), projects: loc.plural(loc.m.count.projects, owner.itemCount) };
  if (owner.listCount > 0 && owner.itemCount > 0) return say(loc, s.both, vars);
  if (owner.listCount > 0) return say(loc, s.lists, vars);
  return say(loc, s.projects, vars);
}

