// The keys of items, made once at build: `gh/{owner}/{repo}` (lower case) for an item with repository facts,
// else `item/{h}`, where h is the first 10 hex characters of sha256(id). The path of the item page is `/` + key.
import { createHash } from 'node:crypto';

export function shortHash(id: string): string {
  return createHash('sha256').update(id).digest('hex').slice(0, 10);
}

export function itemKey(id: string, nameWithOwner: string | null, hash: (id: string) => string = shortHash): string {
  if (nameWithOwner !== null) return `gh/${nameWithOwner.toLowerCase()}`;
  return `item/${hash(id)}`;
}

/** Keys for every item, failing on a collision. */
export function itemKeys(
  items: readonly { id: string; nameWithOwner: string | null }[],
  hash: (id: string) => string = shortHash,
): string[] {
  const seen = new Map<string, string>();
  return items.map(({ id, nameWithOwner }) => {
    const key = itemKey(id, nameWithOwner, hash);
    const other = seen.get(key);
    if (other !== undefined) throw new Error(`two items have the key ${key}: ${other} and ${id}`);
    seen.set(key, id);
    return key;
  });
}
