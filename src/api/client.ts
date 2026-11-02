const API_URL = "https://pokeapi.co/api/v2";

/**
 * The API answered and the resource genuinely is not there — as opposed to a
 * transport or server failure, which is worth retrying. Callers use the
 * distinction to show a 404 rather than an error, and to stop React Query
 * retrying an answer that will not change.
 */
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

// PokéAPI's names: lower case, digits, hyphens (Z-moves double them: "acid-downpour--physical").
const SLUG = /^[a-z0-9-]+$/;

const slug = (value: string | number): string => {
  const name = String(value);
  if (!SLUG.test(name)) throw new NotFoundError(`No resource named ${name}`);
  return name;
};

/** A path built only from PokéAPI names and ids; any other value is not found, without a request. */
export const apiPath = (strings: TemplateStringsArray, ...values: (string | number)[]): string =>
  String.raw(strings, ...values.map(slug));

/**
 * The raw response, for the two callers that have to tell one failure from
 * another: a Pokémon missing under its own name is retried as a species, and a
 * species that is missing is an answer rather than a failure.
 */
export const request = (path: string) => fetch(`${API_URL}/${path}`);

/**
 * One GET, for every caller that treats any failure the same way. `failure`
 * names what was being fetched rather than what HTTP said, because that is the
 * message React Query ends up surfacing.
 */
export const get = async <T>(path: string, failure: string): Promise<T> => {
  const response = await request(path);
  if (!response.ok) {
    throw new Error(failure);
  }
  return response.json() as Promise<T>;
};
