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

### `feat: the stat bars carry the era's own numbers`

- **Fixed** — The bars were the last place the app still printed today's numbers in a retro
  frame. Pikachu defended at 30 and took special hits at 40 until Gen VI raised both; retro
  showed the raised ones. It was written down as a limit — PokéAPI exposed one `stats`
  array and the note said to accept it or drop the bars rather than pretend — and the API
  has since grown `past_stats`, in the payload the page already fetches.
- **Added** — `statsInEra`, which reads the way `typesInEra` does with one difference that
  decides its shape: a `past_stats` entry lists only the stats that changed, so several can
  cover one era at once and every stat has to find its own earliest covering entry. Pikachu
  at era I takes its Special from the Gen I entry and its Defence from the Gen V one,
  because 30 Defence stood from the beginning until Gen VI.
- **Added** — Gen I's single Special, given by the API rather than approximated. The old
  note here said it would have to be guessed from Sp. Atk and labelled as such; the
  `generation-i` entries carry a `special` stat outright — Pikachu 50, Alakazam 135,
  Magikarp 20 — and it replaces the split pair where Gen I printed it, after Defence and
  before Speed. Five bars rather than six. Era I is not a choice in the navbar yet, so this
  was verified against a third era added temporarily and taken back out.
- **Checked** — Twenty of thirty-two Gen I/II Pokémon sampled carry an entry. Alakazam
  holds 85 Special Defence in retro against today's 95; Bulbasaur reads the same in both
  eras, because its only entry is Gen I's Special and era II does not reach back that far.

### `feat: where a Pokémon is met, as the era's games have it`

- **Added** — A page at `/pokemon/:name/encounters`, which is PokéAPI's own shape for the
  same question. In retro it answers the way the games did: Pikachu in Viridian Forest at
  5% in Red and Blue, in the Power Plant at 25%, handed over in Pallet Town in Yellow, on
  Route 2 in Gold and Silver by morning, day or night, and sold at the Celadon prize
  corner for 2222 coins in Crystal — or 620 in the Japanese Blue.
- **Added** — A game picker over it. "Which game" is the question a reader arrives with, so
  the chips list every title in the era this Pokémon is met in and the rows collapse the
  ones that agree: Red, Blue and both Japanese releases share a line wherever they share
  the numbers.
- **Added** — A link in the details header, shown only when the era has somewhere to show.
  About a third of the Gen I/II dex is never met in the wild — the evolved halves of
  lines, Crobat and Ampharos and Typhlosion — and a link onto an empty page is worse than
  no link, so the details page pays for the request and the page it leads to finds it
  cached. Typically two to four kilobytes; Magikarp, the worst in the dex, is 9.4 kB.
- **Fixed before it shipped** — `max_chance` cannot be displayed. It adds up slots across
  conditions that exclude one another, so Zubat's Dark Cave reads 132% in Crystal and
  Pikachu's Route 2 reads 15% where a player meets him 5% of the time. Rates are summed
  inside one set of conditions instead, which is the only sum that means anything, and
  the conditions that share a rate become one line: "5%, morning · day · night".
- **Added** — Places run oldest game first rather than in PokéAPI's order, which for
  Magikarp opens in Sinnoh. Within a game the API's own order is the map's, so Route 29
  still comes before Route 30.
- **Added** — Dictionaries for how a Pokémon is met and what it takes — walking, the three
  rods, headbutting a tree, a swarm, the radio off, the Bug-Catching Contest. Two of these
  carry a value rather than a name: `coins-2222` and `trade-pikachu` are read as the price
  and the trade they are, instead of humanizing into "Coins 2222".
- **Added** — Polish plural forms, because "62 miejsc" is wrong where "62 miejsca" is right
  and the language has three plurals rather than one.
- **Known limit** — Location names are derived from the slug:
  `kanto-route-2-south-towards-viridian-city` becomes "Route 2 South Towards Viridian
  City" with a Kanto badge. PokéAPI does spell it properly, at one request per area — and
  Magikarp is found in seventy-four of them in the Gen II games alone, so the slug it is.

### `feat: the details page steps to the Pokémon either side of it`

- **Added** — Previous and next, beside the button back to the list. Reading the dex in
  order meant returning to the grid and finding the following card; the two steps are on
  the entry itself now.
- **Added** — And the route stays written in names. A details payload knows its own id but
  nothing about what surrounds it, so the neighbours have to be asked for — `/pokemon` is
  ordered by id and its offsets are that order, so `?limit=3&offset={id - 2}` hands back the
  entry before, the entry itself and the entry after, names and all. It is 142 bytes over
  the wire against the 11.5 kB of the whole catalogue that search keeps under
  `allPokemonNames`, which was the alternative: a hundredth of the cost, on a page most
  readers never step away from.
- **Added** — The era decides where the dex ends. `lastDexId(era.maxGen)` is the ceiling, so
  retro stops at Celebi instead of walking on into Treecko, while the modern dex runs to
  Pecharunt. One bound does both that job and the next one.
- **Changed** — Form variants get no steps. PokéAPI orders `deoxys-attack` after
  `pecharunt` because it numbers it 10001, not because anything follows the national dex, so
  a form is a place you can arrive at and not a place you can step through. Their ids are
  above every era's ceiling, so the same comparison that stops retro at Celebi excludes them
  — and nothing is requested for them, nor drawn: two boxes that will never do anything are
  worse than no row.
- **Added** — The window is read back by id, pulled out of each entry's URL, rather than by
  position. If that ordering ever shifts, a button goes missing; it never points at the
  wrong Pokémon.
- **Added** — Whether a step exists is known from the id before any name arrives, so the row
  is drawn at its final size immediately and only the words land late. One dead end is a
  dimmed box rather than nothing, the way the list's pagination already disables rather than
  hides: an absent button at Bulbasaur would slide "next" under a pointer aimed at it.
- **Added** — `dexPrev` and `dexNext`, in both locales. A step shows a chevron and a name,
  which a screen reader would read out as "< ivysaur" — neither a direction nor a reason for
  the name to be there. The chevron is hidden from the accessibility tree and the link
  carries "Previous: Ivysaur" instead, hand-translated like every other label here.
- **Added** — The same two steps again at the foot of the entry, above the footer. An entry
  runs long — the move list alone is ninety rows for Mewtwo — so by the time the evolution
  line is on screen the row at the top is a scroll away, and a reader who reached the bottom
  is the one who is done and moving on. It is centred rather than pushed right, there being
  no back button down there holding the other side of the row. Both copies ask the same
  query key, so the second one costs no request: two observers on one key resolve to a
  single fetch and a single cache entry.
- **Changed** — The back button gives up its bottom margin to the row that now holds it.
  Narrow, that row stacks and the steps centre under the button — a column rather than a
  wrapped row, because `justify-content` applies to a whole flex line and a wrapped row
  cannot start its first line and centre its second. From `md` both fit on one line, the
  button keeping the left and the steps the right.

### `feat: a move's source keeps one colour, in the list and in the panel`

- **Added** — Where a move comes from is now a colour, and the same colour in both columns.
  Five open panels were five identical boxes distinguished by ten grey pixels under the
  name, and five picked rows were five identical blue bars, so neither column said which
  section a move belonged to. A source owns a colour and spends it on the square beside its
  heading, the wash a row takes under the pointer, the fill it takes once open, and — across
  the gutter — the bar and wash of the panel that row opened. Picking between an egg move
  and a machine no longer means reading either.
- **Added** — The palette is the machine's own. Crystal ran on a Game Boy Color, which mixes
  five bits to a channel — thirty-two steps, not two hundred and fifty-six — so every value
  lands on that grid and is written in `moves.ts` with the RGB555 triple it came from. A Gen
  II Pokémon is drawn from four colours of which two are black and white, leaving it two of
  its own, and each source is dressed the same way: `RGB 6, 18, 31` over `RGB 2, 9, 22` for
  levelling, `5, 25, 4` over `2, 12, 2` for eggs, `31, 12, 0` over `19, 6, 0` for the
  machines, `22, 8, 31` over `13, 0, 20` for tutors.
- **Added** — The two shades split by job rather than by place. The bright one is every
  graphic — square, open row, bar, both washes — and the dark one is text and nothing else,
  which is the only reason it exists: ten pixels of `#29CE21` on a wash of itself is 1.9:1
  and unreadable, against 6.8:1 for its dark partner. A bar has no such floor, because what
  it says is said in words on the line below it, so it takes the bright shade and eight
  pixels of width to carry the weight a dark four was carrying.
- **Added** — A heading over the level-up group, which never had one. It is the list the
  section is about, but every heading now carries the square that teaches its colour, and
  without one the blue would be the single colour the page never names.
- **Changed** — A picked row wears its own group's colour instead of the one `#356DB2` every
  section shared. The blue that meant "chosen" here now means levelling, and lives on beside
  it in the stat bars, the HP bar and the sprite picker, where nothing has changed.
- **Changed** — An open row carries black text rather than white. These are a Game Boy
  Color's brights and white sits at 2.1:1 on the green; black is 5.2 to 9.9:1 across the
  four, which is the same reason the yellow buttons and the Electric badge already carry it.
- **Changed** — An opened move sits on a twelve-percent wash of its source's colour rather
  than on `bg-gray-50`, and never on a filled chip of it: that is what a _type_ looks like
  two lines below, and a second one would be read as another type.
- **Changed** — The rule down the side of the sentence a game printed takes the source's
  colour as well, four pixels against the frame's eight — the bar says which section a move
  came from, the rule only says the words are the game's own. It was `border-gray-300`,
  which left a grey hairline as the one uncoloured line inside a panel with a bright one
  down its edge. `MoveDetails` is told the source for this and nothing else; it still does
  not draw the frame around itself.
- **Added** — Grey for anything outside the four. PokéAPI carries a dozen more methods —
  `train` for Pokémon Champions, the Stadium and XD oddities — and they keep the grey they
  had rather than borrow a colour whose meaning no heading on the page teaches.

### `feat: the era picks the picture, on the list and in the evolution line`

- **Added** — Retro shows the dex in its own sprites. The list and the evolution line were
  still handing out modern 475-square renders of Pokémon that never looked like that; both
  now open on the Gen II sprite, the same one the details view has been opening on.
- **Added** — It costs no request and saves the download. The sprite tree rides in the
  `/pokemon` payload the grid already fetches for the types, and measured over the wire the
  official artwork averages 132.6 kB a card against the Crystal sprite's 0.5 kB — a page of
  twenty goes from 2.65 MB to 9.3 kB.
- **Added** — `spriteUrlById`, because an evolution chain hands back species URLs and no
  payload to ask. Every picture in the line stays derived from the id rather than fetched,
  whichever set the era wants. It cannot tell a missing sprite from a present one, so it is
  only safe where the era bounds the ids: retro stops at 251, and all 251 were checked to
  have a Crystal sprite.
- **Fixed** — Gen I and II sprites are opaque. The white background is baked in — zero
  transparent pixels, against 65% for the artwork — which the white list card hid and a
  coloured evolution tile did not: a white square with a seam around it. The tiles hand the
  sprite that white panel deliberately now, so it reads as a screen rather than as a bug.
- **Changed** — In retro the current node in the line is a red dashed frame carrying the
  battle screen's `>` cursor, rather than a yellow fill. Behind an opaque sprite the fill
  had nothing left to fill and survived only as a rim, so the rim became the mark. Hovering
  a link dashes it black for the same reason, instead of flooding it yellow.
- **Fixed** — A tile lifted ten pixels on hover and lost its top edge. The chain scrolls
  sideways, and a box that scrolls on one axis clips the other; it now carries the room to
  lift into, put back where it was drawn with a matching negative margin.
- **Fixed** — On the list the sprite is inset. Artwork leaves its corners empty and a sprite
  fills its canvas to the edge, so Charizard's wing was landing under the generation badge.

### `feat: a move opens to its numbers and the words its game printed`

- **Added** — Every move row opens onto what the move actually is: its type, whether it is
  physical, special or a status move, and its power, accuracy and PP. The list said what a
  Pokémon learns and at what level; it said nothing about whether learning it was worth
  the levels.
- **Added** — The sentence the game itself printed about the move, in that game's words.
  Crystal describes Thunderbolt as "An attack that may cause paralysis."; Scarlet and
  Violet spend two sentences on the same move. The alternative was PokéAPI's
  `effect_entries`, which read like a wiki rather than like a Pokédex — and whose first
  entry is French for Thunderbolt, so any of it has to be picked by language, never by
  index. The text is English-only, and carries the same EN badge the species entries do.
- **Added** — Era-correct numbers, from `past_values` and read exactly the way
  `past_types` already is: each entry holds what stood _through_ the version group it
  names. Thunderbolt is 95 power in retro and 90 in the modern dex; Thunder 120 against
  110. All off one payload, so switching era re-derives an open panel without fetching
  anything — at the new level, because Thunderbolt also moved from 26 to 36.
- **Added** — On a wide screen a move opens _beside_ the list rather than inside it. The
  rows stay where they were, the numbers get the room to be read as numbers rather than as
  one line of chips, and the panel follows the list down, because the machines run to
  ninety rows and a move picked at the top would otherwise be scrolled away from. Below
  `lg` there is no second column, so it opens under its own row.
- **Added** — As many moves open at once as a reader wants, because the question a move
  list is asked is which of two to teach. The panels stack in list order, which is what
  makes them comparable: each puts its Power in the same place, so two of them read down a
  column — Thunderbolt's 95 over Thunder's 120, and 100 accuracy over 70.
- **Added** — One request per move, and only on the click that opens it. `/move/{name}` is
  around 50 kB of JSON — half of it a list of every Pokémon that learns the move, which
  nothing here reads — but it arrives brotli-compressed at roughly 5.5 kB, and PokéAPI has
  no way to ask for fewer fields. A details page therefore still costs its usual three
  requests until somebody wants a particular move, and each move that does get opened is
  held for the session, because a move does not change between two clicks.
- **Added** — A `damageClasses` dictionary, hand-translated like the types and abilities
  before it: three labels, and `humanize()` behind them as everywhere else.

### `feat: the moves a Pokémon learns, as one game taught it`

- **Added** — A moves section on the details page. The level-up list is open, because it is
  what the games' own Pokédex shows and it runs to eight or twenty rows; the machines and
  egg moves wait behind a count, because Mewtwo knows ninety-one TMs in Scarlet and Violet
  and they would bury everything else. It costs no requests at all: `/pokemon` already
  carries the level, the method and the game for every move, and only a move's own type
  and power would need fetching.
- **Added** — One game per era rather than a union of all of them. A learnset is per game
  and the same Pokémon can learn a move at level 12 in one and 15 in the next, so listing
  every version group at once produces a table that contradicts itself. Retro reads
  Crystal — Typhlosion at levels 1, 6, 12, 21, 31, 45 and 60, exactly as Gold and Silver
  printed it — and the modern dex reads the newest game that Pokémon appears in.
- **Fixed before it shipped** — "Newest" cannot mean newest outright. Pokémon Champions is
  the most recent thing Typhlosion appears in and teaches nothing by levelling: all 63 of
  its entries use a `train` method, so the section came out empty with a game nobody
  recognised on top. It now prefers the newest game that teaches by level, which needs no
  list of titles to ignore.
- **Added** — `versionGroupRank`, because a generation cannot order Gold/Silver against
  Crystal and a learnset has to name one game rather than a pair.
- **Added** — A `moves` i18n namespace, empty and wired the way `abilities` is: names fall
  through `humanize()` until a dictionary is filled in, so translations can arrive in
  batches instead of all at once.

### `fix: a regional form is not its species, and does not evolve like it`

- **Fixed** — Every alternate form — 326 of them, the Alolans and Galarians and Megas and
  Gmaxes — was missing its Pokédex entry, its genus, its generation badge and its whole
  evolution section. The page asked for `/pokemon-species/{pokemon.id}`, and above 1025
  those two numbers part company: Galarian Slowpoke is id 10164, and
  `/pokemon-species/10164` is a 404. The request now goes by the species name each
  `/pokemon` payload already carries, which resolves for forms and defaults alike. The
  failure was silent — the query never resolved and the sections simply rendered nothing.
- **Fixed** — A species shares one evolution chain with its regional variants, and the app
  read whichever step was newest. So Kantonian Ninetales evolved with the Ice Stone that
  belongs to the Alolan one, Slowbro with a Galarica Cuff, Electrode with a Leaf Stone
  from Hisui, and Quilava at the level Legends: Arceus moved it to. Seven visible steps
  across the Gen I/II chains were wrong that way; eleven more were right by accident,
  quoting a later game that happened to agree.
- **Added** — Steps are matched to the form being read. PokéAPI names them: the Alolan
  Sandshrew step carries `base_form: sandshrew-alola` while the Kantonian one names
  nobody, and Galarian Weezing marks a `region` instead, because Koffing has no variant to
  name. The marker rides down the chain, so a two-step regional line is judged at every
  step rather than only at the first. Vulpix and Vulpix-Alola now read from the same chain
  and disagree correctly: Fire Stone against Ice Stone.

### `fix: a failed search said "no matches" rather than saying it failed`

- **Fixed** — A search that could not run reported that nothing matched. `useSearchResults`
  never returned its error and `useListData` never looked for one, so a dropped connection
  produced "No Pokémon found matching …" — an answer about Pokémon to a question that had
  not been asked of them. The filter path had the same shape and a worse symptom: its "no
  matches" line rendered above the error view, so the page said both at once.
- **Fixed** — Retries no longer multiply. The search hydrates its results with
  `queryClient.fetchQuery` inside its own `queryFn`, and both layers carried the client's
  retry policy: three attempts each, three times over. A dead connection spent the better
  part of a minute showing skeletons before admitting anything was wrong. The inner calls
  no longer retry — the query the reader is actually waiting on owns that decision — and
  the same failure now surfaces in five seconds. The filtered list keeps its inner retries
  on purpose: it settles each entry separately, so nothing above it would retry in its
  place.

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
  often with the rules of a _regional form_ sharing the chain. Ninetales evolved with an
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
