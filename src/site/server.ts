// pnpm serve: the site on this computer, as the Worker serves it. A node:http bridge to the same handler,
// with the static files of out/site-assets/ served first (and their _headers), as Cloudflare does.
// Environment: PORT (8080), SITE_DB (out/site.db), SITE_ASSETS (out/site-assets), SITE_ORIGIN.
import { readFile, stat } from 'node:fs/promises';
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { extname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { fileAssets, fileOf, nodeSql } from './adapters/node.js';
import { createApp, type Handler } from './app.js';
import { LOCAL_ORIGIN } from './config.js';

const STATIC_TYPES: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.bin': 'application/octet-stream',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json',
};

interface HeaderRule { pattern: RegExp; headers: [string, string][] }

/** Cloudflare's _headers file: a path (with * as a wildcard), then indented `Name: value` lines. */
export function parseHeaders(text: string): HeaderRule[] {
  const rules: HeaderRule[] = [];
  for (const line of text.split('\n')) {
    if (line.trim() === '' || line.trim().startsWith('#')) continue;
    if (!/^\s/.test(line)) {
      const re = line.trim().replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
      rules.push({ pattern: new RegExp(`^${re}$`), headers: [] });
      continue;
    }
    const m = /^\s+([^:]+):\s*(.*)$/.exec(line);
    const rule = rules[rules.length - 1];
    if (m && rule) rule.headers.push([m[1] ?? '', m[2] ?? '']);
  }
  return rules;
}

/** Static files first, then the site. */
export async function nodeHandler(assetsDir: string, app: Handler): Promise<Handler> {
  let rules: HeaderRule[];
  try {
    rules = parseHeaders(await readFile(join(assetsDir, '_headers'), 'utf8'));
  } catch {
    rules = [];
  }
  return async (req) => {
    const path = new URL(req.url).pathname;
    const file = path === '/_headers' || path.endsWith('/') ? null : fileOf(assetsDir, path);
    if (file !== null && (req.method === 'GET' || req.method === 'HEAD')) {
      const info = await stat(file).catch(() => null);
      if (info?.isFile()) {
        const headers = new Headers({ 'Content-Type': STATIC_TYPES[extname(file)] ?? 'application/octet-stream' });
        for (const rule of rules) if (rule.pattern.test(path)) for (const [k, v] of rule.headers) headers.set(k, v);
        return new Response(req.method === 'HEAD' ? null : await readFile(file), { headers });
      }
    }
    return app(req);
  };
}

/** node:http to a Request, and the Response back. */
export function bridge(handler: Handler): (req: IncomingMessage, res: ServerResponse) => void {
  return (req, res) => {
    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers)) {
      if (v !== undefined) headers.set(k, Array.isArray(v) ? v.join(', ') : v);
    }
    const url = `http://${req.headers.host ?? 'localhost'}${req.url ?? '/'}`;
    handler(new Request(url, { method: req.method ?? 'GET', headers }))
      .then(async (r) => {
        const body = r.body === null ? null : Buffer.from(await r.arrayBuffer());
        res.writeHead(r.status, Object.fromEntries(r.headers));
        res.end(body);
      })
      .catch((e: unknown) => {
        console.error(e);
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Something went wrong\n');
      });
  };
}

export function serve(handler: Handler, port: number): Promise<Server> {
  const server = createServer(bridge(handler));
  return new Promise((resolve) => server.listen(port, () => { resolve(server); }));
}

async function main(): Promise<void> {
  const started = performance.now();
  const port = Number(process.env.PORT ?? 8080);
  const dbPath = process.env.SITE_DB ?? 'out/site.db';
  const assetsDir = process.env.SITE_ASSETS ?? 'out/site-assets';
  const origin = (process.env.SITE_ORIGIN ?? LOCAL_ORIGIN).replace(/\/+$/, '');
  const sql = nodeSql(dbPath);
  const app = createApp({ sql: () => sql, loadAsset: fileAssets(assetsDir), origin });
  const server = await serve(await nodeHandler(assetsDir, app), port);
  const address = server.address();
  const shown = typeof address === 'object' && address !== null ? address.port : port;
  console.log(`serving ${dbPath} and ${assetsDir} on http://localhost:${shown} (ready in ${Math.round(performance.now() - started)} ms)`);
  const stop = (): void => {
    server.close(() => {
      sql.close();
      process.exit(0);
    });
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e: unknown) => {
    console.error(e);
    process.exit(1);
  });
}
