import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LINKS } from "@/app/links";
import { paths } from "@/app/routes";

const FOOTER_LINK = "hover:text-dex-yellow";

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-gray-800 text-white text-xs mt-auto">
      <div className="mx-auto px-4 py-2">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-center md:text-left mt-2 md:mt-0 mb-2 md:mb-0">
            <p>
              &copy; {new Date().getFullYear()}{" "}
              <a
                href={LINKS.author}
                target="_blank"
                rel="noopener noreferrer"
                className={FOOTER_LINK}
              >
                Maciej Skorus
              </a>
            </p>
          </div>

          <div className="flex space-x-8">
            {/* PokéAPI used to be linked here; the About page now credits it with the rest. */}
            <Link to={paths.about} className={FOOTER_LINK}>
              {t("about.link")}
            </Link>
            <a
              href={LINKS.repo}
              target="_blank"
              rel="noopener noreferrer"
              className={FOOTER_LINK}
            >
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
