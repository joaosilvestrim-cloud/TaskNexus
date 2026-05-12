import { useState } from 'react';
import {
  Inbox, CalendarCheck, CalendarDays, ChevronDown, ChevronRight,
  Plus, LayoutGrid,
  Hash, Calendar, Sun, Moon, Target, X, FileText, BookOpen,
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import type { NavView } from '../../types';
import { AddProjectModal } from '../projects/AddProjectModal';

const PROJECT_DOT: Record<string, string> = {
  red:'bg-red-500', orange:'bg-orange-500', yellow:'bg-yellow-400',
  green:'bg-green-500', teal:'bg-teal-500', blue:'bg-blue-500',
  indigo:'bg-indigo-500', purple:'bg-purple-500', pink:'bg-pink-500', gray:'bg-gray-500',
};

function isActive(active: NavView, target: NavView): boolean {
  if (typeof active === 'string' && typeof target === 'string') return active === target;
  if (typeof active === 'object' && typeof target === 'object') {
    return active.type === target.type && (active as { type: string; id: string }).id === (target as { type: string; id: string }).id;
  }
  return false;
}

export function Sidebar() {
  const {
    activeView, setActiveView, projects, labels, filters, tasks,
    theme, toggleTheme, sidebarOpen, setSidebarOpen,
  } = useStore();
  const [projectsOpen, setProjectsOpen] = useState(true);
  const [labelsOpen, setLabelsOpen]     = useState(false);
  const [filtersOpen, setFiltersOpen]   = useState(false);
  const [addProjectOpen, setAddProjectOpen] = useState(false);

  const inboxCount = tasks.filter(t => !t.completed && t.projectId === null).length;
  const todayStr   = new Date().toISOString().split('T')[0];
  const todayCount = tasks.filter(t => !t.completed && t.dueDate === todayStr).length;

  const navBtn = (view: NavView, label: string, icon: React.ReactNode, badge?: number) => {
    const active = isActive(activeView, view);
    return (
      <button key={JSON.stringify(view) + label} onClick={() => setActiveView(view)}
        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all group
          ${active
            ? 'bg-[var(--c-active)] text-indigo-600'
            : 'text-[var(--c-text3)] hover:bg-[var(--c-hover)] hover:text-[var(--c-text1)]'}`}>
        <span className={active ? 'text-indigo-500' : 'text-[var(--c-text3)] group-hover:text-[var(--c-text2)]'}>{icon}</span>
        <span className="flex-1 text-left">{label}</span>
        {badge !== undefined && badge > 0 && (
          <span className="text-xs bg-[var(--c-hover)] text-[var(--c-text2)] px-1.5 py-0.5 rounded-full">{badge}</span>
        )}
      </button>
    );
  };

  const sectionHeader = (label: string, open: boolean, toggle: () => void, onAdd?: () => void) => (
    <button onClick={toggle}
      className="w-full flex items-center gap-1 px-2 py-1.5 text-xs font-semibold text-[var(--c-text3)] uppercase tracking-wider hover:text-[var(--c-text2)] mt-1">
      {open ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
      <span className="flex-1 text-left">{label}</span>
      {onAdd && (
        <span onClick={e => { e.stopPropagation(); onAdd(); }}
          className="p-0.5 rounded hover:bg-[var(--c-hover)] text-[var(--c-text3)] hover:text-[var(--c-text2)]">
          <Plus size={11} />
        </span>
      )}
    </button>
  );

  const sidebarContent = (
    <aside className="flex flex-col w-64 bg-[var(--c-sidebar)] border-r border-[var(--c-border)] py-3 overflow-y-auto h-full">

      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 mb-4">
        <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0">
          <LayoutGrid size={13} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[var(--c-text1)] truncate">TaskNexus</p>
        </div>
        {/* Close button — mobile only */}
        <button onClick={() => setSidebarOpen(false)}
          className="md:hidden p-1 rounded-lg text-[var(--c-text3)] hover:bg-[var(--c-hover)]">
          <X size={16} />
        </button>
      </div>

      {/* ── Entrada ── */}
      <div className="px-2 mb-1">
        <p className="px-2 py-1 text-xs font-semibold text-[var(--c-text3)] uppercase tracking-wider">Entrada</p>
        <div className="space-y-0.5">
          {navBtn('inbox',  'Caixa de entrada', <Inbox size={14} />, inboxCount)}
          {navBtn('kanban', 'Kanban',            <LayoutGrid size={14} />)}
        </div>
      </div>

      <div className="mx-3 my-2 border-t border-[var(--c-border)]" />

      {/* ── Visualizações ── */}
      <div className="px-2 mb-1">
        <p className="px-2 py-1 text-xs font-semibold text-[var(--c-text3)] uppercase tracking-wider">Visualizações</p>
        <div className="space-y-0.5">
          {navBtn('today',    'Hoje',             <CalendarCheck size={14} />, todayCount)}
          {navBtn('upcoming', 'Em breve',        <CalendarDays size={14} />)}
          {navBtn('calendar', 'Calendário',      <Calendar size={14} />)}
          {navBtn('focus',    'Modo Foco',       <Target size={14} />)}
          {navBtn('meetings', 'Atas de Reunião', <FileText size={14} />)}
          {navBtn('notes',    'Central de Notas', <BookOpen size={14} />)}
        </div>
      </div>

      <div className="mx-3 my-2 border-t border-[var(--c-border)]" />

      {/* ── Projetos ── */}
      <div className="px-2">
        {sectionHeader('Projetos', projectsOpen, () => setProjectsOpen(v => !v), () => setAddProjectOpen(true))}
        {projectsOpen && (
          <div className="mt-0.5 space-y-0.5">
            {projects.filter(p => !p.archived).map(p => {
              const count  = tasks.filter(t => !t.completed && t.projectId === p.id).length;
              const active = isActive(activeView, { type: 'project', id: p.id });
              return (
                <button key={p.id} onClick={() => setActiveView({ type: 'project', id: p.id })}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all
                    ${active
                      ? 'bg-[var(--c-active)] text-indigo-600'
                      : 'text-[var(--c-text2)] hover:bg-[var(--c-hover)] hover:text-[var(--c-text1)]'}`}>
                  <span className={`w-2 h-2 rounded-full shrink-0 ${PROJECT_DOT[p.color] ?? 'bg-gray-500'}`} />
                  <span className="flex-1 text-left truncate">{p.name}</span>
                  {count > 0 && <span className="text-xs text-[var(--c-text3)]">{count}</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Etiquetas ── */}
      {labels.length > 0 && (
        <div className="px-2 mt-1">
          {sectionHeader('Tags', labelsOpen, () => setLabelsOpen(v => !v))}
          {labelsOpen && (
            <div className="mt-0.5 space-y-0.5">
              {labels.map(l => {
                const active = isActive(activeView, { type: 'label', id: l.id });
                return (
                  <button key={l.id} onClick={() => setActiveView({ type: 'label', id: l.id })}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all
                      ${active
                        ? 'bg-[var(--c-active)] text-indigo-600'
                        : 'text-[var(--c-text2)] hover:bg-[var(--c-hover)] hover:text-[var(--c-text1)]'}`}>
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: l.color }} />
                    <span className="flex-1 text-left truncate">@{l.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Filtros ── */}
      {filters.length > 0 && (
        <div className="px-2 mt-1">
          {sectionHeader('Filtros', filtersOpen, () => setFiltersOpen(v => !v))}
          {filtersOpen && (
            <div className="mt-0.5 space-y-0.5">
              {filters.map(f => {
                const active = isActive(activeView, { type: 'filter', id: f.id });
                return (
                  <button key={f.id} onClick={() => setActiveView({ type: 'filter', id: f.id })}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all
                      ${active
                        ? 'bg-[var(--c-active)] text-indigo-600'
                        : 'text-[var(--c-text2)] hover:bg-[var(--c-hover)] hover:text-[var(--c-text1)]'}`}>
                    <Hash size={12} style={{ color: f.color }} />
                    <span className="flex-1 text-left truncate">{f.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="flex-1" />

      {/* ── Theme Toggle ── */}
      <div className="px-3 pb-2 mt-2 border-t border-[var(--c-border)] pt-3">
        <button onClick={toggleTheme}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[var(--c-text2)] hover:bg-[var(--c-hover)] hover:text-[var(--c-text1)] transition-all">
          {theme === 'dark'
            ? <><Sun size={14} className="text-yellow-400" /><span>Tema Claro</span></>
            : <><Moon size={14} className="text-indigo-400" /><span>Tema Escuro</span></>
          }
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* ── Desktop: always visible ── */}
      <div className="hidden md:flex shrink-0">
        {sidebarContent}
      </div>

      {/* ── Mobile: overlay drawer ── */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          {/* Drawer */}
          <div className="relative z-10 h-full shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}

      {addProjectOpen && <AddProjectModal onClose={() => setAddProjectOpen(false)} />}
    </>
  );
}
