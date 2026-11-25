// The languages of the site, in one table. Nothing else in the code names a language.
// English is the source and has no prefix; every other language is the same path behind /{code}.

export const LOCALES = ['en', 'zh', 'es', 'pt', 'ja', 'de', 'fr', 'ru', 'ko', 'id'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

export interface LocaleInfo {
  code: Locale;
  /** '' for English, else '/{code}'. */
  prefix: string;
  /** For <link rel="alternate" hreflang> and sitemaps. */
  hreflang: string;
  /** For <html lang>. */
  htmlLang: string;
  /** For Intl formatters. */
  intl: string;
  /** For og:locale. */
  og: string;
  /** The language's name in itself, for the switcher. */
  name: string;
  dir: 'ltr' | 'rtl';
  /** Chinese, Japanese and Korean: titles aim at half the length. */
  cjk: boolean;
}

const row = (
  code: Locale, hreflang: string, htmlLang: string, intl: string, og: string, name: string, cjk = false,
): LocaleInfo => ({ code, prefix: code === 'en' ? '' : `/${code}`, hreflang, htmlLang, intl, og, name, dir: 'ltr', cjk });

export const LOCALE_INFO: Readonly<Record<Locale, LocaleInfo>> = {
  en: row('en', 'en', 'en', 'en-US', 'en_US', 'English'),
  zh: row('zh', 'zh-Hans', 'zh-Hans', 'zh-CN', 'zh_CN', '简体中文', true),
  es: row('es', 'es', 'es', 'es', 'es_ES', 'Español'),
  pt: row('pt', 'pt', 'pt-BR', 'pt-BR', 'pt_BR', 'Português'),
  ja: row('ja', 'ja', 'ja', 'ja-JP', 'ja_JP', '日本語', true),
  de: row('de', 'de', 'de', 'de-DE', 'de_DE', 'Deutsch'),
  fr: row('fr', 'fr', 'fr', 'fr-FR', 'fr_FR', 'Français'),
  ru: row('ru', 'ru', 'ru', 'ru-RU', 'ru_RU', 'Русский'),
  ko: row('ko', 'ko', 'ko', 'ko-KR', 'ko_KR', '한국어', true),
  id: row('id', 'id', 'id', 'id-ID', 'id_ID', 'Bahasa Indonesia'),
};

/** Every language but English: the ones with a prefix, a translations file and an i18n data file. */
export const OTHER_LOCALES: readonly Locale[] = LOCALES.filter((l) => l !== DEFAULT_LOCALE);

export function isLocale(code: string): code is Locale {
  return (LOCALES as readonly string[]).includes(code);
}

/**
 * The language a path is in and the path without its prefix: `/es/lists` is Spanish `/lists`, `/es` is Spanish `/`.
 * A path with no known prefix is English. `/en` is not a prefix (the app redirects it).
 */
export function localeOfPath(path: string): { locale: Locale; rest: string } {
  const m = /^\/([a-z]{2})(?=\/|$)(.*)$/.exec(path);
  const code = m?.[1];
  if (code !== undefined && code !== DEFAULT_LOCALE && isLocale(code)) return { locale: code, rest: m?.[2] || '/' };
  return { locale: DEFAULT_LOCALE, rest: path };
}

/** A path in a language: the prefix, then the unprefixed path ('/' becomes the bare prefix). */
export function localePath(locale: Locale, path: string): string {
  const prefix = LOCALE_INFO[locale].prefix;
  if (prefix === '') return path;
  if (path === '/') return prefix;
  if (path.startsWith('/?') || path.startsWith('/#')) return prefix + path.slice(1);
  return prefix + path;
}
