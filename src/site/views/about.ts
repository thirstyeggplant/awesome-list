import { PROJECT_REPO } from '../config.js';
import { html, outbound } from '../html.js';
import { fmtIso, num } from './components.js';
import type { Ctx } from './context.js';
import { layout } from './layout.js';
import { page, type ViewResult } from './result.js';

export function aboutPage(ctx: Ctx): ViewResult {
  const c = ctx.meta.counts;
  const cov = ctx.meta.coverage;
  const n = (v: number | undefined): string => num(v ?? 0);
  const main = html`<article class="about">
<h1>About ${ctx.siteName}</h1>
<p>${ctx.siteName} is a free library of every awesome list in the <a href="/lists/sindresorhus/awesome">index of awesome lists</a> and everything in them: ${n(c.lists)} lists, the ${n(c.items)} things they name, and where each list names each one.</p>
<h2>What is shown, and what is not</h2>
<p>The site shows names, sections, links and facts, and our own words. It never shows a curator's or a repository owner's description. A list's summary is ours; what a list says about an entry stays on the list, one link away.</p>
<h2>Attribution</h2>
<p>The selection and order of every list belong to the people who keep it. Each list page says where the list lives and the commit it was read at. Facts about repositories (stars, last push, language, licence, topics) come from GitHub.</p>
<h2 id="leave-out">How a list is left out</h2>
<p>Keep a list and want it left out? ${outbound(`${PROJECT_REPO}/issues`, "Open an issue on this project's repository")} naming the list. It is left out on the next build: its entries are not read and its page is removed.</p>
<h2>Coverage</h2>
<ul>
<li>${n(cov.listsByStatus.ok)} lists read in full, ${n(cov.listsByStatus.partial)} in part, ${n(cov.listsByStatus.unparsed)} not read yet${cov.listsByStatus.gone ? html`, ${n(cov.listsByStatus.gone)} gone from GitHub` : ''}.</li>
<li>${n(c.items)} items: ${n(cov.itemsByKind.repo)} repositories, ${n(cov.itemsByKind.site)} sites, ${n(cov.itemsByKind.video)} videos, ${n(cov.itemsByKind.article)} articles, ${n(cov.itemsByKind.package)} packages, ${n(cov.itemsByKind.paper)} papers.</li>
<li>${n(cov.itemsInTwoOrMore)} items are named by two lists or more.</li>
<li>Repositories: ${n(cov.reposByStatus.active)} active, ${n(cov.reposByStatus.quiet)} quiet (no push in two years), ${n(cov.reposByStatus.archived)} archived, ${n(cov.reposByStatus.gone)} gone.</li>
</ul>
<p>The data is of ${fmtIso(ctx.meta.dataFinished)}.</p>
</article>`;
  return page(layout(ctx, { title: 'About', canonical: '/about', main, shape: 'narrow' }));
}
