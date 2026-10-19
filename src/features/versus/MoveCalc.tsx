import { useId, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { moveQuery } from "@/api/queries";
import { InlineError } from "@/components/ErrorView";
import { SkeletonBlock } from "@/components/Skeleton";
import { ClassBadge, EffectChip, TypeBadge } from "@/components/badges";
import { phraseKey } from "@/components/effectiveness";
import { abilityRule } from "@/domain/abilities";
import {
  MAX_LEVEL,
  MIN_LEVEL,
  battleStats,
  clampLevel,
  computeHit,
  firstToMove,
  hitsToKo,
} from "@/domain/damage";
import { learnsetInEra, moveInGame, uniqueMoves } from "@/domain/moves";
import { statsInEra, typingInEra } from "@/domain/pokemonView";
import { STAT, statValue, type StatInEra } from "@/domain/stats";
import type { TypeChart } from "@/domain/typeChart";
import { useEra } from "@/era/context";
import { humanize, useMoveLabel, useMoveMethodLabel, useStatLabel } from "@/i18n/labels";
import { useLocale } from "@/i18n/locale";
import { useTranslatedMoveText } from "@/i18n/translated";
import type { Known, Side } from "./BattleField";
import type { SideParams } from "./useVersusParams";

/** Every box a number or a move goes in: one height, one size of type. */
const INPUT = "h-8 border-2 bg-white px-2 text-[10px] text-black";
const SIDE_COLOUR: Record<Side, string> = { a: "text-dex-blue", b: "text-dex-red" };
const OTHER: Record<Side, Side> = { a: "b", b: "a" };

type Edits = Readonly<Record<string, number>>;

/**
 * Numbers a reader typed over the computed ones, forgotten the moment what they
 * were typed over changes: another Pokémon, another level, another era.
 * Clearing a field forgets that one, so the computed value comes back.
 */
const useEdited = (basis: string) => {
  const [state, setState] = useState<{ basis: string; values: Edits }>({
    basis,
    values: {},
  });
  const values: Edits = state.basis === basis ? state.values : {};
  const edit = (name: string, value: number | null) => {
    const next: Record<string, number> = { ...values };
    if (value === null) delete next[name];
    else next[name] = value;
    setState({ basis, values: next });
  };
  return [values, edit] as const;
};

/**
 * The Moves tab: a calculator, not a simulation. Each side picks a move from
 * its own learnset of the era, and the text box says what one hit of it does
 * to the other — the damage at both ends of the roll, the share of HP, the
 * hits to a knockout — with the level, the stats and the power all open to be
 * typed over. Who moves first comes off the two Speeds.
 */
export const MoveCalc = ({
  yours,
  foe,
  chart,
  abilities,
  sides,
  onMove,
  onLevel,
}: {
  yours: Known;
  foe: Known;
  chart: TypeChart;
  /** The ability each side is read with, or null. */
  abilities: Record<Side, string | null>;
  sides: Record<Side, SideParams>;
  onMove: (side: Side, move: string | null) => void;
  onLevel: (side: Side, level: number) => void;
}) => {
  const { t } = useTranslation();
  const { era } = useEra();
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
            params={sides[side]}
            stats={grown[side]}
            defenderStats={grown[OTHER[side]]}
            abilities={abilities}
            chart={chart}
            onEdit={edit[side]}
            onMove={onMove}
            onLevel={onLevel}
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

/** One side: its level, its move, its stats, and what the move does to the other. */
const MoveSide = ({
  side,
  attacker,
  defender,
  params,
  stats,
  defenderStats,
  abilities,
  chart,
  onEdit,
  onMove,
  onLevel,
}: {
  side: Side;
  attacker: Known;
  defender: Known;
  params: SideParams;
  stats: StatInEra[];
  defenderStats: StatInEra[];
  abilities: Record<Side, string | null>;
  chart: TypeChart;
  onEdit: (name: string, value: number | null) => void;
  onMove: (side: Side, move: string | null) => void;
  onLevel: (side: Side, level: number) => void;
}) => {
  const { t } = useTranslation();
  const { era } = useEra();
  const moveLabel = useMoveLabel();
  const methodLabel = useMoveMethodLabel();
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
                onLevel(side, clampLevel(level));
              }
            }}
            onBlur={() => setLevelDraft(null)}
            className={`${INPUT} w-full`}
          />
        </Field>
        <Field label={t("versus.move")} className="min-w-0 flex-1">
          <select
            value={move ?? ""}
            onChange={(e) => onMove(side, e.target.value || null)}
            disabled={learnset.game === null}
            className={`${INPUT} w-full cursor-pointer`}
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
        <Result
          side={side}
          move={move}
          game={learnset.game}
          attacker={attacker}
          defender={defender}
          level={params.level}
          stats={stats}
          defenderStats={defenderStats}
          abilities={abilities}
          chart={chart}
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

const COLUMNS = ["col-start-1", "col-start-2", "col-start-3"] as const;

/**
 * The stats a battle is fought with, each in a box a reader can type over,
 * three to a row. The labels take one grid row and the boxes the next, so a
 * label that wraps — "Punkty życia" over "Atak" — pushes nothing: every box in
 * a row sits on the same line. Placed by column outright, so a short last row
 * (five stats at era I) never spills a box up into the label row.
 */
const StatInputs = ({
  stats,
  onEdit,
}: {
  stats: StatInEra[];
  onEdit: (name: string, value: number | null) => void;
}) => {
  const statLabel = useStatLabel();
  const id = useId();
  const rows: StatInEra[][] = [];
  for (let at = 0; at < stats.length; at += COLUMNS.length) {
    rows.push(stats.slice(at, at + COLUMNS.length));
  }

  return (
    <div className="space-y-2">
      {rows.map((row) => (
        <div key={row[0].name} className="grid grid-cols-3 gap-x-2 gap-y-1">
          {row.map((stat, column) => (
            <label
              key={stat.name}
              htmlFor={`${id}-${stat.name}`}
              className={`row-start-1 ${COLUMNS[column]} self-end text-[9px] leading-tight text-gray-500`}
            >
              {statLabel(stat.name)}
            </label>
          ))}
          {row.map((stat, column) => (
            <input
              key={stat.name}
              id={`${id}-${stat.name}`}
              type="number"
              min={1}
              value={stat.value}
              onChange={(e) => {
                if (e.target.value === "") return onEdit(stat.name, null);
                const value = Math.floor(Number(e.target.value));
                if (Number.isFinite(value) && value > 0) onEdit(stat.name, value);
              }}
              className={`row-start-2 ${COLUMNS[column]} ${INPUT} w-full px-1`}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

/** What one hit of the move does to the other side, in the games' words and in numbers. */
const Result = ({
  side,
  move,
  game,
  attacker,
  defender,
  level,
  stats,
  defenderStats,
  abilities,
  chart,
}: {
  side: Side;
  move: string;
  game: string;
  attacker: Known;
  defender: Known;
  level: number;
  stats: StatInEra[];
  defenderStats: StatInEra[];
  abilities: Record<Side, string | null>;
  chart: TypeChart;
}) => {
  const { t } = useTranslation();
  const { era } = useEra();
  const locale = useLocale();
  const moveLabel = useMoveLabel();
  const translatedText = useTranslatedMoveText();
  const [edits, edit] = useEdited(`${move}|${era.maxGen}`);

  const { data, isLoading, error } = useQuery(moveQuery(move));

  if (isLoading) return <SkeletonBlock className="h-24" />;
  if (error || !data) return <InlineError>{t("error.details")}</InlineError>;

  const inGame = moveInGame(data, game, locale, translatedText(move));
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
              className={`${INPUT} w-16 px-1`}
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
