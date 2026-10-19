export const PER_PAGE_OPTIONS = [20, 40, 60] as const;

export type PerPage = (typeof PER_PAGE_OPTIONS)[number];

export const DEFAULT_PER_PAGE: PerPage = 20;

export const isPerPage = (n: number): n is PerPage =>
  (PER_PAGE_OPTIONS as readonly number[]).includes(n);

/** Where a page starts in a list counted from zero; pages are counted from one. */
export const pageOffset = (page: number, perPage: number): number =>
  (page - 1) * perPage;

/** One page out of a whole list. */
export const pageSlice = <T>(items: readonly T[], page: number, perPage: number): T[] =>
  items.slice(pageOffset(page, perPage), pageOffset(page, perPage) + perPage);

/** How many pages a list makes. */
export const pageCount = (total: number, perPage: number): number =>
  Math.ceil(total / perPage);
