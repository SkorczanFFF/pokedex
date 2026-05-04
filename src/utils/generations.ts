export const GEN_SLUGS = [
  "i",
  "ii",
  "iii",
  "iv",
  "v",
  "vi",
  "vii",
  "viii",
  "ix",
] as const;

export type GenSlug = (typeof GEN_SLUGS)[number];

export const isGenSlug = (s: string | null): s is GenSlug =>
  s !== null && (GEN_SLUGS as readonly string[]).includes(s);

export const genApiName = (slug: GenSlug): string => `generation-${slug}`;

export const formatGen = (slug: GenSlug | string): string => {
  const raw = slug.replace(/^generation-/, "");
  return `Gen ${raw.toUpperCase()}`;
};
