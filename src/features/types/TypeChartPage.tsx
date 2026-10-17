import { useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { getType } from "@/api/types";
import ErrorView from "@/components/ErrorView";
import Loader from "@/components/Loader";
import { GEN_SLUGS, genOrder, genRoman } from "@/domain/dex";
import {
  typeClass,
  typesUpTo,
  type PokemonType,
} from "@/domain/pokemonTypes";
import { chartChanges, typeChart, type Multiplier } from "@/domain/typeChart";
import { useEra } from "@/era/context";
import { useTypeLabel } from "@/i18n/labels";

/** How a multiplier is printed: the way the games' guides print it. */
const printed = (value: Multiplier): string => (value === 0.5 ? "½" : `${value}`);

/** The cell's colour says what the number says, so the chart reads at a glance. */
const cellClass = (value: Multiplier): string => {
  switch (value) {
    case 2:
      return "bg-[#7AC74C] text-white";
    case 0.5:
      return "bg-[#EE8130] text-white";
    case 0:
      return "bg-black text-white";
    default:
      return "bg-white text-gray-300";
  }
};

/**
 * The type chart as of the era: what an attack of each type does to a Pokémon
 * of each other, with the cells that read differently in earlier generations
 * listed underneath.
 *
 * Fetched, not typed in. The relations changed four times across the
 * generations and PokéAPI dates every change, so the retro chart is Gen II's
 * with Gen I's four quirks footnoted, and the modern one today's — out of the
 * same eighteen requests, which React Query keeps for the session.
 */
export const TypeChartPage = () => {
  const { t } = useTranslation();
  const { era } = useEra();
  const typeLabel = useTypeLabel();
  const gen = era.maxGen;
  const names = typesUpTo(gen);
  // The cell under the pointer. The two lines a reader traces to it stay lit
  // — along its row from the attacker on the left, down its column from the
  // defender up top — and everything else goes grey, the rest of the row and
  // column included: past the cell there is nothing left to trace.
  const [hover, setHover] = useState<{
    attacker: PokemonType;
    defender: PokemonType;
  } | null>(null);
  const lit = (onTrace: boolean): string =>
    hover && !onTrace ? "grayscale opacity-50" : "";

  const queries = useQueries({
    queries: names.map((name) => ({
      queryKey: ["type", name],
      queryFn: () => getType(name),
    })),
  });

  if (queries.some((q) => q.isLoading)) return <Loader />;
  if (queries.some((q) => q.error)) return <ErrorView errorType="types" />;

  const types = queries.flatMap((q) => (q.data ? [q.data] : []));
  const chart = typeChart(types, gen);
  const changes = chartChanges(types, gen);

  const legend: { value: Multiplier; label: string }[] = [
    { value: 2, label: t("types.super") },
    { value: 1, label: t("types.neutral") },
    { value: 0.5, label: t("types.notVery") },
    { value: 0, label: t("types.noEffect") },
  ];

  return (
    <div className="container mx-auto px-4 pt-8 lg:max-w-7xl pb-12">
      <section className="bg-white p-6">
        <h1 className="text-2xl mb-4">{t("types.title")}</h1>
        <p className="text-xs leading-relaxed mb-6">
          {t("types.intro", { roman: genRoman(gen) })}
        </p>

        <ul className="flex flex-wrap gap-x-6 gap-y-2 mb-6 text-[10px]">
          {legend.map(({ value, label }) => (
            <li key={value} className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className={`inline-flex h-6 w-6 items-center justify-center border border-gray-300 ${cellClass(value)}`}
              >
                {printed(value)}
              </span>
              ×{printed(value)} {label}
            </li>
          ))}
        </ul>

        {/* Eighteen columns in a pixel font do not fit a phone; the table
            scrolls sideways inside the card rather than squeezing. */}
        <div className="overflow-x-auto">
          {/* An arrow, not a text cursor: the cells are read, not selected. */}
          <table
            className="border-collapse text-[10px] cursor-default"
            onMouseLeave={() => setHover(null)}
          >
            <caption className="sr-only">{t("types.title")}</caption>
            <thead>
              <tr>
                {/* Two lines, not one: this corner sets the width of the whole
                    attacker column, and on one line it is wider than any type
                    name — so the names sat in a column twice their length. */}
                <th
                  scope="col"
                  className={`text-left align-bottom p-1 text-gray-500 font-normal ${lit(false)}`}
                >
                  <span className="block">{t("types.attack")} ↓</span>
                  <span className="block">{t("types.defender")} →</span>
                </th>
                {chart.types.map((defender) => (
                  <th
                    key={defender}
                    scope="col"
                    className={`p-0 align-bottom border border-gray-300 transition-[opacity,filter] ${lit(
                      hover?.defender === defender,
                    )}`}
                  >
                    {/* Full names, stood on end — three-letter codes would
                        need a legend of their own in every language. */}
                    <span
                      className={`block h-28 w-7 py-1 [writing-mode:vertical-rl] rotate-180 whitespace-nowrap ${typeClass(defender)}`}
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
                      hover?.attacker === attacker &&
                      hover?.defender === defender;
                    // On the trace: this row up to the hovered column, or
                    // this column down to the hovered row.
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
                        className={`h-7 w-7 text-center border border-gray-300 transition-[opacity,filter] ${cellClass(
                          value,
                        )} ${lit(onTrace)} ${
                          isHovered
                            ? "outline-2 -outline-offset-2 outline-black"
                            : ""
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

        {changes.length > 0 && (
          <section className="mt-8">
            <h2 className="text-sm mb-3">{t("types.changes")}</h2>
            <ul className="text-[10px] leading-relaxed space-y-1">
              {changes.map((change) => (
                <li
                  key={`${change.through}-${change.attacker}-${change.defender}`}
                >
                  {t("types.change", {
                    attack: typeLabel(change.attacker),
                    defender: typeLabel(change.defender),
                    from: printed(change.from),
                    through: genRoman(change.through),
                    to: printed(change.to),
                    since: genRoman(GEN_SLUGS[genOrder(change.through) + 1]),
                  })}
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="mt-8 text-[10px] text-gray-500">{t("types.source")}</p>
      </section>
    </div>
  );
};
