import { useState } from 'react';
import {
  Inbox, CalendarCheck, CalendarDays, ChevronDown, ChevronRight,
  Hash, Tag, Filter, Plus, LayoutGrid, PanelLeftClose, PanelLeftOpen,
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { PROJECT_COLORS } from '../../utils/priority';
import type { NavView } from '../../types';
import { AddProjectModal } from '../projects/AddProjectModal';

function isActive(active: NavView, target: NavView): boolean {
  if (typeof active === 'string' && typeof target === 'string') return active === target;
  if (typeof active === 'object' && typeof target === 'object') {
    return active.type === target.type && active.id === target.id;
  }
  return false;
}

export function Sidebar() {
  const {
    activeView, setActiveView, projects, labels, filters,
    tasks, sidebarCollapsed, toggleSidebar,
  } = useStore();

  const [projectsOpen, setProjectsOpen] = useState(true);
  const [labelsOpen, setLabelsOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [addProjectOpen, setAddProjectOpen] = useState(false);

  const inboxCount = tasks.filter((t) => !t.completed && t.projectId === null).length;
  const todayCount = tasks.filter((t) => {
    if (t.completed || !t.dueDate) return false;
    const today = new Date().toISOString().split('T')[0];
    return t.dueDate === today;
  }).length;

  const navItem = (
    view: NavView,
    label: string,
    icon: React.ReactNode,
    badge?: number,
  ) => {
    const active = isActive(activeView, view);
    return (
      <button
        key={JSON.stringify(view)}
        onClick={() => setActiveView(view)}
        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all group
          ${active
            ? 'bg-indigo-50 text-indigo-700'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
      >
        <span className={active ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600'}>
          {icon}
        </span>
        {!sidebarCollapsed && (
          <>
            <span className="flex-1 text-left">{label}</span>
            {badge !== undefined && badge > 0 && (
              <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full
                ${active ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200 text-gray-600'}`}>
                {badge}
              </span>
            )}
          </>
        )}
      </button>
    );
  };

  if (sidebarCollapsed) {
    return (
      <aside className="flex flex-col items-center w-14 bg-white border-r border-gray-200 py-3 gap-1">
        <button onClick={toggleSidebar} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 mb-2">
          <PanelLeftOpen size={18} />
        </button>
        {navItem('inbox', 'Inbox', <Inbox size={18} />, inboxCount)}
        {navItem('today', 'Hoje', <CalendarCheck size={18} />, todayCount)}
        {navItem('upcoming', 'Em Breve', <CalendarDays size={18} />)}
      </aside>
    );
  }

  return (
    <>
      <aside className="flex flex-col w-64 bg-white border-r border-gray-200 py-3 overflow-y-auto shrink-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
              <LayoutGrid size={14} className="text-white" />
            </div>
            <span className="font-bold text-gray-900 text-sm">TaskNexus</span>
          </div>
          <button onClick={toggleSidebar} className="p-1 rounded hover:bg-gray-100 text-gray-400">
            <PanelLeftClose size={16} />
          </button>
        </div>

        {/* Main nav */}
        <div className="px-2 space-y-0.5">
          {navItem('inbox', 'Caixa de Entrada', <Inbox size={16} />, inboxCount)}
          {navItem('today', 'Hoje', <CalendarCheck size={16} />, todayCount)}
          {navItem('upcoming', 'Em Breve', <CalendarDays size={16} />)}
        </div>

        <div className="mx-4 my-3 border-t border-gray-100" />

        {/* Projects */}
        <div className="px-2">
          <button
            onClick={() => setProjectsOpen((v) => !v)}
            className="w-full flex items-center gap-1 px-2 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-600"
          >
            {projectsOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            Projetos
            <button
              onClick={(e) => { e.stopPropagation(); setAddProjectOpen(true); }}
              className="ml-auto p-0.5 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600"
            >
              <Plus size={12} />
            </button>
          </button>
          {projectsOpen && (
            <div className="mt-0.5 space-y-0.5">
              {projects.filter((p) => !p.archived).map((p) => {
                const colors = PROJECT_COLORS[p.color];
                const count = tasks.filter((t) => !t.completed && t.projectId === p.id).length;
                const active = isActive(activeView, { type: 'project', id: p.id });
                return (
                  <button
                    key={p.id}
                    onClick={() => setActiveView({ type: 'project', id: p.id })}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all group
                      ${active ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${colors.dot}`} />
                    <span className="flex-1 text-left truncate">{p.name}</span>
                    {count > 0 && (
                      <span className="text-xs text-gray-400">{count}</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="mx-4 my-2 border-t border-gray-100" />

        {/* Labels */}
        <div className="px-2">
          <button
            onClick={() => setLabelsOpen((v) => !v)}
            className="w-full flex items-center gap-1 px-2 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-600"
          >
            {labelsOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            <Tag size={10} /> Etiquetas
          </button>
          {labelsOpen && (
            <div className="mt-0.5 space-y-0.5">
              {labels.map((l) => {
                const active = isActive(activeView, { type: 'label', id: l.id });
                return (
                  <button
                    key={l.id}
                    onClick={() => setActiveView({ type: 'label', id: l.id })}
                    className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm transition-all
                      ${active ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: l.color }} />
                    <span className="flex-1 text-left truncate">@{l.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Filters */}
        {filters.length > 0 && (
          <div className="px-2 mt-1">
            <button
              onClick={() => setFiltersOpen((v) => !v)}
              className="w-full flex items-center gap-1 px-2 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-600"
            >
              {filtersOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              <Filter size={10} /> Filtros
            </button>
            {filtersOpen && (
              <div className="mt-0.5 space-y-0.5">
                {filters.map((f) => {
                  const active = isActive(activeView, { type: 'filter', id: f.id });
                  return (
                    <button
                      key={f.id}
                      onClick={() => setActiveView({ type: 'filter', id: f.id })}
                      className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm transition-all
                        ${active ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                      <Hash size={12} style={{ color: f.color }} />
                      <span className="flex-1 text-left truncate">{f.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </aside>

      {addProjectOpen && <AddProjectModal onClose={() => setAddProjectOpen(false)} />}
    </>
  );
}
