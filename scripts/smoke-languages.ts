// pnpm exec tsx scripts/smoke-languages.ts <origin>
// After a deploy: whether the Worker formats numbers and chooses plurals as Node does, which shows that the runtime
// has ICU data for the languages (docs/i18n-seo.md, section 4). Node works the expected text out from the same
// messages and the counts of out/d1/build.json, and the live pages must hold it:
//   /de        the items count grouped as German writes it ("116.162");
//   /ru/lists  the count of lists in the Russian plural form that Intl.PluralRules chooses for it;
//   /es        <html lang="es".
// Exits 1, naming what is missing, when a check fails.
import { readFileSync } from 'node:fs';
import { Loc } from '../src/site/i18n/loc.js';

async function page(origin: string, path: string): Promise<string> {
  const r = await fetch(`${origin}${path}`, { signal: AbortSignal.timeout(20_000) });
  if (!r.ok) throw new Error(`${path}: ${r.status}`);
  return r.text();
}

async function main(): Promise<void> {
  const origin = (process.argv[2] ?? '').replace(/\/+$/, '');
  if (origin === '') throw new Error('usage: smoke-languages.ts <origin>');
  const { counts } = JSON.parse(readFileSync('out/d1/build.json', 'utf8')) as { counts: { lists: number; items: number } };
  const de = new Loc('de');
  const ru = new Loc('ru');
  const checks: [string, string, string][] = [
    ['/de', de.n(counts.items), 'the items count grouped as in German'],
    ['/ru/lists', ru.plural(ru.m.count.lists, counts.lists), 'the count of lists in its Russian plural form'],
    ['/es', '<html lang="es"', 'the Spanish lang'],
  ];
  let failed = false;
  for (const [path, want, what] of checks) {
    const ok = (await page(origin, path)).includes(want);
    process.stdout.write(`${ok ? 'ok' : 'MISSING'}  ${path}: ${what} (${JSON.stringify(want)})\n`);
    if (!ok) failed = true;
  }
  if (failed) {
    process.stdout.write('The runtime formats differently from Node: see docs/i18n-seo.md, section 4, on writing the rules by hand.\n');
    process.exitCode = 1;
  }
}

main().catch((e: unknown) => {
  process.stderr.write(`${e instanceof Error ? e.message : String(e)}\n`);
  process.exitCode = 1;
});
