import { useEffect } from 'react';
import { LayoutGrid, Loader2 } from 'lucide-react';
import { Sidebar } from './components/sidebar/Sidebar';
import { MainContent } from './components/shared/MainContent';
import { AuthScreen } from './components/auth/AuthScreen';
import { useSupabaseSync } from './hooks/useSupabaseSync';
import { useStore } from './store/useStore';

export default function App() {
  const { loading, user } = useSupabaseSync();
  const theme = useStore((s) => s.theme);

  // Aplica classe dark no <html> na inicialização e quando muda
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[var(--c-bg)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
            <LayoutGrid size={24} className="text-white" />
          </div>
          <Loader2 size={20} className="animate-spin text-indigo-400" />
          <p className="text-sm text-[var(--c-text2)]">Carregando TaskNexus...</p>
        </div>
      </div>
    );
  }

  if (!user) return <AuthScreen />;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--c-bg)]">
      <Sidebar />
      <MainContent />
    </div>
  );
}
