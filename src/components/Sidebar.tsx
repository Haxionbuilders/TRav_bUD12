import { Plane, Home, MapPinned, User, LogOut, Route, UsersRound } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import ThemeToggle from './ThemeToggle';

export type Page = 'dashboard' | 'nearby' | 'trips' | 'profile' | 'mobility';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

const navItems: { page: Page; label: string; icon: typeof Home }[] = [
  { page: 'mobility', label: 'Book & Mobility', icon: Route },
  { page: 'trips', label: 'My Trips', icon: MapPinned },
  { page: 'nearby', label: 'Nearby TravBuds', icon: UsersRound },
  { page: 'dashboard', label: 'Overview', icon: Home },
  { page: 'profile', label: 'Profile', icon: User },
];

export default function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const { user, signOut } = useAuth();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 fixed left-0 top-0 h-screen p-4 z-30">
        <div className="glass flex-1 flex flex-col p-5">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8 px-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Plane className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-800 dark:text-white">TravBud</span>
          </div>

          {/* Nav */}
          <nav className="flex-1 space-y-1">
            {navItems.map(({ page, label, icon: Icon }) => (
              <button
                key={page}
                onClick={() => onNavigate(page)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  currentPage === page
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-white/40 dark:hover:bg-white/5'
                }`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </button>
            ))}
          </nav>

          {/* User section */}
          <div className="border-t border-white/20 dark:border-white/10 pt-4 mt-4">
            <div className="flex items-center gap-3 px-3 py-2 mb-2">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-medium text-sm">
                {user?.email?.[0]?.toUpperCase() ?? 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                  {user?.email ?? 'User'}
                </p>
              </div>
            </div>
            <button
              onClick={signOut}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-red-500/10 hover:text-red-500 transition-all"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-30 p-3">
        <div className="glass flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Plane className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-bold text-slate-800 dark:text-white">TravBud</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button onClick={signOut} className="glass-button p-2">
              <LogOut className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 p-3">
        <div className="glass flex items-center justify-around py-2">
          {navItems.map(({ page, icon: Icon }) => (
            <button
              key={page}
              onClick={() => onNavigate(page)}
              className={`p-2.5 rounded-xl transition-all ${
                currentPage === page
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Icon className="w-5 h-5" />
            </button>
          ))}
        </div>
      </nav>
    </>
  );
}
