import { useTranslation } from "react-i18next";
import { useTypeChart } from "@/api/useTypeChart";
import { useEra } from "@/app/era/context";
import ErrorView from "@/components/ErrorView";
import Loader from "@/components/Loader";
import { effectClass, printed } from "@/components/effectiveness";
import { GbBox, Screen } from "@/components/layout";
import { GEN_SLUGS, genOrder, genRoman } from "@/domain/dex";
import { chartChanges, type ChartChange, type Multiplier } from "@/domain/typeChart";
import { useTypeLabel } from "@/i18n/labels";
import { TypeChartTable } from "./TypeChartTable";
import { VersusAd } from "./VersusAd";

/**
 * The type chart as of the era: what an attack of each type does to a Pokémon
 * of each other, with the cells that read differently in earlier generations
 * listed underneath.
 *
 * Fetched, not typed in. The relations changed four times across the
 * generations and PokéAPI dates every change, so the retro chart is Gen II's
 * with Gen I's four quirks footnoted, and the modern one today's — out of the
 * same eighteen requests, which React Query keeps for the session.
 *
 * Laid out as Versus is, since the two pages end on an ad for each other: the
 * same column, the chart in the box the battle field takes there, the notes in
 * the text box under it. The column is the table's own width, so nothing on
 * the page is wider than the chart.
 */
export const TypeChartPage = () => {
  const { t } = useTranslation();
  const { era } = useEra();
  const gen = era.maxGen;

  const { chart, types, isLoading, error } = useTypeChart(gen);

  if (isLoading) return <Loader />;
  if (error || !chart) return <ErrorView message={t("error.types")} />;

  const changes = chartChanges(types, gen);

  return (
    <Screen fit title={t("types.title")} intro={t("types.intro", { roman: genRoman(gen) })}>
      <GbBox>
        <Legend />
        <TypeChartTable chart={chart} />
      </GbBox>

      {changes.length > 0 && (
        <GbBox className="mt-4">
          <ChartChanges changes={changes} />
        </GbBox>
      )}

      {/* Last, once the chart is read: the way on to a real matchup. */}
      <div className="mt-10">
        <VersusAd />
      </div>
    </Screen>
  );
};

/** The four values a cell can hold, each in the colour the table gives it. */
const Legend = () => {
  const { t } = useTranslation();
  const legend: { value: Multiplier; label: string }[] = [
    { value: 2, label: t("types.super") },
    { value: 1, label: t("types.neutral") },
    { value: 0.5, label: t("types.notVery") },
    { value: 0, label: t("types.noEffect") },
  ];

  return (
    <ul className="flex flex-wrap gap-x-6 gap-y-2 mb-6 text-[10px]">
      {legend.map(({ value, label }) => (
        <li key={value} className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className={`inline-flex h-6 w-6 items-center justify-center border border-gray-300 ${effectClass(value)}`}
          >
            {printed(value)}
          </span>
          ×{printed(value)} {label}
        </li>
      ))}
    </ul>
  );
};

/** The cells that read differently on the way to this generation, oldest first. */
const ChartChanges = ({ changes }: { changes: ChartChange[] }) => {
  const { t } = useTranslation();
  const typeLabel = useTypeLabel();

  return (
    <section>
      <h2 className="text-sm mb-3">{t("types.changes")}</h2>
      <ul className="text-[10px] leading-relaxed space-y-1">
        {changes.map((change) => (
          <li key={`${change.through}-${change.attacker}-${change.defender}`}>
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
  );
};
