import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Navigation, Crosshair, Layers, AlertTriangle, Info,
  MapPin, Loader2, LocateFixed, RefreshCw, Radio,
  ShieldAlert, Circle, TriangleAlert
} from 'lucide-react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

/* ── Haversine distance (km) ── */
function getDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDist(km) {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

/* ── Mock incident data (Bangalore-centric) ── */
const BASE_INCIDENTS = [
  { id: 1, type: 'violation', title: 'Triple Riding', location: { lat: 12.9716, lng: 77.5946, address: 'MG Road Junction' }, createdAt: new Date().toISOString() },
  { id: 2, type: 'pothole',   title: 'Deep Pothole',  location: { lat: 12.9650, lng: 77.6000, address: 'Richmond Circle' }, severity: 'High', createdAt: new Date(Date.now() - 900000).toISOString() },
  { id: 3, type: 'sos',      title: 'Emergency SOS', location: { lat: 12.9352, lng: 77.6245, address: 'Koramangala 80ft Road' }, createdAt: new Date().toISOString() },
  { id: 4, type: 'violation', title: 'Signal Jump',   location: { lat: 12.9250, lng: 77.5800, address: 'Jayanagar 4th Block' }, createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: 5, type: 'pothole',   title: 'Medium Pothole', location: { lat: 12.9780, lng: 77.5730, address: 'Rajajinagar Main Rd' }, severity: 'Medium', createdAt: new Date(Date.now() - 1800000).toISOString() },
  { id: 6, type: 'pothole',   title: 'Road Erosion',  location: { lat: 12.9600, lng: 77.6100, address: 'Indiranagar 100ft Rd' }, severity: 'Critical', createdAt: new Date(Date.now() - 600000).toISOString() },
  { id: 7, type: 'pothole',   title: 'Pothole Cluster', location: { lat: 12.9480, lng: 77.5720, address: 'Basavanagudi Circle' }, severity: 'High', createdAt: new Date(Date.now() - 7200000).toISOString() },
  { id: 8, type: 'violation', title: 'No Helmet', location: { lat: 12.9900, lng: 77.6050, address: 'Hebbal Flyover' }, createdAt: new Date(Date.now() - 1200000).toISOString() },
];

const COLOR = {
  sos:       '#ef4444',
  pothole:   '#eab308',
  violation: '#0070f3',
};

const Dashboard = () => {
  const [activeTab, setActiveTab]     = useState('all');
  const [incidents, setIncidents]     = useState([]);
  const [userLoc, setUserLoc]         = useState(null);
  const [locError, setLocError]       = useState(null);
  const [locLoading, setLocLoading]   = useState(true);
  const [nearbyPotholes, setNearby]   = useState([]);
  const [selectedIncident, setSelected] = useState(null);

  const mapContainer = useRef(null);
  const map          = useRef(null);
  const markers      = useRef([]);
  const userMarker   = useRef(null);
  const watchId      = useRef(null);

  /* ── Load incidents ── */
  useEffect(() => {
    setTimeout(() => setIncidents(BASE_INCIDENTS), 600);
  }, []);

  /* ── Live geolocation ── */
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setLocError('Geolocation not supported by your browser.');
      setLocLoading(false);
      // Fallback to Bangalore city centre
      setUserLoc({ lat: 12.9716, lng: 77.5946 });
      return;
    }
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocLoading(false);
        setLocError(null);
      },
      (err) => {
        console.warn('Geolocation error:', err.message);
        setLocError('Location access denied – showing Bangalore city centre.');
        setLocLoading(false);
        // Fallback
        setUserLoc({ lat: 12.9716, lng: 77.5946 });
      },
      { enableHighAccuracy: true, maximumAge: 15000, timeout: 10000 }
    );
    return () => navigator.geolocation.clearWatch(watchId.current);
  }, []);

  useEffect(() => {
    const cleanup = startTracking();
    return cleanup;
  }, [startTracking]);

  /* ── Recalculate nearby potholes when userLoc or incidents change ── */
  useEffect(() => {
    if (!userLoc || incidents.length === 0) return;
    const potholes = incidents
      .filter(i => i.type === 'pothole')
      .map(i => ({ ...i, distKm: getDistanceKm(userLoc.lat, userLoc.lng, i.location.lat, i.location.lng) }))
      .sort((a, b) => a.distKm - b.distKm);
    setNearby(potholes);
  }, [userLoc, incidents]);

  /* ── Initialise map once userLoc is known ── */
  useEffect(() => {
    if (!userLoc || map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          },
        },
        layers: [{ id: 'osm', type: 'raster', source: 'osm', minzoom: 0, maxzoom: 19 }],
      },
      center: [userLoc.lng, userLoc.lat],
      zoom: 14,
      attributionControl: false,
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'bottom-right');
    map.current.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-left');

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [userLoc]);

  /* ── "You are here" pulsing marker ── */
  useEffect(() => {
    if (!map.current || !userLoc) return;

    userMarker.current?.remove();

    const el = document.createElement('div');
    el.innerHTML = `
      <div style="position:relative;width:24px;height:24px;">
        <div style="position:absolute;inset:-10px;background:#0070f3;opacity:0.25;border-radius:50%;animation:ripple 2s infinite;"></div>
        <div style="position:absolute;inset:-5px;background:#0070f3;opacity:0.15;border-radius:50%;animation:ripple 2s infinite 0.4s;"></div>
        <div style="width:24px;height:24px;background:#0070f3;border:3px solid white;border-radius:50%;box-shadow:0 0 12px rgba(0,112,243,0.7);"></div>
      </div>`;

    userMarker.current = new maplibregl.Marker({ element: el })
      .setLngLat([userLoc.lng, userLoc.lat])
      .setPopup(
        new maplibregl.Popup({ offset: 20 }).setHTML(
          `<div style="padding:10px;font-family:sans-serif;font-size:13px;font-weight:bold;color:#0070f3;">📍 Your Location</div>`
        )
      )
      .addTo(map.current);

    // Fly to user location smoothly
    map.current.flyTo({ center: [userLoc.lng, userLoc.lat], zoom: 14, speed: 1.2 });
  }, [userLoc]);

  /* ── Filtered incidents ── */
  const filtered = activeTab === 'all' ? incidents : incidents.filter(i => i.type === activeTab);

  /* ── Incident markers ── */
  useEffect(() => {
    if (!map.current) return;
    markers.current.forEach(m => m.remove());
    markers.current = [];

    filtered.forEach(incident => {
      const color = COLOR[incident.type] || '#94a3b8';
      const isPothole = incident.type === 'pothole';
      const isSos = incident.type === 'sos';

      const el = document.createElement('div');
      el.style.cssText = 'cursor:pointer;position:relative;';
      el.innerHTML = `
        <div style="position:relative;">
          ${isSos || isPothole ? `<div style="position:absolute;inset:-8px;background:${color};opacity:0.25;border-radius:50%;width:28px;height:28px;animation:pulse 2s infinite;"></div>` : ''}
          <div style="width:14px;height:14px;background:${color};border:2.5px solid white;border-radius:50%;box-shadow:0 0 8px ${color};"></div>
        </div>`;

      const distText = userLoc
        ? `<div style="margin-top:6px;font-size:10px;color:#64748b;">${formatDist(getDistanceKm(userLoc.lat, userLoc.lng, incident.location.lat, incident.location.lng))} from you</div>`
        : '';

      const m = new maplibregl.Marker({ element: el })
        .setLngLat([incident.location.lng, incident.location.lat])
        .setPopup(
          new maplibregl.Popup({ offset: 20, maxWidth: '220px' }).setHTML(`
            <div style="padding:12px;font-family:sans-serif;">
              <div style="font-weight:800;font-size:13px;color:#1e293b;margin-bottom:4px;">${incident.title}</div>
              <div style="font-size:11px;color:#64748b;margin-bottom:2px;">📍 ${incident.location.address}</div>
              ${incident.severity ? `<div style="font-size:10px;font-weight:700;color:${color};text-transform:uppercase;margin-bottom:4px;">${incident.severity} severity</div>` : ''}
              ${distText}
              <div style="font-size:10px;font-weight:700;color:${color};text-transform:uppercase;margin-top:6px;border-top:1px solid #f1f5f9;padding-top:6px;">${incident.type}</div>
            </div>`)
        )
        .addTo(map.current);

      el.addEventListener('click', () => setSelected(incident));
      markers.current.push(m);
    });
  }, [filtered, userLoc]);

  /* ── Centre on user ── */
  const recentre = () => {
    if (!map.current || !userLoc) return;
    map.current.flyTo({ center: [userLoc.lng, userLoc.lat], zoom: 14, speed: 1.4 });
  };

  const severityColor = (s) => {
    if (s === 'Critical') return 'text-danger border-danger/30 bg-danger/10';
    if (s === 'High')     return 'text-orange border-orange/30 bg-orange/10';
    return 'text-warning border-warning/30 bg-warning/10';
  };

  /* ── Loading ── */
  if (locLoading) return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] bg-slate-950 gap-5">
      <div className="relative">
        <div className="w-16 h-16 border-2 border-primary/40 rounded-full animate-spin border-t-primary" />
        <LocateFixed className="w-7 h-7 text-primary absolute inset-0 m-auto animate-pulse" />
      </div>
      <div className="text-center">
        <p className="text-white font-bold">Acquiring Your Location…</p>
        <p className="text-slate-400 text-sm mt-1">Please allow location access when prompted</p>
      </div>
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-slate-950">
      <style>{`
        @keyframes pulse { 0%,100%{transform:scale(1);opacity:.4} 50%{transform:scale(1.6);opacity:0} }
        @keyframes ripple { 0%{transform:scale(0.8);opacity:.6} 100%{transform:scale(2.2);opacity:0} }
        .maplibregl-popup-content { border-radius:14px!important;padding:0!important;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,.15); }
        .maplibregl-popup-close-button { padding:6px 10px!important;color:#94a3b8!important;font-size:16px!important; }
      `}</style>

      {/* ──────────── Left Sidebar ──────────── */}
      <div className="w-80 xl:w-96 glass-morphism border-r border-slate-200 dark:border-slate-800 flex flex-col z-20 relative overflow-hidden hidden lg:flex">

        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <Navigation className="w-5 h-5 text-primary" /> City Pulse
            </h2>
            <button
              onClick={recentre}
              className="p-2 bg-primary/10 hover:bg-primary/20 rounded-xl text-primary transition-all active:scale-90"
              title="Center on my location"
            >
              <LocateFixed className="w-4 h-4" />
            </button>
          </div>
          {locError
            ? <p className="text-[10px] text-orange font-medium">{locError}</p>
            : userLoc && (
              <p className="text-[10px] text-slate-400 font-medium">
                Live GPS · {userLoc.lat.toFixed(5)}, {userLoc.lng.toFixed(5)}
              </p>
            )
          }
        </div>

        {/* Stats */}
        <div className="p-4 grid grid-cols-2 gap-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
          {[
            { label: 'Total', val: incidents.length, color: 'text-primary', bg: 'bg-primary/10' },
            { label: 'Active SOS', val: incidents.filter(i => i.type === 'sos').length.toString().padStart(2,'0'), color: 'text-danger', bg: 'bg-danger/10' },
            { label: 'Potholes', val: incidents.filter(i => i.type === 'pothole').length, color: 'text-warning', bg: 'bg-warning/10' },
            { label: 'Violations', val: incidents.filter(i => i.type === 'violation').length, color: 'text-primary', bg: 'bg-primary/5' },
          ].map((s, i) => (
            <div key={i} className={`${s.bg} rounded-xl p-3 border border-white/5`}>
              <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">{s.label}</div>
              <div className={`text-2xl font-black ${s.color}`}>{s.val}</div>
            </div>
          ))}
        </div>

        {/* ── Nearby Potholes ── */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 pt-4 pb-2">
            <div className="flex items-center gap-2 mb-3">
              <TriangleAlert className="w-4 h-4 text-warning" />
              <h3 className="text-[11px] font-black text-slate-300 uppercase tracking-widest">Nearby Potholes</h3>
              <span className="ml-auto text-[9px] font-bold text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                {nearbyPotholes.length} found
              </span>
            </div>
            <AnimatePresence>
              {nearbyPotholes.length === 0 && (
                <div className="text-center py-8 text-slate-600 text-xs">No potholes in database yet.</div>
              )}
              {nearbyPotholes.map((p, idx) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.06 }}
                  onClick={() => {
                    setSelected(p);
                    map.current?.flyTo({ center: [p.location.lng, p.location.lat], zoom: 16, speed: 1.2 });
                  }}
                  className={`mb-2 p-3.5 rounded-xl border cursor-pointer transition-all hover:scale-[1.02] group ${
                    selectedIncident?.id === p.id
                      ? 'bg-warning/10 border-warning/30'
                      : 'bg-white/5 dark:bg-slate-900/50 border-white/5 hover:border-warning/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Distance badge */}
                    <div className="shrink-0 text-center">
                      <div className="text-lg font-black text-warning leading-none">
                        {p.distKm < 1 ? Math.round(p.distKm * 1000) : p.distKm.toFixed(1)}
                      </div>
                      <div className="text-[8px] text-slate-500 font-bold uppercase">
                        {p.distKm < 1 ? 'm' : 'km'}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-200 text-xs truncate">{p.title}</p>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">{p.location.address}</p>
                      <div className="flex items-center gap-1.5 mt-2">
                        {p.severity && (
                          <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border ${severityColor(p.severity)}`}>
                            {p.severity}
                          </span>
                        )}
                        <span className="text-[9px] text-slate-500">
                          {new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Activity log */}
          <div className="px-4 pb-4 pt-2 border-t border-slate-800/50 mt-2">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-primary animate-pulse" /> Live Activity
            </h3>
            <div className="space-y-2">
              {incidents.slice(0, 5).map((inc, idx) => {
                const col = inc.type === 'sos' ? 'bg-danger' : inc.type === 'pothole' ? 'bg-warning' : 'bg-primary';
                return (
                  <motion.div
                    key={inc.id}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.08 }}
                    onClick={() => {
                      setSelected(inc);
                      map.current?.flyTo({ center: [inc.location.lng, inc.location.lat], zoom: 16 });
                    }}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer border border-white/5 transition-all"
                  >
                    <div className={`w-2 h-2 rounded-full shrink-0 ${col} ${inc.type === 'sos' ? 'animate-pulse' : ''}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-200 text-xs truncate">{inc.title}</p>
                      <p className="text-[9px] text-slate-500 truncate">{inc.location.address}</p>
                    </div>
                    {userLoc && (
                      <span className="text-[9px] text-slate-500 shrink-0">
                        {formatDist(getDistanceKm(userLoc.lat, userLoc.lng, inc.location.lat, inc.location.lng))}
                      </span>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ──────────── Map Area ──────────── */}
      <div className="flex-1 relative bg-slate-950">
        {/* OSM Map */}
        <div ref={mapContainer} className="absolute inset-0" />

        {/* Gradient overlay */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-slate-950/30 via-transparent to-transparent" />

        {/* Filter tabs */}
        <div className="absolute top-4 left-4 z-20 flex gap-1 p-1 glass-morphism bg-white/10 dark:bg-slate-900/60 rounded-2xl shadow-2xl border border-white/10 backdrop-blur-xl">
          {['all', 'pothole', 'violation', 'sos'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === tab
                  ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-105'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              {tab === 'all' ? '⬤ All' : tab === 'pothole' ? '⚠️ Potholes' : tab === 'violation' ? '🚔 Violations' : '🆘 SOS'}
            </button>
          ))}
        </div>

        {/* Top-right controls */}
        <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
          <button
            onClick={recentre}
            title="Go to my location"
            className="p-3.5 glass-morphism bg-white/10 dark:bg-slate-900/60 rounded-2xl shadow-xl text-white hover:text-primary transition-all border border-white/10 backdrop-blur-xl hover:scale-110 active:scale-90"
          >
            <LocateFixed className="w-5 h-5" />
          </button>
          <button className="p-3.5 glass-morphism bg-white/10 dark:bg-slate-900/60 rounded-2xl shadow-xl text-white hover:text-primary transition-all border border-white/10 backdrop-blur-xl hover:scale-110">
            <Layers className="w-5 h-5" />
          </button>
        </div>

        {/* Location error banner */}
        {locError && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 px-4 py-2.5 bg-orange/90 text-white text-xs font-bold rounded-xl shadow-xl flex items-center gap-2 backdrop-blur-sm max-w-xs text-center">
            <AlertTriangle className="w-4 h-4 shrink-0" /> {locError}
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-20 lg:bottom-6 right-4 lg:right-24 z-20 glass-morphism bg-slate-900/80 backdrop-blur-2xl p-4 rounded-2xl border border-white/10 shadow-2xl">
          <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">Map Legend</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded-full bg-primary shadow-[0_0_8px_rgba(0,112,243,0.8)]" />
              <span className="text-[10px] font-bold text-slate-300">Violations</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded-full bg-warning shadow-[0_0_8px_rgba(234,179,8,0.8)] animate-pulse" />
              <span className="text-[10px] font-bold text-slate-300">Potholes</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded-full bg-danger shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse" />
              <span className="text-[10px] font-bold text-slate-300">SOS / Emergency</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded-full bg-primary border-2 border-white" />
              <span className="text-[10px] font-bold text-slate-300">Your Location</span>
            </div>
          </div>
        </div>

        {/* Selected incident popup card */}
        <AnimatePresence>
          {selectedIncident && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-24 lg:bottom-8 left-4 z-30 w-72 glass-morphism bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-4"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-2 h-2 rounded-full`} style={{ background: COLOR[selectedIncident.type] }} />
                    <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: COLOR[selectedIncident.type] }}>
                      {selectedIncident.type}
                    </span>
                  </div>
                  <p className="font-black text-white text-sm">{selectedIncident.title}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{selectedIncident.location.address}</p>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="p-1.5 bg-white/10 rounded-xl text-slate-400 hover:text-white transition-colors shrink-0"
                >✕</button>
              </div>
              {userLoc && (
                <div className="flex items-center gap-2 p-2.5 bg-white/5 rounded-xl border border-white/5">
                  <MapPin className="w-4 h-4 text-primary shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold text-white">
                      {formatDist(getDistanceKm(userLoc.lat, userLoc.lng, selectedIncident.location.lat, selectedIncident.location.lng))} from your location
                    </p>
                    <p className="text-[9px] text-slate-500">
                      {selectedIncident.location.lat.toFixed(5)}, {selectedIncident.location.lng.toFixed(5)}
                    </p>
                  </div>
                </div>
              )}
              {selectedIncident.severity && (
                <div className={`mt-2 text-center py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${severityColor(selectedIncident.severity)}`}>
                  {selectedIncident.severity} Severity
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Dashboard;
