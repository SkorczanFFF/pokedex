export const PER_PAGE_OPTIONS = [20, 40, 60] as const;

export type PerPage = (typeof PER_PAGE_OPTIONS)[number];

export const DEFAULT_PER_PAGE: PerPage = 20;

export const isPerPage = (n: number): n is PerPage =>
  (PER_PAGE_OPTIONS as readonly number[]).includes(n);
