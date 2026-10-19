// The games' text as PokéAPI hands it over, and the text PokéAPI does not have.

/** PokéAPI writes every entry in English whatever else it carries: the last resort of every fallback. */
export const FALLBACK_LANGUAGE = "en";

/**
 * Turns a PokéAPI slug into readable English: `special-attack` -> `Special
 * Attack`, `solar-power` -> `Solar Power`. The fallback for every label without
 * a translation, so an untranslated entry renders as proper English rather
 * than a raw slug or a blank.
 */
export const humanize = (slug: string): string =>
  slug
    .split("-")
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
    .join(" ");

/** Flavour text carries the games' own line breaks, form feeds and soft hyphens; one space each. */
export const cleanFlavorText = (text: string): string =>
  text.replace(/[\f\n\r­]/g, " ").trim();

/**
 * Every entry in the best available language: the one asked for, else English.
 *
 * PokéAPI serves no Polish — its /language list has no `pl` — so a Polish UI
 * always falls through to English here, and anything better has to be passed
 * in from outside.
 */
export const inLanguage = <T>(
  entries: readonly T[],
  languageOf: (entry: T) => string,
  locale: string,
): T[] => {
  for (const language of [locale, FALLBACK_LANGUAGE]) {
    const hits = entries.filter((entry) => languageOf(entry) === language);
    if (hits.length > 0) return hits;
  }
  return [];
};

/**
 * Text for a language PokéAPI does not carry, one sentence per run of games.
 *
 * Shaped the way the source prints it — `[["gold-silver", "crystal"], "…"]` —
 * because a run of games sharing one sentence is the source's own unit, and
 * flattening it would store that sentence once per game. A species' table
 * names games, a move's names version groups; the shape is the same.
 */
export type TranslatedText = readonly (readonly [readonly string[], string])[];

/** A sentence and the game that printed it. */
export interface PrintedText {
  game: string;
  text: string;
}

/** The table unrolled to one entry per game, the way PokéAPI's own entries come. */
export const flattenTranslated = (translated: TranslatedText): PrintedText[] =>
  translated.flatMap(([games, text]) => games.map((game) => ({ game, text })));
