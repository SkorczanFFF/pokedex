import { Link } from "react-router-dom";
import { pokemonPath } from "@/app/routes";
import { TEXT_LINK } from "@/components/buttons";

/** A Pokémon by slug, spelled as its dex page heads it; `humanize` would drop Ho-Oh's hyphen. */
export const DexLink = ({ slug }: { slug: string }) => (
  <Link to={pokemonPath(slug)} className={`${TEXT_LINK} capitalize`}>
    {slug}
  </Link>
);
