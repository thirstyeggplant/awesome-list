// pnpm serve: the site over node:http.
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { pathToFileURL } from 'node:url';
import { PORT, SITE_DB, SITE_ORIGIN } from './config.js';
import { Site } from './router.js';

export function handler(site: Site): (req: IncomingMessage, res: ServerResponse) => void {
  return (req, res) => {
    const r = site.respond({ method: req.method ?? 'GET', url: req.url ?? '/', headers: req.headers });
    res.writeHead(r.status, r.headers);
    res.end(r.body);
  };
}

export function serve(site: Site, port: number): Promise<Server> {
  const server = createServer(handler(site));
  return new Promise((resolve) => server.listen(port, () => { resolve(server); }));
}

async function main(): Promise<void> {
  const started = performance.now();
  const site = new Site({ dbPath: SITE_DB, origin: SITE_ORIGIN });
  const server = await serve(site, PORT);
  const address = server.address();
  const port = typeof address === 'object' && address !== null ? address.port : PORT;
  console.log(`serving ${SITE_DB} on http://localhost:${port} (ready in ${Math.round(performance.now() - started)} ms)`);
  const stop = (): void => {
    server.close(() => {
      site.close();
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
