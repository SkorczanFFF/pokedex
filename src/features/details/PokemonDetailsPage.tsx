import { useQuery } from "@tanstack/react-query";
import { Link, useParams, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { NotFoundError } from "@/api/client";
import { getPokemonDetails } from "@/api/pokemon";
import { getPokemonSpecies } from "@/api/species";
import { getDescription, getGeneration, getGenus } from "@/domain/species";
import { typeClass } from "@/domain/types";
import { genRoman } from "@/domain/dex";
import { useAbilityLabel, useStatLabel, useTypeLabel } from "@/i18n/domain";
import { EvolutionChain } from "./EvolutionChain";
import { NotFound } from "@/features/not-found/NotFound";
import Loader from "@/components/Loader";
import ErrorView from "@/components/ErrorView";

export const PokemonDetailsPage = () => {
  const { name } = useParams<{ name: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const typeLabel = useTypeLabel();
  const statLabel = useStatLabel();
  const abilityLabel = useAbilityLabel();

  const navState =
    (location.state as { from?: string; scrollY?: number } | null) ?? null;
  const backTo = navState?.from ?? "/";

  const handleBack = () => {
    navigate(backTo, {
      state:
        typeof navState?.scrollY === "number"
          ? { restoreScroll: navState.scrollY }
          : null,
    });
  };

  // Evolution links stay on this route with a different param, so the component
  // is reused rather than remounted — the reset has to follow the name.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [name]);

  const {
    data: pokemon,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["pokemon", name],
    queryFn: () => getPokemonDetails(name!),
    enabled: !!name,
  });

  const { data: species } = useQuery({
    queryKey: ["species", pokemon?.id],
    queryFn: () => getPokemonSpecies(pokemon!.id),
    enabled: !!pokemon?.id,
  });

  if (isLoading) {
    return <Loader />;
  }

  if (error instanceof NotFoundError) {
    return <NotFound />;
  }

  if (error || !pokemon) {
    return <ErrorView errorType="details" />;
  }

  const playCry = () => {
    if (!pokemon.cries?.latest) return;
    const audio = new Audio(pokemon.cries.latest);
    audio.volume = 0.3;
    audio.play().catch(() => {
      /* user-gesture missing or autoplay blocked */
    });
  };

  const locale = i18n.resolvedLanguage ?? "en";
  // PokéAPI has no Polish species text, so these always resolve to English.
  const description = species ? getDescription(species, locale) : "";
  const genus = species ? getGenus(species, locale) : "";
  const generationSlug = species ? getGeneration(species) : null;
  const generation = generationSlug
    ? t("gen.badge", { roman: genRoman(generationSlug) })
    : "";
  const meta = [generation, genus].filter(Boolean).join(" · ");
  const showEnglishMarker = locale !== "en";

  return (
    <div className="container mx-auto px-4 pt-8 lg:max-w-7xl pb-12">
      <button
        onClick={handleBack}
        className="inline-block mb-8 text-black bg-[#FECB09] hover:bg-[#E12025] hover:text-white px-4 py-2 cursor-pointer"
      >
        {t("details.back")}
      </button>

      <div className="bg-white p-6">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <img
              src={
                pokemon.sprites.other["official-artwork"].front_default ||
                pokemon.sprites.front_default
              }
              alt={pokemon.name}
              className="w-full h-auto"
            />
          </div>

          <div>
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <h1 className="text-2xl capitalize">{pokemon.name}</h1>
              {pokemon.cries?.latest && (
                <button
                  onClick={playCry}
                  aria-label={t("details.playCry", { name: pokemon.name })}
                  className="text-xs px-2 py-1 bg-[#FECB09] hover:bg-[#E12025] hover:text-white cursor-pointer"
                >
                  {" > "}
                  {t("details.cry")}
                </button>
              )}
              <span className="text-gray-500">[{pokemon.id}]</span>
            </div>

            {meta && <p className="text-xs text-gray-500 mb-3">{meta}</p>}
            {description && (
              <p className="text-xs leading-relaxed mb-6">
                {description}
                {showEnglishMarker && (
                  <span
                    title={t("details.englishEntry")}
                    className="ml-2 align-middle bg-gray-200 text-gray-600 text-[10px] px-1 py-[2px]"
                  >
                    <span aria-hidden="true">
                      {t("details.englishEntryShort")}
                    </span>
                    <span className="sr-only">{t("details.englishEntry")}</span>
                  </span>
                )}
              </p>
            )}

            <div className="flex gap-2 mb-6">
              {pokemon.types.map((type) => (
                <Link
                  key={type.type.name}
                  to={`/?type=${type.type.name}`}
                  aria-label={t("details.showType", {
                    type: typeLabel(type.type.name),
                  })}
                  className={`px-4 py-1 text-xs cursor-pointer hover:opacity-80 ${typeClass(
                    type.type.name,
                  )}`}
                >
                  {typeLabel(type.type.name)}
                </Link>
              ))}
            </div>

            <div className="space-y-6">
              <div>
                <h2 className="text-lg mb-3">{t("details.stats")}</h2>
                <div className="space-y-3">
                  {pokemon.stats.map((stat) => {
                    // 160 is the top of the bar's scale; Blissey's 255 HP would
                    // otherwise run past the track.
                    const filled = Math.min((stat.base_stat / 160) * 100, 100);

                    return (
                      <div
                        key={stat.stat.name}
                        className="flex items-center gap-2 flex-col md:flex-row"
                      >
                        <span className="w-full md:w-32 text-xs">
                          {statLabel(stat.stat.name)}:
                        </span>
                        <div className="relative flex w-full h-5 overflow-hidden bg-[#EAEBF2]">
                          <div
                            className="h-full bg-[#356DB2]"
                            style={{ width: `${filled}%` }}
                          />
                          {/* Drawn twice and clipped at the fill edge, so a digit
                              landing on that edge is white on the filled side and
                              black on the empty one. A blend mode cannot do this —
                              its result follows the backdrop, and difference over
                              #356DB2 resolves to #CA924D, not to white. */}
                          <span
                            className="absolute inset-0 flex items-center justify-center text-[10px] leading-none text-white"
                            style={{ clipPath: `inset(0 ${100 - filled}% 0 0)` }}
                          >
                            {stat.base_stat}
                          </span>
                          <span
                            aria-hidden="true"
                            className="absolute inset-0 flex items-center justify-center text-[10px] leading-none text-black"
                            style={{ clipPath: `inset(0 0 0 ${filled}%)` }}
                          >
                            {stat.base_stat}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h2 className="text-lg mb-3">{t("details.abilities")}</h2>
                <div className="flex flex-wrap gap-2">
                  {pokemon.abilities.map((ability) => (
                    <span
                      key={ability.ability.name}
                      className="px-3 py-1 bg-gray-100 text-xs"
                    >
                      {abilityLabel(ability.ability.name)}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h2 className="text-lg  mb-2">{t("details.height")}</h2>
                  <p className=" text-xs">
                    {t("details.heightValue", { value: pokemon.height / 10 })}
                  </p>
                </div>
                <div>
                  <h2 className="text-lg mb-2">{t("details.weight")}</h2>
                  <p className=" text-xs">
                    {t("details.weightValue", { value: pokemon.weight / 10 })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {species && (
        <EvolutionChain
          chainUrl={species.evolution_chain.url}
          currentId={pokemon.id}
        />
      )}
    </div>
  );
};
