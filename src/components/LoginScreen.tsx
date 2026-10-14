import { useState, FormEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Plane, Sun, Moon, Loader2, MapPin, Compass, Globe } from 'lucide-react';

export default function LoginScreen() {
  const { signIn, signUp } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fn = mode === 'signin' ? signIn : signUp;
    const result = await fn(email, password);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Floating background icons */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <MapPin className="absolute top-[12%] left-[8%] w-8 h-8 text-blue-400/20 animate-pulse" style={{ animationDuration: '3s' }} />
        <Compass className="absolute top-[25%] right-[10%] w-10 h-10 text-emerald-400/20 animate-pulse" style={{ animationDuration: '4s' }} />
        <Globe className="absolute bottom-[15%] left-[15%] w-12 h-12 text-teal-400/20 animate-pulse" style={{ animationDuration: '5s' }} />
        <Plane className="absolute bottom-[30%] right-[12%] w-9 h-9 text-cyan-400/20 animate-pulse" style={{ animationDuration: '3.5s' }} />
      </div>

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 glass-button p-3 z-10"
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-700" />}
      </button>

      <div className="w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/30 mb-4">
            <Plane className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">TravBud</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">The new era of effortless travel</p>
        </div>

        {/* Auth card */}
        <div className="glass-strong p-8">
          <div className="flex gap-2 mb-6 p-1 glass rounded-xl">
            <button
              onClick={() => { setMode('signin'); setError(null); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                mode === 'signin'
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode('signup'); setError(null); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                mode === 'signup'
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="glass-input w-full px-4 py-3 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="••••••••"
                className="glass-input w-full px-4 py-3 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
              />
            </div>

            {error && (
              <div className="text-sm text-red-500 dark:text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                mode === 'signin' ? 'Welcome Back' : 'Start Your Journey'
              )}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-6">
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null); }}
              className="text-blue-500 dark:text-blue-400 font-medium hover:underline"
            >
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
