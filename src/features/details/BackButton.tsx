import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { readOrigin, returnState } from "@/app/listOrigin";
import { paths } from "@/app/routes";

/**
 * Back to wherever the list was. The origin and the scroll offset ride along in
 * history state, put there at click time by the card — so this returns to the
 * page and the position the user actually came from, not to a bare "/".
 */
export const BackButton = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const handleBack = () => {
    const origin = readOrigin(location.state);
    navigate(origin?.from ?? paths.list, { state: returnState(origin) });
  };

  return (
    <button
      onClick={handleBack}
      className="inline-block text-black bg-dex-yellow hover:bg-dex-red hover:text-white px-4 py-2 cursor-pointer"
    >
      {t("details.back")}
    </button>
  );
};
