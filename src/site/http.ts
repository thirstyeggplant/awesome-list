// What every answer carries: headers, the ETag and 304, gzip, and the last rendered answers in memory.
import { gzipSync } from 'node:zlib';

export interface SiteRequest {
  method: string;
  /** The path and query, as sent. */
  url: string;
  headers: Record<string, string | string[] | undefined>;
}

/** What a route answers, before headers. */
export interface Answer {
  status: number;
  type: string;
  body: string | Buffer;
  cache: string;
  location?: string;
}

export interface Reply {
  status: number;
  headers: Record<string, string>;
  body: Buffer;
}

export const TYPES = {
  html: 'text/html; charset=utf-8',
  json: 'application/json; charset=utf-8',
  xml: 'application/xml; charset=utf-8',
  text: 'text/plain; charset=utf-8',
  css: 'text/css; charset=utf-8',
  js: 'text/javascript; charset=utf-8',
} as const;

export const SECURITY_HEADERS: Record<string, string> = {
  'Content-Security-Policy': "default-src 'self'",
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

/** A rendered answer, kept with its gzipped body once it has been asked for. */
export interface Rendered {
  answer: Answer;
  body: Buffer;
  gz?: Buffer;
}

export class Lru<K, V> {
  private readonly map = new Map<K, V>();
  constructor(readonly size: number) {}
  get(key: K): V | undefined {
    const v = this.map.get(key);
    if (v !== undefined) {
      this.map.delete(key);
      this.map.set(key, v);
    }
    return v;
  }
  set(key: K, value: V): void {
    this.map.delete(key);
    this.map.set(key, value);
    if (this.map.size > this.size) {
      const oldest = this.map.keys().next();
      if (!oldest.done) this.map.delete(oldest.value);
    }
  }
  get count(): number {
    return this.map.size;
  }
}

function header(req: SiteRequest, name: string): string {
  const v = req.headers[name];
  return Array.isArray(v) ? v.join(', ') : (v ?? '');
}

export function render(answer: Answer): Rendered {
  return { answer, body: typeof answer.body === 'string' ? Buffer.from(answer.body) : answer.body };
}

const COMPRESSIBLE = /^(text\/|application\/(json|xml))/;

/** The reply to a request: an ETag and 304 for a 200 that may be cached, gzip when asked for. */
export function reply(req: SiteRequest, r: Rendered, etag: string): Reply {
  const { answer } = r;
  const headers: Record<string, string> = {
    ...SECURITY_HEADERS,
    'Content-Type': answer.type,
    'Cache-Control': answer.cache,
  };
  if (answer.location !== undefined) headers.Location = answer.location;
  const tagged = answer.status === 200 && answer.cache !== 'no-store';
  if (tagged) {
    headers.ETag = etag;
    const sent = header(req, 'if-none-match');
    if (sent !== '' && sent.split(',').some((t) => t.trim() === etag || t.trim() === '*')) {
      return { status: 304, headers: { ...headers, 'Content-Type': answer.type }, body: Buffer.alloc(0) };
    }
  }
  let body = r.body;
  if (COMPRESSIBLE.test(answer.type)) {
    headers.Vary = 'Accept-Encoding';
    if (/\bgzip\b/.test(header(req, 'accept-encoding')) && body.length > 0) {
      r.gz ??= gzipSync(body);
      body = r.gz;
      headers['Content-Encoding'] = 'gzip';
    }
  }
  headers['Content-Length'] = String(body.length);
  return { status: answer.status, headers, body: req.method === 'HEAD' ? Buffer.alloc(0) : body };
}
