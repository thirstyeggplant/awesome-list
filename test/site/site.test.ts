import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { gunzipSync } from 'node:zlib';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { ITEM_KINDS, REPO_STATUSES } from '../../src/model.js';
import type { Reply } from '../../src/site/http.js';
import { shortHash } from '../../src/site/keys.js';
import { EMPTY_ITEMS, IN_STEPS, STAR_STEPS, type ItemsQuery } from '../../src/site/query.js';
import type { Site } from '../../src/site/router.js';
import * as search from '../../src/site/search.js';
import { resolveFilters } from '../../src/site/views/items.js';
import { makeFixture, restore, siteOf, type Fixture } from './fixture.js';

let fixture: Fixture;
let site: Site;

beforeAll(async () => {
  fixture = await makeFixture();
  site = siteOf(fixture);
});

afterAll(() => {
  site.close();
  restore(fixture);
});

function get(url: string, headers: Record<string, string> = {}): Reply {
  return site.respond({ method: 'GET', url, headers });
}
const text = (r: Reply): string => r.body.toString('utf8');

describe('routes', () => {
  it('answers 200 on every route', () => {
    const css = /href="(\/assets\/[0-9a-f]{10}\/site\.css)"/.exec(text(get('/')))?.[1] ?? '';
    const paths = [
      '/', '/lists', '/lists?category=tools', '/lists/alpha/awesome-widgets', '/lists/gamma/awesome-broken', '/items',
      '/items?lang=go&stars=1000', '/items?q=rocket', '/items?topic=cli&topic=web&sort=name&page=1', '/gh/acme/rocket',
      `/item/${shortHash('https://example.com/hostile')}`, '/gh/acme', '/gh/alpha', '/search?q=rocket', '/search', '/about',
      '/api/quick?q=ro', '/sitemap.xml', '/sitemaps/pages.xml', '/sitemaps/lists.xml', '/sitemaps/owners.xml',
      '/sitemaps/items-1.xml', '/robots.txt', '/healthz', css,
    ];
    for (const p of paths) expect(get(p).status, p).toBe(200);
  });

  it('puts the list\'s own GitHub link before any other outbound link', () => {
    const body = text(get('/lists/alpha/awesome-widgets'));
    const main = body.slice(body.indexOf('<body'));
    const outbound = [...main.matchAll(/<a href="(https?:[^"]*)"/g)].map((m) => m[1]);
    expect(outbound[0]).toBe('https://github.com/alpha/awesome-widgets');
    expect(outbound.length).toBeGreaterThan(2);
    expect(body).toContain('data-depth');
    expect(body).toContain('Read at commit abcdef0');
  });

  it('says why an unparsed list has no entries', () => {
    expect(text(get('/lists/gamma/awesome-broken'))).toContain(
      "We could not read this list's entries yet (the readme is in reStructuredText)."
,
    );
  });

  it('escapes hostile names and drops javascript: addresses', () => {
    for (const p of ['/lists/delta/awesome-hostile', '/lists/alpha/awesome-widgets', `/item/${shortHash('https://example.com/hostile')}`, '/lists', '/']) {
      const body = text(get(p));
      expect(body, p).not.toContain('<script>alert');
      expect(body, p).not.toContain('<img src=x');
      expect(body, p).not.toMatch(/javascript:/i);
      expect(body, p).not.toContain('"><script>x');
    }
    expect(text(get('/lists/delta/awesome-hostile'))).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(text(get('/lists/alpha/awesome-widgets'))).toContain('href="https://example.com/source"');
  });

  it('answers 404 with suggestions', () => {
    for (const p of ['/nope', '/items?kind=banana', '/items?lang=cobol', '/items?list=no/such', '/lists/no/such', '/gh/nobody', '/gh/nobody/nothing', '/item/0000000000', '/sitemaps/items-9.xml', '/item?url=https://example.com/unknown']) {
      const r = get(p);
      expect(r.status, p).toBe(404);
      expect(r.headers['Cache-Control']).toBe('public, max-age=60');
    }
    const body = text(get('/rocket'));
    expect(body).toContain('Nothing at this address');
    expect(body).toContain('value="rocket"');
    expect(body).toContain('href="/gh/acme/rocket"');
  });

  it('answers 301 for renames, case and a trailing slash, keeping the query', () => {
    const cases: [string, string][] = [
      ['/gh/acme/old-rocket', '/gh/acme/rocket'],
      ['/lists/beta/old-gadgets', '/lists/beta/awesome-gadgets'],
      ['/Lists?Q=x', '/lists?Q=x'],
      ['/gh/Acme/Rocket', '/gh/acme/rocket'],
      ['/items/', '/items'],
      ['/lists/alpha/awesome-widgets/?x=1', '/lists/alpha/awesome-widgets?x=1'],
      ['/item?url=https://www.GitHub.com/Acme/Rocket/', '/gh/acme/rocket'],
      ['/item?url=https://example.com/hostile/?utm_source=x', `/item/${shortHash('https://example.com/hostile')}`],
    ];
    for (const [from, to] of cases) {
      const r = get(from);
      expect(r.status, from).toBe(301);
      expect(r.headers.Location, from).toBe(to);
    }
  });

  it('turns ns:value in a search into filters with a 302', () => {
    const r = get('/search?q=lang:Go+rocket+topic:cli');
    expect(r.status).toBe(302);
    expect(r.headers.Location).toBe('/items?q=rocket&lang=go&topic=cli');
  });

  it('answers 304 to the ETag, gzips, and sends the headers', () => {
    const r = get('/lists');
    const etag = r.headers.ETag ?? '';
    expect(etag).toMatch(/^W\/"[0-9a-f]{16}"$/);
    expect(r.headers['Content-Security-Policy']).toBe("default-src 'self'");
    expect(r.headers['X-Content-Type-Options']).toBe('nosniff');
    expect(r.headers['Cache-Control']).toBe('public, max-age=300, s-maxage=86400, stale-while-revalidate=604800');
    const again = get('/lists', { 'if-none-match': etag });
    expect(again.status).toBe(304);
    expect(again.body.length).toBe(0);
    const gz = get('/lists', { 'accept-encoding': 'gzip, br' });
    expect(gz.headers['Content-Encoding']).toBe('gzip');
    expect(gz.headers.Vary).toBe('Accept-Encoding');
    expect(gunzipSync(gz.body).toString()).toBe(text(r));
    expect(get('/healthz').headers['Cache-Control']).toBe('no-store');
    expect(get('/healthz', { 'if-none-match': etag }).status).toBe(200);
  });

  it('writes no inline script or style', () => {
    for (const p of ['/', '/lists/alpha/awesome-widgets', '/items', '/gh/acme/rocket', '/search?q=rocket']) {
      const body = text(get(p));
      expect(body, p).not.toMatch(/<script(?![^>]*\ssrc=)/);
      expect(body, p).not.toMatch(/<style|<[^>]*\s(style|on[a-z]+)=/i);
    }
  });

  it('marks listing pages with q, two filters or a sort as noindex, with a canonical in the fixed order', () => {
    const noindex = (p: string): boolean => text(get(p)).includes('noindex,follow');
    expect(noindex('/items?lang=go')).toBe(false);
    expect(noindex('/items?lang=go&kind=repo')).toBe(true);
    expect(noindex('/items?q=x')).toBe(true);
    expect(noindex('/items?sort=stars')).toBe(true);
    expect(text(get('/items?stars=100&lang=go&x=1'))).toContain('<link rel="canonical" href="https://example.test/items?lang=go&amp;stars=100">');
  });

  it('answers quick search as JSON', () => {
    const body = JSON.parse(text(get('/api/quick?q=rock'))) as search.QuickAnswer;
    expect(body.items[0]).toMatchObject({ name: 'Rocket', key: 'gh/acme/rocket', kind: 'repo', lists: 2 });
    expect(get('/api/quick?q=r').status).toBe(400);
    const tags = JSON.parse(text(get('/api/quick?q=cli'))) as search.QuickAnswer;
    expect(tags.tags[0]).toMatchObject({ label: 'topic:cli', href: '/items?topic=cli' });
  });
});

describe('sitemaps', () => {
  it('lists indexable items, split by the chunk size', () => {
    const small = siteOf(fixture, { sitemapChunk: 10 });
    try {
      const db = new DatabaseSync(fixture.dbPath, { readOnly: true });
      const row = db.prepare('SELECT COUNT(*) AS n FROM item WHERE indexable = 1').get() as { n: number };
      const all = db.prepare('SELECT COUNT(*) AS n FROM item').get() as { n: number };
      db.close();
      expect(row.n).toBeLessThan(all.n);
      const files = Math.ceil(row.n / 10);
      const index = small.respond({ method: 'GET', url: '/sitemap.xml', headers: {} }).body.toString();
      expect([...index.matchAll(/<sitemap>/g)]).toHaveLength(3 + files);
      let urls = 0;
      for (let n = 1; n <= files; n++) {
        const body = small.respond({ method: 'GET', url: `/sitemaps/items-${n}.xml`, headers: {} }).body.toString();
        urls += [...body.matchAll(/<url>/g)].length;
        expect(body).toContain('<lastmod>2026-06-02</lastmod>');
      }
      expect(urls).toBe(row.n);
      expect(small.respond({ method: 'GET', url: `/sitemaps/items-${files + 1}.xml`, headers: {} }).status).toBe(404);
      const robots = small.respond({ method: 'GET', url: '/robots.txt', headers: {} }).body.toString();
      expect(robots).toContain('Disallow: /api/');
      expect(robots).toContain('Sitemap: https://example.test/sitemap.xml');
    } finally {
      small.close();
    }
  });
});

describe('facets', () => {
  const db = (): DatabaseSync => new DatabaseSync(fixture.dbPath, { readOnly: true });

  /** Counts by brute force in SQL: items passing every filter but `except`, and matching `extra`. */
  function brute(d: DatabaseSync, q: ItemsQuery, except: string | null, extra: string | null, params: (string | number)[] = []): number {
    const where: string[] = [];
    const args: (string | number)[] = [];
    const term = (ns: string, slug: string): number =>
      (d.prepare('SELECT id FROM term WHERE ns = ? AND slug = ?').get(ns, slug) as { id: number }).id;
    if (q.kind !== null && except !== 'kind') { where.push('i.kind = ?'); args.push(q.kind); }
    if (q.status !== null && except !== 'status') { where.push('i.status = ?'); args.push(q.status); }
    if (q.lang !== null && except !== 'lang') { where.push('i.lang_id = ?'); args.push(term('lang', q.lang)); }
    if (q.license !== null && except !== 'license') { where.push('i.license_id = ?'); args.push(term('license', q.license)); }
    if (except !== 'topic') for (const t of q.topic) { where.push('EXISTS (SELECT 1 FROM item_topic x WHERE x.item_id = i.id AND x.term_id = ?)'); args.push(term('topic', t)); }
    if (q.list !== null && except !== 'list') { where.push('EXISTS (SELECT 1 FROM listing l JOIN list s ON s.id = l.list_id WHERE l.item_id = i.id AND s.slug = ?)'); args.push(q.list); }
    if (q.category !== null && except !== 'category') { where.push('EXISTS (SELECT 1 FROM listing l JOIN list s ON s.id = l.list_id JOIN category c ON c.id = s.category_id WHERE l.item_id = i.id AND c.slug = ?)'); args.push(q.category); }
    if (q.owner !== null) { where.push('i.owner = ?'); args.push(q.owner); }
    if (q.stars !== null && except !== 'stars') { where.push('i.stars >= ?'); args.push(q.stars); }
    if (q.in !== null && except !== 'in') { where.push('i.list_count >= ?'); args.push(q.in); }
    if (q.q !== null) { where.push('i.id IN (SELECT rowid FROM item_fts WHERE item_fts MATCH ?)'); args.push(search.ftsQuery(q.q) ?? ''); }
    if (extra !== null) { where.push(extra); args.push(...params); }
    const sql = `SELECT COUNT(*) AS n FROM item i ${where.length ? `WHERE ${where.join(' AND ')}` : ''}`;
    return (d.prepare(sql).get(...args) as { n: number }).n;
  }

  const queries: Partial<ItemsQuery>[] = [
    {},
    { lang: 'go' },
    { lang: 'go', stars: 1000 },
    { kind: 'repo', status: 'active', topic: ['cli'] },
    { topic: ['cli', 'web'], license: 'mit', in: 2 },
    { list: 'beta/awesome-gadgets', category: 'tools', lang: 'rust' },
    { owner: 'own3', status: 'quiet' },
    { q: 'project', stars: 100, lang: 'cplusplus' },
    { category: 'languages', kind: 'site' },
  ];

  it('counts what choosing another value would give, as brute force does', () => {
    const d = db();
    try {
      const terms = d.prepare('SELECT id, ns, slug FROM term').all() as { id: number; ns: string; slug: string }[];
      const lists = d.prepare('SELECT id, slug FROM list').all() as { id: number; slug: string }[];
      const cats = d.prepare('SELECT id, slug FROM category').all() as { id: number; slug: string }[];
      for (const partial of queries) {
        const q: ItemsQuery = { ...EMPTY_ITEMS, ...partial };
        const f = resolveFilters(site.ctx, site.db, site.facets, q);
        expect(f, JSON.stringify(partial)).not.toBeNull();
        if (f === null) continue;
        const r = site.facets.run(f, q.q ? 'relevance' : 'lists', 1, 50);
        const label = JSON.stringify(partial);
        expect(r.total, label).toBe(brute(d, q, null, null));
        ITEM_KINDS.forEach((k, i) => { expect(r.counts.kind[i], `${label} kind ${k}`).toBe(brute(d, q, 'kind', 'i.kind = ?', [k])); });
        REPO_STATUSES.forEach((s, i) => { expect(r.counts.status[i + 1], `${label} status ${s}`).toBe(brute(d, q, 'status', 'i.status = ?', [s])); });
        for (const t of terms) {
          const col = t.ns === 'lang' ? 'i.lang_id = ?' : t.ns === 'license' ? 'i.license_id = ?' : 'EXISTS (SELECT 1 FROM item_topic x WHERE x.item_id = i.id AND x.term_id = ?)';
          const counts = t.ns === 'lang' ? r.counts.lang : t.ns === 'license' ? r.counts.license : r.counts.topic;
          expect(counts[t.id], `${label} ${t.ns}:${t.slug}`).toBe(brute(d, q, t.ns, col, [t.id]));
        }
        for (const l of lists) {
          expect(r.counts.list[l.id], `${label} list ${l.slug}`).toBe(brute(d, q, 'list', 'EXISTS (SELECT 1 FROM listing l WHERE l.item_id = i.id AND l.list_id = ?)', [l.id]));
        }
        for (const c of cats) {
          expect(r.counts.category[c.id], `${label} category ${c.slug}`).toBe(
            brute(d, q, 'category', 'EXISTS (SELECT 1 FROM listing l JOIN list s ON s.id = l.list_id WHERE l.item_id = i.id AND s.category_id = ?)', [c.id]),
          );
        }
        STAR_STEPS.forEach((s, i) => { expect(r.counts.stars[i], `${label} stars ${s}`).toBe(brute(d, q, 'stars', 'i.stars >= ?', [s])); });
        IN_STEPS.forEach((s, i) => { expect(r.counts.in[i], `${label} in ${s}`).toBe(brute(d, q, 'in', 'i.list_count >= ?', [s])); });
      }
    } finally {
      d.close();
    }
  });

  it('pages in the chosen order', () => {
    const f = resolveFilters(site.ctx, site.db, site.facets, EMPTY_ITEMS);
    if (f === null) throw new Error('no filters');
    const first = site.facets.run(f, 'lists', 1, 5);
    const second = site.facets.run(f, 'lists', 2, 5);
    expect(first.ids).toEqual([1, 2, 3, 4, 5]);
    expect(second.ids).toEqual([6, 7, 8, 9, 10]);
    const byStars = site.facets.run(f, 'stars', 1, 50).ids;
    const stars = site.db.itemsByIds(byStars).map((i) => i.stars ?? -1);
    expect(stars).toEqual([...stars].sort((a, b) => b - a));
  });

  it('stops paging at 200', () => {
    expect(text(get('/items?page=201'))).toContain('Paging stops at page 200');
  });
});

describe('ranking', () => {
  it('orders items by lists, then stars, then name', () => {
    const items = site.db.itemsByIds(Array.from({ length: 60 }, (_, i) => i + 1));
    for (let i = 1; i < items.length; i++) {
      const a = items[i - 1];
      const b = items[i];
      if (!a || !b) continue;
      expect(a.listCount >= b.listCount).toBe(true);
      if (a.listCount === b.listCount) expect((a.stars ?? -1) >= (b.stars ?? -1)).toBe(true);
    }
  });

  it('puts an exact name first and a name match before a section match', () => {
    const ids = search.itemIds(site.db, 'rocket', 10);
    const names = site.db.itemsByIds(ids).map((i) => i.name);
    expect(names[0]).toBe('Rocket');
    // The paper names rockets in its own name; the rest only in sections or lists.
    expect(names.indexOf('A paper about rockets')).toBeGreaterThan(0);
  });

  it('keeps c++ apart from c', () => {
    const names = site.db.itemsByIds(search.itemIds(site.db, 'c++', 10)).map((i) => i.name);
    expect(names).toContain('c++ tool');
    expect(names).not.toContain('c tool');
    for (const hostile of ['"', '""', '*', 'a"b', 'NEAR(', '-x', 'AND', '(', ')', ':', 'name:x', '^']) {
      expect(() => search.itemIds(site.db, hostile, 10)).not.toThrow();
      expect(get(`/search?q=${encodeURIComponent(hostile)}`).status).toBe(200);
    }
  });
});

describe('the build', () => {
  it('never opens private/', () => {
    // makeFixture made private/ unreadable and the build still ran; the site code never names it.
    const dir = join(import.meta.dirname, '../../src/site');
    const files = (d: string): string[] =>
      readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? files(join(d, f)) : [join(d, f)]));
    for (const f of files(dir)) expect(readFileSync(f, 'utf8'), f).not.toMatch(/private\//);
  });
});
