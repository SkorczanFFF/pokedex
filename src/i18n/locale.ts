import { useTranslation } from "react-i18next";

/** The languages the UI is written in, in the order the switch lists them. */
export const SUPPORTED_LANGUAGES = ["en", "pl"] as const;

export type Locale = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LOCALE: Locale = "en";

export const isLocale = (s: string | null | undefined): s is Locale =>
  s != null && (SUPPORTED_LANGUAGES as readonly string[]).includes(s);

/** The language the UI is reading in: what i18next resolved, else English. */
export const useLocale = (): Locale => {
  const { i18n } = useTranslation();
  const resolved = i18n.resolvedLanguage;
  return isLocale(resolved) ? resolved : DEFAULT_LOCALE;
};
