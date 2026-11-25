// /gh/{owner}/{repo} and /item/{h}: what the lists and GitHub say about one thing. No description.
import type { Db, ItemDetail, ItemListing, ItemRow } from '../db.js';
import { html, inbound, join, outbound, type Html } from '../html.js';
import { facts, fmtDay, fmtIso, itemRot, itemRows, monthYear, num, plural, rot, tagsOf } from './components.js';
import type { Ctx } from './context.js';
import { layout } from './layout.js';
import { page, type ViewResult } from './result.js';

function rotSentence(item: ItemRow): Html {
  const word = itemRot(item);
  if (word === null) return html``;
  const sentence =
    word === 'archived'
      ? 'Archived by its owner.'
      : word === 'gone'
        ? 'GitHub no longer has this repository.'
        : item.pushedDay !== null
          ? `No pushes since ${monthYear(item.pushedDay)}.`
          : 'No pushes in two years.';
  return html`<p class="rot-line">${rot(word)} ${sentence}</p>`;
}

/** Where an item is listed, with each section's path and anchors, in the order of its `listed`. */
async function listingsOf(db: Db, item: ItemDetail): Promise<ItemListing[]> {
  const sections = await db.sectionsByIds([...new Set(item.listed.map(([, sectionId]) => sectionId))]);
  return item.listed.map(([listId, sectionId, name, extraLinks]) => {
    const s = sections.get(sectionId);
    return { listId, name, extraLinks, path: s?.path ?? [], anchors: s?.anchors ?? [] };
  });
}

export async function itemPage(ctx: Ctx, db: Db, item: ItemDetail): Promise<ViewResult> {
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

  const h1 = isRepo
    ? html`<h1><a class="dim" href="/gh/${item.owner ?? ''}">${ownerRow?.display ?? ownerDisplay} /</a> ${nameHtml}</h1>`
    : html`<h1>${nameHtml}</h1>`;
  const listCount = new Set(listings.map((l) => l.listId)).size;

  const rows = listings.map((l) => {
    const list = ctx.listById.get(l.listId);
    if (!list) return html``;
    const path = l.path.map((t, i) => inbound(`/lists/${list.slug}#${l.anchors[i] ?? ''}`, t));
    const extras = l.extraLinks.map((e) => outbound(e.url, e.text, { rel: 'nofollow noopener', cls: 'extra' }));
    return html`<li class="listing"><a class="name serif" href="/lists/${list.slug}">${list.name}</a>${
      path.length > 0 ? html` <span class="crumbs inline">${join(path, html`<span class="sep"> › </span>`)}</span>` : ''
    }${l.name !== null ? html` <span class="as">listed as ‘${l.name}’</span>` : ''}${
      extras.length > 0 ? html` <span class="extras">${join(extras, ' ')}</span>` : ''
    }</li>`;
  });

  const tags = tagsOf(item, true, true);
  const main = html`<article class="item-page">
${h1}
<p class="address">${outbound(item.url, item.url, { rel: 'nofollow noopener', cls: 'mono main-link' })}</p>
${item.aka.length > 0 ? html`<p class="aka">Also listed as: ${join(item.aka.map((a) => html`<span>${a}</span>`), ', ')}</p>` : ''}
${ownList ? html`<p class="is-list">This is itself a list in the library: <a href="/lists/${ownList.slug}">open it</a>.</p>` : ''}
${rotSentence(item)}
${facts([
  ['Stars', num(item.stars)],
  ['Last push', fmtDay(item.pushedDay)],
  ['Language', lang ? html`<a href="/items?lang=${lang[0]}">${lang[1]}</a>` : ''],
  ['Licence', license ? html`<a href="/items?license=${license[0]}">${license[1]}</a>` : ''],
  ['Fork', item.fork === null ? '' : item.fork ? 'yes' : 'no'],
  ['Kind', html`<a href="/items?kind=${item.kind}">${item.kind}</a>`],
  ['Host', item.host],
  ['Renamed from', item.renamedFrom ?? ''],
])}
${tags.length > 0 ? html`<p class="chips">${join(tags, ' ')}</p>` : ''}
${isRepo ? html`<p class="note">Facts from GitHub as of ${fmtIso(ctx.meta.dataFinished)}.</p>` : ''}
<section><h2>In ${plural(listCount, 'list')}</h2><ol class="listings">${rows}</ol></section>
${along.length > 0 ? html`<section><h2>Listed alongside</h2>${itemRows(along, true)}</section>` : ''}
<p class="attribution">Named by the lists above. Follow a list to read what its curators say about it. To suggest a change, open an issue on one of those lists.</p>
</article>`;

  return page(
    layout(ctx, {
      title: isRepo ? `${ownerRow?.display ?? ownerDisplay}/${item.repoName ?? ''}` : item.name,
      description: `${item.name}: named by ${plural(listCount, 'awesome list')}.`,
      canonical: `/${item.key}`,
      noindex: !item.indexable,
      main,
      shape: 'narrow',
    }),
  );
}
