import { useTranslation } from "react-i18next";
import { useEra } from "@/app/era/context";
import { InlineError } from "@/components/ErrorView";
import { SkeletonBlock } from "@/components/Skeleton";
import { ClassBadge, EffectChip, TypeBadge } from "@/components/badges";
import { phraseKey } from "@/components/effectiveness";
import { abilityRule } from "@/domain/abilities";
import { computeHit, hitsToKo } from "@/domain/damage";
import { typingInEra } from "@/domain/pokemonView";
import type { StatInEra } from "@/domain/stats";
import { useEdited } from "@/features/shared/useEdited";
import { useMoveInGame } from "@/features/shared/useMoveInGame";
import { humanize, useMoveLabel } from "@/i18n/labels";
import { CALC_INPUT } from "./MoveSide";
import { OTHER, type Known, type Side } from "./model";
import { useVersus } from "./versusContext";

/** What one hit of the move does to the other side, in the games' words and in numbers. */
export const HitResult = ({
  side,
  move,
  game,
  attacker,
  defender,
  stats,
  defenderStats,
}: {
  side: Side;
  move: string;
  game: string;
  attacker: Known;
  defender: Known;
  stats: StatInEra[];
  defenderStats: StatInEra[];
}) => {
  const { t } = useTranslation();
  const { era } = useEra();
  const { chart, abilities, sides } = useVersus();
  const level = sides[side].level;
  const moveLabel = useMoveLabel();
  const [edits, edit] = useEdited(`${move}|${era.maxGen}`);
  const { move: inGame, isLoading, error } = useMoveInGame(move, game);

  if (isLoading) return <SkeletonBlock className="h-24" />;
  if (error || !inGame) return <InlineError>{t("error.details")}</InlineError>;

  const power = edits.power ?? inGame.power;
  const hit = computeHit({
    move: inGame,
    power,
    level,
    attackerTypes: typingInEra(attacker.pokemon, era),
    defenderTypes: typingInEra(defender.pokemon, era),
    stats,
    defenderStats,
    abilities: {
      attacker: abilityRule(abilities[side]),
      defender: abilityRule(abilities[OTHER[side]]),
    },
    chart,
    era,
  });
  const { damageClass: cls, type, stab, effectiveness: value, hp, range } = hit;
  const percent = (damage: number) => ((damage / hp) * 100).toFixed(1);
  const foeName = humanize(defender.name);

  return (
    <div className="space-y-3 border-l-4 border-black pl-3">
      <p className="text-xs uppercase leading-relaxed">
        {t("versus.used", { name: humanize(attacker.name), move: moveLabel(move) })}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <TypeBadge type={type} />
        <ClassBadge damageClass={cls} />
        {stab && (
          <span className="bg-dex-yellow px-2 py-1 text-[10px] leading-none">
            {t("versus.stab")}
          </span>
        )}
        {cls !== "status" && (
          <label className="ml-auto flex items-center gap-1 text-[10px] text-gray-500">
            {t("versus.power")}
            <input
              type="number"
              min={0}
              value={power ?? ""}
              onChange={(e) => {
                if (e.target.value === "") return edit("power", null);
                const typed = Math.floor(Number(e.target.value));
                if (Number.isFinite(typed) && typed >= 0) edit("power", typed);
              }}
              className={`${CALC_INPUT} w-16 px-1`}
            />
          </label>
        )}
      </div>

      {cls === "status" ? (
        <p className="text-xs leading-relaxed text-gray-500">{t("versus.noDamage")}</p>
      ) : value === 0 ? (
        <p className="flex flex-wrap items-center gap-2 text-xs leading-relaxed">
          <EffectChip value={0} />
          {t("versus.noEffect", { name: foeName })}
        </p>
      ) : power === null ? (
        <p className="text-xs leading-relaxed text-gray-500">{t("versus.enterPower")}</p>
      ) : (
        range && (
          <>
            <p className="flex flex-wrap items-center gap-2 text-xs leading-relaxed">
              <EffectChip value={value} />
              <span className={value === 1 ? "text-gray-500" : ""}>
                {t(phraseKey(value), { name: foeName })}
              </span>
            </p>
            <p className="text-sm leading-relaxed">
              {t("versus.damage", {
                min: range.min,
                max: range.max,
                pmin: percent(range.min),
                pmax: percent(range.max),
              })}
            </p>
            <p className="text-xs leading-relaxed">{hitsLine(t, hp, range)}</p>
          </>
        )
      )}
    </div>
  );
};

/** "Falls in 2 hits", or the range between the best roll and the guaranteed one. */
const hitsLine = (
  t: ReturnType<typeof useTranslation>["t"],
  hp: number,
  range: { min: number; max: number },
): string => {
  const { guaranteed, best } = hitsToKo(hp, range);
  return best === guaranteed
    ? t("versus.hits", { count: guaranteed })
    : t("versus.hitsRange", { best, guaranteed });
};
