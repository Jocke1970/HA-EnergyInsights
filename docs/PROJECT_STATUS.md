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
- current HACS beta release name: **2026.10.0b7**
- current HACS beta tag: **v2026.10.0b7**

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

## Bundled dashboard card

Development version `2026.10.0b4` adds a first-party Lovelace card:

- custom element: `custom:energy-insights-card`
- bundled under `custom_components/energy_insights/frontend/`
- auto-loaded by the integration through Home Assistant frontend/http
- no manual Lovelace resource
- no Mushroom dependency
- default entities for the current installation: `select.period` and `sensor.statistik`
- responsive period selector, KPI grid and Nord Pool price-record section

## Temporary Home Assistant YAML

The following remain outside this repository until Python replacements are finished:

- cumulative gross/net cost templates
- utility meters for live current-month totals
- monthly archive / CSV persistence
- old Lovelace period-statistics card/backend

Do not add new period-statistics or price-record logic to YAML.

## Next milestones

1. Runtime-test the bundled Energy Insights JavaScript card.
2. Remove the legacy YAML period selector after the new card is verified.
3. Move monthly archive persistence into Python.
4. Remove the remaining archive YAML/shell/CSV backend after parity is verified.
5. Promote a verified build to `main` and publish `2026.10.0`.
