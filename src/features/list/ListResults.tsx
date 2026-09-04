import ErrorView from "@/components/ErrorView";
import { SkeletonGrid } from "@/components/Skeleton";
import { PokemonCard } from "./PokemonCard";
import type { ListData } from "./useListData";
import type { ListParams } from "./useListParams";

/** The grid, and the three things that stand in for it. */
export const ListResults = ({
  params,
  data,
}: {
  params: ListParams;
  data: ListData;
}) => {
  if (data.hasError) return <ErrorView errorType="list" />;

  // Skeletons match the requested page size, so nothing jumps when the real
  // cards land.
  if (data.isLoading) return <SkeletonGrid count={params.perPage} />;

  // ListStatus has already explained the emptiness; a second message would say
  // the same thing twice.
  if (data.noSearchMatches || data.noFilterMatches) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {data.pokemon.map((pokemon) => (
        <PokemonCard key={pokemon.id} pokemon={pokemon} />
      ))}
    </div>
  );
};
