import { Trans, useTranslation } from "react-i18next";
import { Link, NavLink, useParams } from "react-router-dom";
import { LINKS } from "@/app/links";
import { stadiumPath } from "@/app/routes";
import { NotFound } from "@/components/NotFound";
import { GbBox, GbSection, Screen } from "@/components/layout";
import { MENU_ITEM, MenuCursor } from "@/components/menu";
import { Bullets, ExternalLink } from "@/components/prose";
import {
  STADIUM_CUPS,
  STADIUM_GAMES,
  STADIUM_TEAM,
  isStadiumGame,
  type CupId,
  type StadiumGame,
} from "@/domain/stadium";
import { useScrollTopOn } from "@/features/shared/useScrollTopOn";
import { TypeChartAd } from "@/features/types";
import { VersusAd } from "@/features/versus";
import { CupBox } from "./CupBox";
import { CastleRoster, MechanicsBox, ModesBox, PrizesBox } from "./GameSections";

const SOURCES: Record<StadiumGame, { bulbapedia: string; serebii: string }> = {
  "1": { bulbapedia: LINKS.bulbapediaStadium, serebii: LINKS.serebiiStadium },
  "2": { bulbapedia: LINKS.bulbapediaStadium2, serebii: LINKS.serebiiStadium2 },
};

/** The fork: one line per game, each the way to its cups. */
export const StadiumPage = () => {
  const { t } = useTranslation();

  return (
    <Screen title={t("stadium.title")} intro={t("stadium.intro")}>
      <GbBox>
        <ul className="space-y-6">
          {STADIUM_GAMES.map((game) => (
            <li key={game}>
              <Link to={stadiumPath(game)} className={MENU_ITEM}>
                <MenuCursor />
                {t(`stadium.games.${game}.name`)}
              </Link>
              <p className="mt-2 pl-5 text-[10px] leading-relaxed text-gray-500">
                {t(`stadium.games.${game}.line`)}
              </p>
            </li>
          ))}
        </ul>
      </GbBox>
      <WayOn />
    </Screen>
  );
};

/** One game: the rules every cup shares, the cups, then what the game unlocks, its other modes and its mechanics. */
export const StadiumGamePage = () => {
  const { game } = useParams<{ game: string }>();
  useScrollTopOn(game);

  if (!isStadiumGame(game)) return <NotFound />;
  return <GameCups game={game} />;
};

const GameCups = ({ game }: { game: StadiumGame }) => {
  const { t } = useTranslation();
  const notes: Partial<Record<CupId, readonly string[]>> = t(`stadium.notes.${game}`, {
    returnObjects: true,
    ...STADIUM_TEAM,
  });

  return (
    <Screen title={t(`stadium.games.${game}.name`)} intro={t(`stadium.games.${game}.intro`)}>
      <GameSwitch />
      <div className="space-y-6">
        <GbSection heading={t("stadium.general")}>
          <Bullets
            items={t(`stadium.games.${game}.rules`, { returnObjects: true, ...STADIUM_TEAM })}
          />
        </GbSection>
        {STADIUM_CUPS[game].map((cup) => (
          <CupBox key={cup.id} cup={cup} notes={notes[cup.id] ?? []}>
            {cup.id === "castle" && <CastleRoster game={game} />}
          </CupBox>
        ))}
        <PrizesBox game={game} />
        <ModesBox game={game} />
        <MechanicsBox game={game} />
        <p className="text-[10px] leading-relaxed text-gray-500">
          <Trans
            i18nKey="stadium.source"
            components={{
              bp: <ExternalLink href={SOURCES[game].bulbapedia} />,
              serebii: <ExternalLink href={SOURCES[game].serebii} />,
            }}
          />
        </p>
      </div>
      <WayOn />
    </Screen>
  );
};

/** Last, as the chart and Versus end on each other: the way on to a matchup and to the chart. */
const WayOn = () => (
  <div className="mt-10 space-y-4">
    <VersusAd />
    <TypeChartAd />
  </div>
);

/** The other game a step away, the way the fork offered both. */
const GameSwitch = () => {
  const { t } = useTranslation();

  return (
    <nav aria-label={t("stadium.switch")} className="mb-6 flex flex-wrap gap-x-6 gap-y-2">
      {STADIUM_GAMES.map((game) => (
        <NavLink
          key={game}
          to={stadiumPath(game)}
          className={({ isActive }) => `${MENU_ITEM} ${isActive ? "text-dex-red" : ""}`}
        >
          <MenuCursor />
          {t(`stadium.games.${game}.name`)}
        </NavLink>
      ))}
    </nav>
  );
};
