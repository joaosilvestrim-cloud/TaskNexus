import { useState } from 'react';
import {
  Inbox, CalendarCheck, CalendarDays, ChevronDown,
  Plus, LayoutGrid, Hash, Calendar, Target, X, FileText, BookOpen, Download, Smartphone,
} from 'lucide-react';
import { usePWAInstall } from '../shared/PWAInstallBanner';
import { useStore } from '../../store/useStore';
import type { NavView } from '../../types';
import { AddProjectModal } from '../projects/AddProjectModal';
import { UserMenu } from '../shared/UserMenu';
import { Tooltip } from '../shared/Tooltip';

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
    sidebarOpen, setSidebarOpen, currentUser,
  } = useStore();
  const [projectsOpen, setProjectsOpen] = useState(true);
  const [labelsOpen, setLabelsOpen]     = useState(false);
  const [filtersOpen, setFiltersOpen]   = useState(false);
  const [addProjectOpen, setAddProjectOpen] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const { canInstall, isIOS, installed, install } = usePWAInstall();

  const inboxCount = tasks.filter(t => !t.completed && t.projectId === null).length;
  const todayStr   = new Date().toISOString().split('T')[0];
  const todayCount = tasks.filter(t => !t.completed && t.dueDate === todayStr).length;

  const NAV_TOOLTIPS: Partial<Record<string, string>> = {
    inbox:    'Tarefas sem projeto — sua caixa de entrada geral',
    kanban:   'Quadro visual com colunas personalizáveis (arrastar e soltar)',
    today:    'Tarefas com prazo para hoje',
    upcoming: 'Tarefas dos próximos 7 dias',
    calendar: 'Visualização em calendário mensal',
    focus:    'Modo foco com timer Pomodoro — sem distrações',
    meetings: 'Criar e gerenciar atas de reunião com IA',
    notes:    'Central de anotações e base de conhecimento',
  };

  const navBtn = (view: NavView, label: string, icon: React.ReactNode, badge?: number) => {
    const active = isActive(activeView, view);
    const tooltipKey = typeof view === 'string' ? view : view.type;
    const tooltipText = NAV_TOOLTIPS[tooltipKey];

    const btn = (
      <button
        key={JSON.stringify(view) + label}
        onClick={() => setActiveView(view)}
        className={`w-full flex items-center gap-2.5 pl-3 pr-2 py-2 rounded-xl text-sm transition-all duration-200 group relative
          ${active
            ? 'text-indigo-400 font-medium'
            : 'text-[var(--c-text3)] hover:bg-[var(--c-hover)] hover:text-[var(--c-text1)]'}`}
        style={active ? {
          background: 'linear-gradient(90deg, rgba(99,102,241,0.18), rgba(99,102,241,0.05))',
          borderLeft: '2px solid #6366f1',
          paddingLeft: '10px',
        } : { borderLeft: '2px solid transparent' }}
      >
        <span className={`transition-colors duration-200 ${active ? 'text-indigo-400' : 'text-[var(--c-text3)] group-hover:text-[var(--c-text2)]'}`}>
          {icon}
        </span>
        <span className="flex-1 text-left">{label}</span>
        {badge !== undefined && badge > 0 && (
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none
            ${active
              ? 'bg-indigo-500/30 text-indigo-300'
              : 'bg-[var(--c-border2)] text-[var(--c-text3)]'}`}>
            {badge}
          </span>
        )}
      </button>
    );

    return tooltipText
      ? <Tooltip key={JSON.stringify(view) + label} text={tooltipText} side="right">{btn}</Tooltip>
      : btn;
  };

  const sectionHeader = (label: string, open: boolean, toggle: () => void, onAdd?: () => void) => (
    <button
      onClick={toggle}
      className="w-full flex items-center gap-1.5 px-2 py-1.5 text-[10px] font-bold text-[var(--c-text3)] uppercase tracking-widest hover:text-[var(--c-text2)] mt-2 transition-colors duration-150"
    >
      <span className="transition-transform duration-200" style={{ display: 'inline-block', transform: open ? 'rotate(0deg)' : 'rotate(-90deg)' }}>
        <ChevronDown size={10} />
      </span>
      <span className="flex-1 text-left">{label}</span>
      {onAdd && (
        <span
          onClick={e => { e.stopPropagation(); onAdd(); }}
          className="p-1 rounded-lg hover:bg-[var(--c-hover)] text-[var(--c-text3)] hover:text-indigo-400 transition-colors duration-150"
        >
          <Plus size={11} />
        </span>
      )}
    </button>
  );

  const sidebarContent = (
    <aside className="flex flex-col w-64 h-full overflow-y-auto"
      style={{
        background: 'var(--c-sidebar)',
        borderRight: '1px solid var(--c-border)',
      }}>

      {/* ── Header / Brand ── */}
      <div className="flex items-center gap-3 px-4 pt-5 pb-4">
        {/* Brand icon with glow */}
        <div
          className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center shadow-lg"
          style={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)',
            boxShadow: '0 0 16px rgba(99,102,241,0.4)',
          }}>
          <svg width="18" height="18" viewBox="0 0 100 100" fill="none">
            <text x="50" y="72" fontFamily="system-ui,-apple-system,sans-serif" fontSize="68" fontWeight="900" textAnchor="middle" fill="white" fillOpacity="0.95">N</text>
            <circle cx="72" cy="30" r="7" fill="white" fillOpacity="0.5"/>
            <circle cx="72" cy="30" r="3.5" fill="white" fillOpacity="0.9"/>
          </svg>
        </div>
        {/* Brand name */}
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-bold tracking-tight" style={{ color: 'var(--c-text1)' }}>
            Task<span style={{
              background: 'linear-gradient(90deg,#6366f1,#a855f7)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>Nexus</span>
          </p>
        </div>
        {/* Close button — mobile only */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="md:hidden p-1.5 rounded-lg text-[var(--c-text3)] hover:bg-[var(--c-hover)] transition-colors">
          <X size={15} />
        </button>
      </div>

      {/* ── Entrada ── */}
      <div className="px-2 mb-0.5">
        <p className="px-2 pb-1 text-[10px] font-bold text-[var(--c-text3)] uppercase tracking-widest">Entrada</p>
        <div className="space-y-0.5">
          {navBtn('inbox',  'Caixa de entrada', <Inbox size={14} />, inboxCount)}
          {navBtn('kanban', 'Kanban',            <LayoutGrid size={14} />)}
        </div>
      </div>

      {/* Thin divider */}
      <div className="mx-4 my-2" style={{ height: '1px', background: 'var(--c-border)' }} />

      {/* ── Visualizações ── */}
      <div className="px-2 mb-0.5">
        <p className="px-2 pb-1 text-[10px] font-bold text-[var(--c-text3)] uppercase tracking-widest">Visualizações</p>
        <div className="space-y-0.5">
          {navBtn('today',    'Hoje',              <CalendarCheck size={14} />, todayCount)}
          {navBtn('upcoming', 'Em breve',          <CalendarDays size={14} />)}
          {navBtn('calendar', 'Calendário',        <Calendar size={14} />)}
          {navBtn('focus',    'Modo Foco',         <Target size={14} />)}
          {navBtn('meetings', 'Atas de Reunião',   <FileText size={14} />)}
          {navBtn('notes',    'Central de Notas',  <BookOpen size={14} />)}
        </div>
      </div>

      {/* Thin divider */}
      <div className="mx-4 my-2" style={{ height: '1px', background: 'var(--c-border)' }} />

      {/* ── Projetos ── */}
      <div className="px-2">
        {sectionHeader('Projetos', projectsOpen, () => setProjectsOpen(v => !v), () => setAddProjectOpen(true))}
        {projectsOpen && (
          <div className="mt-0.5 space-y-0.5 animate-fade-in">
            {projects.filter(p => !p.archived).map(p => {
              const count  = tasks.filter(t => !t.completed && t.projectId === p.id).length;
              const active = isActive(activeView, { type: 'project', id: p.id });
              return (
                <button
                  key={p.id}
                  onClick={() => setActiveView({ type: 'project', id: p.id })}
                  className={`w-full flex items-center gap-2.5 pl-3 pr-2 py-2 rounded-xl text-sm transition-all duration-200
                    ${active ? 'text-indigo-400 font-medium' : 'text-[var(--c-text2)] hover:bg-[var(--c-hover)] hover:text-[var(--c-text1)]'}`}
                  style={active ? {
                    background: 'linear-gradient(90deg, rgba(99,102,241,0.15), rgba(99,102,241,0.04))',
                    borderLeft: '2px solid #6366f1',
                    paddingLeft: '10px',
                  } : { borderLeft: '2px solid transparent' }}
                >
                  <span className={`w-2 h-2 rounded-full shrink-0 ${PROJECT_DOT[p.color] ?? 'bg-gray-500'}`}
                    style={active ? { boxShadow: `0 0 6px currentColor` } : {}} />
                  <span className="flex-1 text-left truncate text-[13px]">{p.name}</span>
                  {count > 0 && (
                    <span className="text-[10px] font-semibold text-[var(--c-text3)] px-1">{count}</span>
                  )}
                </button>
              );
            })}
            {projects.filter(p => !p.archived).length === 0 && (
              <p className="text-xs text-[var(--c-text3)] px-3 py-2 italic">Nenhum projeto</p>
            )}
          </div>
        )}
      </div>

      {/* ── Etiquetas ── */}
      {labels.length > 0 && (
        <div className="px-2 mt-0.5">
          {sectionHeader('Tags', labelsOpen, () => setLabelsOpen(v => !v))}
          {labelsOpen && (
            <div className="mt-0.5 space-y-0.5 animate-fade-in">
              {labels.map(l => {
                const active = isActive(activeView, { type: 'label', id: l.id });
                return (
                  <button
                    key={l.id}
                    onClick={() => setActiveView({ type: 'label', id: l.id })}
                    className={`w-full flex items-center gap-2.5 pl-3 pr-2 py-2 rounded-xl text-sm transition-all duration-200
                      ${active ? 'text-indigo-400 font-medium' : 'text-[var(--c-text2)] hover:bg-[var(--c-hover)] hover:text-[var(--c-text1)]'}`}
                    style={active ? {
                      background: 'linear-gradient(90deg, rgba(99,102,241,0.15), rgba(99,102,241,0.04))',
                      borderLeft: '2px solid #6366f1',
                      paddingLeft: '10px',
                    } : { borderLeft: '2px solid transparent' }}
                  >
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: l.color }} />
                    <span className="flex-1 text-left truncate text-[13px]">@{l.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Filtros ── */}
      {filters.length > 0 && (
        <div className="px-2 mt-0.5">
          {sectionHeader('Filtros', filtersOpen, () => setFiltersOpen(v => !v))}
          {filtersOpen && (
            <div className="mt-0.5 space-y-0.5 animate-fade-in">
              {filters.map(f => {
                const active = isActive(activeView, { type: 'filter', id: f.id });
                return (
                  <button
                    key={f.id}
                    onClick={() => setActiveView({ type: 'filter', id: f.id })}
                    className={`w-full flex items-center gap-2.5 pl-3 pr-2 py-2 rounded-xl text-sm transition-all duration-200
                      ${active ? 'text-indigo-400 font-medium' : 'text-[var(--c-text2)] hover:bg-[var(--c-hover)] hover:text-[var(--c-text1)]'}`}
                    style={active ? {
                      background: 'linear-gradient(90deg, rgba(99,102,241,0.15), rgba(99,102,241,0.04))',
                      borderLeft: '2px solid #6366f1',
                      paddingLeft: '10px',
                    } : { borderLeft: '2px solid transparent' }}
                  >
                    <Hash size={12} style={{ color: f.color }} />
                    <span className="flex-1 text-left truncate text-[13px]">{f.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="flex-1" />

      {/* ── Bottom actions ── */}
      <div className="px-2 pb-3 mt-2 space-y-0.5" style={{ borderTop: '1px solid var(--c-border)', paddingTop: '10px' }}>
        {!installed && (canInstall || isIOS) && (
          <button
            onClick={async () => { if (canInstall) { await install(); } else { setShowInstallGuide(true); } }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-indigo-400 hover:bg-indigo-500/10 transition-all duration-200"
          >
            <Download size={14} /> Instalar app
          </button>
        )}
        {!installed && !canInstall && !isIOS && (
          <button
            onClick={() => setShowInstallGuide(true)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-[var(--c-text3)] hover:bg-[var(--c-hover)] hover:text-[var(--c-text2)] transition-all duration-200"
          >
            <Smartphone size={14} /> Instalar no celular
          </button>
        )}

        {currentUser && <UserMenu userEmail={currentUser.email} />}
      </div>

      {/* Install guide modal */}
      {showInstallGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setShowInstallGuide(false)}>
          <div className="w-full max-w-sm rounded-2xl p-6 space-y-4 shadow-2xl animate-bounce-in"
            style={{ background: 'var(--c-card)', border: '1px solid var(--c-border)' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6,#a855f7)', boxShadow: '0 0 20px rgba(99,102,241,0.4)' }}>
                <svg width="24" height="24" viewBox="0 0 100 100" fill="none">
                  <text x="50" y="72" fontFamily="system-ui" fontSize="68" fontWeight="900" textAnchor="middle" fill="white">N</text>
                </svg>
              </div>
              <div>
                <p className="font-bold text-[var(--c-text1)]">Instalar TaskNexus</p>
                <p className="text-xs text-[var(--c-text3)]">Como app no seu dispositivo</p>
              </div>
            </div>

            <div className="space-y-3 text-sm text-[var(--c-text2)]">
              {[
                { emoji: '🤖', title: 'Android (Chrome)', steps: ['Toque no menu ⋮ (canto superior direito)', 'Selecione "Adicionar à tela inicial"', 'Confirme e pronto!'] },
                { emoji: '🍎', title: 'iPhone / iPad (Safari)', steps: ['Toque no botão Compartilhar □↑ (barra inferior)', 'Role e toque em "Adicionar à Tela de Início"', 'Confirme o nome e toque em Adicionar'] },
                { emoji: '💻', title: 'Desktop (Chrome / Edge)', steps: ['Procure o ícone ⊕ na barra de endereço e clique em "Instalar"'] },
              ].map(item => (
                <div key={item.title} className="p-3 rounded-xl space-y-1" style={{ background: 'var(--c-elevated)', border: '1px solid var(--c-border)' }}>
                  <p className="font-semibold text-[var(--c-text1)] flex items-center gap-1.5">{item.emoji} {item.title}</p>
                  {item.steps.map((s, i) => <p key={i}>{i + 1}. {s}</p>)}
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowInstallGuide(false)}
              className="w-full py-2.5 text-white text-sm font-semibold rounded-xl transition-all"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
              Entendi!
            </button>
          </div>
        </div>
      )}
    </aside>
  );

  return (
    <>
      {/* Desktop: always visible */}
      <div className="hidden md:flex shrink-0">
        {sidebarContent}
      </div>

      {/* Mobile: overlay drawer */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-10 h-full shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}

      {addProjectOpen && <AddProjectModal onClose={() => setAddProjectOpen(false)} />}
    </>
  );
}
