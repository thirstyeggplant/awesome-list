// /about: what the site is, what it shows, where it comes from, how a list is left out, and its coverage.
import { PROJECT_REPO } from '../config.js';
import { html, outbound } from '../html.js';
import { link } from './components.js';
import type { Ctx } from './context.js';
import { layout } from './layout.js';
import { page, type ViewResult } from './result.js';

export function aboutPage(ctx: Ctx): ViewResult {
  const { loc } = ctx;
  const a = loc.m.about;
  const c = ctx.meta.counts;
  const cov = ctx.meta.coverage;
  const n = (v: number | undefined): string => loc.n(v ?? 0);
  const site = ctx.siteName;
  const ls = cov.listsByStatus;
  const kinds = cov.itemsByKind;
  const repos = cov.reposByStatus;
  const main = html`<article class="about">
<h1>${loc.t(a.h1, { site })}</h1>
<p>${loc.h(a.intro, {
    site,
    lists: loc.plural(loc.m.count.lists, c.lists ?? 0),
    items: loc.plural(loc.m.count.items, c.items ?? 0),
  }, { 1: (t) => link(loc, '/lists/sindresorhus/awesome', t) })}</p>
<h2>${a.shownTitle}</h2>
<p>${a.shown}</p>
<h2>${a.attributionTitle}</h2>
<p>${a.attribution}</p>
<h2 id="leave-out">${a.leaveOutTitle}</h2>
<p>${loc.h(a.leaveOut, {}, { 1: (t) => outbound(`${PROJECT_REPO}/issues`, t) })}</p>
<h2>${a.coverageTitle}</h2>
<ul>
<li>${loc.t(ls.gone ? a.coverageListsGone : a.coverageLists, { ok: n(ls.ok), partial: n(ls.partial), unparsed: n(ls.unparsed), gone: n(ls.gone) })}</li>
<li>${loc.t(a.coverageItems, {
    items: loc.plural(loc.m.count.items, c.items ?? 0),
    repo: n(kinds.repo), site: n(kinds.site), video: n(kinds.video), article: n(kinds.article), package: n(kinds.package), paper: n(kinds.paper),
  })}</li>
<li>${loc.t(a.coverageTwoOrMore, { n: n(cov.itemsInTwoOrMore) })}</li>
<li>${loc.t(a.coverageRepos, { active: n(repos.active), quiet: n(repos.quiet), archived: n(repos.archived), gone: n(repos.gone) })}</li>
</ul>
<p>${loc.t(a.dataOf, { date: loc.dayIso(ctx.meta.dataFinished) })}</p>
</article>`;
  const title = loc.t(loc.m.meta.about.title, { site });
  return page(
    layout(ctx, {
      route: 'about',
      title,
      headTitle: title,
      description: loc.t(loc.m.meta.about.description, { site }),
      canonical: '/about',
      main,
      shape: 'narrow',
    }),
  );
}
