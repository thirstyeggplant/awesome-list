// The static files that ship with the Worker beside the database it reads: the assets, the facet arrays,
// the terms, the translations, the sitemaps, robots.txt, the icons and _headers. Written at build into out/site-assets/.
import { createHash } from 'node:crypto';
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { AI_CRAWLERS, CACHE, SITEMAP_CHUNK, SITE_NAME } from '../config.js';
import { escape } from '../html.js';
import { SECURITY_HEADERS } from '../http.js';
import { isoDay } from '../i18n/format.js';
import { alternates } from '../i18n/indexing.js';
import { LOCALES, localePath, type Locale } from '../i18n/locales.js';

/** The site's own CSS, scripts and share image, each at /assets/{hash}/{name}. */
export interface AssetFile { name: string; hash: string; path: string; body: Buffer }

/** Files written at the root, unhashed, because browsers ask for them by these names. */
export const ROOT_FILES = ['favicon.ico', 'favicon.svg', 'apple-touch-icon.png', 'site.webmanifest'] as const;
/** The root files kept in src/site/assets/; the manifest is written from the site's name. */
const ICONS = ROOT_FILES.filter((f) => f !== 'site.webmanifest');

export function readAssets(dir: string): AssetFile[] {
  return readdirSync(dir)
    .filter((name) => ['.css', '.js', '.png'].includes(extname(name)) && !(ROOT_FILES as readonly string[]).includes(name))
    .sort()
    .map((name) => {
      const body = readFileSync(join(dir, name));
      const hash = createHash('sha256').update(body).digest('hex').slice(0, 10);
      return { name, hash, path: `/assets/${hash}/${name}`, body };
    });
}

/** The icons and the manifest, by their root path. */
export function readRootFiles(dir: string, siteName: string): Map<string, Buffer | string> {
  const files = new Map<string, Buffer | string>(ICONS.map((name) => [`/${name}`, readFileSync(join(dir, name))]));
  files.set('/site.webmanifest', manifest(siteName));
  return files;
}

/** The web app manifest: English only; the site is not an installable app. */
export function manifest(siteName: string): string {
  const paper = '#faf8f3';
  return `${JSON.stringify(
    {
      name: siteName,
      short_name: siteName,
      start_url: '/',
      display: 'browser',
      background_color: paper,
      theme_color: paper,
      icons: [
        { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' },
        { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      ],
    },
    null,
    2,
  )}\n`;
}

export interface SitemapList {
  slug: string;
  /** The day of the list's last push (days since 1970-01-01): when its content last changed. */
  pushedDay: number | null;
}

export interface SitemapSource {
  origin: string;
  /** The data date, YYYY-MM-DD. */
  dataDay: string;
  /** Category slugs, for the category pages. */
  categories: readonly string[];
  lists: readonly SitemapList[];
  owners: readonly string[];
  /** One-filter pages of /items worth finding (browse.xml, English only): addresses with their query. */
  browse?: readonly string[];
  itemKeys: readonly string[];
  /** Item URLs in one items-{n}.xml. */
  chunk?: number;
}

const HEAD = '<?xml version="1.0" encoding="UTF-8"?>\n';

interface Entry {
  /** The path and query, unprefixed. */
  address: string;
  lastmod?: string;
  /** Write the eleven hreflang alternates of a page that is indexed in every language. */
  alternates?: boolean;
  /** The language of this address, when not the file's. */
  locale?: Locale;
}

function split(address: string): [string, string] {
  const i = address.indexOf('?');
  return i === -1 ? [address, ''] : [address.slice(0, i), address.slice(i)];
}

function urlset(origin: string, entries: readonly Entry[], locale: Locale = 'en'): { body: string; lastmod: string | null } {
  let latest: string | null = null;
  const urls = entries.map((e) => {
    const [path, query] = split(e.address);
    if (e.lastmod !== undefined && (latest === null || e.lastmod > latest)) latest = e.lastmod;
    const links = e.alternates
      ? alternates(origin, path, query).map((a) => `<xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${escape(a.href)}"/>`).join('')
      : '';
    const lastmod = e.lastmod === undefined ? '' : `<lastmod>${e.lastmod}</lastmod>`;
    return `<url><loc>${escape(origin + localePath(e.locale ?? locale, path) + query)}</loc>${lastmod}${links}</url>`;
  });
  const xhtml = entries.some((e) => e.alternates) ? ' xmlns:xhtml="http://www.w3.org/1999/xhtml"' : '';
  return {
    body: `${HEAD}<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"${xhtml}>\n${urls.join('\n')}\n</urlset>\n`,
    lastmod: latest,
  };
}

/** The pages with words of ours that are not lists: offered in every language. */
export function pageAddresses(categories: readonly string[]): string[] {
  return ['/', '/lists', '/items', '/about', ...categories.map((c) => `/lists?category=${c}`)];
}

/**
 * /sitemap.xml (an index) and /sitemaps/{pages, lists-{code}, browse, owners, items-n}.xml, by path. Pages and lists are
 * in every language with their alternates; owners and items are English only (their other languages point their
 * canonical at the English). List pages carry their last push as lastmod (never after the data date), the other
 * pages the data date; owners and items none, since nothing records when their pages changed.
 */
export function sitemaps(s: SitemapSource): Map<string, string> {
  const chunk = s.chunk ?? SITEMAP_CHUNK;
  const { origin, dataDay } = s;
  const files = new Map<string, { body: string; lastmod: string | null }>();
  const pages = pageAddresses(s.categories).map((address): Entry => ({ address, lastmod: dataDay, alternates: true }));
  files.set('pages.xml', urlset(origin, LOCALES.flatMap((locale) => pages.map((p) => ({ ...p, locale })))));
  const lists = s.lists.map((l): Entry => {
    const day = l.pushedDay === null ? null : isoDay(l.pushedDay);
    const e: Entry = { address: `/lists/${l.slug}`, alternates: true };
    if (day !== null) e.lastmod = day < dataDay ? day : dataDay;
    return e;
  });
  for (const l of LOCALES) files.set(`lists-${l}.xml`, urlset(origin, lists, l));
  files.set('browse.xml', urlset(origin, (s.browse ?? []).map((address) => ({ address }))));
  files.set('owners.xml', urlset(origin, s.owners.map((o) => ({ address: `/gh/${o}` }))));
  for (let n = 1; (n - 1) * chunk < s.itemKeys.length; n++) {
    files.set(`items-${n}.xml`, urlset(origin, s.itemKeys.slice((n - 1) * chunk, n * chunk).map((k) => ({ address: `/${k}` }))));
  }
  const index = [...files].map(
    ([n, f]) => `<sitemap><loc>${escape(`${origin}/sitemaps/${n}`)}</loc>${f.lastmod === null ? '' : `<lastmod>${f.lastmod}</lastmod>`}</sitemap>`,
  );
  const out = new Map<string, string>([
    ['/sitemap.xml', `${HEAD}<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${index.join('\n')}\n</sitemapindex>\n`],
  ]);
  for (const [name, f] of files) out.set(`/sitemaps/${name}`, f.body);
  return out;
}

/**
 * robots.txt: everything but the quick-search API, the data files and search, in every language. One group, so the
 * answer engines and AI crawlers it names get the same rules as everyone, and a line that says they are welcome.
 */
export function robots(origin: string): string {
  const search = LOCALES.map((l) => `Disallow: ${localePath(l, '/search')}`);
  return [
    `# ${SITE_NAME} welcomes search engines, answer engines and AI crawlers. See /llms.txt.`,
    'User-agent: *',
    ...AI_CRAWLERS.map((c) => `User-agent: ${c}`),
    'Allow: /', 'Disallow: /api/', 'Disallow: /_data/', ...search, '', `Sitemap: ${origin}/sitemap.xml`, '',
  ].join('\n');
}

/** What llms.txt and a list's Markdown copy are written from: English only, our words and the facts. */
export interface PlainList {
  slug: string;
  name: string;
  summary: string | null;
  category: string | null;
  stars: number | null;
  pushedDay: number | null;
  license: string | null;
  status: string;
  readmeOid: string | null;
  itemsMade: number;
  sectionCount: number;
}

export interface PlainEntry {
  name: string;
  url: string;
  key: string;
  lang: string | null;
  stars: number | null;
  pushedDay: number | null;
  license: string | null;
  listCount: number;
  status: string | null;
  /** The section's path, outermost first; empty for entries before the first heading. */
  path: readonly string[];
}

const num = (n: number): string => n.toLocaleString('en-US');

/** A name as Markdown link text: brackets and backslashes escaped, one line. */
export function mdText(text: string): string {
  return text.replace(/[\r\n]+/g, ' ').replace(/[\\[\]]/g, (c) => `\\${c}`).trim();
}

/** An address as a Markdown link target: http(s) only, with what would end the target written as escapes. */
function mdUrl(url: string): string | null {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
  return u.href.replace(/[ ()<>]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}

/**
 * /lists/{owner}/{repo}.md: the whole list as Markdown, by section, with the facts we hold for each entry. English
 * only; never a curator's description. Heading levels follow the section's depth.
 */
export function listMarkdown(origin: string, dataDay: string, list: PlainList, entries: readonly PlainEntry[]): string {
  const out: string[] = [`# ${mdText(list.name)} (${list.slug})`, ''];
  if (list.summary !== null) out.push(`> ${mdText(list.summary)}`, '');
  const oid = list.readmeOid?.slice(0, 7);
  out.push(`- Source: https://github.com/${list.slug}${oid ? ` (read at commit ${oid} on ${dataDay})` : ''}. The selection and order are its curators'.`);
  out.push(`- This index: ${origin}/lists/${list.slug}`);
  const facts = [`${num(entries.length || list.itemsMade)} entries in ${num(list.sectionCount)} sections.`];
  if (list.stars !== null) facts.push(`${num(list.stars)} stars.`);
  if (list.pushedDay !== null) facts.push(`Last push ${isoDay(list.pushedDay) < dataDay ? isoDay(list.pushedDay) : dataDay}.`);
  if (list.license !== null) facts.push(`Licence ${list.license}.`);
  out.push(`- ${facts.join(' ')}`);
  out.push(`- Facts are from GitHub as of ${dataDay}. No descriptions are copied from the list.`);
  if (list.status === 'unparsed') {
    out.push('', 'The entries of this list could not be read yet.', '');
    return out.join('\n');
  }
  let shown: readonly string[] = [];
  for (const e of entries) {
    // Headings for the parts of the path not shown yet.
    let same = 0;
    while (same < e.path.length && same < shown.length && e.path[same] === shown[same]) same++;
    if (same < e.path.length || e.path.length !== shown.length) {
      for (let d = same; d < e.path.length; d++) out.push('', `${'#'.repeat(Math.min(6, d + 2))} ${mdText(e.path[d] ?? '')}`);
      out.push('');
      shown = e.path;
    }
    const url = mdUrl(e.url);
    const parts = [url === null ? mdText(e.name) : `[${mdText(e.name)}](${url})`];
    if (e.lang !== null) parts.push(e.lang);
    if (e.stars !== null) parts.push(`${num(e.stars)} stars`);
    if (e.pushedDay !== null) parts.push(`pushed ${isoDay(e.pushedDay)}`);
    if (e.license !== null) parts.push(e.license);
    if (e.listCount >= 2) parts.push(`in ${num(e.listCount)} lists`);
    if (e.status === 'archived' || e.status === 'quiet' || e.status === 'gone') parts.push(e.status);
    parts.push(`${origin}/${e.key}`);
    out.push(`- ${parts.join(' · ')}`);
  }
  out.push('');
  return out.join('\n');
}

/** /llms.txt: what the site is, how to read its addresses, and every list by category, in the llms.txt form. */
export function llmsTxt(
  origin: string, dataDay: string, counts: { lists: number; items: number }, categories: readonly string[], lists: readonly PlainList[],
): string {
  const out = [
    `# ${SITE_NAME}`,
    '',
    `> An index of ${num(counts.lists)} awesome lists from GitHub and the ${num(counts.items)} projects they name: names, sections, links and`,
    '> facts from GitHub (stars, last push, language, licence). It copies no descriptions from the lists.',
    `> Data as of ${dataDay}; rebuilt every night.`,
    '',
    'How to read this site:',
    '',
    `- A list: ${origin}/lists/{owner}/{repo}. The same address with \`.md\` is the whole list as Markdown, by section.`,
    `- A GitHub repository: ${origin}/gh/{owner}/{repo}. Anything else a list names: ${origin}/item/{id};`,
    `  ${origin}/item?url={address} redirects to it.`,
    `- Projects by language, topic or licence: ${origin}/items?lang=go, ?topic=cli, ?license=mit.`,
    "- A list's selection and order are its curators'. Cite the list on GitHub for those; cite",
    `  ${SITE_NAME} for counts, for which lists name a project, and for the date of the facts.`,
    '',
    '## Start',
    '',
    `- [About](${origin}/about): what is shown, where it comes from, coverage`,
    `- [All lists](${origin}/lists)`,
    `- [All projects](${origin}/items)`,
  ];
  const line = (l: PlainList): string => {
    const facts = [l.status === 'unparsed' ? 'entries not read yet' : `${num(l.itemsMade)} items`];
    if (l.stars !== null) facts.push(`${num(l.stars)} stars`);
    return `- [${mdText(l.name)}](${origin}/lists/${l.slug}.md): ${l.summary === null ? '' : `${mdText(l.summary)} `}${facts.join(', ')}. Source: github.com/${l.slug}`;
  };
  for (const c of [...categories, null]) {
    const of = lists.filter((l) => l.category === c);
    if (of.length === 0) continue;
    out.push('', `## ${c === null ? 'Other lists' : mdText(c)}`, '', ...of.map(line));
  }
  out.push('', '## Optional', '', `- [Sitemap](${origin}/sitemap.xml)`, '');
  return out.join('\n');
}

/** Headers for the static files, in Cloudflare's _headers format. The Worker sets its own. */
export function headersFile(): string {
  return [
    '/*',
    '  X-Content-Type-Options: nosniff',
    `  Strict-Transport-Security: ${SECURITY_HEADERS['Strict-Transport-Security'] ?? ''}`,
    '/assets/*',
    `  Cache-Control: ${CACHE.asset}`,
    '/sitemap.xml',
    `  Cache-Control: ${CACHE.crawl}`,
    '/sitemaps/*',
    `  Cache-Control: ${CACHE.crawl}`,
    '/robots.txt',
    `  Cache-Control: ${CACHE.crawl}`,
    '/llms.txt',
    `  Cache-Control: ${CACHE.crawl}`,
    '  Content-Type: text/markdown; charset=utf-8',
    // Only static files: the Markdown copies of the lists. The Worker's list pages are not static, so untouched.
    '/lists/*',
    `  Cache-Control: ${CACHE.crawl}`,
    '  Content-Type: text/markdown; charset=utf-8',
    '  X-Robots-Tag: noindex',
    ...ROOT_FILES.flatMap((name) => [`/${name}`, `  Cache-Control: ${CACHE.icon}`]),
    '',
  ].join('\n');
}

export function writeFile(root: string, path: string, body: string | Uint8Array): number {
  const file = join(root, path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, body);
  return typeof body === 'string' ? Buffer.byteLength(body) : body.length;
}
