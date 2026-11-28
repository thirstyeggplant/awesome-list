// What a view knows about the language of the request: its messages, its formatters, its addresses, and the
// translated summaries and category names. One per request (cheap: the parts are shared).
import { html, type Html } from '../html.js';
import {
  dayOfIso, dayToDate, fmt, fmtHtml, formatters, isoDay, isPlural, pluralForm, type HtmlVars, type Plural, type Tags, type Vars,
} from './format.js';
import { LOCALE_INFO, localePath, type Locale, type LocaleInfo } from './locales.js';
import { en, type Messages } from './messages/en.js';
import { MESSAGES } from './messages/index.js';

/** /_data/i18n/{code}.json: what the build translated for one language. */
export interface I18nData {
  /** Category names by slug. */
  categories: Readonly<Record<string, string>>;
  /** Our summaries by list slug. */
  summaries: Readonly<Record<string, string>>;
}

export const NO_I18N_DATA: I18nData = { categories: {}, summaries: {} };

/** The English plurals, as text: a language's plural that is one of these is not translated yet. */
const ENGLISH_PLURALS = new Set<string>();
(function collect(v: unknown): void {
  if (isPlural(v)) ENGLISH_PLURALS.add(JSON.stringify(v));
  else if (typeof v === 'object' && v !== null) Object.values(v).forEach(collect);
})(en);
const stillEnglish = new WeakMap<Plural, boolean>();

/** Whether a plural is still the English one (so English rules choose its form: "671 lists", not "671 list"). */
function isEnglishPlural(forms: Plural): boolean {
  let v = stillEnglish.get(forms);
  if (v === undefined) {
    v = ENGLISH_PLURALS.has(JSON.stringify(forms));
    stillEnglish.set(forms, v);
  }
  return v;
}

/** A text and whether it is the English fallback, which a page marks with lang="en". */
export interface Shown { text: string; en: boolean }

export class Loc {
  readonly info: LocaleInfo;

  constructor(
    readonly locale: Locale,
    readonly m: Messages = MESSAGES[locale],
    readonly data: I18nData = NO_I18N_DATA,
  ) {
    this.info = LOCALE_INFO[locale];
  }

  get prefix(): string {
    return this.info.prefix;
  }

  /** A message with its placeholders filled. */
  t(msg: string, vars: Vars = {}): string {
    return fmt(msg, vars);
  }

  /** A message as HTML, with values (escaped unless Html) and numbered tags. */
  h(msg: string, vars: HtmlVars = {}, tags: Tags = {}): Html {
    return fmtHtml(msg, vars, tags);
  }

  /** A number as the language writes it; '' for null. */
  n(x: number | null): string {
    return x === null ? '' : formatters(this.info.intl).number.format(x);
  }

  /** A plural for a count, with `{n}` the formatted count and any other values. */
  plural(forms: Plural, count: number, vars: Vars = {}): string {
    const rules = this.locale !== 'en' && isEnglishPlural(forms) ? LOCALE_INFO.en.intl : this.info.intl;
    return fmt(pluralForm(rules, forms, count), { ...vars, n: this.n(count) });
  }

  /** A day number as a date; '' for null. */
  day(day: number | null): string {
    return day === null ? '' : formatters(this.info.intl).day.format(dayToDate(day));
  }

  /** A day number as a <time> with its ISO date; nothing for null. */
  time(day: number | null): Html {
    return day === null ? html`` : html`<time datetime="${isoDay(day)}">${this.day(day)}</time>`;
  }

  /** An ISO time as a <time>; the text itself when it is not a time. */
  timeIso(iso: string): Html {
    const d = dayOfIso(iso);
    return d === null ? html`${iso}` : this.time(d);
  }

  /** An ISO time as a date; the text itself when it is not a time. */
  dayIso(iso: string): string {
    const d = dayOfIso(iso);
    return d === null ? iso : this.day(d);
  }

  monthYear(day: number): string {
    return formatters(this.info.intl).month.format(dayToDate(day));
  }

  /** A short list of names: "A, B, C". (Intl.ListFormat joins Chinese names with nothing between them.) */
  list(names: readonly string[]): string {
    return names.join(this.m.common.separator);
  }

  /** An address inside the site, in this language. */
  href(path: string): string {
    return localePath(this.locale, path);
  }

  /** Our summary of a list in this language, else the English. */
  summary(list: { slug: string; summary: string | null }): Shown | null {
    const t = this.data.summaries[list.slug];
    if (t !== undefined && t !== '') return { text: t, en: false };
    return list.summary === null ? null : { text: list.summary, en: this.locale !== 'en' };
  }

  /** A category's name in this language, else the English. */
  category(cat: { slug: string; name: string }): Shown {
    const t = this.data.categories[cat.slug];
    if (t !== undefined && t !== '') return { text: t, en: false };
    return { text: cat.name, en: this.locale !== 'en' };
  }

  /** A text, inside a span with lang="en" when it is the English fallback. */
  shown(s: Shown): Html {
    return s.en ? html`<span lang="en">${s.text}</span>` : html`${s.text}`;
  }
}

/** The English Loc, for code that has no request (tests, the build). */
export const ENGLISH = new Loc('en');
