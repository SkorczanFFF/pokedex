import type { PokemonSpecies } from "@/types/pokemon";

// Reading a species payload: which language wins, and what the raw fields mean.
// Fetching one is `api/species.ts` — choosing what to show from it is a display
// decision, so it lives here.

const pickLang = <T>(
  arr: T[],
  getLang: (x: T) => string,
  preferred: readonly string[]
): T | undefined => {
  for (const lang of preferred) {
    const hit = arr.find((x) => getLang(x) === lang);
    if (hit) return hit;
  }
  return undefined;
};

// PokéAPI serves no Polish — its /language list has no `pl` — so a Polish UI
// always falls through to English here. That is permanent, not a gap to fill.
const preferredLangs = (locale: string): readonly string[] => [locale, "en"];

export const getDescription = (s: PokemonSpecies, locale = "en"): string =>
  pickLang(s.flavor_text_entries, (e) => e.language.name, preferredLangs(locale))
    ?.flavor_text.replace(/[\f\n\r\u00ad]/g, " ")
    .trim() ?? "";

export const getGenus = (s: PokemonSpecies, locale = "en"): string =>
  pickLang(s.genera, (g) => g.language.name, preferredLangs(locale))?.genus ?? "";

/** Raw generation slug (e.g. `generation-i`), or null. Display formatting is the UI's job. */
export const getGeneration = (s: PokemonSpecies): string | null => {
  const raw = s.generation?.name ?? "";
  return raw.startsWith("generation-") ? raw : null;
};
