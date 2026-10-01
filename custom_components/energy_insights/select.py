"""Select platform for Energy Insights."""

from __future__ import annotations

from datetime import datetime

from homeassistant.components.select import SelectEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback
from homeassistant.helpers.restore_state import RestoreEntity
from homeassistant.util import dt as dt_util

from .const import PERIOD_SELECT_UNIQUE_ID


def _period_options(now: datetime) -> list[str]:
    """Return selectable month/year period keys, newest first."""
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


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Set up Energy Insights select entities."""
    async_add_entities([EnergyInsightsPeriodSelect()])


class EnergyInsightsPeriodSelect(SelectEntity, RestoreEntity):
    """Select the period used by Energy Insights."""

    _attr_has_entity_name = True
    _attr_name = "Period"
    _attr_icon = "mdi:calendar-range"
    _attr_unique_id = PERIOD_SELECT_UNIQUE_ID

    def __init__(self) -> None:
        """Initialize the period selector."""
        now = dt_util.now()
        self._attr_options = _period_options(now)
        self._attr_current_option = f"{now.year}-{now.month:02d}"

    async def async_added_to_hass(self) -> None:
        """Restore the previously selected period when possible."""
        await super().async_added_to_hass()
        previous = await self.async_get_last_state()

        if previous and previous.state in self.options:
            self._attr_current_option = previous.state

    async def async_select_option(self, option: str) -> None:
        """Select a statistics period."""
        if option not in self.options:
            raise ValueError(f"Unsupported Energy Insights period: {option}")

        self._attr_current_option = option
        self.async_write_ha_state()
