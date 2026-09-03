/**
 * Narrows the first list to entries present in every other list, matched by
 * name. The first list fixes the result order, so the API's own ordering wins.
 *
 * Used to combine type filters with each other and with the generation filter,
 * all of which arrive as separate PokéAPI name lists.
 */
export const intersectByName = <T extends { name: string }>(
  lists: readonly (readonly T[])[]
): T[] => {
  const [base, ...rest] = lists;
  if (!base) return [];
  if (rest.length === 0) return [...base];

  const others = rest.map((list) => new Set(list.map((entry) => entry.name)));
  return base.filter((entry) => others.every((set) => set.has(entry.name)));
};
