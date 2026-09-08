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

/**
 * Where each generation's slice of the national dex ends. Keyed by slug rather
 * than listed, so adding a generation to `GEN_SLUGS` without giving it a
 * boundary is a compile error instead of a silent gap.
 */
const LAST_DEX_ID: Record<GenSlug, number> = {
  i: 151,
  ii: 251,
  iii: 386,
  iv: 493,
  v: 649,
  vi: 721,
  vii: 809,
  viii: 905,
  ix: 1025,
};

/** Position in dex order, so two generations can be compared. */
export const genOrder = (slug: GenSlug): number => GEN_SLUGS.indexOf(slug);

/** `generation-iv` -> `iv`, or null when it is not a generation we know. */
export const genSlugOf = (apiName: string): GenSlug | null => {
  const slug = apiName.replace(/^generation-/, "");
  return isGenSlug(slug) ? slug : null;
};

/** Generations from I up to and including `maxGen`, in dex order. */
export const gensUpTo = (maxGen: GenSlug): readonly GenSlug[] =>
  GEN_SLUGS.slice(0, GEN_SLUGS.indexOf(maxGen) + 1);

/** Highest national dex id belonging to a generation. */
export const lastDexId = (slug: GenSlug): number => LAST_DEX_ID[slug];

/**
 * The dex ids either side of one, or null where there is nothing to step to.
 *
 * `lastId` is the era's own ceiling — `lastDexId(era.maxGen)` — which does two
 * jobs at once. It stops retro at Celebi rather than walking on into Treecko,
 * and it excludes the form variants, whose ids start at 10001: PokéAPI orders
 * `deoxys-attack` after `pecharunt` because it numbers it 10001, not because
 * anything follows the national dex, so a form is a place you can arrive at and
 * not a place you can step through.
 */
export const dexNeighbourIds = (
  id: number,
  lastId: number
): { prev: number | null; next: number | null } => ({
  prev: id > 1 && id <= lastId ? id - 1 : null,
  next: id >= 1 && id < lastId ? id + 1 : null,
});

// IDs above 1025 are PokéAPI form variants (Mega/Gmax/etc.) — return null
// so callers render nothing rather than guessing an incorrect generation.
export const generationFromId = (id: number): GenSlug | null => {
  for (const slug of GEN_SLUGS) {
    if (id <= LAST_DEX_ID[slug]) return slug;
  }
  return null;
};
