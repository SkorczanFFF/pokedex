/** Pulls the numeric id out of any PokéAPI resource URL: `.../pokemon-species/25/` -> `25`. */
export const resourceIdFromUrl = (url: string): number => {
  const match = url.match(/\/(\d+)\/?$/);
  return match ? Number(match[1]) : 0;
};

/**
 * Official artwork is served straight from the sprite repo, keyed by national
 * dex id — and a species id is that same number. So endpoints that hand back
 * nothing but a species URL (evolution chains) can still show art without
 * spending a request per entry on `/pokemon/{name}`.
 */
export const officialArtwork = (id: number): string =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
