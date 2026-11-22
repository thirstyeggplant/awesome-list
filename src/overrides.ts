// Per-list changes to how a list is read: overrides/<owner>/<repo>.json.
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Override } from './model.js';
import { parserNamed } from './parse/index.js';

export async function loadOverrides(dir: string): Promise<Map<string, Override>> {
  const found = new Map<string, Override>();
  let owners: string[];
  try {
    owners = await readdir(dir);
  } catch {
    return found;
  }
  for (const owner of owners.sort()) {
    let files: string[];
    try {
      files = await readdir(join(dir, owner));
    } catch {
      continue;
    }
    for (const file of files.sort()) {
      if (!file.endsWith('.json')) continue;
      const path = join(dir, owner, file);
      const parsed = Override.safeParse(JSON.parse(await readFile(path, 'utf8')));
      if (!parsed.success) throw new Error(`${path} is not a valid override: ${parsed.error.message}`);
      const parser = parsed.data.parser;
      if (parser !== undefined && parserNamed(parser) === undefined) {
        throw new Error(`${path} names a parser that does not exist: "${parser}"`);
      }
      found.set(`${owner}/${file.slice(0, -'.json'.length)}`.toLowerCase(), parsed.data);
    }
  }
  return found;
}
