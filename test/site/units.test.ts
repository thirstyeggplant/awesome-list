import { describe, expect, it } from 'vitest';
import { fitTitle } from '../../src/site/views/layout.js';
import { relatedLists, topOf } from '../../src/site/build/cli.js';
import { alongside } from '../../src/site/build/alongside.js';
import { itemKey, itemKeys, shortHash } from '../../src/site/build/item-keys.js';
import { headersFile, sitemaps } from '../../src/site/build/static.js';
import { decodeFacets, encodeFacets, type FacetData } from '../../src/site/facets-file.js';
import { html, outbound, raw, safeHref } from '../../src/site/html.js';
import { keyOfPath, pathOfKey, sectionOutline, shortHashOf, slugify } from '../../src/site/keys.js';
import { parseHeaders } from '../../src/site/server.js';
import {
  EMPTY_ITEMS, liftNamespaces, parseItemsQuery, parseListsQuery, serialiseItems, serialiseLists, withLifted,
} from '../../src/site/query.js';
import { ftsQuery, quickFtsQuery } from '../../src/site/search.js';
import { LOCALES } from '../../src/site/i18n/locales.js';

describe('item keys', () => {
  it('goes from an item to a path and back', () => {
    const gh = itemKey('https://github.com/acme/rocket', 'Acme/Rocket');
    expect(gh).toBe('gh/acme/rocket');
    expect(keyOfPath(pathOfKey(gh))).toBe(gh);
    const other = itemKey('https://example.com/a', null);
    expect(other).toBe(`item/${shortHash('https://example.com/a')}`);
    expect(other).toMatch(/^item\/[0-9a-f]{10}$/);
    expect(keyOfPath(pathOfKey(other))).toBe(other);
    expect(keyOfPath('/item/xyz')).toBeNull();
    expect(keyOfPath('/gh/acme')).toBeNull();
  });

  it('hashes the same with crypto.subtle as the build does with node:crypto', async () => {
    for (const id of ['https://example.com/a', 'https://example.com/ünïcode?x=1', '']) {
      expect(await shortHashOf(id)).toBe(shortHash(id));
    }
  });

  it('fails the build on a collision', () => {
    const items = [
      { id: 'https://example.com/a', nameWithOwner: null },
      { id: 'https://example.com/b', nameWithOwner: null },
    ];
    expect(() => itemKeys(items, () => 'aaaaaaaaaa')).toThrow(/two items have the key item\/aaaaaaaaaa/);
    expect(itemKeys(items)).toHaveLength(2);
  });

  it('makes slugs and unique anchors', () => {
    expect(slugify('C++')).toBe('cplusplus');
    expect(slugify('C#')).toBe('csharp');
    expect(slugify('Jupyter Notebook')).toBe('jupyter-notebook');
    expect(slugify('Apache-2.0')).toBe('apache-2.0');
    const nodes = sectionOutline([['Tools'], ['Tools', 'CLI'], ['Other', 'Tools'], ['Contents']]);
    expect(nodes.map((n) => n.anchor)).toEqual(['tools', 'cli', 'other', 'tools-1', 'contents-1']);
  });
});

describe('query parameters', () => {
  it('parses, ignores unknown parameters and writes back in the fixed order', () => {
    const q = parseItemsQuery(new URLSearchParams('page=2&lang=Go&kind=repo&q=x%20y&topic=web&topic=cli&topic=web&foo=1&sort=stars'));
    expect(q).not.toBeNull();
    expect(serialiseItems(q ?? EMPTY_ITEMS)).toBe('?q=x+y&kind=repo&lang=go&topic=cli&topic=web&sort=stars&page=2');
  });

  it('leaves defaults out', () => {
    expect(serialiseItems(parseItemsQuery(new URLSearchParams('page=1&q=')) ?? EMPTY_ITEMS)).toBe('');
    const lists = parseListsQuery(new URLSearchParams('category=tools&page=1&sort=stars'));
    expect(lists && serialiseLists(lists)).toBe('?category=tools&sort=stars');
  });

  it('refuses values that cannot be right', () => {
    for (const bad of ['kind=banana', 'status=fine', 'stars=50', 'in=3', 'sort=random', 'page=0', 'page=x', 'list=nolist', 'lang=<b>']) {
      expect(parseItemsQuery(new URLSearchParams(bad)), bad).toBeNull();
    }
    expect(parseListsQuery(new URLSearchParams('status=archived'))).toBeNull();
  });

  it('lifts ns:value tokens out of a search', () => {
    const { rest, lifted } = liftNamespaces('http lang:C++ topic:cli kind:Paper server', slugify);
    expect(rest).toBe('http server');
    expect(lifted).toEqual([
      { ns: 'lang', value: 'cplusplus' },
      { ns: 'topic', value: 'cli' },
      { ns: 'kind', value: 'paper' },
    ]);
    expect(serialiseItems(withLifted({ ...EMPTY_ITEMS, q: rest }, lifted))).toBe(
      '?q=http+server&kind=paper&lang=cplusplus&topic=cli',
    );
  });
});

describe('full-text queries', () => {
  it('quotes every token and adds * to the last', () => {
    expect(ftsQuery('c++')).toBe('"c++"*');
    expect(ftsQuery('say "hi" now')).toBe('"say" """hi""" "now"*');
    expect(ftsQuery('a* OR b')).toBe('"a*" "OR" "b"*');
    expect(ftsQuery('  - * ')).toBeNull();
    expect(ftsQuery('NEAR(a b)')).toBe('"NEAR(a" "b)"*');
    expect(quickFtsQuery('c#')).toBe('{name aka ident} : ("c#"*)');
  });
});

describe('html', () => {
  it('escapes what it is given unless it is html', () => {
    const name = '<script>alert("x")</script>&\'';
    expect(html`<p title="${name}">${name}</p>`.value).toBe(
      '<p title="&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;&amp;&#39;">&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;&amp;&#39;</p>',
    );
    expect(html`${raw('<b>')}${['<', html`<i>`]}${null}${false}${3}`.value).toBe('<b>&lt;<i>3');
  });

  it('keeps only http(s) addresses as links', () => {
    expect(safeHref('javascript:alert(1)')).toBeNull();
    expect(safeHref('JaVaScRiPt:alert(1)')).toBeNull();
    expect(safeHref('data:text/html,x')).toBeNull();
    expect(safeHref('/relative')).toBeNull();
    expect(outbound('javascript:alert(1)', 'demo').value).toBe('demo');
    expect(outbound('https://example.com/"x"', 'ok').value).toBe(
      '<a href="https://example.com/%22x%22" rel="noopener">ok</a>',
    );
  });
});

describe('listed alongside', () => {
  const facts = (id: number): { listCount: number; stars: number | null } => ({ listCount: id === 9 ? 3 : 1, stars: id * 10 });
  const section = (ids: number[]): { entries: { itemId: number; position: number }[] } => ({
    entries: ids.map((itemId, position) => ({ itemId, position })),
  });

  it('sums 1 / log2(2 + size) over shared sections, small sections counting most', () => {
    const rows = alongside([section([1, 2, 3, 4, 5, 6]), section([1, 3])], facts);
    const of1 = rows.filter((r) => r.itemId === 1);
    expect(of1[0]?.otherId).toBe(3);
    expect(of1[0]?.score).toBeCloseTo(1 / Math.log2(8) + 1 / Math.log2(4));
    // Ties: Y's list count, then stars.
    expect(of1.slice(1).map((r) => r.otherId)).toEqual([6, 5, 4, 2]);
  });

  it('breaks ties by list count, then stars, then distance', () => {
    const rows = alongside([section([1, 2, 9, 3])], () => ({ listCount: 1, stars: null }));
    expect(rows.filter((r) => r.itemId === 1).map((r) => r.otherId)).toEqual([2, 9, 3]);
    const rows2 = alongside([section([1, 2, 9, 3])], facts);
    expect(rows2.filter((r) => r.itemId === 1).map((r) => r.otherId)).toEqual([9, 3, 2]);
  });

  it('counts only 5 on each side in a section of more than 80, and keeps 12', () => {
    const big = Array.from({ length: 81 }, (_, i) => i + 100);
    const rows = alongside([section(big)], () => ({ listCount: 1, stars: null }));
    const first = rows.filter((r) => r.itemId === 100);
    expect(first.map((r) => r.otherId)).toEqual([101, 102, 103, 104, 105]);
    const middle = rows.filter((r) => r.itemId === 140);
    expect(middle.map((r) => r.otherId).sort((a, b) => a - b)).toEqual([135, 136, 137, 138, 139, 141, 142, 143, 144, 145]);
    const small = alongside([section(Array.from({ length: 80 }, (_, i) => i + 100))], () => ({ listCount: 1, stars: null }));
    expect(small.filter((r) => r.itemId === 100)).toHaveLength(12);
    expect(small.filter((r) => r.itemId === 100).map((r) => r.otherId)).toEqual(Array.from({ length: 12 }, (_, i) => 101 + i));
  });
});

describe('facets.bin', () => {
  it('gives back what was written', () => {
    const n = 7;
    const d: FacetData = {
      n,
      kind: Uint8Array.from([0, 1, 2, 3, 4, 5, 0]),
      status: Uint8Array.from([0, 1, 2, 3, 4, 0, 1]),
      lang: Uint16Array.from([0, 1, 2, 65535, 1, 0, 3]),
      license: Uint16Array.from([0, 0, 9, 9, 1, 2, 3]),
      stars: Int32Array.from([-1, 0, 5, 2_000_000_000, 7, -1, 3]),
      pushed: Int32Array.from([20000, -1, 19000, 1, 2, 3, 4]),
      listCount: Uint16Array.from([1, 2, 3, 4, 5, 6, 65535]),
      owner: Int32Array.from([-1, 0, 1, 1, 0, -1, 2]),
      topicStart: Uint32Array.from([0, 0, 2, 3, 3, 3, 4, 4]),
      topicIds: Uint32Array.from([10, 11, 12, 40000]),
      listStart: Uint32Array.from([0, 1, 2, 3, 4, 5, 6, 8]),
      listIds: Uint32Array.from([1, 2, 3, 1, 2, 3, 1, 671]),
      orderStars: Uint32Array.from([3, 4, 2, 6, 1, 0, 5]),
      orderUpdated: Uint32Array.from([0, 2, 6, 5, 4, 3, 1]),
      orderName: Uint32Array.from([6, 5, 4, 3, 2, 1, 0]),
      owners: ['acme', 'ünï', 'x-y'],
    };
    const bytes = encodeFacets(d);
    // Copy into a fresh buffer, as a fetched file arrives.
    const back = decodeFacets(bytes.slice().buffer);
    expect(back).toEqual(d);
    for (const [k, v] of Object.entries(back)) if (ArrayBuffer.isView(v)) expect(v.byteOffset % 8, k).toBe(0);
    const empty = decodeFacets(encodeFacets({ ...d, n: 0, kind: new Uint8Array(0), owners: [] }).slice().buffer);
    expect(empty.owners).toEqual([]);
    expect(empty.kind.length).toBe(0);
  });
});

describe('sitemaps', () => {
  it('puts 40,000 items in each items-n.xml', () => {
    const keys = Array.from({ length: 85_000 }, (_, i) => `gh/o/r${i}`);
    const files = sitemaps({
      origin: 'https://example.test', dataDay: '2026-06-02', categories: ['tools'], lists: [{ slug: 'a/b', pushedDay: 20000 }],
      owners: ['o'], itemKeys: keys, browse: ['/items?lang=go', '/items?topic=cli&x=1'],
    });
    expect([...files.keys()]).toEqual([
      '/sitemap.xml', '/sitemaps/pages.xml', ...LOCALES.map((l) => `/sitemaps/lists-${l}.xml`), '/sitemaps/browse.xml', '/sitemaps/owners.xml',
      '/sitemaps/items-1.xml', '/sitemaps/items-2.xml', '/sitemaps/items-3.xml',
    ]);
    const urls = (p: string): number => [...(files.get(p) ?? '').matchAll(/<url>/g)].length;
    expect([urls('/sitemaps/items-1.xml'), urls('/sitemaps/items-2.xml'), urls('/sitemaps/items-3.xml')]).toEqual([40_000, 40_000, 5_000]);
    expect(files.get('/sitemaps/items-3.xml')).toContain('<loc>https://example.test/gh/o/r84999</loc>');
    expect([...(files.get('/sitemap.xml') ?? '').matchAll(/<sitemap>/g)]).toHaveLength(16);
    expect(files.get('/sitemaps/browse.xml')).toContain('<url><loc>https://example.test/items?topic=cli&amp;x=1</loc></url>');
    expect(files.get('/sitemaps/items-1.xml')).not.toContain('<lastmod>');
    // A list's lastmod is its last push, and the index's is the latest in the file.
    expect(files.get('/sitemaps/lists-de.xml')).toContain('<loc>https://example.test/de/lists/a/b</loc><lastmod>2024-10-04</lastmod>');
    expect(files.get('/sitemap.xml')).toContain('<loc>https://example.test/sitemaps/lists-de.xml</loc><lastmod>2024-10-04</lastmod>');
    expect(files.get('/sitemap.xml')).toContain('<loc>https://example.test/sitemaps/owners.xml</loc></sitemap>');
  });

  it('gives the static files their headers', () => {
    const rules = parseHeaders(headersFile());
    const of = (path: string): Record<string, string> =>
      Object.fromEntries(rules.filter((r) => r.pattern.test(path)).flatMap((r) => r.headers));
    expect(of('/assets/0123456789/site.css')).toEqual({ 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'public, max-age=31536000, immutable' });
    expect(of('/sitemaps/items-1.xml')['Cache-Control']).toBe('public, max-age=3600, s-maxage=86400');
    expect(of('/robots.txt')['Cache-Control']).toBe('public, max-age=3600, s-maxage=86400');
    expect(of('/_data/facets.bin')).toEqual({ 'X-Content-Type-Options': 'nosniff' });
    expect(of('/favicon.ico')['Cache-Control']).toBe('public, max-age=86400');
    expect(of('/site.webmanifest')['Cache-Control']).toBe('public, max-age=86400');
  });
});

describe('fitTitle', () => {
  it('keeps a list title\'s name and repository when it cuts', () => {
    const title = 'Node.js (awesome-nodejs): awesome list of 591 items';
    expect(fitTitle(title, 60, ' · Shelf')).toBe(title);
    expect(fitTitle(`Something Rather Long (awesome-something-rather-long): awesome list of 3,196 items`, 60, ' · Shelf')).toBe(
      'Something Rather Long (awesome-something-rather-long)',
    );
    expect(fitTitle('Node.js (awesome-nodejs) : une liste awesome de 591 éléments', 30)).toBe('Node.js (awesome-nodejs)');
  });
});

describe('relatedLists and topOf', () => {
  it('relate lists that name at least three projects in common, best score first, ties by stars', () => {
    const rows: { listId: number; itemId: number }[] = [];
    const add = (listId: number, items: number[]): void => { for (const itemId of items) rows.push({ listId, itemId }); };
    add(1, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    add(2, [1, 2, 3, 4]); // 4 of 4 in common with 1
    add(3, [1, 2, 3, 20, 21, 22, 23, 24]); // 3 in common with 1, a larger list
    add(4, [1, 2, 30]); // only 2 in common
    add(2, [1]); // an item twice in one list counts once
    const r = relatedLists(rows);
    expect(r.get(1)).toEqual([[2, 4], [3, 3]]);
    expect(r.get(2)).toEqual([[1, 4], [3, 3]]);
    expect(r.has(4)).toBe(false);
  });

  it('keeps the twelve languages with the most items for the home page', () => {
    const terms = Array.from({ length: 15 }, (_, i) => ({ id: i + 1, ns: 'lang' as const, slug: `l${i}`, label: `L${i}`, itemCount: i }));
    const top = topOf({ terms: [...terms, { id: 99, ns: 'topic', slug: 't', label: 't', itemCount: 999 }] });
    expect(top.langs).toHaveLength(12);
    expect(top.langs[0]).toEqual(['l14', 'L14', 14]);
  });
});
