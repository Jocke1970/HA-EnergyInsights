# HA-EnergyInsights

Home Assistant integration and dashboard card for advanced electricity usage, cost and historical energy insights.

> **Current beta:** `0.1.0-beta.1` on the `beta` branch.

## Goal

Energy Insights replaces YAML packages used for electricity statistics with a Python backend and a dedicated dashboard card.

## Branch and release workflow

- `dev` — active development
- `beta` — beta / release candidate
- `main` — stable code only
- beta releases — tagged prereleases such as `v0.1.0-beta.1`
- stable releases — tagged releases such as `v0.1.0`

## 0.1.0-beta.1

The first beta includes:

- UI config flow and reconfiguration
- device-class filtering for energy and power sources
- configurable history start
- dynamic month/year period selector
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

### Verified September 2026 reference

The Python backend matches the proven YAML implementation:

- 530.09 kWh
- 760.73 SEK gross cost
- 515.09 SEK net cost
- 1.435 SEK/kWh gross average
- 0.972 SEK/kWh net average
- 17.67 kWh/day
- 42.95 kWh highest day
- 7.66 kWh lowest day
- 4.84 kW peak power

## Install beta for testing

From a Home Assistant terminal:

```sh
curl -fsSL https://raw.githubusercontent.com/Jocke1970/HA-EnergyInsights/beta/scripts/install_beta.sh | sh
```

Restart Home Assistant after installation.

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

- beta runtime verification
- monthly archive backend
- `energy-insights-card.js`
- entity-id migration/cleanup
- promotion to `main` as `v0.1.0`

## License

MIT
