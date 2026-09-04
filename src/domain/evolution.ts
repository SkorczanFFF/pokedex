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

/** Rewrites the API tree into one carrying dex ids and a single condition per step. */
const buildTree = (link: EvolutionLink, era: DexEra): EvolutionNode => ({
  name: link.species.name,
  id: resourceIdFromUrl(link.species.url),
  condition: methodInEra(link.evolution_details, era),
  children: link.evolves_to.map((child) => buildTree(child, era)),
});

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
): EvolutionNode[] => prune(buildTree(link, era), era);
