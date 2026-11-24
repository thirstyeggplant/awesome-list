// /gh/{owner}: who keeps lists, and whose projects the lists name.
import type { Db, OwnerRow } from '../db.js';
import { html, outbound } from '../html.js';
import { encodeParam } from '../query.js';
import { itemRows, listRow, num } from './components.js';
import type { Ctx } from './context.js';
import { layout } from './layout.js';
import { page, type ViewResult } from './result.js';

export function ownerPage(ctx: Ctx, db: Db, owner: OwnerRow): ViewResult {
  const lists = ctx.lists.filter((l) => l.owner === owner.login);
  const items = db.itemsOfOwner(owner.login, 100);
  const topics = db.topicsOf(items.map((i) => i.id));
  const main = html`<div class="owner-page">
<h1>${owner.display}</h1>
<p class="repo-link">${outbound(`https://github.com/${owner.display}`, `github.com/${owner.display}`, { cls: 'mono' })}</p>
${lists.length > 0 ? html`<section><h2>Lists they keep</h2><ol class="rows lists">${lists.map((l) => listRow(ctx, l))}</ol></section>` : ''}
${items.length > 0 ? html`<section><h2>Their projects named by lists</h2>${itemRows(ctx, items, topics)}<p class="more"><a href="/items?owner=${encodeParam(owner.login)}">All ${num(owner.itemCount)} in Items</a></p></section>` : ''}
</div>`;
  return page(
    layout(ctx, {
      title: owner.display,
      description: `${owner.display} on GitHub: ${num(owner.listCount)} lists kept, ${num(owner.itemCount)} projects named by lists.`,
      canonical: `/gh/${owner.login}`,
      noindex: owner.listCount === 0 && owner.itemCount < 2,
      main,
    }),
  );
}
