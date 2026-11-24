// The site: every route, from a request to a reply. The server only adapts node:http to this.
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { canonicalUrl } from '../canonical.js';
import { ITEM_KINDS } from '../model.js';
import { CACHE, LRU_SIZE, SITE_NAME, SITEMAP_CHUNK } from './config.js';
import { Db, type TermRow } from './db.js';
import { FacetIndex } from './facets.js';
import { Lru, render, reply, TYPES, type Answer, type Rendered, type Reply, type SiteRequest } from './http.js';
import { keyOfPath, slugify } from './keys.js';
import { parseItemsQuery, parseListsQuery, tidyQ } from './query.js';
import { quick, type TagTerm } from './search.js';
import { Sitemaps } from './sitemap.js';
import { aboutPage } from './views/about.js';
import type { Assets, Ctx } from './views/context.js';
import { homePage } from './views/home.js';
import { itemPage } from './views/item.js';
import { itemsPage } from './views/items.js';
import { listPage } from './views/list.js';
import { listsPage } from './views/lists.js';
import { notFoundPage } from './views/notfound.js';
import { ownerPage } from './views/owner.js';
import type { ViewResult } from './views/result.js';
import { searchPage } from './views/search.js';

export interface SiteOptions {
  dbPath: string;
  origin: string;
  siteName?: string;
  sitemapChunk?: number;
  lruSize?: number;
  assetsDir?: string;
}

interface Asset { name: string; hash: string; type: string; body: Buffer }

const ASSET_TYPES: Record<string, string> = { '.css': TYPES.css, '.js': TYPES.js };

function loadAssets(dir: string): Map<string, Asset> {
  const out = new Map<string, Asset>();
  for (const name of readdirSync(dir).sort()) {
    const type = ASSET_TYPES[extname(name)];
    if (type === undefined) continue;
    const body = readFileSync(join(dir, name));
    const hash = createHash('sha256').update(body).digest('hex').slice(0, 10);
    out.set(name, { name, hash, type, body });
  }
  return out;
}

const html = (status: number, body: string, cache: string = CACHE.html): Answer => ({ status, type: TYPES.html, body, cache });
const moved = (location: string, status: 301 | 302 = 301): Answer => ({
  status,
  type: TYPES.text,
  body: `See ${location}\n`,
  cache: CACHE.html,
  location,
});

export class Site {
  readonly db: Db;
  readonly ctx: Ctx;
  readonly facets: FacetIndex;
  readonly etag: string;
  private readonly assets: Map<string, Asset>;
  private readonly sitemaps: Sitemaps;
  private readonly lru: Lru<string, Rendered>;
  private readonly termsByCount: TermRow[];

  constructor(options: SiteOptions) {
    this.db = new Db(options.dbPath);
    const meta = this.db.meta();
    const lists = this.db.lists();
    const categories = this.db.categories();
    const terms = this.db.terms();
    this.assets = loadAssets(options.assetsDir ?? fileURLToPath(new URL('./assets/', import.meta.url)));
    const assetPath = (name: string): string => {
      const a = this.assets.get(name);
      if (!a) throw new Error(`missing asset ${name}`);
      return `/assets/${a.hash}/${name}`;
    };
    const assets: Assets = { css: assetPath('site.css'), quick: assetPath('quick.js'), listfilter: assetPath('listfilter.js') };
    const assetsHash = [...this.assets.values()].map((a) => a.hash).join('');
    this.etag = `W/"${createHash('sha256').update(`${meta.buildId}:${assetsHash}`).digest('hex').slice(0, 16)}"`;
    const dataDay = Math.floor(Date.parse(meta.dataFinished) / 86_400_000);
    this.ctx = {
      siteName: options.siteName ?? SITE_NAME,
      origin: options.origin.replace(/\/+$/, ''),
      meta,
      dataDay: Number.isNaN(dataDay) ? 0 : dataDay,
      assets,
      lists,
      listById: new Map(lists.map((l) => [l.id, l])),
      listBySlug: new Map(lists.map((l) => [l.slug, l])),
      categories,
      categoryById: new Map(categories.map((c) => [c.id, c])),
      categoryBySlug: new Map(categories.map((c) => [c.slug, c])),
      termById: new Map(terms.map((t) => [t.id, t])),
      termBySlug: new Map(terms.map((t) => [`${t.ns}:${t.slug}`, t])),
    };
    this.termsByCount = [...terms].sort((a, b) => b.itemCount - a.itemCount || a.id - b.id);
    this.facets = new FacetIndex(this.db, lists, terms.reduce((m, t) => Math.max(m, t.id), 0), categories.length);
    this.sitemaps = new Sitemaps({
      origin: this.ctx.origin,
      lastmod: meta.dataFinished.slice(0, 10),
      listSlugs: lists.map((l) => l.slug),
      owners: () => this.db.ownersToCrawl(),
      itemKeys: () => this.db.indexableKeys(),
      chunk: options.sitemapChunk ?? SITEMAP_CHUNK,
    });
    this.lru = new Lru(options.lruSize ?? LRU_SIZE);
  }

  close(): void {
    this.db.close();
  }

  respond(req: SiteRequest): Reply {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return reply(req, render({ status: 405, type: TYPES.text, body: 'Method not allowed\n', cache: 'no-store' }), this.etag);
    }
    const cached = this.lru.get(req.url);
    if (cached) return reply(req, cached, this.etag);
    let answer: Answer;
    try {
      answer = this.route(req.url);
    } catch (e) {
      console.error(e);
      answer = { status: 500, type: TYPES.text, body: 'Something went wrong\n', cache: 'no-store' };
    }
    const rendered = render(answer);
    if (answer.status === 200 && answer.cache !== CACHE.health) this.lru.set(req.url, rendered);
    return reply(req, rendered, this.etag);
  }

  private notFound(path: string): Answer {
    return html(404, notFoundPage(this.ctx, this.db, path), CACHE.notFound);
  }

  private view(result: ViewResult, path: string): Answer {
    if (result === null) return this.notFound(path);
    if (result.kind === 'redirect') return moved(result.location, result.status);
    return html(200, result.html);
  }

  route(rawUrl: string): Answer {
    let url: URL;
    try {
      url = new URL(rawUrl, 'http://site.invalid');
    } catch {
      return this.notFound('/');
    }
    const path = url.pathname;
    const params = url.searchParams;

    if (path.startsWith('/assets/')) return this.asset(path);
    if (path === '/healthz') return { status: 200, type: TYPES.text, body: 'ok\n', cache: CACHE.health };

    // Canonical form: no trailing slash, no upper case.
    if (path.length > 1 && path.endsWith('/')) return moved(`${path.replace(/\/+$/, '') || '/'}${url.search}`);
    if (path !== path.toLowerCase()) return moved(`${path.toLowerCase()}${url.search}`);

    const ctx = this.ctx;
    const db = this.db;
    switch (path) {
      case '/':
        return this.view(homePage(ctx, db), path);
      case '/lists': {
        const q = parseListsQuery(params);
        return q === null ? this.notFound(path) : this.view(listsPage(ctx, db, q), path);
      }
      case '/items': {
        const q = parseItemsQuery(params);
        return q === null ? this.notFound(path) : this.view(itemsPage(ctx, db, this.facets, q), path);
      }
      case '/item': {
        const c = canonicalUrl(params.get('url') ?? '');
        const item = c === null ? null : db.itemByUrl(c.id);
        return item === null ? this.notFound(path) : moved(`/${item.key}`);
      }
      case '/search':
        return this.view(searchPage(ctx, db, tidyQ(params.get('q'))), path);
      case '/about':
        return this.view(aboutPage(ctx), path);
      case '/api/quick':
        return this.quick(params.get('q'));
      case '/robots.txt':
        return { status: 200, type: TYPES.text, body: this.sitemaps.robots(), cache: CACHE.crawl };
      case '/sitemap.xml':
        return { status: 200, type: TYPES.xml, body: this.sitemaps.index(), cache: CACHE.crawl };
      default:
        break;
    }

    const sm = /^\/sitemaps\/([a-z0-9-]+\.xml)$/.exec(path);
    if (sm) {
      const body = this.sitemaps.file(sm[1] ?? '');
      return body === null ? this.notFound(path) : { status: 200, type: TYPES.xml, body, cache: CACHE.crawl };
    }

    const list = /^\/lists\/([^/]+\/[^/]+)$/.exec(path);
    if (list) {
      const row = ctx.listBySlug.get(list[1] ?? '');
      if (row) return this.view(listPage(ctx, db, row), path);
      const to = db.redirect(path);
      return to === null ? this.notFound(path) : moved(to);
    }

    const key = keyOfPath(path);
    if (key !== null) {
      const item = db.itemByKey(key);
      if (item) return this.view(itemPage(ctx, db, item), path);
      const to = db.redirect(path);
      return to === null ? this.notFound(path) : moved(to);
    }

    const owner = /^\/gh\/([^/]+)$/.exec(path);
    if (owner) {
      const row = db.owner(owner[1] ?? '');
      return row === null ? this.notFound(path) : this.view(ownerPage(ctx, db, row), path);
    }
    return this.notFound(path);
  }

  private asset(path: string): Answer {
    const m = /^\/assets\/([0-9a-f]{10})\/([a-z0-9.-]+)$/.exec(path);
    const a = m ? this.assets.get(m[2] ?? '') : undefined;
    if (!a || a.hash !== m?.[1]) return this.notFound(path);
    return { status: 200, type: a.type, body: a.body, cache: CACHE.asset };
  }

  /** Tags for quick search: exact matches first, then prefixes, by how many items they have. */
  tagsFor(q: string): TagTerm[] {
    const m = /^(lang|license|topic|kind|status):(.*)$/i.exec(q.trim());
    const ns = m?.[1]?.toLowerCase() ?? null;
    const s = slugify(m ? (m[2] ?? '') : q);
    if (s === '') return [];
    const out: TagTerm[] = [];
    const seen = new Set<string>();
    const add = (t: TagTerm): void => {
      const k = `${t.ns}:${t.slug}`;
      if (!seen.has(k) && out.length < 3) {
        seen.add(k);
        out.push(t);
      }
    };
    const kinds = this.ctx.meta.coverage.itemsByKind;
    for (const k of ITEM_KINDS) {
      if ((ns === null || ns === 'kind') && k === s) add({ ns: 'kind', slug: k, label: k, itemCount: kinds[k] ?? 0 });
    }
    for (const n of ['lang', 'topic', 'license']) {
      if (ns !== null && ns !== n) continue;
      const t = this.ctx.termBySlug.get(`${n}:${s}`);
      if (t) add(t);
    }
    for (const t of this.termsByCount) {
      if (out.length >= 3) break;
      if ((ns === null || t.ns === ns) && t.slug.startsWith(s)) add(t);
    }
    return out;
  }

  private quick(raw: string | null): Answer {
    const q = (raw ?? '').trim();
    if (q.length < 2 || q.length > 64) {
      return { status: 400, type: TYPES.json, body: JSON.stringify({ error: 'q must be 2 to 64 characters' }), cache: CACHE.quick };
    }
    const answer = quick(this.db, q, this.ctx.listById, (s) => this.tagsFor(s));
    return { status: 200, type: TYPES.json, body: JSON.stringify(answer), cache: CACHE.quick };
  }
}
