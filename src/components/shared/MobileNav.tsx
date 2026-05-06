import { Inbox, CalendarCheck, LayoutGrid, Calendar, Target } from 'lucide-react';
import { useStore } from '../../store/useStore';
import type { NavView } from '../../types';

const NAV_ITEMS: { view: NavView; label: string; icon: React.ReactNode }[] = [
  { view: 'inbox',    label: 'Entrada',    icon: <Inbox size={20} /> },
  { view: 'today',    label: 'Hoje',       icon: <CalendarCheck size={20} /> },
  { view: 'kanban',   label: 'Kanban',     icon: <LayoutGrid size={20} /> },
  { view: 'calendar', label: 'Calendário', icon: <Calendar size={20} /> },
  { view: 'focus',    label: 'Foco',       icon: <Target size={20} /> },
];

function isSame(a: NavView, b: NavView) {
  if (typeof a === 'string' && typeof b === 'string') return a === b;
  return false;
}

export function MobileNav() {
  const { activeView, setActiveView, tasks } = useStore();
  const todayStr   = new Date().toISOString().split('T')[0];
  const todayCount = tasks.filter(t => !t.completed && t.dueDate === todayStr).length;
  const inboxCount = tasks.filter(t => !t.completed && t.projectId === null).length;

  const badges: Partial<Record<string, number>> = {
    inbox: inboxCount,
    today: todayCount,
  };

  return (
    <nav className="md:hidden flex items-center bg-[var(--c-sidebar)] border-t border-[var(--c-border)] safe-area-bottom shrink-0">
      {NAV_ITEMS.map(item => {
        const active = isSame(activeView, item.view);
        const badge  = badges[item.view as string];
        return (
          <button
            key={item.view as string}
            onClick={() => setActiveView(item.view)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 relative transition-colors
              ${active ? 'text-indigo-500' : 'text-[var(--c-text3)]'}`}
          >
            {item.icon}
            <span className="text-[10px] font-medium">{item.label}</span>
            {badge !== undefined && badge > 0 && (
              <span className="absolute top-1.5 right-1/2 translate-x-3 min-w-[16px] h-4 flex items-center justify-center text-[9px] font-bold bg-red-500 text-white rounded-full px-1">
                {badge > 99 ? '99+' : badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
