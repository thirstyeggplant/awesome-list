// One address per thing: two lists that name the same project with slightly
// different links should land on the same item.
import type { ItemKind } from './model.js';

export interface Canonical {
  id: string;
  kind: ItemKind;
  host: string;
}

/** First path parts on github.com that are pages of the site, not owners. */
const GITHUB_PAGES = new Set([
  'about', 'apps', 'blog', 'collections', 'contact', 'customer-stories', 'enterprise', 'events',
  'explore', 'features', 'join', 'login', 'marketplace', 'new', 'notifications', 'orgs',
  'organizations', 'pricing', 'pulls', 'issues', 'search', 'security', 'settings', 'site',
  'sponsors', 'topics', 'trending', 'users',
]);

const KIND_BY_HOST: readonly (readonly [ItemKind, readonly string[]])[] = [
  ['package', [
    'npmjs.com', 'npmjs.org', 'pypi.org', 'pypi.python.org', 'crates.io', 'rubygems.org',
    'cran.r-project.org', 'metacpan.org', 'pkg.go.dev', 'packagist.org', 'nuget.org', 'hex.pm',
  ]],
  ['video', ['youtube.com', 'youtu.be', 'vimeo.com']],
  ['paper', ['arxiv.org', 'doi.org', 'acm.org', 'ieee.org', 'openreview.net']],
  ['article', ['medium.com', 'dev.to', 'substack.com', 'wikipedia.org']],
];

function hostIs(host: string, domain: string): boolean {
  return host === domain || host.endsWith(`.${domain}`);
}

export function kindOfHost(host: string): ItemKind {
  for (const [kind, domains] of KIND_BY_HOST) {
    if (domains.some((d) => hostIs(host, d))) return kind;
  }
  return 'site';
}

/** `owner/repo` when the address is the root of a repository on github.com. */
export function githubRepoOf(raw: string): { owner: string; repo: string } | null {
  const c = canonicalUrl(raw);
  if (c?.kind !== 'repo') return null;
  const [owner, repo] = c.id.slice('https://github.com/'.length).split('/');
  return owner && repo ? { owner, repo } : null;
}

const NAME_PART = /^[a-z0-9][a-z0-9._-]*$/i;

export function canonicalUrl(raw: string): Canonical | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
  if (url.hostname === '') return null;

  const host = url.hostname.toLowerCase().replace(/^www\./, '');
  const port = url.port ? `:${url.port}` : '';

  let path = url.pathname.replace(/\/+$/, '');
  if (path.toLowerCase().endsWith('.git')) path = path.slice(0, -4);

  const parts = path.split('/').filter((p) => p !== '');
  if (host === 'github.com' && parts.length === 2) {
    const [owner = '', repo = ''] = parts;
    if (!GITHUB_PAGES.has(owner.toLowerCase()) && NAME_PART.test(owner) && NAME_PART.test(repo)) {
      return { id: `https://github.com/${owner}/${repo}`.toLowerCase(), kind: 'repo', host };
    }
  }

  let search = url.search;
  const tracking = [...url.searchParams.keys()].filter((k) => k.toLowerCase().startsWith('utm_'));
  if (tracking.length > 0) {
    for (const k of tracking) url.searchParams.delete(k);
    search = url.searchParams.size > 0 ? `?${url.searchParams.toString()}` : '';
  }
  if (search === '?') search = '';

  const hash = url.hash.toLowerCase() === '#readme' || url.hash === '#' ? '' : url.hash;

  return { id: `${url.protocol}//${host}${port}${path}${search}${hash}`, kind: kindOfHost(host), host };
}
