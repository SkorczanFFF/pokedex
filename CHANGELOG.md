# Changelog

Notable changes, newest first. A heading is either the subject of the commit that
introduced it or, where a stretch of work landed across many commits, the name of that
stretch — the refactor below is eight commits under one heading, because none of them
changed behaviour and a reader gains nothing from eight separate notes about moved code.
Each line is tagged Added / Changed / Fixed in the sense of
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versioning follows
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Short hashes are left out on purpose for now — the stat-bar commit is amended just before
this file lands, so any hash written here would already be stale. Add them at the first
release tidy-up.

This file starts here. Everything before it lives in `git log` and has not been backfilled.

## [Unreleased]

### `feat: the out-of-era notice becomes a battle screen with ??? for a sprite`

- **Changed** — The notice added in the commit below was a plain bordered box. It is the
  404 page's battle screen now: `???` where the sprite goes, which is what a Pokédex of
  the day printed for an entry it had no data on, and the two ways out drawn as a Game
  Boy menu. The panel still names the Pokémon and levels it at its own dex number —
  `GABITE :L444`, the way the 404 screen levels a 404 at 404.
- **Changed** — That screen's chrome moved to `components/BattleScreen`, so the status
  panels, Red's back sprite and the text box come from one place rather than two copies
  drifting apart. Both screens tear the same way, so the animation stayed a
  fixture rather than becoming a flag with one possible value.
- **Changed** — The message names the generation as well as the number — "Gabite is #444,
  from Gen IV". It is read from the dex id, so it costs no request: the species payload is
  the one call this page deliberately skips. Above 1025, where PokéAPI numbers the
  alternate forms, no generation can be derived and the sentence drops that clause rather
  than printing an empty one.

### `feat: a Pokémon outside the era says so, and offers the way out`

- **Added** — Opening a Pokémon the era does not cover — by link, by bookmark, or by
  switching to retro while already on it — replaces the card with a line saying so and a
  button that leaves retro. The dex scope only ever narrowed the list, the search and the
  filters, so the card was still reachable and retro ended up presenting a Pokémon it
  elsewhere insists does not exist. The card is replaced rather than annotated, and the
  way out is offered rather than described.
- **Changed** — The species request is skipped for a card that will not be shown.

### `fix: a broken species lookup no longer reads as a missing Pokémon`

- **Fixed** — When `/pokemon/{name}` returns a 404, the app retries the name as a species to
  catch the dozen Pokémon that exist only as named forms. That lookup treated every
  failure as "no such species", so an API outage produced the 404 page: the reader was
  told their Pokémon does not exist when the truth was that PokéAPI was down. Only a 404
  means that now; anything else is reported as the failure it is.

### `feat: the evolution method follows the era, not the newest game`

- **Fixed** — Evolution methods were read from the newest game that recorded one, which in
  retro explained Gen I and II evolutions with rules invented decades later — and very
  often with the rules of a *regional form* sharing the chain. Ninetales evolved with an
  Ice Stone (that is Alolan), Slowbro with a Galarica Cuff (Galarian), Electrode with a
  Leaf Stone (Hisuian), and Quilava at level 17 rather than 14. Nineteen visible steps
  across the Gen I/II chains now read correctly.
- **Fixed** — The old rule took the highest version-group id and called that the newest.
  The ids are not chronological: Colosseum and XD are Gen III but numbered after Gen V,
  and the Japanese Gen I releases land after Gen VII. Nothing in these chains happened to
  trip it, which is the worst way for an assumption to be wrong.
- **Added** — The version-group half of `domain/games.ts`. Where no recorded method
  predates the era the step shows no label at all, rather than naming rules that did not
  exist: across every Gen I/II chain that leaves none of the 108 visible steps unlabelled.

### `feat: the dex entry follows the era, instead of always quoting Red`

- **Fixed** — The Pokédex entry always came from Pokémon Red. Entries are per game and
  listed oldest first, and the code took the first English one, so Bulbasaur showed its
  1996 text in every mode out of the twenty-eight available. The era now picks the game:
  the newest it knows about, falling back to the oldest for a Pokémon that postdates the
  era, where a blank paragraph would read as a bug rather than as a fact.
- **Added** — `domain/games.ts`, mapping all fifty-three games to their generation. Read out
  of `/version-group` rather than written from memory, and needed because ids cannot stand
  in for it: Colosseum and XD are Gen III but numbered after Gen V, and the Japanese Gen I
  releases are numbered after Gen VII. Ids look chronological and are not.

### `style: a dashed frame tells the retro toggle apart from the language pair`

- **Changed** — The Retro toggle carried the same classes as EN and PL beside it, so three
  identical controls read as one group of three choices — as though Retro were a third
  language. A dashed frame marks it as the different kind of control it is. The frame
  changes colour with the state, because white dashes would vanish on the yellow the
  toggle turns when it is on.

### `feat: the details view can show any generation's sprite, era picks the default`

- **Added** — A picker under the artwork: the official art plus every generation that has a
  sprite for that Pokémon, with the era choosing which one it opens on — retro lands on
  Gen II, modern on the artwork, and either way the whole line is one click away. It costs
  nothing. The sprite tree already arrives inside every `/pokemon` response and was being
  discarded; a Pokémon's visual history was one render away rather than one request per
  generation.
- **Changed** — The picture sits in a square the size of the artwork, with each sprite
  centred inside it, so the picker stays at one height instead of jumping every time a
  smaller sprite loads.

### `feat: the details page splits into regions, and each obeys the era`

- **Changed** — The details screen went from 257 lines to 79, one component per region.
  Those regions are also the seams the era rules needed, so each rule below landed in one
  file rather than as another branch in a long component.
- **Added** — The cry is the era's recording: retro plays PokéAPI's `legacy` file, the Game
  Boy original. Only Gen I-V have one, so anything newer keeps the modern cry rather than
  losing the button.
- **Added** — Abilities are hidden before Gen III, because they did not exist. PokéAPI
  agrees: `/generation` reports zero abilities introduced in Gen I and in Gen II, and both
  of Bulbasaur's date from Gen III. Overgrow is not a fact about the Bulbasaur of 1996.
- **Added** — Evolution chains are pruned to the era, and a dropped node hands its children
  up in its place. That re-rooting is the point rather than a detail: Gen IV slotted babies
  in front of older lines and PokéAPI roots each chain at the earliest one, so Mr. Mime's
  chain starts at Mime Jr. and Marill's at Azurill. A plain filter would have taken the
  Gen I/II Pokémon down along with its Gen IV ancestor.

### `feat: retro mode, the dex and its typings as of Gen II`

- **Added** — A Retro toggle in the navbar, remembered in `localStorage` the way the
  language is: it is a preference rather than a view, so it stays out of the URL, where it
  would have to be threaded through every card link, every evolution link and the back
  button. Reading storage is guarded — a private window throws rather than returning null.
- **Added** — The dex era itself. The app renders the world as of a generation rather than
  as of today, and every rule is a field on one table in `domain/era.ts`, so Gen I would
  cost one more entry rather than a hunt through the components. Era II caps the dex at 251
  across the list, the search and the filter lists, and narrows the generation dropdown to
  I and II.
- **Added** — Typings as of the era, read from PokéAPI's `past_types`. The thirteen Gen I/II
  Pokémon retconned into Fairy — Clefairy, Togepi, Marill, Mr. Mime and their lines — show
  what they actually shipped with. The rule is about generations rather than about one
  type, so Magnemite keeps Steel at Gen II and loses it only at Gen I. The type filter
  offers just the types that existed, and filtering by one that did not returns nothing
  rather than the unfiltered list — reachable in one click by picking Fairy and then
  switching to retro.
- **Fixed** — The modern dex is not capped at the national dex. `/pokemon` answers with 1351
  entries: the 1025 species and 326 alternate forms numbered from 10000 up. Capping at 1025
  would have quietly dropped every Mega and regional form from the list and from search.
- **Changed** — Generation boundaries were kept in two lists that had to agree by hand.
  They are one table keyed by generation now, so adding a generation without giving it a
  boundary is a compile error instead of a silent gap.

### Feature-first refactor

No behaviour changed anywhere in this stretch; the production bundle came out identical
through the moves, and the query keys, `enabled` gates and cache entries were carried over
untouched.

- **Changed** — `src/` is laid out by what a file is for rather than by what kind of file it
  is. `api/` holds transport and nothing else, `domain/` holds logic that knows neither
  React nor `fetch`, `features/list` · `features/details` · `features/not-found` hold one
  routed screen each, `components/` keeps the shared chrome, and `app/` holds the providers,
  the routes and the query client. `services/`, `utils/` and `pages/` are gone.
- **Changed** — The list screen went from 514 lines to 68. The URL state became
  `useListParams`; the three sources that can feed the list — the plain dex, the filters,
  the search box — each got a hook, with `useListData` reducing them to the one shape the
  view renders; and the markup split into `ListToolbar`, `ListStatus` and `ListResults`.
- **Changed** — The details screen went from 257 lines to 79, one component per region.
  Those regions are also the seams the era rules later needed, so each rule landed in one
  file instead of another branch in a long component.
- **Changed** — `services/pokemon.ts` split into `api/` by resource, with the selectors that
  read localized text moving to `domain/species` where choosing a language belongs.
  `api/client` now owns the base URL and the default failure policy: eight places called
  `fetch` and checked a response, now one does.
- **Changed** — Two module names each meant two things and were renamed: `domain/types`
  became `domain/pokemonTypes` to stop colliding with the TypeScript shapes in `types/`,
  and `i18n/domain` became `i18n/labels` to stop colliding with the `domain/` layer. The
  evolution-condition formatter moved out of it into `i18n/evolutionCondition`.
- **Added** — A `@/` path alias resolving to `src/`, so a feature folder reaches shared code
  without climbing three levels of `../`.
- **Removed** — Exports nothing imported, and the last two files left over from the Vite
  template. `noUnusedLocals` and eslint already cover unused imports and locals; an export
  nobody imports is the gap they leave.

### `feat: 404 page as a gen 1 battle screen, 404s told apart from API failures`

- **Added** — A 404 page laid out the way the Game Boy laid out a battle: the opponent's
  status panel facing a glitching "404", Red's original 32×32 back sprite underneath
  (`gfx/player/redb.png` from the pokered disassembly, self-hosted), and a bordered text
  box reading "A wild 404 appeared!" in English or Polish. Unknown routes and Pokémon the
  API does not have both land here.
- **Changed** — Unknown routes used to redirect silently to the list, which hid every
  broken link instead of reporting it. They now show the 404 page.
- **Fixed** — A missing Pokémon is told apart from a failed request. `getPokemonDetails`
  throws `NotFoundError` only once the API has confirmed the name does not exist, so a
  typo no longer reads as an API outage, and React Query stops retrying it twice before
  showing the page.

### `fix: cleanUrls broke the SPA rewrite, every deep link 404'd on Vercel`

- **Fixed** — Refreshing or opening any URL below the root — `/pokemon/eevee`, a shared
  link, a new tab — returned Vercel's own 404 page. `cleanUrls: true` turns
  `/index.html` into a redirect to `/` rather than a resolvable file, so the catch-all
  rewrite pointing at it had nothing to land on. Broken since `vercel.json` was added in
  `631bf07`.

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
