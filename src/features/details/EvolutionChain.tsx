import type { CSSProperties } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getEvolutionChain } from "@/api/evolution";
import {
  evolutionTreeInEra,
  treeDepth,
  type EvolutionNode,
} from "@/domain/evolution";
import { useEra } from "@/era/context";
import { spriteUrlById } from "@/domain/pokemonView";
import { resourceIdFromUrl } from "@/domain/resource";
import { useEvolutionCondition } from "@/i18n/evolutionCondition";
import type { EvolutionDetail } from "@/types/pokemon";

interface EvolutionChainProps {
  /** Absolute chain URL, exactly as `/pokemon-species` hands it over. */
  chainUrl: string;
  /** Dex id of the Pokémon on screen — its node is marked rather than linked. */
  currentId: number;
  /** Which variant is being read, so each step is the one that variant uses. */
  formSuffix: string;
}

/**
 * The evolution line of the Pokémon being viewed.
 *
 * Costs a single request: `/evolution-chain` carries species names and URLs but
 * no pictures, and the sprite repo is keyed by the very id sitting in those URLs
 * — so every picture here is derived, not fetched, whichever set the era asks
 * for.
 */
export const EvolutionChain = ({
  chainUrl,
  currentId,
  formSuffix,
}: EvolutionChainProps) => {
  const { t } = useTranslation();
  const { era } = useEra();
  const chainId = resourceIdFromUrl(chainUrl);

  const { data, error } = useQuery({
    queryKey: ["evolutionChain", chainId],
    queryFn: () => getEvolutionChain(chainId),
    enabled: chainId > 0,
    staleTime: Infinity,
  });

  // Evolution is a side dish on a page that already rendered. A failure here
  // drops the section rather than replacing a working page with an error.
  if (error) return null;

  const roots = data ? evolutionTreeInEra(data.chain, era, formSuffix) : null;

  // Nothing of this line existed in the era, so there is no section to show.
  if (roots !== null && roots.length === 0) return null;

  return (
    <section className="bg-white p-6 mt-6">
      <h2 className="text-lg mb-6">{t("details.evolution")}</h2>
      {roots ? (
        roots.map((root) => (
          <Tree key={root.name} root={root} currentId={currentId} />
        ))
      ) : (
        <div className="h-64 bg-gray-100 animate-pulse" />
      )}
    </section>
  );
};

/**
 * Desktop widths are derived from the container rather than fixed. Three stages
 * at a flat 192px overflow a 768px container, and the answer to that is smaller
 * tiles, not a horizontal scrollbar — so a stage gets whatever is left after the
 * arrow columns and gaps between it and its neighbours, clamped either side.
 *
 * The name rides along. Press Start 2P is monospaced at exactly 1em per
 * character (advance 1000 against unitsPerEm 1000), so a tile holds
 * `(tile - padding) / font-size` of them. Sizing the font as a fraction of the
 * tile holds that count near thirteen at every width; a fixed 12px would drop to
 * ten once the tile shrinks around 768px, which is one short of the longest name
 * a three-stage chain can carry (`meowscarada`).
 *
 * `cqw` resolves against the query container no matter how deep the recursion
 * goes, which plain percentages cannot do. Everything below `md` ignores these
 * and keeps the stacked layout at its fixed widths.
 */
const chainScale = (stages: number): CSSProperties =>
  ({
    "--evo-gap": "1rem",
    "--evo-step": "clamp(5.5rem, 10cqw, 8rem)",
    "--evo-tile": `clamp(6rem, (100cqw - ${stages - 1} * (var(--evo-step) + 2 * var(--evo-gap))) / ${stages}, 12rem)`,
    "--evo-name": "clamp(9px, calc(var(--evo-tile) / 16), 12px)",
  }) as CSSProperties;

const Tree = ({
  root,
  currentId,
}: {
  root: EvolutionNode;
  currentId: number;
}) => {
  const { t } = useTranslation();
  const style = chainScale(treeDepth(root));

  if (root.children.length === 0) {
    return (
      <div
        style={style}
        className="@container flex flex-col items-center gap-4 md:flex-row md:justify-center md:gap-6"
      >
        <NodeCard node={root} currentId={currentId} />
        <p className="text-xs text-gray-500">{t("evolution.none")}</p>
      </div>
    );
  }

  return (
    // A box that scrolls on one axis clips the other, so the 10px a tile lifts
    // on hover was being cut off at the top edge. The padding is the room to
    // lift into; the negative margin puts the row back where it was drawn.
    <div style={style} className="@container -mt-3 overflow-x-auto pt-3">
      {/* `w-fit` + auto margins centre the chain while it fits, and collapse to
          a left-aligned scroll if a deeper chain than the games ship ever
          bottoms out the clamp. */}
      <div className="md:mx-auto md:w-fit">
        <Branch node={root} currentId={currentId} />
      </div>
    </div>
  );
};

/**
 * Renders one node and its branches recursively — Eevee splits eight ways and
 * Wurmple's halves each split again, so depth and width are both open-ended.
 */
const Branch = ({
  node,
  currentId,
}: {
  node: EvolutionNode;
  currentId: number;
}) => (
  <div className="flex flex-col items-center gap-4 md:flex-row md:gap-[var(--evo-gap)]">
    <NodeCard node={node} currentId={currentId} />
    {node.children.length > 0 && (
      <div className="flex flex-col gap-6 md:gap-8">
        {node.children.map((child) => (
          <div
            key={child.name}
            className="flex flex-col items-center gap-4 md:flex-row md:gap-[var(--evo-gap)]"
          >
            <Step condition={child.condition} />
            <Branch node={child} currentId={currentId} />
          </div>
        ))}
      </div>
    )}
  </div>
);

const Step = ({ condition }: { condition: EvolutionDetail | null }) => {
  const describe = useEvolutionCondition();
  const label = condition ? describe(condition) : "";

  return (
    <div className="flex w-28 shrink-0 flex-col items-center gap-2 text-center md:w-[var(--evo-step)]">
      {/* ASCII arrows: the pixel font carries no glyph for the real ones. */}
      <span aria-hidden="true" className="text-lg text-gray-400 md:hidden">
        v
      </span>
      <span aria-hidden="true" className="hidden text-lg text-gray-400 md:inline">
        {">"}
      </span>
      {label && (
        <span className="text-[10px] leading-relaxed text-gray-600">
          {label}
        </span>
      )}
    </div>
  );
};

/**
 * Shared between the linked tiles and the un-clickable current one. The border
 * slot is always there, transparent when nothing is using it, so switching era
 * or hovering never moves a tile by two pixels.
 */
const TILE = "w-48 shrink-0 border-2 p-3 text-center md:w-[var(--evo-tile)]";

const NodeCard = ({
  node,
  currentId,
}: {
  node: EvolutionNode;
  currentId: number;
}) => {
  const location = useLocation();
  const { era } = useEra();
  const isCurrent = node.id === currentId;
  const isSprite = era.sprites !== "artwork";

  // Retro marks the line the way a Game Boy menu did, because the yellow fill
  // has nothing left to fill: the sprite brings its own opaque white panel and
  // the colour survives only as a rim around it. So the rim becomes the mark —
  // dashed, in the app's red — and the name takes the menu cursor. Hovering a
  // link dashes it in black instead of flooding it yellow, which would fight
  // the white panel the same way.
  const currentTile = isSprite
    ? "border-dashed border-[#E12025] bg-[#EAEBF2]"
    : "border-transparent bg-[#FECB09]";
  const linkTile = isSprite
    ? "border-dashed border-transparent bg-[#EAEBF2] hover:border-black/50"
    : "border-transparent bg-[#EAEBF2] hover:bg-[#FECB09]";

  const body = (
    <>
      {/* Fixed aspect box reserves the space before the picture lands. Gen I and
          II sprites are opaque — white background baked in, no alpha at all —
          so on a coloured tile they would show as a white square with a seam.
          Giving them the white panel outright turns that into a screen. */}
      <div className={`aspect-square ${isSprite ? "bg-white p-2" : ""}`}>
        <img
          src={spriteUrlById(node.id, era.sprites)}
          alt={node.name}
          loading="lazy"
          className={`h-full w-full object-contain ${
            isSprite ? "[image-rendering:pixelated]" : ""
          }`}
        />
      </div>
      <p className="mt-2 text-xs capitalize leading-relaxed break-words md:text-[length:var(--evo-name)]">
        {/* The same `>` the battle screen's menu uses — `aria-current` already
            says this to a screen reader, so it is decoration. */}
        {isSprite && isCurrent && (
          <span aria-hidden="true" className="mr-1 text-[#E12025]">
            {">"}
          </span>
        )}
        {node.name}
      </p>
    </>
  );

  if (isCurrent) {
    return (
      <div aria-current="page" className={`${TILE} ${currentTile}`}>
        {body}
      </div>
    );
  }

  return (
    <Link
      to={`/pokemon/${node.name}`}
      // Carries the list origin forward, so "Back to list" still lands on the
      // page and scroll position the user actually came from.
      state={location.state}
      className={`${TILE} ${linkTile} hover:translate-y-[-10px]`}
    >
      {body}
    </Link>
  );
};
