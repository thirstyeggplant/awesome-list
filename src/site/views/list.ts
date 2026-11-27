// /lists/{owner}/{repo}: one list, every entry on one server-rendered page.
import type { Db, ListEntry, ListRow, SectionRow } from '../db.js';
import { html, join, outbound, type Html } from '../html.js';
import type { Loc } from '../i18n/loc.js';
import { absolute, breadcrumbLd, categoryName, crumbs, facts, itemRow, itemRowsHead, link, listRot, listRows, rot, sheetHead } from './components.js';
import type { Ctx } from './context.js';
import { listCard, webSite } from './home.js';
import { layout } from './layout.js';
import { page, type ViewResult } from './result.js';

/** Other lists of a list's category shown after its entries, by stars. */
const MORE_IN_CATEGORY = 8;
/** Related lists shown as cards after the entries. */
const RELATED_CARDS = 6;
/** Top-level sections named in the structured data. */
const MAX_PARTS = 30;

interface TocEntry { title: string; anchor: string; depth: number; count: number }

/** The top two heading levels with the number of entries under each. */
export function tocOf(sections: readonly SectionRow[]): TocEntry[] {
  const out = new Map<string, TocEntry>();
  for (const s of sections) {
    for (let d = 1; d <= Math.min(2, s.path.length); d++) {
      const anchor = s.anchors[d - 1] ?? s.anchor;
      let e = out.get(anchor);
      if (!e) out.set(anchor, (e = { title: s.path[d - 1] ?? '', anchor, depth: d, count: 0 }));
      e.count += s.itemCount;
    }
  }
  return [...out.values()];
}

function toc(loc: Loc, entries: readonly TocEntry[]): Html {
  return html`<ol class="toc-list">${entries.map(
    (e) => html`<li class="d${e.depth}"><a href="#${e.anchor}">${e.title}</a> <span class="num">${loc.n(e.count)}</span></li>`,
  )}</ol>`;
}

function hn(depth: number): number {
  return Math.min(6, depth + 1);
}

function heading(loc: Loc, depth: number, anchor: string, title: string, count: number | null): Html {
  const n = hn(depth);
  return html`<h${n} class="sh">${title}${count === null ? '' : html` <span class="count">${loc.n(count)}</span>`} <a class="anchor" href="#${anchor}" aria-label="${loc.m.list.sectionLink}">#</a></h${n}>`;
}

function body(loc: Loc, sections: readonly SectionRow[], entries: readonly ListEntry[]): Html {
  const bySection = new Map<number, ListEntry[]>();
  for (const e of entries) {
    let a = bySection.get(e.sectionId);
    if (!a) bySection.set(e.sectionId, (a = []));
    a.push(e);
  }
  const emitted = new Set<string>();
  const out: Html[] = [];
  for (const s of sections) {
    // Headings above this section that hold no entries of their own.
    for (let d = 1; d < s.path.length; d++) {
      const anchor = s.anchors[d - 1] ?? '';
      if (emitted.has(anchor)) continue;
      emitted.add(anchor);
      out.push(html`<div class="outer" id="${anchor}" data-depth="${d}">${heading(loc, d, anchor, s.path[d - 1] ?? '', null)}</div>`);
    }
    emitted.add(s.anchor);
    const rows = (bySection.get(s.id) ?? []).map((e) =>
      itemRow(loc, e.item, { name: e.name, child: e.parentName !== null, extras: e.extraLinks }),
    );
    out.push(html`<section id="${s.anchor}" data-depth="${s.depth}">${
      s.depth > 0 ? heading(loc, s.depth, s.anchor, s.title, s.itemCount) : ''
    }<ol class="rows">${rows}</ol></section>`);
  }
  return html`${out}`;
}

/** Under a list's entries: whose the list is, where it lives, and that the summary is ours. */
export function attributionOfList(loc: Loc, list: ListRow, dataFinished: string): Html {
  const m = loc.m.list;
  const oid = list.readmeOid?.slice(0, 7) ?? null;
  const main = loc.h(m.attribution, { owner: html`<span translate="no">${list.owner}</span>`, name: list.name, repo: `github.com/${list.slug}` }, {
    1: (t) => html`<strong translate="no">${t}</strong>`,
    2: (t) => outbound(`https://github.com/${list.slug}`, t),
  });
  return html`<p class="attribution">${main}${oid ? html` ${loc.t(m.readAt, { oid, date: loc.dayIso(dataFinished) })}` : ''}${
    list.license ? html` ${loc.t(m.licence, { license: list.license })}` : ''
  }</p>`;
}

/** Why a list could not be read: the pipeline's "N items from M links" in words, else its own text in English. */
function reasonOf(loc: Loc, reason: string | null): Html {
  if (reason === null) return html`${loc.m.list.noReason}`;
  const r = /^(\d+) items from (\d+) links$/.exec(reason);
  if (r) {
    const c = loc.m.count;
    return html`${loc.t(c.itemsFromLinks, { items: loc.plural(c.items, Number(r[1])), links: loc.plural(c.links, Number(r[2])) })}`;
  }
  return loc.locale === 'en' ? html`${reason}` : html`<span lang="en">${reason}</span>`;
}

export async function listPage(ctx: Ctx, db: Db, list: ListRow): Promise<ViewResult> {
  const { loc } = ctx;
  const m = loc.m;
  const cat = list.categoryId === null ? undefined : ctx.categoryById.get(list.categoryId);
  const [sections, entries, ownItem] = await Promise.all([
    db.sectionsOfList(list.id),
    list.status === 'unparsed' ? Promise.resolve([]) : db.entriesOfList(list.id),
    list.itemId === null ? Promise.resolve(null) : db.itemById(list.itemId),
  ]);
  // How many other lists name the list's own repository.
  const namedBy = ownItem === null ? 0 : new Set(ownItem.listed.map(([id]) => id).filter((id) => id !== list.id)).size;
  const gh = `https://github.com/${list.slug}`;
  const word = listRot(list, ctx.dataDay);
  const contents = tocOf(sections);
  const summary = loc.summary(list);
  const itemCount = entries.length || list.itemsMade;
  const size = loc.t(m.count.itemsInSections, {
    items: loc.plural(m.count.items, itemCount),
    sections: loc.plural(m.count.sections, list.sectionCount),
  });

  const related = list.related
    .map(([id, n]) => ({ l: ctx.listById.get(id), n }))
    .filter((r): r is { l: ListRow; n: number } => r.l !== undefined);
  const seeAlso = related.slice(0, 3).map((r) => link(loc, `/lists/${r.l.slug}`, html`<span translate="no">${r.l.name}</span>`));
  const top = html`<header class="list-head">
${crumbs(loc, [link(loc, '/lists', m.nav.lists), cat ? link(loc, `/lists?category=${cat.slug}`, categoryName(loc, cat)) : null, list.subcategory === null ? null : html`<span translate="no">${list.subcategory}</span>`].filter((p) => p !== null))}
<div class="head-main">
<h1 class="serif" translate="no">${list.name}</h1>
<p class="repo-link">${outbound(gh, list.slug, { cls: 'mono' })}</p>
${summary ? html`<p class="summary"${summary.en ? html` lang="en"` : ''}>${summary.text}</p>` : ''}
${seeAlso.length > 0 ? html`<p class="see-also"><span class="label">${m.list.seeAlso}</span> ${join(seeAlso, loc.m.common.separator)}</p>` : ''}
<p class="actions">${outbound(gh, m.list.readOriginal, { cls: 'btn primary' })} ${outbound(`${gh}/issues`, m.list.suggestChange, { cls: 'btn' })}</p>
</div>
<div class="head-side">
${facts([
  [m.facts.stars, loc.n(list.stars)],
  [m.facts.lastPush, loc.day(list.pushedDay)],
  [m.facts.licence, list.license ?? ''],
  [m.facts.entries, size],
  [m.facts.namedBy, ownItem !== null && namedBy > 0 ? link(loc, `/${ownItem.key}`, loc.plural(m.count.otherLists, namedBy)) : ''],
  [m.facts.state, word === null ? '' : rot(loc, word)],
])}
</div>
</header>`;

  let content: Html;
  if (list.status === 'unparsed') {
    content = html`<p class="unparsed">${loc.h(m.list.unparsed, { reason: reasonOf(loc, list.reason) })}</p>`;
  } else {
    const n = loc.n(entries.length);
    content = html`<div class="list-layout">
<nav class="toc toc-rail sheet" id="_contents" aria-label="${m.list.contents}"><h2>${m.list.contents}</h2>${sheetHead(loc, m.list.contents, 'entries')}${toc(loc, contents)}</nav>
<div class="list-body">
<div class="list-filter"><span class="filter-field"><input id="list-filter" type="search" placeholder="${m.list.filterThisList}" aria-label="${m.list.filterThisList}" autocomplete="off"><output id="list-count" for="list-filter" data-of="${m.count.shownOf}">${loc.t(m.count.shownOf, { n, m: n })}</output></span> <a class="btn to-sheet" href="#_contents">${m.list.contents}</a> <button type="button" class="btn" id="collapse-all" data-collapse="${m.list.collapseAll}" data-expand="${m.list.expandAll}">${m.list.collapseAll}</button>${itemRowsHead(loc)}</div>
<div id="entries">${body(loc, sections, entries)}</div>
</div></div>`;
  }

  // The lists most like it, as cards; then more of its category by stars (ctx.lists is in that order), as rows.
  const shown = related.slice(0, RELATED_CARDS);
  const relatedHtml = shown.length === 0 ? '' : html`<section class="related"><h2>${m.list.related}</h2><ul class="cards">${shown.map(
    (r) => listCard(ctx, r.l, loc.plural(m.list.inCommon, r.n)),
  )}</ul></section>`;
  const taken = new Set([list.id, ...shown.map((r) => r.l.id)]);
  const more = cat === undefined ? [] : ctx.lists.filter((l) => l.categoryId === cat.id && !taken.has(l.id)).slice(0, MORE_IN_CATEGORY);
  const moreHtml = cat === undefined || more.length === 0 ? '' : html`<section class="more-in"><h2>${loc.h(m.list.moreIn, { category: categoryName(loc, cat) })}</h2>${listRows(ctx, more, { noCategory: true })}</section>`;

  const main = html`<article class="list-page">${top}${content}${relatedHtml}${moreHtml}${attributionOfList(loc, list, ctx.meta.dataFinished)}</article>`;

  const fallback = loc.t(m.meta.list.description, { name: list.name, repo: `github.com/${list.slug}` });
  let description = summary?.text ?? fallback;
  const withSize = `${description} ${size}.`;
  if (withSize.length <= (loc.info.cjk ? 80 : 160)) description = withSize;
  const catName = cat ? loc.category(cat).text : null;
  const trail: [string, string][] = [[m.nav.lists, '/lists']];
  if (cat && catName !== null) trail.push([catName, `/lists?category=${cat.slug}`]);
  trail.push([list.name, `/lists/${list.slug}`]);

  // Its top-level sections, as parts of the page (not one ListItem per entry: they would double the page).
  const parts = contents
    .filter((e) => e.depth === 1)
    .slice(0, MAX_PARTS)
    .map((e) => ({ '@type': 'WebPageElement', name: e.title, url: `${absolute(ctx, `/lists/${list.slug}`)}#${e.anchor}` }));

  return page(
    layout(ctx, {
      route: 'list',
      title: loc.plural(m.meta.list.title, itemCount, { name: list.name, repo: list.repo }),
      description,
      canonical: `/lists/${list.slug}`,
      main,
      shape: 'list',
      scripts: ['listfilter'],
      jsonLd: [
        breadcrumbLd(ctx, trail),
        {
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: list.name,
          ...(summary ? { description: summary.text } : {}),
          url: absolute(ctx, `/lists/${list.slug}`),
          inLanguage: loc.info.hreflang,
          isPartOf: webSite(ctx),
          isBasedOn: gh,
          mainEntity: { '@type': 'ItemList', numberOfItems: itemCount },
          ...(parts.length > 0 ? { hasPart: parts } : {}),
        },
      ],
    }),
  );
}
