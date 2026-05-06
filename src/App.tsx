import { useEffect, useState, useCallback } from 'react';
import { LayoutGrid, Loader2 } from 'lucide-react';
import { Sidebar } from './components/sidebar/Sidebar';
import { MainContent } from './components/shared/MainContent';
import { AuthScreen } from './components/auth/AuthScreen';
import { GlobalSearch } from './components/shared/GlobalSearch';
import { PomodoroTimer } from './components/shared/PomodoroTimer';
import { QuickAddModal } from './components/shared/QuickAddModal';
import { useSupabaseSync } from './hooks/useSupabaseSync';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useStore } from './store/useStore';

function AppInner() {
  const { tasks } = useStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const openSearch   = useCallback(() => setSearchOpen(true), []);
  const openQuickAdd = useCallback(() => setQuickAddOpen(true), []);

  useKeyboardShortcuts(openSearch, openQuickAdd);

  // ── Push notifications for tasks due within next 60 min ──
  useEffect(() => {
    if (!('Notification' in window)) return;

    const requestAndSchedule = async () => {
      let perm = Notification.permission;
      if (perm === 'default') {
        perm = await Notification.requestPermission();
      }
      if (perm !== 'granted') return;

      const now = new Date();
      const in60 = new Date(now.getTime() + 60 * 60 * 1000);
      const todayStr = now.toISOString().split('T')[0];

      tasks.forEach(t => {
        if (t.completed || !t.dueDate || !t.dueTime) return;
        if (t.dueDate !== todayStr) return;

        const [h, m] = t.dueTime.split(':').map(Number);
        const dueDateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0);
        const delay = dueDateTime.getTime() - now.getTime();

        if (delay > 0 && dueDateTime <= in60) {
          setTimeout(() => {
            new Notification('TaskNexus', {
              body: `"${t.title}" vence em breve`,
              icon: '/favicon.ico',
            });
          }, delay);
        }
      });
    };

    requestAndSchedule();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only on mount

  return (
    <>
      <div className="flex h-screen w-screen overflow-hidden bg-[var(--c-bg)]">
        <Sidebar />
        <MainContent />
      </div>
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
      <QuickAddModal open={quickAddOpen} onClose={() => setQuickAddOpen(false)} />
      <PomodoroTimer />
    </>
  );
}

export default function App() {
  const { loading, user } = useSupabaseSync();
  const theme = useStore((s) => s.theme);

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

  return <AppInner />;
}
