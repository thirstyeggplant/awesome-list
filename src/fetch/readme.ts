// Finding a list's readme among the files at its root, and downloading it
// from raw.githubusercontent.com at a fixed commit, kept on disk so that a
// second run reads what it already has.
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { TreeEntry } from './github.js';

export interface ReadmeFile {
  path: string;
  /** Only Markdown is read for now; the others are marked unparsed. */
  markdown: boolean;
}

const MARKDOWN = ['.md', '.markdown', '.mdown', '.mkd', ''];
const OTHER = ['.rst', '.org', '.textile', '.adoc', '.asciidoc', '.txt', '.rdoc', '.pod', '.wiki', '.creole', '.mediawiki'];

/** The readme at the root, Markdown first. */
export function pickReadme(entries: readonly TreeEntry[]): ReadmeFile | null {
  const candidates = entries
    .filter((e) => e.type === 'blob' && /^readme(\.[a-z]+)?$/i.test(e.name))
    .map((e) => ({ name: e.name, ext: (/\.[a-z]+$/i.exec(e.name)?.[0] ?? '').toLowerCase() }));
  for (const ext of MARKDOWN) {
    const hit = candidates.find((c) => c.ext === ext);
    if (hit) return { path: hit.name, markdown: true };
  }
  for (const ext of OTHER) {
    const hit = candidates.find((c) => c.ext === ext);
    if (hit) return { path: hit.name, markdown: false };
  }
  const first = candidates[0];
  return first ? { path: first.name, markdown: false } : null;
}

/** Fetches a text over HTTP; tests give a stand-in. */
export type Download = (url: string) => Promise<{ status: number; text: string }>;

export const fetchDownload: Download = async (url) => {
  try {
    const response = await fetch(url, {
      headers: { 'user-agent': 'awesome-list-data-pipeline' },
      signal: AbortSignal.timeout(60_000),
    });
    return { status: response.status, text: response.status === 200 ? await response.text() : '' };
  } catch {
    // A timeout or a dropped connection: answered as a server error, so it is tried again.
    return { status: 599, text: '' };
  }
};

export class NotCached extends Error {}

export interface FileStoreOptions {
  cacheDir: string;
  download: Download;
  offline: boolean;
  retries?: number;
  sleep?: (ms: number) => Promise<void>;
}

function safePart(text: string): string {
  return text.replace(/[^A-Za-z0-9._-]/g, '_').toLowerCase();
}

/** Files of repositories at a given commit, cached by repository, commit and path. */
export class FileStore {
  constructor(private readonly options: FileStoreOptions) {}

  cachePath(owner: string, repo: string, commit: string, path: string): string {
    return join(this.options.cacheDir, 'files', `${safePart(owner)}__${safePart(repo)}`, safePart(commit), safePart(path));
  }

  /** The file's text, or null when the server says it is not there. */
  async read(owner: string, repo: string, commit: string, path: string): Promise<string | null> {
    const cached = this.cachePath(owner, repo, commit, path);
    try {
      return await readFile(cached, 'utf8');
    } catch {
      if (this.options.offline) throw new NotCached(`${owner}/${repo}: ${path} at ${commit.slice(0, 7)} is not in the cache`);
    }
    const encoded = path.split('/').map(encodeURIComponent).join('/');
    const url = `https://raw.githubusercontent.com/${owner}/${repo}/${commit}/${encoded}`;
    const retries = this.options.retries ?? 2;
    const sleep = this.options.sleep ?? ((ms: number) => new Promise((r) => setTimeout(r, ms)));
    for (let attempt = 0; ; attempt += 1) {
      const response = await this.options.download(url);
      if (response.status === 200) {
        await mkdir(dirname(cached), { recursive: true });
        await writeFile(`${cached}.part`, response.text);
        await rename(`${cached}.part`, cached);
        return response.text;
      }
      if (response.status === 404) return null;
      if (attempt >= retries) throw new Error(`${url} answered HTTP ${response.status}`);
      await sleep(1000 * 2 ** attempt);
    }
  }
}
