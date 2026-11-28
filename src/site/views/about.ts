// /about: what the site is, what it shows, where it comes from, how a list is left out, and its coverage.
import { PROJECT_REPO } from '../config.js';
import { html, outbound, type Html } from '../html.js';
import { link, webSite } from './components.js';
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
  // The questions a visitor asks, with the site's own answers: also the page's FAQPage.
  const faq: [string, Html][] = [
    [loc.t(a.shownTitle, { site }), html`${a.shown}`],
    [a.attributionTitle, html`${a.attribution}`],
    [a.freshTitle, loc.h(a.fresh, { date: loc.timeIso(ctx.meta.dataFinished) })],
    [a.leaveOutTitle, loc.h(a.leaveOut, {}, { 1: (t) => outbound(`${PROJECT_REPO}/issues`, t) })],
    [a.aiTitle, loc.h(a.ai, { site }, { 1: (t) => html`<a href="/llms.txt">${t}</a>` })],
  ];
  const main = html`<article class="about-page">
<h1>${loc.t(a.h1, { site })}</h1>
<p class="lede">${loc.h(a.intro, {
    site,
    lists: loc.plural(loc.m.count.lists, c.lists ?? 0),
    items: loc.plural(loc.m.count.items, c.items ?? 0),
  }, { 1: (t) => link(loc, '/lists/sindresorhus/awesome', t) })}</p>
${faq.map(([q, answer], i) => html`<h2${i === 3 ? html` id="leave-out"` : ''}>${q}</h2>
<p>${answer}</p>
`)}<h2>${a.coverageTitle}</h2>
<ul>
<li>${loc.t(ls.gone ? a.coverageListsGone : a.coverageLists, { ok: n(ls.ok), partial: n(ls.partial), unparsed: n(ls.unparsed), gone: n(ls.gone) })}</li>
<li>${loc.t(a.coverageItems, {
    items: loc.plural(loc.m.count.items, c.items ?? 0),
    repo: n(kinds.repo), site: n(kinds.site), video: n(kinds.video), article: n(kinds.article), package: n(kinds.package), paper: n(kinds.paper),
  })}</li>
<li>${loc.t(a.coverageTwoOrMore, { n: n(cov.itemsInTwoOrMore) })}</li>
<li>${loc.t(a.coverageRepos, { active: n(repos.active), quiet: n(repos.quiet), archived: n(repos.archived), gone: n(repos.gone) })}</li>
</ul>
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
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          inLanguage: loc.info.hreflang,
          isPartOf: webSite(ctx),
          mainEntity: faq.map(([q, answer]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: textOf(answer) } })),
        },
      ],
    }),
  );
}

/** The text of a piece of HTML this code made: its tags taken out and its entities read. */
export function textOf(h: Html): string {
  return h.value.replace(/<[^>]*>/g, '').replace(/&(amp|lt|gt|quot|#39);/g, (_, e: string) => ({ amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'" })[e] ?? '');
}
