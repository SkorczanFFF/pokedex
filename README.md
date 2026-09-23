# Pokédex

A React 19 app built with Vite and Tailwind 4 that fetches data from the Pokémon API.

## Installation

```bash
git clone https://github.com/SkorczanFFF/pokedex
npm install
npm run dev
```

## Build

```bash
npm run build
```

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

- Dockerized on VPS: [https://pokedex.skoftware.pl/](https://pokedex.skoftware.pl/)
- Vercel: [https://pokedex-pl.vercel.app/](https://pokedex-pl.vercel.app/)
