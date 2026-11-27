// The shell of every page: head, header, main, footer (with the language switcher) and the quick-search dialog.
import { html, jsonLd, type Html } from '../html.js';
import { alternates, indexedIn, type Indexing, type Route } from '../i18n/indexing.js';
import { LOCALES, LOCALE_INFO, localePath } from '../i18n/locales.js';
import { en } from '../i18n/messages/en.js';
import { MESSAGES } from '../i18n/messages/index.js';
import type { Ctx } from './context.js';

export interface Page {
  /** Which kind of page, for `indexedIn`. */
  route: Route;
  /** The page's title without the site's name; also og:title. */
  title: string;
  /** The whole <title>, when it is not "{title} · {site}" (the home and About pages). */
  headTitle?: string;
  description?: string;
  /** The canonical path and query, unprefixed; none for a page that is not there. */
  canonical: string | null;
  /** What the page says about itself in English; it holds in every language. */
  noindex?: boolean;
  main: Html;
  /** A class on <body> for the page's layout: wide (rail and rows), narrow (a measure). */
  shape?: 'wide' | 'narrow' | 'list';
  scripts?: ('listfilter')[];
  /** The value of the header's search box. */
  q?: string | null;
  /** The previous and next page of a listing (paths, unprefixed), for <link rel="prev"> and "next". */
  prev?: string | null;
  next?: string | null;
  /** Structured data, written only on a page that is its own canonical. */
  jsonLd?: readonly unknown[];
}

/** The image every page shares: the name on the paper colour. */
export const OG_IMAGE = { width: 1200, height: 630 } as const;

/** Titles aim at this many characters or fewer. */
export function titleLimit(cjk: boolean): number {
  return cjk ? 30 : 60;
}

/** A title that would run over drops the tail after its first colon, never the name before it. */
export function fitTitle(title: string, limit: number, suffix = ''): string {
  if (title.length + suffix.length <= limit) return title;
  const m = /^(.+?)\s*[:：]\s/.exec(title) ?? /^(.+?)[：]/.exec(title);
  return m?.[1] ?? title;
}

function splitPath(address: string): [string, string] {
  const i = address.indexOf('?');
  return i === -1 ? [address, ''] : [address.slice(0, i), address.slice(i)];
}

/** The language switcher: this same page in each language, each written in its own name. */
function switcher(ctx: Ctx): Html {
  const [path, query] = splitPath(ctx.here);
  return html`<nav class="langs" aria-label="${ctx.loc.m.lang.switcher}"><ul>${LOCALES.map((l) => {
    const info = LOCALE_INFO[l];
    const m = MESSAGES[l];
    // A language still written in English offers no suggestion.
    const suggest = l === 'en' || m.lang.suggest !== en.lang.suggest;
    return html`<li><a href="${localePath(l, path)}${query}" lang="${info.htmlLang}" hreflang="${info.hreflang}"${
      l === ctx.loc.locale ? html` aria-current="true"` : ''
    }${suggest ? html` data-suggest="${m.lang.suggest}" data-close="${m.lang.close}"` : ''}>${info.name}</a></li>`;
  })}</ul></nav>`;
}

/** The mark beside the name: the favicon's four books on their shelf, in the theme's colours. */
const MARK = html`<svg class="mark" viewBox="0 0 32 32" width="22" height="22" aria-hidden="true" focusable="false"><g class="books"><rect x="6" y="8" width="4" height="17"/><rect x="11.5" y="6" width="4" height="19"/><rect x="17" y="10" width="4" height="15"/><rect x="21.6" y="9.2" width="4" height="16" transform="rotate(-14 23.6 25)"/></g><rect class="board" x="4" y="25" width="24" height="2"/></svg>`;

export function layout(ctx: Ctx, page: Page): string {
  const { loc } = ctx;
  const m = loc.m;
  /** A link of the header: marked as the page being read, or as the section the page is in. */
  const navLink = (path: string, text: string, self: Route, child?: Route): Html =>
    html`<a href="${loc.href(path)}"${page.route === self ? html` aria-current="page"` : page.route === child ? html` class="in"` : ''}>${text}</a>`;
  const limit = titleLimit(loc.info.cjk);
  const suffix = ` · ${ctx.siteName}`;
  const title = page.headTitle ?? loc.t(m.site.title, { title: fitTitle(page.title, limit, suffix), site: ctx.siteName });

  let indexing: Indexing = 'none';
  let canonical: string | null = null;
  if (page.canonical !== null) {
    const [path, query] = splitPath(page.canonical);
    indexing = indexedIn(page.route, query, page.noindex ?? false);
    canonical = ctx.origin + (indexing === 'english' ? page.canonical : localePath(loc.locale, path) + query);
  }
  const alts = page.canonical !== null && indexing === 'each' ? alternates(ctx.origin, ...splitPath(page.canonical)) : [];
  const selfCanonical = indexing === 'each' || (indexing === 'english' && loc.locale === 'en');
  const ogTitle = page.title;
  const og = html`<meta property="og:type" content="website">
<meta property="og:site_name" content="${ctx.siteName}">
<meta property="og:title" content="${ogTitle}">
${page.description ? html`<meta property="og:description" content="${page.description}">\n` : ''}${
    canonical === null ? '' : html`<meta property="og:url" content="${canonical}">\n`
  }<meta property="og:locale" content="${loc.info.og}">
${indexing === 'each' ? LOCALES.filter((l) => l !== loc.locale).map((l) => html`<meta property="og:locale:alternate" content="${LOCALE_INFO[l].og}">\n`) : ''}${
    ctx.assets.og ? html`<meta property="og:image" content="${ctx.origin}${ctx.assets.og}">
<meta property="og:image:width" content="${OG_IMAGE.width}">
<meta property="og:image:height" content="${OG_IMAGE.height}">
<meta property="og:image:alt" content="${ctx.siteName}">\n` : ''
  }<meta name="twitter:card" content="summary_large_image">`;

  const body = html`<!doctype html>
<html lang="${loc.info.htmlLang}" dir="${loc.info.dir}" data-prefix="${loc.prefix}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${title}</title>
${page.description ? html`<meta name="description" content="${page.description}">\n` : ''}${
    canonical === null ? '' : html`<link rel="canonical" href="${canonical}">\n`
  }${indexing === 'none' ? html`<meta name="robots" content="noindex,follow">\n` : ''}${alts.map(
    (a) => html`<link rel="alternate" hreflang="${a.hreflang}" href="${a.href}">\n`,
  )}${page.prev ? html`<link rel="prev" href="${ctx.origin}${loc.href(page.prev)}">\n` : ''}${
    page.next ? html`<link rel="next" href="${ctx.origin}${loc.href(page.next)}">\n` : ''
  }${og}
<meta name="theme-color" content="#faf8f3" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#141517" media="(prefers-color-scheme: dark)">
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="stylesheet" href="${ctx.assets.css}">
<script src="${ctx.assets.quick}" defer></script>
${(page.scripts ?? []).map((s) => html`<script src="${ctx.assets[s]}" defer></script>\n`)}${
    selfCanonical && page.jsonLd && page.jsonLd.length > 0 ? html`${jsonLd(page.jsonLd.length === 1 ? page.jsonLd[0] : page.jsonLd)}\n` : ''
  }</head>
<body class="${page.shape ?? 'wide'}">
<a class="skip" href="#main">${m.site.skip}</a>
<header class="top"><div class="bar">
<a class="brand" href="${loc.href('/')}" translate="no">${MARK}${ctx.siteName}</a>
<nav class="nav">${navLink('/lists', m.nav.lists, 'lists', 'list')}${navLink('/items', m.nav.items, 'items', 'item')}${navLink('/about', m.nav.about, 'about')}</nav>
${page.route === 'home' || page.route === 'search' ? '' : html`<form class="top-search" action="${loc.href('/search')}" method="get" role="search"><input type="search" name="q" value="${
    page.q ?? ''
  }" aria-label="${m.nav.search}" placeholder="${m.nav.searchHint}" autocomplete="off"></form>`}
</div></header>
<main id="main">${page.main}</main>
<footer class="foot"><div class="foot-in">
<div class="foot-about"><a class="brand" href="${loc.href('/')}" translate="no">${MARK}${ctx.siteName}</a>
<p>${loc.h(m.site.footer, { site: ctx.siteName }, { 1: (t) => html`<a href="${loc.href('/about')}#leave-out">${t}</a>` })}</p></div>
<div class="foot-links"><ul class="foot-nav"><li><a href="${loc.href('/lists')}">${m.nav.lists}</a></li><li><a href="${loc.href('/items')}">${m.nav.items}</a></li><li><a href="${loc.href('/about')}">${m.nav.about}</a></li></ul>
${switcher(ctx)}</div>
</div></footer>
<dialog id="quick" aria-label="${m.quick.label}" data-lists="${m.quick.lists}" data-items="${m.quick.items}" data-tags="${m.quick.tags}" data-n-lists="${JSON.stringify(m.count.lists)}" data-n-items="${JSON.stringify(m.count.items)}"><form method="get" action="${loc.href('/search')}" class="quick-form">
<input id="quick-input" type="search" name="q" role="combobox" aria-expanded="false" aria-controls="quick-options" aria-autocomplete="list" autocomplete="off" placeholder="${m.quick.placeholder}" aria-label="${m.quick.label}">
<ul id="quick-options" role="listbox" aria-label="${m.quick.results}"></ul>
<p class="quick-help">${m.quick.help}</p>
</form></dialog>
</body>
</html>
`;
  return body.value;
}
