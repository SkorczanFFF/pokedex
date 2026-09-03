/**
 * What every call to PokéAPI shares: where it lives, and the one failure worth
 * telling apart from the rest.
 */
export const API_URL = "https://pokeapi.co/api/v2";

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
