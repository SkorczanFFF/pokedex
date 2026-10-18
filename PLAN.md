# Versus: a Moves tab that calculates damage, and abilities that change a matchup

## Context

Versus (`/versus`) shows two Pokémon on the Game Boy battle screen with two tabs: **Types**
(what each one's types do to the other, product over two types) and **Stats** (base stats
back to back). It counts types only; a note says abilities such as Levitate are not counted.
The memory `compare-abilities-todo.md` records abilities and real moves as the planned
follow-up. This is that follow-up.

Agreed with the user (conversation of 2026-10-18):

- A third tab, **Moves**, works as a **calculator**, not a simulation: pick a move for each
  side, get a number. No turns, no accuracy rolls, no winner.
- Moves come from a **dropdown of the Pokémon's own learnset in the era**, one move per
  side at a time (not four slots).
- **Typed in by hand**: level per side (default 50), the computed stats (prefilled,
  editable), the move's power (prefilled, editable, because PokéAPI gives `null` for
  Seismic Toss, Low Kick, Gyro Ball). No IV/EV/nature fields; assumptions stated in a note.
- **Abilities, phase 1**: only those that change the type multiplier (immunities, halves,
  Wonder Guard, Filter family, Scrappy, Tinted Lens, Mold Breaker family). Stat-boosting
  abilities (Huge Power, Adaptability, Technician, Guts) are **phase 2**.
- The picked ability also applies to the **Types** tab.
- **URL** carries move, ability and level per side, so a calculation is a link. Hand-edited
  stats and power stay in page state.
- Out of scope for good: items, weather, terrain, critical hits, multi-hit counts.

## What PokéAPI gives and what has to be written by hand

Already in the code, reused as is:

| Need | Where it already is |
| --- | --- |
| Abilities per Pokémon | `/pokemon` payload `abilities[]` (add `is_hidden`, `slot` to `src/types/pokemon.ts`) |
| Learnset of the era, grouped by method | `learnsetInEra` in `src/domain/moves.ts` |
| A move's power/type/class in the era's game | `moveInGame` in `src/domain/moves.ts` (reads `past_values`), fetched via `moveQuery` in `src/api/queries.ts`, cached for the session |
| Base stats of the era | `statsInEra` in `src/domain/pokemonView.ts` (handles Gen I single `special`) |
| Typing of the era | `typesInEra` in `src/domain/pokemonView.ts` |
| Type chart of the era | `useTypeChart` in `src/features/types/useTypeChart.ts`, `effectiveness` in `src/domain/matchup.ts` |
| Polish names | `useMoveLabel`, `useAbilityLabel`, `useStatLabel` in `src/i18n/labels.ts` |
| Chips, action button, menu lines | `Chip`/`chips.ts`, `MENU_ITEM`, `MenuCursor` in `src/components` |

Hand-written, because PokéAPI describes ability effects in prose only (no machine-readable
field anywhere): the **ability rule table** (~30 entries) and the **Gen I–III special
types** list (8 entries). First curated tables in the project. Both get a `Checked` line
in the changelog with how they were verified.

## Phase 1 — implementation

### 1. Domain: `src/domain/abilities.ts` (new)

```ts
export interface AbilityRule {
  /** Defending: incoming attacks of these types take this multiplier (0 = immune). */
  takes?: { types: readonly PokemonType[]; times: number }[];
  /** Defending: super-effective hits scaled (Filter, Solid Rock, Prism Armor: 0.75). */
  superEffectiveTaken?: number;
  /** Defending: only super-effective hits land (Wonder Guard). */
  onlySuperEffective?: boolean;
  /** Attacking: the defender's ability is ignored (Mold Breaker, Teravolt, Turboblaze). */
  ignoresDefender?: boolean;
  /** Attacking: these types hit Ghost normally (Scrappy, Mind's Eye: normal, fighting). */
  hitsGhostWith?: readonly PokemonType[];
  /** Attacking: not-very-effective hits scaled (Tinted Lens: 2). */
  notVeryEffectiveDealt?: number;
}
```

Table (slugs are PokéAPI's):

- ×0: `levitate` ground · `flash-fire`, `well-baked-body` fire · `water-absorb`,
  `storm-drain`, `dry-skin` water · `volt-absorb`, `lightning-rod`, `motor-drive` electric ·
  `sap-sipper` grass · `earth-eater` ground
- ×0.5: `thick-fat` fire+ice · `heatproof`, `water-bubble` fire · `purifying-salt` ghost
- ×1.25: `dry-skin` fire · ×2: `fluffy` fire (its contact half is move-flag based, phase 2)
- `wonder-guard` onlySuperEffective · `filter`, `solid-rock`, `prism-armor` 0.75
- `scrappy`, `minds-eye` hitsGhostWith normal, fighting · `tinted-lens` 2 ·
  `mold-breaker`, `teravolt`, `turboblaze` ignoresDefender

Helpers: `abilityRule(slug): AbilityRule | null`; `defaultAbility(pokemon)` = slot 1
non-hidden; `isAbilityOf(pokemon, slug)` for URL validation. Hidden flagged for the label.

### 2. Domain: `src/domain/matchup.ts` (extend)

- `Effectiveness` becomes `number` (abilities produce 1.5, 0.75, 1.25, 3…). `effectiveness`
  gains an optional `abilities?: { attacker?: AbilityRule | null; defender?: AbilityRule | null }`.
  Order: type product (with Scrappy turning a ghost ×0 into ×1) → Wonder Guard → defender
  `takes` → Filter family if >1 → Tinted Lens if <1. Defender's rule skipped when the
  attacker `ignoresDefender`.
- `matchup` and `defensiveProfile` take the same option; `defensiveProfile` groups by
  distinct value, sorted descending, neutral dropped (no fixed `PROFILE_ORDER`).
- `src/features/types/effectiveness.ts`: `printed` keeps ½ and ¼, prints other numbers as
  `1.5`, `1.25`; `effectClass` goes range-based (≥4, >1, 1, <1 and ≥0.5, <0.5, 0). `phraseKey`
  in `Matchup.tsx` already uses ranges.

### 3. Domain: `src/domain/damage.ts` (new)

- `SPECIAL_TYPES` (fire, water, grass, electric, psychic, ice, dragon, dark);
  `damageClassInEra(move: MoveInGame, era)`: status stays status; when
  `era.damageClassByType`, class comes from the type, else from the move.
- `battleStats(stats: StatInEra[], level, era)`: Gen III+ (`era.statFormula === "iv"`):
  HP `floor((2B+31)·L/100)+L+10`, other `floor((2B+31)·L/100)+5`; Shedinja base HP 1 → 1.
  Gen I–II (`"dv"`): HP `floor((B+15)·2·L/100)+L+10`, other `floor((B+15)·2·L/100)+5`. A
  `special` stat fills both special offence and defence. Returns
  `{ hp, attack, defense, specialAttack, specialDefense, speed, special? }` plus the list of
  slots to show as inputs (five at era I, six otherwise).
- `damageRange({ level, power, attack, defense, stab, effectiveness })`:
  `base = floor(floor(floor(2L/5+2)·P·A/D)/50)+2`, then per roll 85 and 100:
  `floor(floor(base·roll/100)·1.5 if stab)` then `floor(·effectiveness)`; returns
  `{ min, max }` or `null` when power is null or effectiveness is 0. Gen I–II's 217–255/255
  roll is the same range to the integer, so one formula for every era (said in a comment).
- `hitsToKo(hp, range)` → `{ guaranteed: ceil(hp/min), best: ceil(hp/max) }`.
- `firstToMove(speedA, speedB)` → `"a" | "b" | "tie"`.

### 4. Era: `src/domain/era.ts`

Two fields on `DexEra`, in the existing "every rule is a field" style:
`statFormula: "dv" | "iv"` (RETRO `dv`, MODERN `iv`) and `damageClassByType: boolean`
(RETRO true, MODERN false).

### 5. Types: `src/types/pokemon.ts`

`abilities[]` entries gain `is_hidden: boolean` and `slot: number`.

### 6. URL: `src/features/versus/useVersusParams.ts` (new)

Reads and writes `a`, `b` (as now) plus `aa`/`ba` ability, `am`/`bm` move, `al`/`bl` level
(1–100, default 50 omitted). Level writes use `replace: true`. Invalid ability or move for
the picked Pokémon falls back to the default and is dropped from the URL on the next write.
`VersusPage.set` moves here.

### 7. UI

- `src/features/versus/AbilityPicker.tsx` (new): a row of `Chip`s under each
  `PokemonPicker` while the fighter is ready and `era.hasAbilities`; new `ChipKind`
  `"ability"` in `src/components/chips.ts`. Hidden ability carries its label suffix via
  `versus.hiddenAbility`. Default pressed = slot 1.
- `src/features/versus/MoveCalc.tsx` (new), the Moves tab body: two columns (yours left,
  foe right, like `Attacks`). Per column, `MoveSide`:
  - level `<input type=number min=1 max=100>` → URL;
  - native `<select>` with `<optgroup>` per learn method (level-up first, with `Lvl. N`),
    labels via `useMoveLabel`; status moves included; → URL;
  - stat inputs prefilled from `battleStats` (3×2 grid, labels via `useStatLabel`); power
    input prefilled from `moveInGame(...).power`, empty for `null` with a hint
    `versus.enterPower`. Overrides live in `useState` inside `MoveSide`, which is rendered
    with `key={`${name}-${level}-${era.name}`}` so they reset when the inputs they were
    derived from change (power override resets with the move via a second key on its input).
  - result: `versus.used` ("PIKACHU uses THUNDERBOLT!"), chips for type, damage class and
    STAB, the `EffectChip` with the games' phrase, then `versus.damage` (min–max, % of the
    defender's HP) and `versus.hits` (1 hit, or best–guaranteed range). Status move →
    `versus.noDamage`; ×0 → `versus.noEffect`; move loading → skeleton; fetch error → the
    `error.details` line for that side only.
  - under both: `versus.first` / `versus.tie` from speeds; then `versus.assumptions`
    (modern) or `versus.assumptionsRetro`; `versus.abilitiesNote` replaced by
    `versus.abilitiesScope` (type-changing abilities counted, stat-boosting ones not yet).
- `src/features/versus/VersusPage.tsx`: third `TabButton` (`versus.tabMoves`); picker row
  becomes two columns each holding `PokemonPicker` + `AbilityPicker`; `Attacks` and
  `Profile` receive the abilities; `useVersusParams` replaces the inline `set`.
- `src/features/versus/Matchup.tsx`: `Attacks`/`Profile` accept
  `abilities` and pass them to `matchup`/`defensiveProfile`.

### 8. i18n (`src/i18n/locales/{en,pl}/common.json`, `versus.*`)

`tabMoves`, `level`, `move`, `pickMove`, `power`, `enterPower`, `used`, `damage`,
`hits_one/few/many/other`, `hitsRange`, `noDamage`, `first`, `tie`, `stab`, `ability`,
`hiddenAbility`, `assumptions`, `assumptionsRetro`, `abilitiesScope`. Polish plurals:
"pada po 1 trafieniu", "po 2–3 trafieniach".

### 9. Docs

- `CHANGELOG.md`: new `[Unreleased]` entry; `Checked` lines for the ability table and the
  formula samples below.
- About page strings: `about.can.versus` mentions the Moves tab; `about.not.items[0]`
  changes from "types only" to "stat-boosting abilities, items, weather, crits not counted".
- Memory `compare-abilities-todo.md`: update after shipping (abilities done, phase 2 listed).

## Phase 2 — backlog (not now)

Stat-boosting abilities (Huge Power, Pure Power, Adaptability, Technician, Guts, Flash
Fire's own boost), Fluffy's contact half, Freeze-Dry and Flying Press, multi-hit counts,
items, weather, terrain, criticals, Gen I–II formula minutiae (Gen I crit, Gen II items).

## Verification

1. `npx tsc -b && npm run lint` (never `npm run build`; the dev server stays up).
2. Formula check in Node against the Showdown calculator's known results, 31 IV / 0 EV /
   neutral, level 50:
   - Pikachu Thunderbolt (90) vs Gyarados: stats 70 SpA vs 120 SpD, 170 HP → **124–148**
     (72.9–87.1 %), guaranteed 2 hits.
   - Retro (Crystal, DV 15): Thunderbolt 95 → 132–156 of 170.
3. Ability table against live payloads: Weezing (slot 1 Levitate) vs Earthquake → ×0 in
   both tabs; Snorlax Thick Fat vs Flamethrower → ×0.5; Shedinja Wonder Guard: Normal ×0,
   Fire ×2; Bronzong Heatproof vs Fire ×0.5; Mold Breaker attacker vs Levitate → ×1.
4. URL: open `/versus?a=pikachu&b=gyarados&am=thunderbolt&bm=waterfall&al=50&bl=50`, both
   results render; swap keeps moves with their Pokémon; retro hides ability chips and uses
   Crystal's learnset and power.
5. Browser: if the Chrome extension connects, screenshots of the Moves tab in PL and EN,
   modern and retro, phone width. Otherwise report that visual check was not possible.
