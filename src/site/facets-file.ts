// /_data/facets.bin: the facet arrays of /items in one file, written by the build and read by the site.
// Four bytes of header length (little-endian), a JSON header of offsets, then each array at an offset
// that is a multiple of 8 from the start of the file, in the platform's (little-endian) byte order.

export interface FacetData {
  /** Items, ids 1..n; index i is item i + 1. */
  n: number;
  /** Index in ITEM_KINDS. */
  kind: Uint8Array;
  /** 0 for none, else 1 + index in REPO_STATUSES. */
  status: Uint8Array;
  /** Term ids, 0 for none. */
  lang: Uint16Array;
  license: Uint16Array;
  /** -1 for none. */
  stars: Int32Array;
  /** Day of the last push, -1 for none. */
  pushed: Int32Array;
  listCount: Uint16Array;
  /** Index in `owners`, -1 for none. */
  owner: Int32Array;
  /** Item → topic term ids, as CSR: the topics of item i are topicIds[topicStart[i] .. topicStart[i + 1]). */
  topicStart: Uint32Array;
  topicIds: Uint32Array;
  /** Item → list ids, distinct, as CSR. */
  listStart: Uint32Array;
  listIds: Uint32Array;
  /** Item indexes in each other sort's order. */
  orderStars: Uint32Array;
  orderUpdated: Uint32Array;
  orderName: Uint32Array;
  /** Owner logins in index order. */
  owners: string[];
}

type ArrayName = Exclude<keyof FacetData, 'n' | 'owners'>;

const ARRAYS: readonly [ArrayName, 'u8' | 'u16' | 'i32' | 'u32'][] = [
  ['kind', 'u8'], ['status', 'u8'], ['lang', 'u16'], ['license', 'u16'], ['stars', 'i32'], ['pushed', 'i32'],
  ['listCount', 'u16'], ['owner', 'i32'], ['topicStart', 'u32'], ['topicIds', 'u32'], ['listStart', 'u32'],
  ['listIds', 'u32'], ['orderStars', 'u32'], ['orderUpdated', 'u32'], ['orderName', 'u32'],
];

interface Header {
  version: number;
  n: number;
  arrays: Record<string, { type: string; offset: number; length: number }>;
  owners: { offset: number; bytes: number };
}

const align = (n: number): number => Math.ceil(n / 8) * 8;

export function encodeFacets(d: FacetData): Uint8Array {
  const ownersBytes = new TextEncoder().encode(d.owners.join('\n'));
  // Offsets are relative to the data region first, then shifted once the header's length is known.
  const rel: Header['arrays'] = {};
  let at = 0;
  for (const [name, type] of ARRAYS) {
    const a = d[name];
    rel[name] = { type, offset: at, length: a.length };
    at = align(at + a.byteLength);
  }
  const ownersAt = at;
  const dataBytes = align(ownersAt + ownersBytes.length);
  // The header's length depends on the offsets, which depend on the header's length: pad it to a fixed size.
  const make = (base: number): string => {
    const arrays: Header['arrays'] = {};
    for (const [name, v] of Object.entries(rel)) arrays[name] = { ...v, offset: base + v.offset };
    const h: Header = { version: 1, n: d.n, arrays, owners: { offset: base + ownersAt, bytes: ownersBytes.length } };
    return JSON.stringify(h);
  };
  let base = align(4 + new TextEncoder().encode(make(0)).length + 64);
  let headerText = make(base);
  while (4 + new TextEncoder().encode(headerText).length > base) {
    base = align(base + 64);
    headerText = make(base);
  }
  const header = new TextEncoder().encode(headerText);
  const out = new Uint8Array(base + dataBytes);
  new DataView(out.buffer).setUint32(0, header.length, true);
  out.set(header, 4);
  out.fill(0x20, 4 + header.length, base); // spaces after the JSON
  for (const [name] of ARRAYS) {
    const a = d[name];
    const spec = rel[name];
    if (!spec) continue;
    out.set(new Uint8Array(a.buffer, a.byteOffset, a.byteLength), base + spec.offset);
  }
  out.set(ownersBytes, base + ownersAt);
  return out;
}

export function decodeFacets(buf: ArrayBuffer): FacetData {
  const headerLength = new DataView(buf).getUint32(0, true);
  const header = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 4, headerLength))) as Header;
  if (header.version !== 1) throw new Error(`facets.bin: version ${header.version}`);
  const spec = (name: ArrayName, type: string): { offset: number; length: number } => {
    const s = header.arrays[name];
    if (s?.type !== type) throw new Error(`facets.bin: no ${name} of type ${type}`);
    return s;
  };
  const u8 = (name: ArrayName): Uint8Array => { const s = spec(name, 'u8'); return new Uint8Array(buf, s.offset, s.length); };
  const u16 = (name: ArrayName): Uint16Array => { const s = spec(name, 'u16'); return new Uint16Array(buf, s.offset, s.length); };
  const i32 = (name: ArrayName): Int32Array => { const s = spec(name, 'i32'); return new Int32Array(buf, s.offset, s.length); };
  const u32 = (name: ArrayName): Uint32Array => { const s = spec(name, 'u32'); return new Uint32Array(buf, s.offset, s.length); };
  const ownersText = new TextDecoder().decode(new Uint8Array(buf, header.owners.offset, header.owners.bytes));
  return {
    n: header.n,
    kind: u8('kind'),
    status: u8('status'),
    lang: u16('lang'),
    license: u16('license'),
    stars: i32('stars'),
    pushed: i32('pushed'),
    listCount: u16('listCount'),
    owner: i32('owner'),
    topicStart: u32('topicStart'),
    topicIds: u32('topicIds'),
    listStart: u32('listStart'),
    listIds: u32('listIds'),
    orderStars: u32('orderStars'),
    orderUpdated: u32('orderUpdated'),
    orderName: u32('orderName'),
    owners: ownersText === '' ? [] : ownersText.split('\n'),
  };
}
