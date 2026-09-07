/** Pulls the numeric id out of any PokéAPI resource URL: `.../pokemon-species/25/` -> `25`. */
export const resourceIdFromUrl = (url: string): number => {
  const match = url.match(/\/(\d+)\/?$/);
  return match ? Number(match[1]) : 0;
};

/** Everything the sprite repo serves hangs off one root. */
const SPRITE_ROOT =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";

/**
 * Official artwork is served straight from the sprite repo, keyed by national
 * dex id — and a species id is that same number. So endpoints that hand back
 * nothing but a species URL (evolution chains) can still show art without
 * spending a request per entry on `/pokemon/{name}`.
 */
export const officialArtwork = (id: number): string =>
  `${SPRITE_ROOT}/other/official-artwork/${id}.png`;

/** The same trick for a game's sprites, which sit under `generation-ii/crystal`. */
export const gameSprite = (id: number, path: string): string =>
  `${SPRITE_ROOT}/versions/${path}/${id}.png`;
