import { Menu, Search, LayoutGrid } from 'lucide-react';
import { useStore } from '../../store/useStore';
import type { NavView } from '../../types';

function viewLabel(view: NavView, projects: { id: string; name: string }[]): string {
  if (view === 'inbox')    return 'Caixa de Entrada';
  if (view === 'today')    return 'Hoje';
  if (view === 'upcoming') return 'Em Breve';
  if (view === 'kanban')   return 'Kanban';
  if (view === 'calendar') return 'Calendário';
  if (view === 'focus')    return 'Modo Foco';
  if (typeof view === 'object' && view.type === 'project') {
    return projects.find(p => p.id === view.id)?.name ?? 'Projeto';
  }
  return 'TaskNexus';
}

export function MobileHeader({ onSearchOpen }: { onSearchOpen: () => void }) {
  const { setSidebarOpen, activeView, projects } = useStore();

  return (
    <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-[var(--c-sidebar)] border-b border-[var(--c-border)] shrink-0 z-10">
      <button
        onClick={() => setSidebarOpen(true)}
        className="p-1.5 rounded-lg text-[var(--c-text2)] hover:bg-[var(--c-hover)] transition-colors"
      >
        <Menu size={20} />
      </button>

      <div className="flex items-center gap-2 flex-1">
        <div className="w-6 h-6 bg-indigo-600 rounded-md flex items-center justify-center shrink-0">
          <LayoutGrid size={12} className="text-white" />
        </div>
        <span className="text-sm font-semibold text-[var(--c-text1)] truncate">
          {viewLabel(activeView, projects)}
        </span>
      </div>

      <button
        onClick={onSearchOpen}
        className="p-1.5 rounded-lg text-[var(--c-text2)] hover:bg-[var(--c-hover)] transition-colors"
      >
        <Search size={18} />
      </button>
    </header>
  );
}
