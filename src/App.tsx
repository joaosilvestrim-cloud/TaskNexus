import { LayoutGrid, Loader2 } from 'lucide-react';
import { Sidebar } from './components/sidebar/Sidebar';
import { MainContent } from './components/shared/MainContent';
import { AuthScreen } from './components/auth/AuthScreen';
import { useSupabaseSync } from './hooks/useSupabaseSync';

export default function App() {
  const { loading, user } = useSupabaseSync();

  // Loading splash
  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
            <LayoutGrid size={24} className="text-white" />
          </div>
          <Loader2 size={20} className="animate-spin text-indigo-400" />
          <p className="text-sm text-gray-400">Carregando TaskNexus...</p>
        </div>
      </div>
    );
  }

  // Not authenticated → show login
  if (!user) {
    return <AuthScreen />;
  }

  // Authenticated → main app
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <MainContent />
    </div>
  );
}
