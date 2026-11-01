// The cups of the two N64 Stadiums and what each lets in. Hand-written: PokéAPI knows
// neither game. Read from Bulbapedia, checked against Serebii and WikiDex.

/** The two games, by the digit their address carries. */
export const STADIUM_GAMES = ["1", "2"] as const;
export type StadiumGame = (typeof STADIUM_GAMES)[number];

export const isStadiumGame = (value: string | undefined): value is StadiumGame =>
  STADIUM_GAMES.some((game) => game === value);

/** Pokémon entered, Pokémon sent into each battle, trainers beaten in a row; alike in both games. */
export const STADIUM_TEAM = { entered: 6, battle: 3, trainers: 8 } as const;

/** The classes a four-class cup climbs, easiest first, by their item slugs. */
export const BALLS = ["poke-ball", "great-ball", "ultra-ball", "master-ball"] as const;
type Ball = (typeof BALLS)[number];

export type CupId =
  | "pika"
  | "petit"
  | "poke"
  | "prime"
  | "little"
  | "challenge"
  | "castle"
  | "mewtwo"
  | "rival";

export interface Cup {
  id: CupId;
  /** The levels a Pokémon may enter at, both ends included. */
  levels?: { min: number; max: number };
  /** The most the three sent into one battle may add up to. */
  levelTotal?: number;
  /** One class, or the four from Poké Ball to Master Ball; a castle or a boss has none. */
  classes?: 1 | 4;
  /** The level each class deals its Pokémon at, where the class sets it and not the player. */
  classLevels?: Readonly<Record<Ball, number>>;
  /** Height and weight caps, both included, in PokéAPI's tenths: decimetres and hectograms. */
  size?: { height: number; weight: number };
  /** Species kept out; empty is everyone let in, absent is a cup that takes no entries. */
  banned?: readonly string[];
  bannedMoves?: readonly string[];
  /** How many species pass every rule, where the rules leave a short list. */
  eligible?: number;
  /** The opponents' level, where it is fixed or rises to the player's highest. */
  foes?: { level: number; matchesYours?: boolean };
}

const ANY_LEVEL = { min: 1, max: 100 };

export const STADIUM_CUPS: Record<StadiumGame, readonly Cup[]> = {
  "1": [
    {
      id: "pika",
      levels: { min: 15, max: 20 },
      levelTotal: 50,
      classes: 1,
      banned: ["mewtwo", "mew"],
    },
    {
      id: "petit",
      levels: { min: 25, max: 30 },
      levelTotal: 80,
      classes: 1,
      size: { height: 20, weight: 200 },
      banned: ["mew"],
      eligible: 45,
    },
    {
      id: "poke",
      levels: { min: 50, max: 55 },
      levelTotal: 155,
      classes: 4,
      banned: ["mewtwo", "mew"],
    },
    { id: "prime", levels: ANY_LEVEL, classes: 4, banned: [], foes: { level: 100 } },
    { id: "castle", levels: ANY_LEVEL, banned: [], foes: { level: 50, matchesYours: true } },
    { id: "mewtwo", levels: ANY_LEVEL, banned: [], foes: { level: 100 } },
  ],
  "2": [
    {
      id: "little",
      levels: { min: 5, max: 5 },
      classes: 1,
      bannedMoves: ["dragon-rage", "sonic-boom"],
      eligible: 86,
    },
    {
      id: "poke",
      levels: { min: 50, max: 55 },
      levelTotal: 155,
      classes: 4,
      banned: ["mewtwo", "mew", "lugia", "ho-oh", "celebi"],
    },
    { id: "prime", levels: ANY_LEVEL, classes: 1, banned: [], foes: { level: 100 } },
    {
      id: "challenge",
      classes: 4,
      classLevels: { "poke-ball": 30, "great-ball": 45, "ultra-ball": 60, "master-ball": 75 },
    },
    { id: "castle", levels: ANY_LEVEL, banned: [], foes: { level: 50, matchesYours: true } },
    { id: "rival", levels: ANY_LEVEL, banned: [] },
  ],
};
