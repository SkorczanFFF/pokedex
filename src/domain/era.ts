import { lastDexId, type GenSlug } from "./dex";

/**
 * The dex rendered as of a generation rather than as of today.
 *
 * Every era-dependent rule is a field here, so adding one is a new property on
 * this table rather than another branch somewhere in the components — and every
 * component asks the era, never "is retro on".
 */
/** The picture column shows the modern artwork or one generation of sprites. */
export type SpriteSetId = "artwork" | GenSlug;

export interface DexEra {
  /** Newest generation this era knows about. */
  maxGen: GenSlug;
  /** Highest dex id it will show. */
  maxDexId: number;
  /** Abilities arrived in Gen III. */
  hasAbilities: boolean;
  /** PokéAPI carries two recordings per Pokémon; the legacy one is the Game Boy's. */
  cry: "latest" | "legacy";
  /** What the picture column opens on; the reader can still pick another. */
  sprites: SpriteSetId;
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
  cry: "latest",
  sprites: "artwork",
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
  cry: "legacy",
  sprites: "ii",
};

export const ERA_NAMES = ["modern", "retro"] as const;

export type EraName = (typeof ERA_NAMES)[number];

export const ERAS: Record<EraName, DexEra> = { modern: MODERN, retro: RETRO };

export const isEraName = (s: string | null): s is EraName =>
  s !== null && (ERA_NAMES as readonly string[]).includes(s);
