import type { ReactNode } from "react";

/** The Gen I text box: a thick black frame on white, with room inside. */
export const GbBox = ({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) => (
  <div className={`border-4 border-black bg-white p-4 md:p-6 ${className}`}>
    {children}
  </div>
);

/**
 * The column the Game Boy screens share — Versus, the type chart, About: the
 * title, a grey line under it, and the width the modern type chart comes to
 * (`--container-gb-screen`), so the boxes on every screen stand on the same
 * edges. `fit` shrinks the column instead to the widest thing on it that
 * cannot wrap — on the chart page, the table: the retro chart is one cell
 * narrower, and the notes and the ad under it follow its edges. The dex
 * pages, which are grids of cards, use `PageContainer`.
 */
export const Screen = ({
  title,
  intro,
  fit = false,
  children,
}: {
  title: string;
  intro: string;
  fit?: boolean;
  children: ReactNode;
}) => (
  <div
    className={`mx-auto px-4 py-8 ${fit ? "w-min max-w-full" : "w-full max-w-gb-screen"}`}
  >
    <h1 className="mb-3 text-2xl">{title}</h1>
    <p className="mb-6 text-xs leading-relaxed text-gray-500">{intro}</p>
    {children}
  </div>
);

/** A page's column: centred, padded, and no wider than the dex needs. */
export const PageContainer = ({ children }: { children: ReactNode }) => (
  <div className="container mx-auto px-4 pt-8 lg:max-w-7xl pb-12">{children}</div>
);

/** A white card with a heading, under the page's first card. */
export const SectionCard = ({
  title,
  subtitle,
  children,
}: {
  title: string;
  /** A line under the heading, in the small grey the dex uses for provenance. */
  subtitle?: ReactNode;
  children: ReactNode;
}) => (
  <section className="bg-white p-6 mt-6">
    <h2 className={`text-lg ${subtitle ? "mb-2" : "mb-6"}`}>{title}</h2>
    {subtitle && <p className="text-xs text-gray-500 mb-6">{subtitle}</p>}
    {children}
  </section>
);

/** A dashed box where a list would be, saying why it is not. */
export const EmptyState = ({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) => (
  <div className={`border border-dashed border-gray-300 p-8 text-center ${className}`}>
    {children}
  </div>
);
