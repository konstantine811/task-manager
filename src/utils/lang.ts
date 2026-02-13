import { LanguageType } from "@/i18n";

export function getDateFnsLocaleCode(lang: string): string {
  return lang === LanguageType.UA ? "uk" : lang;
}
