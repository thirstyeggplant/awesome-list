// The parsers by name, and the choice of one for a list.
//
// Extension point: a new form of list (another markup converted first, a list
// split over several files, a list generated from data) is a parser added with
// `registerParser`, then named for that list in its file in overrides/.
import { bullets } from './bullets.js';
import { headings } from './headings.js';
import { paragraphs } from './paragraphs.js';
import { table } from './table.js';
import type { Parser, ParseResult } from './types.js';

export type { ParsedItem, ParseResult, Parser } from './types.js';

const parsers = new Map<string, Parser>();

export function registerParser(name: string, parser: Parser): void {
  if (parsers.has(name)) throw new Error(`A parser named "${name}" is already registered.`);
  parsers.set(name, parser);
}

export function parserNamed(name: string): Parser | undefined {
  return parsers.get(name);
}

export function parserNames(): string[] {
  return [...parsers.keys()].sort();
}

registerParser('bullets', bullets);
registerParser('table', table);
registerParser('headings', headings);
registerParser('paragraphs', paragraphs);

/** Tried, in this order, when the default seems to have missed the list's form. */
const ALTERNATIVES = ['table', 'headings', 'paragraphs'];

/** Below these, the default parser is thought to have missed the list's form. */
export const FEW_ITEMS = 5;
export const LOW_SHARE = 0.3;
/** Another parser must find this many times as many items, and a few more, to be taken. */
const CLEAR_MARGIN = 1.5;
const AT_LEAST_MORE = 3;

export interface Choice {
  parser: string;
  reason: string;
  result: ParseResult;
}

export function shareOf(result: ParseResult): number {
  return result.linksSeen === 0 ? 0 : result.items.length / result.linksSeen;
}

/** Reads a list with the parser its override names, or picks one. */
export function choose(markdown: string, named?: string): Choice {
  if (named !== undefined) {
    const parser = parsers.get(named);
    if (!parser) throw new Error(`The override names a parser that does not exist: "${named}".`);
    return { parser: named, reason: 'named in the override', result: parser(markdown) };
  }

  const first = bullets(markdown);
  const count = first.items.length;
  const share = shareOf(first);
  if (count >= FEW_ITEMS && share >= LOW_SHARE) {
    return { parser: 'bullets', reason: 'default', result: first };
  }

  let best: Choice = {
    parser: 'bullets',
    reason: `default; others found no more (bullets made ${count} items from ${first.linksSeen} links)`,
    result: first,
  };
  for (const name of ALTERNATIVES) {
    const parser = parsers.get(name);
    if (!parser) continue;
    const result = parser(markdown);
    const n = result.items.length;
    if (n >= count * CLEAR_MARGIN && n >= count + AT_LEAST_MORE && n > best.result.items.length) {
      best = {
        parser: name,
        reason: `bullets made ${count} items from ${first.linksSeen} links; ${name} made ${n}`,
        result,
      };
    }
  }
  return best;
}
