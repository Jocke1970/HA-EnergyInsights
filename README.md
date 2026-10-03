# HA-EnergyInsights

Home Assistant integration for advanced electricity usage, cost and historical energy insights.

> **Current HACS beta:** **2026-10 / v2026.10.0b1**

## Versioning from next beta

The legacy `0.1.0-beta.5` release was the final beta using the old version format.

Starting with the next beta, Energy Insights uses calendar-based PEP 440 versions:

- first beta: `2026.10.0b1`
- subsequent betas: `2026.10.0b2`, `2026.10.0b3`, …
- stable release: `2026.10.0`

Git tags use the same version prefixed with `v`, for example `v2026.10.0b1`.

## Installation — HACS beta

Beta builds are distributed only through HACS.

1. Add `Jocke1970/HA-EnergyInsights` as a custom **Integration** repository if needed.
2. Enable **Show beta versions** for Energy Insights.
3. Install/update to `v2026.10.0b2`.
4. Restart Home Assistant.
5. Add or reconfigure **Energy Insights** under **Settings → Devices & services**.

No manual beta installer is shipped on the `beta` branch.

## 2026-10

The current beta includes:

- UI config flow and reconfiguration
- energy/power source filtering
- live-state entity picker for the Nord Pool price source
- configurable history start
- period selector limited to configured history
- Recorder-backed period energy and cost statistics
- weighted gross/net price
- average daily usage and high/low consumption day
- peak power normalized to kW
- optional live current-month utility-meter values
- Nord Pool net price records for current month and year/history start
- Recorder hourly `mean` statistics for Nord Pool measurement sensors
- Recorder row diagnostics for Nord Pool statistics troubleshooting
- Recorder `state` statistics for Nord Pool total-class sensors
- Recorder-side power conversion to kW
- 15-minute refresh
- Swedish and English translations

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

See [docs/PROJECT_STATUS.md](docs/PROJECT_STATUS.md) for the migration map and verified September reference.

## Next milestone

Verify month/year Nord Pool records in beta, migrate the Lovelace card to Energy Insights, then move monthly archive persistence into Python.

## License

MIT
