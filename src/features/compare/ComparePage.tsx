import { useState, type ReactNode } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { NotFoundError } from "@/api/client";
import { getPokemonDetails } from "@/api/pokemon";
import { getType } from "@/api/types";
import { MENU_ITEM } from "@/components/BattleScreen";
import { genRoman, generationFromId } from "@/domain/dex";
import type { DexEra } from "@/domain/era";
import { typesUpTo } from "@/domain/pokemonTypes";
import { typeChart, type TypeChart } from "@/domain/typeChart";
import { useEra } from "@/era/context";
import { humanize } from "@/i18n/labels";
import { BattleField, type Fighter, type Known, type Side } from "./BattleField";
import { Attacks, Profile } from "./Matchup";
import { PokemonPicker } from "./PokemonPicker";
import { StatDuel } from "./StatDuel";

type Tab = "types" | "stats";

const useFighter = (side: Side, name: string | null, era: DexEra): Fighter => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["pokemon", name],
    queryFn: () => getPokemonDetails(name!),
    enabled: !!name,
  });

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

/**
 * Two Pokémon on the Game Boy battle screen, and what the types of each do to
 * the other, as of the era. One alone shows what every type does to it.
 *
 * Both slots live in the URL (`?a=x&b=y`) so a matchup is a link. The chart
 * comes from the same eighteen type requests the chart page keeps.
 */
export const ComparePage = () => {
  const { t } = useTranslation();
  const { era } = useEra();
  const [params, setParams] = useSearchParams();
  const a = params.get("a");
  const b = params.get("b");
  const yours = useFighter("a", a, era);
  const foe = useFighter("b", b, era);
  const [tab, setTab] = useState<Tab>("types");

  const typeQueries = useQueries({
    queries: typesUpTo(era.maxGen).map((name) => ({
      queryKey: ["type", name],
      queryFn: () => getType(name),
    })),
  });
  const chartError = typeQueries.some((q) => q.error);
  const chart =
    chartError || typeQueries.some((q) => q.isLoading)
      ? null
      : typeChart(
          typeQueries.flatMap((q) => (q.data ? [q.data] : [])),
          era.maxGen,
        );

  const set = (patch: Partial<Record<Side, string | null>>) =>
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      for (const [key, value] of Object.entries(patch)) {
        if (value) next.set(key, value);
        else next.delete(key);
      }
      return next;
    });

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="text-2xl mb-3">{t("compare.title")}</h1>
      <p className="mb-6 text-xs leading-relaxed text-gray-500">
        {t("compare.intro", { roman: genRoman(era.maxGen) })}
      </p>

      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end">
        <PokemonPicker
          label={t("compare.yours")}
          value={a}
          onPick={(name) => set({ a: name })}
        />
        <button
          type="button"
          onClick={() => set({ a: b, b: a })}
          disabled={!a && !b}
          className="h-9 self-center px-3 text-xs bg-gray-200 text-black cursor-pointer hover:bg-[#FECB09] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-gray-200 md:self-end"
        >
          {t("compare.swap")}
        </button>
        <PokemonPicker
          label={t("compare.foe")}
          value={b}
          onPick={(name) => set({ b: name })}
        />
      </div>

      <BattleField yours={yours} foe={foe} />

      <div className="mt-4 border-4 border-black bg-white p-4 md:p-6">
        <Message
          yours={yours}
          foe={foe}
          chart={chart}
          chartError={chartError}
          tab={tab}
          onTab={setTab}
        />
      </div>
    </div>
  );
};

/** The text box under the field: the matchup, a profile, or what is wrong. */
const Message = ({
  yours,
  foe,
  chart,
  chartError,
  tab,
  onTab,
}: {
  yours: Fighter;
  foe: Fighter;
  chart: TypeChart | null;
  chartError: boolean;
  tab: Tab;
  onTab: (tab: Tab) => void;
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
          <div className="flex gap-8">
            <TabButton active={tab === "types"} onClick={() => onTab("types")}>
              {t("compare.tabTypes")}
            </TabButton>
            <TabButton active={tab === "stats"} onClick={() => onTab("stats")}>
              {t("compare.tabStats")}
            </TabButton>
          </div>
          {tab === "types" ? (
            <div className="grid gap-6 md:grid-cols-2">
              <Attacks
                chart={chart}
                attacker={ready[0].pokemon}
                defender={ready[1].pokemon}
              />
              <Attacks
                chart={chart}
                attacker={ready[1].pokemon}
                defender={ready[0].pokemon}
              />
            </div>
          ) : (
            <StatDuel yours={ready[0].pokemon} foe={ready[1].pokemon} />
          )}
        </>
      )}

      {ready.length === 1 && <Profile chart={chart} pokemon={ready[0].pokemon} />}

      {ready.length === 0 && problems.length === 0 && (
        <p className="text-xs leading-relaxed">{t("compare.empty")}</p>
      )}

      {/* Retro has no abilities to leave out. */}
      {ready.length > 0 && era.hasAbilities && (
        <p className="text-[10px] leading-relaxed text-gray-500">
          {t("compare.abilitiesNote")}
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
    text = t("compare.notFound", { name });
  } else {
    text = t("error.details");
  }

  return (
    <p role="alert" className="text-xs leading-relaxed">
      {text}
    </p>
  );
};

/** A menu line; the cursor stays on the open one. */
const TabButton = ({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) => (
  <button type="button" onClick={onClick} aria-pressed={active} className={MENU_ITEM}>
    <span
      aria-hidden="true"
      className={active ? "" : "opacity-0 group-hover:opacity-50"}
    >
      {">"}
    </span>
    {children}
  </button>
);
