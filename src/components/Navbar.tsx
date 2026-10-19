import { useEffect, useId, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { paths } from "@/app/routes";
import { DEFAULT_ERA } from "@/domain/era";
import EraToggle from "@/era/EraToggle";
import { useEra } from "@/era/context";
import { SUPPORTED_LANGUAGES, useLocale } from "@/i18n/locale";
import LanguageSwitcher from "./LanguageSwitcher";
import { MENU_ITEM, MenuCursor } from "./BattleScreen";

const PAGES = [
  { to: paths.types, label: "types.link" },
  { to: paths.versus, label: "nav.versus" },
] as const;

/**
 * The logo on the left and, from `md`, everything else on the right: the era,
 * the language, the two pages. Under `md` the right side folds into one MENU
 * button that drops the same four lines in a Game Boy menu box.
 */
const Navbar = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const menuId = useId();
  const [open, setOpen] = useState(false);

  // A pick is a navigation, and the menu is not a page to come back to.
  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const pageLink = ({ isActive }: { isActive: boolean }) =>
    `px-2 py-1 text-xs whitespace-nowrap focus-ring ${
      isActive ? "underline underline-offset-4" : "hover:bg-dex-red-dark"
    }`;

  return (
    <nav
      aria-label={t("nav.main")}
      className="fixed top-0 left-0 right-0 bg-dex-red text-white z-50"
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-nav">
          <Link to={paths.list}>
            <span className="text-xl font-bold">Pokédex</span>
          </Link>

          <div className="hidden md:flex items-center gap-3">
            <EraToggle />
            <LanguageSwitcher />
            {PAGES.map((page) => (
              <NavLink key={page.to} to={page.to} className={pageLink}>
                {t(page.label)}
              </NavLink>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-controls={menuId}
            className={`md:hidden px-2 py-1 text-xs cursor-pointer focus-ring ${
              open ? "bg-dex-yellow text-black" : "hover:bg-dex-red-dark"
            }`}
          >
            {t("nav.menu")}
          </button>
        </div>
      </div>

      {open && (
        <div id={menuId} className="md:hidden container mx-auto px-4 pb-4">
          <GameBoyMenu />
        </div>
      )}
    </nav>
  );
};

/**
 * The Gen I pause menu: a white box, a black frame, a cursor on every line.
 * The era and the language read like the OPTIONS screen, a name and its
 * setting; the two pages are plain lines that go somewhere.
 */
const GameBoyMenu = () => {
  const { t, i18n } = useTranslation();
  const { name, setEra } = useEra();
  const isRetro = name === "retro";
  const current = useLocale();

  return (
    <div className="border-4 border-black bg-white p-4 text-black">
      <ul className="space-y-4">
        <li>
          <button
            type="button"
            onClick={() => setEra(isRetro ? DEFAULT_ERA : "retro")}
            aria-pressed={isRetro}
            aria-label={t(isRetro ? "era.disable" : "era.enable")}
            className={`${MENU_ITEM} w-full`}
          >
            <MenuCursor />
            {t("era.retro")}
            <span className="ml-auto">{isRetro ? ":ON" : ":OFF"}</span>
          </button>
        </li>
        <li>
          <div
            role="group"
            aria-label={t("nav.language")}
            className="flex items-center gap-2 text-sm"
          >
            <span aria-hidden="true" className="opacity-50">
              {">"}
            </span>
            {t("nav.language")}
            <span className="ml-auto flex items-center gap-1">
              {SUPPORTED_LANGUAGES.map((lng) => {
                const isActive = current === lng;
                return (
                  <button
                    key={lng}
                    type="button"
                    onClick={() => i18n.changeLanguage(lng)}
                    aria-pressed={isActive}
                    aria-label={t("nav.switchTo", {
                      language: t(`language.${lng}`),
                    })}
                    className={`px-2 py-1 text-xs cursor-pointer focus-ring-dark ${
                      isActive ? "bg-dex-yellow" : "hover:text-dex-red"
                    }`}
                  >
                    {lng.toUpperCase()}
                  </button>
                );
              })}
            </span>
          </div>
        </li>
        {PAGES.map((page) => (
          <li key={page.to}>
            <NavLink
              to={page.to}
              className={({ isActive }) =>
                `${MENU_ITEM} ${isActive ? "text-dex-red" : ""}`
              }
            >
              <MenuCursor />
              {t(page.label)}
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Navbar;
