// The share row: plain links to share a page's canonical address, and two buttons that only script shows
// ("Copy link", and "Share…" where the system has a share sheet). Shown on a list, an item, an owner, the home
// page and /items with one language or topic; never on search, filter combinations or 404 (docs/design.md).
import { html, raw, type Html } from '../html.js';
import type { Ctx } from './context.js';
import { canonicalOf, type Page } from './layout.js';

/** Inline icons, drawn by the stylesheet in the text's colour (`currentColor`). No image, font or script. */
const ICON = {
  x: '<path d="M4 4h4l12 16h-4zM19.5 4l-6.3 7.2M4.5 20l6.3-7.2"/>',
  bluesky: '<path d="M12 11C10.5 8 7 4.5 4.5 4.5 3 4.5 3 6 3 7c0 1 .5 5 3 5.5-2.5.5-3 2.5-1.5 4S9 18 12 13c3 5 6 5 7.5 3.5s1-3.5-1.5-4C20.5 12 21 8 21 7c0-1 0-2.5-1.5-2.5C17 4.5 13.5 8 12 11z"/>',
  linkedin: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 10.5V17M8 7.5v.01M12 17v-6.5M12 13.5c0-2 1.3-3 2.7-3S17 11.5 17 13.5V17"/>',
  reddit: '<ellipse cx="12" cy="14.5" rx="7.5" ry="5.5"/><path d="M9.5 14v.01M14.5 14v.01M9.5 17c1.5.8 3.5.8 5 0M12 9l1.2-5 3.8 1"/><circle cx="18" cy="5" r="1.3"/>',
  hn: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 7.5l4 5.5 4-5.5M12 13v4.5"/>',
  email: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 6.5 12 13l8.5-6.5"/>',
  copy: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  native: '<path d="M12 3v12M7.5 7.5 12 3l4.5 4.5M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/>',
} as const;

function icon(name: keyof typeof ICON): Html {
  return html`<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">${raw(ICON[name])}</svg>`;
}

const enc = encodeURIComponent;

/** Where each service takes a page to share: its address and its title, nothing else (no tracking parameters). */
export function shareLinks(url: string, title: string): { service: string; icon: keyof typeof ICON; href: string }[] {
  return [
    { service: 'X', icon: 'x', href: `https://x.com/intent/post?text=${enc(title)}&url=${enc(url)}` },
    { service: 'Bluesky', icon: 'bluesky', href: `https://bsky.app/intent/compose?text=${enc(`${title} ${url}`)}` },
    { service: 'LinkedIn', icon: 'linkedin', href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}` },
    { service: 'Reddit', icon: 'reddit', href: `https://www.reddit.com/submit?url=${enc(url)}&title=${enc(title)}` },
    { service: 'Hacker News', icon: 'hn', href: `https://news.ycombinator.com/submitlink?u=${enc(url)}&t=${enc(title)}` },
  ];
}

/** The row for a page, from the same facts its head is written from; nothing for a page with no canonical. */
export function shareRow(ctx: Ctx, page: Pick<Page, 'route' | 'canonical' | 'noindex' | 'title' | 'headTitle'>): Html {
  const { canonical: url } = canonicalOf(ctx, page);
  if (url === null) return html``;
  const m = ctx.loc.m.share;
  const title = page.headTitle ?? page.title;
  const links = shareLinks(url, title).map((s) => {
    const name = ctx.loc.t(m.on, { service: s.service });
    return html`<li><a href="${s.href}" target="_blank" rel="noopener noreferrer" aria-label="${name}" title="${name}">${icon(s.icon)}</a></li>`;
  });
  // Email opens the mail program, not a page, so it takes no new tab.
  const mail = html`<li><a href="mailto:?subject=${enc(title)}&body=${enc(url)}" aria-label="${m.email}" title="${m.email}">${icon('email')}</a></li>`;
  return html`<div class="share" role="group" aria-label="${m.label}" data-url="${url}" data-title="${title}"><span class="share-label" aria-hidden="true">${m.label}</span><ul>${links}${mail}<li hidden><button type="button" class="share-copy" aria-label="${m.copy}" title="${m.copy}" data-copied="${m.copied}">${icon('copy')}</button></li><li hidden><button type="button" class="share-native" aria-label="${m.native}" title="${m.native}">${icon('native')}</button></li></ul><span class="share-status" role="status" aria-live="polite"></span></div>`;
}
