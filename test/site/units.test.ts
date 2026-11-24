import { describe, expect, it } from 'vitest';
import { alongside } from '../../src/site/build/alongside.js';
import { html, outbound, raw, safeHref } from '../../src/site/html.js';
import { itemKey, itemKeys, keyOfPath, pathOfKey, sectionOutline, shortHash, slugify } from '../../src/site/keys.js';
import {
  EMPTY_ITEMS, liftNamespaces, parseItemsQuery, parseListsQuery, serialiseItems, serialiseLists, withLifted,
} from '../../src/site/query.js';
import { ftsQuery, quickFtsQuery } from '../../src/site/search.js';

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
