import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useEra } from "@/app/era/context";
import { MENU_ITEM, MenuCursor } from "@/components/menu";
import { abilityRule } from "@/domain/abilities";
import { useNotInEraText } from "@/features/shared/useNotInEraText";
import { humanize } from "@/i18n/labels";
import { Attacks, Profile } from "./Matchup";
import { MoveCalc } from "./MoveCalc";
import { StatDuel } from "./StatDuel";
import type { Fighter, Known, Side, Tab } from "./model";
import { useVersus } from "./versusContext";

/** The text box under the field: the matchup, a profile, a calculation, or what is wrong. */
export const VersusMessage = ({
  yours,
  foe,
  tab,
  onTab,
}: {
  yours: Fighter;
  foe: Fighter;
  tab: Tab;
  onTab: (tab: Tab) => void;
}) => {
  const { t } = useTranslation();
  const { era } = useEra();
  const { chart, abilities } = useVersus();
  const fighters = [yours, foe];
  const ready = fighters.filter(
    (fighter): fighter is Known => fighter.status === "ready",
  );
  const problems = fighters.filter(
    (fighter) => fighter.status !== "ready" && fighter.status !== "empty",
  );
  const rule = (side: Side) => abilityRule(abilities[side]);

  return (
    <div className="space-y-6">
      {problems.map((fighter) => (
        <Problem key={fighter.side} fighter={fighter} />
      ))}

      {ready.length === 2 && (
        <>
          <div className="flex flex-wrap gap-4">
            <TabButton active={tab === "types"} onClick={() => onTab("types")}>
              {t("versus.tabTypes")}
            </TabButton>
            <TabButton active={tab === "stats"} onClick={() => onTab("stats")}>
              {t("versus.tabStats")}
            </TabButton>
            <TabButton active={tab === "moves"} onClick={() => onTab("moves")}>
              {t("versus.tabMoves")}
            </TabButton>
          </div>
          {tab === "types" && (
            <div className="grid gap-6 md:grid-cols-2">
              <Attacks
                chart={chart}
                attacker={ready[0].pokemon}
                defender={ready[1].pokemon}
                abilities={{ attacker: rule("a"), defender: rule("b") }}
              />
              <Attacks
                chart={chart}
                attacker={ready[1].pokemon}
                defender={ready[0].pokemon}
                abilities={{ attacker: rule("b"), defender: rule("a") }}
              />
            </div>
          )}
          {tab === "stats" && <StatDuel yours={ready[0].pokemon} foe={ready[1].pokemon} />}
          {tab === "moves" && <MoveCalc yours={ready[0]} foe={ready[1]} />}
        </>
      )}

      {ready.length === 1 && (
        <Profile
          chart={chart}
          pokemon={ready[0].pokemon}
          abilities={{ defender: rule(ready[0].side) }}
        />
      )}

      {ready.length === 0 && problems.length === 0 && (
        <p className="text-xs leading-relaxed">{t("versus.empty")}</p>
      )}

      {/* Retro has no abilities to count or to leave out. */}
      {ready.length > 0 && era.hasAbilities && (
        <p className="text-[10px] leading-relaxed text-gray-500">
          {t("versus.abilitiesScope")}
        </p>
      )}
    </div>
  );
};

const Problem = ({ fighter }: { fighter: Fighter }) => {
  const { t } = useTranslation();
  const notInEra = useNotInEraText();

  let text: string;
  if (fighter.status === "outOfEra") {
    text = notInEra(fighter.pokemon);
  } else if (fighter.status === "notFound") {
    text = t("versus.notFound", { name: fighter.name ? humanize(fighter.name) : "" });
  } else {
    text = t("error.details");
  }

  return (
    <p role="alert" className="text-xs leading-relaxed">
      {text}
    </p>
  );
};

/**
 * A menu line; the open one keeps the cursor and is pressed yellow, the way
 * the language pair and the Retro toggle show which is on.
 */
const TabButton = ({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={`${MENU_ITEM} px-2 py-1 ${
      active ? "bg-dex-yellow text-black hover:text-black" : ""
    }`}
  >
    <MenuCursor className={active ? "" : "opacity-0 group-hover:opacity-50"} />
    {children}
  </button>
);
