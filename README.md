# HA-EnergyInsights

Home Assistant integration for advanced electricity usage, cost and historical energy insights.

> **Stable status:** no stable release has been published yet.  
> **Current HACS beta:** **2026-10 / v0.1.0-beta.5**

## Versioning from next beta

The current `0.1.0-beta.5` release is the final legacy-version beta.

Starting with the next beta, Energy Insights uses calendar-based PEP 440 versions:

- first beta: `2026.10.0b1`
- subsequent betas: `2026.10.0b2`, `2026.10.0b3`, …
- stable release: `2026.10.0`

Git tags use the same version prefixed with `v`, for example `v2026.10.0b1`.

## Branch purpose

`main` is reserved for stable code. The active release candidate is developed through:

`dev → beta → main`

Until the first stable `v0.1.0` promotion, use the HACS beta channel rather than treating the current contents of `main` as the latest test build.

## Current beta capabilities

The 2026-10 beta provides Recorder-backed period statistics, current-month live totals, daily extrema, peak power, and Nord Pool net price records for month and year/history start.

Nord Pool price records are based on Recorder hourly `mean` statistics for measurement sensors.

## Installation

For current testing, enable beta versions in HACS and install **2026-10 / v0.1.0-beta.5**.

## Documentation

See [docs/PROJECT_STATUS.md](docs/PROJECT_STATUS.md) for the current ownership map, source entities, verified September reference values and migration milestones.

## License

MIT
