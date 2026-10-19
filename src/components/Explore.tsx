import { useState } from 'react';
import { destinations } from '@/data/destinations';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import type { Destination } from '@/types';
import { Search, Bookmark, MapPin, Calendar, DollarSign, X, Check } from 'lucide-react';

export default function Explore() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState<string | null>(null);
  const [selected, setSelected] = useState<Destination | null>(null);

  const allTags = ['all', ...new Set(destinations.flatMap((d) => d.tags))];

  const filtered = destinations.filter((d) => {
    const matchesQuery = !query ||
      d.name.toLowerCase().includes(query.toLowerCase()) ||
      d.country.toLowerCase().includes(query.toLowerCase());
    const matchesFilter = filter === 'all' || d.tags.includes(filter);
    return matchesQuery && matchesFilter;
  });

  const handleSave = async (dest: Destination) => {
    setSaving(dest.id);
    const { error } = await supabase.from('saved_destinations').insert({
      name: dest.name,
      country: dest.country,
      image_url: dest.image,
      description: dest.description,
    });
    if (!error) {
      setSaved((prev) => new Set([...prev, dest.id]));
    }
    setSaving(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-1">Explore Destinations</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Discover your next adventure from around the world</p>
      </div>

      {/* Search bar */}
      <div className="glass p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by city or country..."
            className="glass-input w-full pl-11 pr-4 py-3 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
          />
        </div>
      </div>

      {/* Tag filters */}
      <div className="flex gap-2 flex-wrap">
        {allTags.map((tag) => (
          <button
            key={tag}
            onClick={() => setFilter(tag)}
            className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-all ${
              filter === tag
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                : 'glass-button text-slate-600 dark:text-slate-300'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Destination grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((dest, i) => (
          <div
            key={dest.id}
            className="glass-card overflow-hidden cursor-pointer animate-slide-up"
            style={{ animationDelay: `${i * 50}ms` }}
            onClick={() => setSelected(dest)}
          >
            <div className="relative h-48 overflow-hidden">
              <img
                src={dest.image}
                alt={dest.name}
                className="w-full h-full object-cover hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <button
                onClick={(e) => { e.stopPropagation(); handleSave(dest); }}
                disabled={saved.has(dest.id) || saving === dest.id}
                className="absolute top-3 right-3 p-2.5 rounded-xl backdrop-blur-md bg-white/20 hover:bg-white/40 transition-all disabled:opacity-70"
              >
                {saved.has(dest.id) ? (
                  <Check className="w-4 h-4 text-white" />
                ) : (
                  <Bookmark className="w-4 h-4 text-white" />
                )}
              </button>
              <div className="absolute bottom-3 left-3">
                <h3 className="text-lg font-bold text-white">{dest.name}</h3>
                <p className="text-white/80 text-xs flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {dest.country}
                </p>
              </div>
            </div>
            <div className="p-4">
              <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 mb-3">{dest.description}</p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {dest.tags.map((tag) => (
                  <span key={tag} className="px-2 py-0.5 rounded-md text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {dest.bestTime}</span>
                <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" /> {dest.avgBudget}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <Search className="w-10 h-10 text-slate-400 dark:text-slate-500 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400">No destinations found matching your search</p>
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in"
          onClick={() => setSelected(null)}
        >
          <div
            className="glass-strong max-w-2xl w-full max-h-[85vh] overflow-y-auto scrollbar-hide animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-64">
              <img src={selected.image} alt={selected.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <button
                onClick={() => setSelected(null)}
                className="absolute top-4 right-4 p-2.5 rounded-xl backdrop-blur-md bg-white/20 hover:bg-white/40 transition-all"
              >
                <X className="w-5 h-5 text-white" />
              </button>
              <div className="absolute bottom-4 left-4">
                <h2 className="text-2xl font-bold text-white">{selected.name}</h2>
                <p className="text-white/80 flex items-center gap-1.5 mt-1">
                  <MapPin className="w-4 h-4" /> {selected.country}
                </p>
              </div>
            </div>
            <div className="p-6">
              <p className="text-slate-600 dark:text-slate-300 mb-4">{selected.description}</p>
              <div className="flex flex-wrap gap-2 mb-5">
                {selected.tags.map((tag) => (
                  <span key={tag} className="px-3 py-1 rounded-full text-sm font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="glass p-4 rounded-xl">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs mb-1">
                    <Calendar className="w-4 h-4" /> Best Time to Visit
                  </div>
                  <p className="text-slate-800 dark:text-white font-medium">{selected.bestTime}</p>
                </div>
                <div className="glass p-4 rounded-xl">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs mb-1">
                    <DollarSign className="w-4 h-4" /> Average Budget
                  </div>
                  <p className="text-slate-800 dark:text-white font-medium">{selected.avgBudget}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleSave(selected)}
                  disabled={saved.has(selected.id) || saving === selected.id}
                  className="flex-1 py-3 rounded-xl bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saved.has(selected.id) ? (
                    <><Check className="w-5 h-5" /> Saved!</>
                  ) : (
                    <><Bookmark className="w-5 h-5" /> Save Destination</>
                  )}
                </button>
                <button
                  onClick={() => setSelected(null)}
                  className="px-6 py-3 rounded-xl glass-button text-slate-700 dark:text-slate-200 font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
