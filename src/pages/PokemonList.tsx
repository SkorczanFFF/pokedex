import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPokemonDetails, getPokemonList } from "../services/pokemon";
import { PokemonCard } from "../components/PokemonCard";
import type { Pokemon } from "../types/pokemon";
import Loader from "../components/Loader";
import Error from "../components/Error";

const ITEMS_PER_PAGE_OPTIONS = [20, 40, 60];

export const PokemonList = () => {
  const { page } = useParams<{ page: string }>();
  const navigate = useNavigate();
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const currentPage = Number(page) || 1;

  // Validate page number
  useEffect(() => {
    if (!page || isNaN(Number(page)) || Number(page) < 1) {
      navigate("/1", { replace: true });
    }
  }, [page, navigate]);

  const {
    data: pokemonList,
    isLoading: isListLoading,
    error: listError,
  } = useQuery({
    queryKey: ["pokemonList", currentPage, itemsPerPage],
    queryFn: () =>
      getPokemonList(itemsPerPage, (currentPage - 1) * itemsPerPage),
  });

  const {
    data: pokemonDetails,
    isLoading: isDetailsLoading,
    error: detailsError,
  } = useQuery({
    queryKey: ["pokemonDetails", pokemonList?.results],
    queryFn: async () => {
      if (!pokemonList?.results) return [];
      const details = await Promise.all(
        pokemonList.results.map((pokemon) => getPokemonDetails(pokemon.name))
      );
      return details;
    },
    enabled: !!pokemonList?.results,
  });

  const totalPages = pokemonList
    ? Math.ceil(pokemonList.count / itemsPerPage)
    : 0;

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      navigate(`/${totalPages}`, { replace: true });
    }
  }, [totalPages, currentPage, navigate]);

  const handlePageChange = (newPage: number) => {
    navigate(`/${newPage}`);
    window.scrollTo(0, 0);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    navigate("/1");
    window.scrollTo(0, 0);
  };

  if (isListLoading || isDetailsLoading) {
    return <Loader />;
  }

  if (listError || detailsError) {
    return <Error errorType="list" />;
  }

  return (
    <div className="mx-auto px-4 py-8 xl:max-w-7xl">
      <div className="flex justify-between items-center mb-8 flex-col md:flex-row gap-4 md:gap-0">
        <h1 className="text-2xl">Pokemon List</h1>
        <div className="flex items-center gap-4">
          <label className="text-sm">Items per page:</label>
          <select
            value={itemsPerPage}
            onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
            className="border-2 px-2 py-1 text-sm bg-white"
          >
            {ITEMS_PER_PAGE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {pokemonDetails?.map((pokemon: Pokemon) => (
          <PokemonCard key={pokemon.id} pokemon={pokemon} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-8 flex flex-col md:flex-row justify-center items-center gap-4 md:gap-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointe text-sm hover:bg-[#FFCD0B] disabled:hover:bg-gray-300"
          >
            Prev
          </button>

          <div className="flex gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNumber;
              if (totalPages <= 5) {
                pageNumber = i + 1;
              } else if (currentPage <= 3) {
                pageNumber = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNumber = totalPages - 4 + i;
              } else {
                pageNumber = currentPage - 2 + i;
              }

              return (
                <button
                  key={pageNumber}
                  onClick={() => handlePageChange(pageNumber)}
                  className={`w-10 h-10 text-sm cursor-pointer ${
                    currentPage === pageNumber
                      ? "bg-[#356DB2] text-white"
                      : "bg-gray-300 hover:bg-[#FFCD0B]"
                  }`}
                >
                  {pageNumber}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointe text-sm hover:bg-[#FFCD0B] cursor-pointer disabled:hover:bg-gray-300"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};
