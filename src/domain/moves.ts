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

/** Everywhere a move's source is allowed to speak in colour. */
export interface MethodAccent {
  /** The bright shade: the square beside a heading, and the row that is open. */
  fill: string;
  /** The bright shade thinned, under the pointer. */
  hover: string;
  /** The bright shade thinner still, behind an opened move. */
  panel: string;
  /** The bright shade as a border: the bar down an opened move's edge, and
   *  the rule down the side of the sentence its game printed. */
  bar: string;
  /** The dark shade, and the only place it appears. */
  label: string;
}

/**
 * The colour a move's source carries, in the list and in the panel alike.
 *
 * Five open panels were five identical boxes and five picked rows five
 * identical blue bars, so neither column said which section a move came from.
 * A source now owns a colour and spends it in both: the square beside its
 * heading, the wash a row takes under the pointer, the fill it takes once it is
 * open, and — across the gutter — the bar and wash of the panel that row
 * opened.
 *
 * They are the machine's own colours. Gold, Silver and Crystal ran on a Game
 * Boy Color, which mixes five bits to a channel — thirty-two steps, not two
 * hundred and fifty-six — so every value below lands on that grid, written here
 * with the RGB555 triple it came from. And a Gen II Pokémon is drawn from four
 * colours of which two are black and white, leaving each one exactly two of its
 * own. Each source is dressed the same way, and the two split by job rather
 * than by place: the bright one is every graphic — the square, the open row,
 * the bar, both washes — and the dark one is text and nothing else.
 *
 * Text is the whole reason the dark one exists. Ten pixels of #29CE21 on a
 * wash of itself is 1.9:1 and unreadable; the dark shade is 6.8:1. A bar has no
 * such floor — what it says is said in words on the line below it — so it takes
 * the bright shade and eight pixels of width to carry the weight the dark one
 * was carrying.
 *
 * The brights are bright enough to want black on them — what the yellow buttons
 * and the Electric badge already ask for — so every open row reads alike.
 * Level-up takes the blue the app already spends on a measured number, lit up;
 * the machines take the orange furthest from it, being the largest group by far
 * — ninety rows for Mewtwo in Scarlet and Violet — and so the one a level-up
 * move is most often held against.
 *
 * Never a filled chip inside a panel: that is what a *type* looks like two
 * lines below, and a second one would be read as another type. The words stay
 * too — colour is the fast channel and the label the reliable one, so nothing
 * here is told by colour alone.
 */
const METHOD_ACCENTS: Record<string, MethodAccent> = {
  // RGB 6, 18, 31 over RGB 2, 9, 22
  "level-up": {
    fill: "bg-[#3194FF]",
    hover: "hover:bg-[#3194FF]/20",
    panel: "bg-[#3194FF]/12",
    bar: "border-[#3194FF]",
    label: "text-[#104AB5]",
  },
  // RGB 5, 25, 4 over RGB 2, 12, 2
  egg: {
    fill: "bg-[#29CE21]",
    hover: "hover:bg-[#29CE21]/20",
    panel: "bg-[#29CE21]/12",
    bar: "border-[#29CE21]",
    label: "text-[#106310]",
  },
  // RGB 31, 12, 0 over RGB 19, 6, 0
  machine: {
    fill: "bg-[#FF6300]",
    hover: "hover:bg-[#FF6300]/20",
    panel: "bg-[#FF6300]/12",
    bar: "border-[#FF6300]",
    label: "text-[#9C3100]",
  },
  // RGB 22, 8, 31 over RGB 13, 0, 20
  tutor: {
    fill: "bg-[#B542FF]",
    hover: "hover:bg-[#B542FF]/20",
    panel: "bg-[#B542FF]/12",
    bar: "border-[#B542FF]",
    label: "text-[#6B00A5]",
  },
};

/**
 * The four are the ones the era's games use. PokéAPI carries a dozen more —
 * `train` for Pokémon Champions, the Stadium and XD oddities — and those keep
 * grey rather than borrow a colour whose meaning the headings do not teach.
 */
const NO_ACCENT: MethodAccent = {
  fill: "bg-gray-400",
  hover: "hover:bg-gray-100",
  panel: "bg-gray-50",
  bar: "border-gray-400",
  label: "text-gray-500",
};

export const moveMethodAccent = (method: string): MethodAccent =>
  METHOD_ACCENTS[method] ?? NO_ACCENT;

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
  /** The language those words are in, which is not always the one asked for. */
  textLanguage: string;
}

/**
 * Flavour text for a language PokéAPI does not carry, one sentence per run of
 * games.
 *
 * Shaped the way the source prints it — `[["gold-silver", "crystal"], "…"]` —
 * because a run of games sharing one sentence is the source's own unit, and
 * flattening it would store that sentence once per game.
 */
export type TranslatedMoveText = readonly (readonly [
  readonly string[],
  string,
])[];

/** A sentence and the version group that printed it. */
interface Printed {
  text: string;
  game: string;
}

/**
 * The sentence the named game printed, or the nearest one before it.
 *
 * A move's wording is rewritten every few generations and not every game gets
 * its own entry, so reading Crystal falls back to Gold and Silver rather than
 * to whatever the newest game happens to say.
 */
const printedIn = (entries: Printed[], game: string): Printed | null => {
  const played = versionGroupRank(game);
  const exact = entries.find((entry) => entry.game === game);
  if (exact) return exact;

  const nearest = entries.reduce<Printed | null>((best, entry) => {
    const rank = versionGroupRank(entry.game);
    if (rank === null || played === null || rank > played) return best;
    const bestRank = best ? (versionGroupRank(best.game) ?? -1) : -1;
    return rank > bestRank ? entry : best;
  }, null);

  return nearest ?? entries[0] ?? null;
};

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
  locale: string,
  translated: TranslatedMoveText | null = null
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

  const spokenIn = (language: string): Printed[] =>
    move.flavor_text_entries
      .filter((entry) => entry.language.name === language)
      .map((entry) => ({
        text: entry.flavor_text.replace(/[\f\n\r\u00ad]/g, " ").trim(),
        game: entry.version_group.name,
      }));

  // PokéAPI writes a move's sentence in fourteen languages; `translated`
  // carries one it does not. English is the last resort either way, and the
  // only language every move is written in.
  const own = printedIn(
    translated
      ? translated.flatMap(([games, text]) =>
          games.map((printedBy) => ({ text, game: printedBy }))
        )
      : spokenIn(locale),
    game
  );
  const chosen = own ?? printedIn(spokenIn("en"), game);

  return {
    type: applies?.type?.name ?? move.type.name,
    damageClass: move.damage_class.name,
    power: applies?.power ?? move.power,
    accuracy: applies?.accuracy ?? move.accuracy,
    pp: applies?.pp ?? move.pp,
    text: chosen?.text ?? "",
    textFromGame: chosen?.game ?? null,
    textLanguage: own ? locale : "en",
  };
};
