// The shell of every page: head, header, main, footer and the quick-search dialog.
import { html, type Html } from '../html.js';
import type { Ctx } from './context.js';

export interface Page {
  title: string;
  description?: string;
  /** The canonical path and query; none for a page that is not there. */
  canonical: string | null;
  noindex?: boolean;
  main: Html;
  /** A class on <body> for the page's layout: wide (rail and rows), narrow (a measure). */
  shape?: 'wide' | 'narrow' | 'list';
  scripts?: ('listfilter')[];
  /** The value of the header's search box. */
  q?: string | null;
}

export function layout(ctx: Ctx, page: Page): string {
  const title = page.title === ctx.siteName ? ctx.siteName : `${page.title} · ${ctx.siteName}`;
  const body = html`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
${page.description ? html`<meta name="description" content="${page.description}">\n` : ''}${page.canonical === null ? '' : html`<link rel="canonical" href="${ctx.origin}${page.canonical}">\n`}${page.noindex ? html`<meta name="robots" content="noindex,follow">\n` : ''}<link rel="stylesheet" href="${ctx.assets.css}">
<script src="${ctx.assets.quick}" defer></script>
${(page.scripts ?? []).map((s) => html`<script src="${ctx.assets[s]}" defer></script>\n`)}</head>
<body class="${page.shape ?? 'wide'}">
<a class="skip" href="#main">Skip to the content</a>
<header class="top"><div class="bar">
<a class="brand" href="/">${ctx.siteName}</a>
<form class="top-search" action="/search" method="get" role="search"><input type="search" name="q" value="${
    page.q ?? ''
  }" aria-label="Search" placeholder="Search  ( / )" autocomplete="off"></form>
<nav class="nav"><a href="/lists">Lists</a><a href="/items">Items</a><a href="/about">About</a></nav>
</div></header>
<main id="main">${page.main}</main>
<footer class="foot"><p>${ctx.siteName} indexes names, sections and links. Descriptions belong to the lists and are not copied here. Keep a list and want it left out? <a href="/about#leave-out">Open an issue</a>.</p></footer>
<dialog id="quick" aria-label="Quick search"><form method="get" action="/search" class="quick-form">
<input id="quick-input" type="search" name="q" role="combobox" aria-expanded="false" aria-controls="quick-options" aria-autocomplete="list" autocomplete="off" placeholder="Search lists, items and tags" aria-label="Quick search">
<ul id="quick-options" role="listbox" aria-label="Results"></ul>
<p class="quick-help">↑ ↓ to move, Enter to open, Esc to close</p>
</form></dialog>
</body>
</html>
`;
  return body.value;
}
