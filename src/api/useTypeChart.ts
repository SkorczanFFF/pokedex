import { useQueries } from "@tanstack/react-query";
import { typeQuery } from "@/api/queries";
import type { GenSlug } from "@/domain/dex";
import { typesUpTo } from "@/domain/pokemonTypes";
import { typeChart, type TypeChart } from "@/domain/typeChart";
import type { TypeResource } from "@/types/typeResource";

/**
 * The chart as of a generation, out of one request per type that existed by
 * then. The chart page and the Versus page both read this, and the session
 * keeps the answers, so the second page costs nothing.
 */
export const useTypeChart = (
  gen: GenSlug,
): {
  chart: TypeChart | null;
  /** The raw resources, for the footnotes on what changed. */
  types: TypeResource[];
  isLoading: boolean;
  error: Error | null;
} => {
  const queries = useQueries({
    queries: typesUpTo(gen).map((name) => typeQuery(name)),
  });
  const isLoading = queries.some((q) => q.isLoading);
  const error = queries.find((q) => q.error)?.error ?? null;
  const types = queries.flatMap((q) => (q.data ? [q.data] : []));

  return {
    chart: isLoading || error ? null : typeChart(types, gen),
    types,
    isLoading,
    error,
  };
};
