// The usual form of a list: a bullet that starts with a link, then a dash and
// a few words about it. Headings above a bullet give its section.
import type { List, PhrasingContent } from 'mdast';
import type { ExtraLink } from '../model.js';
import {
  asLink, collapse, definitionsOf, descriptionOf, isBadge, isBare, isNamingLink, labelOf,
  linksSeenIn, parseMarkdown, plainText, Sections, visit, walkBlocks,
  type Definitions, type ResolvedLink,
} from './markdown.js';
import type { ParsedItem, ParseResult } from './types.js';

interface Lead {
  link: ResolvedLink;
  rest: PhrasingContent[];
}

/** Text made only of signs: emoji, stars, `:shortcode:` emoji, punctuation. */
function isSigns(text: string): boolean {
  const left = text.replace(/:[a-z0-9_+-]+:/gi, '');
  return !/[\p{L}\p{N}]/u.test(left);
}

/** Inline nodes that may come before the link without making it something else. */
function isDecoration(node: PhrasingContent, defs: Definitions): boolean {
  if (node.type === 'text') return isSigns(node.value);
  if (node.type === 'image' || node.type === 'imageReference' || node.type === 'html' || node.type === 'break') {
    return true;
  }
  const link = asLink(node, defs);
  return link !== null && isBadge(link);
}

/** The link a paragraph begins with, and what follows it. */
export function leadingLink(nodes: readonly PhrasingContent[], defs: Definitions): Lead | null {
  let i = 0;
  while (i < nodes.length && isDecoration(nodes[i] as PhrasingContent, defs)) i += 1;
  const first = nodes[i];
  if (first === undefined) return null;
  const after = nodes.slice(i + 1);

  const direct = asLink(first, defs);
  if (direct) return { link: direct, rest: after };

  if (first.type === 'strong' || first.type === 'emphasis' || first.type === 'delete') {
    const inner = leadingLink(first.children, defs);
    if (inner) return { link: inner.link, rest: [...inner.rest, ...after] };
  }
  return null;
}

export function extraLinksIn(nodes: readonly PhrasingContent[], defs: Definitions, mainUrl: string): ExtraLink[] {
  const links: ExtraLink[] = [];
  for (const node of nodes) {
    visit(node, (n) => {
      const link = asLink(n, defs);
      if (!link || !isNamingLink(link) || link.url === mainUrl) return;
      links.push({ text: collapse(plainText(link.children)) || link.url, url: link.url });
    });
  }
  return links;
}

/** Longest name taken from the text before a bare address ("Name - https://…"). */
const NAME_BEFORE_ADDRESS = 100;

/** "Name - https://example.com": a short name, then the address written out. */
function namedBareLink(nodes: readonly PhrasingContent[], defs: Definitions): { name: string; lead: Lead } | null {
  const [first, second, ...rest] = nodes;
  if (first?.type !== 'text' || second === undefined) return null;
  const link = asLink(second, defs);
  if (!link || !isNamingLink(link) || !isBare(link)) return null;
  const name = collapse(first.value).replace(/\s*(?:-|–|—|:|\|)$/, '').trim();
  if (name === '' || name.length > NAME_BEFORE_ADDRESS) return null;
  return { name, lead: { link, rest } };
}

/** The item a run of inline nodes stands for, if it begins with a link that names something. */
export function itemOfInline(
  nodes: readonly PhrasingContent[],
  defs: Definitions,
  section: string[],
): ParsedItem | null {
  let lead = leadingLink(nodes, defs);
  let name: string;
  if (lead && isNamingLink(lead.link) && !isBare(lead.link)) {
    name = collapse(plainText(lead.link.children));
  } else {
    const named = namedBareLink(nodes, defs);
    if (!named) return null;
    ({ name, lead } = named);
  }
  if (name === '') return null;
  return {
    url: lead.link.url.trim(),
    name,
    sourceDescription: descriptionOf(lead.rest),
    extraLinks: extraLinksIn(lead.rest, defs, lead.link.url),
    section,
  };
}

export function readList(
  list: List,
  defs: Definitions,
  section: string[],
  parentName: string | undefined,
  out: ParsedItem[],
): void {
  for (const listItem of list.children) {
    const [first, ...others] = listItem.children;
    const paragraph = first?.type === 'paragraph' ? first : undefined;
    const item = paragraph ? itemOfInline(paragraph.children, defs, section) : null;

    let childSection = section;
    let childParent = parentName;
    if (item) {
      if (parentName !== undefined) item.parentName = parentName;
      out.push(item);
      childParent = item.name;
    } else if (paragraph) {
      const label = labelOf(paragraph.children);
      if (label !== '') {
        childSection = [...section, label];
        childParent = undefined;
      }
    }

    for (const child of paragraph ? others : listItem.children) {
      if (child.type === 'list') readList(child, defs, childSection, childParent, out);
    }
  }
}

export function bullets(markdown: string): ParseResult {
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
    return node.type === 'blockquote';
  });
  return { items, linksSeen: linksSeenIn(root, defs) };
}
