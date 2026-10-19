import type { Pokemon, SpriteSheet } from "@/types/pokemon";
import { GEN_SLUGS, genApiName, isGenSlug, type GenSlug } from "./dex";
import { gameName } from "./games";

/**
 * The picture column shows the modern artwork or one game's sprite sheet,
 * named `ii/crystal` — the generation, then the game as PokéAPI keys it under
 * `sprites.versions`.
 */
export type SpriteSetId = "artwork" | `${GenSlug}/${string}`;

interface GenSheets {
  /** The sheets the picker offers, in the order they are listed: PokéAPI's keys under `sprites.versions["generation-…"]`. */
  games: readonly string[];
  /** The sheet a generation opens on when picked by its numeral alone. */
  opensOn: string;
}

/**
 * The sheets the picker offers, per generation.
 *
 * Gen I and II are broken out game by game, because each of those games drew
 * its own: Gold's Pikachu is not Silver's, and neither is Crystal's. Later
 * generations list one representative — they ship two or three sheets each and
 * the difference is a palette, so the picker shows the last and most refined.
 * Adding a game is one more entry here.
 *
 * What a generation opens on is the originals for Gen I and the last and most
 * polished sheet everywhere else.
 */
const SPRITE_GAMES: Record<GenSlug, GenSheets> = {
  i: { games: ["red-blue", "yellow", "red-green-japan"], opensOn: "red-blue" },
  ii: { games: ["gold", "silver", "crystal"], opensOn: "crystal" },
  iii: { games: ["emerald"], opensOn: "emerald" },
  iv: { games: ["platinum"], opensOn: "platinum" },
  v: { games: ["black-white"], opensOn: "black-white" },
  vi: { games: ["x-y"], opensOn: "x-y" },
  vii: { games: ["ultra-sun-ultra-moon"], opensOn: "ultra-sun-ultra-moon" },
  viii: {
    games: ["brilliant-diamond-shining-pearl"],
    opensOn: "brilliant-diamond-shining-pearl",
  },
  ix: { games: ["scarlet-violet"], opensOn: "scarlet-violet" },
};

const gameSet = (gen: GenSlug, game: string): SpriteSetId => `${gen}/${game}`;

/** Every set the picker could offer: the artwork, then every sheet in dex order. */
export const ALL_SPRITE_SETS: readonly SpriteSetId[] = [
  "artwork",
  ...GEN_SLUGS.flatMap((gen) => SPRITE_GAMES[gen].games.map((game) => gameSet(gen, game))),
];

/** The generation and game behind a set, or null for the artwork. */
export const setGame = (
  set: SpriteSetId,
): { gen: GenSlug; game: string } | null => {
  if (set === "artwork") return null;
  const [gen, game] = set.split("/");
  return isGenSlug(gen) && game ? { gen, game } : null;
};

/** The set a generation's numeral opens on. */
export const genOpening = (gen: GenSlug): SpriteSetId =>
  gameSet(gen, SPRITE_GAMES[gen].opensOn);

/** The game's name as printed on its box; empty for the artwork. */
export const spriteGameName = (set: SpriteSetId): string => {
  const picked = setGame(set);
  return picked ? gameName(picked.game) : "";
};

/** The sheet a set names in this Pokémon's payload, or null for the artwork or a sheet it is not on. */
export const sheetOf = (pokemon: Pokemon, set: SpriteSetId): SpriteSheet | null => {
  const picked = setGame(set);
  if (!picked) return null;
  return (
    pokemon.sprites.versions?.[genApiName(picked.gen)]?.[picked.game] ?? null
  );
};
