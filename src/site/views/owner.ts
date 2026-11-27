// /gh/{owner}: who keeps lists, and whose projects the lists name.
import type { Db, OwnerRow } from '../db.js';
import { html, outbound } from '../html.js';
import { encodeParam } from '../query.js';
import { absolute, itemRows, link, listRows, webSite } from './components.js';

/** Projects of an owner named in the page's structured data. */
const OWNER_LD_ITEMS = 20;
import type { Ctx } from './context.js';
import { layout } from './layout.js';
import { page, type ViewResult } from './result.js';

export async function ownerPage(ctx: Ctx, db: Db, owner: OwnerRow): Promise<ViewResult> {
  const { loc } = ctx;
  const m = loc.m;
  const lists = ctx.lists.filter((l) => l.owner === owner.login);
  const items = await db.itemsByIds(owner.itemIds);
  // The structured data names what the page shows first: the lists they keep, then their first projects.
  const shown = [
    ...lists.map((l) => ({ path: `/lists/${l.slug}`, name: l.name })),
    ...items.slice(0, OWNER_LD_ITEMS).map((it) => ({ path: `/${it.key}`, name: it.name })),
  ];
  const main = html`<div class="owner-page">
<h1 translate="no">${owner.display}</h1>
<p class="repo-link">${outbound(`https://github.com/${owner.display}`, `github.com/${owner.display}`, { cls: 'mono' })}</p>
<p class="owner-line">${loc.t(m.owner.line, { lists: loc.plural(m.count.lists, owner.listCount), projects: loc.plural(m.count.projects, owner.itemCount) })}</p>
${lists.length > 0 ? html`<section><h2>${m.owner.listsTheyKeep}</h2>${listRows(ctx, lists)}</section>` : ''}
${items.length > 0 ? html`<section><h2>${m.owner.theirProjects}</h2>${itemRows(loc, items, true)}<p class="more">${link(loc, `/items?owner=${encodeParam(owner.login)}`, loc.plural(m.owner.allInItems, owner.itemCount))}</p></section>` : ''}
</div>`;
  return page(
    layout(ctx, {
      route: 'owner',
      title: loc.t(m.meta.owner.title, { display: owner.display }),
      description: loc.t(m.meta.owner.description, {
        display: owner.display,
        lists: loc.plural(m.count.lists, owner.listCount),
        projects: loc.plural(m.count.projects, owner.itemCount),
      }),
      canonical: `/gh/${owner.login}`,
      noindex: owner.listCount === 0 && owner.itemCount < 2,
      main,
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: owner.display,
          url: absolute(ctx, `/gh/${owner.login}`),
          isPartOf: webSite(ctx),
          // Not a ProfilePage: the data does not say whether an owner is a person or an organization.
          about: { '@type': 'Thing', name: owner.display, url: `https://github.com/${owner.display}` },
          mainEntity: {
            '@type': 'ItemList',
            numberOfItems: shown.length,
            itemListElement: shown.map((r, i) => ({ '@type': 'ListItem', position: i + 1, url: absolute(ctx, r.path), name: r.name })),
          },
        },
      ],
    }),
  );
}
