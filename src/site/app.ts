// The site: every route, from a Request to a Response. The Worker (worker.ts) and `pnpm serve` (server.ts)
// only adapt their platform to this. Static files (assets, sitemaps, robots.txt, /_data/) are served before it.
import { canonicalUrl } from '../canonical.js';
import { ITEM_KINDS } from '../enums.js';
import { CACHE, SITE_NAME } from './config.js';
import type { Sql } from './data.js';
import { Db, type Base } from './db.js';
import { FacetIndex } from './facets.js';
import { decodeFacets } from './facets-file.js';
import { etagOf, matches, notModified, reply, TYPES, type Answer } from './http.js';
import { keyOfPath, shortHashOf, slugify } from './keys.js';
import { parseItemsQuery, parseListsQuery, tidyQ } from './query.js';
import { quick, type TagTerm } from './search.js';
import { parseTerms, type Terms } from './terms.js';
import { aboutPage } from './views/about.js';
import type { Ctx } from './views/context.js';
import { homePage } from './views/home.js';
import { itemPage } from './views/item.js';
import { itemsPage } from './views/items.js';
import { listPage } from './views/list.js';
import { listsPage } from './views/lists.js';
import { notFoundPage } from './views/notfound.js';
import { ownerPage } from './views/owner.js';
import type { ViewResult } from './views/result.js';
import { searchPage } from './views/search.js';

export interface AppOptions {
  /** The database for one request (D1 gives each request its own session). */
  sql: () => Sql;
  /** A static file that ships with the site, by path (/_data/facets.bin, /_data/terms.json). */
  loadAsset: (path: string) => Promise<Response>;
  origin: string;
  /** The build this code was deployed with. Without it, the database's own build id is used. */
  buildId?: string;
  siteName?: string;
}

export type Handler = (req: Request) => Promise<Response>;

const html = (status: number, body: string, cache: string = CACHE.html): Answer => ({ status, type: TYPES.html, body, cache });
const moved = (location: string, status: 301 | 302 = 301): Answer => ({
  status,
  type: TYPES.text,
  body: `See ${location}\n`,
  cache: CACHE.html,
  location,
});
const text = (status: number, body: string, cache: string): Answer => ({ status, type: TYPES.text, body, cache });

export function ctxOf(base: Base, origin: string, siteName: string): Ctx {
  const { meta, lists, categories } = base;
  const dataDay = Math.floor(Date.parse(meta.dataFinished) / 86_400_000);
  return {
    siteName,
    origin: origin.replace(/\/+$/, ''),
    meta,
    dataDay: Number.isNaN(dataDay) ? 0 : dataDay,
    assets: meta.assets,
    lists,
    listById: new Map(lists.map((l) => [l.id, l])),
    listBySlug: new Map(lists.map((l) => [l.slug, l])),
    categories,
    categoryById: new Map(categories.map((c) => [c.id, c])),
    categoryBySlug: new Map(categories.map((c) => [c.slug, c])),
  };
}

/** A value made once, on first use; a failure is forgotten so the next request tries again. */
function once<T>(make: () => Promise<T>): () => Promise<T> {
  let p: Promise<T> | null = null;
  return () => {
    p ??= make().catch((e: unknown) => {
      p = null;
      throw e;
    });
    return p;
  };
}

/** Tags for quick search: exact matches first, then prefixes, by how many items they have. */
export function tagsFor(ctx: Ctx, terms: Terms, q: string): TagTerm[] {
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
  const kinds = ctx.meta.coverage.itemsByKind;
  for (const k of ITEM_KINDS) {
    if ((ns === null || ns === 'kind') && k === s) add({ ns: 'kind', slug: k, label: k, itemCount: kinds[k] ?? 0 });
  }
  for (const n of ['lang', 'topic', 'license']) {
    if (ns !== null && ns !== n) continue;
    const t = terms.bySlug.get(`${n}:${s}`);
    if (t) add(t);
  }
  for (const t of terms.byCount) {
    if (out.length >= 3) break;
    if ((ns === null || t.ns === ns) && t.slug.startsWith(s)) add(t);
  }
  return out;
}

/** The keys an item with this canonical address may have: its repository's, or the hash of the address. */
async function keysOfUrl(id: string): Promise<string[]> {
  const keys = [`item/${await shortHashOf(id)}`];
  const gh = /^https:\/\/github\.com\/([^/]+\/[^/]+)$/.exec(id);
  if (gh) keys.push(`gh/${(gh[1] ?? '').toLowerCase()}`);
  return keys;
}

export function createApp(options: AppOptions): Handler {
  const siteName = options.siteName ?? SITE_NAME;
  const base = once(async () => ctxOf(await new Db(options.sql()).base(), options.origin, siteName));
  const asset = async (path: string): Promise<Response> => {
    const r = await options.loadAsset(path);
    if (!r.ok) throw new Error(`${path}: ${r.status}`);
    return r;
  };
  const terms = once(async () => parseTerms(await (await asset('/_data/terms.json')).text()));
  const facets = once(async () => {
    const [ctx, t, bin] = await Promise.all([base(), terms(), asset('/_data/facets.bin').then((r) => r.arrayBuffer())]);
    return new FacetIndex(decodeFacets(bin), ctx.lists, t.maxId, ctx.categories.length);
  });

  async function notFound(ctx: Ctx, db: Db, path: string): Promise<Answer> {
    return html(404, await notFoundPage(ctx, db, path), CACHE.notFound);
  }

  async function view(ctx: Ctx, db: Db, result: Promise<ViewResult>, path: string): Promise<Answer> {
    const r = await result;
    if (r === null) return notFound(ctx, db, path);
    if (r.kind === 'redirect') return moved(r.location, r.status);
    return html(200, r.html);
  }

  async function route(url: URL, db: Db): Promise<Answer> {
    const path = url.pathname;
    const params = url.searchParams;

    // Canonical form: no trailing slash, no upper case. Nothing is read for these.
    if (path.length > 1 && path.endsWith('/')) return moved(`${path.replace(/\/+$/, '') || '/'}${url.search}`);
    if (path !== path.toLowerCase()) return moved(`${path.toLowerCase()}${url.search}`);

    const ctx = await base();
    switch (path) {
      case '/':
        return view(ctx, db, homePage(ctx, db), path);
      case '/lists': {
        const q = parseListsQuery(params);
        return q === null ? notFound(ctx, db, path) : view(ctx, db, listsPage(ctx, db, q), path);
      }
      case '/items': {
        const q = parseItemsQuery(params);
        if (q === null) return notFound(ctx, db, path);
        const [f, t] = await Promise.all([facets(), terms()]);
        return view(ctx, db, itemsPage(ctx, db, f, t, q), path);
      }
      case '/item': {
        const c = canonicalUrl(params.get('url') ?? '');
        const item = c === null ? null : await db.itemByUrl(c.id, await keysOfUrl(c.id));
        return item === null ? notFound(ctx, db, path) : moved(`/${item.key}`);
      }
      case '/search':
        return view(ctx, db, searchPage(ctx, db, tidyQ(params.get('q'))), path);
      case '/about':
        return view(ctx, db, Promise.resolve(aboutPage(ctx)), path);
      case '/api/quick': {
        const q = (params.get('q') ?? '').trim();
        if (q.length < 2 || q.length > 64) {
          return { status: 400, type: TYPES.json, body: JSON.stringify({ error: 'q must be 2 to 64 characters' }), cache: CACHE.quick };
        }
        const t = await terms();
        const answer = await quick(db, q, ctx.listById, (s) => tagsFor(ctx, t, s));
        return { status: 200, type: TYPES.json, body: JSON.stringify(answer), cache: CACHE.quick };
      }
      default:
        break;
    }

    const list = /^\/lists\/([^/]+\/[^/]+)$/.exec(path);
    if (list) {
      const row = ctx.listBySlug.get(list[1] ?? '');
      if (row) return view(ctx, db, listPage(ctx, db, row), path);
      const to = await db.redirect(path);
      return to === null ? notFound(ctx, db, path) : moved(to);
    }

    const key = keyOfPath(path);
    if (key !== null) {
      const item = await db.itemByKey(key);
      if (item) return view(ctx, db, itemPage(ctx, db, item), path);
      const to = await db.redirect(path);
      return to === null ? notFound(ctx, db, path) : moved(to);
    }

    const owner = /^\/gh\/([^/]+)$/.exec(path);
    if (owner) {
      const row = await db.owner(owner[1] ?? '');
      return row === null ? notFound(ctx, db, path) : view(ctx, db, ownerPage(ctx, db, row), path);
    }
    return notFound(ctx, db, path);
  }

  return async (req) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return reply(req, text(405, 'Method not allowed\n', 'no-store'), null);
    }
    let url: URL;
    try {
      url = new URL(req.url);
    } catch {
      return reply(req, text(400, 'Bad request\n', 'no-store'), null);
    }
    try {
      const db = new Db(options.sql());
      if (url.pathname === '/healthz') {
        const live = await db.buildId();
        const want = options.buildId ?? live;
        return reply(req, live === want ? text(200, `ok ${live}\n`, CACHE.health) : text(503, `stale: the database is ${live}, the code ${want}\n`, CACHE.health), null);
      }
      const etag = etagOf(options.buildId ?? (await base()).meta.buildId);
      if (matches(req, etag)) {
        return url.pathname === '/api/quick' ? notModified(etag, TYPES.json, CACHE.quick) : notModified(etag, TYPES.html, CACHE.html);
      }
      return reply(req, await route(url, db), etag);
    } catch (e) {
      console.error(e);
      return reply(req, text(500, 'Something went wrong\n', 'no-store'), null);
    }
  };
}
