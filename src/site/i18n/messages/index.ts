// The messages of every language, by locale.
import type { Locale } from '../locales.js';
import { de } from './de.js';
import { en, type Messages } from './en.js';
import { es } from './es.js';
import { fr } from './fr.js';
import { id } from './id.js';
import { ja } from './ja.js';
import { ko } from './ko.js';
import { pt } from './pt.js';
import { ru } from './ru.js';
import { zh } from './zh.js';

export const MESSAGES: Readonly<Record<Locale, Messages>> = { en, zh, es, pt, ja, de, fr, ru, ko, id };
