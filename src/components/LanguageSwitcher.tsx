import { Fragment } from "react";
import { useTranslation } from "react-i18next";
import { useLanguageSwitch } from "@/features/shared/useLanguageSwitch";

const LanguageSwitcher = () => {
  const { t } = useTranslation();
  const { languages, current, switchTo, switchLabel } = useLanguageSwitch();

  return (
    <div
      role="group"
      aria-label={t("nav.language")}
      className="flex items-center gap-1"
    >
      {languages.map((lng, index) => {
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
              onClick={() => switchTo(lng)}
              aria-pressed={isActive}
              aria-label={switchLabel(lng)}
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
