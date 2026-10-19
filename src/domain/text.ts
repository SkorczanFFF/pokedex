// The games' text as PokéAPI hands it over, and the text PokéAPI does not have.

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
  for (const language of [locale, "en"]) {
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
