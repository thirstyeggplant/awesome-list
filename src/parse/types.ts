import type { ExtraLink } from '../model.js';

/** One entry a parser found in a list, before addresses are made canonical. */
export interface ParsedItem {
  url: string;
  name: string;
  sourceDescription: string | null;
  extraLinks: ExtraLink[];
  section: string[];
  parentName?: string;
}

export interface ParseResult {
  items: ParsedItem[];
  /** Every http(s) link outside the skipped sections, items or not. */
  linksSeen: number;
}

/** A parser is a pure function of the Markdown text. It must not throw on odd input. */
export type Parser = (markdown: string) => ParseResult;
