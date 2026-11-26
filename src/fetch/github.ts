// Facts about repositories from GitHub's GraphQL API, a hundred to a query.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { z } from 'zod';

export interface RepoName {
  owner: string;
  repo: string;
}

export interface TreeEntry {
  name: string;
  type: string;
}

export interface RepoInfo {
  nameWithOwner: string;
  stars: number;
  pushedAt: string | null;
  archived: boolean;
  fork: boolean;
  license: string | null;
  language: string | null;
  topics: string[];
  description: string | null;
  defaultBranch: string | null;
  headOid: string | null;
  /** Files at the root of the default branch; asked for lists only. */
  rootEntries?: TreeEntry[];
}

export type RepoLookup =
  | { kind: 'found'; info: RepoInfo }
  | { kind: 'gone' }
  | { kind: 'failed'; message: string };

export interface LookupOptions {
  /** Also ask for the files at the root, to find a readme. */
  withTree: boolean;
}

/** What the pipeline needs from GitHub. Tests hand in a stand-in. */
export interface GitHub {
  lookup(names: readonly RepoName[], options: LookupOptions): Promise<Map<string, RepoLookup>>;
  /** GraphQL points spent so far by this client. */
  readonly pointsSpent: number;
}

export function keyOf(name: RepoName): string {
  return `${name.owner}/${name.repo}`.toLowerCase();
}

/** One HTTP exchange; the real one is fetch, tests give their own. */
export type Transport = (body: string, token: string) => Promise<{ status: number; retryAfter: string | null; text: string }>;

/** A query that has not been answered in this long is given up as timed out. */
const QUERY_TIMEOUT_MS = 60_000;

export const fetchTransport: Transport = async (body, token) => {
  try {
    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        authorization: `bearer ${token}`,
        'content-type': 'application/json',
        'user-agent': 'awesome-list-data-pipeline',
      },
      body,
      signal: AbortSignal.timeout(QUERY_TIMEOUT_MS),
    });
    return { status: response.status, retryAfter: response.headers.get('retry-after'), text: await response.text() };
  } catch (error) {
    // A timeout or a dropped connection is treated as the gateway timing out.
    return { status: 504, retryAfter: null, text: error instanceof Error ? error.message : String(error) };
  }
};

export class PointsTooLow extends Error {
  constructor(remaining: number, floor: number, resetAt: string) {
    super(
      `GitHub says ${remaining} GraphQL points are left this hour, under the floor of ${floor}. ` +
        `Stopping here; they come back at ${resetAt}. Run again after that.`,
    );
    this.name = 'PointsTooLow';
  }
}

const RateLimit = z.object({ cost: z.number(), remaining: z.number(), resetAt: z.string() });

const RepoNode = z.object({
  nameWithOwner: z.string(),
  stargazerCount: z.number(),
  pushedAt: z.string().nullable(),
  isArchived: z.boolean(),
  isFork: z.boolean(),
  description: z.string().nullable(),
  licenseInfo: z.object({ spdxId: z.string().nullable() }).nullable(),
  primaryLanguage: z.object({ name: z.string() }).nullable(),
  repositoryTopics: z.object({ nodes: z.array(z.object({ topic: z.object({ name: z.string() }) })) }),
  defaultBranchRef: z.object({ name: z.string(), target: z.object({ oid: z.string() }).nullable() }).nullable().optional(),
  object: z.object({ entries: z.array(z.object({ name: z.string(), type: z.string() })).optional() }).nullable().optional(),
});

const Answer = z.object({
  data: z.record(z.string(), z.unknown()).nullable().optional(),
  errors: z
    .array(z.object({ type: z.string().optional(), path: z.array(z.union([z.string(), z.number()])).optional(), message: z.string() }))
    .optional(),
});

const SAFE_NAME = /^[A-Za-z0-9._-]+$/;

const REPO_FIELDS = `nameWithOwner stargazerCount pushedAt isArchived isFork description
licenseInfo { spdxId } primaryLanguage { name }
repositoryTopics(first: 10) { nodes { topic { name } } }`;
/** Asked for lists only: where the readme is, and at which commit. */
const LIST_FIELDS = 'defaultBranchRef { name target { oid } } object(expression: "HEAD:") { ... on Tree { entries { name type } } }';

export function queryFor(names: readonly RepoName[], options: LookupOptions): string {
  const parts = names.map(
    (n, i) =>
      `r${i}: repository(owner: ${JSON.stringify(n.owner)}, name: ${JSON.stringify(n.repo)}) { ${REPO_FIELDS} ${options.withTree ? LIST_FIELDS : ''} }`,
  );
  return `query { ${parts.join('\n')}\nrateLimit { cost remaining resetAt } }`;
}

function infoOf(node: z.infer<typeof RepoNode>): RepoInfo {
  const info: RepoInfo = {
    nameWithOwner: node.nameWithOwner,
    stars: node.stargazerCount,
    pushedAt: node.pushedAt,
    archived: node.isArchived,
    fork: node.isFork,
    license: node.licenseInfo?.spdxId ?? null,
    language: node.primaryLanguage?.name ?? null,
    topics: node.repositoryTopics.nodes.map((t) => t.topic.name),
    description: node.description,
    defaultBranch: node.defaultBranchRef?.name ?? null,
    headOid: node.defaultBranchRef?.target?.oid ?? null,
  };
  if (node.object?.entries) info.rootEntries = node.object.entries;
  return info;
}

export interface GraphQLOptions {
  token: () => Promise<string>;
  transport?: Transport;
  /** Stop before a query when fewer points than this are left. */
  floor?: number;
  batchSize?: number;
  /** How many times a query refused by a rate limit is tried again. */
  retries?: number;
  /**
   * How many times a query that timed out on GitHub's side (502, 503, 504) is
   * tried again before it is cut in half; such a query is usually too big.
   */
  gatewayRetries?: number;
  /** How many queries are in flight at once. */
  concurrency?: number;
  sleep?: (ms: number) => Promise<void>;
  log?: (line: string) => void;
}

/** A query that failed on GitHub's side every time it was tried. */
class Retryable extends Error {}

export class GraphQLGitHub implements GitHub {
  pointsSpent = 0;
  private remaining: number | null = null;
  private resetAt = 'the top of the hour';
  private tokenValue: string | null = null;
  private readonly transport: Transport;
  private readonly floor: number;
  private readonly batchSize: number;
  private readonly retries: number;
  private readonly gatewayRetries: number;
  private readonly concurrency: number;
  private readonly sleep: (ms: number) => Promise<void>;
  private readonly log: (line: string) => void;

  constructor(private readonly options: GraphQLOptions) {
    this.transport = options.transport ?? fetchTransport;
    this.floor = options.floor ?? 1500;
    this.batchSize = options.batchSize ?? 100;
    this.retries = options.retries ?? 6;
    this.gatewayRetries = options.gatewayRetries ?? 1;
    this.concurrency = options.concurrency ?? 1;
    this.sleep = options.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
    this.log = options.log ?? (() => undefined);
  }

  async lookup(names: readonly RepoName[], options: LookupOptions): Promise<Map<string, RepoLookup>> {
    const results = new Map<string, RepoLookup>();
    const valid: RepoName[] = [];
    for (const n of names) {
      if (SAFE_NAME.test(n.owner) && SAFE_NAME.test(n.repo)) valid.push(n);
      else results.set(keyOf(n), { kind: 'failed', message: 'not a valid repository name' });
    }
    if (valid.length === 0) return results;
    if (this.remaining === null) await this.checkPoints();
    const batches: RepoName[][] = [];
    for (let i = 0; i < valid.length; i += this.batchSize) batches.push(valid.slice(i, i + this.batchSize));
    let next = 0;
    let done = 0;
    const worker = async (): Promise<void> => {
      while (next < batches.length) {
        const batch = batches[next] ?? [];
        next += 1;
        await this.batch(batch, options, results);
        done += 1;
        if (batches.length >= 10 && done % 10 === 0) this.log(`GitHub: ${done} of ${batches.length} queries done`);
      }
    };
    await Promise.all(Array.from({ length: Math.min(this.concurrency, batches.length) }, worker));
    return results;
  }

  /** Asks how many points are left, so a run stops before it starts if too few are. */
  private async checkPoints(): Promise<void> {
    const answer = await this.ask('query { rateLimit { cost remaining resetAt } }');
    this.note(answer);
  }

  private note(answer: z.infer<typeof Answer>): void {
    const rate = RateLimit.safeParse(answer.data?.rateLimit);
    if (rate.success) {
      this.pointsSpent += rate.data.cost;
      this.remaining = rate.data.remaining;
      this.resetAt = rate.data.resetAt;
    }
  }

  private async batch(names: RepoName[], options: LookupOptions, results: Map<string, RepoLookup>): Promise<void> {
    if (this.remaining !== null && this.remaining < this.floor) {
      throw new PointsTooLow(this.remaining, this.floor, this.resetAt);
    }
    let answer: z.infer<typeof Answer>;
    try {
      answer = await this.ask(queryFor(names, options));
    } catch (error) {
      // A query that keeps failing on the server's side is often one that is too big: halve it.
      if (error instanceof Retryable && names.length > 1) {
        const half = Math.ceil(names.length / 2);
        this.log(`a query of ${names.length} repositories kept failing; trying halves`);
        await this.batch(names.slice(0, half), options, results);
        await this.batch(names.slice(half), options, results);
        return;
      }
      if (error instanceof Retryable) {
        const [only] = names;
        if (only) results.set(keyOf(only), { kind: 'failed', message: error.message });
        return;
      }
      throw error;
    }

    this.note(answer);

    const errorsByAlias = new Map<string, { type?: string; message: string }>();
    for (const e of answer.errors ?? []) {
      const alias = e.path?.[0];
      if (typeof alias === 'string') errorsByAlias.set(alias, e);
      else if (e.type === 'RATE_LIMITED') throw new PointsTooLow(0, this.floor, this.resetAt);
    }

    names.forEach((name, i) => {
      const alias = `r${i}`;
      const raw = answer.data?.[alias];
      const error = errorsByAlias.get(alias);
      if (raw === null || raw === undefined) {
        if (error?.type === 'NOT_FOUND') results.set(keyOf(name), { kind: 'gone' });
        else results.set(keyOf(name), { kind: 'failed', message: error?.message ?? 'no answer for this repository' });
        return;
      }
      const node = RepoNode.safeParse(raw);
      results.set(
        keyOf(name),
        node.success ? { kind: 'found', info: infoOf(node.data) } : { kind: 'failed', message: 'an answer of an unexpected shape' },
      );
    });
  }

  private async ask(query: string): Promise<z.infer<typeof Answer>> {
    this.tokenValue ??= await this.options.token();
    const body = JSON.stringify({ query });
    let limited = 0;
    let timedOut = 0;
    for (;;) {
      const response = await this.transport(body, this.tokenValue);
      // A 200 whose body is cut short or empty happens while GitHub is failing; it is tried again like a bad gateway.
      const json = response.status === 200 ? parseJson(response.text) : undefined;
      if (response.status === 200 && json !== undefined) {
        const parsed = Answer.safeParse(json);
        if (!parsed.success) throw new Error('GitHub answered with something that is not a GraphQL answer.');
        return parsed.data;
      }
      if (response.status === 401) throw new Error('GitHub refused the token (401). Set GITHUB_TOKEN or sign in with `gh auth login`.');
      const secondary = /secondary rate limit|abuse/i.test(response.text);
      if (secondary || response.status === 429) {
        limited += 1;
        if (limited > this.retries) throw new Error('GitHub kept refusing with a secondary rate limit; try again later.');
        const after = Number(response.retryAfter);
        const wait = Number.isFinite(after) && after > 0 ? after * 1000 : 60_000 * limited;
        this.log(`GitHub: a secondary rate limit; waiting ${Math.round(wait / 1000)}s`);
        await this.sleep(wait);
        continue;
      }
      if (response.status === 200 || [502, 503, 504].includes(response.status)) {
        const what = response.status === 200 ? 'an answer that is not JSON' : `HTTP ${response.status}`;
        timedOut += 1;
        if (timedOut > this.gatewayRetries) throw new Retryable(`still ${what} after ${timedOut} tries`);
        const wait = 2000 * 2 ** (timedOut - 1);
        this.log(`GitHub: ${what}; trying again in ${wait / 1000}s`);
        await this.sleep(wait);
        continue;
      }
      throw new Error(`GitHub answered HTTP ${response.status}: ${response.text.slice(0, 200)}`);
    }
  }
}

/** The parsed body, or undefined when it is not JSON (empty, or cut short). */
function parseJson(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
}

const run = promisify(execFile);

/** GITHUB_TOKEN when set, else the token of the GitHub command line, if it is signed in. */
export async function findToken(env: NodeJS.ProcessEnv = process.env): Promise<string> {
  const fromEnv = env.GITHUB_TOKEN?.trim();
  if (fromEnv) return fromEnv;
  try {
    const { stdout } = await run('gh', ['auth', 'token']);
    const token = stdout.trim();
    if (token) return token;
  } catch {
    // Fall through to the message below.
  }
  throw new Error('No GitHub token: set GITHUB_TOKEN, or sign in with `gh auth login`.');
}
