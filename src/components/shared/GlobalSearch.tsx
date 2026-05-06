import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, LayoutGrid, CalendarCheck, Target, Calendar } from 'lucide-react';
import { useStore } from '../../store/useStore';
import type { NavView } from '../../types';

interface Props {
  open: boolean;
  onClose: () => void;
}

const QUICK_NAV = [
  { label: 'Kanban', view: 'kanban' as NavView, icon: <LayoutGrid size={14} /> },
  { label: 'Hoje',   view: 'today' as NavView,  icon: <CalendarCheck size={14} /> },
  { label: 'Foco',   view: 'focus' as NavView,  icon: <Target size={14} /> },
  { label: 'Calendário', view: 'calendar' as NavView, icon: <Calendar size={14} /> },
];

export function GlobalSearch({ open, onClose }: Props) {
  const { tasks, projects, setSelectedTask, setActiveView } = useStore();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const getProject = (id: string | null) => projects.find(p => p.id === id);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return tasks
      .filter(t => t.title.toLowerCase().includes(q))
      .slice(0, 8);
  }, [tasks, query]);

  const handleSelectTask = (taskId: string) => {
    setSelectedTask(taskId);
    setActiveView('kanban');
    onClose();
  };

  const handleNav = (view: NavView) => {
    setActiveView(view);
    onClose();
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-24"
        onClick={onClose}
      >
        {/* Panel */}
        <div
          className="w-full max-w-lg bg-[var(--c-card)] border border-[var(--c-border)] rounded-2xl shadow-2xl overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--c-border)]">
            <Search size={16} className="text-[var(--c-text3)] shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar tarefas ou navegar..."
              className="flex-1 text-sm bg-transparent text-[var(--c-text1)] placeholder-[var(--c-text3)] focus:outline-none"
            />
            <button onClick={onClose} className="text-[var(--c-text3)] hover:text-[var(--c-text2)]">
              <X size={14} />
            </button>
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto py-2">
            {/* Quick nav (always shown when no query) */}
            {!query.trim() && (
              <div>
                <p className="text-xs font-semibold text-[var(--c-text3)] px-4 py-2 uppercase tracking-wider">Navegação rápida</p>
                {QUICK_NAV.map(item => (
                  <button
                    key={item.label}
                    onClick={() => handleNav(item.view)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--c-hover)] transition-colors text-left"
                  >
                    <span className="text-indigo-400">{item.icon}</span>
                    <span className="text-sm text-[var(--c-text1)]">{item.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Task results */}
            {query.trim() && results.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-[var(--c-text3)]">Nenhuma tarefa encontrada</p>
              </div>
            )}
            {results.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-[var(--c-text3)] px-4 py-2 uppercase tracking-wider">Tarefas</p>
                {results.map(t => {
                  const proj = getProject(t.projectId);
                  return (
                    <button
                      key={t.id}
                      onClick={() => handleSelectTask(t.id)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--c-hover)] transition-colors text-left"
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0
                        ${t.completed ? 'bg-green-600 border-green-600' : 'border-[var(--c-border2)]'}`}>
                        {t.completed && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10"><path d="M1.5 5l2.5 2.5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${t.completed ? 'line-through text-[var(--c-text3)]' : 'text-[var(--c-text1)]'}`}>
                          {t.title}
                        </p>
                        {proj && <p className="text-xs text-[var(--c-text3)]">{proj.name}</p>}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Also show quick nav when searching */}
            {query.trim() && (
              <div className="border-t border-[var(--c-border)] mt-1 pt-1">
                {QUICK_NAV.map(item => (
                  <button
                    key={item.label}
                    onClick={() => handleNav(item.view)}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-[var(--c-hover)] transition-colors text-left"
                  >
                    <span className="text-[var(--c-text3)]">{item.icon}</span>
                    <span className="text-xs text-[var(--c-text3)]">Ir para {item.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer hint */}
          <div className="px-4 py-2 border-t border-[var(--c-border)] flex gap-4">
            <span className="text-xs text-[var(--c-text3)]">↵ Selecionar</span>
            <span className="text-xs text-[var(--c-text3)]">Esc Fechar</span>
          </div>
        </div>
      </div>
    </>
  );
}
