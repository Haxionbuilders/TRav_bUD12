import { useState } from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import LoginScreen from '@/components/LoginScreen';
import Sidebar, { type Page } from '@/components/Sidebar';
import Dashboard from '@/components/Dashboard';
import NearbyAgents from '@/components/NearbyAgents';
import Trips from '@/components/Trips';
import Profile from '@/components/Profile';
import MobilityHub from '@/components/MobilityHub';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { user, loading } = useAuth();
  const [page, setPage] = useState<Page>('mobility');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen">
      <Sidebar currentPage={page} onNavigate={setPage} />
      <main className="lg:ml-64 pt-20 lg:pt-6 pb-24 lg:pb-6 px-4 lg:px-8 max-w-7xl">
        {page === 'dashboard' && <Dashboard onNavigate={setPage} />}
        {page === 'nearby' && <NearbyAgents onNavigate={setPage} />}
        {page === 'trips' && <Trips />}
        {page === 'profile' && <Profile />}
        {page === 'mobility' && <MobilityHub />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
