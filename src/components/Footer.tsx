import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

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
                href="https://www.skoftware.pl"
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
            <Link to="/about" className={FOOTER_LINK}>
              {t("about.link")}
            </Link>
            <a
              href="https://github.com/SkorczanFFF/pokedex"
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
