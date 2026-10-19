import { useId } from "react";
import type { StatInEra } from "@/domain/stats";
import { useStatLabel } from "@/i18n/labels";
import { CALC_INPUT } from "./MoveSide";

const COLUMNS = ["col-start-1", "col-start-2", "col-start-3"] as const;

/**
 * The stats a battle is fought with, each in a box a reader can type over,
 * three to a row. The labels take one grid row and the boxes the next, so a
 * label that wraps — "Punkty życia" over "Atak" — pushes nothing: every box in
 * a row sits on the same line. Placed by column outright, so a short last row
 * (five stats at era I) never spills a box up into the label row.
 */
export const StatInputs = ({
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
              className={`row-start-2 ${COLUMNS[column]} ${CALC_INPUT} w-full px-1`}
            />
          ))}
        </div>
      ))}
    </div>
  );
};
