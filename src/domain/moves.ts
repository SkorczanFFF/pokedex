import type { Move, MovePastValues, Pokemon } from "@/types/pokemon";
import { genOrder } from "./dex";
import type { DexEra } from "./era";
import { generationOfVersionGroup, versionGroupRank } from "./games";

export interface LearnedMove {
  name: string;
  /** Zero for anything not learned by levelling up. */
  level: number;
}

export interface MoveGroup {
  /** PokéAPI's slug: `level-up`, `machine`, `egg`, `tutor`. */
  method: string;
  moves: LearnedMove[];
}

export interface Learnset {
  /** The game these came from, or null when the era has none. */
  game: string | null;
  groups: MoveGroup[];
}

/** Levelling first: that is the list the games' own Pokédex puts on screen. */
const METHOD_ORDER = ["level-up", "egg", "machine", "tutor"];

const methodRank = (method: string): number => {
  const at = METHOD_ORDER.indexOf(method);
  return at === -1 ? METHOD_ORDER.length : at;
};

/**
 * What a Pokémon learns, as one game taught it.
 *
 * A learnset is per game, and the same Pokémon can learn a move at level 12 in
 * one and 15 in the next, so listing every version group at once would produce
 * a table that contradicts itself. This picks the newest game inside the era
 * that the Pokémon appears in at all — Crystal for retro, and for the modern
 * dex the latest game to include it, which is not always the latest game.
 *
 * It costs nothing: `/pokemon` already carries the level and the method for
 * every move, and only the move's own type and power would need fetching.
 */
export const learnsetInEra = (pokemon: Pokemon, era: DexEra): Learnset => {
  const cap = genOrder(era.maxGen);

  /** Every game inside the era this Pokémon appears in, and how it teaches. */
  const candidates = new Map<string, { rank: number; byLevel: boolean }>();

  for (const entry of pokemon.moves ?? []) {
    for (const detail of entry.version_group_details) {
      const group = detail.version_group.name;
      const generation = generationOfVersionGroup(group);
      const rank = versionGroupRank(group);
      if (generation === null || rank === null) continue;
      if (genOrder(generation) > cap) continue;

      const seen = candidates.get(group) ?? { rank, byLevel: false };
      seen.byLevel ||= detail.move_learn_method.name === "level-up";
      candidates.set(group, seen);
    }
  }

  const newest = (games: [string, { rank: number }][]) =>
    games.reduce<string | null>(
      (best, [name, meta]) =>
        best === null || meta.rank > candidates.get(best)!.rank ? name : best,
      null
    );

  const all = [...candidates.entries()];
  // Preferring a game that teaches by levelling is what keeps the section off
  // the odd release that does something else entirely: Pokémon Champions is the
  // newest thing Typhlosion appears in and its 63 entries are all `train`, with
  // no levels at all. Falling back to the newest anything keeps a Pokémon that
  // only ever appeared in such a game from showing nothing.
  const game = newest(all.filter(([, meta]) => meta.byLevel)) ?? newest(all);

  if (game === null) return { game: null, groups: [] };

  const byMethod = new Map<string, LearnedMove[]>();
  for (const entry of pokemon.moves ?? []) {
    for (const detail of entry.version_group_details) {
      if (detail.version_group.name !== game) continue;

      const method = detail.move_learn_method.name;
      const moves = byMethod.get(method) ?? [];
      // A move can appear twice under one method: Typhlosion knows Ember at
      // level 1 on evolving and learns it again at 12. Both are real rows.
      moves.push({ name: entry.move.name, level: detail.level_learned_at });
      byMethod.set(method, moves);
    }
  }

  const groups = [...byMethod.entries()]
    .map(([method, moves]) => ({
      method,
      moves: [...moves].sort(
        (a, b) => a.level - b.level || a.name.localeCompare(b.name)
      ),
    }))
    .sort((a, b) => methodRank(a.method) - methodRank(b.method));

  return { game, groups };
};

export interface MoveInGame {
  type: string;
  damageClass: string;
  power: number | null;
  accuracy: number | null;
  pp: number | null;
  /** The game's own words, and whether they had to fall back to another game. */
  text: string;
  textFromGame: string | null;
}

/**
 * A move as one game had it.
 *
 * `past_values` entries hold what stood *through* the version group they name,
 * so the earliest entry that still reaches this game is the one that applies,
 * and its null fields mean "unchanged" rather than "unknown". Reading Crystal,
 * Thunderbolt is back to 95 power; reading Scarlet and Violet it is 90 again.
 */
export const moveInGame = (
  move: Move,
  game: string,
  locale: string
): MoveInGame => {
  const played = versionGroupRank(game);

  let applies: MovePastValues | null = null;
  for (const past of move.past_values) {
    const rank = versionGroupRank(past.version_group.name);
    if (rank === null || played === null || rank < played) continue;
    if (applies === null || rank < versionGroupRank(applies.version_group.name)!) {
      applies = past;
    }
  }

  // English is the fallback everywhere in PokéAPI, and the only language every
  // move's text is written in.
  const spoken = move.flavor_text_entries.filter(
    (entry) => entry.language.name === locale
  );
  const entries = spoken.length > 0 ? spoken : move.flavor_text_entries.filter(
    (entry) => entry.language.name === "en"
  );

  const exact = entries.find((entry) => entry.version_group.name === game);
  const nearest = entries.reduce<(typeof entries)[number] | null>(
    (best, entry) => {
      const rank = versionGroupRank(entry.version_group.name);
      if (rank === null || played === null || rank > played) return best;
      const bestRank = best ? versionGroupRank(best.version_group.name) ?? -1 : -1;
      return rank > bestRank ? entry : best;
    },
    null
  );
  const chosen = exact ?? nearest ?? entries[0] ?? null;

  return {
    type: applies?.type?.name ?? move.type.name,
    damageClass: move.damage_class.name,
    power: applies?.power ?? move.power,
    accuracy: applies?.accuracy ?? move.accuracy,
    pp: applies?.pp ?? move.pp,
    text: chosen?.flavor_text.replace(/[\f\n\r\u00ad]/g, " ").trim() ?? "",
    textFromGame: chosen?.version_group.name ?? null,
  };
};
