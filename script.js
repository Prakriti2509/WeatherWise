const API_KEY = "650f8aeda040423ff15b48cb7f824904";

let chart;
let labelsGlobal = [];
let tempData = [];
let rainData = [];
let windData = [];
let humidityData = [];

const weatherEmojis = {
  Clear: "☀️", Clouds: "☁️", Rain: "🌧️", Drizzle: "🌦️",
  Thunderstorm: "⛈️", Snow: "❄️", Mist: "🌫️", Fog: "🌫️",
  Haze: "🌫️", Smoke: "🌫️", Dust: "🌪️", Tornado: "🌪️"
};

const aqiColors  = ["#2ecc71","#f1c40f","#e67e22","#e74c3c","#8e44ad"];
const aqiLabels  = ["Good","Fair","Moderate","Poor","Very Poor"];


const panelTitles = {
  hourly:   "Hourly Forecast",
  rain:     "Rain Probability",
  insights: "Smart Insights"
};

function openPanel(type) {
  
  ["panelHourly","panelRain","panelInsights"].forEach(id => {
    document.getElementById(id).style.display = "none";
  });

  const sectionMap = { hourly: "panelHourly", rain: "panelRain", insights: "panelInsights" };
  document.getElementById(sectionMap[type]).style.display = "block";
  document.getElementById("panelTitle").textContent = panelTitles[type];

  document.getElementById("sidePanel").classList.add("open");
  document.getElementById("sideOverlay").classList.add("active");
  document.body.style.overflow = "hidden";
}

function closePanel() {
  document.getElementById("sidePanel").classList.remove("open");
  document.getElementById("sideOverlay").classList.remove("active");
  document.body.style.overflow = "";
}


document.addEventListener("keydown", e => { if (e.key === "Escape") closePanel(); });



function doSearch() {
  const val = document.getElementById("city").value.trim();
  if (!val) return;
  getWeather(val);
  getForecast(val);
}

function syncAndSearch() {
  const val = document.getElementById("cityTop").value.trim();
  if (!val) return;
  document.getElementById("city").value = val;
  getWeather(val);
  getForecast(val);
}

function quickSearch(city) {
  document.getElementById("city").value = city;
  getWeather(city);
  getForecast(city);
}



function getWindDirection(deg) {
  const dirs = ["N","NE","E","SE","S","SW","W","NW"];
  return dirs[Math.round(deg / 45) % 8];
}

function getUVDescription(uv) {
  if (uv <= 2)  return { label: "Low" };
  if (uv <= 5)  return { label: "Moderate"};
  if (uv <= 7)  return { label: "High" };
  if (uv <= 10) return { label: "Very High"};
  return                { label: "Extreme"};
}

function getVisibilityDesc(km) {
  if (km >= 10) return "Excellent";
  if (km >= 5)  return "Good";
  if (km >= 2)  return "Moderate";
  if (km >= 1)  return "Poor";
  return "Very Poor";
}

function getPressureDesc(hpa) {
  if (hpa > 1022) return "High pressure";
  if (hpa < 1009) return "Low pressure";
  return "Normal";
}

function formatTime(unixTs, offsetSec) {
  const d = new Date((unixTs + offsetSec) * 1000);
  let h = d.getUTCHours(), m = d.getUTCMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2,"0")} ${ampm}`;
}

function getPrecipColor(pct) {
  if (pct > 70) return "#3498db";
  if (pct > 40) return "#85c1e9";
  return "rgba(255,255,255,0.25)";
}



function getWeather(city) {
  fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`)
    .then(res => res.json())
    .then(data => {
      if (data.cod !== 200) { alert("City not found. Please try again."); return; }

      document.getElementById("mainContent").style.display = "none";
      document.getElementById("topSearch").style.display = "block";
      document.getElementById("cityTop").value = data.name;

      const ui = document.getElementById("weatherUI");
      ui.classList.remove("weather-ui-panel");
      void ui.offsetWidth;
      ui.classList.add("weather-ui-panel");
      ui.style.display = "block";

      // Hero
      document.getElementById("cityName").innerHTML = data.name;
      document.getElementById("countryBadge").innerHTML = data.sys.country;
      document.getElementById("desc").innerHTML =
        data.weather[0].description.charAt(0).toUpperCase() + data.weather[0].description.slice(1);
      document.getElementById("temp").innerHTML = Math.round(data.main.temp) + "°C";
      document.getElementById("feels").innerHTML = "Feels like " + Math.round(data.main.feels_like) + "°C";
      document.getElementById("hiLo").innerHTML = `H: ${Math.round(data.main.temp_max)}° / L: ${Math.round(data.main.temp_min)}°`;
      document.getElementById("weatherEmoji").innerHTML = weatherEmojis[data.weather[0].main] || "🌡️";

      // Local time
      const offset = data.timezone;
      const localMs = Date.now() + (new Date().getTimezoneOffset() * 60000) + (offset * 1000);
      document.getElementById("localTime").innerHTML = new Date(localMs).toLocaleString("en-US", {
        weekday: "long", hour: "numeric", minute: "2-digit", hour12: true
      });

      // Stats
      document.getElementById("humidity").innerHTML = data.main.humidity + "%";
      document.getElementById("humidityBar").style.width = data.main.humidity + "%";
      document.getElementById("wind").innerHTML = data.wind.speed + " m/s";
      document.getElementById("windDir").innerHTML = getWindDirection(data.wind.deg) + " direction";

      const visKm = (data.visibility / 1000).toFixed(1);
      document.getElementById("visibility").innerHTML = visKm + " km";
      document.getElementById("visibilityDesc").innerHTML = getVisibilityDesc(parseFloat(visKm));

      document.getElementById("pressure").innerHTML = data.main.pressure + " hPa";
      document.getElementById("pressureDesc").innerHTML = getPressureDesc(data.main.pressure);

      
      document.getElementById("sunrise").innerHTML = formatTime(data.sys.sunrise, offset);
      document.getElementById("sunset").innerHTML  = formatTime(data.sys.sunset, offset);

      const nowSec = Math.floor(Date.now() / 1000);
      let prog = 0, sunLabel = "";
      if (nowSec < data.sys.sunrise) {
        prog = 0; sunLabel = "Before sunrise";
      } else if (nowSec > data.sys.sunset) {
        prog = 100; sunLabel = "After sunset";
      } else {
        prog = Math.round(((nowSec - data.sys.sunrise) / (data.sys.sunset - data.sys.sunrise)) * 100);
        sunLabel = `${((data.sys.sunset - nowSec) / 3600).toFixed(1)}h until sunset`;
      }
      document.getElementById("sunTrackFill").style.width = prog + "%";
      document.getElementById("sunDot").style.left = prog + "%";
      document.getElementById("sunLabel").innerHTML = sunLabel;

      getAQI(data.coord.lat, data.coord.lon);
      getUVIndex(data.coord.lat, data.coord.lon);
    })
    .catch(() => alert("Failed to fetch weather. Check your connection."));
}

function getAQI(lat, lon) {
  fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`)
    .then(res => res.json())
    .then(data => {
      if (!data.list || !data.list[0]) return;
      const aqi  = data.list[0].main.aqi;
      const el   = document.getElementById("aqi");
      const desc = document.getElementById("aqiDesc");
      if (el)   { el.innerHTML = aqiLabels[aqi - 1]; }
      if (desc) { desc.innerHTML = `PM2.5: ${data.list[0].components.pm2_5.toFixed(1)} µg/m³`; }
    });
}

function getUVIndex(lat, lon) {
  fetch(`https://api.openweathermap.org/data/2.5/uvi?lat=${lat}&lon=${lon}&appid=${API_KEY}`)
    .then(res => res.json())
    .then(data => {
      const uv   = Math.round(data.value);
      const info = getUVDescription(uv);
      const el   = document.getElementById("uvIndex");
      const desc = document.getElementById("uvDesc");
      if (el)   { el.innerHTML = uv; el.style.color = info.color; }
      if (desc) { desc.innerHTML = info.label; desc.style.color = info.color; }
    })
    .catch(() => { document.getElementById("uvIndex").innerHTML = "N/A"; });
}



function getForecast(city) {
  fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`)
    .then(res => res.json())
    .then(data => {
      if (data.cod !== "200") return;

      labelsGlobal = [];
      tempData     = [];
      rainData     = [];
      windData     = [];
      humidityData = [];

      
      let hourlyHTML = "";
      for (let i = 0; i < Math.min(8, data.list.length); i++) {
        const d    = data.list[i];
        const time = d.dt_txt.split(" ")[1].slice(0, 5);
        const icon = `https://openweathermap.org/img/wn/${d.weather[0].icon}@2x.png`;
        const pop  = d.pop ? Math.round(d.pop * 100) : 0;
        hourlyHTML += `
          <div class="hourly-panel-item">
            <span class="hp-time">${time}</span>
            <img src="${icon}" class="hp-icon">
            <span class="hp-temp">${Math.round(d.main.temp)}°</span>
            <span class="hp-rain" style="color:${getPrecipColor(pop)}">💧 ${pop}%</span>
            <span class="hp-desc">${d.weather[0].description}</span>
          </div>
        `;
      }
      document.getElementById("hourlyForecastPanel").innerHTML = hourlyHTML;

      // ── Rain probability panel ──
      let rainHTML = `<div class="precip-panel-header">Next 24 hours — chance of rain</div>`;
      for (let i = 0; i < Math.min(8, data.list.length); i++) {
        const d   = data.list[i];
        const time = d.dt_txt.split(" ")[1].slice(0, 5);
        const pop  = d.pop ? Math.round(d.pop * 100) : 0;
        const col  = getPrecipColor(pop);
        rainHTML += `
          <div class="precip-panel-item">
            <span class="pp-time">${time}</span>
            <div class="pp-bar-track">
              <div class="pp-bar-fill" style="width:${pop}%;background:${col};"></div>
            </div>
            <span class="pp-pct" style="color:${col}">${pop}%</span>
          </div>
        `;
      }
      document.getElementById("precipChancePanel").innerHTML = rainHTML;

      // ── 5-day forecast (main view) ──
      let forecastHTML = "";
      const seen = {};
      for (let i = 0; i < data.list.length; i++) {
        const d      = data.list[i];
        const dayKey = d.dt_txt.split(" ")[0];
        if (seen[dayKey]) continue;
        seen[dayKey] = true;
        if (Object.keys(seen).length > 5) break;

        const date    = new Date(d.dt_txt);
        const day     = date.toLocaleDateString("en-US", { weekday: "short" });
        const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        const icon    = `https://openweathermap.org/img/wn/${d.weather[0].icon}@2x.png`;
        const rain    = d.rain ? (d.rain["3h"] || 0).toFixed(1) : 0;
        const wind    = d.wind ? d.wind.speed : 0;
        const pop     = d.pop ? Math.round(d.pop * 100) : 0;

        forecastHTML += `
          <div class="day-card ${d.weather[0].main === "Clear" ? "sunny" : ""}">
            <div class="day-header">
              <h4>${day}</h4>
              <span class="day-date">${dateStr}</span>
            </div>
            <img src="${icon}">
            <div class="tempBig">${Math.round(d.main.temp)}°</div>
            <div class="temp-range">${Math.round(d.main.temp_min)}° / ${Math.round(d.main.temp_max)}°</div>
            <div class="small-info">
              <p>Rain: ${pop}%</p>
              <p>Wind: ${wind} m/s</p>
              <p>Humidity: ${d.main.humidity}%</p>
            </div>
          </div>
        `;

        labelsGlobal.push(day);
        tempData.push(d.main.temp);
        windData.push(wind);
        rainData.push(parseFloat(rain));
        humidityData.push(d.main.humidity);
      }
      document.getElementById("forecast").innerHTML = forecastHTML;

      // ── Smart Insights panel ──
      generateGuide(data);

      showChart("temp");
    });
}



function showChart(type) {
  document.querySelectorAll(".chart-btn").forEach(b => b.classList.remove("active-btn"));
  const btnMap = { temp: "btnTemp", rain: "btnRain", wind: "btnWind", humidity: "btnHumidity" };
  document.getElementById(btnMap[type]).classList.add("active-btn");

  const configs = {
    temp:     { label: "Temperature (°C)", data: tempData,     color: "#ff9f43" },
    rain:     { label: "Precipitation (mm)", data: rainData,   color: "#5dade2" },
    wind:     { label: "Wind Speed (m/s)", data: windData,     color: "#2ecc71" },
    humidity: { label: "Humidity (%)", data: humidityData,     color: "#a29bfe" }
  };
  const c = configs[type];
  if (chart) chart.destroy();

  chart = new Chart(document.getElementById("tempChart"), {
    type: "line",
    data: {
      labels: labelsGlobal,
      datasets: [{
        label: c.label,
        data: c.data,
        borderWidth: 2,
        tension: 0.4,
        borderColor: c.color,
        backgroundColor: c.color + "22",
        pointBackgroundColor: c.color,
        pointBorderColor: "white",
        pointRadius: 5,
        fill: true
      }]
    },
    options: {
      plugins: {
        legend: { labels: { color: "white" } },
        tooltip: { backgroundColor: "rgba(0,0,0,0.65)", titleColor: "white", bodyColor: "white" }
      },
      scales: {
        x: { ticks: { color: "white" }, grid: { color: "rgba(255,255,255,0.12)" } },
        y: { ticks: { color: "white" }, grid: { color: "rgba(255,255,255,0.12)" } }
      }
    }
  });
}



function generateGuide(data) {
  let rain = 0, clear = 0, storm = 0, snow = 0;
  let minTemp = Infinity, maxTemp = -Infinity, totalWind = 0;

  data.list.forEach(i => {
    const main = i.weather[0].main;
    if (main === "Rain")         rain++;
    if (main === "Clear")        clear++;
    if (main === "Thunderstorm") storm++;
    if (main === "Snow")         snow++;
    if (i.main.temp < minTemp)   minTemp = i.main.temp;
    if (i.main.temp > maxTemp)   maxTemp = i.main.temp;
    totalWind += i.wind ? i.wind.speed : 0;
  });

  const avgWind = (totalWind / data.list.length).toFixed(1);

  const insights = [
    {
      icon: storm > 2 ? "⛈️" : snow > 3 ? "❄️" : rain > clear ? "🌧️" : "☀️",
      title: "Outdoor Activities",
      body: storm > 2
        ? "Thunderstorms likely this week. Best to stay indoors and avoid open areas."
        : snow > 3
        ? "Snowfall expected. Outdoor plans should be rescheduled or planned carefully."
        : rain > clear
        ? "Rainy week ahead. Not ideal for outdoor activities — plan indoor alternatives."
        : "Mostly clear skies this week. Great time for outdoor plans, travel, or evening walks."
    },
    {
      icon: minTemp < 10 ? "🧥" : minTemp < 18 ? "🧣" : "👕",
      title: "What to Wear",
      body: minTemp < 10
        ? `Temperatures dipping to ${Math.round(minTemp)}°C. Layer up, especially in the mornings and evenings.`
        : minTemp < 18
        ? "Mild temperatures expected. A light jacket should be enough for cooler parts of the day."
        : "Warm weather all week. Light clothing recommended — don't forget sunscreen midday."
    },
    {
      icon: storm > 2 ? "🚗" : rain > 3 ? "🌂" : avgWind > 7 ? "💨" : "✅",
      title: "Travel & Commute",
      body: storm > 2
        ? "Stormy conditions may affect roads. Avoid travel during peak storm hours if possible."
        : rain > 3
        ? "Rain mid-week may slow your commute. Allow extra travel time and watch for waterlogging."
        : avgWind > 7
        ? `Strong winds expected (avg ${avgWind} m/s). Cyclists and bikers should take extra care.`
        : "No major weather disruptions expected. Commutes and travel should be smooth this week."
    },
    {
      icon: "🌡️",
      title: "Temperature Range",
      body: `Expect a low of ${Math.round(minTemp)}°C and a high of ${Math.round(maxTemp)}°C this week — a swing of ${Math.round(maxTemp - minTemp)}°C.`
    }
  ];

  const html = insights.map(ins => `
    <div class="insight-card">
      <div class="insight-card-title">${ins.title}</div>
      <div class="insight-card-body">${ins.body}</div>
    </div>
  `).join("");

  document.getElementById("guidePanel").innerHTML = html;
}