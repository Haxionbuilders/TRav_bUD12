import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { destinations } from '@/data/destinations';
import type { Trip, TripStatus } from '@/types';
import {
  Plus, MapPin, Calendar, DollarSign, X, Trash2, Check,
  Loader2, Plane, ListChecks, Route
} from 'lucide-react';

const statusOptions: TripStatus[] = ['planning', 'upcoming', 'ongoing', 'completed'];
type MobilityTrip = { id: string; booking_code: string; booking_type: string; origin: string; destination: string; total_fare: number; status: string; created_at: string; details: Record<string, unknown> };
const money = (amount: number) => `₹${Math.round(amount).toLocaleString('en-IN')}`;

export default function Trips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [mobilityTrips, setMobilityTrips] = useState<MobilityTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);

  const fetchTrips = useCallback(async () => {
    setLoading(true);
    const [{ data }, { data: mobilityData }] = await Promise.all([
      supabase.from('trips').select('*').order('created_at', { ascending: false }),
      supabase.from('mobility_bookings').select('id, booking_code, booking_type, origin, destination, total_fare, status, created_at, details').order('created_at', { ascending: false }).limit(50),
    ]);
    setTrips(data ?? []);
    setMobilityTrips((mobilityData ?? []) as MobilityTrip[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchTrips(); }, [fetchTrips]);

  const handleDelete = async (id: string) => {
    await supabase.from('trips').delete().eq('id', id);
    setTrips((prev) => prev.filter((t) => t.id !== id));
  };

  const handleSave = async (trip: Omit<Trip, 'id' | 'user_id' | 'created_at'>) => {
    if (editingTrip) {
      await supabase.from('trips').update(trip).eq('id', editingTrip.id);
    } else {
      await supabase.from('trips').insert(trip);
    }
    setShowForm(false);
    setEditingTrip(null);
    fetchTrips();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-1">My Trips</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Plan, track, and relive your adventures</p>
        </div>
        <button
          onClick={() => { setEditingTrip(null); setShowForm(true); }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-500 text-white font-medium hover:bg-blue-600 shadow-lg shadow-blue-500/20 transition-all hover:scale-105"
        >
          <Plus className="w-5 h-5" /> New Trip
        </button>
      </div>

      {/* Book & Mobility selections are surfaced here as trip records */}
      <section className="space-y-3">
        <div className="flex items-center gap-2"><Route className="w-5 h-5 text-blue-600"/><h2 className="text-lg font-bold text-slate-900 dark:text-white">Book & Mobility trips</h2><span className="rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 px-2 py-0.5 text-xs">{mobilityTrips.length}</span></div>
        {mobilityTrips.length === 0 ? <div className="glass rounded-2xl p-5"><p className="text-sm text-slate-600 dark:text-slate-300">Your journey passes, Hire a Bud requests and Radar Cargo quotes will appear here after you create them in Book & Mobility.</p></div> : <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">{mobilityTrips.map((trip) => <article key={trip.id} className="glass-card rounded-2xl p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs uppercase tracking-wide text-blue-600">{trip.booking_type.replaceAll('_', ' ')}</p><h3 className="mt-1 font-bold text-slate-900 dark:text-white">{trip.booking_code}</h3></div><span className="rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-200 px-2 py-1 text-xs">{trip.status}</span></div><p className="mt-3 text-sm text-slate-700 dark:text-slate-200">{trip.origin} <span className="text-blue-500">→</span> {trip.destination}</p><div className="mt-4 flex items-center justify-between border-t border-slate-200/60 dark:border-slate-700 pt-3"><span className="text-xs text-slate-500 dark:text-slate-400">{new Date(trip.created_at).toLocaleDateString()}</span><span className="font-bold text-slate-900 dark:text-white">{money(Number(trip.total_fare))}</span></div><p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Prototype estimate · not a confirmed booking</p></article>)}</div>}
      </section>

      {/* Trips grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card p-6 h-72 animate-pulse">
              <div className="h-32 rounded-xl bg-slate-200/40 dark:bg-white/5 mb-4" />
              <div className="h-4 rounded bg-slate-200/40 dark:bg-white/5 mb-2" />
              <div className="h-3 rounded bg-slate-200/40 dark:bg-white/5 w-2/3" />
            </div>
          ))}
        </div>
      ) : trips.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
            <Plane className="w-8 h-8 text-blue-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">No trips yet</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">Start planning your first adventure today</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors"
          >
            <Plus className="w-5 h-5" /> Create Trip
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {trips.map((trip, i) => (
            <div
              key={trip.id}
              className="glass-card overflow-hidden animate-slide-up"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="relative h-40 overflow-hidden">
                <img
                  src={trip.cover_image ?? destinations[i % destinations.length].image}
                  alt={trip.destination}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute top-3 left-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize backdrop-blur-md ${
                    trip.status === 'completed' ? 'bg-slate-500/40 text-white' :
                    trip.status === 'ongoing' ? 'bg-emerald-500/40 text-white' :
                    trip.status === 'upcoming' ? 'bg-amber-500/40 text-white' :
                    'bg-blue-500/40 text-white'
                  }`}>
                    {trip.status}
                  </span>
                </div>
                <button
                  onClick={() => handleDelete(trip.id)}
                  className="absolute top-3 right-3 p-2 rounded-lg backdrop-blur-md bg-red-500/30 hover:bg-red-500/60 transition-all"
                >
                  <Trash2 className="w-4 h-4 text-white" />
                </button>
                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="text-base font-bold text-white truncate">{trip.title}</h3>
                  <p className="text-white/80 text-xs flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {trip.destination}
                  </p>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-3">
                  {trip.start_date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(trip.start_date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                  {trip.budget != null && (
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5" /> {trip.budget.toLocaleString()}
                    </span>
                  )}
                </div>
                {trip.notes && (
                  <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 mb-3">{trip.notes}</p>
                )}
                <button
                  onClick={() => { setEditingTrip(trip); setShowForm(true); }}
                  className="w-full py-2 rounded-lg glass-button text-sm font-medium text-slate-700 dark:text-slate-200"
                >
                  Edit Trip
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Trip form modal */}
      {showForm && (
        <TripForm
          trip={editingTrip}
          onClose={() => { setShowForm(false); setEditingTrip(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

function TripForm({
  trip,
  onClose,
  onSave,
}: {
  trip: Trip | null;
  onClose: () => void;
  onSave: (trip: Omit<Trip, 'id' | 'user_id' | 'created_at'>) => void;
}) {
  const [title, setTitle] = useState(trip?.title ?? '');
  const [destination, setDestination] = useState(trip?.destination ?? '');
  const [startDate, setStartDate] = useState(trip?.start_date ?? '');
  const [endDate, setEndDate] = useState(trip?.end_date ?? '');
  const [budget, setBudget] = useState(trip?.budget?.toString() ?? '');
  const [status, setStatus] = useState<TripStatus>(trip?.status ?? 'planning');
  const [notes, setNotes] = useState(trip?.notes ?? '');
  const [coverImage, setCoverImage] = useState(trip?.cover_image ?? destinations[0].image);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!title || !destination) return;
    setSaving(true);
    await onSave({
      title,
      destination,
      start_date: startDate || null,
      end_date: endDate || null,
      budget: budget ? parseFloat(budget) : null,
      status,
      notes,
      cover_image: coverImage,
    });
    setSaving(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="glass-strong max-w-lg w-full max-h-[90vh] overflow-y-auto scrollbar-hide animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">
              {trip ? 'Edit Trip' : 'New Trip'}
            </h2>
            <button onClick={onClose} className="p-2 rounded-lg glass-button">
              <X className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Trip Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Summer in Japan"
                className="glass-input w-full px-4 py-2.5 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Destination</label>
              <input
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g. Tokyo, Japan"
                className="glass-input w-full px-4 py-2.5 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="glass-input w-full px-3 py-2.5 text-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="glass-input w-full px-3 py-2.5 text-slate-800 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Budget ($)</label>
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="2000"
                  className="glass-input w-full px-4 py-2.5 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TripStatus)}
                  className="glass-input w-full px-3 py-2.5 text-slate-800 dark:text-white"
                >
                  {statusOptions.map((s) => (
                    <option key={s} value={s} className="capitalize bg-white dark:bg-slate-800">{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Cover Image</label>
              <div className="grid grid-cols-4 gap-2">
                {destinations.slice(0, 8).map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setCoverImage(d.image)}
                    className={`relative rounded-lg overflow-hidden h-16 transition-all ${
                      coverImage === d.image ? 'ring-2 ring-blue-500' : 'opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={d.image} alt={d.name} className="w-full h-full object-cover" />
                    {coverImage === d.image && (
                      <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Things to remember, must-see places, etc."
                className="glass-input w-full px-4 py-2.5 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSubmit}
                disabled={!title || !destination || saving}
                className="flex-1 py-3 rounded-xl bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    <ListChecks className="w-5 h-5" />
                    {trip ? 'Save Changes' : 'Create Trip'}
                  </>
                )}
              </button>
              <button
                onClick={onClose}
                className="px-6 py-3 rounded-xl glass-button text-slate-700 dark:text-slate-200 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
