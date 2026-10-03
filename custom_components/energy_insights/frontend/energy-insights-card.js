const ENERGY_INSIGHTS_CARD_VERSION = "2026.10.0b9";

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
    return this._config?.show_price_records === false ? 7 : 11;
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
      stats?.attributes?.price_records_source,
      stats?.attributes?.price_record_days,
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

  _date(value) {
    if (!value) return null;
    const raw = String(value);
    const normalized = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw + "T12:00:00" : raw.replace(" ", "T");
    const date = new Date(normalized);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  _formatDate(value, withYear = false) {
    const date = this._date(value);
    if (!date) return value ? String(value) : "–";
    return date.toLocaleDateString("sv-SE", {
      day: "2-digit",
      month: "2-digit",
      ...(withYear ? { year: "numeric" } : {}),
    });
  }

  _formatDateTime(value) {
    const date = this._date(value);
    if (!date) return value ? String(value) : "–";
    return (
      date.toLocaleDateString("sv-SE", { day: "2-digit", month: "2-digit" }) +
      " " +
      date.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })
    );
  }

  _formatUpdated(value) {
    const date = this._date(value);
    if (!date) return "";
    return date.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });
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

  _periodRange(attrs) {
    const start = this._date(attrs?.period_start);
    const end = this._date(attrs?.period_end);
    if (!start || !end) return "";

    const now = new Date();
    const endIsToday =
      end.getFullYear() === now.getFullYear() &&
      end.getMonth() === now.getMonth() &&
      end.getDate() === now.getDate();

    const startText = start.toLocaleDateString("sv-SE", {
      day: "numeric",
      month: "short",
    });
    const endText = endIsToday
      ? "idag"
      : end.toLocaleDateString("sv-SE", { day: "numeric", month: "short" });

    return startText + " – " + endText;
  }

  _historyStart(attrs) {
    const date = this._date(attrs?.period_start);
    if (!date) return "";
    return date.toLocaleDateString("sv-SE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  _priceBasis(attrs) {
    const vat = this._number(attrs.price_vat_rate);
    if (Number.isFinite(vat) && vat > 0) {
      return "Inkl. " + this._formatNumber(vat * 100, 1) + " % moms";
    }
    if (Number.isFinite(vat) && vat === 0) return "Exkl. moms";
    return "Enligt vald prissensor";
  }

  _moreInfoButton(className, inner) {
    return '<button class="' + className + '" type="button" data-action="more-info">' + inner + "</button>";
  }

  _stat(icon, label, value, meta, tone = "neutral") {
    return this._moreInfoButton(
      "stat tone-" + tone,
      '<span class="stat-icon"><ha-icon icon="' + icon + '"></ha-icon></span>' +
        '<span class="stat-copy">' +
          '<span class="stat-label">' + this._escape(label) + "</span>" +
          '<strong class="stat-value">' + this._escape(value) + "</strong>" +
          (meta ? '<span class="stat-meta">' + this._escape(meta) + "</span>" : "") +
        "</span>"
    );
  }

  _record(kind, value, time) {
    const low = kind === "low";
    const numeric = this._number(value);
    const valueText = Number.isFinite(numeric)
      ? this._formatNumber(numeric, 3) + " kr/kWh"
      : "–";
    return this._moreInfoButton(
      "record " + (low ? "low" : "high"),
      '<span class="record-icon"><ha-icon icon="' + (low ? "mdi:arrow-down" : "mdi:arrow-up") + '"></ha-icon></span>' +
        '<span class="record-copy">' +
          '<span class="record-label">' + (low ? "Lägst" : "Högst") + "</span>" +
          '<strong>' + this._escape(valueText) + "</strong>" +
          '<span class="record-time">' + this._escape(this._formatDateTime(time)) + "</span>" +
        "</span>"
    );
  }

  _priceRecords(attrs) {
    if (this._config?.show_price_records === false) return "";

    const start = this._historyStart(attrs);
    const isQuarter = attrs.price_records_source === "nordpool_quarter_hour";
    const sourceText = isQuarter ? "15 min" : "Recorder";
    const historyText = isQuarter
      ? this._formatNumber(attrs.price_record_days, 0) + " dagar historik"
      : this._formatNumber(attrs.price_hour_rows, 0) + " timmar historik";

    return (
      '<section class="price-section">' +
        '<div class="section-head">' +
          '<div>' +
            '<span class="eyebrow">Nord Pool</span>' +
            '<h3>Prisrekord</h3>' +
          "</div>" +
          '<div class="price-badges">' +
            '<span class="mini-badge">' + this._escape(sourceText) + "</span>" +
            '<span class="mini-badge">' + this._escape(this._priceBasis(attrs)) + "</span>" +
          "</div>" +
        "</div>" +
        '<div class="price-periods">' +
          '<div class="price-period">' +
            '<div class="price-period-head">' +
              "<strong>Denna månad</strong>" +
              '<span>' + this._escape(historyText) + "</span>" +
            "</div>" +
            '<div class="record-grid">' +
              this._record("low", attrs.price_low_month_sek_kwh, attrs.price_low_month_time) +
              this._record("high", attrs.price_high_month_sek_kwh, attrs.price_high_month_time) +
            "</div>" +
          "</div>" +
          '<div class="price-period">' +
            '<div class="price-period-head">' +
              "<strong>Detta år</strong>" +
              (start ? '<span>Från ' + this._escape(start) + "</span>" : "") +
            "</div>" +
            '<div class="record-grid">' +
              this._record("low", attrs.price_low_year_sek_kwh, attrs.price_low_year_time) +
              this._record("high", attrs.price_high_year_sek_kwh, attrs.price_high_year_time) +
            "</div>" +
          "</div>" +
        "</div>" +
      "</section>"
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
      this.shadowRoot.innerHTML =
        this._styles() +
        '<ha-card class="energy-card"><div class="loading">Energy Insights</div></ha-card>';
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
            this._escape(this._config.statistics_entity) + " · " +
            this._escape(this._config.period_entity) +
          "</span></div>" +
        "</div></ha-card>";
      return;
    }

    const attrs = statsEntity.attributes || {};
    const period = periodEntity.state || attrs.period || "";
    const options = Array.isArray(periodEntity.attributes?.options)
      ? periodEntity.attributes.options
      : [];
    const selectedOptions = options.map((option) =>
      '<option value="' + this._escape(option) + '"' +
        (option === period ? " selected" : "") + ">" +
        this._escape(this._periodLabel(option)) +
      "</option>"
    ).join("");

    const recorderOk = attrs.recorder_status === "ok";
    const range = this._periodRange(attrs);
    const updated = this._formatUpdated(statsEntity.last_updated);

    const energyValue = this._formatNumber(statsEntity.state, 2);
    const grossCost = this._formatNumber(attrs.cost_gross_sek, 2);
    const netCost = this._formatNumber(attrs.cost_net_sek, 2);
    const grossAvg = this._formatNumber(attrs.average_price_gross_sek_kwh, 3);
    const netAvg = this._formatNumber(attrs.average_price_net_sek_kwh, 3);

    this.shadowRoot.innerHTML =
      this._styles() +
      '<ha-card class="energy-card">' +
        '<header class="header">' +
          '<div class="brand">' +
            '<div class="brand-icon"><ha-icon icon="mdi:lightning-bolt"></ha-icon></div>' +
            '<div class="brand-copy">' +
              '<span class="eyebrow">Elöversikt</span>' +
              '<h2>' + this._escape(this._config.title) + "</h2>" +
            "</div>" +
          "</div>" +
          '<div class="status ' + (recorderOk ? "ok" : "error-state") + '">' +
            '<span class="dot"></span>' +
            '<span>' + (recorderOk ? "Data OK" : "Recorder-fel") + "</span>" +
          "</div>" +
        "</header>" +

        '<div class="toolbar">' +
          '<div class="toolbar-copy">' +
            '<ha-icon icon="mdi:calendar-range"></ha-icon>' +
            '<div><span>Period</span><strong>' + this._escape(range || this._periodLabel(period)) + "</strong></div>" +
          "</div>" +
          '<div class="select-wrap">' +
            '<select data-action="period" aria-label="Period">' + selectedOptions + "</select>" +
            '<ha-icon icon="mdi:chevron-down"></ha-icon>' +
          "</div>" +
        "</div>" +

        '<section class="overview">' +
          this._moreInfoButton(
            "energy-hero",
            '<span class="hero-top"><span class="hero-icon"><ha-icon icon="mdi:lightning-bolt"></ha-icon></span><span>Förbrukning</span></span>' +
            '<span class="hero-number">' + this._escape(energyValue) + '<small>kWh</small></span>' +
            '<span class="hero-meta">' +
              this._escape(this._formatNumber(attrs.average_kwh_per_day, 2) + " kWh/dag") +
            "</span>"
          ) +
          '<div class="cost-panel">' +
            '<div class="cost-head"><span>Kostnad</span><small>vald period</small></div>' +
            '<div class="cost-grid">' +
              this._moreInfoButton(
                "cost-item gross",
                '<span class="cost-icon"><ha-icon icon="mdi:cash"></ha-icon></span>' +
                '<span class="cost-copy"><span>Brutto</span><strong>' +
                  this._escape(grossCost) + ' <small>kr</small></strong>' +
                  '<em>' + this._escape(grossAvg) + " kr/kWh</em></span>"
              ) +
              this._moreInfoButton(
                "cost-item net",
                '<span class="cost-icon"><ha-icon icon="mdi:cash-minus"></ha-icon></span>' +
                '<span class="cost-copy"><span>Netto</span><strong>' +
                  this._escape(netCost) + ' <small>kr</small></strong>' +
                  '<em>' + this._escape(netAvg) + " kr/kWh</em></span>"
              ) +
            "</div>" +
          "</div>" +
        "</section>" +

        '<section class="stats-section">' +
          '<div class="section-head compact"><div><span class="eyebrow">Förbrukningsprofil</span><h3>Nyckeltal</h3></div></div>' +
          '<div class="stats-grid">' +
            this._stat("mdi:calendar-today", "Snitt / dag", this._formatNumber(attrs.average_kwh_per_day, 2) + " kWh", "", "accent") +
            this._stat("mdi:trending-up", "Högsta dygn", this._formatNumber(attrs.highest_day_kwh, 2) + " kWh", this._formatDate(attrs.highest_day_date, true), "high") +
            this._stat("mdi:trending-down", "Lägsta dygn", this._formatNumber(attrs.lowest_day_kwh, 2) + " kWh", this._formatDate(attrs.lowest_day_date, true), "low") +
            this._stat("mdi:flash", "Toppeffekt", this._formatNumber(attrs.peak_power_kw, 2) + " kW", this._formatDateTime(attrs.peak_power_time), "peak") +
          "</div>" +
        "</section>" +

        this._priceRecords(attrs) +

        '<footer class="footer">' +
          '<span class="footer-source">' +
            (attrs.price_records_source === "nordpool_quarter_hour"
              ? '<ha-icon icon="mdi:clock-outline"></ha-icon> Kvartsdata'
              : '<ha-icon icon="mdi:database-clock-outline"></ha-icon> Recorder') +
          "</span>" +
          (updated ? '<span>Uppdaterad ' + this._escape(updated) + "</span>" : "") +
          '<span class="version">Kort ' + ENERGY_INSIGHTS_CARD_VERSION +
            " · Backend " + this._escape(attrs.backend_version || "–") + "</span>" +
        "</footer>" +
      "</ha-card>";
  }

  _styles() {
    return '<style>' +
      ':host{display:block;color:var(--primary-text-color);--ei-accent:var(--primary-color,#03a9f4);--ei-success:var(--success-color,#43a047);--ei-danger:var(--error-color,#e53935);--ei-info:var(--info-color,#039be5)}' +
      '*{box-sizing:border-box}button,select{font:inherit}button{font-family:inherit}' +
      '.energy-card{overflow:hidden;padding:22px;border-radius:var(--ha-card-border-radius,24px);background:radial-gradient(circle at 100% 0%,color-mix(in srgb,var(--ei-accent) 12%,transparent),transparent 34%),linear-gradient(180deg,color-mix(in srgb,var(--card-background-color) 96%,var(--ei-accent) 4%),var(--card-background-color));box-shadow:var(--ha-card-box-shadow,none)}' +

      '.header{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:18px}.brand{display:flex;align-items:center;gap:12px;min-width:0}.brand-icon{width:46px;height:46px;display:grid;place-items:center;flex:0 0 46px;border-radius:15px;background:linear-gradient(145deg,color-mix(in srgb,var(--ei-accent) 18%,transparent),color-mix(in srgb,var(--ei-accent) 8%,transparent));color:var(--ei-accent)}.brand-icon ha-icon{--mdc-icon-size:27px}.brand-copy{min-width:0}' +
      '.eyebrow{display:block;margin-bottom:3px;color:var(--ei-accent);font-size:10px;font-weight:800;letter-spacing:.11em;text-transform:uppercase}.header h2,.section-head h3{margin:0;letter-spacing:-.025em}.header h2{font-size:23px;line-height:1.05;font-weight:780}.section-head h3{font-size:19px;line-height:1.1;font-weight:760}' +
      '.status{display:inline-flex;align-items:center;gap:7px;padding:7px 10px;border-radius:999px;background:color-mix(in srgb,var(--secondary-text-color) 8%,transparent);color:var(--secondary-text-color);font-size:11px;font-weight:700;white-space:nowrap}.status .dot{width:8px;height:8px;border-radius:50%;background:var(--disabled-text-color)}.status.ok .dot{background:var(--ei-success);box-shadow:0 0 0 4px color-mix(in srgb,var(--ei-success) 10%,transparent)}.status.error-state .dot{background:var(--ei-danger)}' +

      '.toolbar{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:14px;padding:11px 12px;border:1px solid color-mix(in srgb,var(--divider-color) 80%,transparent);border-radius:16px;background:color-mix(in srgb,var(--primary-text-color) 2.4%,transparent)}.toolbar-copy{display:flex;align-items:center;gap:10px;min-width:0}.toolbar-copy>ha-icon{color:var(--ei-accent);--mdc-icon-size:20px}.toolbar-copy div{display:grid;gap:1px}.toolbar-copy span{font-size:10px;color:var(--secondary-text-color);text-transform:uppercase;letter-spacing:.07em;font-weight:700}.toolbar-copy strong{font-size:13px;font-weight:700;white-space:nowrap}' +
      '.select-wrap{position:relative;min-width:148px;max-width:210px;flex:0 1 210px}.select-wrap select{width:100%;appearance:none;-webkit-appearance:none;padding:9px 34px 9px 12px;border:0;border-radius:11px;outline:none;background:var(--card-background-color);color:var(--primary-text-color);font-weight:720;cursor:pointer;box-shadow:0 1px 0 color-mix(in srgb,var(--primary-text-color) 5%,transparent)}.select-wrap ha-icon{position:absolute;right:9px;top:50%;transform:translateY(-50%);pointer-events:none;--mdc-icon-size:18px;color:var(--secondary-text-color)}' +

      '.overview{display:grid;grid-template-columns:minmax(0,.82fr) minmax(0,1.18fr);gap:12px;margin-bottom:20px}.energy-hero,.cost-panel{border-radius:20px;border:1px solid color-mix(in srgb,var(--divider-color) 82%,transparent)}.energy-hero{display:flex;flex-direction:column;align-items:flex-start;justify-content:space-between;min-height:156px;padding:17px;text-align:left;border-color:color-mix(in srgb,var(--ei-accent) 22%,var(--divider-color));background:linear-gradient(150deg,color-mix(in srgb,var(--ei-accent) 14%,var(--card-background-color)),color-mix(in srgb,var(--ei-accent) 3%,var(--card-background-color)));color:var(--primary-text-color);cursor:pointer;transition:transform .16s ease,border-color .16s ease}.energy-hero:hover{border-color:color-mix(in srgb,var(--ei-accent) 52%,var(--divider-color))}.energy-hero:active{transform:scale(.993)}.hero-top{display:flex;align-items:center;gap:8px;color:var(--secondary-text-color);font-size:12px;font-weight:700}.hero-icon{width:30px;height:30px;display:grid;place-items:center;border-radius:10px;background:color-mix(in srgb,var(--ei-accent) 15%,transparent);color:var(--ei-accent)}.hero-icon ha-icon{--mdc-icon-size:19px}.hero-number{display:flex;align-items:baseline;gap:6px;margin:8px 0 2px;font-size:31px;line-height:1;font-weight:800;letter-spacing:-.035em}.hero-number small{font-size:14px;font-weight:700;color:var(--secondary-text-color);letter-spacing:0}.hero-meta{font-size:11px;color:var(--secondary-text-color)}' +

      '.cost-panel{padding:14px;background:color-mix(in srgb,var(--primary-text-color) 2.2%,transparent)}.cost-head{display:flex;align-items:baseline;justify-content:space-between;gap:8px;margin:0 2px 5px}.cost-head>span{font-size:12px;font-weight:760}.cost-head small{color:var(--secondary-text-color);font-size:10px}.cost-grid{display:grid;grid-template-columns:1fr;gap:0}.cost-item{display:flex;align-items:center;gap:10px;min-width:0;padding:11px 4px;border:0;border-radius:0;background:transparent;color:var(--primary-text-color);text-align:left;cursor:pointer;transition:transform .16s ease,background .16s ease}.cost-item+ .cost-item{border-top:1px solid color-mix(in srgb,var(--divider-color) 72%,transparent)}.cost-item:hover{background:color-mix(in srgb,var(--primary-text-color) 2.8%,transparent)}.cost-item:active{transform:scale(.995)}.cost-icon{width:32px;height:32px;display:grid;place-items:center;flex:0 0 32px;border-radius:10px;background:color-mix(in srgb,var(--ei-accent) 11%,transparent);color:var(--ei-accent)}.cost-item.net .cost-icon{background:color-mix(in srgb,var(--ei-success) 11%,transparent);color:var(--ei-success)}.cost-icon ha-icon{--mdc-icon-size:18px}.cost-copy{display:grid;grid-template-columns:minmax(0,1fr) auto;grid-template-areas:"label avg" "value avg";align-items:center;column-gap:12px;row-gap:2px;min-width:0;width:100%}.cost-copy>span{grid-area:label;font-size:10px;color:var(--secondary-text-color)}.cost-copy strong{grid-area:value;font-size:18px;line-height:1.05;white-space:nowrap;letter-spacing:-.02em}.cost-copy strong small{font-size:11px;font-weight:700}.cost-copy em{grid-area:avg;align-self:center;font-style:normal;font-size:10px;font-weight:650;color:var(--secondary-text-color);white-space:nowrap;text-align:right}' +

      '.stats-section,.price-section{padding-top:18px;border-top:1px solid color-mix(in srgb,var(--divider-color) 85%,transparent)}.section-head{display:flex;align-items:flex-end;justify-content:space-between;gap:14px;margin-bottom:12px}.section-head.compact{margin-bottom:11px}.stats-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.stat{display:flex;align-items:center;gap:10px;min-height:76px;padding:12px;border:1px solid color-mix(in srgb,var(--divider-color) 82%,transparent);border-radius:16px;background:color-mix(in srgb,var(--primary-text-color) 1.9%,transparent);color:var(--primary-text-color);text-align:left;cursor:pointer;transition:border-color .16s ease,background .16s ease,transform .16s ease}.stat:hover{border-color:color-mix(in srgb,var(--ei-accent) 35%,var(--divider-color));background:color-mix(in srgb,var(--primary-text-color) 3.3%,transparent)}.stat:active{transform:scale(.993)}.stat-icon{width:34px;height:34px;display:grid;place-items:center;flex:0 0 34px;border-radius:11px;background:color-mix(in srgb,var(--ei-accent) 10%,transparent);color:var(--ei-accent)}.stat-icon ha-icon{--mdc-icon-size:19px}.tone-high .stat-icon,.tone-peak .stat-icon{background:color-mix(in srgb,var(--ei-danger) 10%,transparent);color:var(--ei-danger)}.tone-low .stat-icon{background:color-mix(in srgb,var(--ei-info) 10%,transparent);color:var(--ei-info)}.stat-copy{display:grid;gap:2px;min-width:0}.stat-label{font-size:10px;color:var(--secondary-text-color)}.stat-value{font-size:17px;line-height:1.05;letter-spacing:-.02em}.stat-meta{font-size:10px;color:var(--secondary-text-color)}' +

      '.price-section{margin-top:18px}.price-badges{display:flex;justify-content:flex-end;gap:5px;flex-wrap:wrap}.mini-badge{padding:5px 7px;border-radius:999px;background:color-mix(in srgb,var(--primary-text-color) 5%,transparent);color:var(--secondary-text-color);font-size:9px;font-weight:700;white-space:nowrap}.price-periods{display:grid;gap:14px}.price-period-head{display:flex;align-items:baseline;justify-content:space-between;gap:10px;margin:0 2px 7px}.price-period-head strong{font-size:13px}.price-period-head span{font-size:9px;color:var(--secondary-text-color)}.record-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.record{display:flex;align-items:center;gap:10px;min-height:72px;padding:11px 12px;border:1px solid color-mix(in srgb,var(--divider-color) 82%,transparent);border-radius:15px;background:color-mix(in srgb,var(--primary-text-color) 1.7%,transparent);color:var(--primary-text-color);text-align:left;cursor:pointer;transition:transform .16s ease,border-color .16s ease}.record:hover{border-color:color-mix(in srgb,var(--ei-accent) 34%,var(--divider-color))}.record:active{transform:scale(.993)}.record-icon{width:32px;height:32px;display:grid;place-items:center;flex:0 0 32px;border-radius:10px}.record.low .record-icon{background:color-mix(in srgb,var(--ei-success) 11%,transparent);color:var(--ei-success)}.record.high .record-icon{background:color-mix(in srgb,var(--ei-danger) 11%,transparent);color:var(--ei-danger)}.record-icon ha-icon{--mdc-icon-size:19px}.record-copy{display:grid;gap:1px;min-width:0}.record-label{font-size:9px;color:var(--secondary-text-color);text-transform:uppercase;letter-spacing:.06em;font-weight:750}.record-copy strong{font-size:15px;line-height:1.1;letter-spacing:-.015em;white-space:nowrap}.record-time{font-size:9px;color:var(--secondary-text-color)}' +

      '.footer{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:16px;padding-top:12px;border-top:1px solid color-mix(in srgb,var(--divider-color) 65%,transparent);color:var(--secondary-text-color);font-size:9px;opacity:.78}.footer-source{display:inline-flex;align-items:center;gap:4px}.footer-source ha-icon{--mdc-icon-size:12px}.footer .version{margin-left:auto}.loading,.error{min-height:90px;display:flex;align-items:center;gap:12px;padding:18px}.error ha-icon{color:var(--ei-danger)}.error div{display:grid;gap:3px}.error span{color:var(--secondary-text-color);font-size:12px}' +

      '@media(max-width:680px){.energy-card{padding:17px}.header{margin-bottom:15px}.header h2{font-size:21px}.brand-icon{width:42px;height:42px;flex-basis:42px}.toolbar{padding:10px 11px}.overview{grid-template-columns:1fr}.energy-hero{min-height:126px}.hero-number{font-size:30px}.cost-panel{padding:12px}.stats-section{padding-top:16px}.price-section{margin-top:16px;padding-top:16px}}' +
      '@media(max-width:430px){.energy-card{padding:15px;border-radius:20px}.header{gap:9px}.brand{gap:9px}.brand-icon{width:40px;height:40px;flex-basis:40px;border-radius:13px}.header h2{font-size:20px}.status{padding:7px 8px}.status span:last-child{display:none}.toolbar{align-items:stretch;flex-direction:column;gap:8px}.toolbar-copy{padding:0 2px}.select-wrap{max-width:none;min-width:0;flex:auto}.overview{gap:9px}.energy-hero{min-height:118px;padding:14px}.hero-number{font-size:29px}.cost-item{padding:10px 3px;gap:8px}.cost-icon{width:29px;height:29px;flex-basis:29px}.cost-copy{column-gap:8px}.cost-copy strong{font-size:17px}.cost-copy em{font-size:9px}.stats-grid{gap:7px}.stat{min-height:72px;padding:10px;gap:8px}.stat-icon{width:31px;height:31px;flex-basis:31px}.stat-value{font-size:16px}.section-head{align-items:flex-start}.price-badges{max-width:54%}.record-grid{gap:7px}.record{padding:10px 9px;gap:7px}.record-icon{width:29px;height:29px;flex-basis:29px}.record-copy strong{font-size:14px}.footer{gap:6px 9px}.footer .version{width:100%;margin-left:0}}' +
      '@media(max-width:350px){.stats-grid,.record-grid{grid-template-columns:1fr}.cost-copy{grid-template-columns:1fr;grid-template-areas:"label" "value" "avg"}.cost-copy em{text-align:left}.price-badges{max-width:none;justify-content:flex-start}.section-head{flex-direction:column;gap:8px}}' +
      "</style>";
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
