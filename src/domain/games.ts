import { GEN_SLUGS, type GenSlug } from "./dex";

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
