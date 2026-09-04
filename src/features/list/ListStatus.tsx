import { useTranslation } from "react-i18next";
import { genRoman } from "@/domain/dex";
import { useTypeLabel } from "@/i18n/domain";
import type { ListData } from "./useListData";
import type { ListParams } from "./useListParams";

/**
 * What is narrowing the list, as one phrase: "Types: Grass, Poison ·
 * Generation: I". Composed from parts instead of one message per combination —
 * each part is a whole phrase and " · " is punctuation, so this stays
 * translation-safe.
 */
const useFilterLabel = ({ types, gen, isTypeMode, isGenMode }: ListParams) => {
  const { t } = useTranslation();
  const typeLabel = useTypeLabel();

  return [
    isTypeMode
      ? t("list.filterType", {
          types: types.map(typeLabel).join(", "),
          count: types.length,
        })
      : "",
    isGenMode ? t("list.filterGen", { gen: genRoman(gen!) }) : "",
  ]
    .filter(Boolean)
    .join(" · ");
};

/**
 * The line between the toolbar and the grid: what was asked for, and what came
 * back. The four cases are mutually exclusive — search and filter modes cannot
 * both be on, and within either one a result count is either zero or it is not
 * — so this returns the first that applies.
 */
export const ListStatus = ({
  params,
  data,
}: {
  params: ListParams;
  data: ListData;
}) => {
  const { t } = useTranslation();
  const filterLabel = useFilterLabel(params);

  if (params.isFilterMode && data.filteredCount > 0 && !data.isLoading) {
    return (
      <h2 className="text-lg font-semibold mb-8 text-center md:text-left">
        {t("list.filterHeading", {
          label: filterLabel,
          count: data.filteredCount,
        })}
      </h2>
    );
  }

  if (params.isSearchMode && !data.isLoading && data.pokemon.length > 0) {
    return (
      <h2 className="text-lg font-semibold mb-8 text-center md:text-left">
        {t(
          data.isSearchCapped
            ? "list.searchResultsCapped"
            : "list.searchResults",
          { query: params.query, count: data.pokemon.length }
        )}
      </h2>
    );
  }

  if (data.noSearchMatches) {
    return (
      <div className="text-center text-red-600 py-8">
        <p>{t("list.noSearchMatches", { query: params.query })}</p>
      </div>
    );
  }

  if (data.noFilterMatches) {
    return (
      <div className="text-center text-red-600 py-8">
        {filterLabel && <p className="mb-2">{filterLabel}</p>}
        <p>{t("list.noFilterMatches")}</p>
      </div>
    );
  }

  return null;
};
