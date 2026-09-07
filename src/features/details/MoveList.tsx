import { useState } from "react";
import { useTranslation } from "react-i18next";
import { learnsetInEra, type MoveGroup } from "@/domain/moves";
import { useEra } from "@/era/context";
import { humanize, useMoveLabel, useMoveMethodLabel } from "@/i18n/labels";
import type { Pokemon } from "@/types/pokemon";

/**
 * Everything a Pokémon learns, as one game taught it.
 *
 * The level-up list is the section: eight to twenty rows, the same order the
 * games' own Pokédex put them in. The machines are three to five times as many
 * and would bury it — Mewtwo knows ninety-one of them in Scarlet and Violet —
 * so they wait behind a count until someone asks.
 */
export const MoveList = ({ pokemon }: { pokemon: Pokemon }) => {
  const { t } = useTranslation();
  const { era } = useEra();
  const moveLabel = useMoveLabel();
  const methodLabel = useMoveMethodLabel();
  const [showRest, setShowRest] = useState(false);

  const { game, groups } = learnsetInEra(pokemon, era);
  if (game === null || groups.length === 0) return null;

  const byLevel = groups.find((group) => group.method === "level-up");
  const rest = groups.filter((group) => group.method !== "level-up");
  const restCount = rest.reduce((total, group) => total + group.moves.length, 0);

  return (
    <section className="bg-white p-6 mt-6">
      <h2 className="text-lg mb-2">{t("details.moves")}</h2>
      <p className="text-xs text-gray-500 mb-6">
        {t("details.movesFrom", { game: humanize(game) })}
      </p>

      {byLevel && (
        <ul className="space-y-2">
          {byLevel.moves.map((move, index) => (
            <li
              key={`${move.name}-${move.level}-${index}`}
              className="flex items-baseline gap-4 text-xs"
            >
              {/* Level 0 means "knows it already", which the games print as a
                  blank rather than as a number. */}
              <span className="w-24 shrink-0 whitespace-nowrap text-right text-gray-500">
                {move.level > 0
                  ? t("details.moveLevel", { level: move.level })
                  : "—"}
              </span>
              <span>{moveLabel(move.name)}</span>
            </li>
          ))}
        </ul>
      )}

      {restCount > 0 && (
        <>
          <button
            type="button"
            onClick={() => setShowRest(!showRest)}
            aria-expanded={showRest}
            className="mt-6 px-3 py-1 bg-gray-200 text-black text-xs cursor-pointer hover:bg-[#FECB09]"
          >
            {showRest
              ? t("details.movesHide")
              : t("details.movesShow", { count: restCount })}
          </button>

          {showRest && (
            <div className="mt-6 space-y-6">
              {rest.map((group) => (
                <MethodGroup
                  key={group.method}
                  group={group}
                  label={methodLabel(group.method)}
                  moveLabel={moveLabel}
                />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
};

/** Machines and egg moves carry no level, so they read as chips, like abilities. */
const MethodGroup = ({
  group,
  label,
  moveLabel,
}: {
  group: MoveGroup;
  label: string;
  moveLabel: (slug: string) => string;
}) => (
  <div>
    <h3 className="text-sm mb-3">{label}</h3>
    <div className="flex flex-wrap gap-2">
      {group.moves.map((move) => (
        <span key={move.name} className="px-3 py-1 bg-gray-100 text-xs">
          {moveLabel(move.name)}
        </span>
      ))}
    </div>
  </div>
);
