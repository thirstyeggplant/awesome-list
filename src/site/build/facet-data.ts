// The facet arrays of /items, made from the model at build and written as /_data/facets.bin.
import { ITEM_KINDS, REPO_STATUSES } from '../../enums.js';
import type { FacetData } from '../facets-file.js';
import type { Model } from './load.js';

function csr(n: number, lists: readonly (readonly number[])[]): { start: Uint32Array; values: Uint32Array } {
  const start = new Uint32Array(n + 1);
  for (let i = 0; i < n; i++) start[i + 1] = (start[i] ?? 0) + (lists[i]?.length ?? 0);
  const values = new Uint32Array(start[n] ?? 0);
  for (let i = 0; i < n; i++) values.set(lists[i] ?? [], start[i] ?? 0);
  return { start, values };
}

export function facetData(model: Pick<Model, 'items' | 'listings'>): FacetData {
  const { items } = model;
  const n = items.length;
  const d = {
    kind: new Uint8Array(n),
    status: new Uint8Array(n),
    lang: new Uint16Array(n),
    license: new Uint16Array(n),
    stars: new Int32Array(n),
    pushed: new Int32Array(n),
    listCount: new Uint16Array(n),
    owner: new Int32Array(n),
  };
  const ownerIndex = new Map<string, number>();
  const names: string[] = new Array<string>(n);
  items.forEach((it, i) => {
    if (it.id !== i + 1) throw new Error('item ids are not 1..n in order');
    d.kind[i] = Math.max(0, (ITEM_KINDS as readonly string[]).indexOf(it.kind));
    d.status[i] = it.status === null ? 0 : (REPO_STATUSES as readonly string[]).indexOf(it.status) + 1;
    d.lang[i] = it.langId ?? 0;
    d.license[i] = it.licenseId ?? 0;
    d.stars[i] = it.stars ?? -1;
    d.pushed[i] = it.pushedDay ?? -1;
    d.listCount[i] = Math.min(65535, it.listCount);
    if (it.owner === null) d.owner[i] = -1;
    else {
      let o = ownerIndex.get(it.owner);
      if (o === undefined) ownerIndex.set(it.owner, (o = ownerIndex.size));
      d.owner[i] = o;
    }
    names[i] = it.name.toLowerCase();
  });
  const topics = csr(n, items.map((it) => [...it.topicIds].sort((a, b) => a - b)));
  const listsOf: number[][] = Array.from({ length: n }, () => []);
  for (const l of model.listings) {
    const a = listsOf[l.itemId - 1];
    if (a && !a.includes(l.listId)) a.push(l.listId);
  }
  for (const a of listsOf) a.sort((x, y) => x - y);
  const listed = csr(n, listsOf);

  const ids = (): number[] => Array.from({ length: n }, (_, i) => i);
  const by = (key: Int32Array): Uint32Array => Uint32Array.from(ids().sort((a, b) => (key[b] ?? 0) - (key[a] ?? 0) || a - b));
  return {
    n,
    ...d,
    topicStart: topics.start,
    topicIds: topics.values,
    listStart: listed.start,
    listIds: listed.values,
    orderStars: by(d.stars),
    orderUpdated: by(d.pushed),
    orderName: Uint32Array.from(
      ids().sort((a, b) => {
        const x = names[a] ?? '';
        const y = names[b] ?? '';
        return x < y ? -1 : x > y ? 1 : a - b;
      }),
    ),
    owners: [...ownerIndex.keys()],
  };
}
