import { useId, useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTypeChart } from "@/api/useTypeChart";
import { useEra } from "@/app/era/context";
import { InlineError } from "@/components/ErrorView";
import { GbBox } from "@/components/layout";
import { abilityInEra, abilityRule } from "@/domain/abilities";
import { Profile } from "@/features/versus";
import type { Pokemon } from "@/types/pokemon";

/** How close the bubble may come to the window's edge, and its point to the bubble's. */
const EDGE = 16;

interface Placement {
  /** The bubble's left edge, from the button's. */
  left: number;
  /** The point's middle, from the bubble's left edge. */
  tail: number;
  above: boolean;
}

/** A button that opens, on hover or click, every type of the era against this Pokémon. */
export const TypesAgainst = ({ pokemon }: { pokemon: Pokemon }) => {
  const { t } = useTranslation();
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);
  const [place, setPlace] = useState<Placement>({ left: 0, tail: 0, above: false });
  const panel = useRef<HTMLDivElement>(null);
  const id = useId();
  const open = hovered || clicked;

  // Moved left as far as it takes to stay on screen, and above the button when
  // there is more room there; again whenever the list changes size.
  useLayoutEffect(() => {
    const box = panel.current;
    const anchor = box?.parentElement;
    if (!open || !box || !anchor) return;
    const fit = () => {
      const button = anchor.getBoundingClientRect();
      const { clientWidth, clientHeight } = document.documentElement;
      const width = box.offsetWidth;
      const left = Math.max(EDGE - button.left, Math.min(0, clientWidth - EDGE - width - button.left));
      const below = clientHeight - button.bottom;
      setPlace({
        left,
        tail: Math.min(Math.max(button.width / 2 - left, EDGE), width - EDGE),
        above: box.offsetHeight > below && button.top > below,
      });
    };
    const observer = new ResizeObserver(fit);
    observer.observe(box);
    return () => observer.disconnect();
  }, [open]);

  return (
    <div
      className="relative"
      // Mouse only: a tap's emulated hover would outlast the second tap.
      onPointerEnter={(e) => {
        if (e.pointerType === "mouse") setHovered(true);
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === "mouse") setHovered(false);
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setClicked(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          setClicked(false);
          setHovered(false);
        }
      }}
    >
      <button
        type="button"
        onClick={() => setClicked((was) => !was)}
        aria-expanded={open}
        aria-controls={id}
        className="cursor-pointer border-2 border-dashed border-black bg-white px-3 py-1 text-xs hover:bg-dex-yellow aria-expanded:bg-dex-yellow"
      >
        {t("details.typesAgainst")}
      </button>
      {/* Padding rather than a margin, so the mouse crosses no gap on its way in; the point sits in it. */}
      {open && (
        <div
          ref={panel}
          id={id}
          style={{ left: place.left }}
          className={`absolute z-20 w-max max-w-[calc(100vw-2rem)] ${
            place.above ? "bottom-full pb-4" : "top-full pt-4"
          }`}
        >
          <GbBox>
            <AgainstList pokemon={pokemon} />
          </GbBox>
          <Tail x={place.tail} above={place.above} />
        </div>
      )}
    </div>
  );
};

/**
 * The bubble's point, towards the button: a black triangle, and a white one inside it over
 * the frame. Each runs 2px past its edge, into the black frame and the white box, so no
 * rounding on a phone's screen opens a seam between point and bubble.
 */
const Tail = ({ x, above }: { x: number; above: boolean }) => {
  const [frame, fill] = above
    ? ["bottom-1 border-t-[14px] border-t-black", "bottom-2.5 border-t-[12px] border-t-white"]
    : ["top-1 border-b-[14px] border-b-black", "top-2.5 border-b-[12px] border-b-white"];
  const at = "absolute -translate-x-1/2 border-x-transparent";
  return (
    <>
      <span aria-hidden="true" style={{ left: x }} className={`${at} border-x-[14px] ${frame}`} />
      <span aria-hidden="true" style={{ left: x }} className={`${at} border-x-[12px] ${fill}`} />
    </>
  );
};

/** Mounted on open, so the type requests go out then. */
const AgainstList = ({ pokemon }: { pokemon: Pokemon }) => {
  const { t } = useTranslation();
  const { era } = useEra();
  const { chart, error } = useTypeChart(era.maxGen);

  if (error) return <InlineError>{t("error.types")}</InlineError>;
  if (!chart) return <p className="text-xs text-gray-500">{t("loader.loading")}</p>;

  return (
    <Profile
      chart={chart}
      pokemon={pokemon}
      abilities={{ defender: abilityRule(abilityInEra(pokemon, era)) }}
    />
  );
};
