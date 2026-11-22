// What the parsers share: turning Markdown into a tree, reading text out of
// it, telling links apart, and knowing which section a node is in.
import type { Heading, Nodes, Parents, PhrasingContent, Root, RootContent } from 'mdast';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import { unified } from 'unified';

const processor = unified().use(remarkParse).use(remarkGfm);

export function parseMarkdown(text: string): Root {
  return processor.parse(text);
}

export function collapse(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

export function isHttp(url: string): boolean {
  return /^https?:\/\//i.test(url.trim());
}

/** Text of a node as a reader sees it, with images left out. */
export function plainText(node: Nodes | readonly Nodes[]): string {
  if (Array.isArray(node)) return (node as readonly Nodes[]).map((n) => plainText(n)).join('');
  const n = node as Nodes;
  switch (n.type) {
    case 'text':
    case 'inlineCode':
      return n.value;
    case 'break':
      return ' ';
    case 'image':
    case 'imageReference':
    case 'html':
    case 'footnoteReference':
    case 'definition':
      return '';
    default:
      return 'children' in n ? plainText(n.children) : '';
  }
}

export type Definitions = ReadonlyMap<string, string>;

function normalizeLabel(label: string): string {
  return collapse(label).toLowerCase();
}

export function definitionsOf(root: Root): Definitions {
  const defs = new Map<string, string>();
  visit(root, (node) => {
    if (node.type === 'definition') {
      const key = normalizeLabel(node.label ?? node.identifier);
      if (!defs.has(key)) defs.set(key, node.url);
    }
  });
  return defs;
}

/** A link written inline or by reference, with its address resolved. */
export interface ResolvedLink {
  url: string;
  children: PhrasingContent[];
}

export function asLink(node: Nodes, defs: Definitions): ResolvedLink | null {
  if (node.type === 'link') return { url: node.url, children: node.children };
  if (node.type === 'linkReference') {
    const url = defs.get(normalizeLabel(node.label ?? node.identifier));
    return url === undefined ? null : { url, children: node.children };
  }
  return null;
}

/** A link whose only content is images: a badge or a logo, not a name. */
export function isBadge(link: ResolvedLink): boolean {
  const meaningful = link.children.filter((c) => !(c.type === 'text' && c.value.trim() === ''));
  return meaningful.length > 0 && meaningful.every((c) => c.type === 'image' || c.type === 'imageReference');
}

/** A link that is its own address, such as a bare URL on a line. */
export function isBare(link: ResolvedLink): boolean {
  const text = collapse(plainText(link.children)).replace(/\/+$/, '').toLowerCase();
  const url = link.url.trim().replace(/\/+$/, '').toLowerCase();
  return text === url || `http://${text}` === url || `https://${text}` === url;
}

/** An http(s) link that names something: not a badge, not an anchor, not relative. */
export function isNamingLink(link: ResolvedLink): boolean {
  return isHttp(link.url) && !isBadge(link);
}

export function visit(node: Nodes, fn: (node: Nodes) => void): void {
  fn(node);
  if ('children' in node) for (const child of node.children) visit(child, fn);
}

/** The first link inside a node that names something, in reading order. */
export function firstNamingLink(node: Nodes, defs: Definitions): ResolvedLink | null {
  const link = asLink(node, defs);
  if (link && isNamingLink(link)) return link;
  if ('children' in node) {
    for (const child of node.children) {
      const found = firstNamingLink(child, defs);
      if (found) return found;
    }
  }
  return null;
}

const HTML_HREF = /<a\s[^>]*?href\s*=\s*["']?(https?:\/\/[^"'\s>]+)/gi;

/** How many http(s) links a node holds: Markdown links, and anchors inside raw HTML. */
export function countLinks(node: Nodes, defs: Definitions): number {
  let count = 0;
  visit(node, (n) => {
    const link = asLink(n, defs);
    if (link && isNamingLink(link)) count += 1;
    if (n.type === 'html') count += [...n.value.matchAll(HTML_HREF)].length;
  });
  return count;
}

export function headingText(heading: Heading): string {
  return collapse(plainText(heading.children));
}

/** Sections whose contents are not part of the list. "Related" is kept. */
const SKIPPED_HEADINGS = new Set(['contents', 'tableofcontents', 'contributing', 'license', 'licence', 'footnotes']);

export function isSkippedHeading(text: string): boolean {
  const key = text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
  return SKIPPED_HEADINGS.has(key);
}

interface StackEntry {
  depth: number;
  text: string;
  title: boolean;
  skipped: boolean;
  item: boolean;
}

/** Follows the headings of a document in order and says where a node stands. */
export class Sections {
  private stack: StackEntry[] = [];
  private seenHeading = false;

  enter(heading: Heading, options: { item?: boolean } = {}): void {
    while (this.stack.length > 0 && (this.stack.at(-1)?.depth ?? 0) >= heading.depth) this.stack.pop();
    const text = headingText(heading);
    this.stack.push({
      depth: heading.depth,
      text,
      title: !this.seenHeading && heading.depth === 1,
      skipped: isSkippedHeading(text),
      item: options.item ?? false,
    });
    this.seenHeading = true;
  }

  /** Marks the heading entered last as an item rather than a section. */
  markLastAsItem(): void {
    const last = this.stack.at(-1);
    if (last) last.item = true;
  }

  /** True when the heading entered last is the title of the document. */
  get atTitle(): boolean {
    return this.stack.at(-1)?.title ?? false;
  }

  /**
   * True inside a skipped section. Only the section's own text is skipped: a
   * heading under it starts content again, because some readmes put the whole
   * list under a "Contents" heading of a higher level.
   */
  get skipped(): boolean {
    return this.stack.at(-1)?.skipped ?? false;
  }

  get path(): string[] {
    return this.stack.filter((e) => !e.title && !e.item && !e.skipped && e.text !== '').map((e) => e.text);
  }
}

/**
 * Walks the blocks of a document in reading order. Headings move `sections`
 * before the visitor sees them; the visitor returns true to look inside a node.
 */
export function walkBlocks(
  root: Root,
  sections: Sections,
  visitor: (node: RootContent, parent: Parents) => boolean,
): void {
  const go = (parent: Parents): void => {
    for (const child of parent.children) {
      if (child.type === 'heading') sections.enter(child);
      if (visitor(child, parent) && 'children' in child) go(child);
    }
  };
  go(root);
}

/** Links seen in a document outside the skipped sections. */
export function linksSeenIn(root: Root, defs: Definitions): number {
  const sections = new Sections();
  let count = 0;
  walkBlocks(root, sections, (node) => {
    if (sections.skipped || node.type === 'definition') return false;
    if (node.type === 'heading' || node.type === 'paragraph' || node.type === 'html' || node.type === 'table') {
      count += countLinks(node, defs);
      return false;
    }
    return true;
  });
  return count;
}

const SEPARATOR = /^\s*[-–—:|]+\s*/;

/** The text after a link, without the dash or colon that joins it to the name. */
export function descriptionOf(nodes: readonly PhrasingContent[]): string | null {
  const text = collapse(plainText(nodes)).replace(SEPARATOR, '').trim();
  return text === '' ? null : text;
}

/** Longest label a plain bullet may give the section; a longer one is a sentence, not a name. */
const LONGEST_LABEL = 60;

/** A label for a bullet that is not an item: its text up to the first separator, or '' if too long. */
export function labelOf(nodes: readonly PhrasingContent[]): string {
  const text = collapse(plainText(nodes));
  const cut = (text.split(/\s+[-–—]\s+|:\s/)[0] ?? '').replace(/:$/, '').trim();
  return cut.length > LONGEST_LABEL ? '' : cut;
}
