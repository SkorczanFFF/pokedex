/**
 * Dev-only helper. Not part of the build.
 *
 *   node scripts/gen-ability-keys.mjs
 *
 * Fetches every ability slug from PokéAPI and writes scripts/abilities.todo.json,
 * a reference listing each slug alongside its humanized English label and whether
 * src/i18n/locales/pl/abilities.json already translates it.
 *
 * PokéAPI serves no Polish (its /language list has no `pl`), and Pokémon was never
 * officially localised to Polish, so those translations are ours. Only genuinely
 * translated entries belong in abilities.json — anything absent falls back to the
 * humanized English label at render time, so partial coverage always ships safely.
 */
import { writeFileSync, readFileSync } from "node:fs";

const humanize = (slug) =>
  slug
    .split("-")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");

const res = await fetch("https://pokeapi.co/api/v2/ability?limit=1000");
if (!res.ok) throw new Error(`PokéAPI returned ${res.status}`);
const { results } = await res.json();

const pl = JSON.parse(
  readFileSync(new URL("../src/i18n/locales/pl/abilities.json", import.meta.url), "utf8")
);

const rows = results.map(({ name }) => ({
  slug: name,
  en: humanize(name),
  pl: pl[name] ?? null,
}));

writeFileSync(
  new URL("./abilities.todo.json", import.meta.url),
  JSON.stringify(rows, null, 2) + "\n"
);

const done = rows.filter((r) => r.pl).length;
console.log(`${results.length} abilities — ${done} translated, ${results.length - done} pending`);
