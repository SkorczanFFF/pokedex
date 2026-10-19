import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Arrow } from "@/components/Arrow";
import { effectClass, printed } from "@/components/effectiveness";
import { typeClass } from "@/components/typeStyles";
import type { PokemonType } from "@/domain/pokemonTypes";
import type { TypeChart } from "@/domain/typeChart";
import { useTypeLabel } from "@/i18n/labels";

/**
 * The chart itself: attackers down the side, defenders along the top, and the
 * hover trace. The cell under the pointer keeps the two lines a reader traces
 * to it lit — along its row from the attacker on the left, down its column
 * from the defender up top — and everything else goes grey, the rest of the
 * row and column included: past the cell there is nothing left to trace.
 */
export const TypeChartTable = ({ chart }: { chart: TypeChart }) => {
  const { t } = useTranslation();
  const typeLabel = useTypeLabel();
  const [hover, setHover] = useState<{
    attacker: PokemonType;
    defender: PokemonType;
  } | null>(null);
  const lit = (onTrace: boolean): string =>
    hover && !onTrace ? "grayscale opacity-50" : "";

  return (
    // Eighteen columns in a pixel font do not fit a phone; the table scrolls
    // sideways inside the card rather than squeezing.
    <div className="overflow-x-auto">
      {/* An arrow, not a text cursor: the cells are read, not selected. */}
      <table
        className="border-collapse border-2 border-gray-300 text-[10px] cursor-default"
        onMouseLeave={() => setHover(null)}
      >
        <caption className="sr-only">{t("types.title")}</caption>
        <thead>
          <tr>
            {/* A square cut corner to corner: the defender above the cut points
                at the columns, the attacker below it at the rows. Its side
                matches the column headers' height, and fits the longest type
                name (Polish "Elektryczny") either way. */}
            <th
              scope="col"
              className={`p-0 border border-gray-300 text-gray-500 font-normal transition-[opacity,filter] ${lit(false)}`}
            >
              <span className="relative block h-chart-corner w-chart-corner">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 1 1"
                  preserveAspectRatio="none"
                  className="absolute inset-0 h-full w-full text-gray-300"
                >
                  <line
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="1"
                    stroke="currentColor"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
                <span className="absolute top-1.5 right-1.5 whitespace-nowrap">
                  {t("types.defender")} <Arrow className="-rotate-90" />
                </span>
                <span className="absolute bottom-1.5 left-1.5 whitespace-nowrap">
                  {t("types.attack")} <Arrow />
                </span>
              </span>
            </th>
            {chart.types.map((defender) => (
              <th
                key={defender}
                scope="col"
                className={`p-0 align-bottom border border-gray-300 transition-[opacity,filter] ${lit(
                  hover?.defender === defender,
                )}`}
              >
                {/* Full names, stood on end — three-letter codes would need a
                    legend of their own in every language. Aligned to the start,
                    which the turn puts at the cells, so every first letter sits
                    in the same place. Padded as the attackers are: px/py are
                    logical, so they turn with the text. */}
                <span
                  className={`block h-chart-corner w-chart-cell px-2 py-1 [writing-mode:vertical-rl] rotate-180 text-start whitespace-nowrap ${typeClass(defender)}`}
                >
                  {typeLabel(defender)}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {chart.types.map((attacker, row) => (
            <tr key={attacker}>
              <th
                scope="row"
                className={`text-left whitespace-nowrap px-2 py-1 font-normal border border-gray-300 transition-[opacity,filter] ${typeClass(
                  attacker,
                )} ${lit(hover?.attacker === attacker)}`}
              >
                {typeLabel(attacker)}
              </th>
              {chart.types.map((defender, col) => {
                const value = chart.multiplier(attacker, defender);
                const isHovered =
                  hover?.attacker === attacker && hover?.defender === defender;
                // On the trace: this row up to the hovered column, or this
                // column down to the hovered row.
                const onTrace =
                  (hover?.attacker === attacker &&
                    col <= chart.types.indexOf(hover.defender)) ||
                  (hover?.defender === defender &&
                    row <= chart.types.indexOf(hover.attacker));
                return (
                  <td
                    key={defender}
                    aria-label={t("types.cell", {
                      attack: typeLabel(attacker),
                      defender: typeLabel(defender),
                      value: printed(value),
                    })}
                    onMouseEnter={() => setHover({ attacker, defender })}
                    className={`h-chart-cell w-chart-cell text-center border border-gray-300 transition-[opacity,filter] ${effectClass(
                      value,
                      onTrace,
                    )} ${lit(onTrace)} ${
                      isHovered ? "outline-2 -outline-offset-2 outline-black" : ""
                    }`}
                  >
                    {printed(value)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
