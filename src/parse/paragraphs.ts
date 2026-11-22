// Lists that put each item on a line of its own outside a bullet: a paragraph
// that begins with a link, or one line of a paragraph broken into lines.
// Bullets in the same document are read as `bullets` reads them.
import type { PhrasingContent } from 'mdast';
import { itemOfInline, readList } from './bullets.js';
import { definitionsOf, descriptionOf, linksSeenIn, parseMarkdown, Sections, walkBlocks } from './markdown.js';
import type { ParsedItem, ParseResult } from './types.js';

/** The lines of a paragraph, split where it has a hard break. */
function linesOf(nodes: readonly PhrasingContent[]): PhrasingContent[][] {
  const lines: PhrasingContent[][] = [[]];
  for (const node of nodes) {
    const isBreak = node.type === 'break' || (node.type === 'html' && /^<br\s*\/?>$/i.test(node.value.trim()));
    if (isBreak) lines.push([]);
    else lines.at(-1)?.push(node);
  }
  return lines.filter((line) => line.length > 0);
}

export function paragraphs(markdown: string): ParseResult {
  const root = parseMarkdown(markdown);
  const defs = definitionsOf(root);
  const sections = new Sections();
  const items: ParsedItem[] = [];
  walkBlocks(root, sections, (node) => {
    if (sections.skipped) return false;
    if (node.type === 'list') {
      readList(node, defs, sections.path, undefined, items);
      return false;
    }
    if (node.type === 'paragraph') {
      // A line that is not an item adds to the description of the item above it.
      let current: ParsedItem | null = null;
      for (const line of linesOf(node.children)) {
        const item = itemOfInline(line, defs, sections.path);
        if (item) {
          items.push(item);
          current = item;
        } else if (current) {
          const more = descriptionOf(line);
          if (more !== null) {
            current.sourceDescription = current.sourceDescription === null ? more : `${current.sourceDescription} ${more}`;
          }
        }
      }
      return false;
    }
    return node.type === 'blockquote';
  });
  return { items, linksSeen: linksSeenIn(root, defs) };
}
