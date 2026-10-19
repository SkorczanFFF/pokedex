import { useCallback, useEffect, useMemo } from "react";
import { LIST_PARAMS } from "@/app/routes";
import { isGenSlug, type GenSlug } from "@/domain/dex";
import { DEFAULT_PER_PAGE, isPerPage, type PerPage } from "@/domain/pagination";
import { MAX_TYPES, type PokemonType } from "@/domain/pokemonTypes";
import { useSearchParamsPatch, type ParamPatch } from "@/features/shared/useSearchParamsPatch";
import { parseTypes, serializeTypes } from "./typeParam";

/** The whole list view, read out of the query string. */
export interface ListParams {
  page: number;
  perPage: PerPage;
  query: string;
  types: PokemonType[];
  /** Stable scalar for query keys — `types` is a fresh array on every parse. */
  typeKey: string;
  gen: GenSlug | null;
  isSearchMode: boolean;
  isTypeMode: boolean;
  isGenMode: boolean;
  isFilterMode: boolean;
}

/** Everything that writes the query string back. */
export interface ListActions {
  setPage: (page: number) => void;
  setPerPage: (perPage: number) => void;
  search: (query: string) => void;
  clearSearch: () => void;
  toggleType: (type: string) => void;
  clearTypes: () => void;
  setGen: (gen: string | null) => void;
  clearAll: () => void;
}

/** How many separate filters are narrowing the list right now. */
export const activeFilterCount = (params: ListParams): number =>
  params.types.length + (params.gen ? 1 : 0);

const { page: PAGE, perPage: PER, query: Q, type: TYPE, gen: GEN } = LIST_PARAMS;

/**
 * The list view lives in the URL, which makes it a shareable link and makes the
 * browser's own history the undo stack.
 *
 * `replaceHistory` covers the mobile filter sheet: a filtering session behind it
 * should leave one history entry, not one per tap.
 */
export const useListParams = ({
  replaceHistory,
}: {
  replaceHistory: boolean;
}) => {
  const [searchParams, patch] = useSearchParamsPatch();

  const page = Math.max(1, Number(searchParams.get(PAGE)) || 1);
  const perRaw = Number(searchParams.get(PER));
  const perPage = isPerPage(perRaw) ? perRaw : DEFAULT_PER_PAGE;
  const query = searchParams.get(Q) ?? "";

  const genParam = searchParams.get(GEN);
  const gen = isGenSlug(genParam) ? genParam : null;

  const typeParam = searchParams.get(TYPE);
  const types = useMemo(() => parseTypes(typeParam), [typeParam]);

  const isSearchMode = query.length > 0;
  const isTypeMode = !isSearchMode && types.length > 0;
  const isGenMode = !isSearchMode && gen !== null;

  const params: ListParams = {
    page,
    perPage,
    query,
    types,
    typeKey: types.join(","),
    gen,
    isSearchMode,
    isTypeMode,
    isGenMode,
    isFilterMode: isTypeMode || isGenMode,
  };

  const update = (changes: ParamPatch) => patch(changes, { replace: replaceHistory });

  /** Changing what is on screen also means going back to the top of it. */
  const updateFromTop = (changes: ParamPatch) => {
    update(changes);
    window.scrollTo(0, 0);
  };

  const actions: ListActions = {
    setPage: (n) => updateFromTop({ [PAGE]: String(n) }),
    setPerPage: (n) => updateFromTop({ [PER]: String(n), [PAGE]: "1" }),
    search: (q) => update({ [Q]: q, [TYPE]: null, [GEN]: null, [PAGE]: null }),
    clearSearch: () => update({ [Q]: null, [PAGE]: "1" }),

    // Types combine with AND and cap at MAX_TYPES; gen combines on top of them,
    // and clearing one never touches the other.
    toggleType: (type) => {
      const next = (types as readonly string[]).includes(type)
        ? types.filter((active) => active !== type)
        : [...types, type];
      if (next.length > MAX_TYPES) return;
      updateFromTop({ [TYPE]: serializeTypes(next), [Q]: null, [PAGE]: "1" });
    },
    clearTypes: () => {
      if (types.length === 0) return;
      updateFromTop({ [TYPE]: null, [PAGE]: "1" });
    },
    setGen: (g) => {
      if (g === null) {
        if (gen === null) return;
        updateFromTop({ [GEN]: null, [PAGE]: "1" });
      } else {
        updateFromTop({ [GEN]: g, [Q]: null, [PAGE]: "1" });
      }
    },
    clearAll: () => {
      if (types.length === 0 && gen === null) return;
      updateFromTop({ [TYPE]: null, [GEN]: null, [PAGE]: "1" });
    },
  };

  /**
   * For the caller's out-of-range clamp. Sets the page without scrolling,
   * because a correction is not a navigation the user asked for.
   */
  const clampPage = useCallback(
    (lastPage: number) => patch({ [PAGE]: String(lastPage) }, { replace: replaceHistory }),
    [patch, replaceHistory],
  );

  return { params, actions, clampPage };
};

/**
 * Snaps a page number past the end of the list back onto the last real page —
 * a stale link, or a filter that just narrowed the results out from under the
 * current offset. Waits for the total, which only the data layer knows, so the
 * wiring happens where both halves meet.
 */
export const useClampPage = ({
  params,
  totalPages,
  clampPage,
}: {
  params: ListParams;
  totalPages: number;
  clampPage: (lastPage: number) => void;
}) => {
  useEffect(() => {
    if (params.isSearchMode) return;
    if (totalPages > 0 && params.page > totalPages) clampPage(totalPages);
  }, [totalPages, params.page, params.isSearchMode, clampPage]);
};
