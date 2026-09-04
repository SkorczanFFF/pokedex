import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * Back to wherever the list was. The origin and the scroll offset ride along in
 * history state, put there at click time by the card — so this returns to the
 * page and the position the user actually came from, not to a bare "/".
 */
export const BackButton = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const navState =
    (location.state as { from?: string; scrollY?: number } | null) ?? null;

  const handleBack = () => {
    navigate(navState?.from ?? "/", {
      state:
        typeof navState?.scrollY === "number"
          ? { restoreScroll: navState.scrollY }
          : null,
    });
  };

  return (
    <button
      onClick={handleBack}
      className="inline-block mb-8 text-black bg-[#FECB09] hover:bg-[#E12025] hover:text-white px-4 py-2 cursor-pointer"
    >
      {t("details.back")}
    </button>
  );
};
