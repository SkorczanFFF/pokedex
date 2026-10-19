import type { NamedApiResource } from "@/types/pokemon";
import { isInEra, type DexEra } from "./era";
import { resourceIdFromUrl } from "./resource";

/**
 * The index entries inside the era whose name contains the term, in the
 * index's own order — dex order, forms after the national dex. An empty term
 * matches every entry. The term arrives normalised by the caller; what the
 * search box and the Versus picker do to the typed text is theirs.
 */
export const matchNames = <T extends NamedApiResource>(
  names: readonly T[],
  term: string,
  era: DexEra,
): T[] =>
  names.filter(
    (entry) =>
      isInEra(resourceIdFromUrl(entry.url), era) &&
      (term === "" || entry.name.includes(term)),
  );
