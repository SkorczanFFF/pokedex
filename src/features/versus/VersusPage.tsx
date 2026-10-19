import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useTypeChart } from "@/api/useTypeChart";
import { useEra } from "@/app/era/context";
import { Arrow } from "@/components/Arrow";
import { InlineError } from "@/components/ErrorView";
import { ACTION } from "@/components/buttons";
import { GbBox } from "@/components/layout";
import { defaultAbility, hasAbility } from "@/domain/abilities";
import { genRoman } from "@/domain/dex";
import type { DexEra } from "@/domain/era";
import { AbilityPicker } from "./AbilityPicker";
import { BattleField } from "./BattleField";
import { PokemonPicker } from "./PokemonPicker";
import { TypeChartAd } from "./TypeChartAd";
import { VersusMessage } from "./VersusMessage";
import type { Fighter, Side, Tab } from "./model";
import { useFighter } from "./useFighter";
import { useVersusParams, type SideParams } from "./useVersusParams";
import { VersusContext } from "./versusContext";

/** The ability a fighter is read with: the URL's if it is one of its own, else its first. */
const abilityOf = (fighter: Fighter, picked: string | null, era: DexEra): string | null => {
  if (!era.hasAbilities || fighter.status !== "ready") return null;
  return picked && hasAbility(fighter.pokemon, picked)
    ? picked
    : defaultAbility(fighter.pokemon);
};

/**
 * Two Pokémon on the Game Boy battle screen, and what the types of each do to
 * the other, as of the era. One alone shows what every type does to it. A third
 * tab calculates a hit of a picked move.
 *
 * Both slots live in the URL (`?a=x&b=y`), with each side's ability, move and
 * level beside them, so a matchup is a link. The chart comes from the same
 * eighteen type requests the chart page keeps.
 */
export const VersusPage = () => {
  const { t } = useTranslation();
  const { era } = useEra();
  const params = useVersusParams();
  const yours = useFighter("a", params.a.name);
  const foe = useFighter("b", params.b.name);
  const [tab, setTab] = useState<Tab>("types");

  const { chart, error: chartError } = useTypeChart(era.maxGen);

  const abilities: Record<Side, string | null> = {
    a: abilityOf(yours, params.a.ability, era),
    b: abilityOf(foe, params.b.ability, era),
  };
  const sides: Record<Side, SideParams> = { a: params.a, b: params.b };
  const loading = [yours, foe].some((fighter) => fighter.status === "loading");

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="text-2xl mb-3">{t("versus.title")}</h1>
      <p className="mb-6 text-xs leading-relaxed text-gray-500">
        {t("versus.intro", { roman: genRoman(era.maxGen) })}
      </p>

      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-start">
        <Corner
          fighter={yours}
          label={t("versus.yours")}
          placeholder={t("versus.pickYours")}
          params={params.a}
          ability={abilities.a}
          onPick={(name) => params.pick("a", name)}
          onAbility={(ability) => params.setAbility("a", ability)}
        />
        {/* Level with the inputs, not the labels over them: the label's line and
            its gap come to the margin. */}
        <button
          type="button"
          onClick={params.swap}
          disabled={!params.a.name && !params.b.name}
          className={`${ACTION} flex h-9 shrink-0 items-center gap-2 self-center whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-dex-yellow disabled:hover:text-black md:mt-6 md:self-start`}
        >
          {/* One arrow towards each picker: up and down while they are
              stacked, left and right once they sit side by side. */}
          <Arrow className="rotate-180 md:rotate-90" />
          {t("versus.swap")}
          <Arrow className="md:-rotate-90" />
        </button>
        <Corner
          fighter={foe}
          label={t("versus.foe")}
          placeholder={t("versus.pickFoe")}
          params={params.b}
          ability={abilities.b}
          onPick={(name) => params.pick("b", name)}
          onAbility={(ability) => params.setAbility("b", ability)}
        />
      </div>

      <BattleField yours={yours} foe={foe} />

      <GbBox className="mt-4">
        {chartError ? (
          <InlineError>{t("error.types")}</InlineError>
        ) : !chart || loading ? (
          <p className="text-xs text-gray-500">{t("loader.loading")}</p>
        ) : (
          <VersusContext.Provider
            value={{ chart, abilities, sides, setMove: params.setMove, setLevel: params.setLevel }}
          >
            <VersusMessage yours={yours} foe={foe} tab={tab} onTab={setTab} />
          </VersusContext.Provider>
        )}
      </GbBox>

      {/* Last, as the chart page ends on Versus: the way back to all of it. */}
      {chart && (
        <div className="mt-10">
          <TypeChartAd chart={chart} />
        </div>
      )}
    </div>
  );
};

/** One side's picker, with its abilities under it once the Pokémon is known. */
const Corner = ({
  fighter,
  label,
  placeholder,
  params,
  ability,
  onPick,
  onAbility,
}: {
  fighter: Fighter;
  label: string;
  placeholder: string;
  params: SideParams;
  ability: string | null;
  onPick: (name: string | null) => void;
  onAbility: (ability: string) => void;
}) => (
  <div className="min-w-0 flex-1 space-y-2">
    <PokemonPicker
      label={label}
      placeholder={placeholder}
      value={params.name}
      onPick={onPick}
    />
    {fighter.status === "ready" && (
      <AbilityPicker pokemon={fighter.pokemon} value={ability} onPick={onAbility} />
    )}
  </div>
);
