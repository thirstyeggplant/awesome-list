// Addresses of things on the site: item paths, slugs, section anchors.

/** The first 10 hex characters of sha256(id), as the build makes them for `item/{h}` (with crypto.subtle). */
export async function shortHashOf(id: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(id));
  return [...new Uint8Array(digest).slice(0, 5)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function pathOfKey(key: string): string {
  return `/${key}`;
}

const GH_PATH = /^\/gh\/([a-z0-9][a-z0-9._-]*)\/([a-z0-9._-]+)$/;
const ITEM_PATH = /^\/item\/([0-9a-f]{10})$/;

/** The key an item path names, or null. */
export function keyOfPath(path: string): string | null {
  const gh = GH_PATH.exec(path);
  if (gh) return `gh/${gh[1] ?? ''}/${gh[2] ?? ''}`;
  const item = ITEM_PATH.exec(path);
  if (item) return `item/${item[1] ?? ''}`;
  return null;
}

/** A slug: lower case letters, digits, dots and single dashes. `+` and `#` are spelled out. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\+/g, 'plus')
    .replace(/#/g, 'sharp')
    .replace(/[^a-z0-9.]+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '');
}

/** An anchor for a heading: like a slug, without dots, never empty. */
export function anchorOf(text: string): string {
  const a = slugify(text).replace(/\./g, '');
  return a === '' ? 'section' : a;
}

export interface OutlineNode {
  /** The headings from the outermost to this one. */
  path: string[];
  anchor: string;
}

/**
 * Every heading of a list in document order, from the ordered paths of its sections:
 * each path adds a node for each of its prefixes not seen before. Anchors are unique in the list.
 */
export function sectionOutline(paths: readonly (readonly string[])[]): OutlineNode[] {
  const nodes: OutlineNode[] = [];
  const byPath = new Set<string>();
  const used = new Set<string>(['contents', 'top', 'entries']);
  for (const path of paths) {
    for (let depth = 1; depth <= path.length; depth++) {
      const prefix = path.slice(0, depth);
      const id = JSON.stringify(prefix);
      if (byPath.has(id)) continue;
      byPath.add(id);
      const base = anchorOf(prefix[depth - 1] ?? '');
      let anchor = base;
      for (let n = 1; used.has(anchor); n++) anchor = `${base}-${n}`;
      used.add(anchor);
      nodes.push({ path: prefix, anchor });
    }
  }
  return nodes;
}

/** The anchors of each prefix of each path, from an outline. */
export function anchorsByPath(nodes: readonly OutlineNode[]): Map<string, string> {
  return new Map(nodes.map((n) => [JSON.stringify(n.path), n.anchor]));
}
