# Przegląd kodu — Pokédex

Stan repozytorium: commit `ffdd282` (master), 2026-10-18. Vite 7 + React 19 + TypeScript 5.8 +
Tailwind 4 + React Query 5 + react-router 7 + i18next. Około 9 900 linii TS/TSX w 125 plikach
pod `src/`, 55 commitów, zero testów.

Dokument ma dwie części: **ustalenia** (sekcje 1–4) i **plan refaktoru** (sekcje 5–6).
Każde ustalenie ma odniesienie `plik:linia` sprawdzone na stanie `ffdd282` (ścieżki względem
`src/`, chyba że podano inaczej); liczby pochodzą z grepa, nie z pamięci.

---

## 1. Streszczenie

Kod jest w dobrym stanie jak na projekt tej wielkości: warstwa domeny (`src/domain`) jest
czysta i nie importuje Reacta, routera ani i18n; nie ma cykli importów; `tsc` ze `strict` +
`noUnusedLocals` i `eslint` przechodzą bez uwag; komentarze tłumaczą *dlaczego*, a nie *co*;
era (`DexEra`) jest tabelą reguł, a nie flagą. **Martwego kodu praktycznie nie ma**: żaden plik
nie jest osierocony, żadna zależność npm ani reguła CSS nie jest nieużywana, żaden eksport nie
jest nieużywany nigdzie.

Problemy leżą gdzie indziej i układają się w pięć grup:

1. **Brak jednego źródła prawdy dla rzeczy przekrojowych.** 39 różnych kolorów hex wpisanych
   inline (`#E12025` ×30, `#FECB09` ×23), wysokość navbara w 6 miejscach, ścieżki tras jako
   literały w 16 miejscach, predykat „czy id jest w erze" w 8 miejscach, pętla „najnowszy wpis
   w erze" w 7, klucze React Query inline w 5 mimo deklaracji, że `api/queries.ts` definiuje
   „każdy zasób raz".
2. **Te same elementy UI napisane wielokrotnie.** Badge typu ≥6 razy, kursor menu `>` 6 razy
   obok istniejącego `MenuCursor`, ramka Game Boya 6 razy, żółty przycisk akcji 5 razy,
   skeleton w 5 wariantach, znacznik „EN" 2 razy, przełącznik ery i języka po 2 razy.
3. **Kilka widocznych niespójności, które z tego wynikły.** W retro strona szczegółów pokazuje
   inną klasę ruchu niż kalkulator Versus; „mr-mime" na kartach, „Mr Mime" w Versus; „mr mime"
   znajduje Pokémona w Versus, ale nie na liście; dwa różne żółcie; zakładka Versus nie jest w
   URL, choć reszta stanu jest.
4. **Prezentacja przecieka do domeny, a kod współdzielony siedzi w feature'ach.** Klasy
   Tailwind w `domain/pokemonTypes.ts` i `domain/moves.ts`; `features/versus` importuje z
   `features/types` i `features/details`, a `features/details` z `features/versus`.
5. **Brak siatki bezpieczeństwa.** Zero testów przy domenie, która jest w całości testowalna;
   CHANGELOG zawiera ręczne „Checked" z liczbami, które powinny być asercjami.

Refaktor jest tani w porównaniu z tym, co daje, bo kod jest już podzielony sensownie — to
głównie konsolidacja, nie przebudowa. Plan w sekcji 5 ma 9 faz; fazy 0–7 nie zmieniają
zachowania, faza 8 (naprawy niespójności) zmienia i jest oznaczona.

---

## 2. Metodyka

Co sprawdzono:

- `npx tsc -p tsconfig.app.json --noEmit` i `npx eslint .` — oba czyste. Przy włączonych
  `noUnusedLocals`/`noUnusedParameters` oznacza to brak nieużywanych importów i zmiennych
  lokalnych, więc martwego kodu szukano na poziomie **eksportów, plików, zależności, kluczy
  i18n i pól typów**.
- Pełna lektura wszystkich plików `.ts/.tsx/.css` pod `src/` oraz konfiguracji
  (`package.json`, `tsconfig*`, `eslint.config.js`, `vite.config.ts`, `vercel.json`,
  `.gitignore`), `README.md`, nagłówka `CHANGELOG.md`, `PLAN.md`, `scripts/`.
- Graf importów (alias `@/` i względne) między folderami; każdy eksport zestawiony z realnymi
  importami po nazwie, nie grepem po słowie.
- Spłaszczenie i porównanie kluczy `en/common.json` ↔ `pl/common.json` oraz
  `en/pokemon.json` ↔ `pl/pokemon.json`, z uwzględnieniem końcówek pluralnych.
- Grep ilościowy: kolory hex, literały tras, `queryKey`, `era.maxDexId`, `=== "artwork"`,
  `animate-pulse`, focus ring, `role="alert"`, `window.scrollTo`, `humanize(`.
- Historia gita (poprzedni refaktor `409af2a`…`f697731`, obecność Dockerfile).

Czego **nie** sprawdzano: zachowania w przeglądarce, rozmiaru bundla po buildzie,
dostępności poza tym, co widać w kodzie, wydajności zapytań do PokéAPI, treści dwóch
wielkich plików JSON z tłumaczeniami (600–740 kB).

Skala wag: **W** — błąd lub rzecz, którą użytkownik widzi; **Ś** — koszt utrzymania, ryzyko
rozjazdu; **N** — kosmetyka, porządek.

---

## 3. Ustalenia

### 3.1 Błędy i widoczne niespójności

| # | Waga | Gdzie | Co | Jedno źródło prawdy |
|---|---|---|---|---|
| 1.1 | W | `features/details/MoveDetails.tsx:54` vs `features/versus/MoveCalc.tsx:384` | Szczegóły pokazują `move.damageClass` (dzisiejszą klasę z API; `moveInGame` w `domain/moves.ts:312` przepisuje `move.damage_class.name` bez zmian), kalkulator liczy przez `damageClassInEra(inGame, era)` (reguła Gen I–III: klasa po typie). W retro Crunch jest „Physical" na stronie szczegółów, a liczony jako Special w Versus. | `moveInGame` powinno zwracać klasę już zgodną z erą (dostaje `game`, więc może), albo `MoveDetails` ma wołać `damageClassInEra`. |
| 1.2 | W | CSS `capitalize` na slugu (→ „mr-mime", „ho-oh"): `PokemonCard.tsx:92`, `PokemonHeader.tsx:51`, `EncountersPage.tsx:104`, `EvolutionChain.tsx:229`, `DexNeighbours.tsx:55`, `PokemonPicker.tsx:153`. `humanize()` (→ „Mr Mime"): `Matchup.tsx:57,62,103`, `MoveCalc.tsx:139,194,411,416`, `BattleField.tsx:195,200`, `StatDuel.tsx:23-24`, `NotInEra.tsx:30`, `EncountersPage.tsx:89`, `VersusAd.tsx:51`, `PokemonPicker.tsx:30,36,115`. Surowy slug w `alt`/aria: `CryButton.tsx:28`, `PokemonArtwork.tsx:105,112,122`, `BattleField.tsx:95,105`, `PokemonCard.tsx:58`. | Trzy konwencje nazwy Pokémona. `EncountersPage` używa dwóch na jednym ekranie (linie 89 i 104). | `usePokemonLabel()` w `i18n/labels.ts` (jedyny rodzaj slugu, który nie ma tam hooka) i jedna decyzja, jak wygląda „mr-mime". |
| 1.3 | W | `PokemonPicker.tsx:41` (`.trim().toLowerCase().replace(/\s+/g, "-")`) vs `SearchBox.tsx:33` + `useSearchResults.ts:35` (`.trim().toLowerCase()`) | „mr mime" znajduje Mr. Mime w Versus, nie znajduje na liście. Filtrowanie indeksu nazw po erze i substringu napisane dwa razy: `PokemonPicker.tsx:44-48`, `useSearchResults.ts:38-44`. | `matchNames(names, term, era)` w `domain/`. |
| 1.4 | W | `VersusPage.tsx:65` (`useState<Tab>`) vs `useVersusParams.ts:19-22` | Ruch, umiejętność i poziom każdej strony są w URL, zakładka nie. Link `/versus?a=…&am=thunderbolt` otwiera się na zakładce Types, nie Moves. | `tab` jako parametr URL obok pozostałych. |
| 1.5 | W | `PokemonCard.tsx:22` (`generationFromId(id)`) vs `PokemonHeader.tsx:37` (`getGeneration(species)` z API) | Generacja liczona z dwóch źródeł. Dla form (id > 10000) karta nie pokazuje badge'a, nagłówek pokazuje generację gatunku. `NotInEra.tsx:34` i `VersusPage.tsx:300` to trzecie i czwarte wywołanie `generationFromId`. | Jedna funkcja `generationOf(pokemon, species?)` z jedną polityką dla form. |
| 1.6 | W | `Pagination.tsx:33,62,75` (`#FFCD0B`) vs 23 użycia `#FECB09`, w tym identyczna klasa przycisku w `FiltersPanel.tsx:115` | Dwa żółcie różniące się o kilka jednostek — niemal na pewno literówka utrwalona kopiowaniem. | Token koloru (3.2.1). |
| 1.7 | Ś | `AbilityList.tsx:23` vs `AbilityPicker.tsx:27` i `domain/abilities.ts:76-78` | Picker w Versus i `defaultAbility` sortują umiejętności po `slot`, lista na stronie szczegółów nie. Kolejność może się różnić między stronami. | Sortowanie raz, w domenie (`abilitiesInOrder(pokemon)`). |
| 1.8 | Ś | `ListOptions.tsx:49` (`slug.toUpperCase()`) | Jedyne miejsce, które nie używa `genRoman` z `domain/dex.ts:21`. Dziś daje ten sam wynik; przestanie, gdy `genRoman` dostanie wyjątek. | `genRoman`. |
| 1.9 | Ś | `i18n/evolutionCondition.ts:70` (`humanize(detail.known_move.name)`) | Warunek ewolucji „zna ruch X" pomija polskie nazwy ruchów, choć `useMoveLabel` istnieje w tym samym folderze. Dla przedmiotów i lokacji brak słowników (świadome), ale ruchy słownik mają. | `useMoveLabel` w `useEvolutionCondition`. |
| 1.10 | Ś | `pl/common.json:233` vs `en/common.json:223-227` | `encounters.places` ma w EN `_one/_other`, w PL tylko klucz bazowy „miejsc: {{count}}" — „miejsc: 1". `encounters.coins`/`showMore` w PL bez `_other` (działa przez fallback na klucz bazowy). | Komplet form `_one/_few/_many/_other` w PL. |
| 1.11 | N | `Navbar.tsx:113` | `:ON` / `:OFF` w menu mobilnym nie przechodzą przez `t()`. Inne stałe (`HP:`, `ASH`, `VS`, `FIGHT!`, `POKÉMON`) to cytaty z gier i zostają — ale ta para to etykieta stanu. | Klucze `era.on`/`era.off`. |

### 3.2 Wiele źródeł prawdy

#### 3.2.1 Tokeny wizualne

| # | Waga | Co | Gdzie | Jedno źródło prawdy |
|---|---|---|---|---|
| 2.1 | Ś | **Paleta.** 39 różnych hexów inline w klasach Tailwind. `#E12025` ×30, `#FECB09` ×23, `#356DB2` ×16, `#EAEBF2`/`#eaebf2` ×9 (dwie pisownie: małymi w `App.tsx:34`, `FiltersPanel.tsx:77`, `ListToolbar.tsx:53`; dużymi w `StatList.tsx:39`, `StatDuel.tsx:36,39`, `EvolutionChain.tsx:207-211`), `#c11a1e` ×6, `#FFCD0B` ×3 (1.6). `src/index.css:3-5` definiuje w `@theme` tylko font. | całe `src/` | `@theme { --color-dex-red; --color-dex-red-dark; --color-dex-yellow; --color-dex-blue; --color-dex-bg; --color-gb-green-*; … }` w `index.css`; w kodzie `bg-dex-red`. Kolory typów (`TYPE_STYLES`) i akcentów metod (`METHOD_ACCENTS`) mogą zostać tabelami, ale typowanymi i poza domeną (3.4). |
| 2.2 | Ś | **Kolory efektów kopiują kolory typów.** `features/types/effectiveness.ts:36` `#7AC74C` = grass (`pokemonTypes.ts:9`), `:39` `#EE8130` = fire (`:6`). | | Odwołanie do tego samego tokenu, nie kopia wartości. |
| 2.3 | Ś | **Wysokość navbara (48 px)** w 6 miejscach: `Navbar.tsx:51` `h-12`, `App.tsx:36` `pt-12`, `ListToolbar.tsx:53` `sticky top-12`, `FiltersPanel.tsx:77` `top-12` + `max-h-[calc(100dvh-3rem)]`, `FiltersPanel.tsx:79` `h-12`, `MoveList.tsx:145` `sticky top-16` z komentarzem „navbar is fixed and 48px tall". | | `--spacing-nav: 3rem` w `@theme` → `h-nav`, `pt-nav`, `top-nav`, `calc(100dvh - var(--spacing-nav))`. |
| 2.4 | N | **Focus ring** `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white` ×5 (`EraToggle.tsx:25`, `LanguageSwitcher.tsx:29`, `Navbar.tsx:41,71`, `FiltersPanel.tsx:85`) + wariant `outline-black` ×2 (`BattleScreen.tsx:14`, `Navbar.tsx:138`). | | `@utility focus-ring` / `focus-ring-dark`. |
| 2.5 | N | **Rozmiar slotu sprite'a** `h-20 w-20 md:h-28 md:w-28`: `BattleScreen.tsx:89,99`, `BattleField.tsx:33`. | | Stała współdzielona przez oba ekrany bitwy. |

#### 3.2.2 Reguły domenowe pisane wielokrotnie

| # | Waga | Co | Gdzie | Jedno źródło prawdy |
|---|---|---|---|---|
| 2.6 | Ś | **„Czy id jest w erze"** — `x > era.maxDexId` / `<= era.maxDexId` w 8 miejscach. | `domain/evolution.ts:135`, `PokemonDetailsPage.tsx:47`, `EncountersPage.tsx:70`, `VersusPage.tsx:36`, `useDefaultPage.ts:31`, `useFilteredPage.ts:81`, `useSearchResults.ts:42`, `PokemonPicker.tsx:46` | `isInEra(id, era)` w `domain/era.ts`. Poza tym plikiem `era.maxDexId` nie powinno występować. |
| 2.7 | Ś | **„Czy generacja mieści się w erze" / „najnowszy wpis w erze"** — `cap = genOrder(era.maxGen)` i porównanie `order <= cap` z wyborem najlepszego. `species.newestInEra` (`:55-74`) i `evolution.methodInEra` (`:33-51`) to ta sama pętla linijka po linijce. | `species.ts:60-68`, `evolution.ts:37-45`, `encounters.ts:133-138`, `:148-154`, `:175-186` (trzy razy w jednym pliku), `moves.ts:148-159`, `pokemonTypes.ts:83-87` (`typesUpTo`), `pokemonView.ts:115` (`genOrder(gen) <= genOrder("v")`, literał) | `genInEra(gen, era)` i generyczne `newestInEra(entries, genOf, era)` w `domain/era.ts`. |
| 2.8 | Ś | **„Wartości obowiązujące *przez* generację"** (najwcześniejszy wpis z `order >= target`, inaczej dzisiejsze) — 4 implementacje. | `pokemonView.ts:19-37` (`typesInEra`), `:62-99` (`statsInEra`), `typeChart.ts:16-31` (`relationsIn`, przez filter/sort), `moves.ts:278-287` (`moveInGame`, po rangach grup wersji) | `inForceAt(entries, orderOf, target)`. |
| 2.9 | Ś | **„Era pikselowa"** — `era.sprites === "artwork"` / `!==` w 5 miejscach UI, `[image-rendering:pixelated]` w 7 plikach, `name === "retro"` w `EraToggle.tsx:12` i `Navbar.tsx:97`. `domain/era.ts:7-9` deklaruje: „every component asks the era, never *is retro on*" — te miejsca łamią tę zasadę. | `PokemonCard.tsx:30`, `EvolutionChain.tsx:198`, `EncountersPage.tsx:99`, `BattleField.tsx:48,66` | Pole `pixelArt: boolean` w `DexEra` (lub `isPixelSet(set)` w `sprites.ts`) i jedna klasa pomocnicza. |
| 2.10 | Ś | **Typowanie ery** `typingOf(typesInEra(p, era))` ×6. | `Matchup.tsx:53,54,96`, `MoveCalc.tsx:386,387`, `BattleField.tsx:212` | `typingInEra(pokemon, era)` w `domain/pokemonView.ts`. |
| 2.11 | Ś | **Stała skali statów** `SCALE_MAX` eksportowana z komponentu `features/details/StatList.tsx:11`, importowana przez `features/versus/BattleField.tsx:9` i `StatDuel.tsx:3`; wzór procentu w 3 wariantach (`StatList.tsx:29`, `StatDuel.tsx:7`, `BattleField.tsx:207`). | | `domain/stats.ts`: `SCALE_MAX`, `barPercent(value)`. |
| 2.12 | Ś | **Slugi statów** jako surowe stringi (`"hp"`, `"attack"`, `"special-attack"`, `"special"`). `BattleField.tsx:183-185` ręcznie szuka HP (`find(stat => stat.name === "hp")`) zamiast `statValue(stats, "hp")` z `domain/damage.ts:59`; `StatDuel.tsx:17` podobnie. | `pokemonView.ts:46,88,92`, `damage.ts:43,48,67,70`, `MoveCalc.tsx:109-110,398`, `BattleField.tsx:184` | `STAT` const w `domain/stats.ts`, `statValue` wszędzie. |
| 2.13 | Ś | **Stałe poziomu** `MIN_LEVEL`, `MAX_LEVEL`, `DEFAULT_LEVEL`, `clampLevel` w hooku URL `useVersusParams.ts:4-6,24`, importowane przez `MoveCalc.tsx:34`. | | `domain/damage.ts` (albo `domain/level.ts`). |
| 2.14 | Ś | **Typy modelu Versus** `Side`, `Known`, `Fighter` zdefiniowane w komponencie `BattleField.tsx:15-31`; hook `useVersusParams.ts:2` i `MoveCalc.tsx:32` importują typy z pliku UI. Komponent `Fighter` w `VersusAd.tsx:60` koliduje nazwą z typem. | | `features/versus/model.ts`. |
| 2.15 | Ś | **Czyszczenie flavor text** `.replace(/[\f\n\r­]/g, " ").trim()` 2×; fallback „locale, potem en" 2× (`species.inLanguage` `:36-46`, `moves.spokenIn` `:289-308`); spłaszczanie tabel tłumaczeń `flatMap(([games, text]) => games.map(…))` 2× (`species.ts:94`, `moves.ts:302`), przy czym `TranslatedMoveText` (`moves.ts:231`) i `TranslatedSpeciesText.dex` (`species.ts:20`) to ten sam kształt `readonly (readonly [readonly string[], string])[]` pod dwiema nazwami. | `species.ts:110`, `moves.ts:293` | `domain/text.ts`: `cleanFlavorText`, `inLanguage`, typ `TranslatedText`, `flattenTranslated`. |
| 2.16 | Ś | **Pipeline obrażeń** żyje inline w komponencie `MoveCalc.Result` (`:382-410`): klasa → typ → STAB → skuteczność z umiejętnościami → `damageRange` → procent HP. Nic poza tym komponentem nie może tego policzyć ani przetestować. `firstOfEach` (`:260-263`) to też logika domenowa w pliku UI. | | `computeHit({ move, game, attacker, defender, level, stats, abilities, chart, era })` w `domain/damage.ts`. |
| 2.17 | Ś | **Hydratacja nazw → Pokémonów** 3 strategie z różną polityką błędów: `useDefaultPage.ts:41-44` `Promise.all`, `useFilteredPage.ts:100-113` `Promise.allSettled` (komentarz: „a few species names 404"), `useSearchResults.ts:46-58` `Promise.all` + `retry:false`. Strona domyślna używa `Promise.all`, choć `api/pokemon.ts:37-40` opisuje te same 404. | | Jedna funkcja `hydrate(names)` z jedną polityką; decyzja „pomiń 404" podjęta raz. |
| 2.18 | N | **Offset strony** `(page - 1) * perPage` ×3 (`queries.ts:47`, `useFilteredPage.ts:85`, `useListData.ts:69-72`), `Math.ceil(n / perPage)` ×2 (`useListData.ts:52,54`). | | `pageSlice(page, perPage)`, `pageCount(total, perPage)` w `domain/pagination.ts`. |
| 2.19 | N | **`TYPE_STYLES`** (`pokemonTypes.ts:4`) typowane `Record<string, string>` — brak typu dla nieistniejącego lub brakującego typu, choć `PokemonType` jest kilka linijek niżej. **`TYPE_DEBUT`** (`:76-80`) wpisane ręcznie, podczas gdy `TypeResource.generation` (`types/damage.ts:16-17`) przychodzi z API i nigdy nie jest czytane. | | `Record<PokemonType, string>`; pole `generation` usunąć z typu albo zacząć czytać. |
| 2.20 | N | **Trzy listy tych samych 4 metod nauki**: `METHOD_ORDER` (`moves.ts:25`), klucze `METHOD_ACCENTS` (`moves.ts:84-117`), `pokemon.json.moveMethods`. | | `METHOD_ORDER` jako źródło; reszta typowana kluczami z niego. |

#### 3.2.3 Reguły aplikacyjne pisane wielokrotnie

| # | Waga | Co | Gdzie | Jedno źródło prawdy |
|---|---|---|---|---|
| 2.21 | Ś | **Ścieżki tras** jako literały w 16 miejscach, osobno od definicji w `App.tsx:38-50`. Parametry `a`/`b` (Versus) i `type` (lista) są zdefiniowane prywatnie w `useVersusParams.ts:19-22` i `useListParams.ts:65`, a linki składają je ręcznie. | `/pokemon/${name}`: `PokemonCard.tsx:21`, `DexNeighbours.tsx:91`, `EvolutionChain.tsx:252`, `EncountersPage.tsx:85`, `BattleField.tsx:192`, `AboutPage.tsx:161`; `/pokemon/…/encounters`: `EncountersLink.tsx:31`, `AboutPage.tsx:164`; `/versus?a=`: `VersusLink.tsx:12`, `VersusAd.tsx:21`; `/types`: `Navbar.tsx:11`, `TypeBadges.tsx:36`, `TypeChartAd.tsx:21`, `AboutPage.tsx:167`; `/?type=`: `TypeBadges.tsx:21`; `/about`: `Footer.tsx:29`; `/`: `NotFound`, `NotInEra`, `BackButton`, `Navbar` | `src/app/routes.ts`: `paths` (dla `<Route>`) + buildery `pokemonPath(name)`, `encountersPath(name)`, `versusPath({a, b, …})`, `listPath({type})`, `typesPath`, `aboutPath`. |
| 2.22 | Ś | **Klucze React Query** inline mimo `api/queries.ts:16-25` („Every resource the app reads, defined once"). | `useDefaultPage.ts:39` `["pokemonDetails", …]`, `useFilteredPage.ts:48` `["typeLists", …]`, `:92` `["filteredDetails", …]`, `useSearchResults.ts:33` `["search", …]`, `i18n/translated.ts:43` `["translated", …]` | Te zapytania pochodne też jako `queryOptions` w `queries.ts` (lub sekcja `keys`), żeby komentarz był prawdziwy. |
| 2.23 | Ś | **Protokół `history.state`** bez typu, pod dwiema nazwami: `PokemonCard.tsx:42-45` zapisuje `{from, scrollY}`; `BackButton.tsx:14-23` czyta to (inline cast) i zapisuje `{restoreScroll}`; `useScrollRestore.ts:20` czyta `restoreScroll` (inline cast); `EvolutionChain.tsx:255`, `EncountersLink.tsx:34`, `EncountersPage.tsx:86` przekazują `state={location.state}`, nie wiedząc, co w nim jest. | | `src/app/listOrigin.ts`: typ `ListOriginState`, `readOrigin(location)`, `withOrigin(state)`, `restoreState(origin)`. |
| 2.24 | Ś | **Patch `URLSearchParams`** 2× z różną semantyką: `useListParams.update` (`:85-97`) usuwa klucz przy `null` i `""`, `useVersusParams.write` (`:55-66`) przy każdej wartości falsy. Dziś różnica dotyczy tylko `""`, ale to dwa miejsca do utrzymania jednej reguły. | | `useSearchParamsPatch()` z jedną semantyką. |
| 2.25 | Ś | **Nazwy wyświetlane gier** trzema metodami: tabela `SPRITE_GAMES[].name` („Red / Blue", „Red / Green (JP)") w `sprites.ts:38-79`; lokalny `gameLabel` z obsługą `-japan` w `EncountersPage.tsx:154-157`; goły `humanize(game)` w `MoveList.tsx:89` i `MoveDetails.tsx:93` („Red Blue", „Lets Go Pikachu Lets Go Eevee"). `games.ts` zna wszystkie wersje i grupy, ale nie nazwy. | | `useGameLabel()` w `i18n/labels.ts` nad jedną tabelą nazw (klucze wersji *i* grup wersji). |
| 2.26 | Ś | **Domyślny język** `i18n.resolvedLanguage ?? "en"` ×5 (`PokemonHeader.tsx:31`, `MoveDetails.tsx:44`, `MoveCalc.tsx:382`, `translated.ts:39`, `i18n/index.ts:50`) + literał `"en"` w `species.ts:41,112,119`, `moves.ts:308,318`. **Lista języków** w `SUPPORTED_LANGUAGES` (`i18n/index.ts:12`), `VOICES` (`pokedexVoice.ts:14`), `locale === "pl"` (`translated.ts:40`). **Domyślna era** `"modern"` w `EraProvider.tsx:14,16`, `EraToggle.tsx:18`, `Navbar.tsx:106`, `NotInEra.tsx:59`. | | `useLocale()`; `DEFAULT_LOCALE`; `VOICES` typowane po `SUPPORTED_LANGUAGES`; `DEFAULT_ERA` w `domain/era.ts`. |
| 2.27 | Ś | **Tekst „nie w tej erze"** liczony 2×: `NotInEra.tsx:34,46-51` i `VersusPage.Problem` `:300-306` (ten sam `generationFromId` + wybór między `era.notHereBody` / `era.notHereBodyNoGen` + te same interpolacje). | | `useNotInEraText(pokemon)`. |
| 2.28 | Ś | **Przełącznik ery** 2× (`EraToggle.tsx:9-34` i `Navbar.GameBoyMenu` `:104-114`) i **języka** 2× (`LanguageSwitcher.tsx:15-39` i `Navbar.tsx:127-145`): ta sama pętla po `SUPPORTED_LANGUAGES`, te same `aria-label`, `aria-pressed`, `changeLanguage`. Różni się tylko skórka. | | `useEraToggle()` / `useLanguageSwitch()` zwracające stan + akcje + etykiety; dwa cienkie widoki. |
| 2.29 | N | **Łańcuch ładowania strony Pokémona** `useParams → pokemonQuery → Loader → NotFoundError → ErrorView → NotInEra` 2× (`PokemonDetailsPage.tsx:25-60`, `EncountersPage.tsx:41-70`); `VersusPage.useFighter` (`:27-40`) to ta sama decyzja zwrócona jako dane. | | `usePokemonStatus(name)` zwracający unię statusów; strony tylko mapują status na widok. |
| 2.30 | N | **Wczytanie ruchu w grze** `useQuery(moveQuery) → locale → useTranslatedMoveText → moveInGame(data, game, locale, translated(name))` 2× (`MoveDetails.tsx:32-45`, `MoveCalc.tsx:361-383`). | | `useMoveInGame(name, game)`. |
| 2.31 | N | **Scroll na górę przy zmianie parametru** `useEffect(() => window.scrollTo(0,0), [name])` 2× identycznie (`PokemonDetailsPage.tsx:35-37`, `EncountersPage.tsx:51-55`) + `AboutPage.tsx:99-101` + `useListParams.ts:102`. **Escape zamyka** 2× (`Navbar.tsx:31-38`, `FiltersPanel.tsx:48-51`). **Lustrzenie prop → stan effectem** 2× (`PokemonPicker.tsx:35-37`, `SearchBox.tsx:27-29`), podczas gdy `MoveCalc.useEdited` (`:48-61`) rozwiązuje to samo wzorcem „basis" bez effectu. | | `useScrollTopOn(dep)`, `useEscape(onClose)`; jeden wzorzec dla „stan lokalny resetowany, gdy zmieni się źródło". |
| 2.32 | N | **Dwa cache poza React Query**: `gifBytes.ts:1` i `spriteBounds.ts:15-16` trzymają `Map` na poziomie modułu, podczas gdy tabele PL (`translated.ts:42-47`) idą przez React Query. Dwie strategie „pobierz raz na sesję". | | Decyzja: albo `queryClient.fetchQuery` z `staleTime: Infinity` dla GIF-ów, albo komentarz, dlaczego nie. |
| 2.33 | N | **AboutPage**: URL-e źródeł wpisane 2× w tym samym pliku (tablica `SOURCES` `:35-45` i `href` w `<Trans>` `:115,121,132-133`); `REPO` (`:33`) = `Footer.tsx:33` = `README.md`; liczby `FORMS = 326` (`:18`) i `POLISH_TABLES` (`:15`) ręcznie, te same liczby w prozie `era.ts:31-34` i `queries.ts:35`. Plik importuje `pl/abilities.json` i `pl/moves.json` tylko po to, by policzyć klucze. | | `src/app/links.ts`; `SOURCES` jako jedyne źródło w About; liczniki albo generowane skryptem do małego JSON-a, albo wprost opisane jako ręczne. |
| 2.34 | N | **i18n — identyczne stringi pod różnymi kluczami** w `en/common.json` (13): „Versus" = `nav.versus` + `versus.link`; „Type chart" = `types.title` + `types.link`; „Stats" = `versus.tabStats` + `details.stats`; „Moves" = `versus.tabMoves` + `details.moves`; „Power" = `versus.power` + `details.movePower`; „Lvl. {{level}}" = `details.moveLevel` + `evolution.level` + `encounters.level`; „Hide the rest" = `details.movesHide` + `encounters.showLess`; „Filters" = `filters.title` + `filters.open`. Część zamierzona (inny kontekst, PL może się różnić), część to kopiuj-wklej. | | Przegląd par; tam gdzie PL też jest identyczne — jeden klucz. |
| 2.35 | N | **Klucze storage** rozproszone: `"era"` (`EraProvider.tsx:5`), `"lang"` (`i18n/index.ts:44` `lookupLocalStorage`). | | `src/app/storageKeys.ts`. |

### 3.3 Zduplikowane UI i helpery

| # | Waga | Wzorzec | Gdzie (liczba miejsc) | Docelowo |
|---|---|---|---|---|
| 3.1 | Ś | **Badge typu** (kolorowy chip `typeClass` + `typeLabel`). `Matchup.TypeChip` istnieje (`:17-24`), ale `MoveCalc.tsx:420-422` kopiuje jego JSX, importując z tego samego pliku `EffectChip`. Paddingi i rozmiary się rozjeżdżają (`leading-none` / `leading-4` / brak; `px-2`/`px-3`/`px-4`). | `PokemonCard.tsx:95-100`, `TypeBadges.tsx:19-31` (Link), `TypeFilter.tsx:43-58` (toggle), `MoveDetails.tsx:50-52`, `MoveCalc.tsx:420-422`, `Matchup.tsx:17-24`, `TypeChartPage.tsx:137-141,149-155` (nagłówki), `TypeChartAd.tsx:46-58` (6+) | `components/TypeBadge.tsx` z wariantami `as: span \| link \| toggle` i rozmiarem; `chips.ts:31` ma już bazę `px-2 py-1 text-[10px] leading-none`. |
| 3.2 | Ś | **Kursor menu `>`** — `MenuCursor` istnieje (`BattleScreen.tsx:17-24`), a ręczne `>` jest w 6 miejscach, z różnymi regułami opacity. | `Navbar.tsx:122-124`, `AboutPage.tsx:61-63`, `VersusPage.tsx:341-346` (TabButton), `PokemonPicker.tsx:157-159`, `EvolutionChain.tsx:233-235`, `CryButton.tsx:31` / `ReadButton.tsx:41` (jako tekst `" > "`) | `MenuCursor` z propem `visible`/`dim`. |
| 3.3 | Ś | **Ramka Game Boya** `border-4 border-black bg-white p-4 md:p-6`. | `BattleScreen.tsx:84,106`, `BattleField.tsx:51`, `VersusPage.tsx:119`, `AboutPage.tsx:59`, `Navbar.tsx:101` (bez `md:p-6`) (6) | `<GbBox>`. |
| 3.4 | Ś | **Panel statusu bitwy** — `StatusBox` (`BattleScreen.tsx:40-56`) i `FighterBox` (`BattleField.tsx:179-219`) to ta sama ramka `border-2 border-black bg-white px-2 py-1 md:px-3 md:py-2` + wiersz nazwa/poziom + `HpBar`; `LifeBar` w `VersusAd.tsx:48-57` przerysowuje `HpBar` (`BattleScreen.tsx:27-37`) z tym samym `bg-[#356DB2]`; slot „glitch" `???` 2× (`BattleScreen.tsx:87-92`, `BattleField.tsx:115-120`). | | `BattleScreen` zbudowany z tych samych `StatusBox`/`Slot`, których używa `BattleField`. |
| 3.5 | Ś | **Przyciski**: żółty akcji — `ACTION` (`chips.ts:39`) + 4 ręczne kopie (`BackButton.tsx:29`, `EncountersPage.tsx:87` identyczny z BackButton, `FiltersPanel.tsx:121`, `SearchBox.tsx:77`); czerwony „X" (`SearchBox.tsx:85`, `PokemonPicker.tsx:126`, identyczne); szary „pokaż więcej" (`MoveList.tsx:114`, `EncountersPage.tsx:135`, identyczne); szary pager/clear z `disabled:` (`Pagination.tsx:33,75`, `FiltersPanel.tsx:115`); „All" w `TypeFilter.tsx:27-31` kopiuje `ACCENTS.ability` z `chips.ts:25-27` zamiast użyć `<Chip kind="ability">`; input `h-9 border-2 px-2 text-sm bg-white` (`SearchBox.tsx:68`, `ListOptions.tsx:44,68`, `PokemonPicker.tsx:119`; `MoveCalc.tsx:37` `INPUT` jako wariant). | | `components/buttons.ts` (lub `Button.tsx`): `action`, `ghost`, `more`, `danger`, `input`. |
| 3.6 | Ś | **Skeletony** — 5 wariantów + tekst: `components/Skeleton.tsx` (grid, 1 importer, dubluje klasy gridu z `ListResults.tsx:26`), `MoveDetails.MoveSkeleton` (`:122-135`), `EvolutionChain.tsx:62` (`h-64 bg-gray-100`), `BattleField.tsx:81`, `MoveCalc.tsx:372` (`h-24 bg-gray-200`), `VersusPage.tsx:218` („Loading" tekstem), `components/Loader.tsx` (pełny ekran). | | `Skeleton.tsx` z wariantami `Block`, `Grid`, `MoveBody`. |
| 3.7 | Ś | **Komunikat błędu inline** `<p role="alert" className="text-xs text-[#E12025]">` 2× (`VersusPage.tsx:212`, `MoveCalc.tsx:376`) obok `ErrorView` (pełnostronicowy, z unią `"list" \| "details" \| "types"` — każda nowa strona to edycja unii). | | `InlineError`; `ErrorView` z propem `message` zamiast unii. |
| 3.8 | Ś | **Znacznik „EN"** (`englishEntryShort` + `sr-only`) — identyczny JSX poza kluczem. | `PokemonHeader.tsx:67-75`, `MoveDetails.tsx:79-87` | `LangMarker`. |
| 3.9 | N | **Badge klasy obrażeń** `bg-gray-200 px-2 py-1 text-[10px]` (`MoveDetails.tsx:53`, `MoveCalc.tsx:423`); **legenda** `TypeChartPage.tsx:66-71` kopiuje `EffectChip` (`Matchup.tsx:26-35`). | | `ClassBadge`; `EffectChip` w `components/`. |
| 3.10 | N | **Układ body `NotFound` i `NotInEra`** — te same klasy h1/p i rząd akcji `mt-8 flex flex-col gap-3 sm:flex-row sm:gap-12` (`NotFound.tsx:15-31`, `NotInEra.tsx:42-69`). Nagłówek `FiltersPanel.tsx:79-80` powtarza navbar (`h-12 bg-[#E12025] text-xl font-bold`). Pusty stan z przerywaną ramką 2× (`MoveList.tsx:147`, `EncountersPage.tsx:112`). Kontener strony `container mx-auto px-4 pt-8 lg:max-w-7xl pb-12` 3× (`PokemonDetailsPage.tsx:65`, `EncountersPage.tsx:83`, `TypeChartPage.tsx:56`). Karta sekcji `bg-white p-6 mt-6` + `h2 text-lg` 2× (`MoveList.tsx:86`, `EvolutionChain.tsx:55`). | | `BattleScreen` z propami na akcje; `PageContainer`, `SectionCard`. |
| 3.11 | N | **Rzędy chipów** w `PokemonArtwork.tsx:134-205` — trzy niemal identyczne bloki `role="group"` + `aria-label` + mapowanie na `Chip`. | | `ChipRow`. |
| 3.12 | N | **Hooki labeli** w `i18n/labels.ts` — 7 hooków o identycznym ciele `t(prefix + slug, { defaultValue: humanize(slug) })` (`:18-21`, `:24-27`, `:30-33`, `:36-40`, `:43-47`, `:71-75`, `:82-85`). | | `makeLabelHook(ns, prefix)`; dołożyć `usePokemonLabel`, `useGameLabel`. |
| 3.13 | N | **`humanize` w skrypcie** `scripts/gen-ability-keys.mjs:18-22` kopiuje `i18n/labels.ts:11-15`. | | Skrypt może importować z `src` tylko po przejściu na TS/tsx; inaczej zostawić z komentarzem. |

### 3.4 Struktura i warstwy

**Mapa importów między folderami** (liczba instrukcji `import`; policzona skryptem po aliasie
`@/` i ścieżkach względnych):

```
main               → app(1), i18n (import dla efektu ubocznego)
app                → features/*(7), components(3), era(1), api(1)
api                → types(7), domain(1)          ← queries.ts importuje genApiName z domeny
domain             → types(9)                     ← czysto; zero React/router/i18n
era                → domain(2)
components         → i18n(2), era(2)
i18n               → types(1), domain(2)          ← translated.ts robi useQuery
features/about     → domain(3) + 2 JSON-y lokalizacji
features/details   → domain(28), components(11), era(12), i18n(10), types(10), api(8),
                     features/not-found(2), features/versus(1)
features/list      → domain(19), types(5), era(4), api(4), i18n(3), components(2)
features/not-found → components(1)
features/types     → domain(8), components(4), i18n(2), era(1), api(1), types(1)
features/versus    → domain(22), i18n(9), components(7), era(7), types(5), api(4),
                     features/types(4), features/details(2)
```

Cykli na poziomie plików nie ma. Na poziomie feature'ów **details ↔ versus** importują się
nawzajem.

| # | Waga | Problem | Gdzie | Docelowo |
|---|---|---|---|---|
| 4.1 | Ś | **Prezentacja w domenie.** Klasy Tailwind: `TYPE_STYLES` (`pokemonTypes.ts:4-26`), `METHOD_ACCENTS` + `NO_ACCENT` (`moves.ts:84-133`; razem z komentarzem o RGB555 to ~100 z 320 linii pliku). Angielskie nazwy wyświetlane gier (`sprites.ts:38-79`). Parsowanie/serializacja query-stringa (`pokemonTypes.ts:57-70`). URL-e CDN (`resource.ts:7-26`). | `domain/` | `TYPE_STYLES` → `components/typeStyles.ts`; `METHOD_ACCENTS` → `features/details/moveAccents.ts`; nazwy gier → tabela labeli (2.25); `parseTypes`/`serializeTypes` → `features/list`; buildery URL → `sprites.ts`/`api`. |
| 4.2 | Ś | **Cross-feature importy.** details → versus (`PokemonHeader.tsx:6` `VersusLink`); versus → details (`BattleField.tsx:9`, `StatDuel.tsx:3` `SCALE_MAX`); versus → types (`VersusPage.tsx:14` `useTypeChart`; `Matchup.tsx:13`, `MoveCalc.tsx:30`, `TypeChartAd.tsx:5` `effectiveness`); details → not-found (`PokemonDetailsPage.tsx:10`, `EncountersPage.tsx:19`). `features/types/effectiveness.ts` (`printed`, `phraseKey`, `effectClass` — formatowanie, klucz i18n, kolor) i `features/types/useTypeChart.ts` to kod wspólny, który przypadkiem powstał w feature. `Matchup.tsx` jest de facto biblioteką chipów (`TypeChip`, `EffectChip` importowane przez `BattleField` i `MoveCalc`). | | `effectiveness.ts` → `components/` (klasy) + `i18n/` (`phraseKey`); `useTypeChart` → `api/`; `SCALE_MAX` → `domain/stats.ts`; `NotFound` → `components/`; `VersusLink` podawany do `PokemonHeader` jako slot z `PokemonDetailsPage`, albo świadoma zgoda na jednokierunkowy import przez `features/versus/index.ts`. Reguła granic w eslint (sekcja 5, faza 5). |
| 4.3 | Ś | **Worki o mylących nazwach.** `components/BattleScreen.tsx` eksportuje `MENU_ITEM`, `MenuCursor` (prymitywy menu używane przez Navbar, AdBox, VersusPage, NotFound, NotInEra), `HpBar` i dopiero `BattleScreen`. `components/chips.ts` trzyma `ChipKind` z rodzajami specyficznymi dla feature'ów (`gen`/`game`/`picture` — details, `ability` — versus) oraz `ACTION` i `PAGE_LINK`, które nie są chipami; leży obok `Chip.tsx`. | | `components/menu.tsx` (`MENU_ITEM`, `MenuCursor`), `components/BattleScreen.tsx` (`BattleScreen`, `HpBar`, `StatusBox`); `chips.ts` → `Chip.tsx` (kinds) + `buttons.ts`. |
| 4.4 | Ś | **Słowo „types" znaczy cztery rzeczy**: `src/types/` (DTO PokéAPI), `api/types.ts` (fetch `/type`), `features/types/` (strona tabeli), `domain/pokemonTypes.ts`. `types/damage.ts` zawiera `TypeResource` z `/type` i nie ma nic wspólnego z obrażeniami — koliduje z `domain/damage.ts`. CHANGELOG (`:729-731`) odnotowuje, że poprzedni refaktor rozwiązywał dokładnie tę kolizję (`domain/types` → `pokemonTypes`). | | `types/damage.ts` → `types/typeResource.ts`; `api/types.ts` → `api/typeResource.ts`; rozważyć `src/types` → `src/api/dto` (poza zakresem umiarkowanym — zapisane jako decyzja). |
| 4.5 | Ś | **Infrastruktura mediów w feature.** `features/details/{cry.ts, gifBytes.ts, pokedexVoice.ts (130 linii: meSpeak + WebAudio + bit-crusher), spriteBounds.ts (canvas), useAnimatedOnce.ts}` + `SpriteFrame.tsx` + `domain/gif.ts` (parser binarny GIF). Generyczne biblioteki obok regionów strony. `showdownSprite` (`BattleField.tsx:130-141`) to logika wyboru sprite'a obok `battleSprite` w `domain/sprites.ts:298`. | | `src/media/` (`audio.ts`, `gif.ts`, `gifBytes.ts`, `spriteBounds.ts`, `useAnimatedOnce.ts`, `voice.ts`); `showdownSprite` → `domain/sprites.ts`. |
| 4.6 | Ś | **`domain/resource.ts`** miesza `resourceIdFromUrl` (parsowanie URL API) z builderami URL sprite'ów (`officialArtwork`, `gameSprite`, `crystalAnimated`), które `sprites.ts` importuje z powrotem. | `resource.ts:1-26` | `resourceIdFromUrl` → `api/url.ts`; buildery → `sprites.ts`. |
| 4.7 | N | **`src/era/`** — osobny top-level dla jednego kontekstu, podczas gdy `queryClient` jest w `app/`, a i18n inicjalizuje się w `i18n/`. `EraToggle` (1 importer) leży tu, a bliźniaczy `LanguageSwitcher` w `components/`. | | `app/era/` (provider + context); `EraToggle` → `components/`. |
| 4.8 | N | **`EncountersPage`** to osobna trasa (`/pokemon/:name/encounters`) w folderze `details`. | | `features/encounters/`. |
| 4.9 | N | **Over-split.** `FilterControls.tsx` (42 linie, czysty pass-through `SearchBox` + `ListOptions`, 1 importer). Pięć jednofunkcyjnych plików `api/{catalog,encounters,evolution,moves,types}.ts` (10–15 linii), każdy importowany wyłącznie przez `queries.ts`. `components/Skeleton.tsx` (1 importer). `domain/intersect.ts` (17 linii, 1 importer), `domain/pagination.ts` (8 linii). | | `FilterControls` inline do `ListToolbar`; `api/*` → `api/resources.ts` (decyzja); reszta zostaje — małe pliki w układzie feature-first są w porządku. |
| 4.10 | Ś | **Pliki o wielu odpowiedzialnościach.** `MoveCalc.tsx` 493 linie: hook `useEdited`, `MoveSide`, `Field`, `StatInputs`, `Result` (fetch + cały pipeline obrażeń), `hitsLine`, `firstOfEach`. `VersusPage.tsx` 349: hook `useFighter`, `abilityOf`, `Corner`, `Message` (10 propsów), `Problem`, `TabButton`. `MoveList.tsx` 306: lista + panel boczny + „healing" stanu po zmianie ery + `MoveRows`/`MoveRow`/`MethodHeading`. `sprites.ts` 311: katalog gier / helpery set-id / rozwiązywanie URL / parser kluczy i warianty / `battleSprite`. `moves.ts` 320: akcenty / `learnsetInEra` / `moveInGame`. `encounters.ts` 218: `splitArea` + agregacja + 3 przebiegi po grach. `TypeChartPage.tsx` 229: jedno drzewo JSX bez podkomponentów (legenda, róg SVG, tabela, lista zmian). `BattleField.tsx` 219: typy modelu + layout + `Slot`/`ShowdownSprite`/`FighterBox` + logika sprite'ów. | | Naturalne szwy w sekcji 5, faza 6. |
| 4.11 | Ś | **Prop drilling w Versus.** `VersusPage` → `Message` (10 propsów) → `MoveCalc` (7) → `MoveSide` (11) → `Result` (10). `sides`, `abilities`, `onMove`, `onLevel`, `chart` schodzą cztery poziomy bez zmian. | `VersusPage.tsx:120-131,258-266`, `MoveCalc.tsx:118-131,242-253` | `VersusContext` (chart, era, sides, abilities, settery) albo złożenie per strona raz na górze. |
| 4.12 | N | **Hooki listy.** Trzy źródła (`useDefaultPage`, `useFilteredPage`, `useSearchResults`) mają ten sam pipeline (nazwy → filtr ery → `fetchQuery(pokemonQuery)` w zbiorczym `useQuery`) i każde własne `isLoading`/`error`; `useListData` rozgałęzia po trybie 4× (`:43`, `:49`, `:67`, `:84`). `useListParams.ts` eksportuje drugi hook `useClampPage` (z jedynym `eslint-disable` w repo, `:165`) i funkcję `activeFilterCount`. Nazwy propsów `FiltersPanel` (`activeTypes`, `itemsPerPage`, `onTypeToggle`) niezgodne z `ListParams`/`ListActions` (`types`, `perPage`, `toggleType`). | | Wspólny `useHydratedPage(names, key)`; `useClampPage` do `useListData`; propsy `FiltersPanel` = `params`/`actions`. |
| 4.13 | N | **Nazewnictwo.** 8 eksportów domyślnych (`Navbar`, `Footer`, `ScrollToTopButton`, `LanguageSwitcher`, `ErrorView`, `Loader`, `EraToggle`, `App`) vs nazwane wszędzie indziej; `function` (`ErrorView`, `Loader`, `App`) vs arrow; `not-found` jedyny folder kebab-case; strony `*Page` poza `NotFound`; `Step` lokalnie w `DexNeighbours.tsx:57` i `EvolutionChain.tsx:159`; `Chip.tsx` obok `chips.ts`. | | Jedna konwencja: nazwane eksporty, arrow, `NotFoundPage`, `features/notFound` lub `features/not-found` dla wszystkich. |
| 4.14 | N | **CSS.** Dwa pliki wejściowe: `index.css` (import w `main.tsx:4`) i `global.css` (import w `App.tsx:21`). Font Google przez render-blocking `@import` w CSS (`global.css:1`). Keyframe o nazwie `l4` i komentarz copy-paste `/* HTML: <div class="loader"></div> */` (`global.css:47-59`). | | Jeden `index.css`; font przez `<link rel="preconnect">` + `<link>` w `index.html`. |
| 4.15 | N | **Typowanie luźne obok istniejących unii.** `MoveInGame.damageClass: string` (`moves.ts:212`) obok `DamageClass` (`damage.ts:8`); `type.name as PokemonType` (`typeChart.ts:96`) obok `isPokemonType`; 9 asercji `!` (`queries.ts:31,73,81,88`, `ListStatus.tsx:24`, `moves.ts:170,284`, `typeChart.ts:59`, `main.tsx:8`); `response.json()` bez typu (`api/pokemon.ts:31`); `{ name: string; url: string }` inline ~8× (`types/pokemon.ts:73,75,98,99,117,150`, `types/damage.ts:15`, `api/pokemon.ts:50`) + lokalny `NamedResource` (`useFilteredPage.ts:12`); `getAllPokemonNames` ręcznie przepisuje `PokemonListResponse["results"]`. | | `NamedApiResource` w `types/`; `damageClass: DamageClass`; `isPokemonType` zamiast rzutowania. |

### 3.5 Martwy kod

Wynik jest skromny i tak należy go czytać: projekt nie ma problemu z martwym kodem.

- **Osierocone pliki: 0.** Każdy `.ts/.tsx/.css/.json` pod `src/` jest osiągalny z
  `main.tsx`. Trzy `.d.ts` są potrzebne (`vite-env.d.ts` dla importów `?url`,
  `types/mespeak.d.ts` bo pakiet nie ma typów, `i18n/i18next.d.ts` dla typowanych kluczy).
- **Nieużywane zależności: 0.** `@vercel/analytics` (`main.tsx:3`), `mespeak`
  (`pokedexVoice.ts`), `i18next-browser-languagedetector` (`i18n/index.ts:3`), `@types/node`
  (`vite.config.ts:1`) — wszystkie w użyciu. Jedyna uwaga: `tailwindcss` i `@tailwindcss/vite`
  siedzą w `dependencies`, a są potrzebne tylko w buildzie.
- **Nieużywane reguły CSS: 0.** `.glitch` (BattleScreen, BattleField), `.loader` (Loader),
  `--font-press-start` (App).
- **Nieużywane klucze `en/common.json`: 0** z 266 (21 bez dosłownego trafienia jest
  pokrytych kluczami dynamicznymi: `error.${type}`, `language.${lng}`,
  `about.polish.counts.${row}`, `about.credits.items.${key}`, `details.${dexPrev|dexNext}`,
  tablice `returnObjects`).
- **Eksporty nieużywane nigdzie: 0.** **Eksporty używane tylko we własnym pliku: 22** —
  pełna lista w Załączniku A. Osiem z nich to typy zwracane przez eksportowane funkcje
  (`DamageRange`, `Hit`, `ProfileGroup`, `Learnset`, `SpeciesDescription`, `SpriteVariant`,
  `ChartChange`, `GifReading`) — te warto zostawić, żeby wołający mogli nazwać typ.
- **Martwe pole typu:** `TypeResource.generation` (`types/damage.ts:16-17`) — opisane
  komentarzem, nigdy nieczytane (kod czyta tylko `past_damage_relations[].generation`).
- **Martwe wartości domyślne:** `getPokemonList(limit = 20, offset = 0)` (`api/pokemon.ts:6`)
  — obaj wywołujący (`:26`, `queries.ts:47`) podają oba argumenty; `20` dubluje
  `DEFAULT_PER_PAGE`.
- **Redundantne klucze i18n:** w EN `encounters.coins`, `encounters.showMore`,
  `encounters.places` (klucze bazowe) nigdy się nie wyświetlają, bo istnieją `_one/_other`;
  w PL te same klucze bazowe **są potrzebne** jako fallback `_other`.
- **Niska pewność:** `pokemon.json` `stats.accuracy` i `stats.evasion` prawdopodobnie nigdy
  nie są wyświetlane (statystyki bazowe to sześć standardowych + `special`), ale slug
  przychodzi z API, więc kod sam tego nie udowodni.
- **Obejścia w kodzie:** 1× `eslint-disable` (`useListParams.ts:165`), 2× `as unknown as`
  (`translated.ts:27,32`, uzasadnione komentarzem), 1× `console.error`
  (`ReadButton.tsx:28`), 0× `TODO`/`FIXME`/`@ts-ignore`/`as any`.

### 3.6 i18n

| # | Waga | Co | Gdzie |
|---|---|---|---|
| 6.1 | Ś | **~85 kB JSON w głównym bundlu dla każdego**, także czytelnika EN: `en/common` 17,5 kB, `pl/common` 18,5 kB, `pl/moves` 31,6 kB, `pl/abilities` 12,2 kB, `*/pokemon` 2,5 kB ×2 — wszystkie statycznie w `i18n/index.ts:5-10`. Dwa wielkie pliki opisów (600 i 737 kB) **są** ładowane leniwie i tylko dla PL (`translated.ts:22-34`) — ten wzorzec można rozszerzyć na resztę PL. | `i18n/index.ts` |
| 6.2 | Ś | **Typowanie.** Tylko `common` jest typowany, i to z pliku EN (`i18next.d.ts:1,8`) — PL nigdy nie jest sprawdzany względem EN. `pokemon` typowany jako otwarty `Record` mimo istnienia `en/pokemon.json` (można `typeof enPokemon` dla stałych grup i `Record` tylko dla slugów). Klucze dynamiczne omijają sprawdzanie (`ErrorView.tsx:9`, `LanguageSwitcher.tsx:28`, `AboutPage.tsx:140`). | `i18n/i18next.d.ts` |
| 6.3 | Ś | **Parytet EN/PL.** Po zdjęciu końcówek pluralnych klucze są identyczne w `common` i `pokemon` (74/74). Różnice tylko w pluralach — zob. 1.10. | |
| 6.4 | N | **Identyczne stringi pod różnymi kluczami** — zob. 2.34. **Niespójne przestrzenie kluczy nawigacji:** `PAGES` w `Navbar.tsx:10-13` używa `types.link` i `nav.versus` (jeden klucz z sekcji strony, drugi z `nav`). | `Navbar.tsx:11-12` |
| 6.5 | N | **Teksty poza `t()`:** `:ON`/`:OFF` (1.11); `alt` z surowym slugiem (1.2); „(JP)" w `EncountersPage.tsx:156` i nazwy gier w `sprites.ts:41-77` (angielskie w obu językach — świadome, nazwy gier są te same); cytaty z gier (`HP:`, `:L`, `ASH`, `POKÉMON`, `VS`, `FIGHT!`) — świadome. | |
| 6.6 | N | **Liczniki na stronie About** (`POLISH_TABLES`, `FORMS`) utrzymywane ręcznie i rozjadą się przy kolejnej aktualizacji słowników — zob. 2.33. | `AboutPage.tsx:15-18` |

### 3.7 Narzędzia, konfiguracja, dokumentacja

| # | Waga | Co | Gdzie |
|---|---|---|---|
| 7.1 | W | **Brak testów.** Żadnego `test` w `package.json`, żadnego runnera. Domena (`damage`, `matchup`, `typeChart`, `evolution`, `encounters`, `moves`, `species`, `sprites`, `gif`) jest czysta i w całości testowalna bez DOM. CHANGELOG ma ręczne linie „Checked" z konkretnymi liczbami (Pikachu Thunderbolt vs Gyarados 124–148 / 72,9–87,1 %, retro 132–156; Weezing/Levitate ×0, Mold Breaker ×1; Snorlax/Thick Fat; Shedinja/Wonder Guard; Filter 1.5; Prism Armor pod Mold Breaker; Dry Skin ×0/×1.25), a `PLAN.md:186-187` opisuje sprawdzanie wzoru „w Node ad hoc". To są gotowe asercje, dziś nigdzie nie uruchamiane. | `package.json:6-11`, `CHANGELOG.md:50-64` |
| 7.2 | Ś | **Brak narzędzi pilnujących struktury.** Bez `knip` (martwe eksporty/pliki/zależności), bez reguły granic importów (`eslint-plugin-boundaries` lub `import-x/no-restricted-paths`), bez `import/no-cycle`. ESLint nie type-aware (`recommended`, nie `recommendedTypeChecked`), bez `jsx-a11y`. | `eslint.config.js` |
| 7.3 | N | **Konfiguracja nieaktualna / niepełna.** `ecmaVersion: 2020` (`eslint.config.js:17`) przy targecie ES2022 i użyciu `??=`/`\|\|=` (parser TS to toleruje, ale wpis jest fałszywy). Lint obejmuje tylko `**/*.{ts,tsx}` — `scripts/gen-ability-keys.mjs` i sam `eslint.config.js` poza nim. `tsconfig.node.json` obejmuje tylko `vite.config.ts`. Alias `@/` zdefiniowany dwa razy (`tsconfig.app.json:20-21`, `vite.config.ts:12`) — nieuniknione bez `vite-tsconfig-paths`, ale warto odnotować. Brak Prettiera: przecinki końcowe niespójne (`moves.ts:171,203,276` bez, `sprites.ts` z), `eslint.config.js` w pojedynczych cudzysłowach bez średników, `src` odwrotnie. | |
| 7.4 | N | **`.claude/settings.local.json` w repozytorium** od pierwszego commita (`631bf07`). `.gitignore:13` ma `*.local`, które **nie pasuje** do `settings.local.json` (wzorzec wymaga, by nazwa kończyła się na `.local`). | `.gitignore`, `.claude/` |
| 7.5 | N | **`PLAN.md` w repozytorium** to plan sesji z asystentem („Agreed with the user (conversation of 2026-10-18)", „The memory `compare-abilities-todo.md`", „never `npm run build`; the dev server stays up", „if the Chrome extension connects"). Zawiera jednak wartościowy backlog fazy 2 Versus (`:177-181`). | `PLAN.md:7-10,177-199` |
| 7.6 | N | **README** mówi „Dockerized on VPS" — w repo i w całej historii gita nie ma `Dockerfile` ani `docker-compose`. Brak sekcji o strukturze folderów, skryptach i konwencjach. `package.json` `version: 0.0.0` przy deklarowanym w CHANGELOG SemVer. | `README.md:33`, `package.json:4` |
| 7.7 | N | **CHANGELOG** 58 kB / 782 linie ręcznej prozy, jedno `###` na commit, wpisy po 50+ linii, własny tag „Checked" obok Added/Changed/Fixed, hashe celowo pominięte. To decyzja stylistyczna, nie błąd — ale koszt utrzymania rośnie liniowo, a część treści dubluje komunikaty commitów. | `CHANGELOG.md` |
| 7.8 | N | **`tailwindcss`, `@tailwindcss/vite`** w `dependencies` zamiast `devDependencies`. | `package.json:13,23` |

---

## 4. Czego nie ruszać

Rzeczy, które wyglądają na kandydatów do „uproszczenia", a są świadomymi i dobrze
uzasadnionymi decyzjami. Refaktor ma je zachować:

- **Era jako tabela reguł** (`domain/era.ts`): każda reguła zależna od ery to pole `DexEra`,
  komponenty pytają erę, nie flagę. Plan dokłada do tej tabeli (`pixelArt`), nie rozmontowuje.
- **`api/queries.ts` jako rejestr zasobów** z `queryOptions` — dobry wzorzec; problem jest
  tylko w tym, że pięć zapytań go omija (2.22).
- **Leniwe tabele PL** (`i18n/translated.ts`) — 1,3 MB nigdy nie trafia do bundla; wzorzec
  do rozszerzenia (6.1), nie do zmiany.
- **Czysta domena bez Reacta** i brak cykli importów.
- **`NotFoundError` vs błąd transportu** (`api/client.ts`, `queryClient.ts`): 404 nie jest
  retry'owane, 500 jest.
- **`AdBox` / `StadiumTitle` / `AdAction`** i **`Chip` / `chipClass`** — prawdziwe reuse.
- **`VersusAd` w `features/types` i `TypeChartAd` w `features/versus`** — reklama żyje tam,
  gdzie jest renderowana; spójna zasada.
- **`GROUPS_BY_GEN` vs `VERSIONS_BY_GEN`** (`games.ts`) — dwie realne przestrzenie kluczy
  PokéAPI, nie duplikat; komentarz `:71-75` to tłumaczy.
- **`dexNeighbourIds` z własnym sufitem** (`lastDexId(era.maxGen)` zamiast `era.maxDexId`) —
  udokumentowane w `dex.ts:57-73`: formy nie są miejscem, przez które się przechodzi.
- **Zawsze włączony fetch indeksu nazw** (`useSearchResults.ts:26`) — komentarz `:66-67`.
- **`useListData` wołające trzy źródła naraz** — poprawne wobec reguł hooków, każde źródło
  bramkowane `enabled`.
- **Moduły audio/GIF z własnym cache** — można zostawić poza React Query, jeśli zapisze się
  dlaczego (2.32).
- **Komentarze „dlaczego"** w całym kodzie — przy przenoszeniu kodu komentarze idą razem z nim.

---

## 5. Plan refaktoru

Zasady:

- Każda faza to **osobny commit lub PR**, po którym aplikacja zachowuje się identycznie
  (fazy 0–7) albo zmienia się w dokładnie wymieniony sposób (faza 8).
- Każda faza ma kryterium **„done"** sprawdzalne grepem lub testem, nie na oko.
- Weryfikacja po każdej fazie: `npm run check` = `tsc -b && eslint . && vitest run && knip`
  (skrypt powstaje w fazie 0). **Nigdy `npm run build` przy działającym dev serwerze.**
- Rozmiar: **S** ≤ pół dnia, **M** 1–2 dni, **L** 2–4 dni.
- Kolejność: 0 → 1 → 2 → 3 → 4 → 5 → 6 → 7. Faza 8 może wejść po fazie 2 (punkty 8.1, 8.3,
  8.5–8.9) i po fazie 3 (8.4). Fazy 1 i 7 są niezależne i można je robić równolegle z innymi.

### Faza 0 — siatka bezpieczeństwa (S/M)

**Cel:** zanim cokolwiek się ruszy, domena ma testy, a repo ma narzędzie do wykrywania
martwego kodu.

**Kroki:**
1. `npm i -D vitest` (bez jsdom — domena nie dotyka DOM). Skrypty: `"test": "vitest run"`,
   `"test:watch": "vitest"`, `"knip": "knip"`, `"check": "tsc -b && eslint . && vitest run && knip"`.
2. Testy obok plików (`src/domain/*.test.ts`) albo w `src/domain/__tests__/` — jedna
   konwencja. Przypadki wzięte wprost z CHANGELOG „Checked" i z komentarzy w kodzie:
   - `damage.test.ts`: `battleStats` (IV/DV, Shedinja HP 1), `damageRange` — Pikachu
     Thunderbolt 90 vs Gyarados (70 SpA / 120 SpD / 170 HP, STAB, ×4) → 124–148;
     retro Crystal Thunderbolt 95 → 132–156; `hitsToKo`; `firstToMove`; `damageClassInEra`
     (Bite special w retro, Gust physical).
   - `matchup.test.ts`: Levitate vs Ground ×0; Mold Breaker vs Levitate ×1; Prism Armor pod
     Mold Breaker nadal 0.75; Thick Fat Fire ×0.5; Wonder Guard (Normal ×0, Fire ×2 dla
     Shedinja); Filter ×2 → 1.5; Scrappy Normal→Ghost ×1; Tinted Lens ×0.5 → ×1; Dry Skin
     Water ×0 / Fire ×1.25; `defensiveProfile` grupuje i sortuje malejąco.
   - `typeChart.test.ts` (fixture z dwoma–trzema `TypeResource` z `past_damage_relations`):
     `relationsIn` wybiera najwcześniejszy zbiór obejmujący generację; `chartChanges`
     wykrywa Gen I quirki (Ice→Fire, Bug↔Poison, Ghost→Psychic) i Gen VI (Steel vs Ghost/Dark).
   - `evolution.test.ts`: re-rooting (Mime Jr. → Mr. Mime w retro, Azurill → Marill),
     `stepsForForm` dla Sandshrew/Sandslash-alola, `methodInEra` nie bierze Sword/Shield dla
     retro, `formSuffix`, `treeDepth`.
   - `encounters.test.ts`: Zubat Dark Cave 30+5+4 → jedna linia 39 %; `max_chance` nigdy nie
     użyte; warunki wykluczające się jako alternatywy; `splitArea`; sortowanie po grze.
   - `moves.test.ts`: `learnsetInEra` wybiera najnowszą grę z level-up (Typhlosion vs
     Champions `train`), duplikat Ember 1/12 zostaje; `moveInGame` Thunderbolt 95 w Crystal
     i 90 w SV; `printedIn` fallback Crystal → Gold/Silver.
   - `species.test.ts`: `getDescription` wybiera najnowszą w erze, fallback na najstarszą
     dla Pokémona spoza ery, PL przez `translated`, czyszczenie `\f\n­`; `getGenus`.
   - `sprites.test.ts`: `parseKey` (`back_shiny_transparent`, `front_transparent_gray`),
     `spriteVariants` preferuje transparentne, `battleSprite` fallback z lustrzanym przodem,
     `activeSpriteSet`.
   - `gif.test.ts`: ręcznie złożony minimalny GIF z dwiema klatkami i opóźnieniami 0 i 50 →
     `cycleMs` 600, dwa prostokąty.
   - `dex.test.ts`, `pokemonTypes.test.ts`, `intersect.test.ts`, `pagination.test.ts` — krótkie.
3. `npm i -D knip`, `knip.json` z `entry: ["src/main.tsx", "scripts/*.mjs"]`,
   `project: ["src/**", "scripts/**"]`. Pierwszy przebieg powinien zgłosić dokładnie 22
   eksporty z Załącznika A (i nic więcej) — to potwierdza, że narzędzie działa.
4. CHANGELOG: jedna linia „Added — testy domeny; `npm run check`".

**Done:** `npm run check` zielony; ≥ 60 asercji; knip bez nowych zgłoszeń poza znanymi.

### Faza 1 — tokeny wizualne (S)

**Cel:** jeden plik mówi, jakie są kolory i wymiary aplikacji.

**Kroki:**
1. `src/index.css` `@theme`: `--color-dex-red: #E12025`, `--color-dex-red-dark: #c11a1e`,
   `--color-dex-yellow: #FECB09`, `--color-dex-blue: #356DB2`, `--color-dex-bg: #EAEBF2`,
   `--color-gb-green: #8BAC0F`, `--color-gb-green-dark: #306230`, `--color-picture: #7D3C98`,
   `--color-effect-super`, `--color-effect-super-4x`, `--color-effect-weak`,
   `--color-effect-weak-4x`; `--spacing-nav: 3rem`.
2. `@utility focus-ring { @apply focus-visible:outline-2 focus-visible:outline-offset-2
   focus-visible:outline-white }` i `focus-ring-dark`.
3. Zamiana w kodzie: `bg-[#E12025]` → `bg-dex-red` itd. (sed po liście z Załącznika B),
   `#FFCD0B` → `bg-dex-yellow`, `h-12`/`pt-12`/`top-12`/`3rem` w 6 miejscach z 2.3 →
   `h-nav`/`pt-nav`/`top-nav`/`var(--spacing-nav)`; `top-16` w `MoveList` →
   `top-[calc(var(--spacing-nav)+1rem)]`.
4. Scalić `global.css` do `index.css` (scrollbar, `.glitch`, `.loader` z nazwaną
   animacją); font przez `<link rel="preconnect">` + `<link href=…>` w `index.html`; usunąć
   import w `App.tsx`.
5. `TYPE_STYLES` i `METHOD_ACCENTS` zostają na razie (przenoszone w fazie 5), ale ich hexy
   nie wchodzą w kolizję z tokenami.

**Done:** `grep -rhoE '#[0-9a-fA-F]{6}' src --include=*.tsx --include=*.ts | sort -u` zwraca
wyłącznie wartości z `TYPE_STYLES` i `METHOD_ACCENTS`; `grep -rn 'top-12\|pt-12\|h-12' src`
= 0; jeden plik CSS; wizualnie bez zmian (porównanie zrzutów 5 stron w obu erach).

### Faza 2 — jedno źródło prawdy w domenie (M)

**Cel:** każda reguła domenowa ma jedną funkcję; komponenty i hooki jej używają.

**Nowe/rozszerzone moduły:**
- `domain/era.ts`: `DEFAULT_ERA = "modern"`, `isInEra(id, era)`, `genInEra(gen, era)`,
  `newestInEra(entries, genOf, era)`, `inForceAt(entries, orderOf, target)`, pole
  `pixelArt: boolean` w `DexEra` (MODERN false, RETRO true).
- `domain/text.ts`: `cleanFlavorText`, `inLanguage`, `type TranslatedText`,
  `flattenTranslated`.
- `domain/stats.ts`: `STAT` (`hp`, `attack`, …, `special`), `SCALE_MAX`, `statValue`,
  `barPercent`, `abilitiesInOrder`.
- `domain/pokemonView.ts`: `typingInEra(pokemon, era)`.
- `domain/pagination.ts`: `pageSlice`, `pageCount`.
- `domain/damage.ts`: `MIN/MAX/DEFAULT_LEVEL`, `clampLevel`, `computeHit(…)` (z
  `MoveCalc.Result:382-410`), `firstOfEach` → `domain/moves.ts` jako `uniqueMoves`.
- `domain/search.ts`: `matchNames(names, term, era)` (normalizacja: trim, lowercase, spacje
  → myślnik — **to zmienia zachowanie listy**, więc sama normalizacja wchodzi w 8.3; w tej
  fazie funkcja przyjmuje gotowy `term`).
- `domain/dex.ts`: `getGeneration` w `species.ts` zwraca `genSlugOf(...)` zamiast
  trzeciego parsowania prefiksu.
- `domain/pokemonTypes.ts`: `TYPE_STYLES: Record<PokemonType, string>`.

**Przepisać na nie:** 8 miejsc `maxDexId` (2.6), 7 pętli „w erze" (2.7), 4 „in force" (2.8),
5 miejsc `=== "artwork"` (2.9), 6 `typingOf(typesInEra)` (2.10), skalę paska (2.11), slugi
statów (2.12), stałe poziomu (2.13), czyszczenie tekstu (2.15), hydratację (2.17 — wspólny
`hydratePokemon(names)` w `api/` z jedną polityką: `allSettled`, pominięte 404 logowane raz),
offsety (2.18). `useFighter`, `PokemonDetailsPage`, `EncountersPage` używają `isInEra`.

**Done:** `grep -rn 'era\.maxDexId' src | grep -v domain/era.ts` = 0;
`grep -rn '=== "artwork"\|!== "artwork"' src/features` = 0;
`grep -rn 'typingOf(typesInEra' src` = 0; testy z fazy 0 zielone (plus nowe dla `isInEra`,
`newestInEra`, `inForceAt`, `computeHit`).

### Faza 3 — jedno źródło prawdy w aplikacji (M)

**Cel:** trasy, stan historii, klucze zapytań, język, linki zewnętrzne — po jednym miejscu.

**Kroki:**
1. `src/app/routes.ts`: `paths = { list: "/", pokemon: "/pokemon/:name", encounters:
   "/pokemon/:name/encounters", types: "/types", versus: "/versus", about: "/about",
   formerVersus: "/compare" }` + buildery `pokemonPath(name)`, `encountersPath(name)`,
   `versusPath({ a?, b?, aa?, am?, … })`, `listPath({ type?, gen? })`. `App.tsx` używa
   `paths`; 16 miejsc z 2.21 używa builderów. Klucze parametrów (`a`, `b`, `aa`, `type`,
   `gen`, `page`, `per`, `q`) eksportowane z `routes.ts` i importowane przez
   `useVersusParams`/`useListParams`.
2. `src/app/listOrigin.ts`: `interface ListOriginState { from: string; scrollY: number }`,
   `readOrigin(location)`, `originState(location)` (dla `state={…}`), `restoreState(origin)`
   dla `useScrollRestore`. Zastępuje casty w `BackButton`, `useScrollRestore` i trzy
   pass-through.
3. `api/queries.ts`: `pageDetailsQuery(page, perPage, era)`, `filteredDetailsQuery(…)`,
   `typeListsQuery(types)`, `searchQuery(term, era)`, `translatedTableQuery(which, locale)`;
   hooki listy i `translated.ts` przestają pisać `queryKey` ręcznie. `speciesQuery` dostaje
   `enabled` raz (dziś `PokemonDetailsPage:52-55` powtarza warunek).
4. `features/shared/useSearchParamsPatch.ts` (jedna semantyka: `null` i `""` usuwają);
   `useListParams` i `useVersusParams` na nim.
5. `i18n/useLocale.ts` (`DEFAULT_LOCALE = "en"`, `useLocale()`); `VOICES` typowane po
   `SUPPORTED_LANGUAGES`; `translated.ts` sprawdza `locale in POLISH` zamiast `=== "pl"`.
6. `i18n/labels.ts`: `makeLabelHook(ns, prefix)`; `usePokemonLabel` (na razie = `humanize`,
   konwencja finalna w 8.2), `useGameLabel` nad jedną tabelą `GAME_NAMES` (wersje i grupy;
   `SPRITE_GAMES` traci pole `name` i czerpie z niej). `evolutionCondition` używa
   `useMoveLabel` dla `known_move` (**zmiana zachowania → 8.9**, tu tylko przygotowanie).
7. `src/app/links.ts`: `REPO`, `POKEAPI`, `SPRITES_REPO`, `WIKI_PL`, `WIKI_LICENSE`,
   `ESPEAK`, `MESPEAK`, `FONT`, `POKERED`; `Footer`, `AboutPage` (także `<Trans>`), README
   z niego. `src/app/storageKeys.ts`.
8. `useNotInEraText(pokemon)` w `features/` wspólny dla `NotInEra` i `VersusPage.Problem`.

**Done:** `grep -rnE '"/(pokemon|versus|types|about)' src/features src/components` = 0;
`grep -rn 'queryKey:' src | grep -v api/queries.ts` = 0;
`grep -rn 'resolvedLanguage ?? "en"' src` = 0; `grep -rn 'restoreScroll\|scrollY' src` tylko w
`listOrigin.ts` i `PokemonCard` (zapis).

### Faza 4 — komponenty współdzielone (M)

**Cel:** każdy powtarzany element UI ma jeden komponent.

**Kroki:**
1. `components/TypeBadge.tsx` (`as="span" | "link" | "toggle"`, `size="xs" | "sm"`,
   `active`, `disabled`) — zastępuje 6+ miejsc z 3.1; `TypeFilter` używa `TypeBadge
   as="toggle"` i `<Chip kind="ability">` dla „All".
2. `components/badges.tsx`: `ClassBadge`, `LangMarker`, `EffectChip` (z `Matchup.tsx`).
3. `components/Skeleton.tsx`: `Skeleton.Block`, `Skeleton.Grid`, `Skeleton.MoveBody`;
   usunąć 4 ad hoc `animate-pulse`.
4. `components/InlineError.tsx`; `ErrorView` z propem `message: string` (koniec unii).
5. `components/buttons.ts`: `button.action`, `button.ghost`, `button.more`, `button.danger`,
   `input.base`; `chips.ts` traci `ACTION`/`PAGE_LINK`.
6. `components/menu.tsx` (`MENU_ITEM`, `MenuCursor` z `dim`/`visible`); `BattleScreen.tsx`
   zostaje z `BattleScreen`, `HpBar`, `StatusBox`, `Slot` i oba ekrany bitwy z nich budują
   (3.4). Wszystkie ręczne `>` → `MenuCursor`.
7. `components/GbBox.tsx`, `PageContainer`, `SectionCard`; `ChipRow` w `PokemonArtwork`.
8. `features/shared/`: `useScrollTopOn(dep)`, `useEscape(onClose)`, `useEraToggle()`,
   `useLanguageSwitch()`; `Navbar.GameBoyMenu`, `EraToggle`, `LanguageSwitcher` na hookach.

**Done:** `grep -rc 'animate-pulse' src` = tylko `Skeleton.tsx`;
`grep -rn 'typeClass(' src` tylko w `TypeBadge.tsx`, `TypeChartPage`, `TypeChartAd`;
`grep -rn '{">"}' src` tylko `menu.tsx`; `grep -rn 'role="alert"' src` tylko `InlineError` i
`ErrorView`; `grep -c 'border-4 border-black bg-white' src -r` = 1.

### Faza 5 — przeniesienia i granice (M)

**Cel:** kod leży tam, gdzie się go szuka; granice między warstwami pilnuje lint.

**Przeniesienia** (każde osobnym commitem `refactor:` z `git mv`, żeby historia szła za
plikiem):
- `features/types/effectiveness.ts` → `components/effectiveness.ts` (`printed`,
  `effectClass`) + `phraseKey` → `i18n/effectiveness.ts`.
- `features/types/useTypeChart.ts` → `api/useTypeChart.ts`.
- `TYPE_STYLES` → `components/typeStyles.ts`; `METHOD_ACCENTS`, `NO_ACCENT`,
  `moveMethodAccent` → `features/details/moveAccents.ts`.
- `parseTypes`/`serializeTypes` → `features/list/typeParam.ts`.
- `domain/resource.ts`: `resourceIdFromUrl` → `api/url.ts`; `officialArtwork`, `gameSprite`,
  `crystalAnimated`, `SPRITE_ROOT` → `domain/sprites.ts`; plik znika.
- `types/damage.ts` → `types/typeResource.ts`; `api/types.ts` → `api/typeResource.ts`.
- `features/details/{cry,gifBytes,pokedexVoice,spriteBounds,useAnimatedOnce}.ts`,
  `SpriteFrame.tsx`, `domain/gif.ts` → `src/media/`.
- `features/details/EncountersPage.tsx` + `EncountersLink.tsx` → `features/encounters/`.
- `features/not-found/NotFound.tsx` → `components/NotFound.tsx` (lub `features/notFound/`
  z nazwą `NotFoundPage` — decyzja 6.2).
- `src/era/{context,EraProvider}` → `src/app/era/`; `EraToggle` → `components/`.
- `Side`, `Known`, `Fighter` → `features/versus/model.ts`; `showdownSprite` →
  `domain/sprites.ts`.
- `VersusLink`: `PokemonHeader` dostaje `actions?: ReactNode`, `PokemonDetailsPage` wkłada
  `<VersusLink>` — details przestaje importować versus.
- `tailwindcss`, `@tailwindcss/vite` → `devDependencies`.

**Reguła granic** (`eslint-plugin-boundaries` lub `no-restricted-imports` z wzorcami):
`domain` → `types`; `api` → `domain`, `types`; `media` → nic z aplikacji; `i18n` →
`domain`, `types`; `components` → `domain`, `i18n`, `app/era`, `api`; `features/X` →
wszystko poza `features/Y` (dozwolony tylko `features/Y/index.ts`, jeśli decyzja 6.2 tak
mówi); `app` → wszystko.

**Done:** `npm run lint` z regułą granic zielony bez wyjątków; `grep -rn 'from "@/features'
src/features` pokazuje tylko importy z własnego feature'u (lub tylko `index.ts`);
`grep -rn 'bg-\[' src/domain` = 0.

### Faza 6 — rozbicie dużych plików (M/L)

**Cel:** żaden plik w `features/` nie przekracza ~250 linii; żaden komponent nie dostaje
więcej niż ~7 propsów; logika do przetestowania siedzi w domenie.

- `MoveCalc.tsx` → `MoveCalc.tsx` (orkiestracja, ~80 linii), `MoveSide.tsx`,
  `StatInputs.tsx`, `HitResult.tsx` (używa `computeHit` i `useMoveInGame`), `useEdited.ts`
  (`features/shared/` — jest generyczny).
- `VersusPage.tsx` → `VersusPage.tsx`, `useFighter.ts` (na `usePokemonStatus`),
  `VersusMessage.tsx`, `TabButton.tsx`, `VersusContext.tsx` (chart, era, sides, abilities,
  settery) — koniec drillingu 4 poziomy.
- `features/shared/usePokemonStatus(name)` → `"empty" | "loading" | "notFound" | "error" |
  "outOfEra" | "ready"`; `PokemonDetailsPage` i `EncountersPage` mapują status na widok
  przez wspólny `PokemonStatusGate`.
- `features/shared/useMoveInGame(name, game)`.
- `MoveList.tsx` → `MoveList.tsx`, `MovePanel.tsx` (aside), `MoveRows.tsx`,
  `usePickedMoves.ts` (healing stanu).
- `sprites.ts` → `spriteCatalog.ts` (`SPRITE_GAMES`, `gameSet`, `setGame`, `genOpening`),
  `sprites.ts` (`spriteUrl`, `spriteUrlById`, `spriteSets`, `activeSpriteSet`,
  `battleSprite`, `showdownSprite`), `spriteVariants.ts` (`parseKey`, `spriteVariants`).
- `moves.ts` → `learnset.ts` (`learnsetInEra`, `uniqueMoves`, `METHOD_ORDER`),
  `moveInGame.ts`.
- `encounters.ts`: trzy przebiegi po grach na `genInEra`/`newestInEra` z fazy 2 — plik
  skraca się sam.
- `TypeChartPage.tsx` → `Legend.tsx`, `ChartCorner.tsx`, `ChartTable.tsx` (z hookiem
  `useTrace`), `ChangesList.tsx`.
- `BattleField.tsx` → bez typów i bez `showdownSprite` (już przeniesione) — zostaje layout.
- `useListData` + trzy źródła → `useHydratedPage(names, key, enabled)` wspólny;
  `useClampPage` wchodzi do `useListData` bez `eslint-disable`; propsy `FiltersPanel` =
  `params`/`actions`; `FilterControls` inline do `ListToolbar`.

**Done:** `wc -l src/features/**/*.tsx | sort -rn | head -1` ≤ 250; brak `eslint-disable` w
`src`; testy zielone; porównanie zrzutów 5 stron × 2 ery × 2 języki bez różnic.

### Faza 7 — porządki (S)

- `.gitignore`: dodać `.claude/settings.local.json` (lub `.claude/*.local.json`);
  `git rm --cached .claude/settings.local.json`.
- `PLAN.md`: przenieść backlog fazy 2 Versus do sekcji „Backlog" w `CHANGELOG.md` lub do
  issue; plik usunąć albo zostawić wyłącznie jako backlog bez treści sesyjnej (decyzja 6.4).
- README: usunąć „Dockerized on VPS" (lub dodać Dockerfile), dodać sekcje „Struktura"
  (po fazie 5), „Skrypty" (`dev`, `check`, `test`, `knip`), „Konwencje" (tokeny, routes,
  granice warstw), „i18n" (skąd polskie tabele, jak dodać wpis).
- `eslint.config.js`: `ecmaVersion: "latest"`, lint `**/*.{ts,tsx,mjs,js}`, rozważyć
  `recommendedTypeChecked` i `jsx-a11y`; Prettier z jedną konfiguracją dla `src` i configów.
- `tsconfig.node.json`: dodać `eslint.config.js`, `scripts/**` (lub przepisać skrypt na TS).
- `i18n/i18next.d.ts`: `pokemon: typeof enPokemon & { types: Record<string,string>; … }`
  dla grup stałych; test parytetu kluczy EN/PL jako `i18n/locales.test.ts` (spłaszczenie +
  porównanie, plurale tolerowane).
- Usunąć redundantne klucze EN `encounters.coins/showMore/places` (bazowe).
- `getPokemonList` bez wartości domyślnych; `getAllPokemonNames: Promise<PokemonListResponse["results"]>`;
  `NamedApiResource`; `MoveInGame.damageClass: DamageClass`; `isPokemonType` zamiast
  rzutowania w `typeChart.ts:96`; usunąć `TypeResource.generation` lub zacząć czytać.
- Zdjąć `export` z 14 symboli z Załącznika A (poza 8 typami zwracanymi); knip pilnuje dalej.
- Jedna konwencja eksportów (nazwane) i deklaracji komponentów (arrow); `not-found` →
  zgodnie z decyzją 6.2.
- `package.json`: `version` 0.1.0 i tag, skoro CHANGELOG deklaruje SemVer.

**Done:** `git ls-files .claude` puste; `npm run check` zielony; README opisuje strukturę po
fazie 5.

### Faza 8 — naprawy niespójności (zmiana zachowania; decyzja per punkt)

Każdy punkt to osobny commit `fix:` z własną linią w CHANGELOG i testem tam, gdzie to domena.

| # | Zmiana | Rekomendacja | Test |
|---|---|---|---|
| 8.1 | Klasa obrażeń w retro na stronie szczegółów (1.1) | `moveInGame` zwraca `damageClass` policzone przez `damageClassInEra` (ma `game` → era przez `generationOfVersionGroup`); `MoveDetails` i `MoveCalc` czytają to samo pole. | `moves.test.ts`: Bite w Crystal → special, Gust → physical, Crunch w SV → physical. |
| 8.2 | Jedna konwencja nazwy Pokémona (1.2) | `usePokemonLabel`: `humanize` + mała tabela wyjątków PokéAPI (`mr-mime` → „Mr. Mime", `ho-oh` → „Ho-Oh", `farfetchd` → „Farfetch'd", `nidoran-f/m` → „Nidoran♀/♂", `type-null`, `jangmo-o`…) — PokéAPI nie daje nazw wyświetlanych w `/pokemon`, a `/pokemon-species.names` kosztowałoby request na kartę. Używana w kartach, nagłówku, `alt`, aria, Versus. Usunąć `capitalize` ze slugów. | Snapshot kilku slugów. |
| 8.3 | Jedna normalizacja wyszukiwania (1.3) | `matchNames` z fazy 2 z normalizacją spacje → myślnik w obu miejscach; „mr mime" działa na liście. | `search.test.ts`. |
| 8.4 | Zakładka Versus w URL (1.4) | `?tab=types\|stats\|moves` w `useVersusParams`, domyślnie `types`, zapis `replace: true`; `swap` zachowuje. | ręcznie: link `?a=pikachu&b=gyarados&am=thunderbolt&tab=moves`. |
| 8.5 | Generacja z jednego źródła (1.5) | `generationOf(pokemon, species?)`: dla id ≤ 1025 z id (bez requestu), dla form z `species.generation` jeśli jest, inaczej null; karta i nagłówek wołają to samo. | `dex.test.ts`. |
| 8.6 | `AbilityList` sortuje po `slot` (1.7) | `abilitiesInOrder` z fazy 2. | `stats.test.ts`. |
| 8.7 | `genRoman` w `ListOptions` (1.8) | jednolinijkowa. | — |
| 8.8 | Plurale PL `encounters.places_one/_few/_many/_other` (1.10) | dodać 4 klucze, usunąć bazowy w EN. | `locales.test.ts`. |
| 8.9 | `useMoveLabel` w warunku ewolucji (1.9) | jednolinijkowa; PL zobaczy „zna ruch Trzask" zamiast „Ancient Power". | — |
| 8.10 | `:ON`/`:OFF` przez `t()` (1.11) | klucze `era.on`/`era.off`. | — |
| 8.11 | Leniwe ładowanie zasobów i18n per język (6.1) | `i18n` z `resourcesToBackend(() => import(./locales/${lng}/${ns}.json))` + `Suspense` na poziomie `App`; EN przestaje pobierać 60 kB polskich słowników. Opcjonalne, wydajnościowe. | Lighthouse przed/po. |

---

## 6. Decyzje do podjęcia przed startem

1. **Nazwa Pokémona (8.2):** „Mr Mime" (czysty `humanize`), „Mr. Mime" (tabela wyjątków) czy
   zostawić `capitalize` + myślniki i tylko ujednolicić? Rekomendacja: tabela wyjątków.
2. **Importy między feature'ami:** zakaz bezwzględny (wszystko wspólne idzie do
   `components/`, `api/`, `features/shared/`) czy dozwolone przez publiczny
   `features/X/index.ts`? Rekomendacja: zakaz bezwzględny — jest tylko kilka krawędzi i każda
   ma naturalny dom. Pociąga za sobą: `NotFound` → `components/`, `not-found/` znika.
3. **`api/*`:** scalić pięć jednofunkcyjnych plików w `api/resources.ts`, czy zostawić per
   zasób (czytelne przy dodawaniu kolejnych)? Rekomendacja: zostawić, bo `queries.ts` i tak
   jest jedynym importerem — koszt zerowy; usunąć z listy fazy 5.
4. **`PLAN.md` i CHANGELOG:** czy `PLAN.md` ma zniknąć z repo (backlog do CHANGELOG), i czy
   CHANGELOG ma dalej rosnąć w obecnej formie, czy przejść na krótkie wpisy + link do commita?
5. **i18n per język (8.11):** czy wprowadzać `Suspense` na starcie aplikacji dla ~60 kB
   oszczędności u czytelnika EN? Rekomendacja: tak, ale jako ostatnia rzecz, po fazie 7.
6. **Cache GIF-ów (2.32):** przez React Query czy zostaje `Map` z komentarzem? Rekomendacja:
   zostaje z komentarzem — bajty nie są „danymi" w sensie React Query, a `spriteBounds`
   odpowiada synchronicznie z cache, czego `useQuery` nie da.
7. **`src/types` → `src/api/dto`:** poza zakresem umiarkowanym, ale usunęłoby ostatnie z
   czterech znaczeń słowa „types". Do rozważenia przy fazie 5 — koszt to tylko `git mv` +
   sed po importach.

---

## Załącznik A — eksporty używane tylko we własnym pliku (22)

| Plik:linia | Symbol | Uwaga |
|---|---|---|
| `domain/damage.ts:8` | `type DamageClass` | typ parametru — zostawić |
| `domain/damage.ts:75` | `interface DamageRange` | typ zwracany — zostawić |
| `domain/era.ts:28` | `const MODERN` | zdjąć `export` (jest `ERAS`) |
| `domain/era.ts:59` | `const ERA_NAMES` | zdjąć |
| `domain/gif.ts:8` | `interface GifReading` | typ zwracany — zostawić |
| `domain/matchup.ts:65` | `interface Hit` | typ zwracany — zostawić |
| `domain/matchup.ts:82` | `interface ProfileGroup` | typ zwracany — zostawić |
| `domain/moves.ts:12` | `interface MoveGroup` | zdjąć |
| `domain/moves.ts:18` | `interface Learnset` | typ zwracany — zostawić |
| `domain/moves.ts:33` | `interface MethodAccent` | zdjąć |
| `domain/pokemonTypes.ts:28` | `const TYPE_NAMES` | zdjąć (jest `typesUpTo`) |
| `domain/species.ts:24` | `interface SpeciesDescription` | typ zwracany — zostawić |
| `domain/sprites.ts:81` | `const gameSet` | zdjąć |
| `domain/sprites.ts:199` | `interface SpriteVariant` | typ zwracany — zostawić |
| `domain/typeChart.ts:16` | `const relationsIn` | zdjąć |
| `domain/typeChart.ts:71` | `interface ChartChange` | typ zwracany — zostawić |
| `era/context.ts:4` | `interface EraContextValue` | zdjąć |
| `features/details/spriteBounds.ts:6` | `interface SpriteBounds` | zdjąć |
| `features/versus/useVersusParams.ts:4` | `const DEFAULT_LEVEL` | przenosi się do domeny (faza 2) |
| `types/pokemon.ts:9` | `interface PokemonPastTypes` | zdjąć |
| `types/pokemon.ts:201` | `interface VersionEncounter` | zdjąć |
| `i18n/index.ts:52` | `export default i18n` | `main.tsx` importuje tylko dla efektu ubocznego; zdjąć lub zostawić świadomie |

## Załącznik B — listy do odhaczania (wyniki grepa, stan `ffdd282`)

**Kolory hex (wystąpień):** `#E12025` 30 · `#FECB09` 23 · `#356DB2` 16 · `#EAEBF2`/`#eaebf2` 9 ·
`#C11A1E` 6 · `#29CE21` 5 · `#FF6300` 4 · `#B542FF` 4 · `#3194FF` 4 · `#FFCD0B` 3 ·
`#7D3C98` 3 · `#EE8130` 2 · `#8BAC0F` 2 · `#7AC74C` 2 · po 1: `#F95587 #F7D02C #F1F1F1
#E2BF65 #D685AD #CA924D(komentarz) #C22E28 #B9521C #B7B7CE #B6A136 #A98FF3 #A8A77A #A6B91A
#A33EA1 #9C3100 #96D9D6 #735797 #705746 #6F35FC #6B00A5 #6390F0 #4E8A2E #306230 #106310
#104AB5`. Z tego 18 to `TYPE_STYLES`, 8 to `METHOD_ACCENTS`, 4 to `effectiveness.ts`,
reszta (9) to kolory marki/tła rozsiane po komponentach.

**Literały tras (16):** `App.tsx:26`, `Footer.tsx:29`, `AboutPage.tsx:161,164,167,170`,
`DexNeighbours.tsx:91`, `EncountersLink.tsx:31`, `EncountersPage.tsx:85`,
`EvolutionChain.tsx:252`, `TypeBadges.tsx:21,36`, `VersusAd.tsx:21`, `BattleField.tsx:192`,
`TypeChartAd.tsx:21`, `VersusLink.tsx:12` (+ `/` w `NotFound`, `NotInEra`, `BackButton`,
`Navbar`, `PokemonCard`).

**`queryKey` poza `api/queries.ts` (5):** `useDefaultPage.ts:39`, `useFilteredPage.ts:48,92`,
`useSearchResults.ts:33`, `i18n/translated.ts:43`.

**`window.scrollTo` (6):** `ScrollToTopButton.tsx:18`, `AboutPage.tsx:100`,
`EncountersPage.tsx:52`, `PokemonDetailsPage.tsx:36`, `useListParams.ts:102`,
`useScrollRestore.ts:24`.

**`[image-rendering:pixelated]` (9 w 7 plikach):** `BattleScreen.tsx`, `EncountersPage.tsx`,
`EvolutionChain.tsx`, `SpriteFrame.tsx` ×2, `PokemonCard.tsx`, `VersusAd.tsx`,
`BattleField.tsx` ×2.
