import { Fragment } from "react";
import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES, useLocale } from "@/i18n/locale";

const LanguageSwitcher = () => {
  const { t, i18n } = useTranslation();
  const current = useLocale();

  return (
    <div
      role="group"
      aria-label={t("nav.language")}
      className="flex items-center gap-1"
    >
      {SUPPORTED_LANGUAGES.map((lng, index) => {
        const isActive = current === lng;
        return (
          <Fragment key={lng}>
            {index > 0 && (
              <span aria-hidden="true" className="text-white/50 text-xs">
                |
              </span>
            )}
            <button
              type="button"
              onClick={() => i18n.changeLanguage(lng)}
              aria-pressed={isActive}
              aria-label={t("nav.switchTo", { language: t(`language.${lng}`) })}
              className={`px-2 py-1 text-xs cursor-pointer focus-ring ${
                isActive
                  ? "bg-dex-yellow text-black"
                  : "text-white hover:bg-dex-red-dark"
              }`}
            >
              {lng.toUpperCase()}
            </button>
          </Fragment>
        );
      })}
    </div>
  );
};

export default LanguageSwitcher;
