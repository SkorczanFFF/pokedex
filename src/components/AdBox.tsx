import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { MenuCursor } from "./BattleScreen";

/**
 * A small ad for another page, in the Gen II frame: a black line, a white one,
 * a black one. The whole box is the link; `label` says what it is for, since
 * the box has no room to print it.
 */
export const AdBox = ({
  to,
  label,
  children,
}: {
  to: string;
  label: string;
  children: ReactNode;
}) => (
  <Link
    to={to}
    title={label}
    aria-label={label}
    className="group block border-2 border-black bg-white p-0.5"
  >
    <span className="flex items-center gap-2 border-2 border-black px-2 py-2 md:gap-3 md:px-3">
      {children}
    </span>
  </Link>
);

/** Lettered like Pokémon Stadium's box: the logo's yellow and blue over a bigger red word. */
export const StadiumTitle = ({ children }: { children: ReactNode }) => (
  <span aria-hidden="true" className="block leading-tight">
    <span className="block text-[8px] tracking-widest text-dex-yellow [filter:drop-shadow(1px_0_0_var(--color-dex-blue))_drop-shadow(-1px_0_0_var(--color-dex-blue))_drop-shadow(0_1px_0_var(--color-dex-blue))_drop-shadow(0_-1px_0_var(--color-dex-blue))] md:text-[10px]">
      POKÉMON
    </span>
    <span className="block text-sm uppercase tracking-wider text-dex-red [filter:drop-shadow(2px_2px_0_#000)] md:text-base">
      {children}
    </span>
  </span>
);

/** The line under the art: the menu cursor, lit with the line when the box is hovered. */
export const AdAction = ({ children }: { children: ReactNode }) => (
  <span className="mt-2 block text-[10px] group-hover:text-dex-red">
    <MenuCursor /> {children}
  </span>
);
