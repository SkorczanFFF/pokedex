import type { EncounterDetail, LocationEncounter } from "@/types/pokemon";
import { genOrder } from "./dex";
import type { DexEra } from "./era";
import { generationOfVersion, versionRank } from "./games";

/** One way of meeting a Pokémon, and every game that words it the same way. */
export interface EncounterRow {
  /** Games this row holds for, oldest first. */
  games: string[];
  method: string;
  minLevel: number;
  maxLevel: number;
  /** Slot rates added up inside one set of conditions — the only sum that means anything. */
  chance: number;
  /** Sets of conditions the numbers hold under, any one of them; empty for "always". */
  conditions: string[][];
}

export interface EncounterPlace {
  /** The location-area slug: the key, and what the label is derived from. */
  area: string;
  rows: EncounterRow[];
}

/** Regions PokéAPI writes into the front of an area slug. */
const REGIONS = [
  "kanto",
  "johto",
  "hoenn",
  "sinnoh",
  "unova",
  "kalos",
  "alola",
  "galar",
  "hisui",
  "paldea",
];

/**
 * An area slug split into the region it opens with and the rest of itself:
 * `kanto-route-2-south-towards-viridian-city` is Kanto and
 * `route-2-south-towards-viridian-city`, `viridian-forest-area` is nowhere in
 * particular and `viridian-forest`.
 *
 * The readable name does exist in the API — `/location-area/{slug}` spells it
 * "Road 2 (south, towards Viridian City)" — but it is one request per area, and
 * Magikarp is found in seventy-four of them in the Gen II games alone. The slug
 * it is, then, humanized like every other label in the app.
 */
export const splitArea = (area: string): { region: string | null; rest: string } => {
  const region = REGIONS.find((name) => area.startsWith(`${name}-`)) ?? null;
  const rest = (region ? area.slice(region.length + 1) : area).replace(
    /-area$/,
    ""
  );
  return { region, rest };
};

/**
 * Slots collapsed into the lines a player would recognise.
 *
 * Two passes, and both are needed. The first adds up slots that share a method
 * and a condition: the same Zubat occupies three of them in Dark Cave at 30,
 * 5 and 4 percent, and what a player meets is one Zubat 39% of the time. The
 * second merges lines that came out identical, keeping their conditions as
 * alternatives — Gold offers Pikachu at the same rate by morning, by day and by
 * night, which is one line with three conditions rather than three lines.
 *
 * What never happens here is touching `max_chance`. It is the sum across
 * conditions that exclude one another and reads 132% for that same Zubat.
 */
const rowsOf = (details: EncounterDetail[]): Omit<EncounterRow, "games">[] => {
  const slots = new Map<
    string,
    { method: string; min: number; max: number; chance: number; conditions: string[] }
  >();

  for (const detail of details) {
    const conditions = detail.condition_values
      .map((condition) => condition.name)
      .sort();
    const key = `${detail.method.name}|${conditions.join(",")}`;
    const seen = slots.get(key);

    if (seen) {
      seen.chance += detail.chance;
      seen.min = Math.min(seen.min, detail.min_level);
      seen.max = Math.max(seen.max, detail.max_level);
    } else {
      slots.set(key, {
        method: detail.method.name,
        min: detail.min_level,
        max: detail.max_level,
        chance: detail.chance,
        conditions,
      });
    }
  }

  const rows = new Map<string, Omit<EncounterRow, "games">>();
  for (const slot of slots.values()) {
    const key = `${slot.method}|${slot.min}|${slot.max}|${slot.chance}`;
    const seen = rows.get(key);

    if (seen) {
      if (slot.conditions.length > 0) seen.conditions.push(slot.conditions);
    } else {
      rows.set(key, {
        method: slot.method,
        minLevel: slot.min,
        maxLevel: slot.max,
        chance: slot.chance,
        conditions: slot.conditions.length > 0 ? [slot.conditions] : [],
      });
    }
  }

  return [...rows.values()];
};

const rank = (version: string): number => versionRank(version) ?? Number.MAX_SAFE_INTEGER;

/**
 * Whether the era has anywhere at all to show — the question the link on the
 * details page asks, and the reason it is not `placesInEra(...).length > 0`:
 * this one stops at the first game it recognises instead of folding a thousand
 * slots for Magikarp to answer yes.
 */
export const hasPlacesInEra = (
  encounters: LocationEncounter[],
  era: DexEra
): boolean => {
  const cap = genOrder(era.maxGen);

  return encounters.some((place) =>
    place.version_details.some((detail) => {
      const generation = generationOfVersion(detail.version.name);
      return generation !== null && genOrder(generation) <= cap;
    })
  );
};

/** The games inside the era this Pokémon is met in at all, oldest first. */
export const gamesInEra = (
  encounters: LocationEncounter[],
  era: DexEra
): string[] => {
  const cap = genOrder(era.maxGen);
  const games = new Set<string>();

  for (const place of encounters) {
    for (const detail of place.version_details) {
      const generation = generationOfVersion(detail.version.name);
      if (generation === null || genOrder(generation) > cap) continue;
      games.add(detail.version.name);
    }
  }

  return [...games].sort((a, b) => rank(a) - rank(b));
};

/**
 * Where the era says this Pokémon is, area by area, in the order PokéAPI lists
 * them — which runs with the map rather than alphabetically, so Route 29 comes
 * before Route 30 and Kanto after Johto.
 *
 * `game` narrows it to one title; leaving it null answers for the whole era,
 * with each line naming the games it belongs to.
 */
export const placesInEra = (
  encounters: LocationEncounter[],
  era: DexEra,
  game: string | null = null
): EncounterPlace[] => {
  const cap = genOrder(era.maxGen);
  const places: EncounterPlace[] = [];

  for (const place of encounters) {
    const rows = new Map<string, EncounterRow>();

    for (const detail of place.version_details) {
      const version = detail.version.name;
      if (game !== null && version !== game) continue;

      const generation = generationOfVersion(version);
      if (generation === null || genOrder(generation) > cap) continue;

      for (const row of rowsOf(detail.encounter_details)) {
        const key = `${row.method}|${row.minLevel}|${row.maxLevel}|${row.chance}|${row.conditions
          .map((set) => set.join(","))
          .sort()
          .join(";")}`;
        const seen = rows.get(key);
        if (seen) seen.games.push(version);
        else rows.set(key, { ...row, games: [version] });
      }
    }

    if (rows.size === 0) continue;

    const list = [...rows.values()];
    for (const row of list) row.games.sort((a, b) => rank(a) - rank(b));
    // Oldest game first, and inside one game the likeliest meeting first.
    list.sort(
      (a, b) => rank(a.games[0]) - rank(b.games[0]) || b.chance - a.chance
    );

    places.push({ area: place.location_area.name, rows: list });
  }

  // Oldest game first, so the answer opens where the Pokémon was first found
  // rather than wherever PokéAPI happens to list it — Magikarp's own order
  // starts in Sinnoh. Within one game the API's order is the map's, so a stable
  // sort is what keeps Route 29 ahead of Route 30.
  return places.sort(
    (a, b) => rank(a.rows[0].games[0]) - rank(b.rows[0].games[0])
  );
};
