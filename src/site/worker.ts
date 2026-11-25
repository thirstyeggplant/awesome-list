// The site as a Cloudflare Worker. Static files (out/site-assets/) are served before it; it reads D1.
import type { D1Database, Fetcher } from '@cloudflare/workers-types';
import { d1Sql } from './adapters/d1.js';
import { createApp, type Handler } from './app.js';

interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  SITE_ORIGIN: string;
  BUILD_ID: string;
}

/** One handler per isolate, made on the first request: what it holds in memory lasts as long as the isolate. */
let app: Handler | null = null;

export default {
  fetch(request: Request, env: Env): Promise<Response> {
    app ??= createApp({
      sql: () => d1Sql(env.DB),
      loadAsset: async (path) => (await env.ASSETS.fetch(new URL(path, 'https://assets.invalid').href)) as unknown as Response,
      origin: env.SITE_ORIGIN,
      buildId: env.BUILD_ID,
    });
    return app(request);
  },
};
