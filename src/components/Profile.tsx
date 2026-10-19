import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import type { Trip, SavedDestination } from '@/types';
import {
  User, Mail, Plane, MapPin, Bookmark, Check, LogOut,
  Calendar, TrendingUp, Trash2
} from 'lucide-react';

export default function Profile() {
  const { user, signOut } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [saved, setSaved] = useState<SavedDestination[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const [{ data: tripsData }, { data: savedData }] = await Promise.all([
      supabase.from('trips').select('*').order('created_at', { ascending: false }),
      supabase.from('saved_destinations').select('*').order('created_at', { ascending: false }),
    ]);
    setTrips(tripsData ?? []);
    setSaved(savedData ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRemoveSaved = async (id: string) => {
    await supabase.from('saved_destinations').delete().eq('id', id);
    setSaved((prev) => prev.filter((s) => s.id !== id));
  };

  const completedTrips = trips.filter((t) => t.status === 'completed').length;
  const totalBudget = trips.reduce((sum, t) => sum + (t.budget ?? 0), 0);
  const visitedCount = saved.filter((s) => s.visited).length;
  const userName = user?.email?.split('@')[0] ?? 'Traveler';

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Profile</h1>

      {/* Profile card */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-5 flex-wrap">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-blue-500/25">
            {userName[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white capitalize">{userName}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-1">
              <Mail className="w-4 h-4" /> {user?.email}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Member since {new Date(user?.created_at ?? Date.now()).toLocaleDateString('en', { month: 'long', year: 'numeric' })}
            </p>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass-button text-red-500 hover:bg-red-500/10 font-medium text-sm transition-all"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <ProfileStat icon={Plane} label="Total Trips" value={trips.length} color="from-blue-500 to-cyan-500" />
        <ProfileStat icon={TrendingUp} label="Completed" value={completedTrips} color="from-emerald-500 to-teal-500" />
        <ProfileStat icon={Bookmark} label="Saved Places" value={saved.length} color="from-amber-500 to-orange-500" />
        <ProfileStat icon={MapPin} label="Visited" value={visitedCount} color="from-rose-500 to-pink-500" />
      </div>

      {/* Saved destinations */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Saved Destinations</h2>
          <span className="text-sm text-slate-400 dark:text-slate-500">{saved.length} places</span>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 rounded-xl bg-slate-200/40 dark:bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : saved.length === 0 ? (
          <div className="text-center py-10">
            <Bookmark className="w-8 h-8 text-slate-400 dark:text-slate-500 mx-auto mb-2" />
            <p className="text-sm text-slate-500 dark:text-slate-400">No saved destinations yet</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {saved.map((dest) => (
              <div key={dest.id} className="relative rounded-xl overflow-hidden group">
                <img
                  src={dest.image_url ?? ''}
                  alt={dest.name}
                  className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <button
                  onClick={() => handleRemoveSaved(dest.id)}
                  className="absolute top-2.5 right-2.5 p-2 rounded-lg backdrop-blur-md bg-red-500/30 hover:bg-red-500/60 transition-all"
                >
                  <Trash2 className="w-4 h-4 text-white" />
                </button>
                {dest.visited && (
                  <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-emerald-500/60 backdrop-blur-md text-white text-xs font-medium flex items-center gap-1">
                    <Check className="w-3 h-3" /> Visited
                  </span>
                )}
                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="text-sm font-bold text-white">{dest.name}</h3>
                  <p className="text-white/70 text-xs flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {dest.country}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Trip history */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Trip History</h2>
        {trips.length === 0 ? (
          <div className="text-center py-10">
            <Calendar className="w-8 h-8 text-slate-400 dark:text-slate-500 mx-auto mb-2" />
            <p className="text-sm text-slate-500 dark:text-slate-400">No trips yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {trips.map((trip) => (
              <div key={trip.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/40 dark:hover:bg-white/5 transition-colors">
                <img
                  src={trip.cover_image ?? ''}
                  alt={trip.destination}
                  className="w-12 h-12 rounded-lg object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{trip.title}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {trip.destination}
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                  trip.status === 'completed' ? 'bg-slate-500/15 text-slate-600 dark:text-slate-400' :
                  trip.status === 'ongoing' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' :
                  trip.status === 'upcoming' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' :
                  'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                }`}>
                  {trip.status}
                </span>
                {trip.budget != null && (
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-300 hidden sm:block">
                    ${trip.budget.toLocaleString()}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProfileStat({
  icon: Icon, label, value, color
}: {
  icon: typeof User; label: string; value: number; color: string;
}) {
  return (
    <div className="glass-card p-5">
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3 shadow-lg`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <p className="text-2xl font-bold text-slate-800 dark:text-white">{value}</p>
      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}
