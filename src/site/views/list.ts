// /lists/{owner}/{repo}: one list, every entry on one server-rendered page.
import type { Db, ListEntry, ListRow, SectionRow } from '../db.js';
import { html, outbound, type Html } from '../html.js';
import { crumbs, facts, fmtDay, fmtIso, itemRow, listRot, num, plural, rot } from './components.js';
import type { Ctx } from './context.js';
import { layout } from './layout.js';
import { page, type ViewResult } from './result.js';

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

function toc(entries: readonly TocEntry[]): Html {
  return html`<ol class="toc-list">${entries.map(
    (e) => html`<li class="d${e.depth}"><a href="#${e.anchor}">${e.title}</a> <span class="num">${num(e.count)}</span></li>`,
  )}</ol>`;
}

function hn(depth: number): number {
  return Math.min(6, depth + 1);
}

function heading(depth: number, anchor: string, title: string, count: number | null): Html {
  const n = hn(depth);
  return html`<h${n} class="sh">${title}${count === null ? '' : html` <span class="count">${num(count)}</span>`} <a class="anchor" href="#${anchor}" aria-label="Link to this section">#</a></h${n}>`;
}

function body(sections: readonly SectionRow[], entries: readonly ListEntry[]): Html {
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
      out.push(html`<div class="outer" id="${anchor}" data-depth="${d}">${heading(d, anchor, s.path[d - 1] ?? '', null)}</div>`);
    }
    emitted.add(s.anchor);
    const rows = (bySection.get(s.id) ?? []).map((e) =>
      itemRow(e.item, { name: e.name, child: e.parentName !== null, extras: e.extraLinks }),
    );
    out.push(html`<section id="${s.anchor}" data-depth="${s.depth}">${
      s.depth > 0 ? heading(s.depth, s.anchor, s.title, s.itemCount) : ''
    }<ol class="rows">${rows}</ol></section>`);
  }
  return html`${out}`;
}

export function attributionOfList(list: ListRow, dataFinished: string): Html {
  const oid = list.readmeOid?.slice(0, 7) ?? null;
  return html`<p class="attribution">This page is an index of <strong>${list.name}</strong>, a list kept by ${list.owner} and its contributors at ${outbound(
    `https://github.com/${list.slug}`,
    `github.com/${list.slug}`,
  )}. The selection and order are theirs; the summary above is ours.${
    oid ? html` Read at commit ${oid} on ${fmtIso(dataFinished)}.` : ''
  }${list.license ? html` Licence: ${list.license}.` : ''}</p>`;
}

export async function listPage(ctx: Ctx, db: Db, list: ListRow): Promise<ViewResult> {
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

  const top = html`<header class="list-head">
${crumbs([html`<a href="/lists">Lists</a>`, cat ? html`<a href="/lists?category=${cat.slug}">${cat.name}</a>` : null, list.subcategory].filter((p) => p !== null))}
<h1 class="serif">${list.name}</h1>
<p class="repo-link">${outbound(gh, list.slug, { cls: 'mono' })}</p>
${list.summary ? html`<p class="summary">${list.summary}</p>` : ''}
${facts([
  ['Stars', num(list.stars)],
  ['Last push', fmtDay(list.pushedDay)],
  ['Licence', list.license ?? ''],
  ['Entries', `${plural(entries.length || list.itemsMade, 'item')} in ${plural(list.sectionCount, 'section')}`],
  ['Named by', ownItem !== null && namedBy > 0 ? html`<a href="/${ownItem.key}">${plural(namedBy, 'other list')}</a>` : ''],
  ['State', word === null ? '' : rot(word)],
])}
<p class="actions">${outbound(gh, 'Read the original on GitHub')} · ${outbound(`${gh}/issues`, 'Suggest a change')}</p>
</header>`;

  let content: Html;
  if (list.status === 'unparsed') {
    content = html`<p class="unparsed">We could not read this list's entries yet (${list.reason ?? 'no reason given'}).</p>`;
  } else {
    content = html`<div class="list-layout">
<nav class="toc toc-rail" aria-label="Contents"><h2>Contents</h2>${toc(contents)}</nav>
<div class="list-body">
<details class="toc toc-narrow"><summary>Contents</summary>${toc(contents)}</details>
<div class="list-filter"><input id="list-filter" type="search" placeholder="Filter this list" aria-label="Filter this list" autocomplete="off"> <output id="list-count" for="list-filter">${num(entries.length)} of ${num(entries.length)}</output> <button type="button" id="collapse-all">Collapse all</button></div>
<div id="entries">${body(sections, entries)}</div>
</div></div>`;
  }

  const main = html`<article class="list-page">${top}${content}${attributionOfList(list, ctx.meta.dataFinished)}</article>`;
  return page(
    layout(ctx, {
      title: list.name,
      description: list.summary ?? `${list.name}, an awesome list kept at github.com/${list.slug}.`,
      canonical: `/lists/${list.slug}`,
      main,
      shape: 'list',
      scripts: ['listfilter'],
    }),
  );
}
