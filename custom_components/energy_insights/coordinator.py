"""Data coordinator for Energy Insights."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
import logging
from typing import Any

from homeassistant.components.recorder import get_instance
from homeassistant.components.recorder.statistics import statistics_during_period
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed
from homeassistant.util import dt as dt_util

from .const import (
    CONF_COST_GROSS_TOTAL,
    CONF_COST_NET_TOTAL,
    CONF_CURRENT_MONTH_COST_GROSS,
    CONF_CURRENT_MONTH_COST_NET,
    CONF_CURRENT_MONTH_ENERGY,
    CONF_ENERGY_TOTAL,
    CONF_POWER,
    CONF_SELECTED_PERIOD,
    DOMAIN,
    UPDATE_INTERVAL,
)

_LOGGER = logging.getLogger(__name__)


@dataclass(slots=True)
class EnergyInsightsData:
    """Calculated statistics for one selected period."""

    period: str
    period_start: datetime
    period_end: datetime
    energy_kwh: float
    cost_gross: float | None
    cost_net: float | None
    average_price_gross: float | None
    average_price_net: float | None
    average_kwh_per_day: float | None
    highest_day_kwh: float | None
    highest_day_date: str | None
    lowest_day_kwh: float | None
    lowest_day_date: str | None
    peak_power_kw: float | None
    peak_power_time: str | None


def period_options(now: datetime) -> list[str]:
    """Return available month/year period keys, newest first."""
    current_year = now.year
    previous_year = current_year - 1

    options = [
        f"{current_year}-{month:02d}"
        for month in range(now.month, 0, -1)
    ]
    options.append(str(current_year))
    options.append(str(previous_year))
    options.extend(
        f"{previous_year}-{month:02d}"
        for month in range(12, 0, -1)
    )
    return options


def _period_bounds(period: str, now: datetime) -> tuple[datetime, datetime]:
    """Return UTC bounds for a month or year period."""
    tz = dt_util.DEFAULT_TIME_ZONE

    if "-" in period:
        year_text, month_text = period.split("-", 1)
        year = int(year_text)
        month = int(month_text)
        start_local = datetime(year, month, 1, tzinfo=tz)

        if year == now.year and month == now.month:
            end_local = now
        elif month == 12:
            end_local = datetime(year + 1, 1, 1, tzinfo=tz)
        else:
            end_local = datetime(year, month + 1, 1, tzinfo=tz)
    else:
        year = int(period)
        start_local = datetime(year, 1, 1, tzinfo=tz)
        end_local = now if year == now.year else datetime(year + 1, 1, 1, tzinfo=tz)

    return dt_util.as_utc(start_local), dt_util.as_utc(end_local)


def _sum_changes(
    result: dict[str, list[dict[str, Any]]],
    statistic_id: str | None,
    start_ts: float,
    end_ts: float,
) -> float | None:
    """Sum change values inside the requested bounds."""
    if not statistic_id:
        return None

    rows = result.get(statistic_id, [])
    found = False
    total = 0.0

    for row in rows:
        row_start = float(row.get("start", 0))
        value = row.get("change")
        if start_ts <= row_start < end_ts and value is not None:
            found = True
            total += float(value)

    return total if found else None


def _daily_extremes(
    result: dict[str, list[dict[str, Any]]],
    statistic_id: str,
    start_ts: float,
    end_ts: float,
) -> tuple[float | None, str | None, float | None, str | None, float | None]:
    """Return high/low day and average daily consumption."""
    values: list[tuple[float, str]] = []

    for row in result.get(statistic_id, []):
        row_start = float(row.get("start", 0))
        value = row.get("change")
        if not (start_ts <= row_start < end_ts) or value is None:
            continue

        local_start = dt_util.as_local(dt_util.utc_from_timestamp(row_start))
        values.append((float(value), local_start.strftime("%Y-%m-%d")))

    if not values:
        return None, None, None, None, None

    high_value, high_date = max(values, key=lambda item: item[0])
    low_value, low_date = min(values, key=lambda item: item[0])
    average = sum(value for value, _ in values) / len(values)

    return high_value, high_date, low_value, low_date, average


def _peak_power(
    result: dict[str, list[dict[str, Any]]],
    statistic_id: str,
    start_ts: float,
    end_ts: float,
    unit: str | None,
) -> tuple[float | None, str | None]:
    """Return peak power normalized to kW and the Recorder bucket time."""
    peak_value: float | None = None
    peak_start: float | None = None

    for row in result.get(statistic_id, []):
        row_start = float(row.get("start", 0))
        value = row.get("max")
        if not (start_ts <= row_start < end_ts) or value is None:
            continue

        numeric = float(value)
        if peak_value is None or numeric > peak_value:
            peak_value = numeric
            peak_start = row_start

    if peak_value is None or peak_start is None:
        return None, None

    normalized = peak_value
    if unit == "W":
        normalized /= 1000
    elif unit == "MW":
        normalized *= 1000

    local_start = dt_util.as_local(dt_util.utc_from_timestamp(peak_start))
    return normalized, local_start.strftime("%Y-%m-%d %H:%M")


class EnergyInsightsCoordinator(DataUpdateCoordinator[EnergyInsightsData]):
    """Coordinate Energy Insights statistics."""

    config_entry: ConfigEntry

    def __init__(self, hass: HomeAssistant, entry: ConfigEntry) -> None:
        """Initialize the coordinator."""
        self.config_entry = entry
        now = dt_util.now()
        default_period = f"{now.year}-{now.month:02d}"
        saved_period = entry.options.get(CONF_SELECTED_PERIOD, default_period)
        self.selected_period = (
            saved_period if saved_period in period_options(now) else default_period
        )

        super().__init__(
            hass,
            _LOGGER,
            name=DOMAIN,
            update_interval=UPDATE_INTERVAL,
            config_entry=entry,
        )

    @property
    def options(self) -> list[str]:
        """Return the selectable periods."""
        return period_options(dt_util.now())

    async def async_set_period(self, period: str) -> None:
        """Persist and load a new selected period."""
        if period not in self.options:
            raise ValueError(f"Unsupported Energy Insights period: {period}")

        self.selected_period = period
        self.hass.config_entries.async_update_entry(
            self.config_entry,
            options={**self.config_entry.options, CONF_SELECTED_PERIOD: period},
        )
        await self.async_request_refresh()

    def _state_number(self, entity_id: str | None) -> float | None:
        """Read a numeric entity state."""
        if not entity_id:
            return None

        state = self.hass.states.get(entity_id)
        if state is None or state.state in {"unknown", "unavailable"}:
            return None

        try:
            return float(state.state)
        except (TypeError, ValueError):
            return None

    async def _statistics(
        self,
        statistic_ids: set[str],
        start: datetime,
        end: datetime,
        period: str,
        types: set[str],
    ) -> dict[str, list[dict[str, Any]]]:
        """Read Recorder statistics without blocking the event loop."""
        if not statistic_ids:
            return {}

        return await get_instance(self.hass).async_add_executor_job(
            statistics_during_period,
            self.hass,
            start,
            end,
            statistic_ids,
            period,
            None,
            types,
        )

    async def _async_update_data(self) -> EnergyInsightsData:
        """Fetch and calculate statistics for the selected period."""
        now = dt_util.now()
        start, end = _period_bounds(self.selected_period, now)
        start_ts = start.timestamp()
        end_ts = end.timestamp()

        energy_id = self.config_entry.data[CONF_ENERGY_TOTAL]
        power_id = self.config_entry.data[CONF_POWER]
        gross_total_id = self.config_entry.data.get(CONF_COST_GROSS_TOTAL)
        net_total_id = self.config_entry.data.get(CONF_COST_NET_TOTAL)

        month_stat_ids = {
            entity_id
            for entity_id in (energy_id, gross_total_id, net_total_id)
            if entity_id
        }

        try:
            month_stats = await self._statistics(
                month_stat_ids,
                start,
                end,
                "month",
                {"change"},
            )
            day_stats = await self._statistics(
                {energy_id},
                start,
                end,
                "day",
                {"change"},
            )
            power_stats = await self._statistics(
                {power_id},
                start,
                end,
                "hour",
                {"max"},
            )
        except (RuntimeError, TypeError, ValueError) as err:
            raise UpdateFailed(f"Unable to read Recorder statistics: {err}") from err

        is_current_month = self.selected_period == now.strftime("%Y-%m")

        energy = (
            self._state_number(
                self.config_entry.data.get(CONF_CURRENT_MONTH_ENERGY)
            )
            if is_current_month
            else None
        )
        if energy is None:
            energy = _sum_changes(month_stats, energy_id, start_ts, end_ts)
        if energy is None:
            energy = 0.0

        cost_gross = (
            self._state_number(
                self.config_entry.data.get(CONF_CURRENT_MONTH_COST_GROSS)
            )
            if is_current_month
            else None
        )
        if cost_gross is None:
            cost_gross = _sum_changes(
                month_stats, gross_total_id, start_ts, end_ts
            )

        cost_net = (
            self._state_number(
                self.config_entry.data.get(CONF_CURRENT_MONTH_COST_NET)
            )
            if is_current_month
            else None
        )
        if cost_net is None:
            cost_net = _sum_changes(
                month_stats, net_total_id, start_ts, end_ts
            )

        (
            highest_day,
            highest_day_date,
            lowest_day,
            lowest_day_date,
            average_day,
        ) = _daily_extremes(
            day_stats,
            energy_id,
            start_ts,
            end_ts,
        )

        power_state = self.hass.states.get(power_id)
        power_unit = (
            power_state.attributes.get("unit_of_measurement")
            if power_state is not None
            else None
        )
        peak_power, peak_time = _peak_power(
            power_stats,
            power_id,
            start_ts,
            end_ts,
            power_unit,
        )

        average_price_gross = (
            cost_gross / energy if cost_gross is not None and energy > 0 else None
        )
        average_price_net = (
            cost_net / energy if cost_net is not None and energy > 0 else None
        )

        return EnergyInsightsData(
            period=self.selected_period,
            period_start=start,
            period_end=end,
            energy_kwh=round(energy, 3),
            cost_gross=round(cost_gross, 2) if cost_gross is not None else None,
            cost_net=round(cost_net, 2) if cost_net is not None else None,
            average_price_gross=(
                round(average_price_gross, 3)
                if average_price_gross is not None
                else None
            ),
            average_price_net=(
                round(average_price_net, 3)
                if average_price_net is not None
                else None
            ),
            average_kwh_per_day=(
                round(average_day, 2) if average_day is not None else None
            ),
            highest_day_kwh=(
                round(highest_day, 2) if highest_day is not None else None
            ),
            highest_day_date=highest_day_date,
            lowest_day_kwh=(
                round(lowest_day, 2) if lowest_day is not None else None
            ),
            lowest_day_date=lowest_day_date,
            peak_power_kw=(
                round(peak_power, 2) if peak_power is not None else None
            ),
            peak_power_time=peak_time,
        )
