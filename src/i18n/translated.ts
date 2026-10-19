import { queryOptions, useQuery } from "@tanstack/react-query";
import type { TranslatedSpeciesText } from "@/domain/species";
import type { TranslatedText } from "@/domain/text";
import { useLocale, type Locale } from "./locale";

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
      (module) => module.default as unknown as Record<string, TranslatedText>
    ),
  species: () =>
    import("./locales/pl/pokemonDescriptions.json").then(
      (module) =>
        module.default as unknown as Record<string, TranslatedSpeciesText>
    ),
} as const;

/** Polish is the only language with a table, because it is the only gap. */
const TRANSLATED: Locale = "pl";

/** One table, loaded once for the session; a local resource, so not in `api/queries`. */
const translatedTableQuery = <T>(which: keyof typeof POLISH, locale: Locale) =>
  queryOptions({
    queryKey: ["translated", which, locale],
    queryFn: POLISH[which] as () => Promise<Record<string, T>>,
    enabled: locale === TRANSLATED,
    staleTime: Infinity,
  });

const useTable = <T,>(which: keyof typeof POLISH) => {
  const locale = useLocale();
  const { data } = useQuery(translatedTableQuery<T>(which, locale));
  return (slug: string): T | null => (locale === TRANSLATED && data?.[slug]) || null;
};

/** A move's sentence in the reading language, or null when there is none. */
export const useTranslatedMoveText = () => useTable<TranslatedText>("moves");

/** A species' dex entries and genus in the reading language, or null. */
export const useTranslatedSpeciesText = () =>
  useTable<TranslatedSpeciesText>("species");
