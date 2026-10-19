import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useEra } from "@/app/era/context";
import { MORE } from "@/components/buttons";
import { EmptyState, SectionCard } from "@/components/layout";
import { learnsetInEra } from "@/domain/moves";
import { useGameLabel } from "@/i18n/labels";
import type { Pokemon } from "@/types/pokemon";
import { MovePanel } from "./MovePanel";
import { MethodHeading, MoveRows } from "./MoveRows";
import { keyOf, usePickedMoves, type PickedMove } from "./usePickedMoves";

/**
 * Everything a Pokémon learns, as one game taught it.
 *
 * The level-up list is the section: eight to twenty rows, in the order the
 * games' own Pokédex puts them. The machines are three to five times as many
 * and would bury it — Mewtwo knows ninety-one of them in Scarlet and Violet —
 * so they wait behind a count until someone asks.
 *
 * Rows open, as many as a reader wants, because the question a move list is
 * asked is which of two to teach. Where they open depends on the room there is.
 * A wide screen stacks them beside the list, which is the only place they do
 * not shove the rows apart, and stacking is what makes the comparison legible:
 * every panel puts its Power in the same place, so two of them read down a
 * column. A narrow screen has no second column, so a move opens under its own
 * row.
 *
 * Either way nothing beyond the page's usual three requests is spent until a
 * reader wants a particular move.
 */
export const MoveList = ({ pokemon }: { pokemon: Pokemon }) => {
  const { t } = useTranslation();
  const { era } = useEra();
  const gameLabel = useGameLabel();
  const [showRest, setShowRest] = useState(false);

  const { game, groups } = learnsetInEra(pokemon, era);
  const rows: PickedMove[] = groups.flatMap((group) =>
    group.moves.map((move) => ({ ...move, method: group.method })),
  );
  const { open, openKeys, toggle } = usePickedMoves(rows);

  if (game === null || groups.length === 0) return null;

  const byLevel = groups.find((group) => group.method === "level-up");
  const rest = groups.filter((group) => group.method !== "level-up");
  const restCount = rest.reduce((total, group) => total + group.moves.length, 0);

  return (
    <SectionCard
      title={t("details.moves")}
      subtitle={t("details.movesFrom", { game: gameLabel(game) })}
    >
      <div className="lg:grid lg:grid-cols-2 lg:gap-8">
        <div>
          {byLevel && (
            <>
              <MethodHeading method={byLevel.method} />
              <MoveRows
                moves={byLevel.moves}
                method={byLevel.method}
                game={game}
                openKeys={openKeys}
                onToggle={toggle}
                withLevel
              />
            </>
          )}

          {restCount > 0 && (
            <>
              <button
                type="button"
                onClick={() => setShowRest(!showRest)}
                aria-expanded={showRest}
                className={`mt-6 ${MORE}`}
              >
                {showRest
                  ? t("details.movesHide")
                  : t("details.movesShow", { count: restCount })}
              </button>

              {showRest && (
                <div className="mt-6 space-y-6">
                  {rest.map((group) => (
                    <div key={group.method}>
                      <MethodHeading method={group.method} />
                      <MoveRows
                        moves={group.moves}
                        method={group.method}
                        game={game}
                        openKeys={openKeys}
                        onToggle={toggle}
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Follows the list down, because the machines run to ninety rows and a
            move picked at the top would otherwise be scrolled away from. The
            navbar is fixed, hence the offset: its height and a rem of air. */}
        <aside className="hidden lg:block">
          <div className="sticky top-[calc(var(--spacing-nav)_+_1rem)] space-y-3">
            {open.length === 0 ? (
              <EmptyState className="text-[10px] leading-relaxed text-gray-400">
                {t("details.movePick")}
              </EmptyState>
            ) : (
              open.map((row) => (
                <MovePanel key={keyOf(row)} row={row} game={game} onClose={() => toggle(row)} />
              ))
            )}
          </div>
        </aside>
      </div>
    </SectionCard>
  );
};
