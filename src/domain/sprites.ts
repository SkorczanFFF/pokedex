import type { Pokemon } from "@/types/pokemon";
import { genApiName } from "./dex";
import { ALL_SPRITE_SETS, setGame, sheetOf, type SpriteSetId } from "./spriteSets";

// Where a Pokémon's pictures are: in its payload, and in the sprite repository
// by dex id for the places that never fetched a payload.

/** Everything the sprite repo serves hangs off one root. */
const SPRITE_ROOT =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";

/**
 * Official artwork is served straight from the sprite repo, keyed by national
 * dex id — and a species id is that same number. So endpoints that hand back
 * nothing but a species URL (evolution chains) can still show art without
 * spending a request per entry on `/pokemon/{name}`.
 */
const officialArtwork = (id: number): string =>
  `${SPRITE_ROOT}/other/official-artwork/${id}.png`;

/** The same trick for a game's sprites, which sit under `generation-ii/crystal`. */
const gameSprite = (id: number, path: string): string =>
  `${SPRITE_ROOT}/versions/${path}/${id}.png`;

/** Crystal's front sprites in motion: 56px GIFs on white, Gen I and II only. */
export const crystalAnimated = (id: number): string =>
  `${SPRITE_ROOT}/versions/generation-ii/crystal/animated/${id}.gif`;

/**
 * URL for one picture of a set, or null when this Pokémon has none there.
 * `key` is PokéAPI's own — `front_default`, `front_shiny_transparent` — and
 * the artwork has only the one.
 */
export const spriteUrl = (
  pokemon: Pokemon,
  set: SpriteSetId,
  key = "front_default",
): string | null => {
  if (set === "artwork") {
    return (
      pokemon.sprites.other["official-artwork"].front_default ||
      pokemon.sprites.front_default ||
      null
    );
  }
  const url = sheetOf(pokemon, set)?.[key];
  return typeof url === "string" ? url : null;
};

/**
 * The same picture addressed by dex id, for the places that never fetched a
 * payload to ask: an evolution chain hands back species URLs and nothing else.
 *
 * Unlike `spriteUrl` this cannot tell a sprite that exists from one that does
 * not, so it is only safe where the era already bounds the ids — retro stops at
 * 251, and all 251 have a Crystal sprite.
 */
export const spriteUrlById = (id: number, set: SpriteSetId): string => {
  const picked = setGame(set);
  return picked
    ? gameSprite(id, `${genApiName(picked.gen)}/${picked.game}`)
    : officialArtwork(id);
};

/**
 * The sets this Pokémon actually has, artwork first and then in dex order.
 *
 * Costs nothing: the sprite tree rides along in the /pokemon response we already
 * fetched, so a Pokémon's whole visual history is one render away rather than
 * one request per generation.
 */
export const spriteSets = (pokemon: Pokemon): SpriteSetId[] =>
  ALL_SPRITE_SETS.filter((set) => spriteUrl(pokemon, set) !== null);

/**
 * The set actually up: the reader's pick while this Pokémon has it, else the
 * era's opening shot, else the first set there is. Following an evolution link
 * to a Pokémon with no Gen I sprite falls back rather than showing a gap.
 */
export const activeSpriteSet = (
  pokemon: Pokemon,
  era: { sprites: SpriteSetId },
  picked: SpriteSetId | null,
): SpriteSetId => {
  const sets = spriteSets(pokemon);
  const chosen = picked ?? era.sprites;
  return sets.includes(chosen) ? chosen : (sets[0] ?? "artwork");
};
