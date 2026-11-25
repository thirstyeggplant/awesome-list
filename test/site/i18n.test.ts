// The languages: messages, the wrapped locale, rendering in every language, prefixes, fallbacks, formatting.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp, type Handler } from '../../src/site/app.js';
import { fileAssets } from '../../src/site/adapters/node.js';
import { shortHash } from '../../src/site/build/item-keys.js';
import { isPlural, p, type Plural } from '../../src/site/i18n/format.js';
import { Loc } from '../../src/site/i18n/loc.js';
import { LOCALES, LOCALE_INFO, localeOfPath, localePath, type Locale } from '../../src/site/i18n/locales.js';
import { en, type Messages } from '../../src/site/i18n/messages/en.js';
import { MESSAGES } from '../../src/site/i18n/messages/index.js';
import { nodeHandler } from '../../src/site/server.js';
import { enHash, readUiHashes, uiReport } from '../../src/translations.js';
import { makeFixture, ORIGIN, restore, type Fixture } from './fixture.js';

let fixture: Fixture;

/** The German files of the fixture: one summary current, one stale, one category; the rest missing. */
const WIDGETS_DE = 'Dinge über Widgets.';
const GADGETS_DE = 'Alte Übersetzung über Gadgets.';
const TRANSLATIONS = {
  'lists.de.json': {
    'alpha/awesome-widgets': { summary: WIDGETS_DE, enHash: enHash('Things about alpha/awesome-widgets.') },
    'beta/awesome-gadgets': { summary: GADGETS_DE, enHash: '000000000000' },
  },
  'categories.de.json': { Tools: 'Werkzeuge' },
};

/** German with a handful of strings of its own, as a translator's first commit would be. */
const SOME_GERMAN: Messages = {
  ...en,
  nav: { ...en.nav, lists: 'Listen', items: 'Einträge', about: 'Über' },
  count: { ...en.count, lists: p({ one: '{n} Liste', other: '{n} Listen' }), items: p({ one: '{n} Eintrag', other: '{n} Einträge' }) },
  lang: { ...en.lang, suggest: 'Diese Seite auf Deutsch lesen', close: 'Schließen' },
};

let app: Handler;

beforeAll(async () => {
  fixture = await makeFixture({ translations: TRANSLATIONS });
  const a = createApp({ sql: () => fixture.sql, loadAsset: fileAssets(fixture.build.paths.assets), origin: ORIGIN, messages: { de: SOME_GERMAN } });
  app = await nodeHandler(fixture.build.paths.assets, a);
});

afterAll(() => {
  restore(fixture);
});

interface Got { status: number; headers: Headers; body: string }
async function get(url: string, h: Handler = app): Promise<Got> {
  const r = await h(new Request(`${ORIGIN}${url}`));
  return { status: r.status, headers: r.headers, body: await r.text() };
}

const HOSTILE = `/item/${shortHash('https://example.com/hostile')}`;
/** Every kind of page of the fixture, unprefixed. */
const ROUTES = [
  '/', '/lists', '/lists?category=tools', '/lists?sort=name', '/lists/alpha/awesome-widgets', '/lists/gamma/awesome-broken',
  '/lists/delta/awesome-hostile', '/items', '/items?lang=go', '/items?q=rocket', '/items?topic=cli&topic=web&sort=name',
  '/gh/acme/rocket', HOSTILE, '/gh/own1', '/gh/acme', '/search?q=rocket', '/search', '/about',
];

function flat(m: Messages): [string, string | Plural][] {
  const out: [string, string | Plural][] = [];
  const walk = (v: unknown, key: string): void => {
    if (typeof v === 'string' || isPlural(v)) out.push([key, v]);
    else if (typeof v === 'object' && v !== null) for (const [k, x] of Object.entries(v)) walk(x, key ? `${key}.${k}` : k);
  };
  walk(m, '');
  return out;
}

/** The English, every message wrapped in ⟦…⟧ (each form of a plural). */
function wrapped(): Messages {
  const wrap = (v: unknown): unknown => {
    if (typeof v === 'string') return `⟦${v}⟧`;
    if (isPlural(v)) return Object.fromEntries(Object.entries(v).map(([k, f]) => [k, `⟦${String(f)}⟧`]));
    if (typeof v === 'object' && v !== null) return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, wrap(x)]));
    return v;
  };
  return wrap(en) as Messages;
}

const decode = (s: string): string =>
  s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');

describe('messages', () => {
  it('keep the placeholders and tags of the English, and plurals have the forms each language needs (test 2)', () => {
    for (const l of LOCALES) expect(uiReport(l, MESSAGES[l], readUiHashes()).broken, l).toEqual([]);
    // A plural that lacks a form the language needs is broken once the language is translated.
    const ru: Messages = { ...en, nav: { ...en.nav, lists: 'Списки' }, count: { ...en.count, lists: p({ one: '{n} список', other: '{n} списка' }) } };
    expect(uiReport('ru', ru, {}).broken).toContain('count.lists');
    // A placeholder dropped or misspelt is broken.
    const de: Messages = { ...en, item: { ...en.item, factsAsOf: 'Fakten von GitHub, Stand {datum}.' } };
    expect(uiReport('de', de, {}).broken).toEqual(['item.factsAsOf']);
  });

  it('record the English each translated language was translated from (test 3)', () => {
    const hashes = readUiHashes();
    for (const l of LOCALES.filter((x) => x !== 'en')) {
      const r = uiReport(l, MESSAGES[l], hashes);
      if (r.untranslated) continue; // still a copy of the English: check-translations reports it
      expect(r.stale, `${l}: run pnpm check-translations --stamp ${l} after translating`).toEqual([]);
    }
  });

  it('are not left in English in a translated language (test 4)', () => {
    // Keys whose value may be the same in a language: nothing but placeholders and signs.
    const allowed = new Set(['site.title', 'common.searchChip', 'common.separator']);
    // Words that are the same in the language (loanwords such as Fork, Status, Tags; French "page", German "in"),
    // checked by eye. A key added here must be one whose translation really is the English.
    const sameInLanguage: Partial<Record<Locale, string[]>> = {
      zh: ['facts.fork'],
      es: ['kind.video', 'no', 'facts.fork'],
      pt: ['quick.tags', 'kind.paper', 'kind.site', 'facts.fork', 'facts.host', 'lists.status', 'items.status'],
      de: ['quick.tags', 'count.itemsInSections', 'facts.fork', 'facts.host', 'lists.status', 'items.status', 'search.inList'],
      fr: ['quick.tags', 'kind.article', 'kind.site', 'facts.licence', 'facts.fork', 'lists.licence', 'items.licence', 'search.sections', 'about.attributionTitle', 'meta.page'],
      id: ['site.breadcrumb', 'kind.video', 'kind.paper', 'common.filter', 'facts.fork', 'facts.host', 'lists.status', 'items.status'],
    };
    for (const l of LOCALES.filter((x) => x !== 'en')) {
      const r = uiReport(l, MESSAGES[l], readUiHashes());
      if (r.untranslated) continue;
      const also = new Set(sameInLanguage[l] ?? []);
      expect(r.sameAsEnglish.filter((k) => !allowed.has(k) && !also.has(k)), l).toEqual([]);
    }
    // A messages file that is a copy of the English is reported as untranslated.
    expect(uiReport('de', { ...en }, {}).untranslated).toBe(true);
    expect(uiReport('de', SOME_GERMAN, {}).untranslated).toBe(false);
  });

  it('give every key a non-empty English value', () => {
    for (const [k, v] of flat(en)) expect(typeof v === 'string' ? v : v.other, k).not.toBe('');
  });
});

describe('no English in the chrome (test 5)', () => {
  it('writes every word of a page from a message, or from the data', async () => {
    const marked = await nodeHandler(
      fixture.build.paths.assets,
      createApp({ sql: () => fixture.sql, loadAsset: fileAssets(fixture.build.paths.assets), origin: ORIGIN, messages: { en: wrapped() } }),
    );
    // The fixture's own strings: names, slugs, sections, hosts, addresses, terms, dates.
    const data = new Set<string>(['Shelf', ...LOCALES.map((l) => LOCALE_INFO[l].name)]);
    const add = (v: unknown): void => {
      if (typeof v === 'string' && v !== '') data.add(v);
    };
    for (const r of await fixture.sql.all('SELECT name, slug, owner, subcategory, license, reason, readme_oid, summary FROM list', [])) {
      for (const v of Object.values(r)) add(v);
      add(`github.com/${String(r.slug)}`);
      add(String(r.readme_oid).slice(0, 7));
    }
    for (const r of await fixture.sql.all('SELECT name, aka, host, url, owner, repo_name, key, renamed_from, tags FROM item', [])) {
      for (const [k, v] of Object.entries(r)) {
        if (k === 'aka') for (const a of JSON.parse(String(v)) as string[]) add(a);
        else if (k === 'tags') {
          const t = JSON.parse(String(v)) as { lang: [string, string] | null; license: [string, string] | null; topics: [string, string][] };
          for (const pair of [t.lang, t.license, ...t.topics]) if (pair) pair.forEach(add);
        } else add(v);
      }
    }
    for (const r of await fixture.sql.all('SELECT title, path FROM section', [])) {
      add(r.title);
      (JSON.parse(String(r.path)) as string[]).forEach(add);
      add((JSON.parse(String(r.path)) as string[]).join(' › '));
    }
    for (const r of await fixture.sql.all('SELECT name, extra_links FROM listing', [])) {
      add(r.name);
      for (const e of JSON.parse(String(r.extra_links)) as { text: string }[]) add(e.text);
    }
    for (const r of await fixture.sql.all('SELECT name FROM category', [])) add(r.name);
    for (const r of await fixture.sql.all('SELECT display, login FROM owner', [])) for (const v of Object.values(r)) add(v);
    const loc = new Loc('en');
    for (const r of await fixture.sql.all('SELECT DISTINCT pushed_day AS d FROM item UNION SELECT DISTINCT pushed_day FROM list', [])) {
      if (typeof r.d === 'number') {
        add(loc.day(r.d));
        add(loc.monthYear(r.d));
      }
    }
    add(loc.dayIso('2026-06-02T12:00:00Z'));
    add('rocket');
    const strings = [...data].sort((a, b) => b.length - a.length);
    const SIGNS = /^[\s\d.,:;·×›‹←→↑↓★#/()+\-–—“”‘’'"|!?%&*@_=[\]<>]*$/u;
    const TAGS = /\b(kind|status|lang|license|topic|list|category|owner|stars|in):\S+/g;

    const leftOver = (text: string): string => {
      let t = text;
      for (let before = ''; before !== t; ) {
        before = t;
        t = t.replace(/⟦[^⟦⟧]*⟧/g, ' ');
      }
      t = t.replace(TAGS, ' ');
      for (const s of strings) t = t.split(s).join(' ');
      return t;
    };

    for (const path of [...ROUTES, '/nope']) {
      const page = (await get(path, marked)).body;
      // A long title is cut at its colon (fitTitle), which can cut a marked message in two: it is checked apart.
      expect(/<title>⟦/.test(page), path).toBe(true);
      const withoutLd = page.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '').replace(/<title>[^<]*<\/title>/, '');
      // Text: the whole page without its tags, so a message holding a link stays one piece.
      const text = decode(withoutLd.replace(/<!doctype html>/i, '').replace(/<[^>]+>/g, ' '));
      const rest = leftOver(text);
      expect(SIGNS.test(rest), `${path}: ${rest.replace(/\s+/g, ' ').trim()}`).toBe(true);
      // Attributes that people read or hear, and the words the scripts read.
      const attrs = /\s(aria-label|placeholder|title|alt|data-suggest|data-close|data-lists|data-items|data-tags|data-of|data-collapse|data-expand|data-n-[a-z]+)="([^"]*)"/g;
      for (const m of withoutLd.matchAll(attrs)) {
        const v = decode(m[2] ?? '');
        // The switcher's links are each in their own language: their words are from that language's messages.
        if ((m[1] === 'data-suggest' || m[1] === 'data-close') && !v.includes('⟦')) continue;
        // A plural for the scripts is JSON: its forms are what is read.
        const values = m[1]?.startsWith('data-n-') ? Object.values(JSON.parse(v) as Record<string, string>) : [v];
        for (const x of values) expect(SIGNS.test(leftOver(x)), `${path}: ${m[1] ?? ''}="${x}"`).toBe(true);
      }
      for (const m of withoutLd.matchAll(/<meta (?:name="description"|property="og:(?:title|description)") content="([^"]*)"/g)) {
        expect(SIGNS.test(leftOver(decode(m[1] ?? ''))), `${path}: ${m[0]}`).toBe(true);
      }
    }
  });
});

describe('every language', () => {
  it('renders every page with its own lang, a title and a description, and no placeholder left (test 6)', async () => {
    for (const l of LOCALES) {
      for (const route of ROUTES) {
        const path = localePath(l, route.split('?')[0] ?? '/') + (route.includes('?') ? `?${route.split('?')[1] ?? ''}` : '');
        const r = await get(path);
        expect(r.status, path).toBe(200);
        expect(r.body, path).toContain(`<html lang="${LOCALE_INFO[l].htmlLang}" dir="ltr"`);
        expect(r.headers.get('Content-Language'), path).toBe(LOCALE_INFO[l].htmlLang);
        const title = /<title>([^<]*)<\/title>/.exec(r.body)?.[1] ?? '';
        expect(title.length, path).toBeGreaterThan(0);
        expect(decode(title).length, `${path}: ${title}`).toBeLessThanOrEqual(LOCALE_INFO[l].cjk ? 90 : 90);
        const description = /<meta name="description" content="([^"]*)">/.exec(r.body)?.[1];
        if (!route.startsWith('/search')) {
          expect(description?.length, path).toBeGreaterThan(20);
          expect(decode(description ?? '').length, path).toBeLessThanOrEqual(200);
        }
        const shown = r.body.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '').replace(/\sdata-[a-z-]+="[^"]*"/g, '');
        expect(shown, path).not.toMatch(/\{[a-z]\w*\}/i);
      }
      const missing = await get(localePath(l, '/nope'));
      expect(missing.status).toBe(404);
      expect(missing.body).toContain(`<html lang="${LOCALE_INFO[l].htmlLang}"`);
    }
  });

  it('keeps the language in every link (test 7)', async () => {
    for (const route of ROUTES) {
      const path = localePath('es', route.split('?')[0] ?? '/') + (route.includes('?') ? `?${route.split('?')[1] ?? ''}` : '');
      const page = (await get(path)).body;
      // The switcher links to every language on purpose.
      const main = page.replace(/<nav class="langs"[\s\S]*?<\/nav>/, '');
      for (const m of main.matchAll(/\s(href|action)="(\/[^"]*)"/g)) {
        const href = m[2] ?? '';
        if (href.startsWith('/assets/') || /^\/(favicon\.(ico|svg)|apple-touch-icon\.png|site\.webmanifest)$/.test(href)) continue;
        expect(href === '/es' || href.startsWith('/es/') || href.startsWith('/es?') || href.startsWith('/es#'), `${path}: ${href}`).toBe(true);
      }
    }
  });

  it('uses a language’s own messages and translations, and English where it has none (tests 8, 16)', async () => {
    const lists = (await get('/de/lists')).body;
    expect(lists).toContain('<a href="/de/lists">Listen</a>');
    expect(lists).toContain('5 Listen');
    // A current translation, a stale one (still shown), and a missing one (the English, marked).
    expect(lists).toContain(`<span class="summary">${WIDGETS_DE}</span>`);
    expect(lists).toContain(`<span class="summary">${GADGETS_DE}</span>`);
    expect(lists).toContain('<span class="summary" lang="en">Things about sindresorhus/awesome.</span>');
    expect(lists).toContain('Werkzeuge');
    expect(lists).toContain('<span lang="en">Languages</span>');
    const list = (await get('/de/lists/gamma/awesome-broken')).body;
    expect(list).toContain('<p class="summary" lang="en">Things about gamma/awesome-broken.</p>');
    // The suggestion bar's words are on each language's link, in that language.
    const home = (await get('/de')).body;
    expect(home).toContain('hreflang="en" data-suggest="Read this page in English" data-close="Close"');
    expect(home).toMatch(/hreflang="fr" data-suggest="[^"]*fran/i);
    // The counts are in build.json.
    const build = JSON.parse(readFileSync(join(fixture.out, 'd1', 'build.json'), 'utf8')) as {
      translations: Record<string, { summaries: { translated: number; stale: number; missing: number }; categories: { translated: number } }>;
    };
    expect(build.translations.de?.summaries).toMatchObject({ translated: 2, stale: 1, missing: 3 });
    expect(build.translations.de?.categories.translated).toBe(1);
    expect(build.translations.fr?.summaries.translated).toBe(0);
    // The data file holds slugs and our words only.
    const data = JSON.parse(readFileSync(join(fixture.build.paths.assets, '_data/i18n/de.json'), 'utf8')) as unknown;
    expect(data).toEqual({ categories: { tools: 'Werkzeuge' }, summaries: { 'alpha/awesome-widgets': WIDGETS_DE, 'beta/awesome-gadgets': GADGETS_DE } });
  });

  it('changes the build id when a translation changes', async () => {
    const other = await makeFixture({ translations: { 'categories.de.json': { Tools: 'Werkzeug' } } });
    try {
      expect(other.build.buildId).not.toBe(fixture.build.buildId);
    } finally {
      restore(other);
    }
  });
});

describe('prefixes (test 9)', () => {
  it('redirects /en, upper case and a trailing slash, and keeps the language through renames', async () => {
    const cases: [string, string][] = [
      ['/en/lists', '/lists'],
      ['/en', '/'],
      ['/en/lists?category=tools', '/lists?category=tools'],
      ['/ES/lists', '/es/lists'],
      ['/es/', '/es'],
      ['/es/gh/acme/old-rocket', '/es/gh/acme/rocket'],
      ['/de/lists/beta/old-gadgets', '/de/lists/beta/awesome-gadgets'],
    ];
    for (const [from, to] of cases) {
      const r = await get(from);
      expect(r.status, from).toBe(301);
      expect(r.headers.get('Location'), from).toBe(to);
    }
    const search = await get('/ja/search?q=lang:go+rocket');
    expect(search.status).toBe(302);
    expect(search.headers.get('Location')).toBe('/ja/items?q=rocket&lang=go');
    for (const p of ['/xx/lists', '/es/api/quick?q=ro', '/es/healthz', '/es/item?url=https://github.com/acme/rocket']) {
      expect((await get(p)).status, p).toBe(404);
    }
    expect((await get('/xx/lists')).body).toContain('<html lang="en"');
    expect(localeOfPath('/es')).toEqual({ locale: 'es', rest: '/' });
    expect(localeOfPath('/esx/lists')).toEqual({ locale: 'en', rest: '/esx/lists' });
    expect(localeOfPath('/en/lists')).toEqual({ locale: 'en', rest: '/en/lists' });
  });
});

describe('numbers and plurals (test 10)', () => {
  it('formats as each language does', () => {
    const ru = new Loc('ru');
    const forms = p({ one: '{n} список', few: '{n} списка', many: '{n} списков', other: '{n} списка' });
    expect([1, 2, 5, 21, 1000].map((n) => ru.plural(forms, n))).toEqual(['1 список', '2 списка', '5 списков', '21 список', '1 000 списков']);
    expect(new Loc('de').n(116162)).toBe('116.162');
    expect(new Loc('fr').n(116162)).toBe('116 162');
    expect(new Loc('en').n(116162)).toBe('116,162');
    // A language with one form only falls back to `other`.
    expect(new Loc('ja').plural(p({ one: '{n} list', other: '{n} 件' }), 1)).toBe('1 件');
    expect(new Loc('de').day(20605)).toBe('1. Juni 2026');
  });
});

describe('the rule on descriptions (test 17)', () => {
  it('holds in every language and in the translation files', async () => {
    for (const l of LOCALES as readonly Locale[]) {
      for (const route of ['/', '/lists', '/lists/alpha/awesome-widgets', '/gh/acme/rocket', '/items', '/search?q=rocket']) {
        const [path, query] = route.split('?');
        expect((await get(localePath(l, path ?? '/') + (query ? `?${query}` : ''))).body, `${l} ${route}`).not.toContain('DESCRIPTION-MARKER');
      }
    }
    for (const l of LOCALES.filter((x) => x !== 'en')) {
      expect(readFileSync(join(fixture.build.paths.assets, `_data/i18n/${l}.json`), 'utf8')).not.toContain('DESCRIPTION-MARKER');
    }
  });
});
