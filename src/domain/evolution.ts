import type { EvolutionDetail, EvolutionLink } from "@/types/pokemon";
import { genOrder } from "./dex";
import type { DexEra } from "./era";
import { generationOfVersionGroup } from "./games";
import { resourceIdFromUrl } from "./resource";

export interface EvolutionNode {
  /** Species slug — also the `/pokemon/:name` route segment. */
  name: string;
  id: number;
  /** How this species is reached from its parent; null on the root. */
  condition: EvolutionDetail | null;
  children: EvolutionNode[];
}

/**
 * How this step worked in the era.
 *
 * PokéAPI repeats an evolution once per version group whose rules differed —
 * Leafeon carries six, from the mossy rock you had to walk past to the Leaf
 * Stone that replaced it. Taking the newest one the era covers is what stops
 * retro from explaining a Gen II evolution with Sword and Shield's rules.
 *
 * This used to take the highest version-group id and call that the newest. The
 * ids are not chronological and the shortcut was wrong: Colosseum and XD are
 * Gen III but numbered after Gen V, and the Japanese Gen I releases land after
 * Gen VII. Nothing in these chains happened to trip it, which is the worst way
 * for an assumption to be wrong.
 *
 * Null when no recorded method predates the era: the arrow still says that it
 * evolves, and saying nothing beats naming rules that had not been invented.
 */
const methodInEra = (
  details: EvolutionDetail[],
  era: DexEra,
): EvolutionDetail | null => {
  const cap = genOrder(era.maxGen);
  let best: { order: number; detail: EvolutionDetail } | null = null;

  for (const detail of details) {
    const generation = generationOfVersionGroup(detail.version_group.name);
    if (generation === null) continue;

    const order = genOrder(generation);
    if (order <= cap && (best === null || order >= best.order)) {
      best = { order, detail };
    }
  }

  return best?.detail ?? null;
};

/**
 * The steps that belong to one form.
 *
 * A species and its regional variants share a single chain, so Sandshrew's
 * carries both "level 22" and "use an Ice Stone" and only `base_form` says
 * which is which. Preferring the entries that name this form, and otherwise the
 * entries that name no form at all, is what stops a Kantonian Ninetales from
 * evolving with a stone that exists only for the Alolan one.
 *
 * `region` and `evolved_form` catch the rest of the pattern: Galarian Weezing's
 * step names no base form, because Koffing has no variant to name, and marks
 * the region instead. Falling back to everything keeps a step labelled rather
 * than blank if a chain is shaped in some way this does not anticipate.
 */
const stepsForForm = (
  details: EvolutionDetail[],
  form: string,
): EvolutionDetail[] => {
  const own = details.filter((detail) => detail.base_form?.name === form);
  if (own.length > 0) return own;

  const anyForm = details.filter(
    (detail) => !detail.base_form && !detail.region && !detail.evolved_form,
  );
  return anyForm.length > 0 ? anyForm : details;
};

/**
 * Rewrites the API tree into one carrying dex ids and a single condition per
 * step. `suffix` is what marks the form being read — `-alola`, `-galar`, or
 * nothing at all — and it rides down the tree so that every step is judged
 * against the form its own parent is in.
 */
const buildTree = (
  link: EvolutionLink,
  era: DexEra,
  suffix: string,
  condition: EvolutionDetail | null,
): EvolutionNode => ({
  name: link.species.name,
  id: resourceIdFromUrl(link.species.url),
  condition,
  children: link.evolves_to.map((child) => {
    const parentForm = `${link.species.name}${suffix}`;
    const step = methodInEra(
      stepsForForm(child.evolution_details, parentForm),
      era,
    );
    return buildTree(child, era, suffix, step);
  }),
});

/**
 * `sandslash-alola` read as the species `sandslash` leaves `-alola`; a default
 * form leaves nothing, which is exactly the marker the steps above expect.
 */
export const formSuffix = (pokemonName: string, speciesName: string): string =>
  pokemonName.startsWith(`${speciesName}-`)
    ? pokemonName.slice(speciesName.length)
    : "";

/** Longest path from the root, counted in nodes — the chain's width in stages. */
export const treeDepth = (node: EvolutionNode): number =>
  1 +
  node.children.reduce(
    (deepest, child) => Math.max(deepest, treeDepth(child)),
    0,
  );

/**
 * The line as it stood in an era: species past the era's dex are dropped, and a
 * dropped node hands its surviving children up in its place.
 *
 * That promotion is the whole point. Gen IV slotted babies in front of older
 * lines and PokéAPI roots each chain at the earliest one, so Mr. Mime's chain
 * begins at Mime Jr. (439) and Marill's at Azurill (298). Pruning without
 * re-rooting would take the Gen I/II Pokémon down with its Gen IV ancestor.
 *
 * Returns a forest: one root in every real case, none when nothing survives.
 */
const prune = (node: EvolutionNode, era: DexEra): EvolutionNode[] => {
  const children = node.children.flatMap((child) => prune(child, era));
  return node.id > era.maxDexId ? children : [{ ...node, children }];
};

/** The line as the era knew it: which species were in it, and how they evolved. */
export const evolutionTreeInEra = (
  link: EvolutionLink,
  era: DexEra,
  suffix = "",
): EvolutionNode[] => prune(buildTree(link, era, suffix, null), era);
