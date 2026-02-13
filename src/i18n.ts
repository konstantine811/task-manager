import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import translationEN from "./locales/en/translation.json";
import translationUA from "./locales/ua/translation.json";
import { LocalStorageKey } from "./config/local-storage.config";

export enum LanguageType {
  EN = "en",
  UA = "ua",
}

const getBrowserLanguage = (): string => {
  try {
    const stored = localStorage.getItem(LocalStorageKey.lang);
    if (stored) return JSON.parse(stored) as string;
  } catch {
    // ignore
  }
  return LanguageType.UA;
};

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: translationEN },
    ua: { translation: translationUA },
  },
  lng: getBrowserLanguage(),
  fallbackLng: LanguageType.EN,
  interpolation: { escapeValue: false },
});

export default i18n;
