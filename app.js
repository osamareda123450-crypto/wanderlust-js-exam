const PLANS_STORAGE_KEY = "wanderlust_saved_plans_v1";

const COUNTRIES_DATA = [
  {
    code: "EG",
    name: "Egypt",
    capital: "Cairo",
    currency: "EGP",
    region: "Africa / Middle East",
    lat: 30.0444,
    lon: 31.2357,
    cities: ["Cairo", "Alexandria", "Luxor", "Sharm El Sheikh"]
  },
  {
    code: "AE",
    name: "United Arab Emirates",
    capital: "Abu Dhabi",
    currency: "AED",
    region: "Middle East",
    lat: 25.2048,
    lon: 55.2708,
    cities: ["Dubai", "Abu Dhabi", "Sharjah"]
  },
  {
    code: "SA",
    name: "Saudi Arabia",
    capital: "Riyadh",
    currency: "SAR",
    region: "Middle East",
    lat: 24.7136,
    lon: 46.6753,
    cities: ["Riyadh", "Jeddah", "AlUla"]
  },
  {
    code: "TR",
    name: "Turkey",
    capital: "Ankara",
    currency: "TRY",
    region: "Europe / Asia",
    lat: 41.0082,
    lon: 28.9784,
    cities: ["Istanbul", "Antalya", "Cappadocia"]
  },
  {
    code: "GB",
    name: "United Kingdom",
    capital: "London",
    currency: "GBP",
    region: "Europe",
    lat: 51.5072,
    lon: -0.1276,
    cities: ["London", "Edinburgh", "Manchester"]
  },
  {
    code: "FR",
    name: "France",
    capital: "Paris",
    currency: "EUR",
    region: "Europe",
    lat: 48.8566,
    lon: 2.3522,
    cities: ["Paris", "Nice", "Lyon"]
  },
  {
    code: "US",
    name: "United States",
    capital: "Washington, D.C.",
    currency: "USD",
    region: "North America",
    lat: 40.7128,
    lon: -74.006,
    cities: ["New York", "Los Angeles", "Chicago"]
  },
  {
    code: "JP",
    name: "Japan",
    capital: "Tokyo",
    currency: "JPY",
    region: "East Asia",
    lat: 35.6762,
    lon: 139.6503,
    cities: ["Tokyo", "Kyoto", "Osaka"]
  }
];

const FALLBACK_RATES = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  EGP: 49.5,
  AED: 3.67,
  SAR: 3.75,
  TRY: 34.5,
  JPY: 154.0
};

class WanderlustApp {
  constructor() {
    this.selectedCountry = COUNTRIES_DATA[0];
    this.selectedCity = COUNTRIES_DATA[0].cities[0];
    this.selectedYear = "2026";
    this.holidays = [];
    this.savedPlans = this.loadPlans();
    this.rates = { ...FALLBACK_RATES };

    this.cacheDOM();
    this.bindEvents();
    this.init();
  }

  cacheDOM() {
    this.navItems = document.querySelectorAll(".nav-item");
    this.views = document.querySelectorAll(".view");
    this.viewTitle = document.getElementById("view-title");
    this.viewSubtitle = document.getElementById("view-subtitle");
    this.activeDestinationText = document.getElementById("active-destination-text");

    this.statCountries = document.getElementById("stat-countries");
    this.statHolidays = document.getElementById("stat-holidays");
    this.statEvents = document.getElementById("stat-events");
    this.statSaved = document.getElementById("stat-saved");
    this.plansBadge = document.getElementById("plans-badge");

    this.countrySelect = document.getElementById("country-select");
    this.citySelect = document.getElementById("city-select");
    this.yearSelect = document.getElementById("year-select");
    this.exploreBtn = document.getElementById("explore-btn");
    this.countryInfoBox = document.getElementById("country-info-box");

    this.holidaysList = document.getElementById("holidays-list");
    this.holidaysContext = document.getElementById("holidays-context");

    this.eventsList = document.getElementById("events-list");
    this.eventsContext = document.getElementById("events-context");

    this.weatherList = document.getElementById("weather-list");
    this.weatherContext = document.getElementById("weather-context");

    this.weekendsList = document.getElementById("weekends-list");
    this.weekendsContext = document.getElementById("weekends-context");

    this.amountInput = document.getElementById("amount-input");
    this.fromCurrency = document.getElementById("from-currency");
    this.toCurrency = document.getElementById("to-currency");
    this.swapCurrencyBtn = document.getElementById("swap-currency-btn");
    this.conversionResult = document.getElementById("conversion-result");
    this.quickConvertList = document.getElementById("quick-convert-list");

    this.savedPlansList = document.getElementById("saved-plans-list");
    this.clearPlansBtn = document.getElementById("clear-plans-btn");
  }

  bindEvents() {
    this.navItems.forEach((btn) => {
      btn.addEventListener("click", () => this.switchView(btn.dataset.view));
    });

    this.countrySelect.addEventListener("change", () => {
      const country = COUNTRIES_DATA.find((c) => c.code === this.countrySelect.value);
      if (country) {
        this.populateCities(country);
      }
    });

    this.exploreBtn.addEventListener("click", () => this.exploreDestination());

    this.amountInput.addEventListener("input", () => this.renderCurrencyConversion());
    this.fromCurrency.addEventListener("change", () => this.renderCurrencyConversion());
    this.toCurrency.addEventListener("change", () => this.renderCurrencyConversion());
    this.swapCurrencyBtn.addEventListener("click", () => {
      const temp = this.fromCurrency.value;
      this.fromCurrency.value = this.toCurrency.value;
      this.toCurrency.value = temp;
      this.renderCurrencyConversion();
    });

    this.clearPlansBtn.addEventListener("click", () => {
      this.savedPlans = [];
      this.savePlans();
      this.updateSavedCounters();
      this.renderSavedPlans();
    });
  }

  async init() {
    this.populateCountries();
    this.populateCities(this.selectedCountry);
    this.populateCurrencies();
    this.updateSavedCounters();
    await this.fetchExchangeRates();
    this.renderCurrencyConversion();
    await this.exploreDestination();
  }

  populateCountries() {
    this.countrySelect.innerHTML = COUNTRIES_DATA.map(
      (c) => `<option value="${c.code}">${c.name} (${c.code})</option>`
    ).join("");
  }

  populateCities(country) {
    this.citySelect.innerHTML = country.cities
      .map((city) => `<option value="${city}">${city}</option>`)
      .join("");
  }

  populateCurrencies() {
    const codes = Object.keys(this.rates);
    this.fromCurrency.innerHTML = codes.map((c) => `<option value="${c}">${c}</option>`).join("");
    this.toCurrency.innerHTML = codes.map((c) => `<option value="${c}">${c}</option>`).join("");
    this.fromCurrency.value = "USD";
    this.toCurrency.value = this.selectedCountry.currency || "EGP";
  }

  async exploreDestination() {
    const code = this.countrySelect.value;
    this.selectedCountry = COUNTRIES_DATA.find((c) => c.code === code) || COUNTRIES_DATA[0];
    this.selectedCity = this.citySelect.value || this.selectedCountry.cities[0];
    this.selectedYear = this.yearSelect.value;

    this.activeDestinationText.textContent = `${this.selectedCountry.name} • ${this.selectedCity} • ${this.selectedYear}`;
    this.toCurrency.value = this.selectedCountry.currency;
    this.renderCurrencyConversion();
    this.renderCountryInfo();

    await Promise.all([
      this.loadHolidays(),
      this.loadWeather()
    ]);

    this.renderEvents();
    this.renderLongWeekends();
    this.renderSavedPlans();
  }

  renderCountryInfo() {
    const c = this.selectedCountry;
    this.countryInfoBox.innerHTML = `
      <div class="info-box"><small>Country</small><strong>${c.name} (${c.code})</strong></div>
      <div class="info-box"><small>Capital</small><strong>${c.capital}</strong></div>
      <div class="info-box"><small>Selected City</small><strong>${this.selectedCity}</strong></div>
      <div class="info-box"><small>Region</small><strong>${c.region}</strong></div>
      <div class="info-box"><small>Currency</small><strong>${c.currency}</strong></div>
      <div class="info-box"><small>Travel Year</small><strong>${this.selectedYear}</strong></div>
    `;
  }

  async loadHolidays() {
    const { code, name } = this.selectedCountry;
    const year = this.selectedYear;
    this.holidaysContext.textContent = `Public holidays for ${name} in ${year}`;

    try {
      const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/${code}`);
      if (!res.ok) throw new Error("Holiday API error");
      const data = await res.json();
      this.holidays = Array.isArray(data) ? data : [];
    } catch {
      this.holidays = [
        { date: `${year}-01-01`, localName: "New Year's Day", name: "New Year's Day" },
        { date: `${year}-05-01`, localName: "Labor Day", name: "Labor Day" },
        { date: `${year}-12-25`, localName: "Christmas Day", name: "Christmas Day" }
      ];
    }

    this.statHolidays.textContent = String(this.holidays.length);
    this.renderHolidays();
  }

  renderHolidays() {
    if (!this.holidays.length) {
      this.holidaysList.innerHTML = `<p>No holidays found for this selection.</p>`;
      return;
    }

    this.holidaysList.innerHTML = this.holidays
      .map((h) => {
        const title = h.localName || h.name;
        const planId = `holiday-${this.selectedCountry.code}-${h.date}-${title}`;
        const saved = this.isPlanSaved(planId);

        return `
          <article class="item-card">
            <div>
              <div class="item-date">${h.date} • ${this.selectedCountry.name}</div>
              <h3>${title}</h3>
              <p>${h.name}</p>
            </div>
            <button
              type="button"
              class="btn btn-save ${saved ? "saved" : ""}"
              data-plan='${JSON.stringify({
                id: planId,
                type: "Holiday",
                title,
                date: h.date,
                location: this.selectedCountry.name
              })}'>
              <i class="fa-solid ${saved ? "fa-check" : "fa-bookmark"}"></i>
              ${saved ? "Saved" : "Save"}
            </button>
          </article>
        `;
      })
      .join("");

    this.bindSaveButtons(this.holidaysList);
  }

  renderEvents() {
    const city = this.selectedCity;
    const country = this.selectedCountry.name;
    this.eventsContext.textContent = `Featured events in ${city}, ${country} (${this.selectedYear})`;

    const sampleEvents = [
      {
        id: `event-${city}-music`,
        title: `${city} International Music & Arts Night`,
        date: `${this.selectedYear}-12-12`,
        category: "Concert & Culture",
        desc: `Live performances, street food, and cultural showcases in ${city}.`
      },
      {
        id: `event-${city}-marathon`,
        title: `${city} City Run & Wellness Fest`,
        date: `${this.selectedYear}-12-18`,
        category: "Sports & Lifestyle",
        desc: `Morning run and outdoor wellness activities across ${city}.`
      },
      {
        id: `event-${city}-expo`,
        title: `${city} Heritage & Design Exhibition`,
        date: `${this.selectedYear}-12-27`,
        category: "Exhibition",
        desc: `Local artists, designers, and historical displays in ${city}.`
      }
    ];

    this.eventsList.innerHTML = sampleEvents
      .map((ev) => {
        const saved = this.isPlanSaved(ev.id);
        return `
          <article class="item-card">
            <div>
              <div class="item-date">${ev.date} • ${ev.category}</div>
              <h3>${ev.title}</h3>
              <p>${ev.desc}</p>
            </div>
            <button
              type="button"
              class="btn btn-save ${saved ? "saved" : ""}"
              data-plan='${JSON.stringify({
                id: ev.id,
                type: "Event",
                title: ev.title,
                date: ev.date,
                location: `${city}, ${country}`
              })}'>
              <i class="fa-solid ${saved ? "fa-check" : "fa-bookmark"}"></i>
              ${saved ? "Saved" : "Save"}
            </button>
          </article>
        `;
      })
      .join("");

    this.bindSaveButtons(this.eventsList);
  }

  async loadWeather() {
    const { lat, lon } = this.selectedCountry;
    this.weatherContext.textContent = `7-day forecast for ${this.selectedCity}`;

    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max&timezone=auto`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Weather API error");
      const data = await res.json();
      const daily = data.daily;

      const daysHtml = daily.time
        .slice(0, 7)
        .map((dateStr, idx) => {
          const maxT = Math.round(daily.temperature_2m_max[idx]);
          const minT = Math.round(daily.temperature_2m_min[idx]);
          const rain = daily.precipitation_probability_max[idx] ?? 0;
          const wind = Math.round(daily.wind_speed_10m_max[idx] ?? 0);

          return `
            <div class="weather-card">
              <strong>${dateStr}</strong>
              <div class="temp">${maxT}° / ${minT}°C</div>
              <small>Rain: ${rain}%</small>
              <small>Wind: ${wind} km/h</small>
            </div>
          `;
        })
        .join("");

      this.weatherList.innerHTML = daysHtml;
    } catch {
      this.weatherList.innerHTML = `<p>Could not load weather forecast right now.</p>`;
    }
  }

  renderLongWeekends() {
    this.weekendsContext.textContent = `Long weekend ideas for ${this.selectedCountry.name} in ${this.selectedYear}`;

    const candidates = this.holidays.slice(0, 4).map((h, idx) => {
      const title = h.localName || h.name;
      return {
        id: `weekend-${this.selectedCountry.code}-${h.date}-${idx}`,
        title: `Long Weekend around ${title}`,
        date: h.date,
        desc: `3–4 day trip opportunity in ${this.selectedCity} around ${h.date}.`
      };
    });

    if (!candidates.length) {
      this.weekendsList.innerHTML = `<p>No long weekend opportunities available.</p>`;
      return;
    }

    this.weekendsList.innerHTML = candidates
      .map((w) => {
        const saved = this.isPlanSaved(w.id);
        return `
          <article class="item-card">
            <div>
              <div class="item-date">${w.date} • Mini-Trip Idea</div>
              <h3>${w.title}</h3>
              <p>${w.desc}</p>
            </div>
            <button
              type="button"
              class="btn btn-save ${saved ? "saved" : ""}"
              data-plan='${JSON.stringify({
                id: w.id,
                type: "Long Weekend",
                title: w.title,
                date: w.date,
                location: `${this.selectedCity}, ${this.selectedCountry.name}`
              })}'>
              <i class="fa-solid ${saved ? "fa-check" : "fa-bookmark"}"></i>
              ${saved ? "Saved" : "Save"}
            </button>
          </article>
        `;
      })
      .join("");

    this.bindSaveButtons(this.weekendsList);
  }

  async fetchExchangeRates() {
    try {
      const res = await fetch("https://open.er-api.com/v6/latest/USD");
      if (!res.ok) throw new Error("Rates API error");
      const data = await res.json();
      if (data && data.rates) {
        this.rates = { ...FALLBACK_RATES, ...data.rates };
        const currentFrom = this.fromCurrency.value || "USD";
        const currentTo = this.toCurrency.value || this.selectedCountry.currency;
        const allCodes = Object.keys(this.rates);
        this.fromCurrency.innerHTML = allCodes.map((c) => `<option value="${c}">${c}</option>`).join("");
        this.toCurrency.innerHTML = allCodes.map((c) => `<option value="${c}">${c}</option>`).join("");
        this.fromCurrency.value = this.rates[currentFrom] ? currentFrom : "USD";
        this.toCurrency.value = this.rates[currentTo] ? currentTo : "EUR";
      }
    } catch {
      this.rates = { ...FALLBACK_RATES };
    }
  }

  renderCurrencyConversion() {
    const amount = parseFloat(this.amountInput.value);
    const from = this.fromCurrency.value;
    const to = this.toCurrency.value;

    const fromRate = this.rates[from] || 1;
    const toRate = this.rates[to] || 1;
    const unitRate = toRate / fromRate;
    const safeAmount = Number.isFinite(amount) && amount >= 0 ? amount : 0;
    const converted = safeAmount * unitRate;

    this.conversionResult.innerHTML = `
      <div>${safeAmount} ${from} equals</div>
      <strong>${converted.toFixed(2)} ${to}</strong>
      <small>1 ${from} = ${unitRate.toFixed(4)} ${to}</small>
    `;

    const quickTargets = ["USD", "EUR", "GBP", this.selectedCountry.currency].filter(
      (code, i, arr) => code && code !== from && arr.indexOf(code) === i
    );

    this.quickConvertList.innerHTML = quickTargets
      .map((target) => {
        const rate = (this.rates[target] || 1) / fromRate;
        const val = (safeAmount * rate).toFixed(2);
        return `<div class="quick-chip"><strong>${val} ${target}</strong><br><small>1 ${from} = ${rate.toFixed(3)} ${target}</small></div>`;
      })
      .join("");
  }

  bindSaveButtons(container) {
    container.querySelectorAll(".btn-save").forEach((btn) => {
      btn.addEventListener("click", () => {
        const plan = JSON.parse(btn.dataset.plan);
        this.togglePlan(plan);
        this.renderHolidays();
        this.renderEvents();
        this.renderLongWeekends();
        this.renderSavedPlans();
      });
    });
  }

  togglePlan(plan) {
    const exists = this.savedPlans.some((p) => p.id === plan.id);
    if (exists) {
      this.savedPlans = this.savedPlans.filter((p) => p.id !== plan.id);
    } else {
      this.savedPlans.unshift(plan);
    }
    this.savePlans();
    this.updateSavedCounters();
  }

  isPlanSaved(id) {
    return this.savedPlans.some((p) => p.id === id);
  }

  loadPlans() {
    try {
      const raw = localStorage.getItem(PLANS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  savePlans() {
    localStorage.setItem(PLANS_STORAGE_KEY, JSON.stringify(this.savedPlans));
  }

  updateSavedCounters() {
    const count = String(this.savedPlans.length);
    this.plansBadge.textContent = count;
    this.statSaved.textContent = count;
  }

  renderSavedPlans() {
    if (!this.savedPlans.length) {
      this.savedPlansList.innerHTML = `<p>No saved plans yet. Click Save on any Holiday, Event, or Long Weekend.</p>`;
      return;
    }

    this.savedPlansList.innerHTML = this.savedPlans
      .map(
        (plan) => `
        <article class="item-card">
          <div>
            <div class="item-date">${plan.type} • ${plan.date}</div>
            <h3>${plan.title}</h3>
            <p><i class="fa-solid fa-location-dot"></i> ${plan.location}</p>
          </div>
          <button type="button" class="btn btn-danger delete-plan-btn" data-id="${plan.id}">
            <i class="fa-solid fa-trash"></i> Delete
          </button>
        </article>
      `
      )
      .join("");

    this.savedPlansList.querySelectorAll(".delete-plan-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        this.savedPlans = this.savedPlans.filter((p) => p.id !== id);
        this.savePlans();
        this.updateSavedCounters();
        this.renderHolidays();
        this.renderEvents();
        this.renderLongWeekends();
        this.renderSavedPlans();
      });
    });
  }

  switchView(viewName) {
    this.navItems.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.view === viewName);
    });

    this.views.forEach((sec) => {
      sec.classList.toggle("active", sec.id === `view-${viewName}`);
    });

    const meta = {
      dashboard: ["Dashboard", "Select your country, city, and year to start planning"],
      holidays: ["Public Holidays", "Browse official holidays for your selected country"],
      events: ["Events Explorer", "Discover events in your chosen city"],
      weather: ["Weather Forecast", "7-day forecast for your selected destination"],
      weekends: ["Long Weekends", "Plan mini-trips around holidays and weekends"],
      currency: ["Currency Converter", "Live exchange rates and instant conversion"],
      plans: ["My Plans", "Your saved items persisted in localStorage"]
    };

    const [title, subtitle] = meta[viewName] || meta.dashboard;
    this.viewTitle.textContent = title;
    this.viewSubtitle.textContent = subtitle;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new WanderlustApp();
});