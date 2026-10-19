import { GEN_SLUGS, type GenSlug } from "./dex";
import { humanize } from "./text";

/**
 * Which generation each game belongs to.
 *
 * Read out of PokéAPI's `/version-group` listing rather than written from
 * memory, and kept here because the alternative is one request per version just
 * to date a line of flavour text.
 *
 * Ids cannot stand in for this table. They look chronological and are not:
 * Colosseum and XD are Gen III but numbered after Gen V, and the Japanese Gen I
 * releases are numbered after Gen VII.
 */
const VERSIONS_BY_GEN: Record<GenSlug, readonly string[]> = {
  i: ["red", "blue", "yellow", "red-japan", "green-japan", "blue-japan"],
  ii: ["gold", "silver", "crystal"],
  iii: [
    "ruby",
    "sapphire",
    "emerald",
    "firered",
    "leafgreen",
    "colosseum",
    "xd",
  ],
  iv: ["diamond", "pearl", "platinum", "heartgold", "soulsilver"],
  v: ["black", "white", "black-2", "white-2"],
  vi: ["x", "y", "omega-ruby", "alpha-sapphire"],
  vii: [
    "sun",
    "moon",
    "ultra-sun",
    "ultra-moon",
    "lets-go-pikachu",
    "lets-go-eevee",
  ],
  viii: [
    "sword",
    "shield",
    "the-isle-of-armor-sword",
    "the-isle-of-armor-shield",
    "the-crown-tundra-sword",
    "the-crown-tundra-shield",
    "brilliant-diamond",
    "shining-pearl",
    "legends-arceus",
  ],
  ix: [
    "scarlet",
    "violet",
    "the-teal-mask-scarlet",
    "the-teal-mask-violet",
    "the-indigo-disk-scarlet",
    "the-indigo-disk-violet",
    "legends-za",
    "mega-dimension",
    "champions",
  ],
};

const GEN_OF_VERSION = new Map<string, GenSlug>(
  GEN_SLUGS.flatMap((gen) =>
    VERSIONS_BY_GEN[gen].map((version) => [version, gen] as const)
  )
);

/** The generation a game belongs to, or null for one this table does not know. */
export const generationOfVersion = (version: string): GenSlug | null =>
  GEN_OF_VERSION.get(version) ?? null;

/**
 * The same, for version groups. Evolution details are keyed by group rather
 * than by version, and a group's name is not derivable from its versions —
 * "lets-go-pikachu-lets-go-eevee" is one group, "red" and "blue" are one other.
 */
const GROUPS_BY_GEN: Record<GenSlug, readonly string[]> = {
  i: ["red-blue", "yellow", "red-green-japan", "blue-japan"],
  ii: ["gold-silver", "crystal"],
  iii: [
    "ruby-sapphire",
    "emerald",
    "firered-leafgreen",
    "colosseum",
    "xd",
  ],
  iv: ["diamond-pearl", "platinum", "heartgold-soulsilver"],
  v: ["black-white", "black-2-white-2"],
  vi: ["x-y", "omega-ruby-alpha-sapphire"],
  vii: [
    "sun-moon",
    "ultra-sun-ultra-moon",
    "lets-go-pikachu-lets-go-eevee",
  ],
  viii: [
    "sword-shield",
    "the-isle-of-armor",
    "the-crown-tundra",
    "brilliant-diamond-shining-pearl",
    "legends-arceus",
  ],
  ix: [
    "scarlet-violet",
    "the-teal-mask",
    "the-indigo-disk",
    "legends-za",
    "mega-dimension",
    "champions",
  ],
};

const GEN_OF_GROUP = new Map<string, GenSlug>(
  GEN_SLUGS.flatMap((gen) =>
    GROUPS_BY_GEN[gen].map((group) => [group, gen] as const)
  )
);

/** The generation a version group belongs to, or null for one we do not know. */
export const generationOfVersionGroup = (group: string): GenSlug | null =>
  GEN_OF_GROUP.get(group) ?? null;

/**
 * Where a version group sits in the run of games, counting from Red and Blue.
 * The generation alone cannot order Gold/Silver against Crystal, and a learnset
 * has to name one game rather than a pair of them.
 */
const GROUP_RANK = new Map<string, number>(
  GEN_SLUGS.flatMap((gen) => GROUPS_BY_GEN[gen]).map(
    (group, index) => [group, index] as const
  )
);

export const versionGroupRank = (group: string): number | null =>
  GROUP_RANK.get(group) ?? null;

/**
 * Where a single game sits in the run of them, so Red comes before Gold and
 * Gold before Crystal. Encounters are keyed by version rather than by group.
 */
const VERSION_RANK = new Map<string, number>(
  GEN_SLUGS.flatMap((gen) => VERSIONS_BY_GEN[gen]).map(
    (version, index) => [version, index] as const
  )
);

export const versionRank = (version: string): number | null =>
  VERSION_RANK.get(version) ?? null;

/** Every game and every version group this file knows, for the names table to be checked against. */
export const KNOWN_GAMES: readonly string[] = [
  ...new Set(GEN_SLUGS.flatMap((gen) => [...VERSIONS_BY_GEN[gen], ...GROUPS_BY_GEN[gen]])),
];

/**
 * The games' names as printed on their boxes, the same in every language,
 * keyed by version and by version group alike. A pair reads "Red / Blue"; the
 * Japanese releases are marked rather than spelled out, because "Red Japan"
 * reads like a mistake; a sheet's game on the details page and a learnset's
 * game on the moves list read off the same entry.
 */
const GAME_NAMES: Record<string, string> = {
  red: "Red",
  blue: "Blue",
  yellow: "Yellow",
  "red-japan": "Red (JP)",
  "green-japan": "Green (JP)",
  "blue-japan": "Blue (JP)",
  "red-blue": "Red / Blue",
  "red-green-japan": "Red / Green (JP)",
  gold: "Gold",
  silver: "Silver",
  crystal: "Crystal",
  "gold-silver": "Gold / Silver",
  ruby: "Ruby",
  sapphire: "Sapphire",
  emerald: "Emerald",
  firered: "FireRed",
  leafgreen: "LeafGreen",
  colosseum: "Colosseum",
  xd: "XD",
  "ruby-sapphire": "Ruby / Sapphire",
  "firered-leafgreen": "FireRed / LeafGreen",
  diamond: "Diamond",
  pearl: "Pearl",
  platinum: "Platinum",
  heartgold: "HeartGold",
  soulsilver: "SoulSilver",
  "diamond-pearl": "Diamond / Pearl",
  "heartgold-soulsilver": "HeartGold / SoulSilver",
  black: "Black",
  white: "White",
  "black-2": "Black 2",
  "white-2": "White 2",
  "black-white": "Black / White",
  "black-2-white-2": "Black 2 / White 2",
  x: "X",
  y: "Y",
  "omega-ruby": "Omega Ruby",
  "alpha-sapphire": "Alpha Sapphire",
  "x-y": "X / Y",
  "omega-ruby-alpha-sapphire": "Omega Ruby / Alpha Sapphire",
  sun: "Sun",
  moon: "Moon",
  "ultra-sun": "Ultra Sun",
  "ultra-moon": "Ultra Moon",
  "lets-go-pikachu": "Let's Go, Pikachu!",
  "lets-go-eevee": "Let's Go, Eevee!",
  "sun-moon": "Sun / Moon",
  "ultra-sun-ultra-moon": "Ultra Sun / Ultra Moon",
  "lets-go-pikachu-lets-go-eevee": "Let's Go, Pikachu! / Let's Go, Eevee!",
  sword: "Sword",
  shield: "Shield",
  "the-isle-of-armor-sword": "Sword (The Isle of Armor)",
  "the-isle-of-armor-shield": "Shield (The Isle of Armor)",
  "the-crown-tundra-sword": "Sword (The Crown Tundra)",
  "the-crown-tundra-shield": "Shield (The Crown Tundra)",
  "brilliant-diamond": "Brilliant Diamond",
  "shining-pearl": "Shining Pearl",
  "legends-arceus": "Legends: Arceus",
  "sword-shield": "Sword / Shield",
  "the-isle-of-armor": "The Isle of Armor",
  "the-crown-tundra": "The Crown Tundra",
  "brilliant-diamond-shining-pearl": "Brilliant Diamond / Shining Pearl",
  scarlet: "Scarlet",
  violet: "Violet",
  "the-teal-mask-scarlet": "Scarlet (The Teal Mask)",
  "the-teal-mask-violet": "Violet (The Teal Mask)",
  "the-indigo-disk-scarlet": "Scarlet (The Indigo Disk)",
  "the-indigo-disk-violet": "Violet (The Indigo Disk)",
  "legends-za": "Legends: Z-A",
  "mega-dimension": "Mega Dimension",
  champions: "Champions",
  "scarlet-violet": "Scarlet / Violet",
  "the-teal-mask": "The Teal Mask",
  "the-indigo-disk": "The Indigo Disk",
};

/** A game's name as printed on its box; one this table lacks is read off its slug. */
export const gameName = (slug: string): string => GAME_NAMES[slug] ?? humanize(slug);
