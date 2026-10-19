import { MAX_TYPES, isPokemonType, type PokemonType } from "@/domain/pokemonTypes";

/** Reads `?type=grass,poison` — drops unknown slugs and duplicates, caps at MAX_TYPES. */
export const parseTypes = (raw: string | null): PokemonType[] => {
  if (!raw) return [];
  const picked = new Set<PokemonType>();
  for (const part of raw.split(",")) {
    const slug = part.trim();
    if (isPokemonType(slug)) picked.add(slug);
    if (picked.size >= MAX_TYPES) break;
  }
  return [...picked];
};

/** Writes the same shape back, or nothing for no types. */
export const serializeTypes = (types: readonly string[]): string | null =>
  types.length > 0 ? types.join(",") : null;
