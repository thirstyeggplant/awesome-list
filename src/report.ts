// How much of each list was read, and what the dataset holds, as JSON and as
// a page a person can read.
import { ITEM_KINDS, LIST_STATUSES, type ItemKind, type ListStatus } from './model.js';
import type { Dataset } from './pipeline.js';

export interface ListCoverage {
  id: string;
  parser: string | null;
  status: ListStatus;
  reason: string | null;
  linksSeen: number;
  linksUsed: number;
  itemsMade: number;
  /** Items made for each link seen. */
  share: number;
}

export interface Coverage {
  totals: {
    lists: number;
    listings: number;
    items: number;
    linksSeen: number;
    linksUsed: number;
  };
  listsByStatus: Record<ListStatus, number>;
  listsByParser: Record<string, number>;
  itemsByKind: Record<ItemKind, number>;
  itemsInLists: { atLeast2: number; atLeast5: number; atLeast10: number };
  repos: { looked: number; active: number; quiet: number; archived: number; gone: number; renamed: number };
  /** Lists with our own summary, without one, and those whose source changed since it was written. */
  summaries: { withSummary: number; withoutSummary: number; stale: number };
  lists: ListCoverage[];
}

function round(n: number): number {
  return Math.round(n * 1000) / 1000;
}

export function coverageOf(data: Dataset): Coverage {
  const listsByStatus = Object.fromEntries(LIST_STATUSES.map((s) => [s, 0])) as Record<ListStatus, number>;
  const listsByParser: Record<string, number> = {};
  for (const l of data.lists) {
    listsByStatus[l.status] += 1;
    const parser = l.parser ?? 'none';
    listsByParser[parser] = (listsByParser[parser] ?? 0) + 1;
  }
  const summaries = { withSummary: 0, withoutSummary: 0, stale: 0 };
  for (const l of data.lists) {
    if (l.summary === null) summaries.withoutSummary += 1;
    else summaries.withSummary += 1;
    if (l.summaryStale) summaries.stale += 1;
  }
  const itemsByKind = Object.fromEntries(ITEM_KINDS.map((k) => [k, 0])) as Record<ItemKind, number>;
  const repos = { looked: 0, active: 0, quiet: 0, archived: 0, gone: 0, renamed: 0 };
  const itemsInLists = { atLeast2: 0, atLeast5: 0, atLeast10: 0 };
  for (const item of data.items) {
    itemsByKind[item.kind] += 1;
    if (item.listCount >= 2) itemsInLists.atLeast2 += 1;
    if (item.listCount >= 5) itemsInLists.atLeast5 += 1;
    if (item.listCount >= 10) itemsInLists.atLeast10 += 1;
    if (item.repo) {
      repos.looked += 1;
      repos[item.repo.status] += 1;
      if (item.repo.renamedFrom !== undefined) repos.renamed += 1;
    }
  }
  return {
    totals: {
      lists: data.lists.length,
      listings: data.listings.length,
      items: data.items.length,
      linksSeen: data.lists.reduce((n, l) => n + l.linksSeen, 0),
      linksUsed: data.lists.reduce((n, l) => n + l.linksUsed, 0),
    },
    listsByStatus,
    listsByParser,
    itemsByKind,
    itemsInLists,
    repos,
    summaries,
    lists: data.lists.map((l) => ({
      id: l.id,
      parser: l.parser,
      status: l.status,
      reason: l.reason ?? null,
      linksSeen: l.linksSeen,
      linksUsed: l.linksUsed,
      itemsMade: l.itemsMade,
      share: l.linksSeen === 0 ? 0 : round(l.itemsMade / l.linksSeen),
    })),
  };
}

function table(rows: readonly (readonly (string | number)[])[], head: readonly string[]): string {
  const cell = (v: string | number): string => String(v).replace(/\|/g, '\\|');
  return [
    `| ${head.join(' | ')} |`,
    `| ${head.map(() => '---').join(' | ')} |`,
    ...rows.map((r) => `| ${r.map(cell).join(' | ')} |`),
  ].join('\n');
}

export function coverageMarkdown(c: Coverage, run: Dataset['run']): string {
  const pct = (n: number, of: number): string => (of === 0 ? '0%' : `${Math.round((n / of) * 100)}%`);
  const lines = [
    '# Coverage',
    '',
    `Run started ${run.started}, finished ${run.finished}; ${run.pointsSpent} GraphQL points spent.`,
    '',
    `${c.totals.lists} lists, ${c.totals.listings} listings, ${c.totals.items} distinct items. ` +
      `${c.totals.linksSeen} links seen in the lists; ${c.totals.linksUsed} of them used as an item or an extra link.`,
    '',
    '## Lists by status',
    '',
    table(Object.entries(c.listsByStatus).map(([k, v]) => [k, v, pct(v, c.totals.lists)]), ['status', 'lists', 'share']),
    '',
    '## Lists by parser',
    '',
    table(Object.entries(c.listsByParser).sort().map(([k, v]) => [k, v]), ['parser', 'lists']),
    '',
    '## Items by kind',
    '',
    table(Object.entries(c.itemsByKind).map(([k, v]) => [k, v, pct(v, c.totals.items)]), ['kind', 'items', 'share']),
    '',
    '## Items named by several lists',
    '',
    table([
      ['2 or more', c.itemsInLists.atLeast2],
      ['5 or more', c.itemsInLists.atLeast5],
      ['10 or more', c.itemsInLists.atLeast10],
    ], ['lists', 'items']),
    '',
    '## Repositories named by the lists',
    '',
    table(Object.entries(c.repos).map(([k, v]) => [k, v]), ['', 'repositories']),
    '',
    '## Our summaries of lists',
    '',
    'Stale means the source changed its description of the list after the summary was written.',
    '',
    table([
      ['with a summary', c.summaries.withSummary],
      ['without one', c.summaries.withoutSummary],
      ['stale', c.summaries.stale],
    ], ['', 'lists']),
    '',
    '## Every list',
    '',
    'Share is items made for each link seen. A list is partial under 30%.',
    '',
    table(
      c.lists.map((l) => [l.id, l.status, l.parser ?? '', l.linksSeen, l.itemsMade, `${Math.round(l.share * 100)}%`, l.reason ?? '']),
      ['list', 'status', 'parser', 'links', 'items', 'share', 'reason'],
    ),
    '',
  ];
  return lines.join('\n');
}
