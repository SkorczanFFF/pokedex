import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import type { TranslatedMoveText } from "@/domain/moves";
import type { TranslatedSpeciesText } from "@/domain/species";

/**
 * The text PokéAPI does not carry in the reading language.
 *
 * PokéAPI writes both a move's sentence and a species' dex entry in fourteen
 * languages, and Polish is not among them — its `/language` list has no `pl` at
 * all. Both tables here come from Pokémon Wiki PL, which prints its entries the
 * same way PokéAPI does: a move's per run of games, a species' per game. That
 * is why they drop into the same lookups the English entries go through rather
 * than needing a second code path.
 *
 * Neither is bundled. Together they are larger than every other resource in the
 * app put together, so an English reader downloads neither, and a Polish one
 * downloads each once — the moves when they first open a move, the species when
 * they first open a Pokémon. Held forever after that, like the payloads they
 * annotate.
 */
const POLISH = {
  moves: () =>
    import("./locales/pl/moveDescriptions.json").then(
      // A JSON import widens every pair to an array of unions, so the pairing
      // the generator guarantees has to be restated rather than inferred.
      (module) => module.default as unknown as Record<string, TranslatedMoveText>
    ),
  species: () =>
    import("./locales/pl/pokemonDescriptions.json").then(
      (module) =>
        module.default as unknown as Record<string, TranslatedSpeciesText>
    ),
} as const;

/** Polish is the only language with a table, because it is the only gap. */
const useTable = <T,>(which: keyof typeof POLISH) => {
  const { i18n } = useTranslation();
  const locale = i18n.resolvedLanguage ?? "en";
  const translated = locale === "pl";

  const { data } = useQuery({
    queryKey: ["translated", which, locale],
    queryFn: POLISH[which] as () => Promise<Record<string, T>>,
    enabled: translated,
    staleTime: Infinity,
  });

  return (slug: string): T | null => (translated && data?.[slug]) || null;
};

/** A move's sentence in the reading language, or null when there is none. */
export const useTranslatedMoveText = () => useTable<TranslatedMoveText>("moves");

/** A species' dex entries and genus in the reading language, or null. */
export const useTranslatedSpeciesText = () =>
  useTable<TranslatedSpeciesText>("species");
