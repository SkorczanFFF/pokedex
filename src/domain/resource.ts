/** Pulls the numeric id out of any PokéAPI resource URL: `.../pokemon-species/25/` -> `25`. */
export const resourceIdFromUrl = (url: string): number => {
  const match = url.match(/\/(\d+)\/?$/);
  return match ? Number(match[1]) : 0;
};
