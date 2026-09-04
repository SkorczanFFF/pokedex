import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  BattleScreen,
  MENU_ITEM,
  MenuCursor,
} from "@/components/BattleScreen";

export const NotFound = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <BattleScreen opponent="404">
      <h1 className="text-sm leading-relaxed md:text-base">
        {t("notFound.wild")}
      </h1>
      <p className="mt-3 text-sm leading-relaxed md:text-base">
        {t("notFound.missingPage")}
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-12">
        <Link to="/" className={MENU_ITEM}>
          <MenuCursor />
          {t("notFound.pokedex")}
        </Link>
        <button type="button" onClick={() => navigate(-1)} className={MENU_ITEM}>
          <MenuCursor />
          {t("notFound.run")}
        </button>
      </div>
    </BattleScreen>
  );
};
