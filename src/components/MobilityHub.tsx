import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDownUp, ArrowRight, Bike, CalendarDays, CheckCircle2, Clock3, Container, MapPin, Navigation, PackageCheck, Plane, Search, ShieldCheck, Ticket, Users, Wallet, Printer, RefreshCw, Truck, UserRound, Route as RouteIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

type Place = { name: string; lat: number; lon: number; label: string };
type RideMode = 'standard' | 'comfort' | 'shared';
type Tab = 'journey' | 'hire' | 'cargo' | 'pass' | 'bookings';
type RouteInfo = { distanceKm: number; durationMin: number; geometry: [number, number][] };
type TicketPass = { id?: string; code: string; fare: number; from: string; to: string; tier: string; date: string; passengers: number; children: number; infants: number; babySeat: boolean; mode: string; status: string };
type BookingRow = { id: string; booking_code: string; booking_type: string; origin: string; destination: string; total_fare: number; status: string; details: Record<string, unknown>; created_at: string };

declare global { interface Window { L?: any } }

const driverSamples = [
  { id: 'bud-101', name: 'Arun K.', route: 'Kochi → Thrissur', origin: 'Kochi', destination: 'Thrissur', seats: 3, distance: '2.4 km away', fare: 180, type: 'Return trip', vehicle: 'Hatchback', rating: '4.8' },
  { id: 'bud-102', name: 'Nikhil R.', route: 'Kochi → Alappuzha', origin: 'Kochi', destination: 'Alappuzha', seats: 2, distance: '4.1 km away', fare: 240, type: 'Shared ride', vehicle: 'Sedan', rating: '4.9' },
  { id: 'bud-103', name: 'Meera S.', route: 'Kochi → Kottayam', origin: 'Kochi', destination: 'Kottayam', seats: 4, distance: '5.8 km away', fare: 320, type: 'Group-friendly', vehicle: 'SUV', rating: '4.9' },
  { id: 'bud-104', name: 'Rahul P.', route: 'Thrissur → Kochi', origin: 'Thrissur', destination: 'Kochi', seats: 3, distance: '3.2 km away', fare: 160, type: 'Return trip', vehicle: 'Hatchback', rating: '4.7' },
];
const cargoSamples = [
  { id: 'cargo-1', type: 'Light cargo', vehicle: 'Pickup van', capacityKg: 750, route: 'Kochi → Kozhikode', origin: 'Kochi', destination: 'Kozhikode', price: 1650, available: 'Today · 2:30 PM' },
  { id: 'cargo-2', type: 'Medium cargo', vehicle: 'Mini truck', capacityKg: 2000, route: 'Kochi → Thrissur', origin: 'Kochi', destination: 'Thrissur', price: 950, available: 'Today · 4:00 PM' },
  { id: 'cargo-3', type: 'Heavy cargo', vehicle: 'Freight lorry', capacityKg: 9000, route: 'Bengaluru → Kochi', origin: 'Bengaluru', destination: 'Kochi', price: 6200, available: 'Tomorrow · 7:00 AM' },
  { id: 'cargo-4', type: 'Medium cargo', vehicle: 'Closed mini truck', capacityKg: 2500, route: 'Kozhikode → Kochi', origin: 'Kozhikode', destination: 'Kochi', price: 2100, available: 'Today · 6:15 PM' },
];
const tiers = [
  { name: 'Aero-Executive', detail: 'Premium transfers · high comfort', multiplier: 1.75 },
  { name: 'Corridor-Express', detail: 'Balanced comfort and price', multiplier: 1.0 },
  { name: 'Civic-Essential', detail: 'Budget-friendly shared connections', multiplier: 0.72 },
  { name: 'Global Premier', detail: 'International premium estimate', multiplier: 2.4 },
  { name: 'Global Transit', detail: 'International economy estimate', multiplier: 1.25 },
];

function loadLeaflet(): Promise<any> {
  if (window.L) return Promise.resolve(window.L);
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-travbud-leaflet]');
    const finish = () => window.L ? resolve(window.L) : reject(new Error('The map library did not load. Check your connection and reload.'));
    if (existing) { existing.addEventListener('load', finish, { once: true }); existing.addEventListener('error', () => reject(new Error('Map library failed to load.')), { once: true }); return; }
    if (!document.querySelector('link[data-travbud-leaflet]')) {
      const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'; css.dataset.travbudLeaflet = 'true'; document.head.appendChild(css);
    }
    const script = document.createElement('script'); script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'; script.async = true; script.dataset.travbudLeaflet = 'true'; script.onload = finish; script.onerror = () => reject(new Error('Map library failed to load.')); document.body.appendChild(script);
  });
}
function labelForFeature(feature: any): string {
  const p = feature.properties || {};
  const primary = p.name || p.street || p.city || p.town || p.village || p.county || 'Selected place';
  return [primary, p.city || p.town || p.village, p.state, p.country].filter((v, i, arr) => v && arr.indexOf(v) === i).join(', ');
}
function money(value: number) { return `₹${Math.round(value).toLocaleString('en-IN')}`; }
function makeCode(prefix = 'TB') { return `${prefix}-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`; }

export default function MobilityHub() {
  const { user } = useAuth();
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
  const [mapError, setMapError] = useState('');
  const [rideMode, setRideMode] = useState<RideMode>('standard');
  const [transportSelected, setTransportSelected] = useState(false);
  const [tier, setTier] = useState('Corridor-Express');
  const [passengers, setPassengers] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const babySeat = infants > 0;
  const [travelDate, setTravelDate] = useState(new Date(Date.now() + 86400000).toISOString().slice(0, 10));
  const [travelTime, setTravelTime] = useState('09:00');
  const [includePickup, setIncludePickup] = useState(true);
  const [includeLongDistance, setIncludeLongDistance] = useState(true);
  const [includeDrop, setIncludeDrop] = useState(true);
  const [activePass, setActivePass] = useState<TicketPass | null>(null);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [bookingRows, setBookingRows] = useState<BookingRow[]>([]);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [hireKind, setHireKind] = useState<'Single rider' | 'Group travel' | 'Flexible return'>('Single rider');
  const [hireSeats, setHireSeats] = useState(1);
  const [hireDestination, setHireDestination] = useState('');
  const [cargoFilter, setCargoFilter] = useState('All');
  const [cargoOrigin, setCargoOrigin] = useState('Kochi');
  const [cargoDestination, setCargoDestination] = useState('Thrissur');
  const [cargoWeight, setCargoWeight] = useState('350');
  const [cargoGoods, setCargoGoods] = useState('General goods');
  const [cargoDate, setCargoDate] = useState(new Date(Date.now() + 86400000).toISOString().slice(0, 10));
  const [lastCargoQuote, setLastCargoQuote] = useState<{ code: string; vehicle: string; fare: number; origin: string; destination: string; weight: number } | null>(null);

  const loadBookings = useCallback(async () => {
    if (!user) return;
    setBookingLoading(true);
    const { data, error } = await supabase.from('mobility_bookings').select('id, booking_code, booking_type, origin, destination, total_fare, status, details, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50);
    if (error) setNotice(`Could not load saved bookings: ${error.message}. Apply the mobility_bookings migration if you have not done so.`);
    else setBookingRows((data || []) as BookingRow[]);
    setBookingLoading(false);
  }, [user]);

  useEffect(() => {
    let alive = true;
    loadLeaflet().then((L) => {
      if (!alive || !mapNode.current || mapRef.current) return;
      const map = L.map(mapNode.current, { zoomControl: true }).setView([10.2, 76.3], 7);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }).addTo(map);
      mapRef.current = map;
      window.setTimeout(() => map.invalidateSize(), 150);
    }).catch((e) => { if (alive) setMapError(e instanceof Error ? e.message : 'Map failed to load.'); });
    return () => { alive = false; if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, []);

  useEffect(() => {
    if (tab === 'bookings' && user) void loadBookings();
  }, [tab, user, loadBookings]);

  const searchPlaces = async (side: 'from' | 'to') => {
    const query = side === 'from' ? fromQuery.trim() : toQuery.trim();
    if (query.length < 3) { setNotice('Enter at least 3 characters to search for a place.'); return; }
    setSearching(side); setNotice('');
    try {
      // Photon is called only on submit. The public endpoint is best-effort and rate-limited.
      const response = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=6&lang=en`);
      if (!response.ok) throw new Error('Place search is temporarily unavailable. Try again shortly.');
      const data = await response.json();
      const places: Place[] = (data.features || []).map((feature: any) => ({ name: feature.properties?.name || query, lat: feature.geometry.coordinates[1], lon: feature.geometry.coordinates[0], label: labelForFeature(feature) || query }));
      if (side === 'from') setFromResults(places); else setToResults(places);
      if (!places.length) setNotice('No matching places found. Try a town, station, airport or landmark.');
    } catch (e) { setNotice(e instanceof Error ? e.message : 'Place search failed.'); }
    finally { setSearching(null); }
  };

  const choosePlace = (side: 'from' | 'to', place: Place) => {
    if (side === 'from') { setFrom(place); setFromQuery(place.label); setFromResults([]); }
    else { setTo(place); setToQuery(place.label); setToResults([]); }
    setRoute(null); setActivePass(null); setRouteError(''); setNotice('');
    if (mapRef.current) mapRef.current.setView([place.lat, place.lon], 11);
  };

  const swapPlaces = () => {
    const oldFrom = from; const oldTo = to;
    setFrom(oldTo); setTo(oldFrom);
    setFromQuery(oldTo?.label || toQuery); setToQuery(oldFrom?.label || fromQuery);
    setRoute(null); setActivePass(null);
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) { setNotice('This browser does not support location access. Search for your pickup instead.'); return; }
    setNotice('Requesting your location…');
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      let label = `Current location (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`;
      try {
        const response = await fetch(`https://photon.komoot.io/reverse?lat=${latitude}&lon=${longitude}&lang=en`);
        if (response.ok) {
          const data = await response.json();
          const feature = data.features?.[0];
          if (feature) label = labelForFeature(feature) || label;
        }
      } catch { /* Coordinates are still usable if reverse geocoding is unavailable. */ }
      const place: Place = { name: 'Current location', lat: latitude, lon: longitude, label };
      setFrom(place); setFromQuery(label); setFromResults([]); setRoute(null); setActivePass(null);
      if (mapRef.current) mapRef.current.setView([latitude, longitude], 14);
      setNotice('Current location selected as pickup. Confirm the pin and destination before calculating a route.');
    }, (error) => {
      const message = error.code === error.PERMISSION_DENIED ? 'Location permission was denied. You can still search for a pickup address.' : 'Could not get your current location. Check device location settings and try again.';
      setNotice(message);
    }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 });
  };

  const calculateRoute = async () => {
    if (!from || !to) { setNotice('Search for and select both pickup and destination locations first.'); return; }
    if (from.lat === to.lat && from.lon === to.lon) { setNotice('Pickup and destination must be different.'); return; }
    setRouteLoading(true); setRouteError(''); setNotice('');
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${from.lon},${from.lat};${to.lon},${to.lat}?overview=full&geometries=geojson`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('The public routing service is busy. Try again later.');
      const data = await response.json();
      if (data.code !== 'Ok' || !data.routes?.[0]) throw new Error('No drivable road route was found for those locations.');
      const r = data.routes[0];
      const next: RouteInfo = { distanceKm: r.distance / 1000, durationMin: r.duration / 60, geometry: r.geometry.coordinates.map((c: number[]) => [c[1], c[0]] as [number, number]) };
      setRoute(next);
      if (mapRef.current && window.L) {
        markersRef.current.forEach((m) => m.remove()); markersRef.current = [];
        if (routeLayerRef.current) routeLayerRef.current.remove();
        markersRef.current.push(window.L.marker([from.lat, from.lon]).addTo(mapRef.current).bindPopup('Pickup / origin'));
        markersRef.current.push(window.L.marker([to.lat, to.lon]).addTo(mapRef.current).bindPopup('Destination'));
        routeLayerRef.current = window.L.polyline(next.geometry, { color: '#2563eb', weight: 5, opacity: 0.88 }).addTo(mapRef.current);
        mapRef.current.fitBounds(routeLayerRef.current.getBounds(), { padding: [28, 28] });
      }
    } catch (e) { setRouteError(e instanceof Error ? e.message : 'Could not calculate route.'); }
    finally { setRouteLoading(false); }
  };

  const fare = useMemo(() => {
    if (!route || !transportSelected) return null;
    const tierMultiplier = tiers.find((t) => t.name === tier)?.multiplier ?? 1;
    const base = rideMode === 'shared' ? 25 : rideMode === 'comfort' ? 95 : 55;
    const perKm = rideMode === 'shared' ? 7 : rideMode === 'comfort' ? 17 : 11;
    const perMin = rideMode === 'comfort' ? 1.8 : 0.7;
    const roadFare = Math.max(base, base + route.distanceKm * perKm + route.durationMin * perMin) * tierMultiplier * (rideMode === 'shared' ? Math.max(0.45, (passengers + children) * 0.62) : passengers + children);
    const pickup = includePickup ? Math.max(40, route.distanceKm * 2.2) : 0;
    const longDistance = includeLongDistance ? Math.max(0, route.distanceKm * (tier === 'Aero-Executive' ? 8 : tier === 'Civic-Essential' ? 2.8 : 4.5)) : 0;
    const drop = includeDrop ? Math.max(40, route.distanceKm * 1.8) : 0;
    const subtotal = roadFare + pickup + longDistance + drop;
    const platformFee = subtotal * 0.04;
    return { base, roadFare, pickup, longDistance, drop, platformFee, total: Math.round(subtotal + platformFee), distanceKm: route.distanceKm, durationMin: route.durationMin };
  }, [route, transportSelected, rideMode, tier, passengers, children, includePickup, includeLongDistance, includeDrop]);

  async function saveBooking(input: { booking_code: string; booking_type: string; origin: string; destination: string; total_fare: number; status: string; details: Record<string, unknown> }) {
    if (!user) return { saved: false, message: 'Sign in to save bookings to your account. This demo can still generate a local preview.' };
    const { error } = await supabase.from('mobility_bookings').insert({ ...input, user_id: user.id });
    if (error) return { saved: false, message: `Booking preview created, but cloud saving failed: ${error.message}. Apply the new mobility_bookings migration in Supabase to enable saved bookings.` };
    return { saved: true, message: 'Booking saved to your TravBud account.' };
  }

  const confirmJourney = async () => {
    if (!from || !to || !fare) { setNotice('Select locations and calculate the road route before creating a NUMob pass.'); return; }
    setBusy(true);
    const code = makeCode();
    const draft: TicketPass = { code, fare: fare.total, from: from.label, to: to.label, tier, date: `${travelDate} ${travelTime}`, passengers, children, infants, babySeat, mode: rideMode, status: 'Prototype · not booked with operators' };
    setActivePass(draft);
    const result = await saveBooking({ booking_code: code, booking_type: 'journey', origin: from.label, destination: to.label, total_fare: fare.total, status: 'prototype', details: { ...draft, totalTravellers: passengers + children + infants, distanceKm: fare.distanceKm, durationMin: fare.durationMin, fareBreakdown: fare, pickupIncluded: includePickup, longDistanceIncluded: includeLongDistance, dropIncluded: includeDrop } });
    setNotice(`${result.message} No real transport, ticket or payment has been booked.`);
    setTab('pass'); setBusy(false);
  };

  const chooseBud = async (driver: typeof driverSamples[number]) => {
    setBusy(true);
    const code = makeCode('BUD');
    const result = await saveBooking({ booking_code: code, booking_type: 'hire_a_bud', origin: driver.origin, destination: driver.destination, total_fare: driver.fare * hireSeats, status: 'prototype', details: { driverId: driver.id, driverName: driver.name, vehicle: driver.vehicle, seatsRequested: hireSeats, rideKind: hireKind, route: driver.route, sampleData: true } });
    setNotice(`${driver.name} selected for demo request ${code}. ${result.message} No driver has been contacted.`);
    setBusy(false);
  };

  const createCargoQuote = async (vehicle: typeof cargoSamples[number]) => {
    const weight = Number(cargoWeight);
    if (!cargoOrigin.trim() || !cargoDestination.trim() || cargoOrigin.trim().toLowerCase() === cargoDestination.trim().toLowerCase()) { setNotice('Enter different cargo origin and destination locations.'); return; }
    if (!Number.isFinite(weight) || weight <= 0) { setNotice('Enter a valid cargo weight greater than zero.'); return; }
    if (weight > vehicle.capacityKg) { setNotice(`${vehicle.vehicle} capacity is ${vehicle.capacityKg.toLocaleString('en-IN')} kg. Choose a larger vehicle.`); return; }
    const routeMatch = `${cargoOrigin.trim().toLowerCase()} → ${cargoDestination.trim().toLowerCase()}`;
    const matching = vehicle.route.toLowerCase() === routeMatch;
    const estimate = Math.round(vehicle.price * Math.max(0.5, weight / Math.min(vehicle.capacityKg, 1000)) * (matching ? 1 : 1.3));
    setBusy(true);
    const code = makeCode('CGO');
    setLastCargoQuote({ code, vehicle: vehicle.vehicle, fare: estimate, origin: cargoOrigin, destination: cargoDestination, weight });
    const result = await saveBooking({ booking_code: code, booking_type: 'radar_cargo', origin: cargoOrigin, destination: cargoDestination, total_fare: estimate, status: 'quote', details: { vehicle: vehicle.vehicle, capacityKg: vehicle.capacityKg, weightKg: weight, goodsType: cargoGoods, requestedDate: cargoDate, sampleData: true } });
    setNotice(`Sample cargo quote ${code} generated. ${result.message} This is not a confirmed shipment.`);
    setBusy(false);
  };

  const tabs: { id: Tab; label: string; icon: typeof Navigation }[] = [
    { id: 'journey', label: 'Journey planner', icon: Navigation },
    { id: 'hire', label: 'Hire a Bud', icon: Users },
    { id: 'cargo', label: 'Radar Cargo', icon: Container },
    { id: 'pass', label: 'NUMob Pass', icon: Ticket },
    { id: 'bookings', label: 'My bookings', icon: PackageCheck },
  ];
  const visibleDrivers = driverSamples.filter((d) => d.seats >= hireSeats && (!hireDestination.trim() || `${d.origin} ${d.destination} ${d.route}`.toLowerCase().includes(hireDestination.toLowerCase())));
  const visibleCargo = cargoSamples.filter((c) => cargoFilter === 'All' || c.type === cargoFilter);

  return <div className="space-y-6 pb-8">
    <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
      <div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Unified mobility ecosystem</p><h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mt-2">Every leg. One journey.</h1><p className="text-slate-500 dark:text-slate-400 mt-2 max-w-2xl">Plan a door-to-door journey, estimate the total fare, explore return-trip rides and cargo, then create one NUMob prototype pass.</p></div>
      <div className="flex items-center gap-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 px-3 py-2 text-xs"><ShieldCheck className="w-4 h-4"/>Prototype estimates · no real booking</div>
    </header>

    <nav className="flex gap-2 overflow-x-auto pb-1" aria-label="Mobility features">{tabs.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => { setTab(id); setNotice(''); }} className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${tab === id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'glass text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800'}`}><Icon className="w-4 h-4"/>{label}</button>)}</nav>

    {notice && <div role="status" className="flex items-start gap-2 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-100 p-3 text-sm"><CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5"/><span>{notice}</span><button onClick={() => setNotice('')} className="ml-auto text-lg leading-none" aria-label="Dismiss notice">×</button></div>}
    {mapError && <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 p-3 text-sm text-amber-800 dark:text-amber-200">{mapError} You can still use the text search and fare estimator if the map tiles fail.</div>}

    {tab === 'journey' && <div className="grid xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,.9fr)] gap-5">
      <section className="space-y-4 min-w-0">
        <div className="glass-strong rounded-2xl p-5 md:p-6"><div className="flex items-center justify-between gap-3"><div><h2 className="text-xl font-bold text-slate-900 dark:text-white">Where are you going?</h2><p className="text-sm text-slate-500 mt-1">Search an address, town, station or airport.</p></div><div className="rounded-xl bg-blue-100 dark:bg-blue-900/40 p-3"><MapPin className="w-5 h-5 text-blue-700 dark:text-blue-300"/></div></div>
          <div className="grid md:grid-cols-[1fr_auto_1fr] gap-3 mt-5 items-end"><div className="space-y-2"><label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pickup / origin</label><div className="flex gap-2"><input value={fromQuery} onChange={(e) => setFromQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && void searchPlaces('from')} placeholder="Home, address, station..." className="min-w-0 flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-3 text-sm text-slate-900 dark:text-white"/><button onClick={() => void searchPlaces('from')} disabled={searching !== null} className="rounded-xl bg-blue-600 text-white px-3" aria-label="Search pickup"><Search className="w-4 h-4"/></button></div>{fromResults.length > 0 && <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">{fromResults.map((p, i) => <button key={`${p.label}-${i}`} onClick={() => choosePlace('from', p)} className="block w-full text-left p-3 text-sm hover:bg-blue-50 dark:hover:bg-slate-800 border-b last:border-b-0 border-slate-100 dark:border-slate-700">{p.label}</button>)}</div>}{from && <p className="text-xs text-emerald-700 dark:text-emerald-300">Selected: {from.name}</p>}<button type="button" onClick={useCurrentLocation} className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700"><Navigation className="w-3.5 h-3.5"/>Use my current location</button></div><button onClick={swapPlaces} className="justify-self-center rounded-full border border-slate-200 dark:border-slate-700 p-3 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Swap pickup and destination"><ArrowDownUp className="w-4 h-4"/></button><div className="space-y-2"><label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Destination</label><div className="flex gap-2"><input value={toQuery} onChange={(e) => setToQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && void searchPlaces('to')} placeholder="Destination address..." className="min-w-0 flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-3 text-sm text-slate-900 dark:text-white"/><button onClick={() => void searchPlaces('to')} disabled={searching !== null} className="rounded-xl bg-blue-600 text-white px-3" aria-label="Search destination"><Search className="w-4 h-4"/></button></div>{toResults.length > 0 && <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">{toResults.map((p, i) => <button key={`${p.label}-${i}`} onClick={() => choosePlace('to', p)} className="block w-full text-left p-3 text-sm hover:bg-blue-50 dark:hover:bg-slate-800 border-b last:border-b-0 border-slate-100 dark:border-slate-700">{p.label}</button>)}</div>}{to && <p className="text-xs text-emerald-700 dark:text-emerald-300">Selected: {to.name}</p>}</div></div>
          <div className="grid sm:grid-cols-3 gap-3 mt-5"><div><label className="text-xs font-semibold text-slate-500 flex items-center gap-1 mb-2"><CalendarDays className="w-3.5 h-3.5"/>Travel date</label><input type="date" min={new Date().toISOString().slice(0, 10)} value={travelDate} onChange={(e) => setTravelDate(e.target.value)} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-3 text-sm"/></div><div><label className="text-xs font-semibold text-slate-500 flex items-center gap-1 mb-2"><Clock3 className="w-3.5 h-3.5"/>Pickup time</label><input type="time" value={travelTime} onChange={(e) => setTravelTime(e.target.value)} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-3 text-sm"/></div><div><label className="text-xs font-semibold text-slate-500 flex items-center gap-1 mb-2"><Users className="w-3.5 h-3.5"/>Adults (12+)</label><select value={passengers} onChange={(e) => setPassengers(Number(e.target.value))} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-3 text-sm text-slate-900 dark:text-white">{[1,2,3,4,5,6].map((n) => <option key={n} value={n}>{n} adult{n > 1 ? 's' : ''}</option>)}</select></div></div><div className="grid sm:grid-cols-3 gap-3 mt-3"><div><label className="block text-xs font-semibold text-slate-500 mb-2">Children (2–11 years)</label><select value={children} onChange={(e) => setChildren(Number(e.target.value))} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-3 text-sm text-slate-900 dark:text-white">{[0,1,2,3,4,5,6].map((n) => <option key={n} value={n}>{n} child{n === 1 ? '' : 'ren'}</option>)}</select></div><div><label className="block text-xs font-semibold text-slate-500 mb-2">Infants (under 2 years)</label><select value={infants} onChange={(e) => setInfants(Number(e.target.value))} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-3 text-sm text-slate-900 dark:text-white">{[0,1,2,3,4].map((n) => <option key={n} value={n}>{n} infant{n === 1 ? '' : 's'}</option>)}</select></div><div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 text-sm text-slate-700 dark:text-slate-200"><p className="font-semibold">Child safety</p>{babySeat ? <p className="mt-1 text-emerald-700 dark:text-emerald-300">Baby seat requested for {infants} infant{infants === 1 ? '' : 's'}.</p> : <p className="mt-1 text-slate-500 dark:text-slate-400">A baby seat is requested automatically when you add an infant.</p>}</div></div>
          <button onClick={() => void calculateRoute()} disabled={routeLoading || searching !== null} className="mt-5 w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white py-3.5 font-bold">{routeLoading ? <RefreshCw className="w-4 h-4 animate-spin"/> : <RouteIcon className="w-4 h-4"/>}{routeLoading ? 'Calculating route...' : 'Find route & estimate fare'}</button>
          {routeError && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{routeError}</p>}
        </div>
        <div className="glass-strong rounded-2xl overflow-hidden"><div className="p-4 flex items-center justify-between"><div><h3 className="font-bold text-slate-900 dark:text-white">Live map preview</h3><p className="text-xs text-slate-500 mt-1">OpenStreetMap · Leaflet · route overlay</p></div><span className="text-xs text-slate-500">Free demo services</span></div><div ref={mapNode} className="h-[330px] w-full bg-slate-100 dark:bg-slate-800"/><p className="px-4 py-3 text-[11px] text-slate-500">Map data © OpenStreetMap contributors. Place search uses Photon; driving routes use the public OSRM demo service. Availability and usage limits apply.</p></div>
      </section>

      <aside className="space-y-4"><section className="glass-strong rounded-2xl p-5"><h2 className="text-xl font-bold text-slate-900 dark:text-white">Choose your travel style</h2><p className="text-sm text-slate-500 mt-1">Select a vehicle class and unified ticket tier.</p><div className="grid grid-cols-3 gap-2 mt-4">{([{ id: 'shared', label: 'Shared', icon: Users, sub: 'Lowest fare' }, { id: 'standard', label: 'Standard', icon: Bike, sub: 'Everyday' }, { id: 'comfort', label: 'Comfort', icon: Plane, sub: 'Premium' }] as const).map(({ id, label, icon: Icon, sub }) => <button key={id} onClick={() => { setRideMode(id); setTransportSelected(true); }} className={`rounded-xl border p-3 text-left ${rideMode === id ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40' : 'border-slate-200 dark:border-slate-700'}`}><Icon className={`w-5 h-5 ${rideMode === id ? 'text-blue-600' : 'text-slate-500'}`}/><p className="font-semibold text-sm mt-2 text-slate-900 dark:text-white">{label}</p><p className="text-[11px] text-slate-500">{sub}</p></button>)}</div><label className="block text-xs font-semibold text-slate-500 mt-5 mb-2">NUMob tier</label><select value={tier} onChange={(e) => setTier(e.target.value)} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-3 text-sm">{tiers.map((t) => <option key={t.name}>{t.name}</option>)}</select><p className="text-xs text-slate-500 mt-2">{tiers.find((t) => t.name === tier)?.detail}</p><div className="space-y-3 text-sm mt-5"><label className="flex items-center gap-3"><input type="checkbox" checked={includePickup} onChange={(e) => setIncludePickup(e.target.checked)} className="accent-blue-600"/><span className="flex-1">Home pickup / first mile</span><span className="text-xs text-slate-500">Optional</span></label><label className="flex items-center gap-3"><input type="checkbox" checked={includeLongDistance} onChange={(e) => setIncludeLongDistance(e.target.checked)} className="accent-blue-600"/><span className="flex-1">Bus / rail connection estimate</span><span className="text-xs text-slate-500">Sample</span></label><label className="flex items-center gap-3"><input type="checkbox" checked={includeDrop} onChange={(e) => setIncludeDrop(e.target.checked)} className="accent-blue-600"/><span className="flex-1">Destination drop-off</span><span className="text-xs text-slate-500">Optional</span></label></div></section>
        <section className="rounded-2xl bg-slate-950 text-white p-5 shadow-xl"><div className="flex items-center justify-between"><p className="text-sm text-slate-300">Estimated total</p><Wallet className="w-5 h-5 text-cyan-300"/></div><div className="text-4xl font-bold mt-2">{fare ? money(fare.total) : '₹0'}</div><p className="text-xs text-slate-400 mt-2">{fare ? `${fare.distanceKm.toFixed(1)} km · about ${Math.round(fare.durationMin)} min driving` : 'Select a vehicle class and calculate a route to see your fare'}</p>{!fare && <p className="mt-3 text-xs text-slate-400">No transport selected · estimated cost is ₹0.</p>}{fare && <div className="border-t border-white/15 mt-4 pt-3 space-y-2 text-sm"><div className="flex justify-between"><span className="text-slate-300">Road transport × {passengers + children}</span><span>{money(fare.roadFare)}</span></div>{includePickup && <div className="flex justify-between"><span className="text-slate-300">Home pickup</span><span>{money(fare.pickup)}</span></div>}{includeLongDistance && <div className="flex justify-between"><span className="text-slate-300">Long-distance estimate</span><span>{money(fare.longDistance)}</span></div>}{includeDrop && <div className="flex justify-between"><span className="text-slate-300">Destination transfer</span><span>{money(fare.drop)}</span></div>}<div className="flex justify-between"><span className="text-slate-300">Illustrative 4% platform fee</span><span>{money(fare.platformFee)}</span></div><div className="flex justify-between border-t border-white/15 pt-3 font-bold"><span>Total estimate</span><span>{money(fare.total)}</span></div></div>}<button onClick={() => void confirmJourney()} disabled={!transportSelected || !fare || busy} className="w-full mt-5 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 text-slate-950 rounded-xl py-3 font-bold">{busy ? 'Saving preview...' : 'Create NUMob pass'}</button><p className="text-[11px] leading-4 text-slate-400 mt-3">Illustrative estimate only. Not an operator quote, confirmed ticket, live availability check or payment request.</p></section>
        {route && <div className="glass p-4 flex gap-3"><Clock3 className="w-5 h-5 text-blue-600 shrink-0"/><div><p className="font-semibold text-slate-800 dark:text-white">Route calculated</p><p className="text-sm text-slate-500 dark:text-slate-400">Road route calculated by OSRM. Actual bus, train and flight pricing requires operator integrations.</p></div></div>}
        {route && <JourneyHealth distanceKm={route.distanceKm} durationMin={route.durationMin} rideMode={rideMode} />}
      </aside>
    </div>}

    {tab === 'hire' && <section className="space-y-4"><div className="glass-strong rounded-2xl p-5"><h2 className="text-2xl font-bold text-slate-900 dark:text-white">Hire a Bud</h2><p className="text-slate-500 mt-1">Find a sample return-trip driver, share seats and reduce empty return journeys.</p><div className="grid sm:grid-cols-3 gap-3 mt-5">{([{ label: 'Single rider', icon: UserRound }, { label: 'Group travel', icon: Users }, { label: 'Flexible return', icon: ArrowDownUp }] as const).map(({ label, icon: Icon }) => <button key={label} onClick={() => { setHireKind(label); setHireSeats(label === 'Single rider' ? 1 : label === 'Group travel' ? 3 : hireSeats); }} className={`glass-card p-4 flex items-center gap-3 text-left ${hireKind === label ? 'ring-2 ring-blue-500' : ''}`}><Icon className="w-5 h-5 text-blue-600"/><span className="font-semibold text-slate-800 dark:text-white">{label}</span></button>)}</div><div className="grid sm:grid-cols-2 gap-3 mt-4"><div><label className="block text-xs font-semibold text-slate-500 mb-2">Route, town or destination filter</label><input value={hireDestination} onChange={(e) => setHireDestination(e.target.value)} placeholder="e.g. Thrissur" className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-3 text-sm"/></div><div><label className="block text-xs font-semibold text-slate-500 mb-2">Seats needed</label><select value={hireSeats} onChange={(e) => setHireSeats(Number(e.target.value))} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-3 text-sm">{[1,2,3,4,5,6].map((n) => <option key={n} value={n}>{n} seat{n > 1 ? 's' : ''}</option>)}</select></div></div></div><div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">{visibleDrivers.map((driver) => <article key={driver.id} className="glass-card rounded-2xl p-5"><div className="flex justify-between items-start"><div className="rounded-xl bg-blue-100 dark:bg-blue-900/40 p-3"><Bike className="w-6 h-6 text-blue-700 dark:text-blue-300"/></div><span className="text-xs rounded-full bg-emerald-100 text-emerald-800 px-2 py-1">{driver.type}</span></div><h3 className="font-bold text-lg mt-4 text-slate-900 dark:text-white">{driver.name}</h3><p className="text-sm mt-1 text-slate-600 dark:text-slate-300">{driver.route}</p><div className="flex flex-wrap gap-2 text-xs text-slate-500 mt-3"><span>{driver.distance}</span><span>★ {driver.rating} sample</span></div><div className="text-sm mt-3">{driver.vehicle} · {driver.seats} seats</div><div className="flex items-center justify-between border-t border-slate-200/70 dark:border-slate-700 mt-4 pt-4"><div><span className="text-xl font-bold text-slate-900 dark:text-white">{money(driver.fare * hireSeats)}</span><p className="text-[11px] text-slate-500">estimate for {hireSeats}</p></div><button disabled={busy} onClick={() => void chooseBud(driver)} className="rounded-lg bg-blue-600 text-white px-3 py-2 text-sm font-semibold disabled:opacity-50">Request Bud</button></div></article>)}</div>{visibleDrivers.length === 0 && <div className="glass p-8 text-center text-slate-500">No sample drivers match those filters. Try fewer seats or another destination.</div>}<p className="text-sm text-amber-700 dark:text-amber-300">Sample listings only. Drivers are not verified or live. No ride request is sent. Live matching requires driver accounts, location permissions, dispatch, safety checks and operational support.</p></section>}

    {tab === 'cargo' && <section className="space-y-4"><div className="glass-strong rounded-2xl p-5"><h2 className="text-2xl font-bold text-slate-900 dark:text-white">Radar Cargo</h2><p className="text-slate-500 mt-1">Illustrative return-trip freight matching for merchants and fleet operators.</p><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-5"><div><label className="block text-xs font-semibold text-slate-500 mb-2">Pickup / origin</label><input value={cargoOrigin} onChange={(e) => setCargoOrigin(e.target.value)} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-3 text-sm"/></div><div><label className="block text-xs font-semibold text-slate-500 mb-2">Destination</label><input value={cargoDestination} onChange={(e) => setCargoDestination(e.target.value)} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-3 text-sm"/></div><div><label className="block text-xs font-semibold text-slate-500 mb-2">Cargo weight (kg)</label><input type="number" min="1" value={cargoWeight} onChange={(e) => setCargoWeight(e.target.value)} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-3 text-sm"/></div><div><label className="block text-xs font-semibold text-slate-500 mb-2">Goods type</label><select value={cargoGoods} onChange={(e) => setCargoGoods(e.target.value)} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-3 text-sm">{['General goods', 'Fragile', 'Food / perishable', 'Construction material', 'Electronics', 'Other'].map((g) => <option key={g}>{g}</option>)}</select></div><div><label className="block text-xs font-semibold text-slate-500 mb-2">Preferred date</label><input type="date" min={new Date().toISOString().slice(0, 10)} value={cargoDate} onChange={(e) => setCargoDate(e.target.value)} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-3 text-sm"/></div></div><div className="flex flex-wrap gap-2 mt-5">{['All', 'Light cargo', 'Medium cargo', 'Heavy cargo'].map((f) => <button key={f} onClick={() => setCargoFilter(f)} className={`rounded-full px-4 py-2 text-sm font-semibold ${cargoFilter === f ? 'bg-blue-600 text-white' : 'glass text-slate-700 dark:text-slate-200'}`}>{f}</button>)}</div></div><div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">{visibleCargo.map((c) => { const weight = Number(cargoWeight) || 0; const tooHeavy = weight > c.capacityKg; return <article key={c.id} className="glass-card rounded-2xl p-5"><div className="flex items-start justify-between"><div className="rounded-xl bg-amber-100 dark:bg-amber-900/30 p-3"><Truck className="w-6 h-6 text-amber-700 dark:text-amber-300"/></div><span className="text-xs text-slate-500">Sample vehicle</span></div><p className="text-xs uppercase tracking-wider text-slate-500 mt-4">{c.type}</p><h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">{c.vehicle}</h3><p className="text-sm text-slate-600 dark:text-slate-300 mt-2">Example route: {c.route}</p><p className="text-sm mt-3">Capacity: up to {c.capacityKg.toLocaleString('en-IN')} kg</p><p className="text-xs text-slate-500 mt-1">{c.available}</p><div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-200/70 dark:border-slate-700"><div><span className="text-xl font-bold">{money(c.price * Math.max(0.5, weight / Math.min(c.capacityKg, 1000)) * 1.1)}</span><p className="text-[11px] text-slate-500">illustrative quote</p></div><button disabled={busy || tooHeavy || weight <= 0} onClick={() => void createCargoQuote(c)} className="rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-3 py-2 text-sm font-semibold disabled:opacity-40">Request quote</button></div>{tooHeavy && <p className="text-xs text-red-600 mt-2">Cargo exceeds this vehicle's sample capacity.</p>}</article>; })}</div>{lastCargoQuote && <div className="glass-strong rounded-2xl p-5"><h3 className="font-bold text-slate-900 dark:text-white">Latest cargo quote · {lastCargoQuote.code}</h3><p className="text-sm text-slate-500 mt-1">{lastCargoQuote.origin} → {lastCargoQuote.destination} · {lastCargoQuote.weight} kg · {lastCargoQuote.vehicle}</p><p className="text-2xl font-bold mt-2">{money(lastCargoQuote.fare)}</p></div>}<p className="text-sm text-amber-700 dark:text-amber-300">Quote requests are saved to your prototype account when Supabase is configured. No shipment is dispatched and no carrier has accepted the load.</p></section>}

    {tab === 'pass' && <section className="max-w-2xl mx-auto space-y-4">{activePass ? <div className="bg-white text-slate-900 rounded-3xl overflow-hidden shadow-xl border border-slate-200"><div className="bg-gradient-to-r from-blue-700 to-cyan-600 text-white p-6"><div className="flex justify-between items-center"><div><p className="text-xs uppercase tracking-[0.2em] text-blue-100">TravBud unified mobility</p><h2 className="text-2xl font-bold mt-1">NUMob Slip</h2></div><Ticket className="w-9 h-9"/></div><p className="mt-5 text-sm text-blue-100">Prototype booking reference</p><p className="text-2xl font-mono font-bold tracking-wider">{activePass.code}</p></div><div className="p-6 space-y-5"><div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center"><div><p className="text-xs text-slate-500">FROM</p><p className="font-semibold mt-1 break-words">{activePass.from}</p></div><ArrowRight className="w-5 h-5 text-blue-600"/><div><p className="text-xs text-slate-500">TO</p><p className="font-semibold mt-1 break-words">{activePass.to}</p></div></div><div className="grid grid-cols-2 gap-4 border-y border-dashed py-4"><div><p className="text-xs text-slate-500">Ticket tier</p><p className="font-semibold mt-1">{activePass.tier}</p></div><div><p className="text-xs text-slate-500">Estimated total</p><p className="text-2xl font-bold mt-1">{money(activePass.fare)}</p></div><div><p className="text-xs text-slate-500">Date / pickup time</p><p className="font-semibold mt-1">{activePass.date}</p></div><div><p className="text-xs text-slate-500">Passengers</p><p className="font-semibold mt-1">{activePass.passengers} adults · {activePass.children} children · {activePass.infants} infants</p></div>{activePass.babySeat && <div className="col-span-2"><p className="text-xs text-slate-500">Infant accommodation</p><p className="font-semibold mt-1 text-emerald-700">Baby seat requested ({activePass.infants})</p></div>}</div><div className="flex flex-col sm:flex-row gap-4 items-center"><img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`TravBud prototype reference ${activePass.code}`)}`} alt="QR code containing the demo ticket reference" width="150" height="150" className="border rounded-xl p-2"/><div className="text-sm text-slate-600"><p className="font-semibold">Demo ticket QR</p><p className="mt-1">Contains the reference and journey details for demonstration only. It cannot validate real transport bookings.</p><p className="mt-2 text-xs">Status: {activePass.status}</p></div></div><div className="flex items-center gap-2 text-sm text-amber-800 bg-amber-50 rounded-xl p-3"><ShieldCheck className="w-5 h-5 shrink-0"/>This is a prototype pass. No operator ticket, driver, or payment is confirmed.</div><div className="grid sm:grid-cols-2 gap-3"><button onClick={() => window.print()} className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 font-semibold"><Printer className="w-4 h-4"/>Print / save PDF</button><button onClick={() => { setActivePass(null); setTab('journey'); }} className="rounded-xl bg-blue-600 text-white py-3 font-semibold">Plan another journey</button></div></div></div> : <div className="glass-strong rounded-2xl p-8 text-center"><div className="mx-auto w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center"><Ticket className="w-7 h-7 text-blue-700 dark:text-blue-300"/></div><h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-4">Your NUMob pass</h2><p className="text-slate-500 mt-2">Calculate a route and choose “Create NUMob pass” to generate a sample unified ticket.</p><button onClick={() => setTab('journey')} className="mt-5 rounded-xl bg-blue-600 text-white px-5 py-3 font-semibold">Plan a journey</button></div>}</section>}

    {tab === 'bookings' && <section className="space-y-4"><div className="glass-strong rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"><div><h2 className="text-2xl font-bold text-slate-900 dark:text-white">My bookings</h2><p className="text-sm text-slate-500 mt-1">Your saved journey previews, Hire a Bud requests and cargo quotes.</p></div><button onClick={() => void loadBookings()} disabled={bookingLoading || !user} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 text-white px-4 py-3 text-sm font-semibold disabled:opacity-50"><RefreshCw className={`w-4 h-4 ${bookingLoading ? 'animate-spin' : ''}`}/>Refresh</button></div>{!user ? <div className="glass p-8 text-center text-slate-500">Sign in to see bookings saved to your account.</div> : bookingLoading ? <div className="glass p-8 text-center text-slate-500">Loading your bookings…</div> : bookingRows.length === 0 ? <div className="glass p-8 text-center"><PackageCheck className="w-8 h-8 mx-auto text-slate-400"/><p className="font-semibold mt-3 text-slate-800 dark:text-white">No saved bookings yet</p><p className="text-sm text-slate-500 mt-1">Create a journey pass or request a sample cargo quote.</p></div> : <div className="grid md:grid-cols-2 gap-4">{bookingRows.map((b) => <article key={b.id} className="glass-card rounded-2xl p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs uppercase tracking-wide text-blue-600">{b.booking_type.replaceAll('_', ' ')}</p><h3 className="font-bold text-slate-900 dark:text-white mt-1">{b.booking_code}</h3></div><span className="rounded-full bg-amber-100 text-amber-800 px-2 py-1 text-xs">{b.status}</span></div><p className="text-sm mt-3 text-slate-700 dark:text-slate-200">{b.origin} <ArrowRight className="inline w-3.5 h-3.5 mx-1"/> {b.destination}</p><div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200/70 dark:border-slate-700"><span className="text-xs text-slate-500">{new Date(b.created_at).toLocaleString()}</span><span className="text-lg font-bold">{money(Number(b.total_fare))}</span></div></article>)}</div>}<p className="text-xs text-slate-500">If bookings cannot load, apply the included Supabase migration file for the `mobility_bookings` table, then refresh.</p></section>}
  </div>;
}


function JourneyHealth({ distanceKm, durationMin, rideMode }: { distanceKm: number; durationMin: number; rideMode: RideMode }) {
  // All factors below are intentionally simulated for the prototype; they are not live traffic/weather/driver data.
  const traffic = Math.min(90, 24 + Math.round(distanceKm % 19) + Math.round(durationMin % 13));
  const weather = Math.min(92, 82 - Math.round(distanceKm % 17));
  const vehicle = rideMode === 'comfort' ? 92 : rideMode === 'standard' ? 84 : 78;
  const agent = 78 + Math.round(durationMin % 17);
  const roads = Math.max(55, 90 - Math.round(distanceKm % 28));
  const score = Math.round((traffic + weather + vehicle + agent + roads) / 5);
  const label = score >= 85 ? 'Healthy journey' : score >= 72 ? 'Fair journey' : 'Needs attention';
  const items = [
    { label: 'Traffic flow', value: traffic, note: 'Simulated congestion' },
    { label: 'Weather', value: weather, note: 'Simulated conditions' },
    { label: 'Vehicle quality', value: vehicle, note: 'Based on selected ride class' },
    { label: 'Agent personality', value: agent, note: 'Simulated courtesy / service score' },
    { label: 'Road conditions', value: roads, note: 'Simulated road issue risk' },
  ];
  return <section className="glass-strong rounded-2xl p-5"><div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-blue-600">TravBud journey health</p><h3 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{label}</h3><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">A prototype score based on route length ({distanceKm.toFixed(1)} km) and estimated duration ({Math.round(durationMin)} min).</p></div><div className="flex items-center justify-center w-20 h-20 rounded-full border-4 border-emerald-400 text-2xl font-bold text-slate-900 dark:text-white">{score}<span className="text-xs font-medium">/100</span></div></div><div className="mt-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{items.map(item => <div key={item.label} className="rounded-xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-700 p-3"><div className="flex justify-between gap-2"><span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{item.label}</span><span className="text-sm font-bold text-blue-600">{item.value}/100</span></div><div className="h-2 mt-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-blue-500" style={{ width: `${item.value}%` }}/></div><p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{item.note}</p></div>)}</div><p className="mt-4 text-xs text-amber-700 dark:text-amber-200">Simulation only: live traffic, weather alerts, road closures, verified vehicle inspections and driver/personality ratings are not connected. Do not use this score for real-world safety decisions.</p></section>;
}
