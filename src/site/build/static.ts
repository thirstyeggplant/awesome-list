// The static files that ship with the Worker beside the database it reads: the assets, the facet arrays,
// the terms, the sitemaps, robots.txt and _headers. Written at build into out/site-assets/.
import { createHash } from 'node:crypto';
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { CACHE, SITEMAP_CHUNK } from '../config.js';
import { escape } from '../html.js';

/** The site's own CSS and scripts, each at /assets/{hash}/{name}. */
export interface AssetFile { name: string; hash: string; path: string; body: Buffer }

export function readAssets(dir: string): AssetFile[] {
  return readdirSync(dir)
    .filter((name) => ['.css', '.js'].includes(extname(name)))
    .sort()
    .map((name) => {
      const body = readFileSync(join(dir, name));
      const hash = createHash('sha256').update(body).digest('hex').slice(0, 10);
      return { name, hash, path: `/assets/${hash}/${name}`, body };
    });
}

export interface SitemapSource {
  origin: string;
  /** The data date, YYYY-MM-DD. */
  lastmod: string;
  listSlugs: readonly string[];
  owners: readonly string[];
  itemKeys: readonly string[];
  /** Item URLs in one items-{n}.xml. */
  chunk?: number;
}

const HEAD = '<?xml version="1.0" encoding="UTF-8"?>\n';

function urlset(origin: string, lastmod: string, paths: readonly string[]): string {
  const urls = paths.map((p) => `<url><loc>${escape(origin + p)}</loc><lastmod>${lastmod}</lastmod></url>`);
  return `${HEAD}<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
}

/** /sitemap.xml (an index) and /sitemaps/{pages,lists,owners,items-n}.xml, by path. */
export function sitemaps(s: SitemapSource): Map<string, string> {
  const chunk = s.chunk ?? SITEMAP_CHUNK;
  const { origin, lastmod } = s;
  const files = new Map<string, string>([
    ['pages.xml', urlset(origin, lastmod, ['/', '/lists', '/items', '/about'])],
    ['lists.xml', urlset(origin, lastmod, s.listSlugs.map((x) => `/lists/${x}`))],
    ['owners.xml', urlset(origin, lastmod, s.owners.map((o) => `/gh/${o}`))],
  ]);
  for (let n = 1; (n - 1) * chunk < s.itemKeys.length; n++) {
    files.set(`items-${n}.xml`, urlset(origin, lastmod, s.itemKeys.slice((n - 1) * chunk, n * chunk).map((k) => `/${k}`)));
  }
  const entries = [...files.keys()].map(
    (n) => `<sitemap><loc>${escape(`${origin}/sitemaps/${n}`)}</loc><lastmod>${lastmod}</lastmod></sitemap>`,
  );
  const out = new Map<string, string>([
    ['/sitemap.xml', `${HEAD}<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</sitemapindex>\n`],
  ]);
  for (const [name, body] of files) out.set(`/sitemaps/${name}`, body);
  return out;
}

export function robots(origin: string): string {
  return `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /search\n\nSitemap: ${origin}/sitemap.xml\n`;
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
    '',
  ].join('\n');
}

export function writeFile(root: string, path: string, body: string | Uint8Array): number {
  const file = join(root, path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, body);
  return typeof body === 'string' ? Buffer.byteLength(body) : body.length;
}
