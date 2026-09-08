import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  learnsetInEra,
  moveMethodAccent,
  type LearnedMove,
} from "@/domain/moves";
import { useEra } from "@/era/context";
import { humanize, useMoveLabel, useMoveMethodLabel } from "@/i18n/labels";
import type { Pokemon } from "@/types/pokemon";
import { MoveDetails } from "./MoveDetails";

/** A move in the place the list puts it — the same move can hold two. */
interface PickedMove extends LearnedMove {
  method: string;
}

const keyOf = (move: PickedMove) => `${move.method}|${move.name}|${move.level}`;

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
  const moveLabel = useMoveLabel();
  const methodLabel = useMoveMethodLabel();
  const [showRest, setShowRest] = useState(false);
  const [picked, setPicked] = useState<PickedMove[]>([]);

  const { game, groups } = learnsetInEra(pokemon, era);
  if (game === null || groups.length === 0) return null;

  const byLevel = groups.find((group) => group.method === "level-up");
  const rest = groups.filter((group) => group.method !== "level-up");
  const restCount = rest.reduce((total, group) => total + group.moves.length, 0);

  const rows: PickedMove[] = groups.flatMap((group) =>
    group.moves.map((move) => ({ ...move, method: group.method }))
  );

  // Picks are looked up in the list rather than trusted, because switching era
  // swaps the game under them: Thunderbolt sits at level 26 in Crystal and 36
  // in Scarlet and Violet. Its own row if that is still there, the same move
  // wherever the new game teaches it otherwise, and dropped when the new game
  // does not teach it at all. Reading them back in list order is what keeps the
  // panels in the same order as the rows they belong to.
  const openKeys = new Set(
    picked
      .map(
        (pick) =>
          rows.find((row) => keyOf(row) === keyOf(pick)) ??
          rows.find((row) => row.name === pick.name)
      )
      .filter((row) => row !== undefined)
      .map(keyOf)
  );
  const open = rows.filter((row) => openKeys.has(keyOf(row)));

  // Writing the resolved list back is what heals the state after an era
  // change, so the next click toggles the row a reader is actually looking at.
  const toggle = (row: PickedMove) =>
    setPicked(
      openKeys.has(keyOf(row))
        ? open.filter((other) => keyOf(other) !== keyOf(row))
        : [...open, row]
    );

  return (
    <section className="bg-white p-6 mt-6">
      <h2 className="text-lg mb-2">{t("details.moves")}</h2>
      <p className="text-xs text-gray-500 mb-6">
        {t("details.movesFrom", { game: humanize(game) })}
      </p>

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
                className="mt-6 px-3 py-1 bg-gray-200 text-black text-xs cursor-pointer hover:bg-[#FECB09]"
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
            navbar is fixed and 48px tall, hence the offset. */}
        <aside className="hidden lg:block">
          <div className="sticky top-16 space-y-3">
            {open.length === 0 ? (
              <p className="border border-dashed border-gray-300 p-8 text-center text-[10px] leading-relaxed text-gray-400">
                {t("details.movePick")}
              </p>
            ) : (
              open.map((row) => {
                const accent = moveMethodAccent(row.method);

                return (
                  <div
                    key={keyOf(row)}
                    className={`border-l-8 ${accent.bar} ${accent.panel} p-5`}
                  >
                    <div className="flex items-start justify-between gap-4 mb-5">
                      <div>
                        <h3 className="text-sm">{moveLabel(row.name)}</h3>
                        {/* A level is only ever a level-up move, so the number
                            says the source as plainly as the word would. */}
                        <p className={`mt-2 text-[10px] ${accent.label}`}>
                          {row.level > 0
                            ? t("details.moveLevel", { level: row.level })
                            : methodLabel(row.method)}
                        </p>
                      </div>
                      {/* The row toggles too, but it can be ninety rows away by
                          the time a reader is done with the panel. */}
                      <button
                        type="button"
                        onClick={() => toggle(row)}
                        aria-label={t("details.moveClose")}
                        className="shrink-0 px-1 text-xs text-gray-400 cursor-pointer hover:text-[#E12025]"
                      >
                        X
                      </button>
                    </div>
                    <MoveDetails name={row.name} game={game} method={row.method} />
                  </div>
                );
              })
            )}
          </div>
        </aside>
      </div>
    </section>
  );
};

const MoveRows = ({
  moves,
  method,
  game,
  openKeys,
  onToggle,
  withLevel = false,
}: {
  moves: LearnedMove[];
  method: string;
  game: string;
  openKeys: ReadonlySet<string>;
  onToggle: (move: PickedMove) => void;
  withLevel?: boolean;
}) => (
  <ul>
    {moves.map((move, index) => (
      <MoveRow
        key={`${move.name}-${move.level}-${index}`}
        move={{ ...move, method }}
        game={game}
        isOpen={openKeys.has(keyOf({ ...move, method }))}
        onToggle={onToggle}
        withLevel={withLevel}
      />
    ))}
  </ul>
);

const MoveRow = ({
  move,
  game,
  isOpen,
  onToggle,
  withLevel,
}: {
  move: PickedMove;
  game: string;
  isOpen: boolean;
  onToggle: (move: PickedMove) => void;
  withLevel: boolean;
}) => {
  const { t } = useTranslation();
  const moveLabel = useMoveLabel();
  const accent = moveMethodAccent(move.method);

  return (
    <li>
      {/* A row takes its own group's colour rather than one "chosen" blue, so
          that a picked row and the panel it opened read as the same thing in
          two columns. Black on the fill, not white: these are a Game Boy
          Color's brights, the same reason the yellow buttons carry black. */}
      <button
        type="button"
        onClick={() => onToggle(move)}
        aria-expanded={isOpen}
        className={`flex w-full items-baseline gap-4 px-2 py-2 text-left text-xs cursor-pointer ${
          isOpen ? `${accent.fill} text-black` : accent.hover
        }`}
      >
        {withLevel && (
          // Level 0 means the Pokémon already knows it on evolving, which the
          // games print as a blank rather than as a number.
          <span
            className={`w-24 shrink-0 whitespace-nowrap text-right ${
              isOpen ? "text-black" : "text-gray-500"
            }`}
          >
            {move.level > 0
              ? t("details.moveLevel", { level: move.level })
              : t("details.moveNoValue")}
          </span>
        )}
        <span>{moveLabel(move.name)}</span>
      </button>

      {/* Under `lg` there is no second column to put it in. Both copies use the
          same query key, so the one that is displayed and the one that is not
          share a single request. */}
      {isOpen && (
        <div
          className={`lg:hidden mt-2 mb-4 border-l-8 ${accent.bar} ${accent.panel} p-3`}
        >
          <MoveDetails
            name={move.name}
            game={game}
            method={move.method}
          />
        </div>
      )}
    </li>
  );
};

/**
 * A group's name, with the square that teaches its colour.
 *
 * The level-up group had no heading — it is the list the section is about — but
 * without one its blue would be the one colour the page never names, so it has
 * one now like the rest.
 */
const MethodHeading = ({ method }: { method: string }) => {
  const methodLabel = useMoveMethodLabel();

  return (
    <h3 className="flex items-center gap-2 text-sm mb-3">
      <span
        aria-hidden="true"
        className={`h-3 w-3 shrink-0 ${moveMethodAccent(method).fill}`}
      />
      {methodLabel(method)}
    </h3>
  );
};
