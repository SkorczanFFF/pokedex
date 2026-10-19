# Pokédex

A React 19 app built with Vite and Tailwind 4 that fetches data from the Pokémon API.
Two eras: the modern dex of 1025, and a retro one that stops at Crystal's 251 and reads
every type, stat, move and encounter as the Gen II games had it.

## Installation

```bash
git clone https://github.com/SkorczanFFF/pokedex
npm install
npm run dev
```

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run check` | Everything below in one go: `tsc -b`, `eslint .`, `vitest run`, `knip` |
| `npm run lint` | ESLint, including the import boundaries between layers |
| `npm test` / `npm run test:watch` | Vitest over `src/**/*.test.ts` |
| `npm run knip` | Unused files, exports and dependencies |
| `npm run build` | Type-check and production build |
| `node scripts/gen-ability-keys.mjs` | Lists which ability slugs still lack a Polish name |

## Structure

```
src/
  types/       PokéAPI payload shapes, nothing else
  domain/      Pure rules: the era, damage, the type chart, learnsets, sprites — no React
  api/         The fetchers and the React Query options for every resource
  i18n/        Locale tables, the label hooks that turn a slug into a word
  media/       Cries, the read-aloud voice, GIF parsing, sprite bounds
  app/         Routes, the era provider, the query client, the links the app points at
  components/  Shared UI: badges, chips, the Game Boy boxes, loaders and error screens
  features/    One folder per page — list, details, encounters, types, versus, about, not-found —
               plus `shared/` for the hooks several pages use
```

Each layer imports only from the ones below it; `eslint.config.js` spells the rule out and
fails the lint on a shortcut. A feature reaches another feature only through that feature's
`index.ts`.

## Conventions

- The era is a table of rules (`domain/era.ts`); components ask it questions and never test
  for retro by name.
- Every query is declared once in `api/queries.ts` with `queryOptions`; nothing builds a
  query key inline.
- Routes and their parameters are named once in `app/routes.ts`.
- Colours and the navbar's height are Tailwind tokens in `src/index.css`.
- Commits are a single lowercase line, `type: what changed`, and each stretch of work gets
  a note in `CHANGELOG.md`.

## Credits

Data comes from [PokéAPI](https://pokeapi.co/). PokéAPI writes its text in fourteen
languages and Polish is not one of them, so the Polish move names, move descriptions and
Pokédex entries in `src/i18n/locales/pl` were taken from
[Pokémon Wiki PL](https://pokemon.fandom.com/pl), which publishes under
[CC BY-SA](https://www.fandom.com/licensing).

The read-aloud voice is [eSpeak](https://espeak.sourceforge.net/) running in the browser
through [meSpeak](https://www.masswerk.at/mespeak/) (npm `mespeak`), both under the
[GNU GPL](https://www.gnu.org/licenses/gpl-3.0.html).

## Deployments

- VPS: [https://pokedex.skoftware.pl/](https://pokedex.skoftware.pl/)
- Vercel: [https://pokedex-pl.vercel.app/](https://pokedex-pl.vercel.app/)
