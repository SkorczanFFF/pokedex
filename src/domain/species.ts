import type { PokemonSpecies } from "@/types/pokemon";
import { genOrder } from "./dex";
import type { DexEra } from "./era";
import { generationOfVersion } from "./games";

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
  dex: readonly (readonly [readonly string[], string])[];
}

/** A sentence and the language it turned out to be in. */
export interface SpeciesDescription {
  text: string;
  language: string;
}

/**
 * Every entry in the best available language.
 *
 * PokéAPI serves no Polish — its /language list has no `pl` — so a Polish UI
 * always falls through to English here, and anything better has to be passed
 * in from outside.
 */
const inLanguage = <T>(
  entries: T[],
  languageOf: (entry: T) => string,
  locale: string
): T[] => {
  for (const language of [locale, "en"]) {
    const hits = entries.filter((entry) => languageOf(entry) === language);
    if (hits.length > 0) return hits;
  }
  return [];
};

/**
 * The newest entry the era knows about.
 *
 * Ties within one generation go to the later entry, which is how a pair like
 * Gold and Silver resolves to the one PokéAPI lists last. Entries from a game
 * this table cannot date are skipped rather than guessed at.
 */
const newestInEra = <T>(
  entries: T[],
  versionOf: (entry: T) => string,
  era: DexEra
): T | undefined => {
  const cap = genOrder(era.maxGen);
  let best: { order: number; entry: T } | undefined;

  for (const entry of entries) {
    const generation = generationOfVersion(versionOf(entry));
    if (generation === null) continue;

    const order = genOrder(generation);
    if (order <= cap && (best === undefined || order >= best.order)) {
      best = { order, entry };
    }
  }

  return best?.entry;
};

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
  const carried = (translated?.dex ?? []).flatMap(([versions, text]) =>
    versions.map((version) => ({ version, text }))
  );
  const own = newestInEra(carried, (entry) => entry.version, era) ?? carried[0];
  if (own) return { text: own.text, language: locale };

  const entries = inLanguage(
    species.flavor_text_entries,
    (entry) => entry.language.name,
    locale
  );
  const entry =
    newestInEra(entries, (e) => e.version.name, era) ?? entries[0];

  return {
    text:
      entry?.flavor_text.replace(/[\f\n\r\u00ad]/g, " ").trim() ?? "",
    // `inLanguage` answers in `locale` when it can and in English otherwise.
    language: entry?.language.name ?? "en",
  };
};

/** The "Seed Pokémon" line. Genera carry no version, so the era has no say. */
export const getGenus = (
  species: PokemonSpecies,
  locale = "en",
  translated: TranslatedSpeciesText | null = null
): string =>
  translated?.genus ||
  inLanguage(species.genera, (entry) => entry.language.name, locale)[0]?.genus ||
  "";

/** Raw generation slug (e.g. `generation-i`), or null. Display formatting is the UI's job. */
export const getGeneration = (species: PokemonSpecies): string | null => {
  const raw = species.generation?.name ?? "";
  return raw.startsWith("generation-") ? raw : null;
};
