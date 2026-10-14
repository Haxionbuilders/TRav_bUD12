import { useTheme } from '@/contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="glass-button p-2.5 group"
      aria-label="Toggle theme"
    >
      <div className="relative w-5 h-5">
        {theme === 'dark' ? (
          <Sun className="w-5 h-5 text-amber-400 transition-transform group-hover:rotate-45" />
        ) : (
          <Moon className="w-5 h-5 text-slate-700 transition-transform group-hover:-rotate-12" />
        )}
      </div>
    </button>
  );
}
