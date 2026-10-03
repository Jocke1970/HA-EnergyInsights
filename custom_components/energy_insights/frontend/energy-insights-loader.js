const ENERGY_INSIGHTS_LOADER_VERSION = "2026.10.0b5";
const cardUrl = new URL("./energy-insights-card.js?v=" + ENERGY_INSIGHTS_LOADER_VERSION, import.meta.url);
console.info("Energy Insights Loader " + ENERGY_INSIGHTS_LOADER_VERSION);
import(cardUrl.href)
  .then(() => {
    if (!customElements.get("energy-insights-card")) {
      console.error("Energy Insights: card module loaded but was not registered.");
    }
  })
  .catch((error) => console.error("Energy Insights: failed to load card module", error));
