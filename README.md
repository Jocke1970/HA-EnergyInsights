# HA-EnergyInsights

Home Assistant integration and dashboard card for advanced electricity usage, cost and historical energy insights.

> **Development status:** early development on the `dev` branch.

## Goal

Energy Insights is being built to replace Home Assistant YAML packages used for electricity statistics with a Python backend and a dedicated dashboard card.

The first target is feature parity with the proven YAML implementation:

- selectable month and year periods
- energy consumption per period
- gross and net electricity cost
- weighted average price per kWh
- average consumption per day
- highest and lowest consumption day
- peak power and timestamp
- monthly archive / historical comparisons
- dedicated JavaScript dashboard card

## Repository layout

```text
custom_components/
└── energy_insights/
    ├── __init__.py
    ├── config_flow.py
    ├── const.py
    ├── manifest.json
    ├── select.py
    └── translations/
        ├── en.json
        └── sv.json
```

## Branch and release workflow

- `dev` — active development
- beta releases — tagged prereleases such as `v0.1.0-beta.1`
- `main` — stable code only
- stable releases — tagged releases such as `v0.1.0`

## Current development milestone

The initial scaffold provides:

- UI config flow
- one config entry only
- `select.energy_insights_period`
- current-year months
- current year
- previous year
- previous-year months
- restored period selection after restart

The statistics backend and custom JavaScript card are the next milestones.

## HACS

The repository is structured as a Home Assistant custom integration. HACS packaging/release metadata will be finalized before the first beta release.

## License

MIT
