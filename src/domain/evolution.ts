import type { EvolutionDetail, EvolutionLink } from "@/types/pokemon";
import type { DexEra } from "./era";
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
 * PokéAPI repeats an evolution once per game it appeared in — Leafeon carries
 * six entries, five of them long-dead "walk past a mossy rock" locations.
 * Version group ids run chronologically, so the highest one is the method that
 * still applies in the current games.
 */
const newestDetail = (details: EvolutionDetail[]): EvolutionDetail | null =>
  details.reduce<EvolutionDetail | null>(
    (best, detail) =>
      best === null ||
      resourceIdFromUrl(detail.version_group.url) >
        resourceIdFromUrl(best.version_group.url)
        ? detail
        : best,
    null,
  );

/** Rewrites the API tree into one carrying dex ids and a single condition per step. */
export const buildEvolutionTree = (link: EvolutionLink): EvolutionNode => ({
  name: link.species.name,
  id: resourceIdFromUrl(link.species.url),
  condition: newestDetail(link.evolution_details),
  children: link.evolves_to.map(buildEvolutionTree),
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
export const pruneToEra = (
  node: EvolutionNode,
  era: DexEra,
): EvolutionNode[] => {
  const children = node.children.flatMap((child) => pruneToEra(child, era));
  return node.id > era.maxDexId ? children : [{ ...node, children }];
};
