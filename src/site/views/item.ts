// /gh/{owner}/{repo} and /item/{h}: what the lists and GitHub say about one thing. No description.
import type { Db, ItemDetail, ItemListing, ItemRow } from '../db.js';
import { html, join, outbound, type Html } from '../html.js';
import type { Loc } from '../i18n/loc.js';
import { absolute, facts, itemRot, itemRows, link, rot, tagsOf } from './components.js';
import type { Ctx } from './context.js';
import { layout } from './layout.js';
import { page, type ViewResult } from './result.js';

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

export async function itemPage(ctx: Ctx, db: Db, item: ItemDetail): Promise<ViewResult> {
  const { loc } = ctx;
  const m = loc.m;
  const isRepo = item.repoName !== null && item.owner !== null;
  const [listings, along, ownerRow] = await Promise.all([
    listingsOf(db, item),
    db.itemsByIds(item.alongside),
    isRepo && item.owner !== null ? db.owner(item.owner) : Promise.resolve(null),
  ]);
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
      path.length > 0 ? html` <span class="crumbs inline">${join(path, html`<span class="sep"> › </span>`)}</span>` : ''
    }${l.name !== null ? html` <span class="as">${loc.h(m.item.listedAs, { name: html`<span translate="no">${l.name}</span>` })}</span>` : ''}${
      extras.length > 0 ? html` <span class="extras">${join(extras, ' ')}</span>` : ''
    }</li>`;
  });

  const tags = tagsOf(loc, item, true, true);
  const kindWord = (m.kind as Record<string, string>)[item.kind] ?? item.kind;
  const main = html`<article class="item-page">
${h1}
<p class="address">${outbound(item.url, item.url, { rel: 'nofollow noopener', cls: 'mono main-link' })}</p>
${item.aka.length > 0 ? html`<p class="aka">${loc.h(m.item.alsoListedAs, { names: join(item.aka.map((a) => html`<span translate="no">${a}</span>`), ', ') })}</p>` : ''}
${ownList ? html`<p class="is-list">${loc.h(m.item.isList, {}, { 1: (t) => link(loc, `/lists/${ownList.slug}`, t) })}</p>` : ''}
${rotSentence(loc, item)}
${facts([
  [m.facts.stars, loc.n(item.stars)],
  [m.facts.lastPush, loc.day(item.pushedDay)],
  [m.facts.language, lang ? link(loc, `/items?lang=${lang[0]}`, html`<span translate="no">${lang[1]}</span>`) : ''],
  [m.facts.licence, license ? link(loc, `/items?license=${license[0]}`, html`<span translate="no">${license[1]}</span>`) : ''],
  [m.facts.fork, item.fork === null ? '' : item.fork ? m.yes : m.no],
  [m.facts.kind, link(loc, `/items?kind=${item.kind}`, kindWord)],
  [m.facts.host, html`<span translate="no">${item.host}</span>`],
  [m.facts.renamedFrom, item.renamedFrom === null ? '' : html`<span translate="no">${item.renamedFrom}</span>`],
])}
${tags.length > 0 ? html`<p class="chips">${join(tags, ' ')}</p>` : ''}
${isRepo ? html`<p class="note">${loc.t(m.item.factsAsOf, { date: loc.dayIso(ctx.meta.dataFinished) })}</p>` : ''}
<section><h2>${loc.plural(m.item.inLists, listCount)}</h2><ol class="listings">${rows}</ol></section>
${along.length > 0 ? html`<section><h2>${m.item.alongside}</h2>${itemRows(loc, along, true)}</section>` : ''}
<p class="attribution">${m.item.attribution}</p>
</article>`;

  // The description: who names it, then the facts we know.
  const firstLists = listIds.slice(0, 3).map((id) => ctx.listById.get(id)?.name).filter((n): n is string => n !== undefined);
  const named = loc.list(firstLists);
  let description: string;
  if (isRepo) {
    const factsKnown = [lang?.[1], license?.[1], item.stars === null ? undefined : loc.plural(m.count.stars, item.stars)].filter(
      (f): f is string => f !== undefined,
    );
    description = loc.plural(m.meta.item.repoDescription, listCount, { name: item.name, lists: named });
    if (factsKnown.length > 0) description += ` ${loc.list(factsKnown)}.`;
  } else {
    description = loc.plural(m.meta.item.description, listCount, { name: item.name, host: item.host, lists: named });
  }
  const repo = `${display}/${item.repoName ?? ''}`;
  const licenseUrl = license ? spdx(license[1]) : null;

  return page(
    layout(ctx, {
      route: 'item',
      title: isRepo
        ? loc.plural(m.meta.item.repoTitle, listCount, { repo })
        : loc.plural(m.meta.item.title, listCount, { name: item.name }),
      description,
      canonical: `/${item.key}`,
      noindex: !item.indexable,
      main,
      shape: 'narrow',
      jsonLd: isRepo
        ? [
            {
              '@context': 'https://schema.org',
              '@type': 'SoftwareSourceCode',
              name: item.repoName,
              url: absolute(ctx, `/${item.key}`),
              codeRepository: item.url,
              ...(lang ? { programmingLanguage: lang[1] } : {}),
              ...(licenseUrl ? { license: licenseUrl } : {}),
              ...(item.tags.topics.length > 0 ? { keywords: item.tags.topics.map(([, label]) => label) } : {}),
            },
          ]
        : [],
    }),
  );
}
