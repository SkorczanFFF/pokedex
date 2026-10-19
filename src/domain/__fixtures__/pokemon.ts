import type { Pokemon } from "@/types/pokemon";

/** One base stat, the way `/pokemon` lists them. */
export const stat = (name: string, base: number): Pokemon["stats"][number] => ({
  base_stat: base,
  stat: { name },
});

/** The six of today's stats, in PokéAPI's order. */
export const stats = (
  hp: number,
  attack: number,
  defense: number,
  specialAttack: number,
  specialDefense: number,
  speed: number,
): Pokemon["stats"] => [
  stat("hp", hp),
  stat("attack", attack),
  stat("defense", defense),
  stat("special-attack", specialAttack),
  stat("special-defense", specialDefense),
  stat("speed", speed),
];

/** Pikachu, as far as a test needs one; override whatever the test is about. */
export const makePokemon = (overrides: Partial<Pokemon> = {}): Pokemon => ({
  id: 25,
  name: "pikachu",
  sprites: {
    front_default: "https://sprites.test/25.png",
    back_default: "https://sprites.test/back/25.png",
    other: {
      "official-artwork": { front_default: "https://sprites.test/artwork/25.png" },
    },
  },
  types: [{ slot: 1, type: { name: "electric" } }],
  stats: stats(35, 55, 40, 50, 50, 90),
  height: 4,
  weight: 60,
  abilities: [
    { ability: { name: "static" }, is_hidden: false, slot: 1 },
    { ability: { name: "lightning-rod" }, is_hidden: true, slot: 3 },
  ],
  species: { name: "pikachu", url: "https://pokeapi.co/api/v2/pokemon-species/25/" },
  moves: [],
  cries: { latest: "https://cries.test/latest/25.ogg", legacy: "https://cries.test/legacy/25.ogg" },
  ...overrides,
});
