import { useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { NotFoundError } from "@/api/client";
import { pokemonQuery } from "@/api/queries";
import { Arrow } from "@/components/Arrow";
import { MENU_ITEM } from "@/components/BattleScreen";
import { ACTION } from "@/components/chips";
import { abilityRule, defaultAbility, hasAbility } from "@/domain/abilities";
import { genRoman, generationFromId } from "@/domain/dex";
import type { DexEra } from "@/domain/era";
import type { TypeChart } from "@/domain/typeChart";
import { useEra } from "@/era/context";
import { useTypeChart } from "@/features/types/useTypeChart";
import { humanize } from "@/i18n/labels";
import { AbilityPicker } from "./AbilityPicker";
import { BattleField, type Fighter, type Known, type Side } from "./BattleField";
import { Attacks, Profile } from "./Matchup";
import { MoveCalc } from "./MoveCalc";
import { PokemonPicker } from "./PokemonPicker";
import { StatDuel } from "./StatDuel";
import { TypeChartAd } from "./TypeChartAd";
import { useVersusParams, type SideParams } from "./useVersusParams";

type Tab = "types" | "stats" | "moves";

const useFighter = (side: Side, name: string | null, era: DexEra): Fighter => {
  const { data, isLoading, error } = useQuery(pokemonQuery(name));

  if (!name) return { side, name, pokemon: null, status: "empty" };
  if (isLoading) return { side, name, pokemon: null, status: "loading" };
  if (error instanceof NotFoundError) {
    return { side, name, pokemon: null, status: "notFound" };
  }
  if (error || !data) return { side, name, pokemon: null, status: "error" };
  if (data.id > era.maxDexId) {
    return { side, name, pokemon: data, status: "outOfEra" };
  }
  return { side, name, pokemon: data, status: "ready" };
};

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
  const yours = useFighter("a", params.a.name, era);
  const foe = useFighter("b", params.b.name, era);
  const [tab, setTab] = useState<Tab>("types");

  const { chart, error: chartError } = useTypeChart(era.maxGen);

  const abilities: Record<Side, string | null> = {
    a: abilityOf(yours, params.a.ability, era),
    b: abilityOf(foe, params.b.ability, era),
  };
  const sides: Record<Side, SideParams> = { a: params.a, b: params.b };

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
          className={`${ACTION} flex h-9 shrink-0 items-center gap-2 self-center whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#FECB09] disabled:hover:text-black md:mt-6 md:self-start`}
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

      <div className="mt-4 border-4 border-black bg-white p-4 md:p-6">
        <Message
          yours={yours}
          foe={foe}
          chart={chart}
          chartError={chartError !== null}
          tab={tab}
          onTab={setTab}
          abilities={abilities}
          sides={sides}
          onMove={params.setMove}
          onLevel={params.setLevel}
        />
      </div>

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

/** The text box under the field: the matchup, a profile, a calculation, or what is wrong. */
const Message = ({
  yours,
  foe,
  chart,
  chartError,
  tab,
  onTab,
  abilities,
  sides,
  onMove,
  onLevel,
}: {
  yours: Fighter;
  foe: Fighter;
  chart: TypeChart | null;
  chartError: boolean;
  tab: Tab;
  onTab: (tab: Tab) => void;
  abilities: Record<Side, string | null>;
  sides: Record<Side, SideParams>;
  onMove: (side: Side, move: string | null) => void;
  onLevel: (side: Side, level: number) => void;
}) => {
  const { t } = useTranslation();
  const { era } = useEra();
  const fighters = [yours, foe];
  const ready = fighters.filter(
    (fighter): fighter is Known => fighter.status === "ready",
  );
  const problems = fighters.filter(
    (fighter) => fighter.status !== "ready" && fighter.status !== "empty",
  );
  const rule = (side: Side) => abilityRule(abilities[side]);

  if (chartError) {
    return (
      <p role="alert" className="text-xs text-[#E12025]">
        {t("error.types")}
      </p>
    );
  }
  if (!chart || fighters.some((fighter) => fighter.status === "loading")) {
    return <p className="text-xs text-gray-500">{t("loader.loading")}</p>;
  }

  return (
    <div className="space-y-6">
      {problems.map((fighter) => (
        <Problem key={fighter.side} fighter={fighter} />
      ))}

      {ready.length === 2 && (
        <>
          <div className="flex flex-wrap gap-4">
            <TabButton active={tab === "types"} onClick={() => onTab("types")}>
              {t("versus.tabTypes")}
            </TabButton>
            <TabButton active={tab === "stats"} onClick={() => onTab("stats")}>
              {t("versus.tabStats")}
            </TabButton>
            <TabButton active={tab === "moves"} onClick={() => onTab("moves")}>
              {t("versus.tabMoves")}
            </TabButton>
          </div>
          {tab === "types" && (
            <div className="grid gap-6 md:grid-cols-2">
              <Attacks
                chart={chart}
                attacker={ready[0].pokemon}
                defender={ready[1].pokemon}
                abilities={{ attacker: rule("a"), defender: rule("b") }}
              />
              <Attacks
                chart={chart}
                attacker={ready[1].pokemon}
                defender={ready[0].pokemon}
                abilities={{ attacker: rule("b"), defender: rule("a") }}
              />
            </div>
          )}
          {tab === "stats" && <StatDuel yours={ready[0].pokemon} foe={ready[1].pokemon} />}
          {tab === "moves" && (
            <MoveCalc
              yours={ready[0]}
              foe={ready[1]}
              chart={chart}
              abilities={abilities}
              sides={sides}
              onMove={onMove}
              onLevel={onLevel}
            />
          )}
        </>
      )}

      {ready.length === 1 && (
        <Profile
          chart={chart}
          pokemon={ready[0].pokemon}
          abilities={{ defender: rule(ready[0].side) }}
        />
      )}

      {ready.length === 0 && problems.length === 0 && (
        <p className="text-xs leading-relaxed">{t("versus.empty")}</p>
      )}

      {/* Retro has no abilities to count or to leave out. */}
      {ready.length > 0 && era.hasAbilities && (
        <p className="text-[10px] leading-relaxed text-gray-500">
          {t("versus.abilitiesScope")}
        </p>
      )}
    </div>
  );
};

const Problem = ({ fighter }: { fighter: Fighter }) => {
  const { t } = useTranslation();
  const { era } = useEra();
  const name = fighter.name ? humanize(fighter.name) : "";

  let text: string;
  if (fighter.status === "outOfEra") {
    const gen = generationFromId(fighter.pokemon.id);
    text = t(gen ? "era.notHereBody" : "era.notHereBodyNoGen", {
      name,
      id: fighter.pokemon.id,
      gen: gen ? genRoman(gen) : "",
      max: era.maxDexId,
    });
  } else if (fighter.status === "notFound") {
    text = t("versus.notFound", { name });
  } else {
    text = t("error.details");
  }

  return (
    <p role="alert" className="text-xs leading-relaxed">
      {text}
    </p>
  );
};

/**
 * A menu line; the open one keeps the cursor and is pressed yellow, the way
 * the language pair and the Retro toggle show which is on.
 */
const TabButton = ({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={`${MENU_ITEM} px-2 py-1 ${
      active ? "bg-[#FECB09] text-black hover:text-black" : ""
    }`}
  >
    <span
      aria-hidden="true"
      className={active ? "" : "opacity-0 group-hover:opacity-50"}
    >
      {">"}
    </span>
    {children}
  </button>
);
