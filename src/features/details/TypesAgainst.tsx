import { useId, useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTypeChart } from "@/api/useTypeChart";
import { useEra } from "@/app/era/context";
import { InlineError } from "@/components/ErrorView";
import { GbBox } from "@/components/layout";
import { abilityInEra, abilityRule } from "@/domain/abilities";
import { Profile } from "@/features/versus";
import type { Pokemon } from "@/types/pokemon";

/** How close the popup may come to the window's edge. */
const EDGE = 16;

/** A button that opens, on hover or click, every type of the era against this Pokémon. */
export const TypesAgainst = ({ pokemon }: { pokemon: Pokemon }) => {
  const { t } = useTranslation();
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);
  const [left, setLeft] = useState(0);
  const panel = useRef<HTMLDivElement>(null);
  const id = useId();
  const open = hovered || clicked;

  // Moved left as far as it takes to stay on screen, again whenever the list changes size.
  useLayoutEffect(() => {
    const box = panel.current;
    const anchor = box?.parentElement;
    if (!open || !box || !anchor) return;
    const fit = () => {
      const from = anchor.getBoundingClientRect().left;
      const room = document.documentElement.clientWidth - EDGE - box.offsetWidth;
      setLeft(Math.max(EDGE - from, Math.min(0, room - from)));
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
      {/* Padding rather than a margin, so the pointer crosses no gap on its way in. */}
      {open && (
        <div
          ref={panel}
          id={id}
          style={{ left }}
          className="absolute top-full z-20 w-max max-w-[calc(100vw-2rem)] pt-2"
        >
          <GbBox>
            <AgainstList pokemon={pokemon} />
          </GbBox>
        </div>
      )}
    </div>
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
