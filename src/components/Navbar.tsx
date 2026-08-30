import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./LanguageSwitcher";

const Navbar = () => {
  const { t } = useTranslation();

  return (
    <nav
      aria-label={t("nav.main")}
      className="fixed top-0 left-0 right-0 bg-[#E12025] text-white z-50"
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-12">
          <Link to="/">
            <span className="text-xl font-bold">Pokédex</span>
          </Link>
          <LanguageSwitcher />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
