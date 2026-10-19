import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { paths } from "@/app/routes";
import {
  BattleActions,
  BattleScreen,
  BattleText,
  BattleTitle,
} from "@/components/BattleScreen";
import { MENU_ITEM, MenuCursor } from "@/components/menu";

export const NotFound = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <BattleScreen opponent="404">
      <BattleTitle>{t("notFound.wild")}</BattleTitle>
      <BattleText>{t("notFound.missingPage")}</BattleText>

      <BattleActions>
        <Link to={paths.list} className={MENU_ITEM}>
          <MenuCursor />
          {t("notFound.pokedex")}
        </Link>
        <button type="button" onClick={() => navigate(-1)} className={MENU_ITEM}>
          <MenuCursor />
          {t("notFound.run")}
        </button>
      </BattleActions>
    </BattleScreen>
  );
};
