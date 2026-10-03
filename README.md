# HA-EnergyInsights

Home Assistant integration for advanced electricity usage, cost and historical energy insights.

> **Development branch:** `2026.10.0b3`  
> **Current HACS beta:** **2026.10.0b2 / v2026.10.0b2**

## Goal

Energy Insights replaces legacy Home Assistant YAML statistics logic with a Python backend and, next, a dedicated dashboard card.

## Versioning from next beta

The current `0.1.0-beta.5` release is the final legacy-version beta.

Starting with the next beta, Energy Insights uses calendar-based PEP 440 versions:

- first beta: `2026.10.0b1`
- subsequent betas: `2026.10.0b2`, `2026.10.0b3`, …
- stable release: `2026.10.0`

Git tags use the same version prefixed with `v`, for example `v2026.10.0b1`.

## Branch workflow

- `dev` — active development
- `beta` — HACS beta / release candidate
- `main` — stable only
- beta releases — GitHub prereleases
- stable releases — GitHub releases

## Current backend

The Python integration currently provides:

- UI config flow and reconfiguration
- device-class filtering for energy and power sources
- live-state entity picker for the Nord Pool price source
- configurable history start
- dynamic month/year period selector
- Recorder long-term statistics queries
- selected-period energy, gross/net cost and weighted prices
- average daily use and high/low consumption day
- incomplete current-day buckets are excluded from daily averages/extremes
- peak power normalized to kW
- current-month live utility-meter overrides
- Nord Pool net price records for month and year/history start
- Recorder `state` handling for Nord Pool total-class statistics
- Recorder `mean`/`min`/`max` fallback for measurement-class price sensors
- Recorder-side power conversion to kW
- 15-minute coordinator refresh
- Swedish and English translations

## Dev runtime testing

From a Home Assistant terminal:

```sh
curl -fsSL https://raw.githubusercontent.com/Jocke1970/HA-EnergyInsights/dev/scripts/install_dev.sh | sh
```

The dev installer is only for development testing. HACS beta builds are installed from the `beta` prerelease channel.

## Reference configuration

| Field | Entity |
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

See [docs/PROJECT_STATUS.md](docs/PROJECT_STATUS.md) for the ownership/migration map and verified reference values.

## Next milestone

Verify the 2026-10 beta price records, then move the dashboard to the dedicated Energy Insights card and continue the monthly archive migration.

## License

MIT
