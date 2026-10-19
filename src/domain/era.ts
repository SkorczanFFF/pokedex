import { genOrder, lastDexId, type GenSlug } from "./dex";
import type { SpriteSetId } from "./sprites";

/**
 * The dex rendered as of a generation rather than as of today.
 *
 * Every era-dependent rule is a field here, so adding one is a new property on
 * this table rather than another branch somewhere in the components — and every
 * component asks the era, never "is retro on". The questions an era is asked
 * most often — is this id in it, had this generation happened yet, which dated
 * entry applies — are the helpers at the bottom, so the comparison is written
 * once rather than wherever a payload is read.
 */
export interface DexEra {
  /** Newest generation this era knows about. */
  maxGen: GenSlug;
  /** Highest dex id it will show. */
  maxDexId: number;
  /** Abilities arrived in Gen III. */
  hasAbilities: boolean;
  /** What the picture column opens on; the reader can still pick another. */
  sprites: SpriteSetId;
  /**
   * Whether the era's pictures are a game's pixel sprites — drawn sharp, on the
   * opaque white panel the game drew them on — rather than the artwork.
   */
  pixelArt: boolean;
  /** How the dex reads its entry aloud; the Game Boy's speaker is crushed to a few bits. */
  voice: "clean" | "8-bit";
  /** How a stat grows from its base: DVs and stat experience through Gen II, IVs and EVs since. */
  statFormula: "dv" | "iv";
  /** Through Gen III a move was physical or special by its type, not by the move. */
  damageClassByType: boolean;
}

export const MODERN: DexEra = {
  maxGen: "ix",
  /**
   * No cap. `/pokemon` answers with 1351 entries: the 1025 of the national dex
   * and 326 alternate forms — Megas, Gmax, regional variants — which PokéAPI
   * numbers from 10000 up. Capping at the national dex would quietly drop all
   * of them from the list and from search, so the modern dex takes everything.
   */
  maxDexId: Infinity,
  hasAbilities: true,
  sprites: "artwork",
  pixelArt: false,
  voice: "clean",
  statFormula: "iv",
  damageClassByType: false,
};

/**
 * Gen I and II. Era I would cost nothing more than another entry here — the
 * boundary comes from `maxGen`, and every rule below it already keys off the
 * era rather than off a boolean.
 */
export const RETRO: DexEra = {
  maxGen: "ii",
  maxDexId: lastDexId("ii"),
  hasAbilities: false,
  sprites: "ii/crystal",
  pixelArt: true,
  voice: "8-bit",
  statFormula: "dv",
  damageClassByType: true,
};

const ERA_NAMES = ["modern", "retro"] as const;

export type EraName = (typeof ERA_NAMES)[number];

export const ERAS: Record<EraName, DexEra> = { modern: MODERN, retro: RETRO };

/** What the dex opens on, and what "leave retro" drops back to. */
export const DEFAULT_ERA: EraName = "modern";

export const isEraName = (s: string | null): s is EraName =>
  s !== null && (ERA_NAMES as readonly string[]).includes(s);

/** Whether a dex id belongs to the era. The forms numbered from 10000 belong only to the modern dex. */
export const isInEra = (id: number, era: DexEra): boolean => id <= era.maxDexId;

/** Whether a generation had happened by the era. */
export const genInEra = (gen: GenSlug, era: DexEra): boolean =>
  genOrder(gen) <= genOrder(era.maxGen);

/**
 * The newest entry the era knows about, by the generation each one belongs to.
 *
 * Ties within one generation go to the later entry, which is how a pair like
 * Gold and Silver resolves to the one PokéAPI lists last. An entry whose
 * generation cannot be told is skipped rather than guessed at.
 */
export const newestInEra = <T>(
  entries: readonly T[],
  genOf: (entry: T) => GenSlug | null,
  era: DexEra,
): T | undefined => {
  let best: { order: number; entry: T } | undefined;
  for (const entry of entries) {
    const gen = genOf(entry);
    if (gen === null || !genInEra(gen, era)) continue;
    const order = genOrder(gen);
    if (best === undefined || order >= best.order) best = { order, entry };
  }
  return best?.entry;
};

/**
 * The dated entry that applies at a point in time, read the way PokéAPI dates
 * its history: each entry holds what stood *through* the point it names, so
 * the one in force at `target` is the earliest still reaching it. Undefined
 * when none does — today's value stands. `orderOf` answers null for an entry
 * it cannot date, which is skipped.
 */
export const inForceAt = <T>(
  entries: readonly T[],
  orderOf: (entry: T) => number | null,
  target: number,
): T | undefined => {
  let best: { order: number; entry: T } | undefined;
  for (const entry of entries) {
    const order = orderOf(entry);
    if (order === null || order < target) continue;
    if (best === undefined || order < best.order) best = { order, entry };
  }
  return best?.entry;
};
