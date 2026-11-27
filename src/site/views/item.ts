// /gh/{owner}/{repo} and /item/{h}: what the lists and GitHub say about one thing. No description.
import type { Db, ItemDetail, ItemListing, ItemRow, ListRow } from '../db.js';
import { html, join, outbound, safeHref, type Html } from '../html.js';
import type { Loc } from '../i18n/loc.js';
import { absolute, breadcrumbLd, crumbs, facts, itemRot, itemRows, link, rot, tag } from './components.js';
import type { Ctx } from './context.js';
import { webSite } from './home.js';
import { layout } from './layout.js';
import { page, type ViewResult } from './result.js';

/** Other projects of the same owner shown on an item's page. */
const MORE_FROM_OWNER = 6;

function rotSentence(loc: Loc, item: ItemRow): Html {
  const word = itemRot(item);
  if (word === null) return html``;
  const m = loc.m.item;
  const sentence =
    word === 'archived'
      ? m.archived
      : word === 'gone'
        ? m.gone
        : item.pushedDay !== null
          ? loc.t(m.quietSince, { month: loc.monthYear(item.pushedDay) })
          : m.quiet;
  return html`<p class="rot-line">${rot(loc, word)} ${sentence}</p>`;
}

/** Where an item is listed, with each section's path and anchors, in the order of its `listed`. */
async function listingsOf(db: Db, item: ItemDetail): Promise<ItemListing[]> {
  const sections = await db.sectionsByIds([...new Set(item.listed.map(([, sectionId]) => sectionId))]);
  return item.listed.map(([listId, sectionId, name, extraLinks]) => {
    const s = sections.get(sectionId);
    return { listId, name, extraLinks, path: s?.path ?? [], anchors: s?.anchors ?? [] };
  });
}

/** A licence as an SPDX address, only when its label is an SPDX identifier. */
function spdx(label: string): string | null {
  return /^[A-Za-z0-9][A-Za-z0-9.+-]*$/.test(label) && !/^(other|noassertion)$/i.test(label)
    ? `https://spdx.org/licenses/${label}`
    : null;
}

/** The description: sentences, each a message, added while the whole still fits. */
function describe(ctx: Ctx, item: ItemDetail, isRepo: boolean, listIds: readonly number[], first: ItemListing | undefined, along: readonly ItemRow[]): string {
  const { loc } = ctx;
  const m = loc.m;
  const limit = loc.info.cjk ? 80 : 160;
  const listCount = listIds.length;
  const firstList = first ? ctx.listById.get(first.listId) : undefined;
  const section = first?.path[first.path.length - 1] ?? '';
  const sentences: string[] = [];
  if (listCount === 1 && firstList && section !== '') {
    sentences.push(loc.t(m.meta.item.inOne, { name: item.name, list: firstList.name, section }));
  } else {
    const named = loc.list(listIds.slice(0, 3).map((id) => ctx.listById.get(id)?.name).filter((n): n is string => n !== undefined));
    sentences.push(
      isRepo
        ? loc.plural(m.meta.item.repoDescription, listCount, { name: item.name, lists: named })
        : loc.plural(m.meta.item.description, listCount, { name: item.name, host: item.host, lists: named }),
    );
    if (firstList && section !== '') sentences.push(loc.t(m.meta.item.under, { section, list: firstList.name }));
  }
  if (along.length > 0) sentences.push(loc.t(m.meta.item.alongside, { names: loc.list(along.slice(0, 3).map((a) => a.name)) }));
  if (isRepo) {
    const known = [item.tags.lang?.[1], item.tags.license?.[1], item.stars === null ? undefined : loc.plural(m.count.stars, item.stars)].filter(
      (f): f is string => f !== undefined,
    );
    if (known.length > 0) sentences.push(`${loc.list(known)}.`);
  }
  let out = sentences[0] ?? '';
  for (const s of sentences.slice(1)) if (out.length + 1 + s.length <= limit) out += ` ${s}`;
  return out;
}

export async function itemPage(ctx: Ctx, db: Db, item: ItemDetail): Promise<ViewResult> {
  const { loc } = ctx;
  const m = loc.m;
  const isRepo = item.repoName !== null && item.owner !== null;
  const [listings, along, ownerRow] = await Promise.all([
    listingsOf(db, item),
    db.itemsByIds(item.alongside),
    isRepo && item.owner !== null ? db.owner(item.owner) : Promise.resolve(null),
  ]);
  const fromOwner = ownerRow === null ? [] : await db.itemsByIds(ownerRow.itemIds.filter((id) => id !== item.id).slice(0, MORE_FROM_OWNER));
  const ownList = item.listId === null ? undefined : ctx.listById.get(item.listId);
  const lang = item.tags.lang;
  const license = item.tags.license;
  const gone = item.status === 'gone';
  const nameHtml = gone ? html`<s>${isRepo ? item.repoName : item.name}</s>` : html`${isRepo ? item.repoName : item.name}`;
  const ownerDisplay = isRepo ? item.key.split('/')[1] ?? '' : '';
  const display = ownerRow?.display ?? ownerDisplay;

  const h1 = isRepo
    ? html`<h1 translate="no">${link(loc, `/gh/${item.owner ?? ''}`, `${display} /`, { cls: 'dim' })} ${nameHtml}</h1>`
    : html`<h1 translate="no">${nameHtml}</h1>`;
  const listIds = [...new Set(listings.map((l) => l.listId))];
  const listCount = listIds.length;

  const rows = listings.map((l) => {
    const list = ctx.listById.get(l.listId);
    if (!list) return html``;
    const path = l.path.map((t, i) => link(loc, `/lists/${list.slug}#${l.anchors[i] ?? ''}`, t));
    const extras = l.extraLinks.map((e) => outbound(e.url, e.text, { rel: 'nofollow noopener', cls: 'extra' }));
    return html`<li class="listing">${link(loc, `/lists/${list.slug}`, html`<span translate="no">${list.name}</span>`, { cls: 'name serif' })}${
      l.name !== null ? html` <span class="as">${loc.h(m.item.listedAs, { name: html`<span translate="no">${l.name}</span>` })}</span>` : ''
    }${extras.length > 0 ? html` <span class="extras">${join(extras, ' ')}</span>` : ''}${
      list.status === 'unparsed' ? '' : html` <span class="size">${loc.plural(m.count.items, list.itemsMade)}</span>`
    }${path.length > 0 ? html` <span class="path">${join(path, html`<span class="sep"> › </span>`)}</span>` : ''}</li>`;
  });

  // Where it sits in the curators' structure: the list with the most stars that names it, and its section.
  const first = listings[0];
  const firstList = first ? ctx.listById.get(first.listId) : undefined;
  const trail = firstList && first
    ? crumbs(loc, [
        link(loc, '/lists', m.nav.lists),
        link(loc, `/lists/${firstList.slug}`, html`<span translate="no">${firstList.name}</span>`),
        ...first.path.map((t, i) => link(loc, `/lists/${firstList.slug}#${first.anchors[i] ?? ''}`, t)),
      ])
    : '';

  const href = safeHref(item.url);
  const go = href === null
    ? ''
    : html`<p class="go"><a class="btn primary" href="${href}" rel="nofollow noopener" title="${href}">${
        isRepo ? m.item.openGitHub : loc.t(m.item.visit, { host: item.host })
      }</a></p><p class="address mono">${item.url}</p>`;
  const topics = item.tags.topics.map(([slug]) => tag(loc, 'topic', slug));
  const kindWord = (m.kind as Record<string, string>)[item.kind] ?? item.kind;
  const side = html`<aside class="item-side">
${facts([
  [m.facts.stars, loc.n(item.stars)],
  [m.facts.lastPush, loc.day(item.pushedDay)],
  [m.facts.language, lang ? link(loc, `/items?lang=${lang[0]}`, html`<span translate="no">${lang[1]}</span>`) : ''],
  [m.facts.licence, license ? link(loc, `/items?license=${license[0]}`, html`<span translate="no">${license[1]}</span>`) : ''],
  [m.facts.kind, link(loc, `/items?kind=${item.kind}`, kindWord)],
  [m.facts.host, html`<span translate="no">${item.host}</span>`],
  [m.facts.fork, item.fork === true ? m.yes : ''],
  [m.facts.renamedFrom, item.renamedFrom === null ? '' : html`<span translate="no">${item.renamedFrom}</span>`],
])}
${isRepo ? html`<p class="note">${loc.t(m.item.factsAsOf, { date: loc.dayIso(ctx.meta.dataFinished) })}</p>` : ''}
${topics.length > 0 ? html`<p class="side-label">${m.item.topics}</p><p class="chips">${join(topics, ' ')}</p>` : ''}
</aside>`;
  const ownerName = html`<span translate="no">${display}</span>`;
  const main = html`<article class="item-page">
${trail}
${h1}
${go}
${item.aka.length > 0 ? html`<p class="aka">${loc.h(m.item.alsoListedAs, { names: join(item.aka.map((a) => html`<span translate="no">${a}</span>`), ', ') })}</p>` : ''}
${ownList ? html`<p class="is-list">${loc.h(m.item.isList, {}, { 1: (t) => link(loc, `/lists/${ownList.slug}`, t) })}</p>` : ''}
${rotSentence(loc, item)}
<div class="item-layout">
${side}
<div class="item-main">
<section><h2>${loc.plural(m.item.inLists, listCount)}</h2><ol class="listings">${rows}</ol></section>
${along.length > 0 ? html`<section><h2>${m.item.alongside}</h2>${itemRows(loc, along, true)}</section>` : ''}
${fromOwner.length > 0 && ownerRow !== null ? html`<section><h2>${loc.h(m.item.moreFrom, { owner: ownerName })}</h2>${itemRows(loc, fromOwner, true)}<p class="more">${link(
    loc, `/gh/${ownerRow.login}`, loc.plural(m.item.allFrom, ownerRow.itemCount, { owner: display }),
  )}</p></section>` : ''}
<p class="attribution">${m.item.attribution}</p>
</div>
</div>
</article>`;

  const description = describe(ctx, item, isRepo, listIds, first, along);
  const repo = `${display}/${item.repoName ?? ''}`;
  const licenseUrl = license ? spdx(license[1]) : null;
  let title: string;
  if (listCount === 1 && firstList) {
    title = isRepo ? loc.t(m.meta.item.repoTitleOne, { repo, list: firstList.name }) : loc.t(m.meta.item.titleOne, { name: item.name, list: firstList.name });
  } else {
    title = isRepo ? loc.plural(m.meta.item.repoTitle, listCount, { repo }) : loc.plural(m.meta.item.title, listCount, { name: item.name });
  }
  const url = absolute(ctx, `/${item.key}`);
  const ld: Record<string, unknown>[] = [];
  if (firstList) ld.push(breadcrumbLd(ctx, [[m.nav.lists, '/lists'], [firstList.name, `/lists/${firstList.slug}`], [isRepo ? (item.repoName ?? item.name) : item.name, `/${item.key}`]]));
  if (isRepo) {
    const partOf = listIds.slice(0, 5).map((id) => ctx.listById.get(id)).filter((l): l is ListRow => l !== undefined);
    ld.push({
      '@context': 'https://schema.org',
      '@type': 'SoftwareSourceCode',
      name: item.repoName,
      url,
      codeRepository: item.url,
      ...(lang ? { programmingLanguage: lang[1] } : {}),
      ...(licenseUrl ? { license: licenseUrl } : {}),
      ...(item.tags.topics.length > 0 ? { keywords: item.tags.topics.map(([, label]) => label) } : {}),
      ...(partOf.length > 0
        ? { isPartOf: partOf.map((l) => ({ '@type': 'CollectionPage', name: l.name, url: absolute(ctx, `/lists/${l.slug}`) })) }
        : {}),
    });
  } else {
    // A thing that is not a repository: the page about it. Its own address is a third party's, so not given.
    ld.push({ '@context': 'https://schema.org', '@type': 'WebPage', name: item.name, url, isPartOf: webSite(ctx), about: { '@type': 'Thing', name: item.name } });
  }

  return page(
    layout(ctx, {
      route: 'item',
      title,
      description,
      canonical: `/${item.key}`,
      noindex: !item.indexable,
      main,
      jsonLd: ld,
    }),
  );
}
