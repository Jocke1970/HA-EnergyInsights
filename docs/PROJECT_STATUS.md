# Project status

Last updated: 2026-10-02

## Versioning

The current HACS beta `v0.1.0-beta.5` is the final legacy-version beta.

From the next beta onward, use calendar-based PEP 440 versions:

- `2026.10.0b1`, `2026.10.0b2`, … for October 2026 betas
- `2026.10.0` for the corresponding stable release
- future months follow the same `YYYY.MM.PATCHbN` / `YYYY.MM.PATCH` pattern

Git tags are prefixed with `v`, for example `v2026.10.0b1`.

## Release model

- `dev` — active development and direct runtime testing
- `beta` — HACS beta / release candidate
- `main` — stable branch; no stable `v0.1.0` release has been published yet
- current HACS beta release name: **2026.10.0b11**
- current HACS beta tag: **v2026.10.0b11**

The repository default branch is currently `beta`. Revisit that when the first stable release is promoted to `main`.

## Python source of truth

Energy Insights owns:

- period selection from configured history start
- Recorder-backed selected-period energy
- selected-period gross/net cost
- weighted average gross/net price
- average daily consumption
- highest/lowest consumption day
- incomplete current-day buckets are excluded from daily average/high/low calculations
- peak power
- Nord Pool net price records for current month
- Nord Pool net price records for current year/history start
- config flow and reconfiguration of source entities

Nord Pool TOTAL-class statistics use Recorder `state`; measurement-class price sensors fall back to `mean`/`min`/`max`.

## Reference configuration

| Purpose | Entity |
|---|---|
| Cumulative energy | `sensor.develco_zhemi101_summering_av_leverans` |
| Current power | `sensor.develco_zhemi101_momentan_efterfragan` |
| Nord Pool net price | `sensor.nordpool_kwh_se3_sek_2_10_025` |
| Cumulative gross cost | `sensor.elkostnad_total_brutto` |
| Cumulative net cost | `sensor.elkostnad_total_netto` |
| Current month energy | `sensor.hushallsel_denna_manad` |
| Current month gross cost | `sensor.elkostnad_denna_manad` |
| Current month net cost | `sensor.elkostnad_denna_manad_netto` |
| History start | `2026-09-01` |

## Verified September 2026 reference

- Energy: 530.09 kWh
- Gross cost: 760.73 SEK
- Net cost: 515.09 SEK
- Gross average: 1.435 SEK/kWh
- Net average: 0.972 SEK/kWh
- Average/day: 17.67 kWh
- Highest day: 42.95 kWh on 2026-09-04
- Lowest day: 7.66 kWh on 2026-09-15
- Peak: 4.84 kW on 2026-09-06 11:00

## Verified 2026.10.0b3 runtime

Runtime verification on 2026-10-03 confirmed:

- Recorder status: `ok`
- completed-day filtering works; current partial day is excluded
- lowest completed day: 7.66 kWh on 2026-09-15
- highest day: 42.95 kWh on 2026-09-04
- peak power: 4.84 kW on 2026-09-06 11:00
- current-month Nord Pool low: 0.16 SEK/kWh on 2026-10-02 01:00
- current-month Nord Pool high: 2.04 SEK/kWh on 2026-10-01 08:00
- year/history-start Nord Pool low: -0.02 SEK/kWh on 2026-09-19 13:00
- year/history-start Nord Pool high: 3.36 SEK/kWh on 2026-09-23 08:00
- Recorder price rows expose `state` for this Nord Pool total-class sensor
- Recorder power statistics are normalized to kW

The statistics backend is ready for the dedicated dashboard card.

## Quarter-hour price correction

Development version `2026.10.0b5` fixes price extrema for Nord Pool after the market moved to 15-minute settlement:

- Recorder hourly `state` is retained only as fallback
- Nord Pool sources are backfilled from the integration's `nordpool.hourly` response
- daily quarter-hour extrema are cached persistently by Energy Insights
- today's values use the source sensor's calculated `raw_today`
- the card labels the configured VAT basis instead of claiming prices are always excluding VAT
- `backend_version` now uses the shared integration `VERSION` constant

This avoids missing intra-hour peaks such as 2026-10-02 18:00.

## Elapsed-quarter correction

Development version `2026.10.0b6` excludes future published `raw_today` quarters from today's price records. A record shown as "lägst/högst" must have occurred already. The card footer also shows both frontend and backend versions so browser-cache mismatches are immediately visible.

## Nord Pool startup ordering

Development version `2026.10.0b7` fixes a startup race where Energy Insights could refresh before Nord Pool registered its `hourly` action and incorrectly fall back to Recorder hourly statistics.

- `nordpool` is an optional `after_dependencies` entry
- if the action is temporarily unavailable, persisted quarter-hour history plus `raw_today` is retained
- Recorder hourly is no longer selected merely because Nord Pool is still finishing startup

## Verified 2026.10.0b7 runtime

Runtime verification on 2026-10-03 confirmed the complete card/backend path after restart:

- frontend card version: `2026.10.0b7`
- backend version: `2026.10.0b7`
- price source: Nord Pool quarter-hour history
- cached history: 33 days
- VAT basis shown correctly as 25 %
- current-month low: 0.16 SEK/kWh on 2026-10-02 01:00
- current-month high: 2.19 SEK/kWh on 2026-10-02 18:00
- year/history-start low: -0.04 SEK/kWh on 2026-09-19 15:00
- year/history-start high: 5.28 SEK/kWh on 2026-09-22 19:00
- future published quarter-hours are excluded from "record so far"
- restart no longer falls back to Recorder hourly statistics
- peak power remains correctly normalized to 4.84 kW
- completed-day filtering remains correct

The bundled card and statistics backend are now runtime-verified together.

## Bundled dashboard card

Development version `2026.10.0b4` adds a first-party Lovelace card:

- custom element: `custom:energy-insights-card`
- bundled under `custom_components/energy_insights/frontend/`
- auto-loaded by the integration through Home Assistant frontend/http
- no manual Lovelace resource
- no Mushroom dependency
- default entities for the current installation: `select.period` and `sensor.statistik`
- responsive period selector, KPI grid and Nord Pool price-record section

## Premium UI revision

Development version `2026.10.0b8` is a full visual redesign rather than an incremental CSS pass:

- consumption is the primary hero KPI
- gross/net cost and their average prices are grouped into one cost module
- duplicate standalone average-price cards are removed
- daily average/high/low and peak power form a compact 2×2 KPI grid
- period selection is a toolbar with an explicit date range
- Nord Pool records use compact low/high rows with 15-minute and VAT badges
- footer shows source, last update time and frontend/backend versions
- responsive breakpoints are tuned for narrow Home Assistant dashboard columns

## Cost module refinement

Development version `2026.10.0b9` keeps the premium b8 composition but replaces the cramped two-column cost cards with a single grouped cost module:

- Brutto and Netto are stacked as two horizontal rows
- full SEK values get priority width
- average SEK/kWh is aligned on the right
- the internal "card inside card" look is removed
- narrow-column behavior is preserved without clipping

## Footer contrast refinement

Development version `2026.10.0b10` fixes low-contrast footer text on light themes:

- source/update text uses readable primary-text contrast
- source icon keeps the Energy Insights accent
- frontend/backend version diagnostics use a red high-contrast badge
- footer opacity is no longer reduced

## Collapsible detail sections

Development version `2026.10.0b11` tightens the default card height with two independent built-in accordions:

- Förbrukningsprofil / Nyckeltal is collapsed by default with a compact KPI summary
- Nord Pool / Prisrekord is collapsed by default with current-month low/high summary and 15-minute/VAT badges
- either section can be expanded independently
- open/closed state is retained across normal coordinator re-renders in the current browser card instance
- no external expander-card dependency is required
- optional config keys `stats_expanded` and `price_records_expanded` can change the initial state

## Accordion summary refinement

Development version `2026.10.0b12` simplifies the collapsed consumption summary:

- old: daily average + low/high range + peak
- new: daily average + `topp X kW`
- English `peak` wording is removed from the Swedish UI
- detailed low/high daily values remain available inside the expanded section

## Temporary Home Assistant YAML

The following remain outside this repository until Python replacements are finished:

- cumulative gross/net cost templates
- utility meters for live current-month totals
- monthly archive / CSV persistence
- old Lovelace period-statistics card/backend

Do not add new period-statistics or price-record logic to YAML.

## Next milestones

1. Runtime-test the premium Energy Insights card UI on desktop/mobile.
2. Remove the legacy YAML period selector after the new card is verified.
3. Move monthly archive persistence into Python.
4. Remove the remaining archive YAML/shell/CSV backend after parity is verified.
5. Promote a verified build to `main` and publish `2026.10.0`.
