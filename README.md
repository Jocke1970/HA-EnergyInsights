# HA-EnergyInsights

Home Assistant integration and dashboard card for advanced electricity usage, cost and historical energy insights.

> **Development status:** active development on the `dev` branch.

## Goal

Energy Insights replaces YAML packages used for electricity statistics with a Python backend and a dedicated dashboard card.

## Branch and release workflow

- `dev` — active development
- `beta` — beta / release candidate branch
- `main` — stable code only
- beta releases — tagged prereleases such as `v0.1.0-beta.1`
- stable releases — tagged releases such as `v0.1.0`

## Current milestone — 0.1.0-dev.2

The Python backend now includes:

- UI config flow for selecting source entities
- dynamic month/year period selector
- Recorder long-term statistics queries
- selected-period energy consumption
- gross and net electricity cost
- weighted average gross/net price per kWh
- average consumption per day
- highest and lowest consumption day
- peak power with Recorder bucket timestamp
- optional live utility-meter sources for the current month
- 15-minute coordinator refresh

### Reference values

Development is being verified against an existing YAML implementation. September 2026 reference values are:

- 530.09 kWh
- 760.73 SEK gross cost
- 515.09 SEK net cost
- 1.435 SEK/kWh gross average
- 0.972 SEK/kWh net average
- 42.95 kWh highest day
- 4.84 kW peak power

## Next milestone

1. Install the `dev` branch in Home Assistant.
2. Compare Python results with the YAML reference entities.
3. Add the monthly archive backend.
4. Build `energy-insights-card.js`.
5. Promote the first verified build to `beta` as `v0.1.0-beta.1`.

## HACS

The repository is public and intended to be HACS compatible. Release packaging will be finalized before the first beta release.

## License

MIT
