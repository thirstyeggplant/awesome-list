// pnpm check-summaries: compares summaries/lists.json with the lists of the
// last run (out/private/lists.jsonl) and names, by list id only, every list
// without a summary, every stale summary, and every summary that shares a run
// of five or more words with the source's own description. It prints nothing
// of the source's text.
import { existsSync, readFileSync } from 'node:fs';
import { z } from 'zod';
import { loadSummaries, sharesRun, summaryOf, SUMMARIES_FILE } from '../src/summaries.js';

const LISTS = 'out/private/lists.jsonl';
const List = z.object({ id: z.string(), sourceDescription: z.string().nullable() });

async function main(): Promise<void> {
  if (!existsSync(LISTS)) {
    process.stdout.write(`${LISTS} is not there; run pnpm build-data first. Nothing checked.\n`);
    return;
  }
  const lists = readFileSync(LISTS, 'utf8').split('\n').filter((line) => line.trim().length > 0)
    .map((line) => List.parse(JSON.parse(line)));
  const summaries = await loadSummaries();

  const missing: string[] = [];
  const stale: string[] = [];
  const shared: string[] = [];
  for (const list of lists) {
    const { summary, stale: isStale } = summaryOf(summaries, list.id, list.sourceDescription);
    if (summary === null) {
      missing.push(list.id);
      continue;
    }
    if (isStale) stale.push(list.id);
    if (list.sourceDescription !== null && sharesRun(summary, list.sourceDescription)) shared.push(list.id);
  }
  const known = new Set(lists.map((l) => l.id));
  const unknown = [...summaries.keys()].filter((id) => !known.has(id));

  const report = (label: string, ids: readonly string[]): void => {
    process.stdout.write(`${label}: ${ids.length}\n`);
    for (const id of ids) process.stdout.write(`  ${id}\n`);
  };
  process.stdout.write(`${lists.length} lists in ${LISTS}, ${summaries.size} summaries in ${SUMMARIES_FILE}\n`);
  report('without a summary', missing);
  report('stale (the source changed since the summary was written)', stale);
  report('sharing five or more words in a row with the source', shared);
  report('summaries of lists not in the last run', unknown);
  if (missing.length + stale.length + shared.length > 0) process.exitCode = 1;
}

await main();
