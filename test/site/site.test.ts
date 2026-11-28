import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ITEM_KINDS, REPO_STATUSES } from '../../src/model.js';
import { createApp, ctxOf } from '../../src/site/app.js';
import { shortHash } from '../../src/site/build/item-keys.js';
import { D1_STATEMENT_LIMIT, LoadWriter, literal, splitStatements } from '../../src/site/build/sql.js';
import type { Sql } from '../../src/site/data.js';
import { Db } from '../../src/site/db.js';
import { FacetIndex } from '../../src/site/facets.js';
import { decodeFacets } from '../../src/site/facets-file.js';
import { EMPTY_ITEMS, IN_STEPS, STAR_STEPS, type ItemsQuery } from '../../src/site/query.js';
import * as search from '../../src/site/search.js';
import { parseTerms, type Terms } from '../../src/site/terms.js';
import type { Ctx } from '../../src/site/views/context.js';
import { resolveFilters } from '../../src/site/views/items.js';
import { makeFixture, ORIGIN, restore, type Fixture } from './fixture.js';

let fixture: Fixture;
let db: Db;
let ctx: Ctx;
let terms: Terms;
let facets: FacetIndex;

const filesIn = (d: string): string[] =>
  readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? filesIn(join(d, f)) : [join(d, f)]));

beforeAll(async () => {
  fixture = await makeFixture();
  db = new Db(fixture.sql);
  ctx = ctxOf(await db.base(), ORIGIN, 'Shelf');
  terms = parseTerms(readFileSync(join(fixture.build.paths.assets, '_data/terms.json'), 'utf8'));
  const bin = readFileSync(join(fixture.build.paths.assets, '_data/facets.bin'));
  const buf = bin.buffer.slice(bin.byteOffset, bin.byteOffset + bin.byteLength);
  facets = new FacetIndex(decodeFacets(buf), ctx.lists, terms.maxId, ctx.categories.length);
});

afterAll(() => {
  restore(fixture);
});

interface Got { status: number; headers: Headers; body: string }

async function get(url: string, headers: Record<string, string> = {}, f: Fixture = fixture): Promise<Got> {
  const r = await f.handler(new Request(`${ORIGIN}${url}`, { headers }));
  return { status: r.status, headers: r.headers, body: await r.text() };
}
const body = async (url: string): Promise<string> => (await get(url)).body;
const cssPath = async (): Promise<string> => /href="(\/assets\/[0-9a-f]{10}\/site\.css)"/.exec(await body('/'))?.[1] ?? '';

describe('routes', () => {
  it('answers 200 on every route', async () => {
    const css = await cssPath();
    expect(css).not.toBe('');
    const paths = [
      '/', '/lists', '/lists?category=tools', '/lists/alpha/awesome-widgets', '/lists/gamma/awesome-broken', '/items',
      '/items?lang=go&stars=1000', '/items?q=rocket', '/items?topic=cli&topic=web&sort=name&page=1', '/gh/acme/rocket',
      `/item/${shortHash('https://example.com/hostile')}`, '/gh/acme', '/gh/alpha', '/search?q=rocket', '/search', '/about',
      '/api/quick?q=ro', '/sitemap.xml', '/sitemaps/pages.xml', '/sitemaps/lists-en.xml', '/sitemaps/owners.xml',
      '/sitemaps/items-1.xml', '/robots.txt', '/healthz', css, '/_data/facets.bin', '/_data/terms.json',
    ];
    for (const p of paths) expect((await get(p)).status, p).toBe(200);
  });

  it("puts the list's own GitHub link before any other outbound link", async () => {
    const page = await body('/lists/alpha/awesome-widgets');
    const main = page.slice(page.indexOf('<body'));
    const outbound = [...main.matchAll(/<a href="(https?:[^"]*)"/g)].map((m) => m[1]);
    expect(outbound[0]).toBe('https://github.com/alpha/awesome-widgets');
    expect(outbound.length).toBeGreaterThan(2);
    expect(page).toContain('data-depth');
    expect(page).toContain('Read at commit abcdef0');
  });

  it('says why an unparsed list has no entries', async () => {
    expect(await body('/lists/gamma/awesome-broken')).toContain(
      'We could not read this list&#39;s entries yet (the readme is in reStructuredText).',
    );
  });

  it('makes the item and owner pages from the stored listings, alongside and tags', async () => {
    const page = await body('/gh/acme/rocket');
    expect(page).toContain('Which awesome lists name <span translate="no">Rocket</span>?');
    // The lede says what it is and which lists name it, from facts; the answer under the question says what GitHub says.
    expect(page).toMatch(/<p class="lede"><span translate="no">Rocket<\/span> is a <a href="\/items\?lang=go" translate="no">Go<\/a> repository by <a href="\/gh\/acme" translate="no">Acme<\/a> on GitHub with 5,000 stars\./);
    expect(page).toContain('Is <span translate="no">Rocket</span> still maintained?');
    expect(page).toMatch(/<p class="answer">Its last push was on <time datetime="2026-06-01">Jun 1, 2026<\/time> and it is not archived, as of <time/);
    expect(page).toContain('href="/lists/alpha/awesome-widgets#launchers"');
    expect(page).not.toContain('listed as ‘rocket’'); // the same name in another case
    expect(page).not.toContain('What is listed alongside');
    expect(page).toContain('href="/items?topic=cli"');
    const along = await body('/gh/own0/proj0');
    expect(along).toContain('What is listed alongside <span translate="no">proj0</span>?');
    expect(along).toContain('The lists do not say they are alternatives.');
    expect(along).toContain('href="/gh/own4/proj4"');
    expect(page).toContain('href="/items?lang=go"><span translate="no">Go</span></a>');
    expect(await body(`/item/${shortHash('https://example.com/hostile')}`)).toContain('listed as ‘<span translate="no">Hostile</span>’');
    expect(await body('/lists/alpha/awesome-widgets')).toContain('Named by');
    // One outbound action, a breadcrumb from the list with the most stars, more from the owner, the lists' sizes.
    expect(page).toContain('<a class="btn primary" href="https://github.com/acme/rocket" rel="nofollow noopener" title="https://github.com/acme/rocket">Open on GitHub ↗</a>');
    expect(page).toMatch(/<nav class="crumbs"[^>]*><a href="\/lists">Lists<\/a>.*Widgets.*Launchers<\/a><\/nav>/);
    expect(page).not.toMatch(/<a class="chip"[^>]*><span class="ns">(lang|license|status):/);
    // Each list that names it: its name, its section path as links, then its size, all in the column.
    expect(page).toMatch(/<ol class="entries lists"><li><a href="\/lists\/[^"]+" class="serif">.*<p class="path">.*<p class="m">\d+ items/);
    // The facts of a repository: no kind or host, the owner as a link; a date is a <time>.
    expect(page).toContain('<dt>Owner</dt><dd><a href="/gh/acme"><span translate="no">Acme</span></a></dd>');
    expect(page).not.toContain('<dt>Kind</dt>');
    expect(page).not.toContain('<dt>Host</dt>');
    expect(page).toMatch(/<dt>Last push<\/dt><dd><time datetime="\d{4}-\d\d-\d\d">/);
    // A topic chip shows its label, not query syntax.
    expect(page).toContain('<a class="chip" translate="no" href="/items?topic=cli">cli</a>');
    const proj = await body('/gh/own1/proj1');
    expect(proj).toContain('More from <span translate="no">own1</span>');
    expect(proj).toContain('href="/gh/own1">All 8 projects by own1</a>');
    expect(await body(`/item/${shortHash('https://example.com/hostile')}`)).toContain('Visit example.com ↗');
    const owner = await body('/gh/own1');
    expect(owner).toContain('Their projects named by lists');
    expect(owner).toContain('href="/gh/own1/proj1"');
  });

  it('makes entries: a name, then owner, language, stars, lists from two and an old year as text', async () => {
    const page = await body('/items');
    expect(page).not.toContain('rows-head');
    const rows = page.slice(page.indexOf('<ol class="entries">'), page.indexOf('</ol>'));
    // The facts are plain text after the name, which is the only link; no chip, no link to the language.
    expect(rows).not.toContain('class="chip"');
    expect(rows).not.toContain('href="/items?lang=');
    expect(rows).toMatch(/<li><a href="\/gh\/[^"]+" translate="no">[^<]+<\/a> <span class="m">[^<]+ · Go · ★ [\d,]+/);
    expect(rows).toContain(' · in 2 lists');
    expect(rows).not.toContain('1 list<');
    // A list page has no header row and no chips; its main language is said once, not on every entry.
    const list = await body('/lists/alpha/awesome-widgets');
    expect(list).not.toContain('rows-head');
    expect(list).not.toContain('collapse-all');
    expect(list.slice(list.indexOf('id="entries"'))).not.toContain('class="chip"');
    // A list we could not read says so, not "0 items"; a category page leaves out the category.
    const lists = await body('/lists');
    expect(lists).toContain('<b class="rot rot-quiet">not read yet</b>');
    expect(lists).not.toContain('>0 items<');
    expect(lists).toContain('<ol class="entries lists"><li><a class="serif" href="/lists/');
  });

  it('makes a home page that starts somewhere: languages, the lists with the most stars, then every category', async () => {
    const page = await body('/');
    expect(ctx.meta.top.langs.map(([slug]) => slug)).toEqual(['go', 'cplusplus', 'rust']);
    expect(page).toMatch(/<ul class="run langs-run"><li><a href="\/items\?lang=go"><span translate="no">Go<\/span> <span class="n">\d+<\/span><\/a><\/li>/);
    const h2 = [...page.matchAll(/<h2[^>]*>([^<]*)</g)].map((x) => x[1]);
    expect(h2).toEqual(['Browse by language', 'Start here', 'Named by the most lists', 'All lists by category']);
    // Every category is folded, at every width, and its lists are one run of names.
    expect([...page.matchAll(/<details class="category" id="/g)]).toHaveLength(ctx.categories.length);
    expect(page).not.toContain('<details class="category" id="tools" open');
    expect(page).toContain('<ul class="run"><li><a href="/lists/');
    expect([...page.matchAll(/<h3><a href="\/lists\?category=/g)]).toHaveLength(ctx.categories.length);
    // The lists with the most stars, leaving out what could not be read.
    expect(page).toContain('<li><a class="serif" href="/lists/alpha/awesome-widgets" translate="no">Widgets</a> <span class="m mono" translate="no">alpha/awesome-widgets</span>');
    expect(page).not.toContain('class="serif" href="/lists/gamma/awesome-broken"');
    expect(page).toContain('<span class="peek" translate="no">Gadgets, awesome-broken, ');
  });

  it('says where a listing is: the one filter as its h1, the page of how many, jumps on search, an owner\'s line', async () => {
    const go = await body('/items?lang=go');
    expect(go).toMatch(/<h1>Go<\/h1>\n<p class="lede">\d+ projects named by awesome lists<\/p>/);
    // A filter that is on says what it is in words.
    expect(go).toContain('<a class="chip on" href="/items">Language: <span translate="no">Go</span><span class="x"> ×</span></a>');
    expect(await body('/lists?license=mit')).toContain('<h1>MIT</h1>');
    const search = await body('/search?q=project');
    expect(search).toMatch(/<p class="jumps"><a href="#lists">Lists <span class="n">\d+<\/span><\/a>.*<a href="#items">Items <span class="n">\d+<\/span><\/a><\/p>/);
    expect(search).toContain('<section id="items">');
    expect(await body('/gh/own1')).toContain('<p class="lede">Awesome lists name 8 projects by <span translate="no">own1</span>.</p>');
  });

  it('escapes hostile names and drops javascript: addresses', async () => {
    for (const p of ['/lists/delta/awesome-hostile', '/lists/alpha/awesome-widgets', `/item/${shortHash('https://example.com/hostile')}`, '/lists', '/']) {
      const page = await body(p);
      expect(page, p).not.toContain('<script>alert');
      expect(page, p).not.toContain('<img src=x');
      expect(page, p).not.toMatch(/javascript:/i);
      expect(page, p).not.toContain('"><script>x');
    }
    expect(await body('/lists/delta/awesome-hostile')).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(await body('/lists/alpha/awesome-widgets')).toContain('href="https://example.com/source"');
  });

  it('answers 404 with suggestions', async () => {
    const missing = [
      '/nope', '/items?kind=banana', '/items?lang=cobol', '/items?list=no/such', '/items?owner=nobody', '/lists/no/such',
      '/gh/nobody', '/gh/nobody/nothing', '/item/0000000000', '/sitemaps/items-9.xml', '/assets/0000000000/site.css',
      '/item?url=https://example.com/unknown',
    ];
    for (const p of missing) {
      const r = await get(p);
      expect(r.status, p).toBe(404);
      expect(r.headers.get('Cache-Control'), p).toBe('public, max-age=60');
    }
    const page = await body('/rocket');
    expect(page).toContain('Nothing at this address');
    expect(page).toContain('value="rocket"');
    expect(page).toContain('href="/gh/acme/rocket"');
  });

  it('answers 301 for renames, case and a trailing slash, keeping the query', async () => {
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
      const r = await get(from);
      expect(r.status, from).toBe(301);
      expect(r.headers.get('Location'), from).toBe(to);
    }
  });

  it('turns ns:value in a search into filters with a 302', async () => {
    const r = await get('/search?q=lang:Go+rocket+topic:cli');
    expect(r.status).toBe(302);
    expect(r.headers.get('Location')).toBe('/items?q=rocket&lang=go&topic=cli');
  });

  it('answers 304 to the ETag before any query, and sends the headers', async () => {
    const r = await get('/lists');
    const etag = r.headers.get('ETag') ?? '';
    expect(etag).toBe(`W/"${fixture.build.buildId}"`);
    expect(etag).toMatch(/^W\/"[0-9a-f]{12}"$/);
    expect(r.headers.get('Content-Security-Policy')).toBe("default-src 'self'");
    expect(r.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(r.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    expect(r.headers.get('Cache-Control')).toBe('public, max-age=300, s-maxage=86400, stale-while-revalidate=604800');
    expect(r.headers.get('Content-Encoding')).toBeNull();
    expect(r.headers.get('Vary')).toBeNull();
    const again = await get('/lists', { 'if-none-match': etag });
    expect(again.status).toBe(304);
    expect(again.body).toBe('');
    expect((await get('/api/quick?q=ro')).headers.get('Cache-Control')).toBe('public, max-age=3600, s-maxage=86400');

    // With the build id given, as the Worker has it, a 304 asks nothing of the database.
    let asked = 0;
    const counting: Sql = {
      all: (sql, params) => { asked++; return fixture.sql.all(sql, params); },
      first: (sql, params) => { asked++; return fixture.sql.first(sql, params); },
      batch: (queries) => { asked++; return fixture.sql.batch(queries); },
    };
    const worker = createApp({
      sql: () => counting,
      loadAsset: () => Promise.reject(new Error('no static files')),
      origin: ORIGIN,
      buildId: fixture.build.buildId,
    });
    const r304 = await worker(new Request(`${ORIGIN}/items?lang=go`, { headers: { 'if-none-match': etag } }));
    expect(r304.status).toBe(304);
    expect(r304.headers.get('Content-Security-Policy')).toBe("default-src 'self'");
    expect(asked).toBe(0);
    expect((await worker(new Request(`${ORIGIN}/`, { method: 'POST' }))).status).toBe(405);

    const health = await get('/healthz', { 'if-none-match': etag });
    expect(health.status).toBe(200);
    expect(health.headers.get('Cache-Control')).toBe('no-store');
    expect(health.body).toBe(`ok ${fixture.build.buildId}\n`);
    const stale = createApp({ sql: () => fixture.sql, loadAsset: () => Promise.reject(new Error('no')), origin: ORIGIN, buildId: '000000000000' });
    const s = await stale(new Request(`${ORIGIN}/healthz`));
    expect(s.status).toBe(503);
    expect(s.headers.get('Cache-Control')).toBe('no-store');
  });

  it('sends www to the site\'s host and plain http to https before anything else, except on this computer', async () => {
    for (const [from, to] of [
      ['http://weeklymatcha.com/', 'https://weeklymatcha.com/'],
      ['http://weeklymatcha.com/lists?category=tools&page=2', 'https://weeklymatcha.com/lists?category=tools&page=2'],
      ['http://cdn.weeklymatcha.com:80/de/gh/acme/rocket', 'https://cdn.weeklymatcha.com/de/gh/acme/rocket'],
      // www before the site's own host (ORIGIN) goes to that host, in one hop from http or https.
      ['http://www.example.test:80/de/gh/acme/rocket', 'https://example.test/de/gh/acme/rocket'],
      ['https://www.example.test/', 'https://example.test/'],
      ['https://www.example.test/items?lang=go&page=2', 'https://example.test/items?lang=go&page=2'],
    ]) {
      const r = await fixture.app(new Request(from ?? ''));
      expect(r.status, from).toBe(301);
      expect(r.headers.get('Location'), from).toBe(to);
      expect(r.headers.get('Cache-Control'), from).toBe('public, max-age=3600');
    }
    // Even a POST, which would otherwise be a 405: nothing is asked of the database first.
    expect((await fixture.app(new Request('http://weeklymatcha.com/', { method: 'POST' }))).status).toBe(301);
    for (const local of ['http://localhost:8080/lists', 'http://127.0.0.1:8080/lists', 'http://[::1]:8080/lists']) {
      expect((await fixture.app(new Request(local))).status, local).toBe(200);
    }
  });

  it('asks browsers to come back over https for a year, on every answer of the Worker and every static file', async () => {
    for (const p of ['/', '/lists', '/nope', '/api/quick?q=ro', '/healthz']) {
      expect((await get(p)).headers.get('Strict-Transport-Security'), p).toBe('max-age=31536000');
    }
    expect((await fixture.app(new Request('http://weeklymatcha.com/'))).headers.get('Strict-Transport-Security')).toBe('max-age=31536000');
    for (const p of [await cssPath(), '/robots.txt', '/favicon.ico']) {
      expect((await get(p)).headers.get('Strict-Transport-Security'), p).toBe('max-age=31536000');
    }
  });

  it('sends the static files with their own headers', async () => {
    const asset = await get(await cssPath());
    expect(asset.headers.get('Cache-Control')).toBe('public, max-age=31536000, immutable');
    expect(asset.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(asset.headers.get('Content-Type')).toBe('text/css; charset=utf-8');
    for (const p of ['/sitemap.xml', '/sitemaps/lists-en.xml', '/robots.txt']) {
      const r = await get(p);
      expect(r.headers.get('Cache-Control'), p).toBe('public, max-age=3600, s-maxage=86400');
      expect(r.headers.get('X-Content-Type-Options'), p).toBe('nosniff');
    }
    expect((await get('/_headers')).status).toBe(404);
  });

  it('writes no inline script or style', async () => {
    for (const p of ['/', '/lists/alpha/awesome-widgets', '/items', '/gh/acme/rocket', '/search?q=rocket']) {
      const page = await body(p);
      expect(page, p).not.toMatch(/<script(?![^>]*\s(src=|type="application\/ld\+json"))/);
      expect(page, p).not.toMatch(/<style|<[^>]*\s(style|on[a-z]+)=/i);
    }
  });

  it('marks listing pages with q, two filters or a sort as noindex, with a canonical in the fixed order', async () => {
    const noindex = async (p: string): Promise<boolean> => (await body(p)).includes('noindex,follow');
    expect(await noindex('/items?lang=go')).toBe(false);
    expect(await noindex('/items?lang=go&kind=repo')).toBe(true);
    expect(await noindex('/items?q=x')).toBe(true);
    expect(await noindex('/items?sort=stars')).toBe(true);
    expect(await body('/items?stars=100&lang=go&x=1')).toContain('<link rel="canonical" href="https://example.test/items?lang=go&amp;stars=100">');
  });

  it('answers quick search as JSON', async () => {
    const answer = JSON.parse(await body('/api/quick?q=rock')) as search.QuickAnswer;
    expect(answer.items[0]).toMatchObject({ name: 'Rocket', key: 'gh/acme/rocket', kind: 'repo', lists: 2 });
    expect((await get('/api/quick?q=r')).status).toBe(400);
    const tags = JSON.parse(await body('/api/quick?q=cli')) as search.QuickAnswer;
    expect(tags.tags[0]).toMatchObject({ label: 'topic:cli', href: '/items?topic=cli' });
  });
});

describe('sharing', () => {
  const unescape = (t: string): string =>
    t.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  const meta = (page: string, attr: string, name: string): string | null =>
    new RegExp(`<meta ${attr}="${name}" content="([^"]*)">`).exec(page)?.[1] ?? null;
  const shareRow = (page: string): string | null => /<div class="share"[\s\S]*?<\/ul>/.exec(page)?.[0] ?? null;
  const hrefs = (row: string): string[] => [...row.matchAll(/<a href="([^"]*)"/g)].map((m) => unescape(m[1] ?? ''));

  for (const path of ['/lists/alpha/awesome-widgets', '/gh/acme/rocket']) {
    it(`links to the services with the canonical address, encoded, on ${path}`, async () => {
      const page = await body(path);
      const canonical = /<link rel="canonical" href="([^"]*)">/.exec(page)?.[1] ?? '';
      expect(canonical).toBe(`${ORIGIN}${path}`);
      const title = unescape(meta(page, 'property', 'og:title') ?? '');
      expect(title).not.toBe('');
      const row = shareRow(page) ?? '';
      expect(row).not.toBe('');
      const u = encodeURIComponent(canonical);
      const t = encodeURIComponent(title);
      expect(hrefs(row)).toEqual([
        `https://x.com/intent/post?text=${t}&url=${u}`,
        `https://bsky.app/intent/compose?text=${encodeURIComponent(`${title} ${canonical}`)}`,
        `https://www.linkedin.com/sharing/share-offsite/?url=${u}`,
        `https://www.reddit.com/submit?url=${u}&title=${t}`,
        `https://news.ycombinator.com/submitlink?u=${u}&t=${t}`,
        `mailto:?subject=${t}&body=${u}`,
      ]);
      expect(u).toContain('https%3A%2F%2Fexample.test%2F');
      // A new tab for each service, no referrer, a name in the page's language; the buttons wait for script.
      expect(row.match(/target="_blank" rel="noopener noreferrer" aria-label="Share on [^"]+"/g)).toHaveLength(5);
      expect(row).toContain('aria-label="Share by email"');
      expect(row).toContain('<li hidden><button type="button" class="share-copy" aria-label="Copy link"');
      expect(row).toContain('<li hidden><button type="button" class="share-native" aria-label="Share…"');
      expect(page).toContain('aria-live="polite"');
      expect(row).not.toMatch(/utm_|<img|<script|style=/);
    });
  }

  it('is on the home page, an owner and one language or topic of /items, in the page’s language', async () => {
    for (const path of ['/', '/gh/acme', '/items?lang=go', '/items?topic=cli']) expect(shareRow(await body(path)), path).not.toBeNull();
    const es = await body('/es/lists/alpha/awesome-widgets');
    expect(shareRow(es)).toContain(`url=${encodeURIComponent(`${ORIGIN}/es/lists/alpha/awesome-widgets`)}`);
    expect(es).toContain('aria-label="Compartir en X"');
  });

  it('is not on search, a combination of filters, a sort or 404', async () => {
    for (const path of ['/search?q=rocket', '/search', '/items?q=rocket', '/items?lang=go&stars=1000', '/items?lang=go&sort=name', '/items', '/nope']) {
      expect(shareRow((await get(path)).body), path).toBeNull();
    }
  });

  it('keeps the CSP as it was, with no inline script on a page that shares', async () => {
    for (const path of ['/lists/alpha/awesome-widgets', '/gh/acme/rocket', '/']) {
      const r = await get(path);
      expect(r.headers.get('Content-Security-Policy')).toBe("default-src 'self'");
      expect(r.body.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '')).not.toMatch(/<script(?![^>]*\ssrc=)/);
      expect(r.body).not.toMatch(/\son[a-z]+="/);
    }
  });

  it('gives every page that shares its image and the Twitter tags', async () => {
    for (const path of ['/', '/lists/alpha/awesome-widgets', '/gh/acme/rocket', '/gh/acme', '/items?lang=go']) {
      const page = await body(path);
      expect(meta(page, 'property', 'og:image'), path).toMatch(/^https:\/\/example\.test\/assets\/[0-9a-f]{10}\/og\.png$/);
      expect(meta(page, 'property', 'og:image:alt'), path).toBe('Shelf');
      expect(meta(page, 'name', 'twitter:card'), path).toBe('summary_large_image');
      expect(meta(page, 'name', 'twitter:title'), path).toBe(meta(page, 'property', 'og:title'));
      expect(meta(page, 'name', 'twitter:description'), path).toBe(meta(page, 'property', 'og:description'));
    }
  });
});

describe('sitemaps', () => {
  it('lists indexable items, split by the chunk size', async () => {
    const small = await makeFixture({ sitemapChunk: 10 });
    try {
      const d = new DatabaseSync(small.build.paths.db, { readOnly: true });
      const row = d.prepare('SELECT COUNT(*) AS n FROM item WHERE indexable = 1').get() as { n: number };
      const all = d.prepare('SELECT COUNT(*) AS n FROM item').get() as { n: number };
      d.close();
      expect(row.n).toBeLessThan(all.n);
      const files = Math.ceil(row.n / 10);
      const index = (await get('/sitemap.xml', {}, small)).body;
      expect([...index.matchAll(/<sitemap>/g)]).toHaveLength(13 + files);
      expect(index).toContain('<loc>https://example.test/sitemaps/items-1.xml</loc>');
      let urls = 0;
      for (let n = 1; n <= files; n++) {
        const r = await get(`/sitemaps/items-${n}.xml`, {}, small);
        expect(r.status).toBe(200);
        urls += [...r.body.matchAll(/<url>/g)].length;
        expect(r.body).not.toContain('<lastmod>');
      }
      expect(urls).toBe(row.n);
      expect((await get(`/sitemaps/items-${files + 1}.xml`, {}, small)).status).toBe(404);
      const robots = (await get('/robots.txt', {}, small)).body;
      expect(robots).toContain('Disallow: /api/');
      expect(robots).toContain('Sitemap: https://example.test/sitemap.xml');
    } finally {
      restore(small);
    }
  });
});

describe('the load', () => {
  it('is statements of at most 100 KB, with no BEGIN, COMMIT or PRAGMA, that make the same database', () => {
    const text = readFileSync(fixture.build.paths.loadSql, 'utf8');
    const statements = splitStatements(text);
    expect(statements.length).toBe(fixture.build.load.statements);
    for (const s of statements) {
      expect(Buffer.byteLength(`${s};\n`)).toBeLessThanOrEqual(D1_STATEMENT_LIMIT);
      expect(s).not.toMatch(/^\s*(BEGIN|COMMIT|END|ROLLBACK|PRAGMA|SAVEPOINT|RELEASE|VACUUM|ATTACH|ANALYZE)\b/i);
      // eslint-disable-next-line no-control-regex
      expect(s).not.toMatch(/[\u0000-\u0009\u000b-\u001f]/);
    }
    // Run one statement at a time, as D1 does, it makes what the build made in one transaction.
    const d = new DatabaseSync(':memory:');
    for (const s of statements) d.exec(s);
    const count = (x: DatabaseSync, t: string): number => (x.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get() as { n: number }).n;
    const built = new DatabaseSync(fixture.build.paths.db, { readOnly: true });
    for (const t of ['meta', 'category', 'list', 'section', 'item', 'listing', 'owner', 'redirect']) {
      expect(count(d, t), t).toBe(count(built, t));
      expect(count(d, t), t).toBe(fixture.build.load.rows[t]);
    }
    const tables = (x: DatabaseSync): string[] =>
      (x.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE '%fts_%' ORDER BY name").all() as { name: string }[]).map((r) => r.name);
    expect(tables(built)).toEqual(['category', 'item', 'item_fts', 'list', 'list_fts', 'listing', 'meta', 'owner', 'redirect', 'section', 'section_fts']);
    d.close();
    built.close();
    expect(fixture.build.load.rowsWritten).toBeGreaterThan(fixture.build.load.rows.item ?? 0);
  });

  it('gathers rows into statements of at most 50 KB and writes every value as a literal', () => {
    const out: string[] = [];
    const w = new LoadWriter((t) => out.push(t));
    w.insert('t', ['a', 'b'], Array.from({ length: 5000 }, (_, i) => [i, `row ${i} ${'x'.repeat(40)}`]));
    expect(out.length).toBeGreaterThan(2);
    for (const s of out) expect(Buffer.byteLength(s)).toBeLessThanOrEqual(50_000 + 2);
    expect(w.stats.rows.t).toBe(5000);
    expect(literal("it's")).toBe("'it''s'");
    expect(literal('a\nb')).toBe("('a'||char(10)||'b')");
    expect(literal(null)).toBe('NULL');
    const d = new DatabaseSync(':memory:');
    expect((d.prepare(`SELECT ${literal("x\n'y'\u0000z")} AS v`).get() as { v: string }).v).toBe("x\n'y'\u0000z");
    d.close();
    expect(() => { w.statement(`SELECT '${'y'.repeat(D1_STATEMENT_LIMIT)}'`); }).toThrow(/over D1's limit/);
  });
});

describe('facets', () => {
  const open = (): DatabaseSync => new DatabaseSync(fixture.build.paths.db, { readOnly: true });
  const TOPIC = "EXISTS (SELECT 1 FROM json_each(i.tags, '$.topics') x WHERE json_extract(x.value, '$[0]') = ?)";
  const LANG = "json_extract(i.tags, '$.lang[0]') = ?";
  const LICENSE = "json_extract(i.tags, '$.license[0]') = ?";

  /** Counts by brute force in SQL over the JSON columns: items passing every filter but `except`, and matching `extra`. */
  function brute(d: DatabaseSync, q: ItemsQuery, except: string | null, extra: string | null, params: (string | number)[] = []): number {
    const where: string[] = [];
    const args: (string | number)[] = [];
    const listed = "json_each(i.listed) x JOIN list s ON s.id = json_extract(x.value, '$[0]')";
    if (q.kind !== null && except !== 'kind') { where.push('i.kind = ?'); args.push(q.kind); }
    if (q.status !== null && except !== 'status') { where.push('i.status = ?'); args.push(q.status); }
    if (q.lang !== null && except !== 'lang') { where.push(LANG); args.push(q.lang); }
    if (q.license !== null && except !== 'license') { where.push(LICENSE); args.push(q.license); }
    if (except !== 'topic') for (const t of q.topic) { where.push(TOPIC); args.push(t); }
    if (q.list !== null && except !== 'list') { where.push(`EXISTS (SELECT 1 FROM ${listed} WHERE s.slug = ?)`); args.push(q.list); }
    if (q.category !== null && except !== 'category') {
      where.push(`EXISTS (SELECT 1 FROM ${listed} JOIN category c ON c.id = s.category_id WHERE c.slug = ?)`);
      args.push(q.category);
    }
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

  it('counts what choosing another value would give, as brute force does', async () => {
    const d = open();
    try {
      const lists = d.prepare('SELECT id, slug FROM list').all() as { id: number; slug: string }[];
      const cats = d.prepare('SELECT id, slug FROM category').all() as { id: number; slug: string }[];
      for (const partial of queries) {
        const q: ItemsQuery = { ...EMPTY_ITEMS, ...partial };
        const label = JSON.stringify(partial);
        const f = await resolveFilters(ctx, db, facets, terms, q);
        expect(f, label).not.toBeNull();
        if (f === null) continue;
        const r = facets.run(f, q.q ? 'relevance' : 'lists', 1, 50);
        expect(r.total, label).toBe(brute(d, q, null, null));
        ITEM_KINDS.forEach((k, i) => { expect(r.counts.kind[i], `${label} kind ${k}`).toBe(brute(d, q, 'kind', 'i.kind = ?', [k])); });
        REPO_STATUSES.forEach((s, i) => { expect(r.counts.status[i + 1], `${label} status ${s}`).toBe(brute(d, q, 'status', 'i.status = ?', [s])); });
        for (const t of terms.byId.values()) {
          const col = t.ns === 'lang' ? LANG : t.ns === 'license' ? LICENSE : TOPIC;
          const counts = t.ns === 'lang' ? r.counts.lang : t.ns === 'license' ? r.counts.license : r.counts.topic;
          expect(counts[t.id], `${label} ${t.ns}:${t.slug}`).toBe(brute(d, q, t.ns, col, [t.slug]));
        }
        for (const l of lists) {
          expect(r.counts.list[l.id], `${label} list ${l.slug}`).toBe(
            brute(d, q, 'list', 'EXISTS (SELECT 1 FROM listing l WHERE l.item_id = i.id AND l.list_id = ?)', [l.id]),
          );
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

  it('pages in the chosen order', async () => {
    const f = await resolveFilters(ctx, db, facets, terms, EMPTY_ITEMS);
    if (f === null) throw new Error('no filters');
    expect(facets.run(f, 'lists', 1, 5).ids).toEqual([1, 2, 3, 4, 5]);
    expect(facets.run(f, 'lists', 2, 5).ids).toEqual([6, 7, 8, 9, 10]);
    const stars = (await db.itemsByIds(facets.run(f, 'stars', 1, 50).ids)).map((i) => i.stars ?? -1);
    expect(stars).toEqual([...stars].sort((a, b) => b - a));
    const names = (await db.itemsByIds(facets.run(f, 'name', 1, 50).ids)).map((i) => i.name.toLowerCase());
    expect(names).toEqual([...names].sort());
  });

  it('stops paging at 200', async () => {
    expect(await body('/items?page=201')).toContain('Paging stops at page 200');
  });
});

describe('ranking', () => {
  it('orders items by lists, then stars, then name', async () => {
    const items = await db.itemsByIds(Array.from({ length: 60 }, (_, i) => i + 1));
    for (let i = 1; i < items.length; i++) {
      const a = items[i - 1];
      const b = items[i];
      if (!a || !b) continue;
      expect(a.listCount >= b.listCount).toBe(true);
      if (a.listCount === b.listCount) expect((a.stars ?? -1) >= (b.stars ?? -1)).toBe(true);
    }
  });

  it('puts an exact name first and a name match before a section match', async () => {
    const names = (await db.itemsByIds(await search.itemIds(db, 'rocket', 10))).map((i) => i.name);
    expect(names[0]).toBe('Rocket');
    // The paper names rockets in its own name; the rest only in sections or lists.
    expect(names.indexOf('A paper about rockets')).toBeGreaterThan(0);
  });

  it('keeps c++ apart from c', async () => {
    const names = (await db.itemsByIds(await search.itemIds(db, 'c++', 10))).map((i) => i.name);
    expect(names).toContain('c++ tool');
    expect(names).not.toContain('c tool');
    for (const hostile of ['"', '""', '*', 'a"b', 'NEAR(', '-x', 'AND', '(', ')', ':', 'name:x', '^']) {
      await expect(search.itemIds(db, hostile, 10)).resolves.toBeInstanceOf(Array);
      expect((await get(`/search?q=${encodeURIComponent(hostile)}`)).status).toBe(200);
    }
  });
});

describe('the build', () => {
  it('never opens private/', () => {
    // makeFixture made private/ unreadable and the build still ran; the site code never names it.
    for (const f of filesIn(join(import.meta.dirname, '../../src/site'))) expect(readFileSync(f, 'utf8'), f).not.toMatch(/private\//);
  });

  it('never carries a description into the load, the static files or a page', async () => {
    for (const f of [fixture.build.paths.loadSql, fixture.build.paths.db, ...filesIn(fixture.build.paths.assets)]) {
      expect(readFileSync(f, 'latin1'), f).not.toContain('DESCRIPTION-MARKER');
    }
    const files = filesIn(fixture.build.paths.assets).map((f) => f.slice(fixture.build.paths.assets.length));
    for (const f of ['/llms.txt', '/lists/alpha/awesome-widgets.md', '/lists/beta/awesome-gadgets.md']) expect(files).toContain(f);
    for (const p of ['/', '/lists', '/lists/alpha/awesome-widgets', '/gh/acme/rocket', '/items', '/search?q=rocket', '/api/quick?q=ro', '/about',
      '/llms.txt', '/lists/alpha/awesome-widgets.md', '/lists/beta/awesome-gadgets.md']) {
      expect(await body(p), p).not.toContain('DESCRIPTION-MARKER');
    }
  });
});
