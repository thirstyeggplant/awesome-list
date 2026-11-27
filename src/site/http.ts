// What every answer of the site carries: the security headers, Cache-Control, and the ETag on a 200 that may be
// kept. The ETag is the build id, so a 304 is one comparison, made before any query. Compression is the
// platform's (Cloudflare's, or none locally): no Content-Encoding, Content-Length or Vary here.

/** What a route answers, before headers. */
export interface Answer {
  status: number;
  type: string;
  body: string;
  cache: string;
  location?: string;
  /** The page's language, sent as Content-Language (informative only). */
  lang?: string;
}

export const TYPES = {
  html: 'text/html; charset=utf-8',
  json: 'application/json; charset=utf-8',
  xml: 'application/xml; charset=utf-8',
  text: 'text/plain; charset=utf-8',
  css: 'text/css; charset=utf-8',
  js: 'text/javascript; charset=utf-8',
} as const;

export const SECURITY_HEADERS: Readonly<Record<string, string>> = {
  'Content-Security-Policy': "default-src 'self'",
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  // HTTPS only, for a year, this host alone. A browser ignores it on a plain-http answer (RFC 6797, 8.1), so it
  // does nothing to `pnpm serve` on http://localhost.
  'Strict-Transport-Security': 'max-age=31536000',
};

/** Hosts answered over plain http: this computer, for `pnpm serve`. Every other host is sent to https first. */
const PLAIN_HTTP_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

/** The https address of a plain-http request to another host than this computer, else null. */
export function httpsAddress(url: URL): string | null {
  if (url.protocol !== 'http:' || PLAIN_HTTP_HOSTS.has(url.hostname)) return null;
  const to = new URL(url.href);
  to.protocol = 'https:';
  to.port = '';
  return to.href;
}

export function etagOf(buildId: string): string {
  return `W/"${buildId}"`;
}

/** Whether the request's If-None-Match names this ETag. */
export function matches(req: Request, etag: string): boolean {
  const sent = req.headers.get('if-none-match');
  if (sent === null || sent === '') return false;
  return sent.split(',').some((t) => t.trim() === etag || t.trim() === '*');
}

function headersOf(type: string, cache: string): Headers {
  const h = new Headers(SECURITY_HEADERS);
  h.set('Content-Type', type);
  h.set('Cache-Control', cache);
  return h;
}

/** The 304 for an address whose answer has not changed since the build that made the client's copy. */
export function notModified(etag: string, type: string, cache: string): Response {
  const h = headersOf(type, cache);
  h.set('ETag', etag);
  return new Response(null, { status: 304, headers: h });
}

/** The reply to a request: the ETag on a 200 that may be kept; no body for HEAD. */
export function reply(req: Request, answer: Answer, etag: string | null): Response {
  const h = headersOf(answer.type, answer.cache);
  if (answer.location !== undefined) h.set('Location', answer.location);
  if (answer.lang !== undefined) h.set('Content-Language', answer.lang);
  if (etag !== null && answer.status === 200 && answer.cache !== 'no-store') h.set('ETag', etag);
  return new Response(req.method === 'HEAD' ? null : answer.body, { status: answer.status, headers: h });
}
