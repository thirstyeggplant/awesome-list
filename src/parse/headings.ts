// Lists that give each item a heading of its own, with a paragraph under it.
import { extraLinksIn, leadingLink } from './bullets.js';
import {
  collapse, definitionsOf, firstNamingLink, isBare, isNamingLink, linksSeenIn, parseMarkdown,
  plainText, Sections, walkBlocks,
} from './markdown.js';
import type { ParsedItem, ParseResult } from './types.js';

export function headings(markdown: string): ParseResult {
  const root = parseMarkdown(markdown);
  const defs = definitionsOf(root);
  const sections = new Sections();
  const items: ParsedItem[] = [];
  let waiting: ParsedItem | null = null;

  walkBlocks(root, sections, (node) => {
    if (node.type === 'heading') {
      waiting = null;
      if (sections.skipped || sections.atTitle) return false;
      const section = sections.path.slice(0, -1);

      const lead = leadingLink(node.children, defs)?.link;
      const found = lead && isNamingLink(lead) ? lead : firstNamingLink(node, defs);
      if (found === null) return false;

      const name = isBare(found) ? collapse(plainText(node.children)) : collapse(plainText(found.children));
      if (name === '') return false;
      sections.markLastAsItem();
      const item: ParsedItem = {
        url: found.url.trim(),
        name,
        sourceDescription: null,
        extraLinks: extraLinksIn(node.children, defs, found.url),
        section,
      };
      items.push(item);
      waiting = item;
      return false;
    }
    if (sections.skipped) return false;
    if (node.type === 'paragraph' && waiting !== null) {
      const text = collapse(plainText(node.children));
      if (text !== '') {
        waiting.sourceDescription = text;
        waiting = null;
      }
    }
    return false;
  });

  return { items, linksSeen: linksSeenIn(root, defs) };
}
