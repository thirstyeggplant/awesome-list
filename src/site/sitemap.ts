// /sitemap.xml (an index), /sitemaps/{pages,lists,owners,items-n}.xml and /robots.txt.
import { escape } from './html.js';

export interface SitemapSource {
  origin: string;
  /** The data date, YYYY-MM-DD. */
  lastmod: string;
  listSlugs: readonly string[];
  owners: () => readonly string[];
  itemKeys: () => readonly string[];
  /** Item URLs in one items-{n}.xml. */
  chunk: number;
}

const HEAD = '<?xml version="1.0" encoding="UTF-8"?>\n';

function urlset(origin: string, lastmod: string, paths: readonly string[]): string {
  const urls = paths.map((p) => `<url><loc>${escape(origin + p)}</loc><lastmod>${lastmod}</lastmod></url>`);
  return `${HEAD}<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
}

export class Sitemaps {
  private keys: readonly string[] | null = null;
  constructor(private readonly s: SitemapSource) {}

  private items(): readonly string[] {
    this.keys ??= this.s.itemKeys();
    return this.keys;
  }

  /** How many items-{n}.xml there are. */
  itemFiles(): number {
    return Math.ceil(this.items().length / this.s.chunk);
  }

  names(): string[] {
    return ['pages.xml', 'lists.xml', 'owners.xml', ...Array.from({ length: this.itemFiles() }, (_, i) => `items-${i + 1}.xml`)];
  }

  index(): string {
    const entries = this.names().map(
      (n) => `<sitemap><loc>${escape(`${this.s.origin}/sitemaps/${n}`)}</loc><lastmod>${this.s.lastmod}</lastmod></sitemap>`,
    );
    return `${HEAD}<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</sitemapindex>\n`;
  }

  /** One file of the set, or null. */
  file(name: string): string | null {
    const { origin, lastmod } = this.s;
    if (name === 'pages.xml') return urlset(origin, lastmod, ['/', '/lists', '/items', '/about']);
    if (name === 'lists.xml') return urlset(origin, lastmod, this.s.listSlugs.map((s) => `/lists/${s}`));
    if (name === 'owners.xml') return urlset(origin, lastmod, this.s.owners().map((o) => `/gh/${o}`));
    const m = /^items-([1-9][0-9]*)\.xml$/.exec(name);
    if (!m) return null;
    const n = Number(m[1]);
    if (n > this.itemFiles()) return null;
    const keys = this.items().slice((n - 1) * this.s.chunk, n * this.s.chunk);
    return urlset(origin, lastmod, keys.map((k) => `/${k}`));
  }

  robots(): string {
    return `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /search\n\nSitemap: ${this.s.origin}/sitemap.xml\n`;
  }
}
