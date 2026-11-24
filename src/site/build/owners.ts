// Owners: everyone who keeps a list or owns a repository the lists name.
import type { Item, List } from './load.js';

export interface Owner { login: string; display: string; listCount: number; itemCount: number }

export function ownersOf(lists: readonly List[], items: readonly Item[]): Owner[] {
  const byLogin = new Map<string, Owner>();
  const get = (login: string): Owner => {
    let o = byLogin.get(login);
    if (!o) byLogin.set(login, (o = { login, display: login, listCount: 0, itemCount: 0 }));
    return o;
  };
  for (const it of items) {
    if (it.owner === null || it.ownerDisplay === null) continue;
    const o = get(it.owner);
    o.itemCount++;
    o.display = it.ownerDisplay;
  }
  for (const l of lists) {
    const o = get(l.owner);
    o.listCount++;
    if (o.itemCount === 0) {
      const asked = l.askedAs.split('/')[0] ?? '';
      if (asked.toLowerCase() === l.owner) o.display = asked;
    }
  }
  return [...byLogin.values()].sort((a, b) => (a.login < b.login ? -1 : 1));
}
