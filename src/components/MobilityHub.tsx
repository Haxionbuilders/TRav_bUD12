import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDownUp, ArrowRight, Bike, Clock3, Container, MapPin, Navigation, Plane, Search, ShieldCheck, Ticket, Users, Wallet } from 'lucide-react';

type Place = { name: string; lat: number; lon: number; label: string };
type Mode = 'auto' | 'comfort' | 'shared';
type Tab = 'journey' | 'hire' | 'cargo' | 'pass';
type RouteInfo = { distanceKm: number; durationMin: number; geometry: [number, number][] };

declare global { interface Window { L?: any } }

const sampleDrivers = [
  { name: 'Arun K.', route: 'Kochi → Thrissur', seats: 3, distance: '2.4 km away', fare: 180, type: 'Return trip' },
  { name: 'Nikhil R.', route: 'Kochi → Alappuzha', seats: 2, distance: '4.1 km away', fare: 240, type: 'Shared ride' },
  { name: 'Meera S.', route: 'Kochi → Kottayam', seats: 4, distance: '5.8 km away', fare: 320, type: 'Group-friendly' },
];
const cargoOptions = [
  { type: 'Light cargo', vehicle: 'Pickup van', route: 'Kochi → Kozhikode', capacity: 'Up to 750 kg', price: 1650 },
  { type: 'Medium cargo', vehicle: 'Mini truck', route: 'Kochi → Thrissur', capacity: 'Up to 2 tonnes', price: 950 },
  { type: 'Heavy cargo', vehicle: 'Freight lorry', route: 'Bengaluru → Kochi', capacity: 'Up to 9 tonnes', price: 6200 },
];

function loadLeaflet(): Promise<any> {
  if (window.L) return Promise.resolve(window.L);
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-travbud-leaflet]');
    const finish = () => window.L ? resolve(window.L) : reject(new Error('Map library did not load. Check your internet connection.'));
    if (existing) { existing.addEventListener('load', finish, { once: true }); existing.addEventListener('error', () => reject(new Error('Map library failed to load.')), { once: true }); return; }
    if (!document.querySelector('link[data-travbud-leaflet]')) {
      const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'; css.dataset.travbudLeaflet = 'true'; document.head.appendChild(css);
    }
    const script = document.createElement('script'); script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'; script.async = true; script.dataset.travbudLeaflet = 'true'; script.onload = finish; script.onerror = () => reject(new Error('Map library failed to load.')); document.body.appendChild(script);
  });
}
function placeLabel(p: any): string {
  const a = p.properties || {};
  return [a.name, a.street, a.city || a.town || a.village, a.state, a.country].filter((v, i, arr) => v && arr.indexOf(v) === i).join(', ');
}

export default function MobilityHub() {
  const mapNode = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const routeLayerRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [tab, setTab] = useState<Tab>('journey');
  const [fromQuery, setFromQuery] = useState('Kochi, Kerala');
  const [toQuery, setToQuery] = useState('Thrissur, Kerala');
  const [fromResults, setFromResults] = useState<Place[]>([]);
  const [toResults, setToResults] = useState<Place[]>([]);
  const [from, setFrom] = useState<Place | null>(null);
  const [to, setTo] = useState<Place | null>(null);
  const [searching, setSearching] = useState<'from' | 'to' | null>(null);
  const [route, setRoute] = useState<RouteInfo | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState('');
  const [mode, setMode] = useState<Mode>('auto');
  const [tier, setTier] = useState('Corridor-Express');
  const [includePickup, setIncludePickup] = useState(true);
  const [includeLongDistance, setIncludeLongDistance] = useState(true);
  const [includeDrop, setIncludeDrop] = useState(true);
  const [pass, setPass] = useState<{ code: string; fare: number; from: string; to: string; tier: string } | null>(null);
  const [notice, setNotice] = useState('');
  const [cargoFilter, setCargoFilter] = useState('All');

  useEffect(() => {
    let alive = true;
    loadLeaflet().then((L) => {
      if (!alive || !mapNode.current || mapRef.current) return;
      const map = L.map(mapNode.current, { zoomControl: true }).setView([10.2, 76.3], 7);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }).addTo(map);
      mapRef.current = map;
      setTimeout(() => map.invalidateSize(), 150);
    }).catch((e) => { if (alive) setRouteError(e.message); });
    return () => { alive = false; if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, []);

  const searchPlaces = async (side: 'from' | 'to') => {
    const query = side === 'from' ? fromQuery.trim() : toQuery.trim();
    if (query.length < 3) { setNotice('Enter at least 3 characters to search for a place.'); return; }
    setSearching(side); setNotice('');
    try {
      // Photon is queried only after the user submits the search; this is not keystroke autocomplete.
      const response = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5&lang=en`);
      if (!response.ok) throw new Error('Place search is temporarily unavailable. Try again.');
      const data = await response.json();
      const places: Place[] = (data.features || []).map((feature: any) => ({ name: feature.properties?.name || feature.properties?.city || query, lat: feature.geometry.coordinates[1], lon: feature.geometry.coordinates[0], label: placeLabel(feature) || query }));
      if (side === 'from') setFromResults(places); else setToResults(places);
      if (!places.length) setNotice('No matching places found. Try a nearby town or landmark.');
    } catch (e) { setNotice(e instanceof Error ? e.message : 'Place search failed.'); }
    finally { setSearching(null); }
  };

  const choosePlace = (side: 'from' | 'to', place: Place) => {
    if (side === 'from') { setFrom(place); setFromQuery(place.label); setFromResults([]); }
    else { setTo(place); setToQuery(place.label); setToResults([]); }
    setRoute(null); setPass(null); setRouteError('');
    if (mapRef.current) mapRef.current.setView([place.lat, place.lon], 11);
  };

  const calculateRoute = async () => {
    if (!from || !to) { setNotice('Search for and select both a pickup and destination first.'); return; }
    setRouteLoading(true); setRouteError(''); setNotice('');
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${from.lon},${from.lat};${to.lon},${to.lat}?overview=full&geometries=geojson`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Routing service is unavailable right now.');
      const data = await response.json();
      if (data.code !== 'Ok' || !data.routes?.[0]) throw new Error('No drivable route was found for those locations.');
      const r = data.routes[0];
      const next: RouteInfo = { distanceKm: r.distance / 1000, durationMin: r.duration / 60, geometry: r.geometry.coordinates.map((c: number[]) => [c[1], c[0]] as [number, number]) };
      setRoute(next);
      if (mapRef.current && window.L) {
        markersRef.current.forEach((m) => m.remove()); markersRef.current = [];
        if (routeLayerRef.current) routeLayerRef.current.remove();
        markersRef.current.push(window.L.marker([from.lat, from.lon]).addTo(mapRef.current).bindPopup('Pickup'));
        markersRef.current.push(window.L.marker([to.lat, to.lon]).addTo(mapRef.current).bindPopup('Destination'));
        routeLayerRef.current = window.L.polyline(next.geometry, { color: '#2563eb', weight: 5, opacity: 0.85 }).addTo(mapRef.current);
        mapRef.current.fitBounds(routeLayerRef.current.getBounds(), { padding: [28, 28] });
      }
    } catch (e) { setRouteError(e instanceof Error ? e.message : 'Could not calculate route.'); }
    finally { setRouteLoading(false); }
  };

  const fare = useMemo(() => {
    if (!route) return null;
    const base = mode === 'shared' ? 25 : mode === 'comfort' ? 95 : 55;
    const perKm = mode === 'shared' ? 7 : mode === 'comfort' ? 17 : 11;
    const perMin = mode === 'comfort' ? 1.8 : 0.7;
    const roadFare = Math.max(base, base + route.distanceKm * perKm + route.durationMin * perMin);
    const pickup = includePickup ? Math.max(40, route.distanceKm * 2.2) : 0;
    const longDistance = includeLongDistance ? Math.max(0, route.distanceKm * (tier === 'Aero-Executive' ? 8 : tier === 'Civic-Essential' ? 2.8 : 4.5)) : 0;
    const drop = includeDrop ? Math.max(40, route.distanceKm * 1.8) : 0;
    const subtotal = roadFare + pickup + longDistance + drop;
    const platformFee = subtotal * 0.04;
    return { base, roadFare, pickup, longDistance, drop, platformFee, total: Math.round(subtotal + platformFee), distanceKm: route.distanceKm, durationMin: route.durationMin };
  }, [route, mode, tier, includePickup, includeLongDistance, includeDrop]);

  const confirmPrototype = () => {
    if (!from || !to || !fare) { setNotice('Calculate a route before creating a NUMob pass.'); return; }
    const code = `TB-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    setPass({ code, fare: fare.total, from: from.label, to: to.label, tier }); setTab('pass'); setNotice('Prototype pass generated. No real vehicle, ticket or payment has been booked.');
  };

  const tabs: { id: Tab; label: string; icon: typeof Navigation }[] = [
    { id: 'journey', label: 'Plan a journey', icon: Navigation }, { id: 'hire', label: 'Hire a Bud', icon: Users }, { id: 'cargo', label: 'Radar Cargo', icon: Container }, { id: 'pass', label: 'NUMob Pass', icon: Ticket },
  ];

  return <div className="space-y-6 pb-8">
    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
      <div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Unified mobility ecosystem</p><h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mt-2">Your journey, connected.</h1><p className="text-slate-600 dark:text-slate-300 mt-2 max-w-2xl">Plan door-to-door travel, estimate a combined fare, match return rides, and preview a single TravBud pass.</p></div>
      <div className="flex items-center gap-2 rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200 px-3 py-2 text-sm"><ShieldCheck className="w-4 h-4"/> Prototype mode</div>
    </div>
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-2">{tabs.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => setTab(id)} className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition ${tab === id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'glass text-slate-700 dark:text-slate-200 hover:bg-white/70'}`}><Icon className="w-4 h-4"/>{label}</button>)}</div>

    {tab === 'journey' && <div className="grid xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] gap-5 items-start">
      <div className="space-y-4">
        <section className="glass-strong p-5 md:p-6 space-y-4">
          <div className="flex items-center justify-between"><h2 className="text-xl font-bold text-slate-900 dark:text-white">Where are you going?</h2><span className="text-xs text-slate-500">Map search</span></div>
          <div className="grid md:grid-cols-[1fr_auto_1fr] gap-3 items-center">
            <div className="space-y-2"><label className="text-sm font-medium text-slate-600 dark:text-slate-300">Pickup</label><div className="flex gap-2"><input value={fromQuery} onChange={e => { setFromQuery(e.target.value); setFrom(null); }} onKeyDown={e => { if (e.key === 'Enter') void searchPlaces('from'); }} placeholder="Search pickup" className="glass-input min-w-0 w-full px-3 py-3 text-sm"/><button onClick={() => void searchPlaces('from')} disabled={searching !== null} aria-label="Search pickup" className="bg-slate-900 dark:bg-slate-100 dark:text-slate-900 text-white rounded-xl px-3"><Search className="w-4 h-4"/></button></div>{from && <p className="text-xs text-emerald-700 dark:text-emerald-300 flex gap-1"><MapPin className="w-3 h-3"/>{from.label}</p>}{fromResults.length > 0 && <div className="space-y-1">{fromResults.map((p, i) => <button key={`${p.lat}-${i}`} onClick={() => choosePlace('from', p)} className="w-full text-left rounded-lg bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 p-2 text-xs hover:border-blue-500">{p.label}</button>)}</div>}</div>
            <button title="Swap pickup and destination" onClick={() => { const oldFrom = from, oldTo = to, oldFQ = fromQuery, oldTQ = toQuery; setFrom(oldTo); setTo(oldFrom); setFromQuery(oldTQ); setToQuery(oldFQ); setRoute(null); }} className="justify-self-center mt-5 p-2 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-slate-800"><ArrowDownUp className="w-4 h-4"/></button>
            <div className="space-y-2"><label className="text-sm font-medium text-slate-600 dark:text-slate-300">Destination</label><div className="flex gap-2"><input value={toQuery} onChange={e => { setToQuery(e.target.value); setTo(null); }} onKeyDown={e => { if (e.key === 'Enter') void searchPlaces('to'); }} placeholder="Search destination" className="glass-input min-w-0 w-full px-3 py-3 text-sm"/><button onClick={() => void searchPlaces('to')} disabled={searching !== null} aria-label="Search destination" className="bg-slate-900 dark:bg-slate-100 dark:text-slate-900 text-white rounded-xl px-3"><Search className="w-4 h-4"/></button></div>{to && <p className="text-xs text-emerald-700 dark:text-emerald-300 flex gap-1"><MapPin className="w-3 h-3"/>{to.label}</p>}{toResults.length > 0 && <div className="space-y-1">{toResults.map((p, i) => <button key={`${p.lat}-${i}`} onClick={() => choosePlace('to', p)} className="w-full text-left rounded-lg bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 p-2 text-xs hover:border-blue-500">{p.label}</button>)}</div>}</div>
          </div>
          <button onClick={() => void calculateRoute()} disabled={routeLoading} className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl px-4 py-3 font-semibold flex justify-center items-center gap-2">{routeLoading ? 'Calculating road route…' : 'Find route & estimate fare'}<ArrowRight className="w-4 h-4"/></button>
          <p className="text-xs text-slate-500">Place search runs when you press Search, not on every keystroke. Route and search availability depends on community-run services.</p>
          {notice && <p className="text-sm text-blue-700 dark:text-blue-300">{notice}</p>}{routeError && <p className="text-sm text-amber-700 dark:text-amber-300">{routeError}</p>}
        </section>
        <section className="glass-strong p-3"><div ref={mapNode} className="w-full h-[340px] rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-800"/><p className="text-xs text-slate-500 px-2 pt-3">Map data © OpenStreetMap contributors. Road route from OSRM. Estimated routes may differ from real-world traffic.</p></section>
      </div>
      <div className="space-y-4">
        <section className="glass-strong p-5 space-y-4"><div><h2 className="text-xl font-bold text-slate-900 dark:text-white">Choose your travel style</h2><p className="text-sm text-slate-500 mt-1">Illustrative prices for the prototype</p></div>
          <div className="grid grid-cols-3 gap-2">{([{id:'shared',label:'Shared',icon:Users},{id:'auto',label:'Standard',icon:Bike},{id:'comfort',label:'Comfort',icon:Plane}] as const).map(({id,label,icon:Icon}) => <button key={id} onClick={() => setMode(id)} className={`rounded-xl border p-3 text-center ${mode === id ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40' : 'border-slate-200 dark:border-slate-700'}`}><Icon className="w-5 h-5 mx-auto mb-2"/><span className="text-xs font-semibold">{label}</span></button>)}</div>
          <div className="space-y-2"><label className="text-sm font-semibold">Unified ticket tier</label><select value={tier} onChange={e => setTier(e.target.value)} className="glass-input w-full p-3 text-sm"><option>Aero-Executive</option><option>Corridor-Express</option><option>Civic-Essential</option><option>Global Premier</option><option>Global Transit</option></select></div>
          <div className="space-y-3 text-sm"><label className="flex items-center gap-3"><input type="checkbox" checked={includePickup} onChange={e => setIncludePickup(e.target.checked)} className="accent-blue-600"/><span className="flex-1">Home pickup / first mile</span><span className="text-slate-500">Optional</span></label><label className="flex items-center gap-3"><input type="checkbox" checked={includeLongDistance} onChange={e => setIncludeLongDistance(e.target.checked)} className="accent-blue-600"/><span className="flex-1">Long-distance segment</span><span className="text-slate-500">Estimated</span></label><label className="flex items-center gap-3"><input type="checkbox" checked={includeDrop} onChange={e => setIncludeDrop(e.target.checked)} className="accent-blue-600"/><span className="flex-1">Destination drop-off</span><span className="text-slate-500">Optional</span></label></div>
        </section>
        <section className="bg-slate-950 text-white rounded-2xl p-5 shadow-xl"><div className="flex items-center justify-between"><p className="text-sm text-slate-300">Estimated total</p><Wallet className="w-5 h-5 text-cyan-300"/></div><div className="text-4xl font-bold mt-2">{fare ? `₹${fare.total.toLocaleString('en-IN')}` : '₹—'}</div><p className="text-xs text-slate-400 mt-2">{fare ? `${fare.distanceKm.toFixed(1)} km · about ${Math.round(fare.durationMin)} min driving` : 'Select locations and calculate a route first'}</p>{fare && <div className="border-t border-white/15 mt-4 pt-3 space-y-2 text-sm"><div className="flex justify-between"><span className="text-slate-300">Road transport</span><span>₹{Math.round(fare.roadFare)}</span></div>{includePickup && <div className="flex justify-between"><span className="text-slate-300">Home pickup</span><span>₹{Math.round(fare.pickup)}</span></div>}{includeLongDistance && <div className="flex justify-between"><span className="text-slate-300">Long-distance segment</span><span>₹{Math.round(fare.longDistance)}</span></div>}{includeDrop && <div className="flex justify-between"><span className="text-slate-300">Destination drop</span><span>₹{Math.round(fare.drop)}</span></div>}<div className="flex justify-between"><span className="text-slate-300">Illustrative 4% platform fee</span><span>₹{Math.round(fare.platformFee)}</span></div><div className="flex justify-between border-t border-white/15 pt-3 font-bold"><span>Total estimate</span><span>₹{fare.total.toLocaleString('en-IN')}</span></div></div>}<button onClick={confirmPrototype} disabled={!fare} className="w-full mt-5 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 text-slate-950 rounded-xl py-3 font-bold">Create NUMob pass</button><p className="text-[11px] leading-4 text-slate-400 mt-3">Demo calculation only. This is not an operator quote, live availability check, confirmed ticket or payment request.</p></section>
        {route && <div className="glass p-4 flex gap-3"><Clock3 className="w-5 h-5 text-blue-600 shrink-0"/><div><p className="font-semibold text-slate-800 dark:text-white">Route calculated</p><p className="text-sm text-slate-500">The road route is used for the estimate. Train, bus and flight fares are illustrative and need real operator integrations.</p></div></div>}
      </div>
    </div>}

    {tab === 'hire' && <section className="space-y-4"><div className="glass-strong p-5"><h2 className="text-2xl font-bold text-slate-900 dark:text-white">Hire a Bud</h2><p className="text-slate-500 mt-1">Prototype return-trip matching for solo riders, groups and shared travel.</p><div className="grid sm:grid-cols-3 gap-3 mt-5">{[{label:'Single rider',icon:Bike},{label:'Group travel',icon:Users},{label:'Flexible return',icon:ArrowDownUp}].map(({label,icon:Icon}) => <button key={label} onClick={() => setNotice(`${label} selected. Driver listings below are simulated prototype data.`)} className="glass-card p-4 flex items-center gap-3 text-left"><Icon className="w-5 h-5 text-blue-600"/><span className="font-semibold text-slate-800 dark:text-white">{label}</span></button>)}</div></div><div className="grid md:grid-cols-3 gap-4">{sampleDrivers.map((driver) => <article key={driver.name} className="glass-card p-5"><div className="flex justify-between items-start"><div className="rounded-xl bg-blue-100 dark:bg-blue-900/40 p-3"><Bike className="w-6 h-6 text-blue-700 dark:text-blue-300"/></div><span className="text-xs rounded-full bg-emerald-100 text-emerald-800 px-2 py-1">{driver.type}</span></div><h3 className="font-bold text-lg mt-4 text-slate-900 dark:text-white">{driver.name}</h3><p className="text-sm mt-1 text-slate-600 dark:text-slate-300">{driver.route}</p><div className="flex justify-between text-sm mt-4"><span className="text-slate-500">{driver.distance}</span><span>{driver.seats} seats</span></div><div className="flex items-center justify-between border-t border-slate-200/70 dark:border-slate-700 mt-4 pt-4"><span className="text-xl font-bold">₹{driver.fare}</span><button onClick={() => setNotice(`${driver.name} selected. This is a mock driver; no ride request was sent.`)} className="rounded-lg bg-blue-600 text-white px-3 py-2 text-sm font-semibold">Choose Bud</button></div></article>)}</div><p className="text-sm text-amber-700 dark:text-amber-300">Demo listings only: these are not verified drivers or live nearby vehicles. Real matching requires driver accounts, location permissions, availability and safety checks.</p>{notice && <p className="text-sm text-blue-700 dark:text-blue-300">{notice}</p>}</section>}

    {tab === 'cargo' && <section className="space-y-4"><div className="glass-strong p-5"><h2 className="text-2xl font-bold text-slate-900 dark:text-white">Radar Cargo</h2><p className="text-slate-500 mt-1">Match freight with vehicles that may be returning empty. Rates and capacities are sample data.</p><div className="flex flex-wrap gap-2 mt-4">{['All','Light cargo','Medium cargo','Heavy cargo'].map(f => <button key={f} onClick={() => setCargoFilter(f)} className={`rounded-full px-4 py-2 text-sm font-semibold ${cargoFilter === f ? 'bg-blue-600 text-white' : 'glass text-slate-700 dark:text-slate-200'}`}>{f}</button>)}</div></div><div className="grid md:grid-cols-3 gap-4">{cargoOptions.filter(c => cargoFilter === 'All' || c.type === cargoFilter).map(c => <article key={c.type} className="glass-card p-5"><div className="rounded-xl bg-amber-100 dark:bg-amber-900/30 p-3 w-fit"><Container className="w-6 h-6 text-amber-700 dark:text-amber-300"/></div><p className="text-xs uppercase tracking-wider text-slate-500 mt-4">{c.type}</p><h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">{c.vehicle}</h3><p className="text-sm text-slate-600 dark:text-slate-300 mt-2">{c.route}</p><p className="text-sm mt-3">Capacity: {c.capacity}</p><div className="flex justify-between items-center mt-5 pt-4 border-t border-slate-200/70 dark:border-slate-700"><span className="text-xl font-bold">₹{c.price.toLocaleString('en-IN')}</span><button onClick={() => setNotice(`${c.vehicle} selected for a sample cargo quote. No shipment is booked.`)} className="rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-3 py-2 text-sm font-semibold">Request quote</button></div></article>)}</div>{notice && <p className="text-sm text-blue-700 dark:text-blue-300">{notice}</p>}<p className="text-sm text-amber-700 dark:text-amber-300">Live cargo matching will require fleet partners, verified vehicle capacity, shipment details and backend matching logic.</p></section>}

    {tab === 'pass' && <section className="max-w-2xl mx-auto space-y-4">{pass ? <div className="bg-white text-slate-900 rounded-3xl overflow-hidden shadow-xl border border-slate-200"><div className="bg-gradient-to-r from-blue-700 to-cyan-600 text-white p-6"><div className="flex justify-between items-center"><div><p className="text-xs uppercase tracking-[0.2em] text-blue-100">TravBud unified mobility</p><h2 className="text-2xl font-bold mt-1">NUMob Slip</h2></div><Ticket className="w-9 h-9"/></div><p className="mt-5 text-sm text-blue-100">Prototype booking reference</p><p className="text-2xl font-mono font-bold tracking-wider">{pass.code}</p></div><div className="p-6 space-y-5"><div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center"><div><p className="text-xs text-slate-500">FROM</p><p className="font-semibold mt-1">{pass.from}</p></div><ArrowRight className="w-5 h-5 text-blue-600"/><div><p className="text-xs text-slate-500">TO</p><p className="font-semibold mt-1">{pass.to}</p></div></div><div className="grid grid-cols-2 gap-4 border-y border-dashed py-4"><div><p className="text-xs text-slate-500">Ticket tier</p><p className="font-semibold mt-1">{pass.tier}</p></div><div><p className="text-xs text-slate-500">Estimated total</p><p className="text-2xl font-bold mt-1">₹{pass.fare.toLocaleString('en-IN')}</p></div></div><div className="flex items-center gap-2 text-sm text-amber-800 bg-amber-50 rounded-xl p-3"><ShieldCheck className="w-5 h-5 shrink-0"/>Demo pass only — QR validation and real transport ticketing are not connected.</div><button onClick={() => { setPass(null); setTab('journey'); }} className="w-full rounded-xl bg-blue-600 text-white py-3 font-semibold">Plan another journey</button></div></div> : <div className="glass-strong p-8 text-center"><div className="mx-auto w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center"><Ticket className="w-7 h-7 text-blue-700 dark:text-blue-300"/></div><h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-4">Your NUMob pass</h2><p className="text-slate-500 mt-2">Calculate a route and choose “Create NUMob pass” to generate a sample unified ticket.</p><button onClick={() => setTab('journey')} className="mt-5 rounded-xl bg-blue-600 text-white px-5 py-3 font-semibold">Plan a journey</button></div>}</section>}
  </div>;
}
