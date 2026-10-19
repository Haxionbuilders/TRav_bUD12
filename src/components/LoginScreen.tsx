import { useState, FormEvent, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Plane, Sun, Moon, Loader2, MapPin, Compass, Globe, MailCheck } from 'lucide-react';

export default function LoginScreen() {
  const { signIn, signUp, signInWithGoogle, resendConfirmation } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmationEmail, setConfirmationEmail] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const authError = params.get('error_description') || params.get('error');
    if (authError) { setError(authError.replace(/\+/g, ' ')); }
  }, []);

  const handleGoogle = async () => {
    setError(null); setMessage(null); setLoading(true);
    const result = await signInWithGoogle();
    if (result.error) { setError(result.error); setLoading(false); }
  };

  const handleResend = async () => {
    if (!confirmationEmail) return;
    setLoading(true); setError(null); setMessage(null);
    const result = await resendConfirmation(confirmationEmail);
    setLoading(false);
    if (result.error) setError(result.error); else setMessage('Confirmation email sent again. Check your inbox, Spam, and Promotions/Other folders.');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    const fn = mode === 'signin' ? signIn : signUp;
    const result = await fn(email, password);
    setLoading(false);
    if (result.error) {
      if (result.error.toLowerCase().includes('email not confirmed') || result.error.toLowerCase().includes('email_not_confirmed')) {
        setConfirmationEmail(email);
        setMessage('This account still needs email verification. Check your Inbox, Spam, and Promotions/Other folders, or resend the confirmation email below.');
      } else { setError(result.error); }
    } else if (mode === 'signup' && 'confirmationRequired' in result && result.confirmationRequired) {
      setConfirmationEmail(email);
      setMessage('Account created. Verify your email before signing in. Check your Inbox, Spam, and Promotions/Other folders. Open the confirmation email on this device if possible.');
    } else {
      setMessage(mode === 'signup' ? 'Account created successfully.' : 'Signed in successfully.');
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
              onClick={() => { setMode('signin'); setError(null); setMessage(null); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                mode === 'signin'
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode('signup'); setError(null); setMessage(null); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                mode === 'signup'
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>

          <button type="button" onClick={() => void handleGoogle()} disabled={loading} className="w-full mb-4 flex items-center justify-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/60 px-4 py-3 font-semibold text-slate-800 dark:text-white hover:bg-white dark:hover:bg-slate-800 disabled:opacity-50">
            <GoogleMark /> Continue with Google
          </button>
          <div className="flex items-center gap-3 mb-4 text-xs text-slate-400"><span className="h-px flex-1 bg-slate-200 dark:bg-slate-700"/><span>or use email</span><span className="h-px flex-1 bg-slate-200 dark:bg-slate-700"/></div>

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
              <div role="alert" className="text-sm text-red-500 dark:text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
                {error}
              </div>
            )}
            {message && (
              <div role="status" className="text-sm text-emerald-800 dark:text-emerald-200 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-3">
                <div className="flex gap-2"><MailCheck className="w-5 h-5 shrink-0"/><span>{message}</span></div>
                {confirmationEmail && <button type="button" onClick={() => void handleResend()} disabled={loading} className="mt-3 font-semibold underline disabled:opacity-50">Resend confirmation email</button>}
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
              onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null); setMessage(null); }}
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

function GoogleMark() {
  return <svg aria-hidden="true" viewBox="0 0 48 48" className="w-5 h-5"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.76 7.18l7.73 6C44.42 38.06 46.98 31.86 46.98 24.55z"/><path fill="#FBBC05" d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.52 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.14 1.45-4.89 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>;
}
