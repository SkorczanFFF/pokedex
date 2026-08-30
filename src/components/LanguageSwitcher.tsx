import { Fragment } from "react";
import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES } from "../i18n";

const LanguageSwitcher = () => {
  const { t, i18n } = useTranslation();
  const current = i18n.resolvedLanguage;

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
              className={`px-2 py-1 text-xs cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                isActive
                  ? "bg-[#FECB09] text-black"
                  : "text-white hover:bg-[#c11a1e]"
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
