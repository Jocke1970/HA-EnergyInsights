"""Select platform for Energy Insights."""

from __future__ import annotations

from typing import override

from homeassistant.components.select import SelectEntity
from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from . import EnergyInsightsConfigEntry
from .const import DOMAIN, NAME, PERIOD_SELECT_UNIQUE_ID, VERSION
from .coordinator import EnergyInsightsCoordinator


async def async_setup_entry(
    hass,
    entry: EnergyInsightsConfigEntry,
    async_add_entities,
) -> None:
    """Set up Energy Insights select entities."""
    async_add_entities([EnergyInsightsPeriodSelect(entry.runtime_data)])


class EnergyInsightsPeriodSelect(
    CoordinatorEntity[EnergyInsightsCoordinator], SelectEntity
):
    """Select the period used by Energy Insights."""

    _attr_has_entity_name = True
    _attr_translation_key = "period"
    _attr_icon = "mdi:calendar-range"
    _attr_unique_id = PERIOD_SELECT_UNIQUE_ID

    def __init__(self, coordinator: EnergyInsightsCoordinator) -> None:
        """Initialize the period selector."""
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
        return "energy_insights_period"

    @property
    def options(self) -> list[str]:
        """Return selectable periods."""
        return self.coordinator.options

    @property
    def current_option(self) -> str:
        """Return the selected period."""
        return self.coordinator.selected_period

    async def async_select_option(self, option: str) -> None:
        """Select a statistics period."""
        await self.coordinator.async_set_period(option)
