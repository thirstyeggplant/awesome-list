// Which pages are offered to search engines in which languages. The layout, the sitemap writer and the tests
// all ask this module.
//
// each:    indexed in every language: self-canonical, with hreflang alternates to all ten.
// english: shown in every language but indexed only in English: canonical to the English address, no hreflang.
// none:    noindex,follow in every language.
import { LOCALES, LOCALE_INFO, localePath, type Locale } from './locales.js';

export type Indexing = 'each' | 'english' | 'none';

export type Route = 'home' | 'lists' | 'list' | 'items' | 'item' | 'owner' | 'about' | 'search' | 'notfound';

/** Parameters of /lists that keep a page indexed in every language (a category, and its pages). */
const LISTS_EACH = new Set(['category', 'page']);

/**
 * The rule for a page. `query` is its canonical query string ('' or '?a=b&…'); `noindex` is what the page says
 * about itself in English (a search, two filters, a sort, a thin page…), which holds in every language.
 */
export function indexedIn(route: Route, query: string, noindex = false): Indexing {
  if (noindex || route === 'search' || route === 'notfound') return 'none';
  switch (route) {
    case 'home':
    case 'list':
    case 'about':
      return 'each';
    case 'lists':
      return [...new URLSearchParams(query).keys()].every((k) => LISTS_EACH.has(k)) ? 'each' : 'english';
    case 'items':
      return query === '' ? 'each' : 'english';
    default:
      return 'english';
  }
}

export interface Alternate { hreflang: string; href: string }

/**
 * The eleven alternates of a page that is `each`: one per language, then x-default (English). Absolute; the
 * same path and query in every language. One function for the head, the switcher and the sitemaps.
 */
export function alternates(origin: string, path: string, query = ''): Alternate[] {
  const out = LOCALES.map((l) => ({ hreflang: LOCALE_INFO[l].hreflang, href: origin + localePath(l, path) + query }));
  out.push({ hreflang: 'x-default', href: origin + path + query });
  return out;
}

/** The address of a page in a language (path and query, no origin). */
export function addressIn(locale: Locale, path: string, query = ''): string {
  return localePath(locale, path) + query;
}
