// pnpm check-translations [--lang <code>] [--all] [--stamp <code>] [--hash-lists <code>]
//
// Per language, how its translations stand against our English:
//   summaries   translations/lists.{code}.json against summaries/lists.json: missing, stale (the English changed
//               since), without enHash, keys that name no list, and every summary that breaks a rule (one sentence,
//               no markup or control characters, at most 200 characters (100 for Chinese, Japanese, Korean)), and,
//               to check by eye, product names of the English not kept as they are;
//   categories  translations/categories.{code}.json against the categories of out/lists.jsonl: missing, unknown;
//   messages    src/site/i18n/messages/{code}.ts against en.ts: untranslated (still a copy of the English), keys
//               the same as the English, keys whose English changed since (ui-hashes.json), and broken keys
//               (placeholders or tags differ, or a plural lacks a form the language needs).
// Missing, stale and untranslated are reported only. Unreadable files, broken rules and unknown keys exit 1.
//
//   --stamp <code>       after translating messages/{code}.ts: record in ui-hashes.json that every message of that
//                        language is translated from the English as it is now.
//   --hash-lists <code>  give every summary in lists.{code}.json that has no enHash the hash of the current English.
//                        Only for summaries just translated from the current English.
//   --all                list every id, not only the first ten of each kind.
//
// It reads our English summaries and nothing of a source's own description.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { OTHER_LOCALES, isLocale, type Locale } from '../src/site/i18n/locales.js';
import { MESSAGES } from '../src/site/i18n/messages/index.js';
import { loadSummaries } from '../src/summaries.js';
import {
  categoryCoverage, enHash, englishHashes, namesChanged, readLanguage, readUiHashes, summaryCoverage, summaryProblems, TRANSLATIONS_DIR,
  UI_HASHES_FILE, uiReport,
} from '../src/translations.js';

const LISTS = 'out/lists.jsonl';

function localeArg(value: string | undefined, flag: string): Locale | null {
  if (value === undefined) return null;
  if (!isLocale(value) || value === 'en') throw new Error(`${flag}: not one of ${OTHER_LOCALES.join(', ')}`);
  return value;
}

/** The categories of the last run, from the public lists file; null when there is none. */
function categoriesOfRun(): string[] | null {
  if (!existsSync(LISTS)) return null;
  const names = new Set<string>();
  for (const line of readFileSync(LISTS, 'utf8').split('\n')) {
    if (line.trim() === '') continue;
    const c = (JSON.parse(line) as { category?: unknown }).category;
    if (typeof c === 'string' && c !== '') names.add(c);
  }
  return [...names];
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      lang: { type: 'string' },
      stamp: { type: 'string' },
      'hash-lists': { type: 'string' },
      all: { type: 'boolean', default: false },
    },
    strict: true,
  });
  const out = (s: string): void => {
    process.stdout.write(`${s}\n`);
  };
  const summaries = await loadSummaries();
  const english = new Map([...summaries].map(([id, e]) => [id, e.summary]));

  const stamp = localeArg(values.stamp, '--stamp');
  if (stamp !== null) {
    const hashes = readUiHashes();
    hashes[stamp] = englishHashes();
    writeFileSync(UI_HASHES_FILE, `${JSON.stringify(hashes, null, 2)}\n`);
    out(`${UI_HASHES_FILE}: ${stamp} recorded as translated from the current English (${Object.keys(hashes[stamp]).length} messages).`);
  }
  const hashLists = localeArg(values['hash-lists'], '--hash-lists');
  if (hashLists !== null) {
    const file = join(TRANSLATIONS_DIR, `lists.${hashLists}.json`);
    const data = JSON.parse(readFileSync(file, 'utf8')) as Record<string, { summary: string; enHash?: string }>;
    let n = 0;
    for (const [id, t] of Object.entries(data)) {
      const text = english.get(id);
      if (t.enHash === undefined && text !== undefined) {
        t.enHash = enHash(text);
        n++;
      }
    }
    writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
    out(`${file}: enHash given to ${n} summaries.`);
  }

  const only = localeArg(values.lang, '--lang');
  const categories = categoriesOfRun();
  const hashes = readUiHashes();
  const show = (ids: readonly string[]): string => {
    if (ids.length === 0) return '';
    const shown = values.all ? ids : ids.slice(0, 10);
    return `\n      ${shown.join('\n      ')}${shown.length < ids.length ? `\n      … and ${ids.length - shown.length} more (--all)` : ''}`;
  };
  let failed = false;

  out(`${english.size} English summaries; ${categories === null ? `no ${LISTS}, so categories are not checked` : `${categories.length} categories`}.`);
  for (const locale of only === null ? OTHER_LOCALES : [only]) {
    const files = readLanguage(TRANSLATIONS_DIR, locale);
    out(`\n${locale}`);
    for (const p of files.problems) out(`  cannot read ${p}`);
    if (files.problems.length > 0) failed = true;

    const s = summaryCoverage(english, files);
    const broken: string[] = [];
    const names: string[] = [];
    for (const [id, t] of files.lists) {
      const text = english.get(id);
      if (text === undefined) continue;
      const problems = summaryProblems(locale, t.summary);
      if (problems.length > 0) broken.push(`${id}: ${problems.join('; ')}`);
      const changed = namesChanged(text, t.summary);
      if (changed.length > 0) names.push(`${id}: ${changed.join(', ')}`);
    }
    out(`  summaries: ${s.translated} of ${english.size} translated`);
    out(`    missing: ${s.missing.length}${show(s.missing)}`);
    out(`    stale (the English changed since): ${s.stale.length}${show(s.stale)}`);
    out(`    without enHash: ${s.unhashed.length}${show(s.unhashed)}`);
    out(`    naming no list: ${s.unknown.length}${show(s.unknown)}`);
    out(`    breaking a rule: ${broken.length}${show(broken)}`);
    out(`    product names not kept as in the English (check by eye): ${names.length}${show(names)}`);
    if (s.unknown.length > 0 || broken.length > 0) failed = true;

    if (categories !== null) {
      const c = categoryCoverage(categories, files);
      out(`  categories: ${c.translated} of ${categories.length} translated`);
      out(`    missing: ${c.missing.length}${show(c.missing)}`);
      out(`    naming no category: ${c.unknown.length}${show(c.unknown)}`);
      if (c.unknown.length > 0) failed = true;
    } else {
      out(`  categories: ${files.categories.size} translated (not compared)`);
    }

    const ui = uiReport(locale, MESSAGES[locale], hashes);
    if (ui.untranslated) {
      out(`  messages: untranslated (messages/${locale}.ts is still a copy of the English)`);
    } else {
      out(`  messages: ${ui.sameAsEnglish.length} the same as the English${show(ui.sameAsEnglish)}`);
      out(`    English changed since (or not stamped): ${ui.stale.length}${show(ui.stale)}`);
    }
    out(`    broken (placeholders, tags or plural forms): ${ui.broken.length}${show(ui.broken)}`);
    if (ui.broken.length > 0) failed = true;
  }
  if (failed) process.exitCode = 1;
}

main().catch((e: unknown) => {
  process.stderr.write(`${e instanceof Error ? e.message : String(e)}\n`);
  process.exitCode = 1;
});
