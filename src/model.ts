// The shapes of everything the pipeline reads and writes, as zod schemas.
// Every row is checked against these before it is written.
import { z } from 'zod';
import { ITEM_KINDS, LIST_STATUSES, REPO_STATUSES } from './enums.js';

export { ITEM_KINDS, LIST_STATUSES, REPO_STATUSES };

export const ItemKind = z.enum(ITEM_KINDS);
export type ItemKind = z.infer<typeof ItemKind>;

export const ListStatus = z.enum(LIST_STATUSES);
export type ListStatus = z.infer<typeof ListStatus>;

export const RepoStatus = z.enum(REPO_STATUSES);
export type RepoStatus = z.infer<typeof RepoStatus>;

/** A list to read, as a source of lists hands it over. */
export const ListRef = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
  category: z.string().nullable(),
  subcategory: z.string().nullable(),
  nameInIndex: z.string().nullable(),
  sourceDescription: z.string().nullable(),
});
export type ListRef = z.infer<typeof ListRef>;

export const ExtraLink = z.object({ text: z.string(), url: z.string() });
export type ExtraLink = z.infer<typeof ExtraLink>;

export const ListRow = z.object({
  id: z.string().describe('owner/repo, lower-case, as the repository is named now'),
  askedAs: z.string().describe('owner/repo as the source named it'),
  category: z.string().nullable(),
  subcategory: z.string().nullable(),
  nameInIndex: z.string().nullable(),
  sourceDescription: z.string().nullable().describe('the description the source gave the list'),
  summary: z.string().nullable().describe('our own one-sentence description, from summaries/lists.json; null when there is none'),
  summaryStale: z.boolean().describe("true when the source's description changed since the summary was written; false when there is no summary"),
  stars: z.number().int().nullable(),
  pushedAt: z.string().nullable(),
  archived: z.boolean().nullable(),
  license: z.string().nullable(),
  readmePath: z.string().nullable(),
  readmeOid: z.string().nullable().describe('the commit the readme was read at'),
  parser: z.string().nullable(),
  parserReason: z.string().nullable(),
  status: ListStatus,
  reason: z.string().optional(),
  linksSeen: z.number().int().nonnegative(),
  linksUsed: z.number().int().nonnegative(),
  itemsMade: z.number().int().nonnegative(),
});
export type ListRow = z.infer<typeof ListRow>;
export const PublicListRow = ListRow.omit({ sourceDescription: true });

export const RepoMeta = z.object({
  nameWithOwner: z.string(),
  stars: z.number().int().nullable(),
  pushedAt: z.string().nullable(),
  archived: z.boolean().nullable(),
  fork: z.boolean().nullable(),
  license: z.string().nullable(),
  language: z.string().nullable(),
  topics: z.array(z.string()),
  sourceDescription: z.string().nullable().describe("the repository's own description"),
  status: RepoStatus,
  renamedFrom: z.string().optional(),
});
export type RepoMeta = z.infer<typeof RepoMeta>;

export const ItemRow = z.object({
  id: z.string().describe('the canonical address'),
  kind: ItemKind,
  host: z.string(),
  repo: RepoMeta.optional(),
  listCount: z.number().int().positive(),
});
export type ItemRow = z.infer<typeof ItemRow>;
export const PublicItemRow = ItemRow.extend({
  repo: RepoMeta.omit({ sourceDescription: true }).optional(),
});

export const ListingRow = z.object({
  itemId: z.string(),
  listId: z.string(),
  section: z.array(z.string()),
  name: z.string(),
  sourceDescription: z.string().nullable().describe("the list's own description of the item"),
  summary: z.null().describe('our own wording; not written yet'),
  extraLinks: z.array(ExtraLink),
  position: z.number().int().nonnegative(),
  parentName: z.string().optional(),
});
export type ListingRow = z.infer<typeof ListingRow>;
export const PublicListingRow = ListingRow.omit({ sourceDescription: true });

/** A per-list file in overrides/ that changes how one list is read. */
export const Override = z.object({
  parser: z.string().optional(),
  files: z.array(z.string().min(1)).optional(),
  skip: z.string().min(1).optional(),
  note: z.string().optional(),
});
export type Override = z.infer<typeof Override>;
