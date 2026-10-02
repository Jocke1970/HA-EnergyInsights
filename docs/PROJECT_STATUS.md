# Project status

Last updated: 2026-10-02

## Release model

- `dev` — active development and direct runtime testing
- `beta` — HACS beta / release candidate
- `main` — stable branch; no stable `v0.1.0` release has been published yet
- current HACS beta release name: **2026-10**
- current HACS beta tag: **v0.1.0-beta.5**

The repository default branch is currently `beta`. Revisit that when the first stable release is promoted to `main`.

## Python source of truth

Energy Insights owns period selection, Recorder-backed period energy/cost statistics, daily extrema, peak power, and Nord Pool net price records for month and year/history start.

Nord Pool price records use Recorder hourly `mean` statistics for measurement sensors.

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

Cumulative cost templates, current-month utility meters, monthly archive persistence and the old Lovelace period-statistics backend remain temporarily outside this repository.

Do not add new period-statistics or price-record logic to YAML.

## Next milestones

1. Verify `v0.1.0-beta.5` Nord Pool records.
2. Migrate the Lovelace card.
3. Move monthly archive persistence into Python.
4. Remove remaining legacy YAML after parity.
5. Promote the verified release candidate to `main` and publish `v0.1.0`.
