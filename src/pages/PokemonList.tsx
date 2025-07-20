import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getPokemonDetails,
  getPokemonList,
  searchPokemonBySubstring,
} from "../services/pokemon";
import { PokemonCard } from "../components/PokemonCard";
import { FilterControls } from "../components/FilterControls";
import { Pagination } from "../components/Pagination";
import type { Pokemon } from "../types/pokemon";
import Loader from "../components/Loader";
import Error from "../components/Error";

export const PokemonList = () => {
  const { page } = useParams<{ page: string }>();
  const navigate = useNavigate();
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Pokemon[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const currentPage = Number(page) || 1;

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
    enabled: !isSearchMode,
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
    enabled: !!pokemonList?.results && !isSearchMode,
  });

  const totalPages = pokemonList
    ? Math.ceil(pokemonList.count / itemsPerPage)
    : 0;

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages && !isSearchMode) {
      navigate(`/${totalPages}`, { replace: true });
    }
  }, [totalPages, currentPage, navigate, isSearchMode]);

  const handlePageChange = (newPage: number) => {
    navigate(`/${newPage}`);
    window.scrollTo(0, 0);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    navigate("/1");
    window.scrollTo(0, 0);
  };

  const handleSearch = async (searchTerm: string) => {
    setIsSearching(true);
    setSearchError(null);
    setSearchTerm(searchTerm);

    try {
      const results = await searchPokemonBySubstring(searchTerm);
      if (results.length > 0) {
        setSearchResults(results);
        setIsSearchMode(true);
      } else {
        setSearchError(
          `No Pokemon found containing "${searchTerm}". Please try a different search term.`
        );
        setSearchResults([]);
        setIsSearchMode(false);
      }
    } catch {
      setSearchError("An error occurred while searching. Please try again.");
      setSearchResults([]);
      setIsSearchMode(false);
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearSearch = () => {
    setIsSearchMode(false);
    setSearchTerm("");
    setSearchResults([]);
    setSearchError(null);
  };

  if (isSearching || (!isSearchMode && (isListLoading || isDetailsLoading))) {
    return <Loader />;
  }

  if (searchError) {
    return (
      <div className="mx-auto px-4 py-8 xl:max-w-7xl">
        <div className="flex justify-between items-center mb-8 flex-col md:flex-row gap-4 md:gap-0">
          <h1 className="text-2xl">Pokemon List</h1>
          <FilterControls
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={handleItemsPerPageChange}
            onSearch={handleSearch}
            isSearchMode={isSearchMode}
            onClearSearch={handleClearSearch}
          />
        </div>
        <div className="text-center text-red-600 py-8">
          <p>{searchError}</p>
        </div>
      </div>
    );
  }

  if (!isSearchMode && (listError || detailsError)) {
    return <Error errorType="list" />;
  }

  const pokemonToDisplay = isSearchMode ? searchResults : pokemonDetails || [];

  return (
    <div className="mx-auto px-4 py-8 xl:max-w-7xl">
      <div className="flex justify-between items-center mb-8 flex-col md:flex-row gap-4 md:gap-0">
        <h1 className="text-2xl">Pokemon List</h1>
        <FilterControls
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={handleItemsPerPageChange}
          onSearch={handleSearch}
          isSearchMode={isSearchMode}
          onClearSearch={handleClearSearch}
        />
      </div>

      {isSearchMode && (
        <h2 className="text-lg font-semibold mb-8 text-center md:text-left">
          Search Results for "{searchTerm}" ({searchResults.length} found)
        </h2>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {pokemonToDisplay.map((pokemon: Pokemon) => (
          <PokemonCard
            key={pokemon.id}
            pokemon={pokemon}
            currentPage={currentPage}
          />
        ))}
      </div>

      {!isSearchMode && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
};
