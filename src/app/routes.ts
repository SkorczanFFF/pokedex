// Every address in the app, and the query keys its pages read, named once:
// the router declares `paths`, and every link is built by a function here.

export const paths = {
  list: "/",
  pokemon: "/pokemon/:name",
  /** PokéAPI's own shape for the same question, and a page of its own because the answer runs to dozens of places. */
  encounters: "/pokemon/:name/encounters",
  types: "/types",
  versus: "/versus",
  /** Versus first shipped here; links to it still land, picks and all. */
  formerVersus: "/compare",
  about: "/about",
} as const;

/** The list's query string: the page, its size, the search, and the two filters. */
export const LIST_PARAMS = {
  page: "page",
  perPage: "per",
  query: "q",
  type: "type",
  gen: "gen",
} as const;

/** Versus' query string: each side's Pokémon, ability, move and level. */
export const VERSUS_PARAMS = {
  a: { name: "a", ability: "aa", move: "am", level: "al" },
  b: { name: "b", ability: "ba", move: "bm", level: "bl" },
} as const;

const withQuery = (
  path: string,
  params: Record<string, string | null | undefined>,
): string => {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) query.set(key, value);
  }
  const search = query.toString();
  return search ? `${path}?${search}` : path;
};

export const pokemonPath = (name: string): string =>
  paths.pokemon.replace(":name", name);

export const encountersPath = (name: string): string =>
  paths.encounters.replace(":name", name);

/** The list, narrowed to a type or a generation; bare, the whole dex. */
export const listPath = (
  filters: { type?: string | null; gen?: string | null } = {},
): string =>
  withQuery(paths.list, {
    [LIST_PARAMS.type]: filters.type,
    [LIST_PARAMS.gen]: filters.gen,
  });

/** Versus with either side already picked. */
export const versusPath = (
  sides: { a?: string | null; b?: string | null } = {},
): string =>
  withQuery(paths.versus, {
    [VERSUS_PARAMS.a.name]: sides.a,
    [VERSUS_PARAMS.b.name]: sides.b,
  });
