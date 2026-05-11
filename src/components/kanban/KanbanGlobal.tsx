import { useState, useMemo, useEffect, useRef } from 'react';
import {
  Plus, Calendar, Search, ChevronLeft, ChevronRight, X,
  ChevronDown, AlertCircle, CheckCircle2, Activity, Pencil, Trash2, Check,
  Settings, Link2, Clock, LayoutList,
} from 'lucide-react';
import { format, parseISO, isToday, addDays, startOfToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useStore } from '../../store/useStore';
import { PRIORITY_CONFIG } from '../../utils/priority';
import type { Priority, Task } from '../../types';

const PRIORITY_BORDER: Record<string, string> = {
  p1: 'border-l-4 border-l-red-500',
  p2: 'border-l-4 border-l-orange-400',
  p3: 'border-l-4 border-l-blue-400',
  p4: '',
};

const PRIORITY_CYCLE: Priority[] = ['p1', 'p2', 'p3', 'p4'];

const PROJECT_DOT: Record<string, string> = {
  red: 'bg-red-500', orange: 'bg-orange-500', yellow: 'bg-yellow-500',
  green: 'bg-green-500', teal: 'bg-teal-500', blue: 'bg-blue-500',
  indigo: 'bg-indigo-500', purple: 'bg-purple-500', pink: 'bg-pink-500', gray: 'bg-gray-500',
};

// Project color → hex tint for column background
const PROJECT_HEX: Record<string, string> = {
  red: '#ef4444', orange: '#f97316', yellow: '#eab308',
  green: '#22c55e', teal: '#14b8a6', blue: '#3b82f6',
  indigo: '#6366f1', purple: '#a855f7', pink: '#ec4899', gray: '#6b7280',
};

const COLUMN_COLOR_OPTIONS = [
  { color: 'text-gray-400',   accent: 'bg-gray-400',   label: 'Cinza' },
  { color: 'text-blue-400',   accent: 'bg-blue-500',   label: 'Azul' },
  { color: 'text-yellow-400', accent: 'bg-yellow-400', label: 'Amarelo' },
  { color: 'text-green-400',  accent: 'bg-green-500',  label: 'Verde' },
  { color: 'text-purple-400', accent: 'bg-purple-400', label: 'Roxo' },
  { color: 'text-pink-400',   accent: 'bg-pink-400',   label: 'Rosa' },
  { color: 'text-orange-400', accent: 'bg-orange-400', label: 'Laranja' },
  { color: 'text-red-400',    accent: 'bg-red-400',    label: 'Vermelho' },
];

const BG_COLOR_OPTIONS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#06b6d4',
];

const todayStr = new Date().toISOString().split('T')[0];
const tomorrowStr = addDays(startOfToday(), 1).toISOString().split('T')[0];

type SwimlaneMode = 'none' | 'project' | 'priority';

export function KanbanGlobal() {
  const {
    tasks, projects, labels, updateTask, setSelectedTask, selectedTaskId, addTask,
    kanbanColumns, addKanbanColumn, updateKanbanColumn, deleteKanbanColumn, reorderKanbanColumns,
  } = useStore();

  const [addingTo, setAddingTo]         = useState<string | null>(null);
  const [newTitle, setNewTitle]         = useState('');
  const [search, setSearch]             = useState('');
  const [filterProject, setFilterProject] = useState<string>('');
  const [filterPriority, setFilterPriority] = useState<Priority | ''>('');
  const [collapsed, setCollapsed]       = useState<Set<string>>(new Set());
  const [swimlane, setSwimlane]         = useState<SwimlaneMode>('none');

  // New-column modal
  const [compact, setCompact]           = useState(false);
  const [addingCol, setAddingCol]       = useState(false);
  const [newColLabel, setNewColLabel]   = useState('');
  const [newColColor, setNewColColor]   = useState(COLUMN_COLOR_OPTIONS[4]); // purple default

  // Rename-column inline
  const [renamingCol, setRenamingCol]   = useState<string | null>(null);
  const [renameVal, setRenameVal]       = useState('');

  // Column settings popover
  const [settingsCol, setSettingsCol]   = useState<string | null>(null);
  const [wipInput, setWipInput]         = useState<string>('');

  // Column drag
  const [draggingColId, setDraggingColId] = useState<string | null>(null);

  // Card drag for reordering within column
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);

  const columns = [...kanbanColumns].sort((a, b) => a.order - b.order);

  const getProject = (id: string | null) => projects.find(p => p.id === id);

  // ── Column drag & drop ────────────────────────────────────────────────────
  const handleColDragStart = (e: React.DragEvent, colId: string) => {
    setDraggingColId(colId);
    e.dataTransfer.setData('colId', colId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleColDragOver = (e: React.DragEvent, targetColId: string) => {
    e.preventDefault();
    const draggedColId = e.dataTransfer.getData('colId') || draggingColId;
    if (!draggedColId || draggedColId === targetColId) return;
  };

  const handleColDrop = (e: React.DragEvent, targetColId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const draggedColId = draggingColId;
    if (!draggedColId || draggedColId === targetColId) return;

    const sorted = [...columns];
    const fromIdx = sorted.findIndex(c => c.id === draggedColId);
    const toIdx   = sorted.findIndex(c => c.id === targetColId);
    if (fromIdx < 0 || toIdx < 0) return;

    const reordered = [...sorted];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    const updated = reordered.map((c, i) => ({ ...c, order: i }));
    reorderKanbanColumns(updated);
    setDraggingColId(null);
  };

  // ── Task drag & drop ──────────────────────────────────────────────────────
  const handleDrop = (e: React.DragEvent, status: string, insertBeforeId?: string) => {
    e.preventDefault();
    e.stopPropagation();
    const taskId = e.dataTransfer.getData('taskId');
    const dateTarget = e.dataTransfer.getData('dateTarget');

    if (!taskId) return;

    if (dateTarget) {
      const d = dateTarget === 'today' ? todayStr : tomorrowStr;
      updateTask(taskId, { dueDate: d });
    } else {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      if (task.status === status && insertBeforeId) {
        // Reorder within same column — use large offset to avoid unique constraint violations
        // then immediately fix to correct values
        const colTasks = tasks.filter(t => t.status === status).sort((a, b) => a.order - b.order);
        const fromIdx = colTasks.findIndex(t => t.id === taskId);
        const toIdx   = colTasks.findIndex(t => t.id === insertBeforeId);
        if (fromIdx < 0 || toIdx < 0) return;
        const reordered = [...colTasks];
        const [moved] = reordered.splice(fromIdx, 1);
        reordered.splice(toIdx, 0, moved);
        // Update only tasks whose order actually changed, sequentially to avoid race conditions
        const updates = reordered
          .map((t, i) => ({ id: t.id, newOrder: i, oldOrder: t.order }))
          .filter(u => u.newOrder !== u.oldOrder);
        updates.forEach(u => updateTask(u.id, { order: u.newOrder }));
      } else if (task.status !== status) {
        // Move to another column (only if actually changing column)
        updateTask(taskId, { status, completed: status === 'done' });
      }
    }
    (e.currentTarget as HTMLElement).classList.remove('ring-2', 'ring-indigo-500');
  };

  const handleAddTask = (status: string) => {
    if (!newTitle.trim()) { setAddingTo(null); return; }
    addTask({ title: newTitle.trim(), status });
    setNewTitle('');
    setAddingTo(null);
  };

  const moveTask = (taskId: string, direction: 'prev' | 'next') => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const idx = columns.findIndex(c => c.id === task.status);
    const nextIdx = direction === 'next' ? idx + 1 : idx - 1;
    if (nextIdx < 0 || nextIdx >= columns.length) return;
    const newStatus = columns[nextIdx].id;
    updateTask(taskId, { status: newStatus, completed: newStatus === 'done' });
  };

  const toggleCollapse = (colId: string) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      next.has(colId) ? next.delete(colId) : next.add(colId);
      return next;
    });
  };

  // Stats globais
  const activeTasks  = tasks.filter(t => !t.completed);
  const overdueTasks = activeTasks.filter(t => t.dueDate && t.dueDate < todayStr);
  const doneToday    = tasks.filter(t => t.completed && t.completedAt?.startsWith(todayStr));

  // Filtros
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (search.trim()) {
        const proj = projects.find(p => p.id === t.projectId);
        const q = search.toLowerCase();
        if (!t.title.toLowerCase().includes(q) && !proj?.name.toLowerCase().includes(q)) return false;
      }
      if (filterProject && t.projectId !== filterProject) return false;
      if (filterPriority && t.priority !== filterPriority) return false;
      return true;
    });
  }, [tasks, projects, search, filterProject, filterPriority]);

  const hasFilters = search || filterProject || filterPriority;

  // ── Add column ────────────────────────────────────────────────────────────
  const handleAddColumn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColLabel.trim()) return;
    addKanbanColumn(newColLabel.trim());
    setNewColLabel('');
    setAddingCol(false);
  };

  const prevColCountRef = useRef(columns.length);
  useEffect(() => {
    if (columns.length > prevColCountRef.current) {
      const last = columns[columns.length - 1];
      if (last && (last.color !== newColColor.color || last.accent !== newColColor.accent)) {
        updateKanbanColumn(last.id, { color: newColColor.color, accent: newColColor.accent });
      }
    }
    prevColCountRef.current = columns.length;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns.length]);

  const handleRenameCol = (id: string) => {
    if (renameVal.trim()) updateKanbanColumn(id, { label: renameVal.trim() });
    setRenamingCol(null);
    setRenameVal('');
  };

  // ── Swimlane helpers ──────────────────────────────────────────────────────
  const getSwimlaneGroups = (): { key: string; label: string; color?: string }[] => {
    if (swimlane === 'project') {
      const groups: { key: string; label: string; color?: string }[] = [
        { key: 'null', label: 'Caixa de Entrada' },
      ];
      projects.filter(p => !p.archived).forEach(p => {
        groups.push({ key: p.id, label: p.name });
      });
      return groups;
    }
    if (swimlane === 'priority') {
      return [
        { key: 'p1', label: 'Urgente (P1)', color: '#ef4444' },
        { key: 'p2', label: 'Alta (P2)',    color: '#f97316' },
        { key: 'p3', label: 'Média (P3)',   color: '#60a5fa' },
        { key: 'p4', label: 'Baixa (P4)',   color: '#9ca3af' },
      ];
    }
    return [{ key: 'all', label: '' }];
  };

  const filterTasksBySwimlane = (groupKey: string) => {
    if (swimlane === 'project') {
      return filteredTasks.filter(t => (t.projectId ?? 'null') === groupKey);
    }
    if (swimlane === 'priority') {
      return filteredTasks.filter(t => t.priority === groupKey);
    }
    return filteredTasks;
  };

  const swimlaneGroups = getSwimlaneGroups();

  return (
    <div className="flex-1 overflow-hidden flex flex-col">

      {/* ── Stats bar ── */}
      <div className="flex items-center gap-3 md:gap-6 px-3 md:px-6 py-2 border-b border-[var(--c-border)] bg-[var(--c-elevated)] overflow-x-auto">
        <div className="flex items-center gap-1.5 text-xs text-[var(--c-text2)]">
          <Activity size={12} className="text-indigo-400" />
          <span><b className="text-[var(--c-text1)]">{activeTasks.length}</b> ativas</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[var(--c-text2)]">
          <AlertCircle size={12} className={overdueTasks.length > 0 ? 'text-red-400' : 'text-[var(--c-text3)]'} />
          <span className={overdueTasks.length > 0 ? 'text-red-400 font-semibold' : ''}>
            {overdueTasks.length > 0
              ? `${overdueTasks.length} atrasada${overdueTasks.length > 1 ? 's' : ''}`
              : 'Nenhuma atrasada'}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[var(--c-text2)]">
          <CheckCircle2 size={12} className="text-green-400" />
          <span><b className="text-[var(--c-text1)]">{doneToday.length}</b> concluídas hoje</span>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-2 px-3 md:px-6 py-2 md:py-2.5 border-b border-[var(--c-border)] overflow-x-auto">
        {/* Busca */}
        <div className="flex items-center gap-2 bg-[var(--c-elevated)] border border-[var(--c-border)] rounded-lg px-3 py-1.5 min-w-48">
          <Search size={12} className="text-[var(--c-text3)] shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar..."
            className="flex-1 text-xs bg-transparent text-[var(--c-text1)] placeholder-[var(--c-text3)] focus:outline-none w-32"
          />
          {search && <button onClick={() => setSearch('')}><X size={11} className="text-[var(--c-text3)]" /></button>}
        </div>

        {/* Filtro projeto */}
        <div className="flex items-center gap-1 flex-wrap">
          <button
            onClick={() => setFilterProject('')}
            className={`text-xs px-2.5 py-1 rounded-lg border transition-all
              ${!filterProject ? 'bg-indigo-600 text-white border-indigo-600' : 'border-[var(--c-border)] text-[var(--c-text3)] hover:border-[var(--c-border2)]'}`}
          >
            Todos
          </button>
          {projects.filter(p => !p.archived).map(p => (
            <button key={p.id}
              onClick={() => setFilterProject(filterProject === p.id ? '' : p.id)}
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border transition-all
                ${filterProject === p.id ? 'bg-[var(--c-active)] border-indigo-500 text-[var(--c-text1)]' : 'border-[var(--c-border)] text-[var(--c-text3)] hover:border-[var(--c-border2)]'}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${PROJECT_DOT[p.color] ?? 'bg-gray-500'}`} />
              {p.name}
            </button>
          ))}
        </div>

        {/* Filtro prioridade */}
        <div className="flex items-center gap-1">
          {(['p1', 'p2', 'p3', 'p4'] as Priority[]).map(p => {
            const cfg = PRIORITY_CONFIG[p];
            const active = filterPriority === p;
            return (
              <button key={p} onClick={() => setFilterPriority(active ? '' : p)}
                className={`text-xs font-bold px-2 py-1 rounded-lg border transition-all
                  ${active ? `${cfg.bg} ${cfg.color} border-transparent` : 'border-[var(--c-border)] text-[var(--c-text3)] hover:border-[var(--c-border2)]'}`}>
                {p.toUpperCase()}
              </button>
            );
          })}
        </div>

        {/* Compact toggle */}
        <button
          onClick={() => setCompact(v => !v)}
          title={compact ? 'Modo normal' : 'Modo compacto'}
          className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border transition-all ml-auto
            ${compact ? 'bg-indigo-600 text-white border-indigo-600' : 'border-[var(--c-border)] text-[var(--c-text3)] hover:border-[var(--c-border2)]'}`}
        >
          <LayoutList size={12} /> {compact ? 'Compacto' : 'Normal'}
        </button>

        {/* Swimlane toggle */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-[var(--c-text3)] mr-1">Raia:</span>
          {(['none', 'project', 'priority'] as SwimlaneMode[]).map(mode => (
            <button key={mode}
              onClick={() => setSwimlane(mode)}
              className={`text-xs px-2.5 py-1 rounded-lg border transition-all
                ${swimlane === mode ? 'bg-indigo-600 text-white border-indigo-600' : 'border-[var(--c-border)] text-[var(--c-text3)] hover:border-[var(--c-border2)]'}`}>
              {mode === 'none' ? 'Nenhum' : mode === 'project' ? 'Projeto' : 'Prioridade'}
            </button>
          ))}
        </div>

        {hasFilters && (
          <button onClick={() => { setSearch(''); setFilterProject(''); setFilterPriority(''); }}
            className="text-xs text-red-400 hover:text-red-500 flex items-center gap-1">
            <X size={11} /> Limpar
          </button>
        )}
      </div>

      {/* ── Board ── */}
      <div className="flex-1 overflow-auto p-3 md:p-6" style={{ WebkitOverflowScrolling: 'touch' }}>
        {swimlaneGroups.map((group, groupIdx) => (
          <div key={group.key} className={groupIdx > 0 ? 'mt-6' : ''}>
            {/* Swimlane header */}
            {swimlane !== 'none' && (
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[var(--c-border)]">
                {group.color && <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: group.color }} />}
                <span className="text-sm font-semibold text-[var(--c-text1)]">{group.label}</span>
                <span className="text-xs text-[var(--c-text3)]">
                  ({filterTasksBySwimlane(group.key).length} tarefas)
                </span>
              </div>
            )}

            {/* Columns row */}
            <div className="flex gap-4 items-start">
              {columns.map((col, colIdx) => {
                const groupTasks = filterTasksBySwimlane(group.key);
                const colTasks = groupTasks
                  .filter(t => t.status === col.id)
                  .sort((a, b) => a.order - b.order);
                const overdueInCol = colTasks.filter(t => !t.completed && t.dueDate && t.dueDate < todayStr).length;
                const isCollapsed = collapsed.has(col.id);

                const wipLimit = col.wipLimit;
                const wipColor = wipLimit
                  ? colTasks.length > wipLimit
                    ? 'text-red-400'
                    : colTasks.length >= wipLimit
                      ? 'text-amber-400'
                      : 'text-[var(--c-text3)]'
                  : null;

                return (
                  <div key={col.id}
                    className={`flex-shrink-0 flex flex-col transition-all duration-200 ${isCollapsed ? 'w-12' : 'w-64 md:w-72'}`}
                    onDragOver={e => {
                      const isColDrag = draggingColId !== null;
                      if (isColDrag) {
                        e.preventDefault();
                        handleColDragOver(e, col.id);
                      } else if (!isCollapsed) {
                        e.preventDefault();
                        (e.currentTarget as HTMLElement).classList.add('ring-2', 'ring-indigo-500', 'rounded-xl');
                      }
                    }}
                    onDragLeave={e => (e.currentTarget as HTMLElement).classList.remove('ring-2', 'ring-indigo-500', 'rounded-xl')}
                    onDrop={e => {
                      (e.currentTarget as HTMLElement).classList.remove('ring-2', 'ring-indigo-500', 'rounded-xl');
                      if (draggingColId) {
                        handleColDrop(e, col.id);
                      } else if (!isCollapsed) {
                        handleDrop(e, col.id);
                      }
                    }}
                  >
                    {/* Column header */}
                    <div
                      draggable
                      onDragStart={e => handleColDragStart(e, col.id)}
                      onDragEnd={() => setDraggingColId(null)}
                      className={`flex items-center mb-3 px-1 gap-2 w-full cursor-grab active:cursor-grabbing ${isCollapsed ? 'flex-col py-2' : 'justify-between'}`}
                    >
                      {/* Click dot/chevron to collapse */}
                      <button
                        onClick={() => toggleCollapse(col.id)}
                        className={`flex items-center gap-2 ${isCollapsed ? 'flex-col' : ''} flex-1 min-w-0`}
                      >
                        <span className={`w-2 h-2 rounded-full shrink-0 ${col.accent}`} />
                        {!isCollapsed && (
                          renamingCol === col.id
                            ? null
                            : <span className={`text-xs font-semibold truncate ${col.color}`}>{col.label}</span>
                        )}
                        <span className={`text-xs px-1.5 py-0.5 rounded-full shrink-0 ${wipLimit ? wipColor + ' bg-[var(--c-hover)] font-semibold' : 'text-[var(--c-text3)] bg-[var(--c-hover)]'}`}>
                          {wipLimit ? `${colTasks.length}/${wipLimit}` : colTasks.length}
                        </span>
                        {overdueInCol > 0 && !isCollapsed && (
                          <span className="text-xs bg-red-500/15 text-red-400 px-1.5 py-0.5 rounded-full font-medium shrink-0">⚠ {overdueInCol}</span>
                        )}
                      </button>

                      {/* Inline rename */}
                      {renamingCol === col.id && !isCollapsed && (
                        <form onSubmit={e => { e.preventDefault(); handleRenameCol(col.id); }} className="flex-1">
                          <input autoFocus value={renameVal} onChange={e => setRenameVal(e.target.value)}
                            onBlur={() => handleRenameCol(col.id)}
                            onKeyDown={e => e.key === 'Escape' && setRenamingCol(null)}
                            className="w-full text-xs font-semibold bg-transparent border-b border-indigo-400 focus:outline-none text-[var(--c-text1)]"
                          />
                        </form>
                      )}

                      {/* Column actions */}
                      {!isCollapsed && (
                        <div className="flex items-center gap-0.5 shrink-0">
                          <button onClick={() => { setRenamingCol(col.id); setRenameVal(col.label); }}
                            title="Renomear coluna"
                            className="p-1 rounded text-[var(--c-text3)] hover:text-[var(--c-text2)] hover:bg-[var(--c-hover)]">
                            <Pencil size={11} />
                          </button>
                          {/* Settings popover */}
                          <div className="relative">
                            <button
                              onClick={() => {
                                setSettingsCol(settingsCol === col.id ? null : col.id);
                                setWipInput(col.wipLimit?.toString() ?? '');
                              }}
                              title="Configurações"
                              className="p-1 rounded text-[var(--c-text3)] hover:text-[var(--c-text2)] hover:bg-[var(--c-hover)]">
                              <Settings size={11} />
                            </button>
                            {settingsCol === col.id && (
                              <div className="absolute right-0 top-7 z-50 w-64 bg-[var(--c-card)] border border-[var(--c-border)] rounded-xl shadow-xl p-4">
                                <p className="text-xs font-semibold text-[var(--c-text2)] mb-3">Configurações da coluna</p>

                                {/* WIP limit */}
                                <div className="mb-3">
                                  <label className="text-xs text-[var(--c-text3)] block mb-1">Limite WIP</label>
                                  <div className="flex gap-2">
                                    <input
                                      type="number"
                                      min="0"
                                      value={wipInput}
                                      onChange={e => setWipInput(e.target.value)}
                                      placeholder="Sem limite"
                                      className="flex-1 text-xs px-2 py-1.5 rounded-lg border border-[var(--c-border)] bg-[var(--c-elevated)] text-[var(--c-text1)] focus:outline-none focus:ring-1 focus:ring-indigo-400"
                                    />
                                    <button
                                      onClick={() => {
                                        const v = wipInput.trim();
                                        updateKanbanColumn(col.id, { wipLimit: v ? parseInt(v) : null });
                                        setSettingsCol(null);
                                      }}
                                      className="px-2 py-1.5 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                                      Salvar
                                    </button>
                                  </div>
                                </div>

                                {/* Background color */}
                                <div>
                                  <label className="text-xs text-[var(--c-text3)] block mb-1">Cor de fundo</label>
                                  <div className="flex gap-1.5 flex-wrap">
                                    <button
                                      onClick={() => updateKanbanColumn(col.id, { bgColor: null })}
                                      className={`w-6 h-6 rounded-full border-2 bg-[var(--c-elevated)] ${!col.bgColor ? 'border-indigo-400' : 'border-[var(--c-border)]'}`}
                                      title="Sem cor"
                                    >
                                      <X size={10} className="mx-auto text-[var(--c-text3)]" />
                                    </button>
                                    {BG_COLOR_OPTIONS.map(hex => (
                                      <button key={hex}
                                        onClick={() => updateKanbanColumn(col.id, { bgColor: hex })}
                                        className={`w-6 h-6 rounded-full border-2 transition-all ${col.bgColor === hex ? 'border-white scale-110' : 'border-transparent'}`}
                                        style={{ backgroundColor: hex }}
                                        title={hex}
                                      />
                                    ))}
                                  </div>
                                </div>

                                <button onClick={() => setSettingsCol(null)}
                                  className="mt-3 w-full text-xs text-[var(--c-text3)] hover:text-[var(--c-text2)]">
                                  Fechar
                                </button>
                              </div>
                            )}
                          </div>
                          {!col.isDefault && (
                            <button onClick={() => deleteKanbanColumn(col.id)}
                              title="Excluir coluna"
                              className="p-1 rounded text-[var(--c-text3)] hover:text-red-400 hover:bg-red-50/10">
                              <Trash2 size={11} />
                            </button>
                          )}
                          <ChevronDown size={13} className="text-[var(--c-text3)] ml-0.5" />
                        </div>
                      )}
                    </div>

                    {/* Cards area */}
                    {!isCollapsed && (
                      <div
                        className="rounded-xl min-h-16 transition-all"
                        style={(() => {
                          if (col.bgColor) return { backgroundColor: col.bgColor + '18' };
                          if (filterProject) {
                            const proj = projects.find(p => p.id === filterProject);
                            const hex = proj ? PROJECT_HEX[proj.color] : null;
                            if (hex) return { backgroundColor: hex + '10' };
                          }
                          return {};
                        })()}
                      >
                        <div className="space-y-2 p-1">
                          {col.id === 'backlog' && swimlane === 'none'
                            ? (
                              <BacklogGrouped
                                tasks={colTasks}
                                onSelect={setSelectedTask}
                                selectedId={selectedTaskId}
                                getProject={getProject}
                                labels={labels}
                                onMove={moveTask}
                                colIdx={colIdx}
                                colCount={columns.length}
                                onDrop={handleDrop}
                                setDraggingTaskId={setDraggingTaskId}
                                draggingTaskId={draggingTaskId}
                                compact={compact}
                              />
                            )
                            : colTasks.map(t => (
                              <TaskCard key={t.id} task={t}
                                isSelected={selectedTaskId === t.id}
                                onSelect={() => setSelectedTask(t.id === selectedTaskId ? null : t.id)}
                                getProject={getProject} labels={labels}
                                onMove={moveTask} colIdx={colIdx} colCount={columns.length}
                                colStatus={col.id}
                                onDrop={handleDrop}
                                setDraggingTaskId={setDraggingTaskId}
                                draggingTaskId={draggingTaskId}
                                compact={compact}
                              />
                            ))
                          }
                          {colTasks.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-8 text-[var(--c-text3)]">
                              <div className="text-2xl mb-1">
                                {col.id === 'done' ? '🎉' : col.id === 'backlog' ? '📋' : '📭'}
                              </div>
                              <p className="text-xs">{col.id === 'done' ? 'Nada concluído ainda' : 'Vazio'}</p>
                            </div>
                          )}
                        </div>

                        {/* Add task */}
                        {swimlane === 'none' && (addingTo === col.id ? (
                          <div className="m-1 mt-2 bg-[var(--c-card)] rounded-xl p-3 border border-[var(--c-border2)]">
                            <input autoFocus value={newTitle} onChange={e => setNewTitle(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') handleAddTask(col.id); if (e.key === 'Escape') { setAddingTo(null); setNewTitle(''); } }}
                              placeholder="Nome da tarefa..."
                              className="w-full bg-transparent text-sm text-[var(--c-text1)] placeholder-[var(--c-text3)] focus:outline-none"
                            />
                            <div className="flex gap-2 mt-2">
                              <button onClick={() => handleAddTask(col.id)} className="px-3 py-1 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700">Salvar</button>
                              <button onClick={() => { setAddingTo(null); setNewTitle(''); }} className="px-3 py-1 text-[var(--c-text2)] text-xs rounded-lg hover:bg-[var(--c-hover)]">Cancelar</button>
                            </div>
                          </div>
                        ) : (
                          <button onClick={() => setAddingTo(col.id)}
                            className="mt-1 flex items-center gap-2 w-full px-2 py-2 text-xs text-[var(--c-text3)] hover:text-[var(--c-text2)] hover:bg-[var(--c-hover)] rounded-xl transition-colors">
                            <Plus size={13} /> Nova tarefa
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* ── Add column button ── */}
              {swimlane === 'none' && groupIdx === 0 && (
                <div className="flex-shrink-0 w-64">
                  {addingCol ? (
                    <div className="bg-[var(--c-card)] border border-[var(--c-border2)] rounded-2xl p-4 shadow-lg">
                      <h3 className="text-sm font-semibold text-[var(--c-text1)] mb-3">Nova coluna</h3>
                      <form onSubmit={handleAddColumn} className="space-y-3">
                        <input
                          autoFocus
                          value={newColLabel}
                          onChange={e => setNewColLabel(e.target.value)}
                          placeholder="Nome da coluna..."
                          className="w-full text-sm px-3 py-2 rounded-lg border border-[var(--c-border)] bg-[var(--c-elevated)] text-[var(--c-text1)] focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        />
                        <div>
                          <p className="text-xs text-[var(--c-text3)] mb-2">Cor</p>
                          <div className="flex flex-wrap gap-2">
                            {COLUMN_COLOR_OPTIONS.map(opt => (
                              <button key={opt.label} type="button"
                                onClick={() => setNewColColor(opt)}
                                className={`w-6 h-6 rounded-full ${opt.accent} transition-all
                                  ${newColColor.label === opt.label ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}`}
                                title={opt.label}
                              />
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => { setAddingCol(false); setNewColLabel(''); }}
                            className="flex-1 py-1.5 text-xs rounded-lg border border-[var(--c-border)] text-[var(--c-text2)] hover:bg-[var(--c-hover)]">
                            Cancelar
                          </button>
                          <button type="submit" disabled={!newColLabel.trim()}
                            className="flex-1 py-1.5 text-xs rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 flex items-center justify-center gap-1">
                            <Check size={12} /> Criar
                          </button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAddingCol(true)}
                      className="flex items-center gap-2 px-4 py-3 rounded-2xl border-2 border-dashed border-[var(--c-border)] text-[var(--c-text3)] hover:text-indigo-400 hover:border-indigo-400 transition-all text-sm w-full"
                    >
                      <Plus size={16} /> Nova coluna
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Backlog agrupado com atalhos de dia ───────────────────────────────────────
function BacklogGrouped({ tasks, onSelect, selectedId, getProject, labels, onMove, colIdx, colCount, onDrop, setDraggingTaskId, draggingTaskId, compact }: {
  tasks: Task[];
  onSelect: (id: string | null) => void;
  selectedId: string | null;
  getProject: (id: string | null) => { name: string; color: string } | undefined;
  labels: { id: string; name: string; color: string }[];
  onMove: (taskId: string, dir: 'prev' | 'next') => void;
  colIdx: number;
  colCount: number;
  onDrop: (e: React.DragEvent, status: string, insertBeforeId?: string) => void;
  setDraggingTaskId: (id: string | null) => void;
  draggingTaskId: string | null;
  compact?: boolean;
}) {
  const [hoveredZone, setHoveredZone] = useState<'today' | 'tomorrow' | null>(null);

  const groups: Record<string, Task[]> = {};
  tasks.forEach(t => {
    const key = t.dueDate ?? 'sem-data';
    if (!groups[key]) groups[key] = [];
    groups[key].push(t);
  });
  const sortedKeys = Object.keys(groups).sort((a, b) => {
    if (a === 'sem-data') return 1;
    if (b === 'sem-data') return -1;
    return a.localeCompare(b);
  });

  const handleZoneDrop = (e: React.DragEvent, zone: 'today' | 'tomorrow') => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (!taskId) return;
    const { updateTask } = useStore.getState();
    const d = zone === 'today' ? todayStr : tomorrowStr;
    updateTask(taskId, { dueDate: d });
    setHoveredZone(null);
  };

  return (
    <div className="space-y-3">
      {/* ── Atalhos de data ── */}
      <div className="flex gap-2">
        <div
          onDragOver={e => { e.preventDefault(); setHoveredZone('today'); }}
          onDragLeave={() => setHoveredZone(null)}
          onDrop={e => handleZoneDrop(e, 'today')}
          className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl border-2 border-dashed text-xs font-medium transition-all cursor-default
            ${hoveredZone === 'today'
              ? 'border-green-500 bg-green-500/10 text-green-400'
              : 'border-[var(--c-border)] text-[var(--c-text3)] hover:border-green-400/50 hover:text-green-400/70'}`}
        >
          <Calendar size={11} /> Hoje
        </div>
        <div
          onDragOver={e => { e.preventDefault(); setHoveredZone('tomorrow'); }}
          onDragLeave={() => setHoveredZone(null)}
          onDrop={e => handleZoneDrop(e, 'tomorrow')}
          className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl border-2 border-dashed text-xs font-medium transition-all cursor-default
            ${hoveredZone === 'tomorrow'
              ? 'border-blue-500 bg-blue-500/10 text-blue-400'
              : 'border-[var(--c-border)] text-[var(--c-text3)] hover:border-blue-400/50 hover:text-blue-400/70'}`}
        >
          <Calendar size={11} /> Amanhã
        </div>
      </div>

      {sortedKeys.map(key => (
        <div key={key}>
          <div className="flex items-center gap-2 mb-1.5 px-1">
            <Calendar size={11} className="text-[var(--c-text3)]" />
            <span className="text-xs text-[var(--c-text2)] font-medium">
              {key === 'sem-data' ? 'Sem data' : format(parseISO(key), "d 'de' MMM", { locale: ptBR })}
            </span>
          </div>
          <div className="space-y-1.5">
            {groups[key].map(t => (
              <TaskCard key={t.id} task={t} isSelected={selectedId === t.id}
                onSelect={() => onSelect(t.id === selectedId ? null : t.id)}
                getProject={getProject} labels={labels} onMove={onMove} colIdx={colIdx} colCount={colCount}
                colStatus="backlog"
                onDrop={onDrop}
                setDraggingTaskId={setDraggingTaskId}
                draggingTaskId={draggingTaskId}
                compact={compact}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Card de tarefa ────────────────────────────────────────────────────────────
function TaskCard({ task, isSelected, onSelect, getProject, labels, onMove, colIdx, colCount, colStatus, onDrop, setDraggingTaskId, draggingTaskId, compact }: {
  task: Task;
  isSelected: boolean;
  onSelect: () => void;
  getProject: (id: string | null) => { name: string; color: string } | undefined;
  labels: { id: string; name: string; color: string }[];
  onMove: (taskId: string, dir: 'prev' | 'next') => void;
  colIdx: number;
  colCount: number;
  colStatus: string;
  onDrop: (e: React.DragEvent, status: string, insertBeforeId?: string) => void;
  setDraggingTaskId: (id: string | null) => void;
  draggingTaskId: string | null;
  compact?: boolean;
}) {
  const project = getProject(task.projectId);
  const cfg = PRIORITY_CONFIG[task.priority];
  const { updateTask } = useStore();
  const [isDragOver, setIsDragOver] = useState(false);

  const taskLabels   = labels.filter(l => task.labelIds.includes(l.id));
  const subtaskDone  = task.subtasks.filter(s => s.completed).length;
  const subtaskTotal = task.subtasks.length;
  const subtaskPct   = subtaskTotal > 0 ? (subtaskDone / subtaskTotal) * 100 : 0;

  const isOverdue  = !task.completed && !!task.dueDate && task.dueDate < todayStr;
  const isDueToday = !!task.dueDate && task.dueDate === todayStr;
  const dueDateLabel = task.dueDate
    ? isToday(parseISO(task.dueDate)) ? 'Hoje' : format(parseISO(task.dueDate), 'd MMM', { locale: ptBR })
    : null;

  const isBlocked = task.dependencies && task.dependencies.length > 0;

  const cyclePriority = (e: React.MouseEvent) => {
    e.stopPropagation();
    const idx = PRIORITY_CYCLE.indexOf(task.priority as Priority);
    const next = PRIORITY_CYCLE[(idx + 1) % PRIORITY_CYCLE.length];
    updateTask(task.id, { priority: next });
  };

  // Card background from project color
  const projHex = project ? PROJECT_HEX[project.color] : null;
  const cardBgStyle = projHex
    ? { backgroundColor: projHex + '22', borderColor: projHex + '55' }
    : {};

  // Left border color from colorTag or priority
  const borderStyle = task.colorTag
    ? { ...cardBgStyle, borderLeftColor: task.colorTag, borderLeftWidth: '4px', borderLeftStyle: 'solid' as const }
    : cardBgStyle;
  const borderClass = task.colorTag ? '' : (PRIORITY_BORDER[task.priority] ?? '');

  return (
    <div
      draggable
      onDragStart={e => {
        e.dataTransfer.setData('taskId', task.id);
        e.dataTransfer.setData('dateTarget', '');
        setDraggingTaskId(task.id);
      }}
      onDragEnd={() => setDraggingTaskId(null)}
      onDragOver={e => {
        if (draggingTaskId && draggingTaskId !== task.id) {
          e.preventDefault();
          e.stopPropagation();
          setIsDragOver(true);
        }
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={e => {
        e.stopPropagation();
        setIsDragOver(false);
        if (draggingTaskId && draggingTaskId !== task.id) {
          onDrop(e, colStatus, task.id);
        }
      }}
      onClick={onSelect}
      style={borderStyle}
      className={`group relative rounded-xl border cursor-pointer transition-all select-none overflow-hidden
        ${borderClass}
        ${isSelected
          ? 'bg-[var(--c-active)] border-indigo-500'
          : 'bg-[var(--c-card)] border-[var(--c-border)] hover:border-[var(--c-border2)] hover:bg-[var(--c-hover)]'}
        ${task.completed ? 'opacity-60' : ''}
        ${isDragOver ? 'border-t-2 border-t-indigo-400' : ''}
        ${isOverdue ? 'overdue-glow border-red-500/60' : ''}
        ${isDueToday && !task.completed && !isOverdue ? 'today-glow border-green-500/60' : ''}`}
    >
      {/* ⬅️➡️ Botões de mover */}
      <div className="absolute top-2 right-2 hidden group-hover:flex items-center gap-1 z-10">
        {colIdx > 0 && (
          <button onClick={e => { e.stopPropagation(); onMove(task.id, 'prev'); }}
            title="Coluna anterior"
            className="w-5 h-5 flex items-center justify-center rounded bg-[var(--c-elevated)] border border-[var(--c-border)] text-[var(--c-text2)] hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all">
            <ChevronLeft size={11} />
          </button>
        )}
        {colIdx < colCount - 1 && (
          <button onClick={e => { e.stopPropagation(); onMove(task.id, 'next'); }}
            title="Próxima coluna"
            className="w-5 h-5 flex items-center justify-center rounded bg-[var(--c-elevated)] border border-[var(--c-border)] text-[var(--c-text2)] hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all">
            <ChevronRight size={11} />
          </button>
        )}
      </div>

      <div className={compact ? 'px-3 py-1.5' : 'p-3'}>
        <div className="flex items-start gap-2">
          {/* Checkbox */}
          <button
            onClick={e => { e.stopPropagation(); updateTask(task.id, { completed: !task.completed, status: !task.completed ? 'done' : 'backlog' }); }}
            className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors
              ${task.completed ? 'bg-green-600 border-green-600' : 'border-[var(--c-border2)] hover:border-[var(--c-text3)]'}`}
          >
            {task.completed && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10"><path d="M1.5 5l2.5 2.5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          </button>

          <div className="flex-1 min-w-0 pr-6">
            <p className={`leading-snug ${compact ? 'text-xs' : 'text-sm'} ${task.completed ? 'line-through text-[var(--c-text3)]' : 'text-[var(--c-text1)]'}`}>
              {task.title}
            </p>

            {/* In compact mode: only show priority + recurrence + date inline */}
            {compact ? (
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                {task.recurrence?.type !== 'none' && task.recurrence?.type && (
                  <span title="Recorrente" className="text-xs text-indigo-400">🔁</span>
                )}
                {dueDateLabel && (
                  <span className={`text-xs font-medium ${isOverdue ? 'text-red-500' : isDueToday ? 'text-green-500' : 'text-[var(--c-text3)]'}`}>
                    {isOverdue ? '⚠ ' : ''}{dueDateLabel}
                  </span>
                )}
                <button onClick={cyclePriority}
                  className={`text-xs font-bold ml-auto transition-all hover:opacity-75
                    ${task.priority === 'p4' ? 'text-[var(--c-text3)]' : cfg?.color ?? ''}`}>
                  {task.priority === 'p4' ? '—' : task.priority.toUpperCase()}
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {project && (
                    <div className="flex items-center gap-1">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${PROJECT_DOT[project.color] ?? 'bg-gray-500'}`} />
                      <span className="text-xs text-[var(--c-text3)]">{project.name}</span>
                    </div>
                  )}
                  <button onClick={cyclePriority} title="Clique para mudar prioridade"
                    className={`text-xs font-bold px-1.5 py-0.5 rounded transition-all hover:opacity-75
                      ${task.priority === 'p4' ? 'text-[var(--c-text3)] hover:text-[var(--c-text2)]' : cfg?.color ?? ''}`}>
                    {task.priority === 'p4' ? '—' : cfg?.label ?? task.priority}
                  </button>
                  {task.recurrence?.type !== 'none' && task.recurrence?.type && (
                    <span title={`Recorrente: ${task.recurrence.type}`} className="flex items-center gap-0.5 text-xs text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded-full font-medium">
                      🔁
                    </span>
                  )}
                  {isBlocked && <span title="Bloqueada por dependências"><Link2 size={10} className="text-amber-400" /></span>}
                  {task.estimatedMinutes && <span title={`Estimado: ${task.estimatedMinutes}min`}><Clock size={10} className="text-[var(--c-text3)]" /></span>}
                </div>

                {dueDateLabel && (
                  <div className={`flex items-center gap-1 mt-1.5 text-xs font-medium
                    ${isOverdue ? 'text-red-500' : isDueToday ? 'text-green-500' : 'text-[var(--c-text3)]'}`}>
                    <Calendar size={10} />
                    <span>{isOverdue ? '⚠ ' : ''}{dueDateLabel}</span>
                  </div>
                )}

                {taskLabels.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {taskLabels.map(l => (
                      <span key={l.id} className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                        style={{ backgroundColor: l.color + '22', color: l.color }}>
                        {l.name}
                      </span>
                    ))}
                  </div>
                )}

                {subtaskTotal > 0 && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs text-[var(--c-text3)]">{subtaskDone}/{subtaskTotal} subtarefas</span>
                      <span className="text-xs text-[var(--c-text3)]">{Math.round(subtaskPct)}%</span>
                    </div>
                    <div className="w-full h-1 bg-[var(--c-border2)] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${subtaskPct === 100 ? 'bg-green-500' : 'bg-indigo-500'}`}
                        style={{ width: `${subtaskPct}%` }}
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Color tag dot */}
            {task.colorTag && (
              <div className="absolute top-2 left-2 w-2 h-2 rounded-full" style={{ backgroundColor: task.colorTag }} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
