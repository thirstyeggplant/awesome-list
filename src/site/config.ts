// Settings of the site. The name is a placeholder; the origin and the port come from the environment.

export const SITE_NAME = 'Shelf';

/** This project's own repository, where a list's keeper asks for it to be left out. */
export const PROJECT_REPO = 'https://github.com/thirstyeggplant/awesome-list';

/** Where the site is served from, without a trailing slash. */
export const SITE_ORIGIN = (process.env.SITE_ORIGIN ?? 'http://localhost:8080').replace(/\/+$/, '');

export const PORT = Number(process.env.PORT ?? 8080);

/** The database the server reads, written by `pnpm build-site`. */
export const SITE_DB = process.env.SITE_DB ?? 'out/site.db';

/** Rows on a page of /items and /lists. */
export const PAGE_SIZE = 50;
/** Paging stops here; beyond it the page says to narrow the filters. */
export const MAX_PAGE = 200;
/** At most this many rowids are taken from full-text search for /items?q=. */
export const MAX_MATCHES = 20_000;

/** Item URLs in one items-{n}.xml sitemap. */
export const SITEMAP_CHUNK = 40_000;

/** Rendered answers kept in memory. */
export const LRU_SIZE = 500;

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
  health: 'no-store',
} as const;
