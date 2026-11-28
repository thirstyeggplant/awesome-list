// What search engines and sharing see: alternates, canonicals, structured data, sitemaps, robots.txt, the head.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { shortHash } from '../../src/site/build/item-keys.js';
import { EMPTY_ITEMS, type ItemsQuery } from '../../src/site/query.js';
import { itemsNoindex } from '../../src/site/views/items.js';
import { LOCALES, LOCALE_INFO, localePath } from '../../src/site/i18n/locales.js';
import { makeFixture, ORIGIN, restore, type Fixture } from './fixture.js';

let fixture: Fixture;

beforeAll(async () => {
  fixture = await makeFixture();
});

afterAll(() => {
  restore(fixture);
});

interface Got { status: number; headers: Headers; body: string }
async function get(url: string): Promise<Got> {
  const r = await fixture.handler(new Request(`${ORIGIN}${url}`));
  return { status: r.status, headers: r.headers, body: await r.text() };
}

const decode = (s: string): string =>
  s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');

/** An unprefixed address in a language. */
function inLang(l: (typeof LOCALES)[number], address: string): string {
  const i = address.indexOf('?');
  return i === -1 ? localePath(l, address) : localePath(l, address.slice(0, i)) + address.slice(i);
}

interface Head { canonical: string | null; noindex: boolean; alternates: Map<string, string>; ld: unknown[] }
function headOf(page: string): Head {
  const canonical = /<link rel="canonical" href="([^"]*)">/.exec(page)?.[1];
  const alternates = new Map([...page.matchAll(/<link rel="alternate" hreflang="([^"]*)" href="([^"]*)">/g)].map((m) => [m[1] ?? '', decode(m[2] ?? '')]));
  const ld = [...page.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1] ?? '') as unknown);
  return { canonical: canonical === undefined ? null : decode(canonical), noindex: page.includes('<meta name="robots" content="noindex,follow">'), alternates, ld };
}

/** The pages of the fixture offered in every language. */
const EACH = ['/', '/lists', '/lists?category=tools', '/lists/alpha/awesome-widgets', '/items', '/about'];

describe('alternates (test 11)', () => {
  it('are the same eleven in every language, each answering and self-canonical', async () => {
    for (const address of EACH) {
      const sets: string[] = [];
      for (const l of LOCALES) {
        const h = headOf((await get(inLang(l, address))).body);
        expect(h.canonical, `${l} ${address}`).toBe(ORIGIN + inLang(l, address));
        expect(h.noindex).toBe(false);
        expect(h.alternates.size, `${l} ${address}`).toBe(11);
        expect(h.alternates.get('x-default')).toBe(ORIGIN + address);
        expect(h.alternates.get(LOCALE_INFO[l].hreflang)).toBe(ORIGIN + inLang(l, address));
        sets.push(JSON.stringify([...h.alternates]));
      }
      expect(new Set(sets).size, address).toBe(1);
      for (const href of headOf((await get(address)).body).alternates.values()) {
        const r = await get(href.slice(ORIGIN.length) || '/');
        expect(r.status, href).toBe(200);
        expect(headOf(r.body).canonical, href).toBe(href);
      }
    }
  });
});

describe('canonicals (test 12)', () => {
  it('point a localized item, owner and filtered listing at the English, with no alternates', async () => {
    for (const address of ['/gh/acme/rocket', '/gh/own1', '/items?lang=go', '/items?kind=repo']) {
      const h = headOf((await get(inLang('es', address))).body);
      expect(h.canonical, address).toBe(ORIGIN + address);
      expect(h.alternates.size, address).toBe(0);
      expect(h.noindex, address).toBe(false);
      expect(h.ld, `${address}: no structured data on a page whose canonical is elsewhere`).toEqual([]);
    }
  });

  it('give a noindex page no alternates and no canonical to another address', async () => {
    const paths = [
      '/items?q=rocket', '/items?lang=go&kind=repo', '/items?sort=stars', '/lists?sort=name', '/search?q=rocket', '/search', '/nope',
      '/items?owner=own1', '/items?list=alpha/awesome-widgets', '/items?category=tools', '/items?in=2', '/lists?license=mit', '/lists?status=ok',
    ];
    for (const l of LOCALES) {
      for (const p of paths) {
        const page = (await get(inLang(l, p))).body;
        const h = headOf(page);
        expect(h.noindex, `${l} ${p}`).toBe(true);
        expect(h.alternates.size, `${l} ${p}`).toBe(0);
        if (h.canonical !== null) expect(h.canonical.startsWith(ORIGIN + localePath(l, p.split('?')[0] ?? '/')), `${l} ${p}`).toBe(true);
      }
    }
  });

  it('keep one-filter listings that are thin, or past page 1, out of the index, and nofollow links to them', async () => {
    // The rules in one function: any later page, a thin or empty topic, a topic that says nothing.
    const q = (o: Partial<ItemsQuery>): ItemsQuery => ({ ...EMPTY_ITEMS, ...o });
    expect(itemsNoindex(q({}))).toBe(false);
    expect(itemsNoindex(q({ page: 2 }))).toBe(true);
    expect(itemsNoindex(q({ topic: ['cli'] }), 19)).toBe(true);
    expect(itemsNoindex(q({ topic: ['cli'] }), 20)).toBe(false);
    expect(itemsNoindex(q({ topic: ['hacktoberfest'] }), 5000)).toBe(true);
    expect(itemsNoindex(q({ lang: 'go' }), 5)).toBe(false);
    for (const o of [{ owner: 'x' }, { list: 'a/b' }, { category: 'c' }, { status: 'archived' as const }, { stars: 100 }, { in: 2 }]) {
      expect(itemsNoindex(q(o), 5000), JSON.stringify(o)).toBe(true);
    }
    // /items?kind=paper has one item: thin.
    expect(headOf((await get('/items?kind=paper')).body).noindex).toBe(true);
    expect(headOf((await get('/items?lang=go')).body).noindex).toBe(false);
    const items = (await get('/items')).body;
    expect(items).toMatch(/<a href="\/items\?kind=paper" rel="nofollow">/);
    expect(items).toMatch(/<a href="\/items\?lang=go">/);
    expect(items).toMatch(/<a href="\/items\?sort=stars" rel="nofollow">/);
    const lists = (await get('/lists?category=tools')).body;
    expect(lists).toMatch(/<a href="\/lists\?category=tools&amp;license=mit" rel="nofollow">/);
    // A page past the last is not there.
    expect((await get('/items?lang=go&page=9')).status).toBe(404);
    expect((await get('/lists?page=2')).status).toBe(404);
  });
});

describe('structured data (test 13)', () => {
  const absolute = (v: unknown, where: string, allowGithub: boolean): void => {
    if (typeof v === 'string' && /^[a-z]+:\/\//.test(v)) {
      const ok = v.startsWith(`${ORIGIN}/`) || v === ORIGIN || (allowGithub && v.startsWith('https://github.com/')) || v.startsWith('https://schema.org') || v.startsWith('https://spdx.org/licenses/');
      expect(ok, `${where}: ${v}`).toBe(true);
    } else if (Array.isArray(v)) v.forEach((x) => { absolute(x, where, allowGithub); });
    else if (typeof v === 'object' && v !== null) for (const [k, x] of Object.entries(v)) absolute(x, where, allowGithub || k === 'isBasedOn' || k === 'codeRepository' || k === 'about');
  };
  const types = (v: unknown, out: Record<string, unknown>[] = []): Record<string, unknown>[] => {
    if (Array.isArray(v)) v.forEach((x) => types(x, out));
    else if (typeof v === 'object' && v !== null) {
      const o = v as Record<string, unknown>;
      if (typeof o['@type'] === 'string') out.push(o);
      Object.values(o).forEach((x) => types(x, out));
    }
    return out;
  };
  const REQUIRED: Record<string, string[]> = {
    WebSite: ['name', 'url'],
    SearchAction: ['target', 'query-input'],
    CollectionPage: ['name', 'url', 'mainEntity'],
    ItemList: ['numberOfItems'],
    ListItem: ['position', 'name'],
    BreadcrumbList: ['itemListElement'],
    SoftwareSourceCode: ['name', 'codeRepository'],
    WebPage: ['name', 'url', 'about'],
    Thing: ['name'],
  };

  it('parses, has what each type needs, and points only at the site or GitHub', async () => {
    const pages = ['/', '/lists', '/lists?category=tools', '/lists/alpha/awesome-widgets', '/lists/delta/awesome-hostile', '/gh/acme/rocket', '/gh/own0/proj0', `/item/${shortHash('https://example.com/hostile')}`, '/gh/own1', '/items', '/items?lang=go'];
    const seen = new Set<string>();
    for (const l of ['en', 'ja'] as const) {
      for (const p of pages) {
        const page = (await get(inLang(l, p))).body;
        const { ld } = headOf(page);
        if (l === 'ja' && (/^\/(gh|item)\//.test(p) || p.startsWith('/items?'))) {
          expect(ld, p).toEqual([]);
          continue;
        }
        expect(ld.length, `${l} ${p}`).toBeGreaterThan(0);
        for (const t of types(ld)) {
          const type = String(t['@type']);
          seen.add(type);
          // A CollectionPage named inside another block (isPartOf) needs only its name and address.
          const required = type === 'CollectionPage' && !('@context' in t) ? ['name', 'url'] : (REQUIRED[type] ?? []);
          for (const k of required) expect(t[k], `${p} ${type}.${k}`).toBeDefined();
          if (type === 'SoftwareSourceCode' || type === 'WebPage') {
            for (const k of ['description', 'author', 'aggregateRating', 'review']) expect(t[k], `${p} ${k}`).toBeUndefined();
          }
        }
        absolute(ld, `${l} ${p}`, false);
      }
    }
    expect([...seen].sort()).toEqual(['BreadcrumbList', 'CollectionPage', 'EntryPoint', 'ItemList', 'ListItem', 'SearchAction', 'SoftwareSourceCode', 'Thing', 'WebPage', 'WebPageElement', 'WebSite']);
    // A hostile name stays inside its block.
    const hostile = (await get('/lists/delta/awesome-hostile')).body;
    const block = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(hostile)?.[1] ?? '';
    expect(block).not.toMatch(/<\//);
    expect(JSON.stringify(JSON.parse(block))).toContain('<script>alert(1)</script>');
    // Pages that are not their own canonical, or are noindex, carry none.
    for (const p of [`/item/${shortHash('https://example.com/cpp-tool')}`, '/gh/acme', '/items?kind=paper', '/items?owner=own1', '/search?q=rocket', '/about']) {
      expect(headOf((await get(p)).body).ld, p).toEqual([]);
    }
  });
});

/** A small check that a file is well-formed XML: declarations, balanced tags, quoted attributes. */
function wellFormed(xml: string): boolean {
  const stack: string[] = [];
  const body = xml.replace(/^<\?xml[^?]*\?>\s*/, '');
  for (const m of body.matchAll(/<(\/?)([a-zA-Z:]+)((?:\s+[a-zA-Z:]+="[^"<]*")*)\s*(\/?)>/g)) {
    if (m[1] === '/') {
      if (stack.pop() !== m[2]) return false;
    } else if (m[4] !== '/') stack.push(m[2] ?? '');
  }
  const text = body.replace(/<[^>]+>/g, '');
  return stack.length === 0 && !/[<>]/.test(text) && !/&(?!amp;|lt;|gt;|quot;|apos;)/.test(text);
}

describe('sitemaps (test 14)', () => {
  it('are well-formed and list only pages that answer, are self-canonical and indexed, with their alternates', async () => {
    const index = (await get('/sitemap.xml')).body;
    expect(wellFormed(index)).toBe(true);
    const files = [...index.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => decode(m[1] ?? '').slice(ORIGIN.length));
    expect(files).toEqual(['/sitemaps/pages.xml', ...LOCALES.map((l) => `/sitemaps/lists-${l}.xml`), '/sitemaps/browse.xml', '/sitemaps/owners.xml', '/sitemaps/items-1.xml']);
    let checked = 0;
    for (const f of files) {
      const xml = (await get(f)).body;
      expect(wellFormed(xml), f).toBe(true);
      const urls = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => m[1] ?? '');
      expect(urls.length, f).toBeLessThan(50_000);
      for (const u of urls) {
        const loc = decode(/<loc>([^<]*)<\/loc>/.exec(u)?.[1] ?? '');
        const address = loc.slice(ORIGIN.length) || '/';
        const r = await get(address);
        expect(r.status, address).toBe(200);
        const h = headOf(r.body);
        expect(h.canonical, address).toBe(loc);
        expect(h.noindex, address).toBe(false);
        const links = new Map([...u.matchAll(/<xhtml:link rel="alternate" hreflang="([^"]*)" href="([^"]*)"\/>/g)].map((m) => [m[1] ?? '', decode(m[2] ?? '')]));
        expect([...links], address).toEqual([...h.alternates]);
        if (/^\/(gh|item)\//.test(address)) expect(links.size).toBe(0);
        checked++;
      }
      if (f === '/sitemaps/owners.xml' || f === '/sitemaps/browse.xml' || f.startsWith('/sitemaps/items-')) {
        expect(xml, f).not.toContain('<lastmod>');
        for (const l of LOCALES.filter((x) => x !== 'en')) expect(xml, f).not.toContain(`${ORIGIN}/${l}/`);
      }
    }
    expect(checked).toBeGreaterThan(100);
    // A list's lastmod is its last push (2026-06-01); pages carry the data date.
    expect((await get('/sitemaps/lists-de.xml')).body).toContain(`<loc>${ORIGIN}/de/lists/alpha/awesome-widgets</loc><lastmod>2026-06-01</lastmod>`);
    expect((await get('/sitemaps/pages.xml')).body).toContain(`<loc>${ORIGIN}/fr/lists?category=tools</loc><lastmod>2026-06-02</lastmod>`);
    expect(index).toContain(`<loc>${ORIGIN}/sitemaps/owners.xml</loc></sitemap>`);
  });
});

describe('robots.txt (test 15)', () => {
  it('keeps crawlers off search in every language, the API and the data files, and names the sitemap', async () => {
    const robots = (await get('/robots.txt')).body;
    for (const l of LOCALES) expect(robots).toContain(`Disallow: ${localePath(l, '/search')}\n`);
    expect(robots).toContain('Disallow: /api/\n');
    expect(robots).toContain('Disallow: /_data/\n');
    expect(robots).toContain(`Sitemap: ${ORIGIN}/sitemap.xml`);
  });
});

describe('the head (test 16)', () => {
  it('has one h1, one title, one description, at most one canonical, the Open Graph set and the icons', async () => {
    const pages = ['/', '/lists', '/lists?category=tools', '/lists/alpha/awesome-widgets', '/items', '/items?lang=go', '/gh/acme/rocket', '/gh/own1', '/about', '/search?q=rocket', '/nope'];
    for (const l of ['en', 'de'] as const) {
      for (const p of pages) {
        const page = (await get(inLang(l, p))).body;
        const count = (re: RegExp): number => [...page.matchAll(re)].length;
        expect(count(/<h1[\s>]/g), `${l} ${p} h1`).toBe(1);
        expect(count(/<title>/g), p).toBe(1);
        expect(count(/<meta name="description"/g), p).toBe(p.startsWith('/search') || p === '/nope' ? 0 : 1);
        expect(count(/<link rel="canonical"/g), p).toBeLessThanOrEqual(1);
        for (const prop of ['og:type', 'og:site_name', 'og:title', 'og:locale', 'og:image', 'og:image:width', 'og:image:height', 'og:image:alt']) {
          expect(page, `${p} ${prop}`).toContain(`<meta property="${prop}" content="`);
        }
        expect(page).toContain('<meta name="twitter:card" content="summary_large_image">');
        expect(page).toContain('<link rel="icon" href="/favicon.ico" sizes="32x32">');
        expect(page).toContain('<link rel="manifest" href="/site.webmanifest">');
        expect(page).toContain(`<meta property="og:locale" content="${LOCALE_INFO[l].og}">`);
      }
    }
    const og = /<meta property="og:image" content="([^"]*)">/.exec((await get('/')).body)?.[1] ?? '';
    expect(og).toMatch(new RegExp(`^${ORIGIN}/assets/[0-9a-f]{10}/og\\.png$`));
    const image = await fixture.handler(new Request(og));
    expect(image.status).toBe(200);
    expect(image.headers.get('Content-Type')).toBe('image/png');
    // The icons and the manifest are static files, never the Worker's 404.
    for (const p of ['/favicon.ico', '/favicon.svg', '/apple-touch-icon.png', '/site.webmanifest']) {
      const r = await get(p);
      expect(r.status, p).toBe(200);
      expect(r.headers.get('Cache-Control'), p).toBe('public, max-age=86400');
    }
    const manifest = JSON.parse((await get('/site.webmanifest')).body) as { name: string; icons: unknown[] };
    expect(manifest.name).toBe('Shelf');
    expect(manifest.icons).toHaveLength(2);
    const fav = await fixture.handler(new Request(`${ORIGIN}/favicon.ico`));
    expect(Buffer.from(await fav.arrayBuffer()).subarray(0, 4)).toEqual(Buffer.from([0, 0, 1, 0]));
  });

  it('titles the pages as the table says', async () => {
    const title = async (p: string): Promise<string> => decode(/<title>([^<]*)<\/title>/.exec((await get(p)).body)?.[1] ?? '');
    expect(await title('/')).toBe('Shelf: 5 awesome lists and everything in them');
    expect(await title('/lists')).toBe('All 5 awesome lists · Shelf');
    expect(await title('/lists?category=tools')).toBe('Tools: 3 awesome lists · Shelf');
    expect(await title('/lists/alpha/awesome-widgets')).toMatch(/^Widgets \(awesome-widgets\): awesome list of \d+ items · Shelf$/);
    expect(await title('/gh/acme/rocket')).toBe('Acme/Rocket: in 2 awesome lists · Shelf');
    expect(await title('/items')).toMatch(/^\d+ projects named by awesome lists · Shelf$/);
    expect(await title('/items?lang=go')).toMatch(/^Go: \d+ projects in awesome lists · Shelf$/);
    expect(await title('/about')).toBe('About Shelf');
    const desc = /<meta name="description" content="([^"]*)">/.exec((await get('/gh/acme/rocket')).body)?.[1] ?? '';
    expect(decode(desc)).toBe('Rocket is named by 2 awesome lists: Widgets, Gadgets. Listed under Launchers in Widgets. Go, MIT, 5,000 stars.');
    // In one list: the list's name is in the title, and the description says where in it.
    expect(await title('/gh/own1/proj1')).toBe('own1/proj1: in the Gadgets awesome list · Shelf');
    const one = /<meta name="description" content="([^"]*)">/.exec((await get('/gh/own1/proj1')).body)?.[1] ?? '';
    expect(decode(one)).toMatch(/^proj1 is in the Gadgets awesome list, under Group 1\. Alongside proj\d+, proj\d+, proj\d+\. .+, [\d,]+ stars\.$/);
    expect((await get('/')).body).toContain('<h1>5 awesome lists and everything in them</h1>');
    expect((await get('/lists/beta/awesome-gadgets')).body).toContain('More in Tools');
    // The lists most like a list: in its head, and as cards after its entries.
    const widgets = (await get('/lists/alpha/awesome-widgets')).body;
    expect(widgets).toMatch(/<p class="see-also"><span class="label">See also<\/span> <a href="\/lists\/beta\/awesome-gadgets"><span translate="no">Gadgets<\/span><\/a><\/p>/);
    expect(widgets).toContain('<h2>Related lists</h2>');
    expect(widgets).toMatch(/projects in common<\/p>/);
  });
});
