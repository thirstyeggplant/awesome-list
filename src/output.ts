// Writes the dataset: the public files without the curators' descriptions,
// and the same files with them under private/.
import { mkdir, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { z } from 'zod';
import {
  ItemRow, ListingRow, ListRow, PublicItemRow, PublicListingRow, PublicListRow,
} from './model.js';
import type { Dataset } from './pipeline.js';
import { coverageMarkdown, coverageOf } from './report.js';

function jsonl(schema: z.ZodType, rows: readonly unknown[]): string {
  return rows.map((row) => JSON.stringify(schema.parse(row))).join('\n') + (rows.length > 0 ? '\n' : '');
}

async function put(path: string, text: string): Promise<void> {
  await writeFile(`${path}.part`, text);
  await rename(`${path}.part`, path);
}

/** The text of every file, by its path under the output folder. */
export function filesOf(data: Dataset): Map<string, string> {
  const coverage = coverageOf(data);
  return new Map([
    ['lists.jsonl', jsonl(PublicListRow, data.lists)],
    ['items.jsonl', jsonl(PublicItemRow, data.items)],
    ['listings.jsonl', jsonl(PublicListingRow, data.listings)],
    ['private/lists.jsonl', jsonl(ListRow, data.lists)],
    ['private/items.jsonl', jsonl(ItemRow, data.items)],
    ['private/listings.jsonl', jsonl(ListingRow, data.listings)],
    ['coverage.json', `${JSON.stringify(coverage, null, 2)}\n`],
    ['coverage.md', coverageMarkdown(coverage, data.run)],
    ['run.json', `${JSON.stringify(data.run, null, 2)}\n`],
  ]);
}

export async function writeDataset(data: Dataset, outDir: string): Promise<void> {
  const files = filesOf(data);
  await mkdir(join(outDir, 'private'), { recursive: true });
  for (const [path, text] of files) await put(join(outDir, path), text);
}
