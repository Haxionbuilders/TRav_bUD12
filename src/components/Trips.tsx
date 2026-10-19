import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Bus, CalendarDays, Check, MapPin, Minus, Plus, QrCode, Users, Ticket, Armchair, Copy, RotateCcw } from 'lucide-react';

type Vehicle = { id: string; name: string; seats: number; description: string; price: number; kind: string };
const vehicles: Vehicle[] = [
  { id: 'traveller-27', name: '27-seater Traveller', seats: 27, description: 'Small groups · comfortable traveller', price: 8500, kind: 'Traveller' },
  { id: 'bus-40', name: '40-seater bus', seats: 40, description: 'Medium groups · standard coach', price: 12000, kind: 'Bus' },
  { id: 'bus-50', name: '50-seater bus', seats: 50, description: 'Large groups · full-size coach', price: 15000, kind: 'Bus' },
  { id: 'bus-60', name: '60-seater bus', seats: 60, description: 'Extra-large groups · high-capacity coach', price: 18000, kind: 'Bus' },
];
const money = (n: number) => `₹${n.toLocaleString('en-IN')}`;
type Stage = 'people' | 'vehicle' | 'ticket' | 'pass';

export default function Trips() {
  const [stage, setStage] = useState<Stage>('people');
  const [people, setPeople] = useState(10);
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [groupName, setGroupName] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [bookingCode] = useState(() => `NUMO-${Math.random().toString(36).slice(2, 8).toUpperCase()}`);
  const [confirmed, setConfirmed] = useState(false);
  const vehicle = vehicles.find((v) => v.id === vehicleId);
  const validRoute = origin.trim() && destination.trim() && origin.trim().toLowerCase() !== destination.trim().toLowerCase();
  const qrText = useMemo(() => [
    'NUMOB GROUP PASS', `Pass: ${bookingCode}`, `Group: ${groupName || 'Group trip'}`,
    `Route: ${origin || 'Not set'} to ${destination || 'Not set'}`, `Date: ${date || 'Not set'}`,
    `People: ${people}`, `Vehicle: ${vehicle?.name || 'Not selected'}`,
    `Organizer: ${organizer || 'Not set'}`, `Estimated vehicle fare: ${vehicle ? money(vehicle.price) : 'Not calculated'}`,
    'Status: Prototype estimate - booking not confirmed'
  ].join('\n'), [bookingCode, groupName, origin, destination, date, people, vehicle, organizer]);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(qrText)}`;

  const reset = () => { setStage('people'); setVehicleId(''); setConfirmed(false); };
  const stepIndex = ({ people: 1, vehicle: 2, ticket: 3, pass: 4 } as Record<Stage, number>)[stage];

  return (
    <div className="mx-auto max-w-5xl space-y-6 animate-fade-in">
      <header className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-700 dark:text-cyan-300"><Users className="h-4 w-4"/> GROUP TRAVEL</div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Group Trips</h1>
        <p className="max-w-2xl text-sm text-slate-600 dark:text-slate-300">Tell us how many people are coming, choose a suitable vehicle, then prepare one NUMob group pass with a scannable QR code.</p>
      </header>

      <div className="grid grid-cols-4 gap-2" aria-label="Booking progress">
        {[['1','Group size'],['2','Vehicle'],['3','Ticket'],['4','NUMob pass']].map(([n,label], i) => (
          <div key={n} className={`rounded-xl border p-3 transition-all duration-300 ${stepIndex === i + 1 ? 'border-cyan-500 bg-cyan-500/10 shadow-sm' : stepIndex > i + 1 ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-slate-200 dark:border-slate-700'}`}>
            <div className="flex items-center gap-2"><span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${stepIndex > i + 1 ? 'bg-emerald-500 text-white' : stepIndex === i + 1 ? 'bg-cyan-500 text-slate-950' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>{stepIndex > i + 1 ? <Check className="h-3.5 w-3.5"/> : n}</span><span className="hidden text-xs font-medium text-slate-700 dark:text-slate-200 sm:inline">{label}</span></div>
          </div>
        ))}
      </div>

      {stage === 'people' && <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5 dark:border-slate-700 dark:bg-slate-900">
        <div className="bg-gradient-to-br from-cyan-500/15 via-blue-500/10 to-transparent p-6 sm:p-9">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500 text-white shadow-lg shadow-cyan-500/25"><Users className="h-7 w-7"/></div>
          <p className="text-sm font-semibold text-cyan-700 dark:text-cyan-300">LET'S GET EVERYONE THERE</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">How many people are coming?</h2>
          <p className="mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-300">Choose your group size. We’ll only show vehicles with enough seats for everyone.</p>
          <div className="mt-7 flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-950/60 sm:p-6">
            <div><p className="text-sm font-medium text-slate-700 dark:text-slate-200">Total passengers</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Adults and children together</p></div>
            <div className="flex items-center gap-4"><button aria-label="Remove one person" disabled={people <= 1} onClick={() => setPeople((n) => Math.max(1,n-1))} className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-300 text-slate-700 transition hover:border-cyan-500 hover:text-cyan-600 disabled:opacity-30 dark:border-slate-600 dark:text-white"><Minus className="h-4 w-4"/></button><div key={people} className="min-w-12 text-center animate-slide-up"><span className="text-4xl font-black tabular-nums text-slate-900 dark:text-white">{people}</span></div><button aria-label="Add one person" disabled={people >= 60} onClick={() => setPeople((n) => Math.min(60,n+1))} className="flex h-11 w-11 items-center justify-center rounded-full bg-cyan-500 text-slate-950 transition hover:bg-cyan-400 disabled:opacity-30"><Plus className="h-4 w-4"/></button></div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2"><label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Starting point<input value={origin} onChange={(e) => setOrigin(e.target.value)} placeholder="e.g. Kochi" className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600 dark:bg-slate-950 dark:text-white"/></label><label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Destination<input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="e.g. Munnar" className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600 dark:bg-slate-950 dark:text-white"/></label><label className="block text-sm font-medium text-slate-700 dark:text-slate-200 sm:col-span-2">Travel date<input type="date" min={new Date().toISOString().slice(0,10)} value={date} onChange={(e) => setDate(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-cyan-500 dark:border-slate-600 dark:bg-slate-950 dark:text-white"/></label></div>
          <button disabled={!validRoute || !date} onClick={() => setStage('vehicle')} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 px-5 py-3.5 font-bold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-40">Find vehicles <ArrowRight className="h-5 w-5"/></button>
          {(!validRoute || !date) && <p className="mt-2 text-center text-xs text-slate-500 dark:text-slate-400">Enter different start and destination locations and a travel date to continue.</p>}
        </div>
      </section>}

      {stage === 'vehicle' && <section className="space-y-5">
        <button onClick={() => setStage('people')} className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-cyan-600 dark:text-slate-300"><ArrowLeft className="h-4 w-4"/> Back to group details</button>
        <div><h2 className="text-2xl font-bold text-slate-900 dark:text-white">Choose your group vehicle</h2><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{people} passengers · {origin} → {destination} · {date}</p></div>
        <div className="grid gap-4 md:grid-cols-2">{vehicles.filter((v) => v.seats >= people).map((v) => <button key={v.id} onClick={() => setVehicleId(v.id)} className={`rounded-2xl border p-5 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-lg ${vehicleId === v.id ? 'border-cyan-500 bg-cyan-500/10 ring-2 ring-cyan-500/20' : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'}`}><div className="flex items-start justify-between"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-300">{v.kind === 'Traveller' ? <Armchair className="h-6 w-6"/> : <Bus className="h-6 w-6"/>}</div>{vehicleId === v.id && <span className="rounded-full bg-cyan-500 px-2.5 py-1 text-xs font-bold text-slate-950">Selected</span>}</div><h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">{v.name}</h3><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{v.description}</p><div className="mt-4 flex items-end justify-between border-t border-slate-200 pt-4 dark:border-slate-700"><div><p className="text-xs text-slate-500 dark:text-slate-400">Capacity</p><p className="font-semibold text-slate-800 dark:text-white">Up to {v.seats} people</p></div><div className="text-right"><p className="text-xs text-slate-500 dark:text-slate-400">Illustrative vehicle estimate</p><p className="text-xl font-black text-slate-900 dark:text-white">{money(v.price)}</p></div></div></button>)}</div>
        {vehicles.every((v) => v.seats < people) && <div className="rounded-2xl border border-amber-400/40 bg-amber-500/10 p-5 text-sm text-slate-700 dark:text-slate-200">No vehicle option fits this group size. Please reduce the passenger count or contact the operator for a larger vehicle.</div>}
        <button disabled={!vehicle} onClick={() => setStage('ticket')} className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 px-5 py-3.5 font-bold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-40">Continue to ticket details <ArrowRight className="h-5 w-5"/></button>
      </section>}

      {stage === 'ticket' && vehicle && <section className="mx-auto max-w-2xl space-y-5">
        <button onClick={() => setStage('vehicle')} className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-cyan-600 dark:text-slate-300"><ArrowLeft className="h-4 w-4"/> Change vehicle</button>
        <div><h2 className="text-2xl font-bold text-slate-900 dark:text-white">Create your group ticket</h2><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Add the group and organiser details for the NUMob pass.</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900"><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium text-slate-700 dark:text-slate-200">Group name<input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="e.g. College trip" className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-slate-900 outline-none focus:border-cyan-500 dark:border-slate-600 dark:bg-slate-950 dark:text-white"/></label><label className="text-sm font-medium text-slate-700 dark:text-slate-200">Organiser name<input value={organizer} onChange={(e) => setOrganizer(e.target.value)} placeholder="Person responsible" className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-slate-900 outline-none focus:border-cyan-500 dark:border-slate-600 dark:bg-slate-950 dark:text-white"/></label></div><div className="mt-5 space-y-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-950"><div className="flex justify-between gap-3 text-sm"><span className="text-slate-500 dark:text-slate-400">Route</span><span className="text-right font-semibold text-slate-900 dark:text-white">{origin} → {destination}</span></div><div className="flex justify-between gap-3 text-sm"><span className="text-slate-500 dark:text-slate-400">Date and passengers</span><span className="text-right font-semibold text-slate-900 dark:text-white">{date} · {people} people</span></div><div className="flex justify-between gap-3 text-sm"><span className="text-slate-500 dark:text-slate-400">Vehicle</span><span className="font-semibold text-slate-900 dark:text-white">{vehicle.name}</span></div><div className="flex justify-between gap-3 border-t border-slate-200 pt-3 dark:border-slate-700"><span className="font-semibold text-slate-800 dark:text-white">Estimated vehicle total</span><span className="text-xl font-black text-slate-900 dark:text-white">{money(vehicle.price)}</span></div></div><p className="mt-3 text-xs leading-relaxed text-amber-700 dark:text-amber-300">Prototype estimate only. This does not reserve a vehicle or confirm an operator, ticket, or final fare.</p><button onClick={() => { setConfirmed(true); setStage('pass'); }} disabled={!groupName.trim() || !organizer.trim()} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 px-5 py-3.5 font-bold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-40"><Ticket className="h-5 w-5"/> Generate NUMob group pass</button></div>
      </section>}

      {stage === 'pass' && vehicle && confirmed && <section className="mx-auto max-w-2xl space-y-5"><div className="text-center"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600"><Check className="h-8 w-8"/></div><h2 className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">Your NUMob group pass is ready</h2><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">This is a prototype pass with the key trip details encoded in the QR.</p></div>
        <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900"><div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-5 text-slate-950"><div className="flex items-center justify-between"><div><p className="text-xs font-bold tracking-[0.2em]">TRAVBUD · NUMOB</p><h3 className="mt-1 text-2xl font-black">{groupName}</h3></div><QrCode className="h-8 w-8"/></div><p className="mt-3 text-sm font-semibold">{origin} → {destination}</p></div><div className="grid gap-6 p-5 sm:grid-cols-[1fr_180px]"><div className="space-y-4"><div><p className="text-xs text-slate-500 dark:text-slate-400">PASS CODE</p><p className="text-xl font-black tracking-wider text-slate-900 dark:text-white">{bookingCode}</p></div><div className="grid grid-cols-2 gap-3"><div><p className="text-xs text-slate-500 dark:text-slate-400">Date</p><p className="mt-1 font-semibold text-slate-900 dark:text-white"><CalendarDays className="mr-1 inline h-4 w-4"/>{date}</p></div><div><p className="text-xs text-slate-500 dark:text-slate-400">Group size</p><p className="mt-1 font-semibold text-slate-900 dark:text-white"><Users className="mr-1 inline h-4 w-4"/>{people} people</p></div><div><p className="text-xs text-slate-500 dark:text-slate-400">Vehicle</p><p className="mt-1 font-semibold text-slate-900 dark:text-white">{vehicle.name}</p></div><div><p className="text-xs text-slate-500 dark:text-slate-400">Organiser</p><p className="mt-1 font-semibold text-slate-900 dark:text-white">{organizer}</p></div></div><div className="border-t border-dashed border-slate-300 pt-3 dark:border-slate-700"><p className="text-xs text-slate-500 dark:text-slate-400">Illustrative vehicle estimate</p><p className="text-2xl font-black text-slate-900 dark:text-white">{money(vehicle.price)}</p></div></div><div className="mx-auto text-center"><img src={qrUrl} alt="QR code containing the NUMob group pass details" className="h-44 w-44 rounded-xl border border-slate-200 bg-white p-1"/><p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Scan to read pass details</p></div></div><div className="border-t border-slate-200 bg-amber-50 px-5 py-3 text-xs leading-relaxed text-amber-900 dark:border-slate-700 dark:bg-amber-950/40 dark:text-amber-200">Demo pass only · vehicle and fare are not confirmed. QR encodes the pass details as text; production verification should use a secure booking ID and server-side validation.</div></article>
        <div className="flex flex-col gap-3 sm:flex-row"><button onClick={() => { void navigator.clipboard?.writeText(qrText); }} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"><Copy className="h-4 w-4"/> Copy pass details</button><button onClick={reset} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-3 font-bold text-slate-950 transition hover:bg-cyan-400"><RotateCcw className="h-4 w-4"/> Plan another group trip</button></div>
      </section>}
      <p className="flex items-start gap-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400"><MapPin className="mt-0.5 h-4 w-4 shrink-0"/> Vehicle prices shown are illustrative demo values, not live quotes. The QR image needs an internet connection to load. Real booking, payment, operator availability and secure scan verification are not connected yet.</p>
    </div>
  );
}
