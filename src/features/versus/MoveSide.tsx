import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useEra } from "@/app/era/context";
import { Dropdown } from "@/components/Dropdown";
import { NumberField } from "@/components/NumberField";
import { MAX_LEVEL, MIN_LEVEL, clampLevel } from "@/domain/damage";
import { learnsetInEra, uniqueMoves } from "@/domain/moves";
import type { StatInEra } from "@/domain/stats";
import { useMoveLabel, useMoveMethodLabel } from "@/i18n/labels";
import { HitResult } from "./HitResult";
import { SideHeading } from "./SideHeading";
import { StatInputs } from "./StatInputs";
import type { Known, Side } from "./model";
import { useVersus } from "./versusContext";

/** Every box a number or a move goes in: one height, one frame, one size of type. */
export const CALC_INPUT = "h-8 border-2 bg-white text-[10px] text-black";

/** One side: its level, its move, its stats, and what the move does to the other. */
export const MoveSide = ({
  side,
  attacker,
  defender,
  stats,
  defenderStats,
  onEdit,
}: {
  side: Side;
  attacker: Known;
  defender: Known;
  /** Both sides' stats as the battle is fought with them, edits applied. */
  stats: StatInEra[];
  defenderStats: StatInEra[];
  onEdit: (name: string, value: number | null) => void;
}) => {
  const { t } = useTranslation();
  const { era } = useEra();
  const { sides, setMove, setLevel } = useVersus();
  const moveLabel = useMoveLabel();
  const methodLabel = useMoveMethodLabel();
  const params = sides[side];
  // What is in the box while it is being typed in, so it can be emptied.
  const [levelDraft, setLevelDraft] = useState<string | null>(null);

  const learnset = learnsetInEra(attacker.pokemon, era);
  const known = new Set(
    learnset.groups.flatMap((group) => group.moves.map((move) => move.name)),
  );
  // A move the URL names that this game does not teach is no pick at all.
  const move = params.move && known.has(params.move) ? params.move : null;

  return (
    <section className="space-y-4">
      <SideHeading side={side} name={attacker.name} />

      <div className="flex flex-wrap gap-3">
        <Field label={t("versus.level")} className="w-24">
          <NumberField
            min={MIN_LEVEL}
            max={MAX_LEVEL}
            value={levelDraft ?? String(params.level)}
            onChange={(raw) => {
              setLevelDraft(raw);
              const level = Number(raw);
              if (raw !== "" && Number.isFinite(level)) {
                setLevel(side, clampLevel(level));
              }
            }}
            onBlur={() => setLevelDraft(null)}
            className={`${CALC_INPUT} w-full`}
          />
        </Field>
        <Field label={t("versus.move")} className="min-w-0 flex-1">
          <Dropdown
            value={move ?? ""}
            onChange={(picked) => setMove(side, picked || null)}
            disabled={learnset.game === null}
            items={[
              { value: "", label: t("versus.pickMove") },
              ...learnset.groups.map((group) => ({
                label: methodLabel(group.method),
                options: uniqueMoves(group.moves).map((entry) => ({
                  value: entry.name,
                  label:
                    entry.level > 0
                      ? `${t("details.moveLevel", { level: entry.level })} · ${moveLabel(entry.name)}`
                      : moveLabel(entry.name),
                })),
              })),
            ]}
            className="w-full text-[10px]"
            boxClassName={`${CALC_INPUT} pl-2`}
          />
        </Field>
      </div>

      <StatInputs stats={stats} onEdit={onEdit} />

      {/* Nothing until a move is picked: the select already says to pick one. */}
      {move && learnset.game && (
        <HitResult
          side={side}
          move={move}
          game={learnset.game}
          attacker={attacker}
          defender={defender}
          stats={stats}
          defenderStats={defenderStats}
        />
      )}
    </section>
  );
};

const Field = ({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) => (
  <label className={`flex flex-col gap-1 text-[10px] text-gray-500 ${className}`}>
    {label}
    {children}
  </label>
);
