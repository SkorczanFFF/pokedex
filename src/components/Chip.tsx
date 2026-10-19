import type { ReactNode } from "react";
import { chipClass, type ChipKind } from "./chips";

/** One option in a row of them; the row's kind is its colour. */
export const Chip = ({
  kind,
  active,
  onClick,
  label,
  children,
}: {
  kind: ChipKind;
  active: boolean;
  onClick: () => void;
  /** Spoken, and shown on hover, where the text alone is terse — a numeral. */
  label?: string;
  children: ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    title={label}
    aria-label={label}
    className={chipClass(kind, active)}
  >
    {children}
  </button>
);

/** A row of chips that answers one question, named for a screen reader. */
export const ChipRow = ({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) => (
  <div role="group" aria-label={label} className={`flex flex-wrap gap-1 ${className}`}>
    {children}
  </div>
);
