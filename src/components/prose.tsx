import type { ReactNode } from "react";
import { TEXT_LINK } from "./buttons";

/** A link out of the app, in a new tab. */
export const ExternalLink = ({ href, children }: { href: string; children?: ReactNode }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className={TEXT_LINK}>
    {children}
  </a>
);

export const Bullets = ({ items }: { items: readonly string[] }) => (
  <ul className="list-disc space-y-1 pl-5">
    {items.map((item) => (
      <li key={item}>{item}</li>
    ))}
  </ul>
);
