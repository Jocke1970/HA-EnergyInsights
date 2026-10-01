"""Config flow for Energy Insights."""

from __future__ import annotations

from typing import Any, override

from homeassistant.config_entries import ConfigFlow, ConfigFlowResult

from .const import DOMAIN, NAME


class EnergyInsightsConfigFlow(ConfigFlow, domain=DOMAIN):
    """Handle a config flow for Energy Insights."""

    VERSION = 1

    @override
    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Create the single Energy Insights config entry."""
        if self._async_current_entries():
            return self.async_abort(reason="single_instance_allowed")

        return self.async_create_entry(title=NAME, data={})
