"""Energy Insights integration."""

from __future__ import annotations

from pathlib import Path

from homeassistant.components.frontend import add_extra_js_url
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant
from homeassistant.helpers.typing import ConfigType

from .const import VERSION
from .coordinator import EnergyInsightsCoordinator

PLATFORMS: list[Platform] = [Platform.SELECT, Platform.SENSOR]

_FRONTEND_URL = "/energy_insights_static"
_FRONTEND_PATH = Path(__file__).parent / "frontend"
_LOADER_URL = f"{_FRONTEND_URL}/energy-insights-loader.js?v={VERSION}"

type EnergyInsightsConfigEntry = ConfigEntry[EnergyInsightsCoordinator]


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Set up integration-level frontend resources."""
    await hass.http.async_register_static_paths(
        [
            StaticPathConfig(
                _FRONTEND_URL,
                str(_FRONTEND_PATH),
                cache_headers=False,
            )
        ]
    )
    add_extra_js_url(hass, _LOADER_URL)
    return True


async def async_setup_entry(
    hass: HomeAssistant, entry: EnergyInsightsConfigEntry
) -> bool:
    """Set up Energy Insights from a config entry."""
    coordinator = EnergyInsightsCoordinator(hass, entry)
    await coordinator.async_refresh()
    entry.runtime_data = coordinator

    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    return True


async def async_unload_entry(
    hass: HomeAssistant, entry: EnergyInsightsConfigEntry
) -> bool:
    """Unload an Energy Insights config entry."""
    return await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
