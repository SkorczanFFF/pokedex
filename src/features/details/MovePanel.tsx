import { useTranslation } from "react-i18next";
import { useMoveLabel, useMoveMethodLabel } from "@/i18n/labels";
import { MoveDetails } from "./MoveDetails";
import { moveMethodAccent } from "./moveAccents";
import type { PickedMove } from "./usePickedMoves";

/** One opened move in the wide screen's column: its name, its source, its details, and a way to close it. */
export const MovePanel = ({
  row,
  game,
  onClose,
}: {
  row: PickedMove;
  game: string;
  onClose: () => void;
}) => {
  const { t } = useTranslation();
  const moveLabel = useMoveLabel();
  const methodLabel = useMoveMethodLabel();
  const accent = moveMethodAccent(row.method);

  return (
    <div className={`border-l-8 ${accent.bar} ${accent.panel} p-5`}>
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h3 className="text-sm">{moveLabel(row.name)}</h3>
          {/* A level is only ever a level-up move, so the number says the
              source as plainly as the word would. */}
          <p className={`mt-2 text-[10px] ${accent.label}`}>
            {row.level > 0
              ? t("details.moveLevel", { level: row.level })
              : methodLabel(row.method)}
          </p>
        </div>
        {/* The row toggles too, but it can be ninety rows away by the time a
            reader is done with the panel. */}
        <button
          type="button"
          onClick={onClose}
          aria-label={t("details.moveClose")}
          className="shrink-0 px-1 text-xs text-gray-400 cursor-pointer hover:text-dex-red"
        >
          X
        </button>
      </div>
      <MoveDetails name={row.name} game={game} method={row.method} />
    </div>
  );
};
