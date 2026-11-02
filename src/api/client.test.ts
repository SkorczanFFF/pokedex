import { afterEach, describe, expect, it, vi } from "vitest";
import { apiPath, NotFoundError } from "./client";
import { getPokemonDetails } from "./pokemon";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("apiPath", () => {
  it.each(["pikachu", "mr-mime", "25", "acid-downpour--physical"])("takes %s", (name) => {
    expect(apiPath`pokemon/${name}`).toBe(`pokemon/${name}`);
  });

  it("takes numbers", () => {
    expect(apiPath`pokemon?limit=${20}&offset=${40}`).toBe("pokemon?limit=20&offset=40");
  });

  it.each(["..", "%2e%2e", "../type/fire", "pikachu?limit=1", "Pikachu", ""])(
    "finds nothing under %s",
    (name) => {
      expect(() => apiPath`pokemon/${name}`).toThrow(NotFoundError);
    },
  );
});

it("getPokemonDetails rejects a name that cannot be one without a request", async () => {
  const fetch = vi.fn();
  vi.stubGlobal("fetch", fetch);
  await expect(getPokemonDetails("../type/fire")).rejects.toBeInstanceOf(NotFoundError);
  expect(fetch).not.toHaveBeenCalled();
});
