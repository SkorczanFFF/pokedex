import { useTranslation } from "react-i18next";
import { gameName } from "@/domain/games";
import { humanize } from "@/domain/text";

// Display labels for PokéAPI's slugs. Each looks the slug up in its
// dictionary and falls back to `humanize`, so an untranslated entry renders
// as proper English rather than a raw slug or a blank.

export { humanize };

/** Display label for a type slug. The slug stays the URL/style key. */
export const useTypeLabel = () => {
  const { t } = useTranslation("pokemon");
  return (slug: string) => t(`types.${slug}`, { defaultValue: humanize(slug) });
};

/** Display label for a stat slug (`hp`, `special-attack`, ...). */
export const useStatLabel = () => {
  const { t } = useTranslation("pokemon");
  return (slug: string) => t(`stats.${slug}`, { defaultValue: humanize(slug) });
};

/** Display label for a move slug. The slug stays the key everywhere else. */
export const useMoveLabel = () => {
  const { t } = useTranslation("moves");
  return (slug: string) => t(slug, { defaultValue: humanize(slug) });
};

/** Display label for a move's damage class (`physical`, `special`, `status`). */
export const useDamageClassLabel = () => {
  const { t } = useTranslation("pokemon");
  return (slug: string) =>
    t(`damageClasses.${slug}`, { defaultValue: humanize(slug) });
};

/** Display label for how a Pokémon is met (`walk`, `surf`, `super-rod`). */
export const useEncounterMethodLabel = () => {
  const { t } = useTranslation("pokemon");
  return (slug: string) =>
    t(`encounterMethods.${slug}`, { defaultValue: humanize(slug) });
};

/**
 * Display label for what an encounter takes: a time of day, a swarm, a radio
 * station. Two of these carry a value in the slug rather than naming a fixed
 * thing — `coins-2222` is the Celadon prize corner's price and `trade-pikachu`
 * is what an NPC wants — so they are read before the dictionary is consulted.
 */
export const useEncounterConditionLabel = () => {
  const { t } = useTranslation("pokemon");
  const { t: common } = useTranslation();

  return (slug: string) => {
    const coins = slug.match(/^coins-(\d+)$/);
    if (coins) return common("encounters.coins", { count: Number(coins[1]) });

    const trade = slug.match(/^trade-(.+)$/);
    if (trade) return common("encounters.trade", { name: humanize(trade[1]) });

    return t(`encounterConditions.${slug}`, { defaultValue: humanize(slug) });
  };
};

/** Display label for how a move is learned (`level-up`, `machine`, `egg`). */
export const useMoveMethodLabel = () => {
  const { t } = useTranslation("pokemon");
  return (slug: string) =>
    t(`moveMethods.${slug}`, { defaultValue: humanize(slug) });
};

/**
 * Display label for an ability slug. PokéAPI has no Polish and there are 373
 * abilities, so the Polish dictionary is filled in progressively — anything
 * missing falls back to humanized English.
 */
export const useAbilityLabel = () => {
  const { t } = useTranslation("abilities");
  return (slug: string) => t(slug, { defaultValue: humanize(slug) });
};

/**
 * A game's name as printed on its box — a version or a version group alike,
 * and the same in every language, so there is no dictionary to consult.
 */
export const useGameLabel = () => (slug: string) => gameName(slug);
