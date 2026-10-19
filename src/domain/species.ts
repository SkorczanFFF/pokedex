import type { PokemonSpecies } from "@/types/pokemon";
import { genSlugOf, type GenSlug } from "./dex";
import { newestInEra, type DexEra } from "./era";
import { generationOfVersion } from "./games";
import {
  FALLBACK_LANGUAGE,
  cleanFlavorText,
  flattenTranslated,
  inLanguage,
  type TranslatedText,
} from "./text";

// Reading a species payload: which language wins, which game's text wins, and
// what the raw fields mean. Fetching one is `api/species.ts` — choosing what to
// show from it is a display decision, so it lives here.

/**
 * A species' text for a language PokéAPI does not carry.
 *
 * The dex entries keep the source's own shape — one sentence against the games
 * that printed it — so they read through the same era rule the English entries
 * do. Only the newest entry of each generation is kept, because that is all an
 * era can ever ask for.
 */
export interface TranslatedSpeciesText {
  genus?: string;
  dex: TranslatedText;
}

/** A sentence and the language it turned out to be in. */
export interface SpeciesDescription {
  text: string;
  language: string;
}

/** The newest entry the era knows, dated by the game that printed it. */
const newestVersion = <T>(
  entries: readonly T[],
  versionOf: (entry: T) => string,
  era: DexEra,
): T | undefined =>
  newestInEra(entries, (entry) => generationOfVersion(versionOf(entry)), era);

/**
 * The dex entry to show.
 *
 * There is one per game a Pokémon has appeared in since 1996, and this used to
 * take the first in the list — which is Red's, in every mode and every
 * generation. Now the era picks: modern reads the newest text, retro reads what
 * Gold, Silver or Crystal actually printed.
 *
 * A Pokémon that postdates the era has nothing to offer it, so its oldest entry
 * stands in — reachable by opening a Gen VIII link while retro is on, where a
 * blank paragraph would read as a bug rather than as a fact.
 */
export const getDescription = (
  species: PokemonSpecies,
  locale: string,
  era: DexEra,
  translated: TranslatedSpeciesText | null = null
): SpeciesDescription => {
  const carried = flattenTranslated(translated?.dex ?? []);
  const own = newestVersion(carried, (entry) => entry.game, era) ?? carried[0];
  if (own) return { text: own.text, language: locale };

  const entries = inLanguage(
    species.flavor_text_entries,
    (entry) => entry.language.name,
    locale
  );
  const entry = newestVersion(entries, (e) => e.version.name, era) ?? entries[0];

  return {
    text: entry ? cleanFlavorText(entry.flavor_text) : "",
    // `inLanguage` answers in `locale` when it can and in English otherwise.
    language: entry?.language.name ?? FALLBACK_LANGUAGE,
  };
};

/** The "Seed Pokémon" line. Genera carry no version, so the era has no say. */
export const getGenus = (
  species: PokemonSpecies,
  locale = FALLBACK_LANGUAGE,
  translated: TranslatedSpeciesText | null = null
): string =>
  translated?.genus ||
  inLanguage(species.genera, (entry) => entry.language.name, locale)[0]?.genus ||
  "";

/** The generation the species arrived in, or null for one the dex does not know. */
export const getGeneration = (species: PokemonSpecies): GenSlug | null =>
  genSlugOf(species.generation?.name ?? "");
