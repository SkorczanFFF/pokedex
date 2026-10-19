import { useTranslation } from "react-i18next";
import type { LearnedMove } from "@/domain/moves";
import { useMoveLabel, useMoveMethodLabel } from "@/i18n/labels";
import { MoveDetails } from "./MoveDetails";
import { moveMethodAccent } from "./moveAccents";
import { keyOf, type PickedMove } from "./usePickedMoves";

/**
 * A group's name, with the square that teaches its colour.
 *
 * The level-up group had no heading — it is the list the section is about — but
 * without one its blue would be the one colour the page never names, so it has
 * one now like the rest.
 */
export const MethodHeading = ({ method }: { method: string }) => {
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

/** One group's rows, each opening to its details where there is no second column. */
export const MoveRows = ({
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
