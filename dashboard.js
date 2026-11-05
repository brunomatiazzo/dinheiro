// === Rastreador de Celular - Dashboard ===
// Monitoramento de telemetria em tempo real

const CONFIG = {
  telemetryUrl: '/telemetry_data.json',
  autoUpdateMs: 2000,
  mapCenter: [38.7369, -9.1427],
  mapZoom: 14,
  geofenceRadiusKm: 0.5
};

const state = {
  telemetry: null,
  tracking: null,
  analytics: null,
  events: [],
  filters: { status: ['online','offline','sinais'], bateria: true, wifi: true },
  geofence: { lat: 38.7369, lon: -9.1427, radiusKm: 0.5 },
  connected: true,
  lastUpdate: null
};

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

const els = {
  timer: $('#timer'), timerDisplay: $('#timerDisplay'),
  statusPill: $('#statusPill'),
  telemetryBody: $('#telemetryBody'),
  map: $('#map'), mapLoading: $('#mapLoading'),
  alertsBody: $('#alertsBody'),
  geofenceBody: $('#geofenceBody'),
  totalEvents: $('#totalEvents'), avgSpeed: $('#avgSpeed'),
  maxSpeed: $('#maxSpeed'), distance: $('#distance'),
  filters: $$('.chip-toggle')
};

function fmtTime(s) {
  const h = String(Math.floor(s/3600)).padStart(2,'0');
  const m = String(Math.floor((s%3600)/60)).padStart(2,'0');
  const sec = String(s%60).padStart(2,'0');
  return h + ':' + m + ':' + sec;
}

function toast(msg, type) {
  const t = $('#toast');
  t.textContent = msg;
  t.className = 'toast show ' + (type || 'info');
  setTimeout(() => t.classList.remove('show'), 3000);
}

function haversine(lon1, lat1, lon2, lat2) {
  const R = 6371000;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

let map = null;
let marker = null;
let geofenceLayer = null;

function initMap() {
  if (typeof L === 'undefined') return false;
  map = L.map('map', { zoomControl: true }).setView([CONFIG.mapCenter[0], CONFIG.mapCenter[1]], CONFIG.mapZoom);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'OpenStreetMap'
  }).addTo(map);
  return true;
}

function renderMap() {
  if (!map) {
    if (!initMap()) { els.mapLoading.textContent = 'Leaflet nao carregou.'; return; }
  }
  els.mapLoading.classList.add('hidden');
  const t = state.tracking;
  if (!t || !t.localizacao) return;
  const { lat, lon } = t.localizacao;
  if (marker) map.removeLayer(marker);
  marker = L.marker([lat, lon]).addTo(map)
    .bindPopup('<b>Local:</b> ' + t.velocidade + ' km/h' + '<br>bateria: ' + t.bateria + '%' + '<br>sinal: ' + t.sinal + '/4');
  map.setView([lat, lon], CONFIG.mapZoom);
  if (geofenceLayer) map.removeLayer(geofenceLayer);
  geofenceLayer = L.circle([lat, lon], CONFIG.geofenceRadiusKm * 1000, {
    color: state.geofence.active ? '#22c55e' : '#ef4444',
    fillColor: state.geofence.active ? '#22c55e' : '#ef4444',
    fillOpacity: 0.15,
    weight: 2
  }).addTo(map);
}

async function fetchTelemetry() {
  try {
    const res = await fetch(CONFIG.telemetryUrl);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } catch (e) {
    state.connected = false;
    toast('Conexao perdida. Verifique a rede.', 'err');
    return null;
  }
}

function renderTelemetry() {
  const t = state.tracking;
  if (!t) return;
  els.statusPill.className = 'status-pill ' + t.status;
  els.timer.textContent = fmtTime(t.velocidade);
  els.timerDisplay.textContent = t.last_update || '—';
}

function renderTelemetryBody() {
  const list = state.events.slice(-15).reverse();
  els.telemetryBody.innerHTML = list.map(e => {
    const prio = e.prioridade || 'baixa';
    const cls = prio === 'critica' ? 'err' : prio === 'alta' ? 'warn' : '';
    return '<div class="alert ' + cls + '"><span>📱</span><div><strong>' + (e.telefone || '—') + '</strong>' +
      '<div class="subtitle">' + (e.data_hora || '—') + ' · ' + (e.origem || '—') + ' · ' + (e.andamento || '—') + '</div>' +
      '<div class="subtitle">' + (e.mensagem || '—') + ' · ' + (e.velocidade || 0) + ' km/h</div></div></div>';
  }).join('');
}

function renderAlerts() {
  const criticas = state.events.filter(e => e.prioridade === 'critica');
  els.alertsBody.innerHTML = criticas.length ? criticas.map(e => {
    return '<div class="alert err"><span>💥</span><div><strong>' + (e.telefone || '—') + '</strong>' +
      '<div class="subtitle">' + (e.mensagem || '—') + ' · ' + (e.velocidade || 0) + ' km/h · ' + (e.origem || '—') + '</div></div></div>';
  }).join('') : '<p class="subtitle">Nenhum alerta critico.</p>';
}

function renderGeofence() {
  const t = state.tracking;
  if (!t) return;
  const d = haversine(t.localizacao.lon, t.localizacao.lat, state.geofence.lon, state.geofence.lat);
  const active = d <= state.geofence.radiusKm;
  state.geofence.active = active;
  els.geofenceBody.innerHTML = '<div class="alert ' + (active ? 'ok' : 'err') + '"><span>' + (active ? 'Dentro' : 'Fora') + '</span>' +
    '<div><strong>' + (active ? 'Dentro do geofence' : 'Fora do geofence') + '</strong>' +
    '<div class="subtitle">' + d.toFixed(2) + ' km do centro (raio ' + state.geofence.radiusKm + ' km)</div></div></div>';
}

function renderSummary() {
  const a = state.analytics || {};
  els.totalEvents.textContent = a.total_events || 0;
  els.avgSpeed.textContent = a.media_velocidade || 0;
  els.maxSpeed.textContent = a.velocidade_max || 0;
  els.distance.textContent = a.distancia_total_km ? a.distancia_total_km.toFixed(2) : '0';
}

async function boot() {
  const data = await fetchTelemetry();
  if (data) {
    state.tracking = data.tracking;
    state.analytics = data.analytics;
    state.events = data.events || [];
    state.geofence = { lat: data.tracking.localizacao.latitude, lon: data.tracking.localizacao.longitude, radiusKm: CONFIG.geofenceRadiusKm };
    state.lastUpdate = new Date().toISOString();
  }
  if (map) renderMap();
  renderTelemetry();
  renderTelemetryBody();
  renderAlerts();
  renderGeofence();
  renderSummary();
  state.connected = true;
}

setInterval(async () => {
  const data = await fetchTelemetry();
  if (data) {
    state.tracking = data.tracking;
    state.analytics = data.analytics;
    state.events = data.events || [];
    state.geofence = { lat: data.tracking.localizacao.latitude, lon: data.tracking.localizacao.longitude, radiusKm: CONFIG.geofenceRadiusKm };
    state.lastUpdate = new Date().toISOString();
    if (map) renderMap();
    renderTelemetry();
    renderTelemetryBody();
    renderAlerts();
    renderGeofence();
    renderSummary();
  }
}, CONFIG.autoUpdateMs);

boot().then(() => {
  setTimeout(() => {
    if (state.connected) toast('Dashboard conectado. Atualizando a cada 2s.', 'ok');
  }, 500);
});
