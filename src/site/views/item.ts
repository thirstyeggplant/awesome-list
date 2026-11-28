// /gh/{owner}/{repo} and /item/{h}: what the lists and GitHub say about one thing, in the order of a visitor's
// questions. No description of anyone else's: the sentences are ours, made of facts.
import type { Db, ItemDetail, ItemListing, ListRow } from '../db.js';
import { html, join, outbound, safeHref } from '../html.js';
import { isoDay } from '../i18n/format.js';
import { absolute, breadcrumbLd, crumbs, entries, facts, itemRot, link, tag, webSite } from './components.js';
import type { Ctx } from './context.js';
import { layout } from './layout.js';
import { page, type ViewResult } from './result.js';
import { fitDescription, itemSummary, maintainedAnswer, sentences } from './sentences.js';
import { shareRow } from './share.js';

/** Other projects of the same owner shown on an item's page. */
const MORE_FROM_OWNER = 6;

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
  const fromOwner = ownerRow === null ? [] : await db.itemsByIds(ownerRow.itemIds.filter((id) => id !== item.id).slice(0, MORE_FROM_OWNER));
  const ownList = item.listId === null ? undefined : ctx.listById.get(item.listId);
  const lang = item.tags.lang;
  const license = item.tags.license;
  const gone = item.status === 'gone';
  const nameHtml = gone ? html`<s>${isRepo ? item.repoName : item.name}</s>` : html`${isRepo ? item.repoName : item.name}`;
  const ownerDisplay = isRepo ? item.key.split('/')[1] ?? '' : '';
  const display = ownerRow?.display ?? ownerDisplay;

  const listIds = [...new Set(listings.map((l) => l.listId))];
  const listCount = listIds.length;

  const rows = listings.map((l) => {
    const list = ctx.listById.get(l.listId);
    if (!list) return html``;
    const path = l.path.map((t, i) => link(loc, `/lists/${list.slug}#${l.anchors[i] ?? ''}`, t));
    const extras = l.extraLinks.map((e) => outbound(e.url, e.text, { rel: 'nofollow noopener', cls: 'extra' }));
    return html`<li>${link(loc, `/lists/${list.slug}`, html`<span translate="no">${list.name}</span>`, { cls: 'serif' })}${
      l.name !== null ? html` <span class="listed-as">${loc.h(m.item.listedAs, { name: html`<span translate="no">${l.name}</span>` })}</span>` : ''
    }${path.length > 0 ? html`<p class="path">${join(path, html`<span class="sep"> › </span>`)}</p>` : ''}${
      list.status === 'unparsed' && extras.length === 0 ? '' : html`<p class="m">${list.status === 'unparsed' ? '' : loc.plural(m.count.items, list.itemsMade)}${join(extras.map((e) => html` ${e}`))}</p>`
    }</li>`;
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

  const repo = `${display}/${item.repoName ?? ''}`;
  let title: string;
  if (listCount === 1 && firstList) {
    title = isRepo ? loc.t(m.meta.item.repoTitleOne, { repo, list: firstList.name }) : loc.t(m.meta.item.titleOne, { name: item.name, list: firstList.name });
  } else {
    title = isRepo ? loc.plural(m.meta.item.repoTitle, listCount, { repo }) : loc.plural(m.meta.item.title, listCount, { name: item.name });
  }
  const head = { route: 'item' as const, title, canonical: `/${item.key}`, noindex: !item.indexable };

  const href = safeHref(item.url);
  const go = href === null
    ? ''
    : html`<p class="go"><a class="btn primary" href="${href}" rel="nofollow noopener" title="${href}">${
        isRepo ? m.item.openGitHub : loc.t(m.item.visit, { host: item.host })
      }</a> <span class="address mono">${item.url}</span></p>`;
  const topics = item.tags.topics.map(([slug, label]) => tag(loc, 'topic', slug, label));
  const kindWord = (m.kind as Record<string, string>)[item.kind] ?? item.kind;
  const namedBy = loc.plural(m.count.lists, listCount);
  // For a repository, what GitHub says; for anything else, what it is and where.
  const factList = facts(isRepo
    ? [
        [m.facts.stars, loc.n(item.stars)],
        [m.facts.lastPush, loc.time(item.pushedDay)],
        [m.facts.language, lang ? link(loc, `/items?lang=${lang[0]}`, html`<span translate="no">${lang[1]}</span>`) : ''],
        [m.facts.licence, license ? link(loc, `/items?license=${license[0]}`, html`<span translate="no">${license[1]}</span>`) : ''],
        [m.facts.owner, link(loc, `/gh/${item.owner ?? ''}`, html`<span translate="no">${display}</span>`)],
        [m.facts.namedBy, namedBy],
        [m.facts.fork, item.fork === true ? m.yes : ''],
        [m.facts.renamedFrom, item.renamedFrom === null ? '' : html`<span translate="no">${item.renamedFrom}</span>`],
      ]
    : [
        [m.facts.kind, link(loc, `/items?kind=${item.kind}`, kindWord)],
        [m.facts.host, html`<span translate="no">${item.host}</span>`],
        [m.facts.namedBy, namedBy],
      ]);
  const ownerName = html`<span translate="no">${display}</span>`;
  const itemName = html`<span translate="no">${isRepo ? item.repoName : item.name}</span>`;
  const word = itemRot(item);
  const said = itemSummary(ctx, item, listings, display);
  const summary = sentences(loc, [said.first, said.second, said.third]);
  const answer = isRepo ? maintainedAnswer(ctx, item) : null;
  const main = html`<article class="item-page">
${trail}
${isRepo
    ? html`<h1 translate="no">${link(loc, `/gh/${item.owner ?? ''}`, `${display} /`, { cls: 'dim' })} ${nameHtml}${word === null ? '' : html` <b class="rot rot-${word}" translate="yes">${m.status[word]}</b>`}</h1>`
    : html`<h1 translate="no">${nameHtml}</h1>`}
<p class="lede">${summary.html}</p>
${go}
${item.aka.length > 0 ? html`<p class="aka">${loc.h(m.item.alsoListedAs, { names: join(item.aka.map((a) => html`<span translate="no">${a}</span>`), ', ') })}</p>` : ''}
${ownList ? html`<p class="is-list">${loc.h(m.item.isList, {}, { 1: (t) => link(loc, `/lists/${ownList.slug}`, t) })}</p>` : ''}
${factList}
${isRepo ? html`<p class="note">${loc.h(m.item.factsAsOf, { date: loc.timeIso(ctx.meta.dataFinished) })}</p>` : ''}
${topics.length > 0 ? html`<p class="topics-label">${m.item.topics}</p><p class="chips">${join(topics, ' ')}</p>` : ''}
<h2>${loc.h(m.item.q.lists, { name: itemName })}</h2><ol class="entries lists">${rows}</ol>
${answer === null ? '' : html`<h2>${loc.h(m.item.q.maintained, { name: itemName })}</h2><p class="answer">${answer.html}</p>`}
${along.length > 0 ? html`<h2>${loc.h(m.item.q.alongside, { name: itemName })}</h2><p class="note">${m.item.alongsideNote}</p>${entries(ctx, along, { topics: true })}` : ''}
${fromOwner.length > 0 && ownerRow !== null ? html`<h2>${loc.h(m.item.moreFrom, { owner: ownerName })}</h2>${entries(ctx, fromOwner, { topics: true })}<p class="more">${link(
    loc, `/gh/${ownerRow.login}`, loc.plural(m.item.allFrom, ownerRow.itemCount, { owner: display }),
  )}</p>` : ''}
<p class="attribution">${m.item.attribution}</p>
${shareRow(ctx, head)}
</article>`;

  // Sentences one and two, then the alongside sentence while it fits.
  const description = fitDescription(loc, [
    said.first.text,
    ...(said.second ? [said.second.text] : []),
    ...(along.length > 0 ? [loc.t(m.meta.item.alongside, { names: loc.list(along.slice(0, 3).map((a) => a.name)) })] : []),
  ]);
  const ldDescription = said.second ? `${said.first.text}${loc.info.cjk ? '' : ' '}${said.second.text}` : said.first.text;
  const licenseUrl = license ? spdx(license[1]) : null;
  const url = absolute(ctx, `/${item.key}`);
  const ld: Record<string, unknown>[] = [];
  if (firstList) ld.push(breadcrumbLd(ctx, [[m.nav.lists, '/lists'], [firstList.name, `/lists/${firstList.slug}`], [isRepo ? (item.repoName ?? item.name) : item.name, `/${item.key}`]]));
  if (isRepo) {
    const partOf = listIds.slice(0, 5).map((id) => ctx.listById.get(id)).filter((l): l is ListRow => l !== undefined);
    ld.push({
      '@context': 'https://schema.org',
      '@type': 'SoftwareSourceCode',
      name: item.repoName,
      // Our sentences, made of facts: never a curator's or an owner's description.
      description: ldDescription,
      url,
      codeRepository: item.url,
      ...(item.pushedDay !== null ? { dateModified: isoDay(item.pushedDay) } : {}),
      ...(lang ? { programmingLanguage: lang[1] } : {}),
      ...(licenseUrl ? { license: licenseUrl } : {}),
      ...(item.tags.topics.length > 0 ? { keywords: item.tags.topics.map(([, label]) => label) } : {}),
      ...(partOf.length > 0
        ? { isPartOf: partOf.map((l) => ({ '@type': 'CollectionPage', name: l.name, url: absolute(ctx, `/lists/${l.slug}`) })) }
        : {}),
    });
  } else {
    // A thing that is not a repository: the page about it. Its own address is a third party's, so not given.
    ld.push({ '@context': 'https://schema.org', '@type': 'WebPage', name: item.name, description: ldDescription, url, isPartOf: webSite(ctx), about: { '@type': 'Thing', name: item.name } });
  }

  return page(
    layout(ctx, {
      ...head,
      description,
      main,
      jsonLd: ld,
    }),
  );
}
