import { describe, expect, it } from "vitest";
import type { EncounterDetail, LocationEncounter } from "@/types/pokemon";
import { gamesInEra, hasPlacesInEra, placesInEra, splitArea } from "./encounters";
import { MODERN, RETRO } from "./era";

const slot = (partial: Partial<EncounterDetail> = {}): EncounterDetail => ({
  min_level: 2,
  max_level: 4,
  chance: 10,
  method: { name: "walk" },
  condition_values: [],
  ...partial,
});

const inGame = (
  version: string,
  encounter_details: EncounterDetail[],
): LocationEncounter["version_details"][number] => ({
  version: { name: version },
  // The sum across conditions that exclude each other, which nothing may read.
  max_chance: 999,
  encounter_details,
});

const place = (area: string, ...version_details: LocationEncounter["version_details"]): LocationEncounter => ({
  location_area: { name: area },
  version_details,
});

/** Zubat in Dark Cave in Crystal: three slots, one Zubat 39% of the time. */
const darkCave = place(
  "dark-cave-violet-entrance",
  inGame("crystal", [slot({ chance: 30 }), slot({ chance: 5, max_level: 5 }), slot({ chance: 4 })]),
);

/** Pikachu on Route 2 in Gold: the same rate by morning, by day and by night. */
const routeTwo = place(
  "kanto-route-2-south-towards-viridian-city",
  inGame("gold", [
    slot({ condition_values: [{ name: "time-morning" }] }),
    slot({ condition_values: [{ name: "time-day" }] }),
    slot({ condition_values: [{ name: "time-night" }] }),
  ]),
);

describe("placesInEra", () => {
  it("adds up slots that share a method and a condition", () => {
    expect(placesInEra([darkCave], RETRO)).toEqual([
      {
        area: "dark-cave-violet-entrance",
        rows: [{ games: ["crystal"], method: "walk", minLevel: 2, maxLevel: 5, chance: 39, conditions: [] }],
      },
    ]);
  });

  it("keeps conditions that lead to the same line as alternatives", () => {
    expect(placesInEra([routeTwo], RETRO)[0].rows).toEqual([
      {
        games: ["gold"],
        method: "walk",
        minLevel: 2,
        maxLevel: 4,
        chance: 10,
        conditions: [["time-morning"], ["time-day"], ["time-night"]],
      },
    ]);
  });

  it("folds identical lines across games and lists the games oldest first", () => {
    const route = place("route-1", inGame("blue", [slot()]), inGame("red", [slot()]));
    expect(placesInEra([route], RETRO)[0].rows[0].games).toEqual(["red", "blue"]);
  });

  it("opens where the Pokémon was first found, and the likeliest line first", () => {
    const johto = place("johto-route-29", inGame("gold", [slot({ chance: 5 }), slot({ chance: 40, method: { name: "surf" } })]));
    const kanto = place("kanto-route-1", inGame("red", [slot()]));
    const places = placesInEra([johto, kanto], RETRO);
    expect(places.map((entry) => entry.area)).toEqual(["kanto-route-1", "johto-route-29"]);
    expect(places[1].rows.map((row) => row.chance)).toEqual([40, 5]);
  });

  it("narrows to one game, and to the era", () => {
    const both = place("cave", inGame("red", [slot()]), inGame("sword", [slot({ chance: 50 })]));
    expect(placesInEra([both], RETRO)[0].rows).toHaveLength(1);
    expect(placesInEra([both], MODERN)[0].rows).toHaveLength(2);
    expect(placesInEra([both], MODERN, "sword")[0].rows[0].chance).toBe(50);
    expect(placesInEra([both], RETRO, "sword")).toEqual([]);
  });
});

describe("gamesInEra and hasPlacesInEra", () => {
  const everywhere = [
    place("a", inGame("crystal", [slot()]), inGame("red", [slot()])),
    place("b", inGame("gold", [slot()]), inGame("sword", [slot()])),
  ];

  it("lists the era's games in the order they came out", () => {
    expect(gamesInEra(everywhere, RETRO)).toEqual(["red", "gold", "crystal"]);
    expect(gamesInEra(everywhere, MODERN)).toEqual(["red", "gold", "crystal", "sword"]);
  });

  it("says whether the era has anywhere at all", () => {
    expect(hasPlacesInEra(everywhere, RETRO)).toBe(true);
    expect(hasPlacesInEra([place("galar", inGame("sword", [slot()]))], RETRO)).toBe(false);
    expect(hasPlacesInEra([], MODERN)).toBe(false);
  });
});

describe("splitArea", () => {
  it("peels the region off the front and the -area suffix off the end", () => {
    expect(splitArea("kanto-route-2-south-towards-viridian-city")).toEqual({
      region: "kanto",
      rest: "route-2-south-towards-viridian-city",
    });
    expect(splitArea("viridian-forest-area")).toEqual({ region: null, rest: "viridian-forest" });
    expect(splitArea("johto-dark-cave-area")).toEqual({ region: "johto", rest: "dark-cave" });
  });
});
