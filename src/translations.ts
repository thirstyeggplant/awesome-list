// The translations of our own words: summaries of lists, category names and the site's messages.
//
//   translations/lists.{code}.json       { "<list id>": { "summary": "…", "enHash": "<12 hex>" } }, keyed as summaries/lists.json
//   translations/categories.{code}.json  { "<English category name>": "…" }
//   src/site/i18n/messages/{code}.ts      the messages, typed as the English ones
//   src/site/i18n/ui-hashes.json          { "<code>": { "<key>": "<12 hex>" } }: the English each message was translated from
//
// `enHash` is the first 12 hex characters of the SHA-256 of the English a text was translated from, so a changed
// English text shows up as stale. Missing and stale summaries and categories never fail a build: the English is
// shown (missing) or the old translation is (stale). Translations are made from our English and nothing else.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { isPlural, PLURAL_CATEGORIES, slotsOf, type Plural } from './site/i18n/format.js';
import { LOCALE_INFO, type Locale } from './site/i18n/locales.js';
import { en, type Messages } from './site/i18n/messages/en.js';

/** The translations folder of this repository. */
export const TRANSLATIONS_DIR = fileURLToPath(new URL('../translations/', import.meta.url));
export const UI_HASHES_FILE = fileURLToPath(new URL('./site/i18n/ui-hashes.json', import.meta.url));

/** The first 12 hex characters of the SHA-256 of a text (as `sourceHash` in summaries.ts). */
export function enHash(text: string): string {
  return createHash('sha256').update(text).digest('hex').slice(0, 12);
}

const SummaryTranslation = z.object({
  summary: z.string(),
  enHash: z.string().regex(/^[0-9a-f]{12}$/).optional(),
}).strict();
export type SummaryTranslation = z.infer<typeof SummaryTranslation>;
const ListsFile = z.record(z.string().min(1), SummaryTranslation);
const CategoriesFile = z.record(z.string().min(1), z.string());

export interface LanguageFiles {
  /** By list id. */
  lists: Map<string, SummaryTranslation>;
  /** By English category name. */
  categories: Map<string, string>;
  /** A file that is there but could not be read, with why. */
  problems: string[];
}

function readJson<T>(path: string, schema: z.ZodType<T>, problems: string[]): T | null {
  if (!existsSync(path)) return null;
  try {
    const r = schema.safeParse(JSON.parse(readFileSync(path, 'utf8')));
    if (r.success) return r.data;
    problems.push(`${path}: ${r.error.issues.slice(0, 3).map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`);
  } catch (e) {
    problems.push(`${path}: ${e instanceof Error ? e.message : String(e)}`);
  }
  return null;
}

/** A language's files; one that is missing is empty, one that cannot be read is empty and named in `problems`. */
export function readLanguage(dir: string, locale: Locale): LanguageFiles {
  const problems: string[] = [];
  const lists = readJson(join(dir, `lists.${locale}.json`), ListsFile, problems) ?? {};
  const categories = readJson(join(dir, `categories.${locale}.json`), CategoriesFile, problems) ?? {};
  return { lists: new Map(Object.entries(lists)), categories: new Map(Object.entries(categories)), problems };
}

export interface Coverage {
  translated: number;
  missing: string[];
  /** Translated from an English text that has changed since. */
  stale: string[];
  /** A summary with no enHash: whether it is current cannot be told. */
  unhashed: string[];
  /** Keys that name no list or category. */
  unknown: string[];
}

/** How far a language's summaries cover the English ones (by list id). */
export function summaryCoverage(english: ReadonlyMap<string, string>, t: LanguageFiles): Coverage {
  const c: Coverage = { translated: 0, missing: [], stale: [], unhashed: [], unknown: [] };
  for (const [id, text] of english) {
    const tr = t.lists.get(id);
    if (tr === undefined || tr.summary.trim() === '') {
      c.missing.push(id);
      continue;
    }
    c.translated++;
    if (tr.enHash === undefined) c.unhashed.push(id);
    else if (tr.enHash !== enHash(text)) c.stale.push(id);
  }
  for (const id of t.lists.keys()) if (!english.has(id)) c.unknown.push(id);
  return c;
}

/** How far a language's category names cover the English ones. */
export function categoryCoverage(english: readonly string[], t: LanguageFiles): Coverage {
  const c: Coverage = { translated: 0, missing: [], stale: [], unhashed: [], unknown: [] };
  for (const name of english) {
    const tr = t.categories.get(name);
    if (tr === undefined || tr.trim() === '') c.missing.push(name);
    else c.translated++;
  }
  const known = new Set(english);
  for (const name of t.categories.keys()) if (!known.has(name)) c.unknown.push(name);
  return c;
}

/**
 * Words of the English with a capital or a digit inside, such as "TensorFlow.js", "GitHub" or "Web3": names to
 * keep as they are. Acronyms (AI, GDPR, APIs) are left out: many languages have their own or their own plural.
 */
export function productNames(text: string): string[] {
  const words = text.split(/[\s,;:()"“”]+/).map((w) => w.replace(/[.,;:!?]+$/, ''));
  return [...new Set(words.filter((w) => /^.+[A-Z0-9]/.test(w) && /[a-z]/.test(w) && !/^[A-Z0-9]+s$/.test(w)))];
}

/** What is wrong with one translated summary, in words; empty when nothing is. */
export function summaryProblems(locale: Locale, translated: string): string[] {
  const out: string[] = [];
  const limit = LOCALE_INFO[locale].cjk ? 100 : 200;
  if (Array.from(translated).length > limit) out.push(`longer than ${limit} characters`);
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f]/.test(translated)) out.push('a control character');
  if (/<[a-z/!]|&[a-z#]+;|\]\(|\*\*|`/i.test(translated)) out.push('markup');
  // One sentence: no sentence end before the last character.
  const ends = translated.trim().slice(0, -1).match(/[.!?](\s|$)|[。！？]/g) ?? [];
  if (ends.length > 0) out.push('more than one sentence');
  return out;
}

/** Product names of the English that the translation does not carry as they are (to check by eye). */
export function namesChanged(englishText: string, translated: string): string[] {
  return productNames(englishText).filter((w) => !translated.includes(w));
}

// ---- The site's messages ----

export type MessageValue = string | Plural;

/** Every message by its dotted key (`nav.lists`, `meta.list.title`); a plural is one message. */
export function flatten(messages: Messages): Map<string, MessageValue> {
  const out = new Map<string, MessageValue>();
  const walk = (v: unknown, key: string): void => {
    if (typeof v === 'string' || isPlural(v)) out.set(key, v);
    else if (typeof v === 'object' && v !== null) for (const [k, x] of Object.entries(v)) walk(x, key === '' ? k : `${key}.${k}`);
  };
  walk(messages, '');
  return out;
}

/** The hash of an English message, as ui-hashes.json keeps it. */
export function uiHash(v: MessageValue): string {
  return enHash(typeof v === 'string' ? v : JSON.stringify(PLURAL_CATEGORIES.filter((c) => v[c] !== undefined).map((c) => [c, v[c]])));
}

export type UiHashes = Record<string, Record<string, string>>;

export function readUiHashes(path = UI_HASHES_FILE): UiHashes {
  if (!existsSync(path)) return {};
  return z.record(z.string(), z.record(z.string(), z.string())).parse(JSON.parse(readFileSync(path, 'utf8')));
}

/** The current English hashes of every message: what `--stamp` records for a language just translated. */
export function englishHashes(): Record<string, string> {
  return Object.fromEntries([...flatten(en)].map(([k, v]) => [k, uiHash(v)]));
}

/** The forms of a message: one for a string, each category for a plural. */
function forms(v: MessageValue): string[] {
  return typeof v === 'string' ? [v] : PLURAL_CATEGORIES.map((c) => v[c]).filter((f): f is string => f !== undefined);
}

export interface UiReport {
  /** The whole file is still the English. */
  untranslated: boolean;
  /** Keys whose value is the same as the English. */
  sameAsEnglish: string[];
  /** Keys whose English changed since they were translated, or that were never recorded in ui-hashes.json. */
  stale: string[];
  /** Keys whose placeholders or tags differ from the English, or whose plural lacks a form the language needs. */
  broken: string[];
}

/** How a language's messages stand against the English. */
export function uiReport(locale: Locale, messages: Messages, hashes: UiHashes): UiReport {
  const english = flatten(en);
  const mine = flatten(messages);
  const recorded = hashes[locale] ?? {};
  const report: UiReport = { untranslated: true, sameAsEnglish: [], stale: [], broken: [] };
  const needed = new Intl.PluralRules(LOCALE_INFO[locale].intl).resolvedOptions().pluralCategories;
  for (const [key, e] of english) {
    const v = mine.get(key);
    if (v === undefined) {
      report.broken.push(key);
      continue;
    }
    const same = JSON.stringify(v) === JSON.stringify(e);
    if (same) report.sameAsEnglish.push(key);
    else report.untranslated = false;
    if (recorded[key] !== uiHash(e)) report.stale.push(key);
    const want = slotsOf(forms(e).join(' ')).filter((s) => !(typeof e !== 'string' && s === '{n}'));
    const ok = forms(v).every((f) => {
      const got = slotsOf(f);
      return want.every((s) => got.includes(s)) && got.every((s) => want.includes(s) || s === '{n}');
    });
    const plural = typeof v !== 'string' && !same ? needed.every((c) => v[c] !== undefined) : true;
    if (!ok || !plural) report.broken.push(key);
  }
  return report;
}
