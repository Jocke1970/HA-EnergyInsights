"""Config flow for Energy Insights."""

from __future__ import annotations

from typing import Any, override

import probatio

from homeassistant.components.sensor import SensorDeviceClass
from homeassistant.config_entries import ConfigFlow, ConfigFlowResult
from homeassistant.const import Platform
from homeassistant.helpers import selector

from .const import (
    CONF_COST_GROSS_TOTAL,
    CONF_COST_NET_TOTAL,
    CONF_CURRENT_MONTH_COST_GROSS,
    CONF_CURRENT_MONTH_COST_NET,
    CONF_CURRENT_MONTH_ENERGY,
    DEFAULT_HISTORY_START,
    CONF_ENERGY_TOTAL,
    CONF_HISTORY_START,
    CONF_POWER,
    DOMAIN,
    NAME,
)


def _sensor_selector(
    device_class: SensorDeviceClass | None = None,
) -> selector.EntitySelector:
    """Return a single sensor entity selector."""
    return selector.EntitySelector(
        selector.EntitySelectorConfig(
            domain=Platform.SENSOR,
            device_class=device_class,
        )
    )


def _schema() -> probatio.Schema:
    """Return the Energy Insights source schema."""
    return probatio.Schema(
        {
            probatio.Required(CONF_ENERGY_TOTAL): _sensor_selector(
                SensorDeviceClass.ENERGY
            ),
            probatio.Required(CONF_POWER): _sensor_selector(
                SensorDeviceClass.POWER
            ),
            probatio.Optional(CONF_COST_GROSS_TOTAL): _sensor_selector(),
            probatio.Optional(CONF_COST_NET_TOTAL): _sensor_selector(),
            probatio.Optional(CONF_CURRENT_MONTH_ENERGY): _sensor_selector(
                SensorDeviceClass.ENERGY
            ),
            probatio.Optional(CONF_CURRENT_MONTH_COST_GROSS): _sensor_selector(),
            probatio.Optional(CONF_CURRENT_MONTH_COST_NET): _sensor_selector(),
            probatio.Required(
                CONF_HISTORY_START, default=DEFAULT_HISTORY_START
            ): selector.DateSelector(),
        }
    )


class EnergyInsightsConfigFlow(ConfigFlow, domain=DOMAIN):
    """Handle a config flow for Energy Insights."""

    VERSION = 1

    @override
    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Configure Energy Insights source entities."""
        if self._async_current_entries():
            return self.async_abort(reason="single_instance_allowed")

        if user_input is not None:
            return self.async_create_entry(title=NAME, data=user_input)

        return self.async_show_form(step_id="user", data_schema=_schema())

    async def async_step_reconfigure(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Reconfigure Energy Insights source entities."""
        entry = self._get_reconfigure_entry()

        if user_input is not None:
            return self.async_update_reload_and_abort(
                entry,
                data_updates=user_input,
            )

        return self.async_show_form(
            step_id="reconfigure",
            data_schema=self.add_suggested_values_to_schema(
                _schema(),
                dict(entry.data),
            ),
        )
