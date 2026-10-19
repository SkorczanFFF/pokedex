import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES, useLocale, type Locale } from "@/i18n/locale";

/**
 * What both language switches share — the pair in the navbar and the line in
 * the phone's menu: the languages, which is on, how to pick one, and what to
 * tell a screen reader each button does.
 */
export const useLanguageSwitch = () => {
  const { t, i18n } = useTranslation();
  const current = useLocale();

  return {
    languages: SUPPORTED_LANGUAGES,
    current,
    switchTo: (locale: Locale) => i18n.changeLanguage(locale),
    switchLabel: (locale: Locale) =>
      t("nav.switchTo", { language: t(`language.${locale}`) }),
  };
};
