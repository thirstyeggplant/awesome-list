// Settings of the site. The name is a placeholder; the origin comes from the environment where the site runs
// (SITE_ORIGIN: a Worker variable, or the environment of `pnpm build-site` and `pnpm serve`).

export const SITE_NAME = 'Shelf';

/** This project's own repository, where a list's keeper asks for it to be left out. */
export const PROJECT_REPO = 'https://github.com/thirstyeggplant/awesome-list';

/** Rows on a page of /items and /lists. */
export const PAGE_SIZE = 50;
/** Paging stops here; beyond it the page says to narrow the filters. */
export const MAX_PAGE = 200;
/** At most this many rowids are taken from full-text search for /items?q=. */
export const MAX_MATCHES = 20_000;

/** Item URLs in one items-{n}.xml sitemap. */
export const SITEMAP_CHUNK = 40_000;

/** Item ids kept for an owner page (its own list of their projects). */
export const OWNER_ITEMS = 100;

/** The origin when SITE_ORIGIN is not set. */
export const LOCAL_ORIGIN = 'http://localhost:8080';

/** Listed alongside: the top this many are kept. */
export const ALONGSIDE_KEEP = 12;
/** In a section of more than this many entries only the neighbours by position count. */
export const ALONGSIDE_BIG_SECTION = 80;
/** How many on each side count in a big section. */
export const ALONGSIDE_WINDOW = 5;

/** A repository with no push in this many days is quiet (as in the data). */
export const QUIET_DAYS = 730;

export const CACHE = {
  html: 'public, max-age=300, s-maxage=86400, stale-while-revalidate=604800',
  quick: 'public, max-age=3600, s-maxage=86400',
  asset: 'public, max-age=31536000, immutable',
  crawl: 'public, max-age=3600, s-maxage=86400',
  notFound: 'public, max-age=60',
  /** The icons and the manifest, at fixed addresses. */
  icon: 'public, max-age=86400',
  health: 'no-store',
  /** The redirect from plain http to https. */
  toHttps: 'public, max-age=3600',
} as const;

/**
 * Topics that say nothing about a project (or only repeat its language): left out of a row's chips, the topic
 * facet and the browse sitemap. They stay in the data, on the item page and in search.
 */
export const TOPIC_STOP: ReadonlySet<string> = new Set(['hacktoberfest', 'awesome', 'awesome-list', 'awesome-lists', 'list', 'lists', 'golang']);
