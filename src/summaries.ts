// Our own one-line summary of each list, kept in summaries/lists.json. Each
// entry also holds a short hash of the source's description it was written
// beside, so that a later run can tell the original changed without keeping it.
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { z } from 'zod';

export const SUMMARIES_FILE = 'summaries/lists.json';

export const SummaryEntry = z.object({
  summary: z.string().min(1).describe('our own one-sentence description of the list'),
  sourceHash: z.string().regex(/^(?:[0-9a-f]{12})?$/).describe("the first 12 hex characters of the SHA-256 of the source's description, '' when it had none"),
}).strict();
export type SummaryEntry = z.infer<typeof SummaryEntry>;

export const SummaryFile = z.record(z.string().min(1), SummaryEntry);

/** Summaries by list id. */
export type Summaries = ReadonlyMap<string, SummaryEntry>;

/** The first 12 hex characters of the SHA-256 of a description; '' for none. */
export function sourceHash(source: string | null): string {
  return source === null ? '' : createHash('sha256').update(source).digest('hex').slice(0, 12);
}

/** Reads the summaries from text; throws, naming the file, when they are not valid. */
export function parseSummaries(text: string, path = SUMMARIES_FILE): Summaries {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch (error) {
    throw new Error(`${path} is not JSON: ${error instanceof Error ? error.message : String(error)}`, { cause: error });
  }
  const parsed = SummaryFile.safeParse(json);
  if (!parsed.success) throw new Error(`${path} is not a valid file of summaries: ${parsed.error.message}`);
  return new Map(Object.entries(parsed.data));
}

/** Loads the summaries; a missing file means there are none. */
export async function loadSummaries(path = SUMMARIES_FILE): Promise<Summaries> {
  let text: string;
  try {
    text = await readFile(path, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return new Map();
    throw error;
  }
  return parseSummaries(text, path);
}

export interface SummaryOf {
  summary: string | null;
  /** True when the source's description has changed since the summary was written. */
  stale: boolean;
}

/** Our summary of one list, and whether the source changed since it was written. */
export function summaryOf(summaries: Summaries, id: string, sourceDescription: string | null): SummaryOf {
  const entry = summaries.get(id);
  if (entry === undefined) return { summary: null, stale: false };
  return { summary: entry.summary, stale: entry.sourceHash !== sourceHash(sourceDescription) };
}

/** The words of a text, lower-cased, with punctuation taken out. */
export function wordsOf(text: string): string[] {
  return text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter((w) => w.length > 0);
}

/** True when the two texts share a run of `length` or more consecutive words, ignoring case and punctuation. */
export function sharesRun(a: string, b: string, length = 5): boolean {
  const bWords = wordsOf(b);
  const runs = new Set<string>();
  for (let i = 0; i + length <= bWords.length; i += 1) runs.add(bWords.slice(i, i + length).join(' '));
  const aWords = wordsOf(a);
  for (let i = 0; i + length <= aWords.length; i += 1) {
    if (runs.has(aWords.slice(i, i + length).join(' '))) return true;
  }
  return false;
}
