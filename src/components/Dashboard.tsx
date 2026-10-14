import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import type { Trip, SavedDestination } from '@/types';
import { destinations } from '@/data/destinations';
import ThemeToggle from './ThemeToggle';
import {
  Plane, MapPin, Calendar, DollarSign, TrendingUp, Bookmark,
  Compass, Sun, Cloud, MapPinned, ArrowRight, Sparkles
} from 'lucide-react';
import type { Page } from './Sidebar';

export default function Dashboard({ onNavigate }: { onNavigate: (page: Page) => void }) {
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [savedCount, setSavedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: tripsData }, { count }] = await Promise.all([
        supabase.from('trips').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('saved_destinations').select('*', { count: 'exact', head: true }),
      ]);
      setTrips(tripsData ?? []);
      setSavedCount(count ?? 0);
      setLoading(false);
    })();
  }, []);

  const upcomingTrip = trips.find((t) => t.status === 'upcoming' || t.status === 'planning');
  const totalBudget = trips.reduce((sum, t) => sum + (t.budget ?? 0), 0);
  const visitedCount = trips.filter((t) => t.status === 'completed').length;
  const userName = user?.email?.split('@')[0] ?? 'Traveler';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Welcome back,</p>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white capitalize">{userName}</h1>
        </div>
        <div className="hidden lg:block">
          <ThemeToggle />
        </div>
      </div>

      {/* Stats widgets row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatWidget
          icon={Plane}
          label="Total Trips"
          value={trips.length.toString()}
          color="from-blue-500 to-cyan-500"
          delay="0ms"
        />
        <StatWidget
          icon={MapPin}
          label="Destinations Saved"
          value={savedCount.toString()}
          color="from-emerald-500 to-teal-500"
          delay="50ms"
        />
        <StatWidget
          icon={DollarSign}
          label="Total Budget"
          value={`$${totalBudget.toLocaleString()}`}
          color="from-amber-500 to-orange-500"
          delay="100ms"
        />
        <StatWidget
          icon={TrendingUp}
          label="Trips Completed"
          value={visitedCount.toString()}
          color="from-rose-500 to-pink-500"
          delay="150ms"
        />
      </div>

      {/* Main content grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Upcoming trip widget */}
        <div className="lg:col-span-2 glass-card p-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Next Adventure</h2>
            <button
              onClick={() => onNavigate('trips')}
              className="text-sm text-blue-500 dark:text-blue-400 font-medium flex items-center gap-1 hover:gap-2 transition-all"
            >
              View All <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {upcomingTrip ? (
            <div className="relative rounded-2xl overflow-hidden h-64 group">
              <img
                src={upcomingTrip.cover_image ?? destinations[0].image}
                alt={upcomingTrip.destination}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <span className="inline-block px-3 py-1 rounded-full bg-blue-500/80 backdrop-blur-sm text-white text-xs font-medium mb-2">
                  {upcomingTrip.status}
                </span>
                <h3 className="text-xl font-bold text-white">{upcomingTrip.title}</h3>
                <p className="text-white/80 text-sm flex items-center gap-1.5 mt-1">
                  <MapPin className="w-4 h-4" /> {upcomingTrip.destination}
                </p>
                {upcomingTrip.start_date && (
                  <p className="text-white/70 text-xs flex items-center gap-1.5 mt-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(upcomingTrip.start_date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                    {upcomingTrip.end_date && ` — ${new Date(upcomingTrip.end_date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}`}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border-2 border-dashed border-slate-300/30 dark:border-white/10 p-12 text-center">
              <Compass className="w-10 h-10 text-slate-400 dark:text-slate-500 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400 text-sm">No upcoming trips yet</p>
              <button
                onClick={() => onNavigate('trips')}
                className="mt-4 px-5 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors"
              >
                Plan Your First Trip
              </button>
            </div>
          )}
        </div>

        {/* Weather widget */}
        <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '250ms' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Weather</h2>
            <Sun className="w-5 h-5 text-amber-400" />
          </div>
          <div className="space-y-3">
            {[
              { city: 'Santorini', temp: '26°', cond: 'Sunny', icon: Sun, color: 'text-amber-400' },
              { city: 'Tokyo', temp: '18°', cond: 'Cloudy', icon: Cloud, color: 'text-slate-400' },
              { city: 'Bali', temp: '31°', cond: 'Sunny', icon: Sun, color: 'text-amber-400' },
              { city: 'Dubai', temp: '34°', cond: 'Sunny', icon: Sun, color: 'text-orange-400' },
            ].map((w) => (
              <div key={w.city} className="flex items-center justify-between py-2.5 border-b border-slate-200/40 dark:border-white/5 last:border-0">
                <div className="flex items-center gap-3">
                  <w.icon className={`w-5 h-5 ${w.color}`} />
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{w.city}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{w.cond}</p>
                  </div>
                </div>
                <span className="text-lg font-semibold text-slate-700 dark:text-white">{w.temp}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent trips + Recommended destinations */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent trips */}
        <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '300ms' }}>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Recent Trips</h2>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-xl bg-slate-200/40 dark:bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : trips.length > 0 ? (
            <div className="space-y-3">
              {trips.slice(0, 4).map((trip) => (
                <div key={trip.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/40 dark:hover:bg-white/5 transition-colors">
                  <img
                    src={trip.cover_image ?? destinations[0].image}
                    alt={trip.destination}
                    className="w-14 h-14 rounded-xl object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{trip.title}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {trip.destination}
                    </p>
                  </div>
                  <StatusBadge status={trip.status} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <MapPinned className="w-8 h-8 text-slate-400 dark:text-slate-500 mx-auto mb-2" />
              <p className="text-sm text-slate-500 dark:text-slate-400">No trips planned yet</p>
            </div>
          )}
        </div>

        {/* Recommended destinations */}
        <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '350ms' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Trending Now</h2>
            <Sparkles className="w-5 h-5 text-amber-400" />
          </div>
          <div className="space-y-3">
            {destinations.slice(0, 4).map((dest) => (
              <div key={dest.id} className="flex items-center gap-4 p-2 rounded-xl hover:bg-white/40 dark:hover:bg-white/5 transition-colors cursor-pointer" onClick={() => onNavigate('explore')}>
                <img src={dest.image} alt={dest.name} className="w-14 h-14 rounded-xl object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-white">{dest.name}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">{dest.country} · {dest.avgBudget}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onNavigate('explore'); }}
                  className="p-2 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 transition-all"
                >
                  <Bookmark className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatWidget({
  icon: Icon, label, value, color, delay
}: {
  icon: typeof Plane; label: string; value: string; color: string; delay: string;
}) {
  return (
    <div className="glass-card p-5 animate-slide-up" style={{ animationDelay: delay }}>
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3 shadow-lg`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <p className="text-2xl font-bold text-slate-800 dark:text-white">{value}</p>
      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: Trip['status'] }) {
  const styles: Record<Trip['status'], string> = {
    planning: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
    upcoming: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    ongoing: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    completed: 'bg-slate-500/15 text-slate-600 dark:text-slate-400',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${styles[status]}`}>
      {status}
    </span>
  );
}
