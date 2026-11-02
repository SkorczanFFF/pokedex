import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LINKS } from "@/app/links";
import { paths } from "@/app/routes";

const FOOTER_LINK = "hover:text-dex-yellow";

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-gray-800 text-white text-xs mt-auto">
      <div className="flex space-x-8 px-4 py-2">
        <a href={LINKS.repo} target="_blank" rel="noopener noreferrer" className={FOOTER_LINK}>
          GitHub
        </a>
        <Link to={paths.about} className={FOOTER_LINK}>
          {t("about.link")}
        </Link>
      </div>
    </footer>
  );
};

export default Footer;
