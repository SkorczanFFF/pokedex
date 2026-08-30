# Changelog

Notable changes, newest first, grouped under the commit that introduced them — the commit
subject is the heading, so every line here traces back through `git log --oneline`. Each
line is tagged Added / Changed / Fixed in the sense of
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versioning follows
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Short hashes are left out on purpose for now — the stat-bar commit is amended just before
this file lands, so any hash written here would already be stale. Add them at the first
release tidy-up.

This file starts here. Everything before it lives in `git log` and has not been backfilled.

## [Unreleased]

### `refactor: stat value centred on the bar, split at the fill edge with clip-path`

- **Changed** — Stat bars on the detail page. The value moved out of its own column and
  onto the bar itself, centred, with the bar 16px → 20px tall. The number is drawn twice
  and clipped at the edge of the fill, so it reads white over the filled part and black
  over the empty track, splitting mid-character when it lands on the boundary.

### `feat: evolution chain on pokemon details`

- **Added** — Evolution chain section on the Pokémon detail page. Renders the whole line
  including branches — Eevee's eight, Tyrogue's three, Wurmple's split — and labels every
  step with the condition that triggers it: level, evolution stone, trade, friendship,
  time of day, held item, known move type, party member and the rest, in both English and
  Polish. Artwork is derived from the species id carried in the chain response, so the
  entire section costs one request.
- **Fixed** — Species that exist only as named forms — `wormadam`, `lycanroc`,
  `toxtricity`, `urshifu`, `maushold` and around ten more — used to 404 on
  `/pokemon/{name}`. Their default variety is now resolved and retried, so evolution links
  to them work and they no longer drop silently out of generation-filtered lists.
- **Changed** — Search and cry buttons use ASCII glyphs (`>`) in place of the SVG
  magnifier and `▶`, which the pixel font has no glyphs for.
- **Changed** — Polish label for the Rock type is now "Kamienny" (was "Skalny").
