import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useEra } from "@/app/era/context";
import { MAX_LEVEL, MIN_LEVEL, clampLevel } from "@/domain/damage";
import { learnsetInEra, uniqueMoves } from "@/domain/moves";
import type { StatInEra } from "@/domain/stats";
import { humanize, useMoveLabel, useMoveMethodLabel } from "@/i18n/labels";
import { HitResult } from "./HitResult";
import { StatInputs } from "./StatInputs";
import type { Known, Side } from "./model";
import { useVersus } from "./versusContext";

/** Every box a number or a move goes in: one height, one size of type. */
export const CALC_INPUT = "h-8 border-2 bg-white px-2 text-[10px] text-black";

const SIDE_COLOUR: Record<Side, string> = { a: "text-dex-blue", b: "text-dex-red" };

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
      <h2 className={`text-xs uppercase ${SIDE_COLOUR[side]}`}>
        {humanize(attacker.name)}
      </h2>

      <div className="flex flex-wrap gap-3">
        <Field label={t("versus.level")} className="w-20">
          <input
            type="number"
            min={MIN_LEVEL}
            max={MAX_LEVEL}
            value={levelDraft ?? String(params.level)}
            onChange={(e) => {
              setLevelDraft(e.target.value);
              const level = Number(e.target.value);
              if (e.target.value !== "" && Number.isFinite(level)) {
                setLevel(side, clampLevel(level));
              }
            }}
            onBlur={() => setLevelDraft(null)}
            className={`${CALC_INPUT} w-full`}
          />
        </Field>
        <Field label={t("versus.move")} className="min-w-0 flex-1">
          <select
            value={move ?? ""}
            onChange={(e) => setMove(side, e.target.value || null)}
            disabled={learnset.game === null}
            className={`${CALC_INPUT} w-full cursor-pointer`}
          >
            <option value="">{t("versus.pickMove")}</option>
            {learnset.groups.map((group) => (
              <optgroup key={group.method} label={methodLabel(group.method)}>
                {uniqueMoves(group.moves).map((entry) => (
                  <option key={entry.name} value={entry.name}>
                    {entry.level > 0
                      ? `${t("details.moveLevel", { level: entry.level })} · ${moveLabel(entry.name)}`
                      : moveLabel(entry.name)}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
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
