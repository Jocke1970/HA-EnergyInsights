"""Sensor platform for Energy Insights."""

from __future__ import annotations

from typing import override

from homeassistant.components.sensor import SensorDeviceClass, SensorEntity
from homeassistant.const import UnitOfEnergy
from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from . import EnergyInsightsConfigEntry
from .const import DOMAIN, NAME, STATISTICS_SENSOR_UNIQUE_ID, VERSION
from .coordinator import EnergyInsightsCoordinator


async def async_setup_entry(
    hass,
    entry: EnergyInsightsConfigEntry,
    async_add_entities,
) -> None:
    """Set up Energy Insights sensor entities."""
    async_add_entities([EnergyInsightsStatisticsSensor(entry.runtime_data)])


class EnergyInsightsStatisticsSensor(
    CoordinatorEntity[EnergyInsightsCoordinator], SensorEntity
):
    """Expose calculated statistics for the selected period."""

    _attr_has_entity_name = True
    _attr_translation_key = "statistics"
    _attr_icon = "mdi:chart-box-outline"
    _attr_unique_id = STATISTICS_SENSOR_UNIQUE_ID
    _attr_device_class = SensorDeviceClass.ENERGY
    _attr_native_unit_of_measurement = UnitOfEnergy.KILO_WATT_HOUR

    def __init__(self, coordinator: EnergyInsightsCoordinator) -> None:
        """Initialize the statistics sensor."""
        super().__init__(coordinator)
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, coordinator.config_entry.entry_id)},
            name=NAME,
            manufacturer="Jocke1970",
            model="Energy Insights",
            sw_version=VERSION,
        )

    @property
    @override
    def suggested_object_id(self) -> str:
        """Return a stable entity object id independent of UI language."""
        return "energy_insights_statistics"

    @property
    def native_value(self) -> float | None:
        """Return energy for the selected period."""
        if self.coordinator.data is None:
            return None
        return self.coordinator.data.energy_kwh

    @property
    def extra_state_attributes(self) -> dict[str, object]:
        """Return statistics used by the dashboard card."""
        data = self.coordinator.data
        if data is None:
            return {
                "backend_version": "2026.10.0b2",
                "recorder_status": "waiting",
            }

        return {
            "backend_version": "2026.10.0b2",
            "period": data.period,
            "period_start": data.period_start.isoformat(),
            "period_end": data.period_end.isoformat(),
            "cost_gross_sek": data.cost_gross,
            "cost_net_sek": data.cost_net,
            "average_price_gross_sek_kwh": data.average_price_gross,
            "average_price_net_sek_kwh": data.average_price_net,
            "average_kwh_per_day": data.average_kwh_per_day,
            "highest_day_kwh": data.highest_day_kwh,
            "highest_day_date": data.highest_day_date,
            "lowest_day_kwh": data.lowest_day_kwh,
            "lowest_day_date": data.lowest_day_date,
            "peak_power_kw": data.peak_power_kw,
            "peak_power_time": data.peak_power_time,
            "price_low_month_sek_kwh": data.price_low_month,
            "price_low_month_time": data.price_low_month_time,
            "price_high_month_sek_kwh": data.price_high_month,
            "price_high_month_time": data.price_high_month_time,
            "price_low_year_sek_kwh": data.price_low_year,
            "price_low_year_time": data.price_low_year_time,
            "price_high_year_sek_kwh": data.price_high_year,
            "price_high_year_time": data.price_high_year_time,
            "recorder_status": data.recorder_status,
            "recorder_error": data.recorder_error,
            "source_energy_total": data.source_energy_total,
            "source_power": data.source_power,
            "source_price_net": data.source_price_net,
            "source_cost_gross_total": data.source_cost_gross_total,
            "source_cost_net_total": data.source_cost_net_total,
            "energy_month_rows": data.energy_month_rows,
            "energy_day_rows": data.energy_day_rows,
            "power_hour_rows": data.power_hour_rows,
            "price_hour_rows": data.price_hour_rows,
            "price_row_keys": data.price_row_keys,
            "price_row_sample": data.price_row_sample,
            "gross_cost_month_rows": data.gross_cost_month_rows,
            "net_cost_month_rows": data.net_cost_month_rows,
        }
