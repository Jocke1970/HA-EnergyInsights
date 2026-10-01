"""Energy Insights integration."""

from __future__ import annotations

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant

from .coordinator import EnergyInsightsCoordinator

PLATFORMS: list[Platform] = [Platform.SELECT, Platform.SENSOR]

type EnergyInsightsConfigEntry = ConfigEntry[EnergyInsightsCoordinator]


async def async_setup_entry(
    hass: HomeAssistant, entry: EnergyInsightsConfigEntry
) -> bool:
    """Set up Energy Insights from a config entry."""
    coordinator = EnergyInsightsCoordinator(hass, entry)
    # Do not block entity creation on the first Recorder query. A failed
    # initial refresh leaves coordinator entities unavailable/diagnostic,
    # instead of preventing the integration from creating entities at all.
    await coordinator.async_refresh()
    entry.runtime_data = coordinator

    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    return True


async def async_unload_entry(
    hass: HomeAssistant, entry: EnergyInsightsConfigEntry
) -> bool:
    """Unload an Energy Insights config entry."""
    return await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
