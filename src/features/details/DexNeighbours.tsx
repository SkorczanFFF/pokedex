import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { getDexWindow } from "@/api/pokemon";
import { dexNeighbourIds, lastDexId } from "@/domain/dex";
import { resourceIdFromUrl } from "@/domain/resource";
import { useEra } from "@/era/context";

/**
 * The two steps along the dex, kept in names because the route is.
 *
 * A details payload knows its own id and nothing about what surrounds it, so
 * the neighbours have to be asked for — but only their names, and `/pokemon`
 * hands those over three at a time for 142 bytes. The alternative was the whole
 * catalogue, 11.5 kB, which search already holds under `allPokemonNames`; this
 * is a hundredth of that on a page most readers never step away from.
 *
 * Whether a step exists is known from the id alone, before the names land, so
 * the row is drawn at its final size straight away and only the words arrive
 * late. That is also why one dead end is a dimmed span rather than nothing: an
 * absent button at Bulbasaur would slide "Next" under the pointer aimed at it.
 * Two dead ends is a different case — a form variant steps nowhere in either
 * direction — and draws nothing at all, rather than a row that never will.
 *
 * Rendered twice on the page, top and bottom. Both copies ask the same query
 * key, so the second one costs no request.
 */
export const DexNeighbours = ({ id }: { id: number }) => {
  const { era } = useEra();

  const { prev, next } = dexNeighbourIds(id, lastDexId(era.maxGen));
  const stepsNowhere = prev === null && next === null;

  const { data } = useQuery({
    queryKey: ["dexWindow", id],
    queryFn: () => getDexWindow(id),
    staleTime: Infinity,
    enabled: !stepsNowhere,
  });

  if (stepsNowhere) return null;

  // Read back by id rather than by position: a window that came back in some
  // other order loses a button instead of pointing one at the wrong Pokémon.
  const nameOf = (wanted: number | null) =>
    wanted === null
      ? null
      : data?.results.find((entry) => resourceIdFromUrl(entry.url) === wanted)
          ?.name ?? null;

  return (
    <div className="flex items-center gap-2">
      <Step label="dexPrev" name={nameOf(prev)} arrow="<" />
      <Step label="dexNext" name={nameOf(next)} arrow=">" />
    </div>
  );
};

const STEP =
  "px-4 py-2 text-sm whitespace-nowrap capitalize flex items-center gap-2";

const Step = ({
  label,
  name,
  arrow,
}: {
  label: "dexPrev" | "dexNext";
  name: string | null;
  arrow: string;
}) => {
  const { t } = useTranslation();

  // The arrow reads as the direction; the name is the label a reader wants and
  // a screen reader gets both, in a sentence, off the link itself.
  const chevron = (
    <span aria-hidden="true" className="text-[#E12025]">
      {arrow}
    </span>
  );
  const order = label === "dexPrev" ? "" : "flex-row-reverse";

  if (name === null) {
    return (
      <span
        aria-hidden="true"
        className={`${STEP} ${order} bg-gray-200 text-gray-400`}
      >
        {chevron}
        {"\u2014"}
      </span>
    );
  }

  return (
    <Link
      to={`/pokemon/${name}`}
      aria-label={t(`details.${label}`, { name })}
      className={`${STEP} ${order} bg-gray-300 text-black cursor-pointer hover:bg-[#FECB09]`}
    >
      {chevron}
      <span aria-hidden="true">{name}</span>
    </Link>
  );
};
