// Filling in messages, and numbers, plurals and dates in a language. One set of Intl formatters per
// locale, made on first use and kept for the life of the isolate.
import { html, raw, type Html, type Part } from '../html.js';

/** A message that depends on a count. `other` is required; each language gives the categories its rules need. */
export interface Plural {
  zero?: string;
  one?: string;
  two?: string;
  few?: string;
  many?: string;
  other: string;
}

export const PLURAL_CATEGORIES = ['zero', 'one', 'two', 'few', 'many', 'other'] as const;

/** Marks a message as a plural (and keeps its type `Plural`, so a language may add categories English lacks). */
export const p = (forms: Plural): Plural => forms;

export function isPlural(v: unknown): v is Plural {
  if (typeof v !== 'object' || v === null) return false;
  const keys = Object.keys(v);
  return keys.includes('other') && keys.every((k) => (PLURAL_CATEGORIES as readonly string[]).includes(k));
}

export type Vars = Readonly<Record<string, string | number>>;

/** `{name}` placeholders filled from `vars`. A placeholder without a value is left as it is. */
export function fmt(msg: string, vars: Vars = {}): string {
  return msg.replace(/\{(\w+)\}/g, (all, name: string) => {
    const v = vars[name];
    return v === undefined ? all : String(v);
  });
}

export type HtmlVars = Readonly<Record<string, Part>>;
export type Tags = Readonly<Record<number, (inner: Html) => Html>>;

function fill(text: string, vars: HtmlVars): Html {
  const parts = text.split(/\{(\w+)\}/);
  return html`${parts.map((s, i) => (i % 2 === 0 ? s : name(s)))}`;
  function name(n: string): Part {
    return n in vars ? (vars[n] ?? '') : `{${n}}`;
  }
}

/**
 * A message as HTML. Text is escaped; `{name}` takes a value from `vars` (escaped unless it is Html); a numbered
 * tag `<1>…</1>` is made by `tags[1]` from what it holds. Translators can move a tag in the sentence; they cannot
 * write HTML: a tag with no maker is dropped and its text kept.
 */
export function fmtHtml(msg: string, vars: HtmlVars = {}, tags: Tags = {}): Html {
  const out: Html[] = [];
  const re = /<(\d+)>([\s\S]*?)<\/\1>/g;
  let last = 0;
  for (let m = re.exec(msg); m !== null; m = re.exec(msg)) {
    out.push(fill(msg.slice(last, m.index), vars));
    const inner = fill(m[2] ?? '', vars);
    const make = tags[Number(m[1])];
    out.push(make ? make(inner) : inner);
    last = m.index + m[0].length;
  }
  out.push(fill(msg.slice(last), vars));
  return raw(out.map((h) => h.value).join(''));
}

/** The `{name}` placeholders and numbered tags of a message, sorted: what every translation must keep. */
export function slotsOf(msg: string): string[] {
  const names = [...msg.matchAll(/\{(\w+)\}/g)].map((m) => `{${m[1] ?? ''}}`);
  const tags = [...msg.matchAll(/<(\d+)>/g)].map((m) => `<${m[1] ?? ''}>`);
  return [...new Set([...names, ...tags])].sort();
}

interface Formatters {
  number: Intl.NumberFormat;
  rules: Intl.PluralRules;
  day: Intl.DateTimeFormat;
  month: Intl.DateTimeFormat;
}

const kept = new Map<string, Formatters>();

export function formatters(intl: string): Formatters {
  let f = kept.get(intl);
  if (!f) {
    f = {
      number: new Intl.NumberFormat(intl),
      rules: new Intl.PluralRules(intl),
      day: new Intl.DateTimeFormat(intl, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }),
      month: new Intl.DateTimeFormat(intl, { month: 'short', year: 'numeric', timeZone: 'UTC' }),
    };
    kept.set(intl, f);
  }
  return f;
}

/** The form of a plural for a count: the category the language's rules choose, else `other`. */
export function pluralForm(intl: string, forms: Plural, count: number): string {
  const cat = formatters(intl).rules.select(count);
  return forms[cat] ?? forms.other;
}

const DAY_MS = 86_400_000;

export function dayToDate(day: number): Date {
  return new Date(day * DAY_MS);
}

/** A day number (days since 1970-01-01) of an ISO time, or null. */
export function dayOfIso(iso: string): number | null {
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : Math.floor(t / DAY_MS);
}

/** YYYY-MM-DD of a day number. */
export function isoDay(day: number): string {
  return dayToDate(day).toISOString().slice(0, 10);
}
