// Keeps the last answer about every repository on disk. Online, answers are
// asked for and written down; offline, only what was written down is used.
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { keyOf, type GitHub, type LookupOptions, type RepoLookup, type RepoName } from './github.js';

/** How many repositories are asked about between two writes of the cache. */
const SAVE_EVERY = 2000;

export class CachedGitHub implements GitHub {
  constructor(
    private readonly inner: GitHub | null,
    private readonly cacheDir: string,
  ) {}

  get pointsSpent(): number {
    return this.inner?.pointsSpent ?? 0;
  }

  private file(options: LookupOptions): string {
    return join(this.cacheDir, 'github', options.withTree ? 'lists.json' : 'repos.json');
  }

  private async load(options: LookupOptions): Promise<Record<string, RepoLookup>> {
    try {
      return JSON.parse(await readFile(this.file(options), 'utf8')) as Record<string, RepoLookup>;
    } catch {
      return {};
    }
  }

  async lookup(names: readonly RepoName[], options: LookupOptions): Promise<Map<string, RepoLookup>> {
    const saved = await this.load(options);
    if (this.inner === null) {
      return new Map(
        names.map((n) => [keyOf(n), saved[keyOf(n)] ?? { kind: 'failed', message: 'not in the cache (offline)' }]),
      );
    }
    // Asked in parts, and written down after each, so a run that stops keeps what it learned.
    const fresh = new Map<string, RepoLookup>();
    for (let i = 0; i < names.length; i += SAVE_EVERY) {
      const part = await this.inner.lookup(names.slice(i, i + SAVE_EVERY), options);
      for (const [key, value] of part) {
        fresh.set(key, value);
        if (value.kind !== 'failed') saved[key] = value;
      }
      await this.save(options, saved);
    }
    return fresh;
  }

  private async save(options: LookupOptions, saved: Record<string, RepoLookup>): Promise<void> {
    await mkdir(join(this.cacheDir, 'github'), { recursive: true });
    const target = this.file(options);
    await writeFile(`${target}.part`, JSON.stringify(saved));
    await rename(`${target}.part`, target);
  }
}
