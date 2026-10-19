import { describe, expect, it } from "vitest";
import type { EvolutionDetail, EvolutionLink } from "@/types/pokemon";
import { MODERN, RETRO } from "./era";
import { evolutionTreeInEra, formSuffix, treeDepth } from "./evolution";

const detail = (partial: Partial<EvolutionDetail> = {}): EvolutionDetail => ({
  version_group: { name: "red-blue", url: "" },
  trigger: { name: "level-up" },
  item: null,
  held_item: null,
  known_move: null,
  known_move_type: null,
  location: null,
  party_species: null,
  party_type: null,
  trade_species: null,
  min_level: null,
  min_happiness: null,
  min_beauty: null,
  min_affection: null,
  gender: null,
  time_of_day: "",
  needs_overworld_rain: false,
  turn_upside_down: false,
  relative_physical_stats: null,
  base_form: null,
  evolved_form: null,
  region: null,
  ...partial,
});

const link = (
  name: string,
  id: number,
  evolves_to: EvolutionLink[] = [],
  evolution_details: EvolutionDetail[] = [],
): EvolutionLink => ({
  species: { name, url: `https://pokeapi.co/api/v2/pokemon-species/${id}/` },
  evolution_details,
  evolves_to,
});

/** Mime Jr. (Gen IV) in front of Mr. Mime (Gen I), then Mr. Rime (Gen VIII). */
const mimeLine = link("mime-jr", 439, [
  link(
    "mr-mime",
    122,
    [link("mr-rime", 866, [], [detail({ version_group: { name: "sword-shield", url: "" }, min_level: 42 })])],
    [detail({ version_group: { name: "diamond-pearl", url: "" }, known_move: { name: "mimic" } })],
  ),
]);

describe("evolutionTreeInEra", () => {
  it("carries ids, and one condition per step, in the modern dex", () => {
    const [root] = evolutionTreeInEra(mimeLine, MODERN);
    expect(root.name).toBe("mime-jr");
    expect(root.id).toBe(439);
    expect(root.condition).toBeNull();
    expect(root.children[0].name).toBe("mr-mime");
    expect(root.children[0].condition?.known_move).toEqual({ name: "mimic" });
    expect(root.children[0].children[0].id).toBe(866);
  });

  it("re-roots the line at the species the era knew", () => {
    expect(evolutionTreeInEra(mimeLine, RETRO)).toEqual([
      { name: "mr-mime", id: 122, condition: null, children: [] },
    ]);
  });

  it("answers an empty forest when nothing of the line existed yet", () => {
    const sylveon = link("sylveon", 700);
    expect(evolutionTreeInEra(sylveon, RETRO)).toEqual([]);
  });

  it("explains a step with the newest rule the era covers", () => {
    const eevee = link("eevee", 133, [
      link(
        "leafeon",
        470,
        [],
        [
          detail({ version_group: { name: "sword-shield", url: "" }, trigger: { name: "use-item" }, item: { name: "leaf-stone" } }),
          detail({ version_group: { name: "x-y", url: "" }, location: { name: "mossy-rock" } }),
        ],
      ),
    ]);
    const modern = evolutionTreeInEra(eevee, MODERN)[0].children[0].condition;
    expect(modern?.item).toEqual({ name: "leaf-stone" });
    const asOfGenVI = evolutionTreeInEra(eevee, { ...MODERN, maxGen: "vi" })[0].children[0].condition;
    expect(asOfGenVI?.location).toEqual({ name: "mossy-rock" });
  });

  it("picks the step that belongs to the form being read", () => {
    const sandshrew = link("sandshrew", 27, [
      link(
        "sandslash",
        28,
        [],
        [
          detail({ min_level: 22 }),
          detail({
            version_group: { name: "sun-moon", url: "" },
            trigger: { name: "use-item" },
            item: { name: "ice-stone" },
            base_form: { name: "sandshrew-alola" },
          }),
        ],
      ),
    ]);
    expect(evolutionTreeInEra(sandshrew, MODERN, "")[0].children[0].condition?.min_level).toBe(22);
    expect(evolutionTreeInEra(sandshrew, MODERN, "-alola")[0].children[0].condition?.item).toEqual({
      name: "ice-stone",
    });
  });
});

describe("formSuffix and treeDepth", () => {
  it("reads the form off a Pokémon's name", () => {
    expect(formSuffix("sandslash-alola", "sandslash")).toBe("-alola");
    expect(formSuffix("pikachu", "pikachu")).toBe("");
    expect(formSuffix("mr-mime", "mr-mime")).toBe("");
  });

  it("counts stages, not branches", () => {
    const [eevee] = evolutionTreeInEra(
      link("eevee", 133, [link("vaporeon", 134), link("jolteon", 135), link("flareon", 136)]),
      MODERN,
    );
    expect(treeDepth(eevee)).toBe(2);
    expect(treeDepth(evolutionTreeInEra(mimeLine, MODERN)[0])).toBe(3);
  });
});
