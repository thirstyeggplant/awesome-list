// Lists kept as tables: each row is an item, named by the first link in it.
import type { PhrasingContent } from 'mdast';
import { extraLinksIn } from './bullets.js';
import {
  collapse, definitionsOf, firstNamingLink, isBare, linksSeenIn, parseMarkdown, plainText, Sections,
  walkBlocks,
} from './markdown.js';
import type { ParsedItem, ParseResult } from './types.js';

export function table(markdown: string): ParseResult {
  const root = parseMarkdown(markdown);
  const defs = definitionsOf(root);
  const sections = new Sections();
  const items: ParsedItem[] = [];

  walkBlocks(root, sections, (node) => {
    if (sections.skipped) return false;
    if (node.type !== 'table') return node.type === 'blockquote' || node.type === 'list' || node.type === 'listItem';

    for (const row of node.children.slice(1)) {
      const cells = row.children;
      const at = cells.findIndex((cell) => firstNamingLink(cell, defs) !== null);
      const cell = cells[at];
      if (cell === undefined) continue;
      const link = firstNamingLink(cell, defs);
      if (link === null) continue;

      let name = collapse(plainText(link.children));
      let nameCell = at;
      if (isBare(link) && at > 0) {
        const before = collapse(plainText(cells[at - 1]?.children ?? []));
        if (before !== '') {
          name = before;
          nameCell = at - 1;
        }
      }
      if (name === '') continue;

      const others = cells.filter((_, i) => i !== at && i !== nameCell);
      const text = others.map((c) => collapse(plainText(c.children))).filter((t) => !/^[-–—·.\s]*$/.test(t));
      const rowContent: PhrasingContent[] = cells.flatMap((c) => c.children);
      items.push({
        url: link.url.trim(),
        name,
        sourceDescription: text.length > 0 ? text.join(' · ') : null,
        extraLinks: extraLinksIn(rowContent, defs, link.url),
        section: sections.path,
      });
    }
    return false;
  });

  return { items, linksSeen: linksSeenIn(root, defs) };
}
