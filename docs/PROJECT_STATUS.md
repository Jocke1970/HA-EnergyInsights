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
- current HACS beta release name: **2026.10.0b1**
- current HACS beta tag: **v2026.10.0b1**

The repository default branch is currently `beta`. Revisit that when the first stable release is promoted to `main`.

## Python source of truth

Energy Insights owns:

- period selection from configured history start
- Recorder-backed selected-period energy
- selected-period gross/net cost
- weighted average gross/net price
- average daily consumption
- highest/lowest consumption day
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

## Temporary Home Assistant YAML

The following remain outside this repository until Python replacements are finished:

- cumulative gross/net cost templates
- utility meters for live current-month totals
- monthly archive / CSV persistence
- old Lovelace period-statistics card/backend

Do not add new period-statistics or price-record logic to YAML.

## Next milestones

1. Verify `2026.10.0b2` Nord Pool month/year records in Home Assistant.
2. Build/migrate the Energy Insights JavaScript card.
3. Remove the legacy YAML period selector after the old card no longer depends on it.
4. Move monthly archive persistence into Python.
5. Remove the remaining archive YAML/shell/CSV backend after parity is verified.
6. Promote a verified build to `main` and publish `v0.1.0`.
