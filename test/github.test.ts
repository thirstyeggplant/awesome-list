import { describe, expect, it } from 'vitest';
import { GraphQLGitHub, PointsTooLow, queryFor, type Transport } from '../src/fetch/github.js';

function repoNode(nameWithOwner: string, extra: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    nameWithOwner,
    stargazerCount: 42,
    pushedAt: '2026-01-02T03:04:05Z',
    isArchived: false,
    isFork: false,
    description: 'A made-up repository.',
    licenseInfo: { spdxId: 'MIT' },
    primaryLanguage: { name: 'TypeScript' },
    repositoryTopics: { nodes: [{ topic: { name: 'example' } }] },
    defaultBranchRef: { name: 'main', target: { oid: 'abc123' } },
    ...extra,
  };
}

interface Reply {
  status?: number;
  body?: unknown;
  retryAfter?: string;
}

/** A transport that answers from a script and keeps every query it was sent. */
function scripted(replies: Reply[], remaining = 4000): { transport: Transport; queries: string[] } {
  const queries: string[] = [];
  const transport: Transport = (body) => {
    const { query } = JSON.parse(body) as { query: string };
    queries.push(query);
    if (!query.includes('repository(')) {
      return Promise.resolve({
        status: 200,
        retryAfter: null,
        text: JSON.stringify({ data: { rateLimit: { cost: 0, remaining, resetAt: '2026-01-01T01:00:00Z' } } }),
      });
    }
    const reply = replies.shift() ?? { status: 500 };
    return Promise.resolve({
      status: reply.status ?? 200,
      retryAfter: reply.retryAfter ?? null,
      text: JSON.stringify(reply.body ?? {}),
    });
  };
  return { transport, queries };
}

const noSleep = (): Promise<void> => Promise.resolve();
const rate = (remaining: number, cost = 1): Record<string, unknown> => ({ cost, remaining, resetAt: '2026-01-01T01:00:00Z' });

describe('GraphQLGitHub', () => {
  it('asks for many repositories in one query and tells found, gone and renamed apart', async () => {
    const { transport, queries } = scripted([
      {
        body: {
          data: { r0: repoNode('example-owner/tool'), r1: null, r2: repoNode('new-owner/Renamed'), rateLimit: rate(3999) },
          errors: [{ type: 'NOT_FOUND', path: ['r1'], message: 'Could not resolve' }],
        },
      },
    ]);
    const gh = new GraphQLGitHub({ token: () => Promise.resolve('t'), transport, sleep: noSleep });
    const result = await gh.lookup(
      [{ owner: 'example-owner', repo: 'tool' }, { owner: 'example-owner', repo: 'missing' }, { owner: 'old-owner', repo: 'renamed' }],
      { withTree: false },
    );
    expect(queries).toHaveLength(2);
    expect(result.get('example-owner/tool')).toMatchObject({
      kind: 'found',
      info: { stars: 42, license: 'MIT', language: 'TypeScript', topics: ['example'], headOid: 'abc123' },
    });
    expect(result.get('example-owner/missing')).toEqual({ kind: 'gone' });
    expect(result.get('old-owner/renamed')).toMatchObject({ kind: 'found', info: { nameWithOwner: 'new-owner/Renamed' } });
    expect(gh.pointsSpent).toBe(1);
  });

  it('asks for the files at the root only when told to', () => {
    expect(queryFor([{ owner: 'a', repo: 'b' }], { withTree: true })).toContain('HEAD:');
    expect(queryFor([{ owner: 'a', repo: 'b' }], { withTree: false })).not.toContain('HEAD:');
  });

  it('splits work into batches', async () => {
    const replies: Reply[] = [
      { body: { data: { r0: repoNode('o/a'), r1: repoNode('o/b'), rateLimit: rate(3999) } } },
      { body: { data: { r0: repoNode('o/c'), rateLimit: rate(3998) } } },
    ];
    const { transport, queries } = scripted(replies);
    const gh = new GraphQLGitHub({ token: () => Promise.resolve('t'), transport, batchSize: 2, sleep: noSleep });
    const result = await gh.lookup(['a', 'b', 'c'].map((repo) => ({ owner: 'o', repo })), { withTree: false });
    expect(queries.filter((q) => q.includes('repository('))).toHaveLength(2);
    expect(result.size).toBe(3);
  });

  it('tries again after a bad gateway, a few times only, then halves the batch', async () => {
    const { transport, queries } = scripted([
      { status: 502 },
      { status: 502 },
      { body: { data: { r0: repoNode('o/a'), rateLimit: rate(3999) } } },
      { body: { data: { r0: repoNode('o/b'), rateLimit: rate(3998) } } },
    ]);
    const gh = new GraphQLGitHub({ token: () => Promise.resolve('t'), transport, gatewayRetries: 1, sleep: noSleep });
    const result = await gh.lookup([{ owner: 'o', repo: 'a' }, { owner: 'o', repo: 'b' }], { withTree: false });
    expect(queries.filter((q) => q.includes('repository('))).toHaveLength(4);
    expect(result.get('o/a')?.kind).toBe('found');
    expect(result.get('o/b')?.kind).toBe('found');
  });

  it('marks a lone repository as failed when its query keeps failing', async () => {
    const { transport } = scripted([{ status: 502 }, { status: 502 }]);
    const gh = new GraphQLGitHub({ token: () => Promise.resolve('t'), transport, gatewayRetries: 1, sleep: noSleep });
    const result = await gh.lookup([{ owner: 'o', repo: 'a' }], { withTree: false });
    expect(result.get('o/a')).toMatchObject({ kind: 'failed' });
  });

  it('waits out a secondary rate limit', async () => {
    const waits: number[] = [];
    const { transport } = scripted([
      { status: 403, body: { message: 'You have exceeded a secondary rate limit.' }, retryAfter: '7' },
      { body: { data: { r0: repoNode('o/a'), rateLimit: rate(3999) } } },
    ]);
    const gh = new GraphQLGitHub({
      token: () => Promise.resolve('t'),
      transport,
      sleep: (ms) => {
        waits.push(ms);
        return Promise.resolve();
      },
    });
    await gh.lookup([{ owner: 'o', repo: 'a' }], { withTree: false });
    expect(waits).toContain(7000);
  });

  it('stops politely, before asking, when too few points are left', async () => {
    const { transport, queries } = scripted([], 900);
    const gh = new GraphQLGitHub({ token: () => Promise.resolve('t'), transport, floor: 1500, sleep: noSleep });
    await expect(gh.lookup([{ owner: 'o', repo: 'a' }], { withTree: false })).rejects.toBeInstanceOf(PointsTooLow);
    expect(queries.filter((q) => q.includes('repository('))).toHaveLength(0);
  });

  it('never puts a name that is not a plain repository name into a query', async () => {
    const { transport, queries } = scripted([]);
    const gh = new GraphQLGitHub({ token: () => Promise.resolve('t'), transport, sleep: noSleep });
    const result = await gh.lookup([{ owner: 'o"){ x', repo: 'a' }], { withTree: false });
    expect(result.get('o"){ x/a')).toMatchObject({ kind: 'failed' });
    expect(queries).toHaveLength(0);
  });

  it('says plainly when the token is refused', async () => {
    const { transport } = scripted([{ status: 401 }]);
    const gh = new GraphQLGitHub({ token: () => Promise.resolve('t'), transport, sleep: noSleep });
    await expect(gh.lookup([{ owner: 'o', repo: 'a' }], { withTree: false })).rejects.toThrow(/refused the token/);
  });
});
