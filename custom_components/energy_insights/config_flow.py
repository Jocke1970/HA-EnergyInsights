"""Config flow for Energy Insights."""

from __future__ import annotations

from typing import Any, override

import probatio

from homeassistant.config_entries import ConfigFlow, ConfigFlowResult
from homeassistant.const import Platform
from homeassistant.helpers import selector

from .const import (
    CONF_COST_GROSS_TOTAL,
    CONF_COST_NET_TOTAL,
    CONF_CURRENT_MONTH_COST_GROSS,
    CONF_CURRENT_MONTH_COST_NET,
    CONF_CURRENT_MONTH_ENERGY,
    CONF_ENERGY_TOTAL,
    CONF_POWER,
    DOMAIN,
    NAME,
)


def _sensor_selector() -> selector.EntitySelector:
    """Return a single sensor entity selector."""
    return selector.EntitySelector(
        selector.EntitySelectorConfig(domain=Platform.SENSOR)
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

        schema = probatio.Schema(
            {
                probatio.Required(CONF_ENERGY_TOTAL): _sensor_selector(),
                probatio.Required(CONF_POWER): _sensor_selector(),
                probatio.Optional(CONF_COST_GROSS_TOTAL): _sensor_selector(),
                probatio.Optional(CONF_COST_NET_TOTAL): _sensor_selector(),
                probatio.Optional(CONF_CURRENT_MONTH_ENERGY): _sensor_selector(),
                probatio.Optional(CONF_CURRENT_MONTH_COST_GROSS): _sensor_selector(),
                probatio.Optional(CONF_CURRENT_MONTH_COST_NET): _sensor_selector(),
            }
        )

        return self.async_show_form(step_id="user", data_schema=schema)
