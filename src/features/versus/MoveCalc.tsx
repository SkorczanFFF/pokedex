import { useTranslation } from "react-i18next";
import { useEra } from "@/app/era/context";
import { battleStats, firstToMove } from "@/domain/damage";
import { statsInEra } from "@/domain/pokemonView";
import { STAT, statValue, type StatInEra } from "@/domain/stats";
import { useEdited, type Edits } from "@/features/shared/useEdited";
import { humanize } from "@/i18n/labels";
import { MoveSide } from "./MoveSide";
import { OTHER, type Known, type Side } from "./model";
import { useVersus } from "./versusContext";

/**
 * The Moves tab: a calculator, not a simulation. Each side picks a move from
 * its own learnset of the era, and the text box says what one hit of it does
 * to the other — the damage at both ends of the roll, the share of HP, the
 * hits to a knockout — with the level, the stats and the power all open to be
 * typed over. Who moves first comes off the two Speeds.
 */
export const MoveCalc = ({ yours, foe }: { yours: Known; foe: Known }) => {
  const { t } = useTranslation();
  const { era } = useEra();
  const { sides } = useVersus();
  const fighters: Record<Side, Known> = { a: yours, b: foe };

  const basis = (side: Side) =>
    `${fighters[side].name}|${sides[side].level}|${era.maxGen}`;
  const [editsA, editA] = useEdited(basis("a"));
  const [editsB, editB] = useEdited(basis("b"));
  const edits: Record<Side, Edits> = { a: editsA, b: editsB };
  const edit: Record<Side, (name: string, value: number | null) => void> = {
    a: editA,
    b: editB,
  };

  const stats = (side: Side): StatInEra[] =>
    battleStats(statsInEra(fighters[side].pokemon, era), sides[side].level, era).map(
      (stat) => ({ ...stat, value: edits[side][stat.name] ?? stat.value }),
    );
  const grown: Record<Side, StatInEra[]> = { a: stats("a"), b: stats("b") };

  const speed: Record<Side, number> = {
    a: statValue(grown.a, STAT.speed),
    b: statValue(grown.b, STAT.speed),
  };
  const first = firstToMove(speed.a, speed.b);

  return (
    <div className="space-y-6">
      <div className="grid gap-8 md:grid-cols-2">
        {(["a", "b"] as const).map((side) => (
          <MoveSide
            key={side}
            side={side}
            attacker={fighters[side]}
            defender={fighters[OTHER[side]]}
            stats={grown[side]}
            defenderStats={grown[OTHER[side]]}
            onEdit={edit[side]}
          />
        ))}
      </div>

      <p className="text-xs leading-relaxed">
        {first === "tie"
          ? t("versus.tie", { speed: speed.a })
          : t("versus.first", {
              name: humanize(fighters[first].name),
              speed: speed[first],
              other: speed[OTHER[first]],
            })}
      </p>
      <p className="text-[10px] leading-relaxed text-gray-500">
        {t(era.statFormula === "dv" ? "versus.assumptionsRetro" : "versus.assumptions")}
      </p>
    </div>
  );
};
