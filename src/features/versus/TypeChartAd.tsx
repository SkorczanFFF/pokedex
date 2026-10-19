import { useTranslation } from "react-i18next";
import { paths } from "@/app/routes";
import { AdAction, AdBox, StadiumTitle } from "@/components/AdBox";
import { typeClass, type PokemonType } from "@/domain/pokemonTypes";
import type { TypeChart } from "@/domain/typeChart";
import { effectClass, printed } from "@/components/effectiveness";
import { useTypeLabel } from "@/i18n/labels";

/** The starters' triangle: the corner of the chart every player knows by heart. */
const STARTERS: readonly PokemonType[] = ["fire", "water", "grass"];

/**
 * A small ad for the type chart, the Versus ad's counterpart on the other
 * page: the same Gen II box, with a corner of the chart itself — Fire, Water
 * and Grass against each other, read from the real chart — where the fighters
 * stood.
 */
export const TypeChartAd = ({ chart }: { chart: TypeChart }) => {
  const { t } = useTranslation();

  return (
    <AdBox to={paths.types} label={t("versus.chartAd")}>
      <MiniChart chart={chart} />
      <span className="min-w-0 flex-1 text-center">
        <StadiumTitle>{t("types.link")}</StadiumTitle>
        <span className="mt-2 block text-[8px] leading-relaxed text-gray-500">
          {t("versus.chartAdLine", { count: chart.types.length - STARTERS.length })}
        </span>
        {/* The games' own line for a ×2, the chart's best-known cell. */}
        <AdAction>{t("versus.super")}</AdAction>
      </span>
    </AdBox>
  );
};

/** Three types square: attackers down the side, defenders along the top. */
const MiniChart = ({ chart }: { chart: TypeChart }) => {
  const typeLabel = useTypeLabel();
  const cell = "flex h-5 w-5 items-center justify-center text-[10px] leading-none";

  return (
    <span
      aria-hidden="true"
      className="grid shrink-0 grid-cols-4 gap-px border border-black bg-black"
    >
      <span className={`${cell} bg-white`} />
      {STARTERS.map((defender) => (
        <span
          key={defender}
          title={typeLabel(defender)}
          className={`${cell} ${typeClass(defender)}`}
        />
      ))}
      {STARTERS.map((attacker) => [
        <span
          key={attacker}
          title={typeLabel(attacker)}
          className={`${cell} ${typeClass(attacker)}`}
        />,
        ...STARTERS.map((defender) => {
          const value = chart.multiplier(attacker, defender);
          return (
            <span
              key={`${attacker}-${defender}`}
              className={`${cell} ${effectClass(value, true)}`}
            >
              {printed(value)}
            </span>
          );
        }),
      ])}
    </span>
  );
};
