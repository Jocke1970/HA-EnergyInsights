const ENERGY_INSIGHTS_CARD_VERSION = "2026.10.0b4";

class EnergyInsightsCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = null;
    this._hass = null;
    this._signature = "";
    this.shadowRoot.addEventListener("click", (event) => this._handleClick(event));
    this.shadowRoot.addEventListener("change", (event) => this._handleChange(event));
  }

  setConfig(config) {
    if (!config) throw new Error("Energy Insights card configuration is required");
    this._config = {
      title: "Energy Insights",
      period_entity: "select.period",
      statistics_entity: "sensor.statistik",
      show_price_records: true,
      ...config,
    };
    this._signature = "";
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    const next = this._stateSignature();
    if (next !== this._signature) {
      this._signature = next;
      this._render();
    }
  }

  static getStubConfig() {
    return {
      period_entity: "select.period",
      statistics_entity: "sensor.statistik",
      show_price_records: true,
    };
  }

  getCardSize() {
    return this._config?.show_price_records === false ? 8 : 12;
  }

  _entity(entityId) {
    return entityId && this._hass?.states ? this._hass.states[entityId] : undefined;
  }

  _stateSignature() {
    if (!this._hass || !this._config) return "";
    const period = this._entity(this._config.period_entity);
    const stats = this._entity(this._config.statistics_entity);
    return [
      period?.state,
      period?.last_updated,
      JSON.stringify(period?.attributes?.options || []),
      stats?.state,
      stats?.last_updated,
      stats?.attributes?.backend_version,
    ].join("|");
  }

  _escape(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  _number(value) {
    if (value === null || value === undefined || value === "") return NaN;
    const number = Number(value);
    return Number.isFinite(number) ? number : NaN;
  }

  _formatNumber(value, decimals = 2) {
    const number = this._number(value);
    if (!Number.isFinite(number)) return "–";
    return new Intl.NumberFormat("sv-SE", {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals,
    }).format(number);
  }

  _formatDate(value, withYear = false) {
    if (!value) return "–";
    const raw = String(value);
    const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw + "T12:00:00" : raw.replace(" ", "T"));
    if (Number.isNaN(date.getTime())) return raw;
    return date.toLocaleDateString("sv-SE", {
      day: "2-digit",
      month: "2-digit",
      ...(withYear ? { year: "numeric" } : {}),
    });
  }

  _formatDateTime(value) {
    if (!value) return "–";
    const raw = String(value);
    const date = new Date(raw.replace(" ", "T"));
    if (Number.isNaN(date.getTime())) return raw;
    return (
      date.toLocaleDateString("sv-SE", { day: "2-digit", month: "2-digit" }) +
      " " +
      date.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })
    );
  }

  _periodLabel(period) {
    const value = String(period || "");
    if (/^\d{4}-\d{2}$/.test(value)) {
      const parts = value.split("-").map(Number);
      const label = new Date(parts[0], parts[1] - 1, 1, 12).toLocaleDateString("sv-SE", {
        month: "long",
        year: "numeric",
      });
      return label.charAt(0).toUpperCase() + label.slice(1);
    }
    if (/^\d{4}$/.test(value)) return value + " · Hittills";
    return value || "Period";
  }

  _historyStart(attrs) {
    if (!attrs?.period_start) return "";
    const date = new Date(attrs.period_start);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("sv-SE", { day: "2-digit", month: "2-digit", year: "numeric" });
  }

  _metric(icon, label, value, meta, tone) {
    return (
      '<button class="metric tone-' + (tone || "neutral") + '" type="button" data-action="more-info">' +
        '<div class="metric-icon"><ha-icon icon="' + icon + '"></ha-icon></div>' +
        '<div class="metric-copy">' +
          '<div class="metric-label">' + this._escape(label) + '</div>' +
          '<div class="metric-value">' + this._escape(value) + '</div>' +
          (meta ? '<div class="metric-meta">' + this._escape(meta) + '</div>' : "") +
        '</div>' +
      '</button>'
    );
  }

  _record(kind, value, time) {
    const low = kind === "low";
    const label = low ? "Lägst" : "Högst";
    const icon = low ? "mdi:arrow-down-bold" : "mdi:arrow-up-bold";
    const numeric = this._number(value);
    const valueText = Number.isFinite(numeric) ? this._formatNumber(numeric, 3) + " kr/kWh" : "–";
    const meta = time ? label + " · " + this._formatDateTime(time) : label;
    return (
      '<button class="record ' + (low ? "low" : "high") + '" type="button" data-action="more-info">' +
        '<ha-icon icon="' + icon + '"></ha-icon>' +
        '<strong>' + this._escape(valueText) + '</strong>' +
        '<span>' + this._escape(meta) + '</span>' +
      '</button>'
    );
  }

  _priceRecords(attrs) {
    if (this._config?.show_price_records === false) return "";
    const start = this._historyStart(attrs);
    return (
      '<section class="records-section">' +
        '<div class="section-title-row">' +
          '<div><div class="section-kicker">Nord Pool</div><h3>Prisrekord · netto</h3></div>' +
          '<div class="section-subtitle">Exkl. skatt och moms</div>' +
        '</div>' +
        '<div class="record-period">' +
          '<div class="record-heading"><span>Denna månad</span></div>' +
          '<div class="record-grid">' +
            this._record("low", attrs.price_low_month_sek_kwh, attrs.price_low_month_time) +
            this._record("high", attrs.price_high_month_sek_kwh, attrs.price_high_month_time) +
          '</div>' +
        '</div>' +
        '<div class="record-period second">' +
          '<div class="record-heading"><span>Detta år</span>' +
            (start ? '<small>Registrerat från ' + this._escape(start) + '</small>' : "") +
          '</div>' +
          '<div class="record-grid">' +
            this._record("low", attrs.price_low_year_sek_kwh, attrs.price_low_year_time) +
            this._record("high", attrs.price_high_year_sek_kwh, attrs.price_high_year_time) +
          '</div>' +
        '</div>' +
      '</section>'
    );
  }

  _handleClick(event) {
    const action = event.target?.closest?.("[data-action]")?.dataset?.action;
    if (action !== "more-info") return;
    const entityId = this._config?.statistics_entity;
    if (!entityId) return;
    this.dispatchEvent(new CustomEvent("hass-more-info", {
      bubbles: true,
      composed: true,
      detail: { entityId },
    }));
  }

  _handleChange(event) {
    const select = event.target?.closest?.("select[data-action='period']");
    if (!select || !this._hass || !this._config?.period_entity) return;
    this._hass.callService("select", "select_option", {
      entity_id: this._config.period_entity,
      option: select.value,
    });
  }

  _render() {
    if (!this.shadowRoot || !this._config) return;

    if (!this._hass) {
      this.shadowRoot.innerHTML = this._styles() + '<ha-card class="energy-card"><div class="loading">Energy Insights</div></ha-card>';
      return;
    }

    const periodEntity = this._entity(this._config.period_entity);
    const statsEntity = this._entity(this._config.statistics_entity);

    if (!periodEntity || !statsEntity) {
      this.shadowRoot.innerHTML =
        this._styles() +
        '<ha-card class="energy-card"><div class="error">' +
          '<ha-icon icon="mdi:alert-circle-outline"></ha-icon>' +
          '<div><strong>Data saknas</strong><span>' +
            this._escape(this._config.statistics_entity) + " · " + this._escape(this._config.period_entity) +
          '</span></div>' +
        '</div></ha-card>';
      return;
    }

    const attrs = statsEntity.attributes || {};
    const period = periodEntity.state || attrs.period || "";
    const options = Array.isArray(periodEntity.attributes?.options) ? periodEntity.attributes.options : [];
    const selectedOptions = options.map((option) =>
      '<option value="' + this._escape(option) + '"' + (option === period ? " selected" : "") + ">" +
      this._escape(this._periodLabel(option)) + "</option>"
    ).join("");

    const recorderOk = attrs.recorder_status === "ok";
    const energy = this._formatNumber(statsEntity.state, 2) + " kWh";
    const grossCost = this._formatNumber(attrs.cost_gross_sek, 2) + " kr";
    const netCost = this._formatNumber(attrs.cost_net_sek, 2) + " kr";

    this.shadowRoot.innerHTML =
      this._styles() +
      '<ha-card class="energy-card">' +
        '<div class="header">' +
          '<div class="brand">' +
            '<div class="brand-icon"><ha-icon icon="mdi:lightning-bolt-circle"></ha-icon></div>' +
            '<div><h2>' + this._escape(this._config.title) + '</h2>' +
            '<div class="header-subtitle">' + this._escape(this._periodLabel(period)) + '</div></div>' +
          '</div>' +
          '<div class="status ' + (recorderOk ? "ok" : "error-state") + '">' +
            '<span class="dot"></span><span>' + (recorderOk ? "Recorder OK" : "Recorder-fel") + '</span>' +
          '</div>' +
        '</div>' +

        '<div class="period-control">' +
          '<ha-icon icon="mdi:calendar-range"></ha-icon>' +
          '<label><span>Period</span><select data-action="period" aria-label="Period">' +
            selectedOptions +
          '</select></label>' +
        '</div>' +

        '<div class="hero-grid">' +
          this._metric("mdi:lightning-bolt", "Förbrukning", energy, "", "energy") +
          this._metric("mdi:cash", "Kostnad brutto", grossCost, this._formatNumber(attrs.average_price_gross_sek_kwh, 3) + " kr/kWh", "gross") +
          this._metric("mdi:cash-minus", "Kostnad netto", netCost, this._formatNumber(attrs.average_price_net_sek_kwh, 3) + " kr/kWh", "net") +
        '</div>' +

        '<div class="metrics-grid">' +
          this._metric("mdi:cash-multiple", "Snittpris brutto", this._formatNumber(attrs.average_price_gross_sek_kwh, 3) + " kr/kWh") +
          this._metric("mdi:cash-minus", "Snittpris netto", this._formatNumber(attrs.average_price_net_sek_kwh, 3) + " kr/kWh") +
          this._metric("mdi:calendar-today", "Snitt / dag", this._formatNumber(attrs.average_kwh_per_day, 2) + " kWh") +
          this._metric("mdi:chart-line", "Högsta dygn", this._formatNumber(attrs.highest_day_kwh, 2) + " kWh", this._formatDate(attrs.highest_day_date, true), "high") +
          this._metric("mdi:chart-line-variant", "Lägsta dygn", this._formatNumber(attrs.lowest_day_kwh, 2) + " kWh", this._formatDate(attrs.lowest_day_date, true), "low") +
          this._metric("mdi:flash", "Toppeffekt", this._formatNumber(attrs.peak_power_kw, 2) + " kW", this._formatDateTime(attrs.peak_power_time), "peak") +
        '</div>' +

        this._priceRecords(attrs) +

        '<div class="footer">' +
          '<span>Energy Insights ' + this._escape(attrs.backend_version || ENERGY_INSIGHTS_CARD_VERSION) + '</span>' +
          '<span>' + this._formatNumber(attrs.price_hour_rows, 0) + ' h Nord Pool</span>' +
        '</div>' +
      '</ha-card>';
  }

  _styles() {
    return '<style>' +
      ':host{display:block;color:var(--primary-text-color)}*{box-sizing:border-box}button,select{font:inherit}' +
      '.energy-card{overflow:hidden;padding:24px;border-radius:var(--ha-card-border-radius,24px);background:radial-gradient(circle at 95% 0%,color-mix(in srgb,var(--primary-color) 12%,transparent),transparent 34%),var(--ha-card-background,var(--card-background-color));box-shadow:var(--ha-card-box-shadow,none)}' +
      '.header{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;margin-bottom:18px}.brand{display:flex;align-items:center;gap:14px;min-width:0}' +
      '.brand-icon{width:46px;height:46px;display:grid;place-items:center;border-radius:15px;color:var(--primary-color);background:color-mix(in srgb,var(--primary-color) 14%,transparent);flex:0 0 46px}.brand-icon ha-icon{--mdc-icon-size:27px}' +
      'h2,h3{margin:0}h2{font-size:23px;line-height:1.15;font-weight:750;letter-spacing:-.02em}h3{font-size:20px;font-weight:700;letter-spacing:-.015em}' +
      '.header-subtitle,.section-subtitle,.metric-meta,.record-heading small,.footer{color:var(--secondary-text-color)}.header-subtitle{margin-top:4px;font-size:14px}' +
      '.status{display:inline-flex;align-items:center;gap:7px;padding:7px 10px;border-radius:999px;background:color-mix(in srgb,var(--secondary-text-color) 9%,transparent);color:var(--secondary-text-color);font-size:12px;font-weight:650;white-space:nowrap}.status .dot{width:8px;height:8px;border-radius:50%;background:var(--disabled-text-color)}.status.ok .dot{background:var(--success-color,#43a047)}.status.error-state .dot{background:var(--error-color,#db4437)}' +
      '.period-control{display:flex;align-items:center;gap:12px;padding:12px 14px;margin-bottom:16px;border:1px solid var(--divider-color);border-radius:16px;background:color-mix(in srgb,var(--primary-text-color) 3%,transparent)}.period-control>ha-icon{color:var(--primary-color)}.period-control label{display:grid;grid-template-columns:auto minmax(0,1fr);align-items:center;gap:12px;width:100%}.period-control label>span{font-size:13px;font-weight:650;color:var(--secondary-text-color)}' +
      'select{width:100%;min-width:0;padding:8px 10px;border:0;border-radius:10px;outline:none;color:var(--primary-text-color);background:var(--card-background-color);font-weight:650;cursor:pointer}' +
      '.hero-grid,.metrics-grid,.record-grid{display:grid;gap:10px}.hero-grid{grid-template-columns:repeat(3,minmax(0,1fr));margin-bottom:10px}.metrics-grid,.record-grid{grid-template-columns:repeat(2,minmax(0,1fr))}' +
      '.metric,.record{width:100%;border:1px solid var(--divider-color);background:color-mix(in srgb,var(--primary-text-color) 2.5%,transparent);color:var(--primary-text-color);cursor:pointer;transition:background .16s ease,transform .16s ease,border-color .16s ease}.metric:hover,.record:hover{background:color-mix(in srgb,var(--primary-text-color) 5%,transparent);border-color:color-mix(in srgb,var(--primary-color) 32%,var(--divider-color))}.metric:active,.record:active{transform:scale(.992)}' +
      '.metric{display:flex;align-items:center;gap:12px;min-height:92px;padding:15px;border-radius:18px}.hero-grid .metric{min-height:106px}.metric-icon{width:38px;height:38px;display:grid;place-items:center;border-radius:12px;color:var(--primary-color);background:color-mix(in srgb,var(--primary-color) 11%,transparent);flex:0 0 38px}.tone-high .metric-icon,.tone-peak .metric-icon{color:var(--error-color,#db4437);background:color-mix(in srgb,var(--error-color,#db4437) 11%,transparent)}.tone-low .metric-icon{color:var(--info-color,#039be5);background:color-mix(in srgb,var(--info-color,#039be5) 11%,transparent)}.tone-net .metric-icon{color:var(--success-color,#43a047);background:color-mix(in srgb,var(--success-color,#43a047) 11%,transparent)}' +
      '.metric-copy{min-width:0}.metric-label{font-size:12px;color:var(--secondary-text-color);margin-bottom:4px}.metric-value{font-size:19px;line-height:1.15;font-weight:760;letter-spacing:-.01em}.hero-grid .metric-value{font-size:22px}.metric-meta{margin-top:4px;font-size:12px;line-height:1.25}' +
      '.records-section{margin-top:20px;padding-top:20px;border-top:1px solid var(--divider-color)}.section-title-row{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;margin-bottom:16px}.section-kicker{margin-bottom:3px;color:var(--primary-color);font-size:11px;font-weight:750;text-transform:uppercase;letter-spacing:.08em}.section-subtitle{font-size:12px;text-align:right}.record-period.second{margin-top:18px}.record-heading{display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin:0 2px 8px}.record-heading>span{font-size:16px;font-weight:700}.record-heading small{font-size:11px}' +
      '.record{display:grid;justify-items:center;gap:5px;min-height:104px;padding:14px 12px;border-radius:16px;text-align:center}.record ha-icon{--mdc-icon-size:25px}.record.low ha-icon{color:var(--success-color,#43a047)}.record.high ha-icon{color:var(--error-color,#db4437)}.record strong{font-size:16px}.record span{color:var(--secondary-text-color);font-size:11px}' +
      '.footer{display:flex;justify-content:space-between;gap:12px;margin-top:18px;font-size:10px;opacity:.75}.error,.loading{min-height:90px;display:flex;align-items:center;gap:12px;padding:18px}.error ha-icon{color:var(--error-color,#db4437)}.error div{display:grid;gap:3px}.error span{color:var(--secondary-text-color);font-size:12px}' +
      '@media(max-width:680px){.energy-card{padding:18px}.header{align-items:center}.status span:last-child{display:none}.status{padding:8px}.hero-grid{grid-template-columns:1fr}.metrics-grid{grid-template-columns:1fr 1fr}.metric{min-height:84px;padding:13px}.hero-grid .metric{min-height:88px}.hero-grid .metric-value{font-size:20px}.metric-value{font-size:17px}.section-title-row{align-items:flex-start}}' +
      '@media(max-width:430px){.metrics-grid{grid-template-columns:1fr}.record-heading{align-items:flex-start;flex-direction:column;gap:2px}.footer{flex-direction:column;gap:3px}}' +
      '</style>';
  }
}

if (!customElements.get("energy-insights-card")) {
  customElements.define("energy-insights-card", EnergyInsightsCard);
}

window.customCards = window.customCards || [];
if (!window.customCards.some((card) => card.type === "energy-insights-card")) {
  window.customCards.push({
    type: "energy-insights-card",
    name: "Energy Insights",
    description: "Electricity usage, cost, peak power and Nord Pool history.",
    preview: true,
  });
}

console.info("Energy Insights Card " + ENERGY_INSIGHTS_CARD_VERSION);
