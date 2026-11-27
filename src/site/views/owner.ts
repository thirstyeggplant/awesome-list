// /gh/{owner}: who keeps lists, and whose projects the lists name.
import type { Db, OwnerRow } from '../db.js';
import { html, outbound } from '../html.js';
import { encodeParam } from '../query.js';
import { itemRows, link, listRows } from './components.js';
import type { Ctx } from './context.js';
import { layout } from './layout.js';
import { page, type ViewResult } from './result.js';

export async function ownerPage(ctx: Ctx, db: Db, owner: OwnerRow): Promise<ViewResult> {
  const { loc } = ctx;
  const m = loc.m;
  const lists = ctx.lists.filter((l) => l.owner === owner.login);
  const items = await db.itemsByIds(owner.itemIds);
  const main = html`<div class="owner-page">
<h1 translate="no">${owner.display}</h1>
<p class="repo-link">${outbound(`https://github.com/${owner.display}`, `github.com/${owner.display}`, { cls: 'mono' })}</p>
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
    }),
  );
}
