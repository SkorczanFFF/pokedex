export const GEN_SLUGS = [
  "i",
  "ii",
  "iii",
  "iv",
  "v",
  "vi",
  "vii",
  "viii",
  "ix",
] as const;

export type GenSlug = (typeof GEN_SLUGS)[number];

export const isGenSlug = (s: string | null): s is GenSlug =>
  s !== null && (GEN_SLUGS as readonly string[]).includes(s);

export const genApiName = (slug: GenSlug): string => `generation-${slug}`;

/** Roman numeral for a generation slug: `iv` or `generation-iv` -> `IV`. */
export const genRoman = (slug: GenSlug | string): string =>
  slug.replace(/^generation-/, "").toUpperCase();

const GEN_BOUNDARIES: { max: number; slug: GenSlug }[] = [
  { max: 151, slug: "i" },
  { max: 251, slug: "ii" },
  { max: 386, slug: "iii" },
  { max: 493, slug: "iv" },
  { max: 649, slug: "v" },
  { max: 721, slug: "vi" },
  { max: 809, slug: "vii" },
  { max: 905, slug: "viii" },
  { max: 1025, slug: "ix" },
];

// IDs above 1025 are PokéAPI form variants (Mega/Gmax/etc.) — return null
// so callers render nothing rather than guessing an incorrect generation.
export const generationFromId = (id: number): GenSlug | null => {
  for (const { max, slug } of GEN_BOUNDARIES) {
    if (id <= max) return slug;
  }
  return null;
};
