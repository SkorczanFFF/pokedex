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
