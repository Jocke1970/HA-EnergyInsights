"""Constants for Energy Insights."""

from __future__ import annotations

from datetime import timedelta

DOMAIN = "energy_insights"
NAME = "Energy Insights"
VERSION = "2026.10.0b5"

CONF_ENERGY_TOTAL = "energy_total"
CONF_POWER = "power"
CONF_PRICE_NET = "price_net"
CONF_COST_GROSS_TOTAL = "cost_gross_total"
CONF_COST_NET_TOTAL = "cost_net_total"
CONF_CURRENT_MONTH_ENERGY = "current_month_energy"
CONF_CURRENT_MONTH_COST_GROSS = "current_month_cost_gross"
CONF_CURRENT_MONTH_COST_NET = "current_month_cost_net"
CONF_SELECTED_PERIOD = "selected_period"
CONF_HISTORY_START = "history_start"

DEFAULT_HISTORY_START = "2026-09-01"

PERIOD_SELECT_UNIQUE_ID = "energy_insights_period"
STATISTICS_SENSOR_UNIQUE_ID = "energy_insights_statistics"

UPDATE_INTERVAL = timedelta(minutes=15)
