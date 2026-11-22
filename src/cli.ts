// pnpm build-data [--limit N] [--only owner/repo] [--no-enrich] [--offline] [--out dir] [--floor N]
import { parseArgs } from 'node:util';
import { CachedGitHub } from './fetch/cached-github.js';
import { findToken, GraphQLGitHub } from './fetch/github.js';
import { fetchDownload, FileStore } from './fetch/readme.js';
import { writeDataset } from './output.js';
import { loadOverrides } from './overrides.js';
import { buildDataset, rootReadmeReader } from './pipeline.js';
import { indexSource } from './sources/index-list.js';
import { loadSummaries } from './summaries.js';

const USAGE = `Usage: pnpm build-data [options]

  --limit N           read only the first N lists
  --only owner/repo   read only this list
  --no-enrich         do not look up the repositories the lists name
  --offline           use only what is in .cache/ and ask nothing of the network
  --out DIR           where to write the dataset (default: out)
  --floor N           stop when fewer GraphQL points than this are left (default: 1500)
`;

function positiveInt(value: string | undefined, flag: string): number | undefined {
  if (value === undefined) return undefined;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0) throw new Error(`${flag} takes a whole number, not "${value}"`);
  return n;
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      limit: { type: 'string' },
      only: { type: 'string' },
      'no-enrich': { type: 'boolean', default: false },
      offline: { type: 'boolean', default: false },
      out: { type: 'string', default: 'out' },
      floor: { type: 'string' },
      help: { type: 'boolean', default: false },
    },
    strict: true,
  });
  if (values.help) {
    process.stdout.write(USAGE);
    return;
  }
  if (values.only !== undefined && !/^[^/\s]+\/[^/\s]+$/.test(values.only)) {
    throw new Error('--only takes owner/repo');
  }

  const log = (line: string): void => {
    process.stderr.write(`${line}\n`);
  };
  const cacheDir = '.cache';
  const floor = positiveInt(values.floor, '--floor');
  const github = new CachedGitHub(
    values.offline ? null : new GraphQLGitHub({ token: () => findToken(), log, concurrency: 2, ...(floor === undefined ? {} : { floor }) }),
    cacheDir,
  );
  const files = new FileStore({ cacheDir, download: fetchDownload, offline: values.offline });
  const overrides = await loadOverrides('overrides');
  const summaries = await loadSummaries();
  const limit = positiveInt(values.limit, '--limit');

  const data = await buildDataset(
    {
      source: indexSource(rootReadmeReader(github, files)),
      github,
      files,
      override: (id) => overrides.get(id),
      summaries,
      now: () => new Date(),
      log,
    },
    {
      enrich: !values['no-enrich'],
      ...(limit === undefined ? {} : { limit }),
      ...(values.only === undefined ? {} : { only: values.only }),
    },
  );
  await writeDataset(data, values.out);
  const c = data.run.counts;
  log(`wrote ${c.lists} lists, ${c.items} items and ${c.listings} listings to ${values.out}/ (${data.run.pointsSpent} GraphQL points)`);
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
