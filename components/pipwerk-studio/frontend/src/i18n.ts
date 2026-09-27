import i18next, { type i18n } from 'i18next';
import { initReactI18next } from 'react-i18next';

import de from './locales/de.json';
import en from './locales/en.json';

export const supportedLanguages = ['de', 'en'] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];

export const defaultLanguage: SupportedLanguage = 'de';

// Language names are shown in their own language and are not translated.
export const languageNames: Record<SupportedLanguage, string> = {
  de: 'Deutsch',
  en: 'English',
};

export const resources = {
  de: { translation: de },
  en: { translation: en },
} as const;

export function isSupportedLanguage(value: string): value is SupportedLanguage {
  return (supportedLanguages as readonly string[]).includes(value);
}

export function createI18n(language: SupportedLanguage = defaultLanguage): i18n {
  const instance = i18next.createInstance();
  void instance.use(initReactI18next).init({
    resources,
    lng: language,
    fallbackLng: false,
    supportedLngs: supportedLanguages,
    interpolation: { escapeValue: false },
    initAsync: false,
  });
  return instance;
}
