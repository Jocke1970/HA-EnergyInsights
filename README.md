# HA-EnergyInsights

Home Assistant integration for advanced electricity usage, cost and historical energy insights.

> **Current beta:** `0.1.0-beta.5` — release name **2026-10**

## Installation

### Beta — HACS

Beta builds are distributed **only through HACS**.

1. Add `Jocke1970/HA-EnergyInsights` as a custom **Integration** repository in HACS if it is not already present.
2. Enable **Show beta versions** for Energy Insights in HACS.
3. Install or update to the latest `0.1.0-beta.x` prerelease.
4. Restart Home Assistant.
5. Add **Energy Insights** under **Settings → Devices & services**.

Manual beta installation scripts are intentionally not shipped on the `beta` branch.

### Development

The `dev` branch is for active development and direct runtime testing. It is not the HACS beta distribution channel.

## Branch and release workflow

- `dev` — active development
- `beta` — HACS beta / release candidate
- `main` — stable
- beta releases — GitHub prereleases such as `v0.1.0-beta.1`
- stable releases — GitHub releases such as `v0.1.0`

## 2026-10 (`0.1.0-beta.5`)

The first beta includes:

- UI config flow and reconfiguration
- device-class filtering for energy and power sources
- configurable history start
- period selector limited to available history
- Recorder long-term statistics queries
- selected-period energy consumption
- gross and net electricity cost
- weighted average gross/net price per kWh
- average consumption per day
- highest and lowest consumption day
- peak power normalized to kW
- optional live utility-meter sources for the current month
- 15-minute coordinator refresh
- Swedish and English translations
- Recorder-backed Nord Pool net price records for current month and current year/history start
- Nord Pool price records calculated from Recorder hourly mean statistics

### Verified September 2026 reference

The Python backend matches the previous YAML implementation:

- 530.09 kWh
- 760.73 SEK gross cost
- 515.09 SEK net cost
- 1.435 SEK/kWh gross average
- 0.972 SEK/kWh net average
- 17.67 kWh/day
- 42.95 kWh highest day
- 7.66 kWh lowest day
- 4.84 kW peak power

## Reference configuration for the original test system

| Field | Entity |
|---|---|
| Cumulative energy | `sensor.develco_zhemi101_summering_av_leverans` |
| Current power | `sensor.develco_zhemi101_momentan_efterfragan` |
| Cumulative gross cost | `sensor.elkostnad_total_brutto` |
| Cumulative net cost | `sensor.elkostnad_total_netto` |
| Current month energy | `sensor.hushallsel_denna_manad` |
| Current month gross cost | `sensor.elkostnad_denna_manad` |
| Current month net cost | `sensor.elkostnad_denna_manad_netto` |
| History start | `2026-09-01` |

## Next milestone

- beta runtime verification through HACS
- monthly archive backend
- `energy-insights-card.js`
- entity-id migration/cleanup
- promotion to `main` as `v0.1.0`

## License

MIT
