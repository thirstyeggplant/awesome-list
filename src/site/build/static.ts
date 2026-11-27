// The static files that ship with the Worker beside the database it reads: the assets, the facet arrays,
// the terms, the translations, the sitemaps, robots.txt, the icons and _headers. Written at build into out/site-assets/.
import { createHash } from 'node:crypto';
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { CACHE, SITEMAP_CHUNK } from '../config.js';
import { escape } from '../html.js';
import { isoDay } from '../i18n/format.js';
import { alternates } from '../i18n/indexing.js';
import { LOCALES, localePath, type Locale } from '../i18n/locales.js';

/** The site's own CSS, scripts and share image, each at /assets/{hash}/{name}. */
export interface AssetFile { name: string; hash: string; path: string; body: Buffer }

/** Files written at the root, unhashed, because browsers ask for them by these names. */
export const ROOT_FILES = ['favicon.ico', 'favicon.svg', 'apple-touch-icon.png', 'site.webmanifest'] as const;
/** The root files kept in src/site/assets/; the manifest is written from the site's name. */
const ICONS = ROOT_FILES.filter((f) => f !== 'site.webmanifest');

export function readAssets(dir: string): AssetFile[] {
  return readdirSync(dir)
    .filter((name) => ['.css', '.js', '.png'].includes(extname(name)) && !(ROOT_FILES as readonly string[]).includes(name))
    .sort()
    .map((name) => {
      const body = readFileSync(join(dir, name));
      const hash = createHash('sha256').update(body).digest('hex').slice(0, 10);
      return { name, hash, path: `/assets/${hash}/${name}`, body };
    });
}

/** The icons and the manifest, by their root path. */
export function readRootFiles(dir: string, siteName: string): Map<string, Buffer | string> {
  const files = new Map<string, Buffer | string>(ICONS.map((name) => [`/${name}`, readFileSync(join(dir, name))]));
  files.set('/site.webmanifest', manifest(siteName));
  return files;
}

/** The web app manifest: English only; the site is not an installable app. */
export function manifest(siteName: string): string {
  const paper = '#faf8f3';
  return `${JSON.stringify(
    {
      name: siteName,
      short_name: siteName,
      start_url: '/',
      display: 'browser',
      background_color: paper,
      theme_color: paper,
      icons: [
        { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' },
        { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      ],
    },
    null,
    2,
  )}\n`;
}

export interface SitemapList {
  slug: string;
  /** The day of the list's last push (days since 1970-01-01): when its content last changed. */
  pushedDay: number | null;
}

export interface SitemapSource {
  origin: string;
  /** The data date, YYYY-MM-DD. */
  dataDay: string;
  /** Category slugs, for the category pages. */
  categories: readonly string[];
  lists: readonly SitemapList[];
  owners: readonly string[];
  /** One-filter pages of /items worth finding (browse.xml, English only): addresses with their query. */
  browse?: readonly string[];
  itemKeys: readonly string[];
  /** Item URLs in one items-{n}.xml. */
  chunk?: number;
}

const HEAD = '<?xml version="1.0" encoding="UTF-8"?>\n';

interface Entry {
  /** The path and query, unprefixed. */
  address: string;
  lastmod?: string;
  /** Write the eleven hreflang alternates of a page that is indexed in every language. */
  alternates?: boolean;
  /** The language of this address, when not the file's. */
  locale?: Locale;
}

function split(address: string): [string, string] {
  const i = address.indexOf('?');
  return i === -1 ? [address, ''] : [address.slice(0, i), address.slice(i)];
}

function urlset(origin: string, entries: readonly Entry[], locale: Locale = 'en'): { body: string; lastmod: string | null } {
  let latest: string | null = null;
  const urls = entries.map((e) => {
    const [path, query] = split(e.address);
    if (e.lastmod !== undefined && (latest === null || e.lastmod > latest)) latest = e.lastmod;
    const links = e.alternates
      ? alternates(origin, path, query).map((a) => `<xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${escape(a.href)}"/>`).join('')
      : '';
    const lastmod = e.lastmod === undefined ? '' : `<lastmod>${e.lastmod}</lastmod>`;
    return `<url><loc>${escape(origin + localePath(e.locale ?? locale, path) + query)}</loc>${lastmod}${links}</url>`;
  });
  const xhtml = entries.some((e) => e.alternates) ? ' xmlns:xhtml="http://www.w3.org/1999/xhtml"' : '';
  return {
    body: `${HEAD}<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"${xhtml}>\n${urls.join('\n')}\n</urlset>\n`,
    lastmod: latest,
  };
}

/** The pages with words of ours that are not lists: offered in every language. */
export function pageAddresses(categories: readonly string[]): string[] {
  return ['/', '/lists', '/items', '/about', ...categories.map((c) => `/lists?category=${c}`)];
}

/**
 * /sitemap.xml (an index) and /sitemaps/{pages, lists-{code}, browse, owners, items-n}.xml, by path. Pages and lists are
 * in every language with their alternates; owners and items are English only (their other languages point their
 * canonical at the English). List pages carry their last push as lastmod (never after the data date), the other
 * pages the data date; owners and items none, since nothing records when their pages changed.
 */
export function sitemaps(s: SitemapSource): Map<string, string> {
  const chunk = s.chunk ?? SITEMAP_CHUNK;
  const { origin, dataDay } = s;
  const files = new Map<string, { body: string; lastmod: string | null }>();
  const pages = pageAddresses(s.categories).map((address): Entry => ({ address, lastmod: dataDay, alternates: true }));
  files.set('pages.xml', urlset(origin, LOCALES.flatMap((locale) => pages.map((p) => ({ ...p, locale })))));
  const lists = s.lists.map((l): Entry => {
    const day = l.pushedDay === null ? null : isoDay(l.pushedDay);
    const e: Entry = { address: `/lists/${l.slug}`, alternates: true };
    if (day !== null) e.lastmod = day < dataDay ? day : dataDay;
    return e;
  });
  for (const l of LOCALES) files.set(`lists-${l}.xml`, urlset(origin, lists, l));
  files.set('browse.xml', urlset(origin, (s.browse ?? []).map((address) => ({ address }))));
  files.set('owners.xml', urlset(origin, s.owners.map((o) => ({ address: `/gh/${o}` }))));
  for (let n = 1; (n - 1) * chunk < s.itemKeys.length; n++) {
    files.set(`items-${n}.xml`, urlset(origin, s.itemKeys.slice((n - 1) * chunk, n * chunk).map((k) => ({ address: `/${k}` }))));
  }
  const index = [...files].map(
    ([n, f]) => `<sitemap><loc>${escape(`${origin}/sitemaps/${n}`)}</loc>${f.lastmod === null ? '' : `<lastmod>${f.lastmod}</lastmod>`}</sitemap>`,
  );
  const out = new Map<string, string>([
    ['/sitemap.xml', `${HEAD}<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${index.join('\n')}\n</sitemapindex>\n`],
  ]);
  for (const [name, f] of files) out.set(`/sitemaps/${name}`, f.body);
  return out;
}

/** robots.txt: everything but the quick-search API, the data files and search, in every language. */
export function robots(origin: string): string {
  const search = LOCALES.map((l) => `Disallow: ${localePath(l, '/search')}`);
  return ['User-agent: *', 'Allow: /', 'Disallow: /api/', 'Disallow: /_data/', ...search, '', `Sitemap: ${origin}/sitemap.xml`, ''].join('\n');
}

/** Headers for the static files, in Cloudflare's _headers format. The Worker sets its own. */
export function headersFile(): string {
  return [
    '/*',
    '  X-Content-Type-Options: nosniff',
    '/assets/*',
    `  Cache-Control: ${CACHE.asset}`,
    '/sitemap.xml',
    `  Cache-Control: ${CACHE.crawl}`,
    '/sitemaps/*',
    `  Cache-Control: ${CACHE.crawl}`,
    '/robots.txt',
    `  Cache-Control: ${CACHE.crawl}`,
    ...ROOT_FILES.flatMap((name) => [`/${name}`, `  Cache-Control: ${CACHE.icon}`]),
    '',
  ].join('\n');
}

export function writeFile(root: string, path: string, body: string | Uint8Array): number {
  const file = join(root, path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, body);
  return typeof body === 'string' ? Buffer.byteLength(body) : body.length;
}
