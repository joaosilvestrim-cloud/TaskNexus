import { useState, useEffect, useRef, useCallback } from 'react';
import {
  X, Trash2, Calendar, Flag, Tag, Plus, RepeatIcon, AlignLeft,
  Clock, ChevronDown, CheckSquare, Square, Check, FolderOpen, Layers,
  Copy, ArrowUpRight, Link2, Paperclip, MessageSquare, Palette,
} from 'lucide-react';
import { format, addDays, startOfToday, parseISO, isToday, isTomorrow, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { v4 as uuid } from 'uuid';
import { useStore } from '../../store/useStore';
import { PRIORITY_CONFIG, PROJECT_COLORS } from '../../utils/priority';
import type { Priority, Recurrence, Attachment } from '../../types';

const PRIORITIES: Priority[] = ['p1', 'p2', 'p3', 'p4'];

const RECURRENCE_OPTIONS: { label: string; value: Recurrence }[] = [
  { label: 'Nenhuma',       value: { type: 'none' } },
  { label: 'Diária',        value: { type: 'daily',   interval: 1 } },
  { label: 'A cada 2 dias', value: { type: 'daily',   interval: 2 } },
  { label: 'A cada 3 dias', value: { type: 'daily',   interval: 3 } },
  { label: 'Semanal',       value: { type: 'weekly',  interval: 1 } },
  { label: 'Mensal',        value: { type: 'monthly', interval: 1 } },
];

const COLOR_SWATCHES = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#6366f1', '#8b5cf6', '#ec4899',
];

function formatDueDate(dateStr: string | null) {
  if (!dateStr) return null;
  const d = parseISO(dateStr);
  if (isToday(d))    return 'Hoje';
  if (isTomorrow(d)) return 'Amanhã';
  return format(d, "d 'de' MMM, yyyy", { locale: ptBR });
}

function isOverdue(dateStr: string | null) {
  if (!dateStr) return false;
  return isPast(parseISO(dateStr)) && !isToday(parseISO(dateStr));
}

function formatMinutes(min: number | null): string {
  if (min === null || min === 0) return '';
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

// Auto-resize textarea hook
function useAutoResize(value: string) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }, [value]);
  return ref;
}

// ── Dropdown genérico ─────────────────────────────────────────────────────────
function FieldDropdown({
  trigger, children, open, onToggle, className = '',
}: {
  trigger: React.ReactNode;
  children: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onToggle();
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open, onToggle]);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button type="button" onClick={onToggle} className="w-full text-left">
        {trigger}
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 bg-[var(--c-card)] border border-[var(--c-border)] rounded-xl shadow-xl min-w-full">
          {children}
        </div>
      )}
    </div>
  );
}

export function TaskDetail() {
  const {
    selectedTaskId, setSelectedTask,
    tasks, updateTask, deleteTask, toggleTask, duplicateTask, convertSubtaskToTask,
    labels, projects, sections,
    addSubtask, toggleSubtask, deleteSubtask,
    addComment, deleteComment, addAttachment, deleteAttachment,
  } = useStore();

  const [newSubtask, setNewSubtask]   = useState('');
  const [dateOpen, setDateOpen]       = useState(false);
  const [timeOpen, setTimeOpen]       = useState(false);
  const [projectOpen, setProjectOpen] = useState(false);
  const [recurOpen, setRecurOpen]     = useState(false);
  const [newComment, setNewComment]   = useState('');
  const [depSearch, setDepSearch]     = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const task = tasks.find((t) => t.id === selectedTaskId);

  const titleRef = useAutoResize(task?.title ?? '');
  const descRef  = useAutoResize(task?.description ?? '');

  const handleAddComment = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !task) return;
    addComment(task.id, newComment.trim());
    setNewComment('');
  }, [newComment, task, addComment]);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!task) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      const attId = uuid();
      localStorage.setItem(`attachment_${attId}`, dataUrl);
      const att: Attachment = {
        id: attId,
        name: file.name,
        url: dataUrl,
        size: file.size,
      };
      addAttachment(task.id, att);
    };
    reader.readAsDataURL(file);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [task, addAttachment]);

  if (!task) return null;

  const today     = startOfToday();
  const dueFmt    = formatDueDate(task.dueDate);
  const overdue   = isOverdue(task.dueDate);
  const projectOf = projects.find(p => p.id === task.projectId);
  const sectionOf = sections.find(s => s.id === task.sectionId);

  const currentRecur = RECURRENCE_OPTIONS.find(o =>
    o.value.type === task.recurrence.type &&
    (o.value.interval === task.recurrence.interval || o.value.type === 'none')
  ) ?? RECURRENCE_OPTIONS[0];

  const toggleLabel = (labelId: string) => {
    const has = task.labelIds.includes(labelId);
    updateTask(task.id, {
      labelIds: has ? task.labelIds.filter(id => id !== labelId) : [...task.labelIds, labelId],
    });
  };

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtask.trim()) return;
    addSubtask(task.id, newSubtask.trim());
    setNewSubtask('');
  };

  const subtaskDone  = task.subtasks.filter(s => s.completed).length;
  const subtaskTotal = task.subtasks.length;
  const subtaskPct   = subtaskTotal > 0 ? (subtaskDone / subtaskTotal) * 100 : 0;

  const QUICK_DATES = [
    { label: 'Hoje',            date: format(today, 'yyyy-MM-dd') },
    { label: 'Amanhã',          date: format(addDays(today, 1), 'yyyy-MM-dd') },
    { label: 'Em 3 dias',       date: format(addDays(today, 3), 'yyyy-MM-dd') },
    { label: 'Próxima semana',  date: format(addDays(today, 7), 'yyyy-MM-dd') },
  ];

  const QUICK_TIMES = ['08:00','09:00','10:00','12:00','14:00','16:00','18:00','20:00'];

  // Dependencies: tasks not depending on each other
  const availableForDep = tasks.filter(t =>
    t.id !== task.id &&
    !task.dependencies.includes(t.id) &&
    (depSearch.trim() === '' || t.title.toLowerCase().includes(depSearch.toLowerCase()))
  );

  const toggleDep = (depId: string) => {
    const has = task.dependencies.includes(depId);
    updateTask(task.id, {
      dependencies: has ? task.dependencies.filter(d => d !== depId) : [...task.dependencies, depId],
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  return (
    <aside className="w-[22rem] bg-[var(--c-card)] border-l border-[var(--c-border)] flex flex-col overflow-y-auto shrink-0">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--c-border)] sticky top-0 bg-[var(--c-card)] z-10">
        <span className="text-xs font-semibold text-[var(--c-text3)] uppercase tracking-wider">Detalhes</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => duplicateTask(task.id)}
            className="p-1.5 rounded-lg hover:bg-[var(--c-hover)] text-[var(--c-text3)] hover:text-[var(--c-text2)] transition-colors" title="Duplicar">
            <Copy size={14} />
          </button>
          <button onClick={() => { deleteTask(task.id); setSelectedTask(null); }}
            className="p-1.5 rounded-lg hover:bg-red-50/10 text-[var(--c-text3)] hover:text-red-400 transition-colors" title="Excluir">
            <Trash2 size={14} />
          </button>
          <button onClick={() => setSelectedTask(null)}
            className="p-1.5 rounded-lg hover:bg-[var(--c-hover)] text-[var(--c-text3)]" title="Fechar">
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 px-5 py-5 space-y-6">

        {/* ── Título ── */}
        <div className="flex items-start gap-3">
          <button onClick={() => toggleTask(task.id)}
            className={`mt-1 shrink-0 transition-colors ${task.completed ? 'text-green-500' : PRIORITY_CONFIG[task.priority]?.color ?? 'text-gray-400'}`}>
            {task.completed ? <CheckSquare size={19} /> : <Square size={19} />}
          </button>
          <textarea
            ref={titleRef}
            value={task.title}
            onChange={e => updateTask(task.id, { title: e.target.value })}
            className={`flex-1 text-[15px] font-semibold text-[var(--c-text1)] focus:outline-none resize-none bg-transparent leading-snug overflow-hidden
              ${task.completed ? 'line-through text-[var(--c-text3)]' : ''}`}
            rows={1}
          />
        </div>

        {/* ── Color Tag ── */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Palette size={13} className="text-[var(--c-text3)]" />
            <span className="text-xs font-semibold text-[var(--c-text2)]">Cor da tarefa</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => updateTask(task.id, { colorTag: null })}
              className={`w-7 h-7 rounded-full border-2 bg-[var(--c-elevated)] flex items-center justify-center transition-all
                ${!task.colorTag ? 'border-indigo-400 scale-110' : 'border-[var(--c-border)]'}`}
              title="Sem cor"
            >
              <X size={10} className="text-[var(--c-text3)]" />
            </button>
            {COLOR_SWATCHES.map(hex => (
              <button key={hex}
                onClick={() => updateTask(task.id, { colorTag: hex })}
                className={`w-7 h-7 rounded-full border-2 transition-all ${task.colorTag === hex ? 'border-white scale-110 shadow-md' : 'border-transparent hover:scale-105'}`}
                style={{ backgroundColor: hex }}
                title={hex}
              />
            ))}
          </div>
        </div>

        {/* ── Descrição ── */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <AlignLeft size={13} className="text-[var(--c-text3)]" />
            <span className="text-xs font-semibold text-[var(--c-text2)]">Descrição</span>
          </div>
          <textarea
            ref={descRef}
            value={task.description}
            onChange={e => updateTask(task.id, { description: e.target.value })}
            placeholder="Adicionar descrição..."
            className="w-full text-sm text-[var(--c-text1)] focus:outline-none resize-none bg-[var(--c-elevated)] rounded-xl px-3 py-2.5 placeholder-[var(--c-text3)] min-h-[60px] overflow-hidden border border-transparent focus:border-indigo-400/50 transition-colors"
            rows={1}
          />
        </div>

        {/* ── Prazo + Hora ── */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Calendar size={13} className="text-[var(--c-text3)]" />
            <span className="text-xs font-semibold text-[var(--c-text2)]">Prazo</span>
          </div>
          <div className="flex gap-2">

            {/* Date picker */}
            <FieldDropdown
              className="flex-1"
              open={dateOpen}
              onToggle={() => setDateOpen(v => !v)}
              trigger={
                <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-all
                  ${task.dueDate
                    ? overdue
                      ? 'border-red-400/60 bg-red-500/10 text-red-400'
                      : task.dueDate === format(today, 'yyyy-MM-dd')
                        ? 'border-green-400/60 bg-green-500/10 text-green-400'
                        : 'border-[var(--c-border2)] bg-[var(--c-elevated)] text-[var(--c-text1)]'
                    : 'border-dashed border-[var(--c-border)] bg-transparent text-[var(--c-text3)]'}`}
                >
                  <Calendar size={13} className="shrink-0" />
                  <span className="flex-1 truncate">{dueFmt ?? 'Nenhuma data'}</span>
                  {task.dueDate && (
                    <button type="button" onClick={e => { e.stopPropagation(); updateTask(task.id, { dueDate: null }); }}
                      className="hover:text-red-400 ml-1">
                      <X size={11} />
                    </button>
                  )}
                </div>
              }
            >
              <div className="p-3 w-64">
                <div className="grid grid-cols-2 gap-1.5 mb-3">
                  {QUICK_DATES.map(q => (
                    <button key={q.label} type="button"
                      onClick={() => { updateTask(task.id, { dueDate: q.date }); setDateOpen(false); }}
                      className={`text-xs px-2 py-1.5 rounded-lg border text-left transition-all
                        ${task.dueDate === q.date
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'border-[var(--c-border)] text-[var(--c-text1)] hover:bg-[var(--c-hover)]'}`}>
                      {q.label}
                    </button>
                  ))}
                </div>
                <div className="border-t border-[var(--c-border)] pt-3">
                  <p className="text-xs text-[var(--c-text3)] mb-1.5">Data personalizada</p>
                  <input type="date" value={task.dueDate ?? ''}
                    onChange={e => { updateTask(task.id, { dueDate: e.target.value || null }); setDateOpen(false); }}
                    className="w-full text-sm px-2 py-1.5 rounded-lg border border-[var(--c-border)] bg-[var(--c-elevated)] text-[var(--c-text1)] focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
              </div>
            </FieldDropdown>

            {/* Time picker */}
            <FieldDropdown
              open={timeOpen}
              onToggle={() => setTimeOpen(v => !v)}
              trigger={
                <div className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl border text-sm w-24 transition-all
                  ${task.dueTime
                    ? 'border-[var(--c-border2)] bg-[var(--c-elevated)] text-[var(--c-text1)]'
                    : 'border-dashed border-[var(--c-border)] text-[var(--c-text3)]'}`}
                >
                  <Clock size={12} className="shrink-0" />
                  <span className="flex-1 text-xs truncate">{task.dueTime ?? '--:--'}</span>
                </div>
              }
            >
              <div className="p-2 w-36 max-h-52 overflow-y-auto">
                <button type="button"
                  onClick={() => { updateTask(task.id, { dueTime: null }); setTimeOpen(false); }}
                  className="w-full text-left text-xs px-2 py-1.5 rounded-lg text-[var(--c-text3)] hover:bg-[var(--c-hover)] mb-1">
                  Sem horário
                </button>
                {QUICK_TIMES.map(t => (
                  <button key={t} type="button"
                    onClick={() => { updateTask(task.id, { dueTime: t }); setTimeOpen(false); }}
                    className={`w-full text-left text-xs px-2 py-1.5 rounded-lg transition-all
                      ${task.dueTime === t
                        ? 'bg-indigo-600 text-white'
                        : 'text-[var(--c-text1)] hover:bg-[var(--c-hover)]'}`}>
                    {t}
                  </button>
                ))}
                <div className="border-t border-[var(--c-border)] mt-1 pt-1">
                  <input type="time" value={task.dueTime ?? ''}
                    onChange={e => { updateTask(task.id, { dueTime: e.target.value || null }); }}
                    className="w-full text-xs px-2 py-1.5 rounded-lg border border-[var(--c-border)] bg-[var(--c-elevated)] text-[var(--c-text1)] focus:outline-none"
                  />
                </div>
              </div>
            </FieldDropdown>

          </div>
        </div>

        {/* ── Estimativa de tempo ── */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Clock size={13} className="text-[var(--c-text3)]" />
            <span className="text-xs font-semibold text-[var(--c-text2)]">Tempo</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-[var(--c-text3)] mb-1 block">Estimado (min)</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="0"
                  value={task.estimatedMinutes ?? ''}
                  onChange={e => updateTask(task.id, { estimatedMinutes: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder="0"
                  className="w-full text-xs px-2 py-1.5 rounded-lg border border-[var(--c-border)] bg-[var(--c-elevated)] text-[var(--c-text1)] focus:outline-none focus:ring-1 focus:ring-indigo-400"
                />
              </div>
              {task.estimatedMinutes !== null && (
                <p className="text-xs text-[var(--c-text3)] mt-0.5">{formatMinutes(task.estimatedMinutes)}</p>
              )}
            </div>
            <div>
              <label className="text-xs text-[var(--c-text3)] mb-1 block">Registrado (min)</label>
              <input
                type="number"
                min="0"
                value={task.loggedMinutes ?? ''}
                onChange={e => updateTask(task.id, { loggedMinutes: e.target.value ? parseInt(e.target.value) : null })}
                placeholder="0"
                className="w-full text-xs px-2 py-1.5 rounded-lg border border-[var(--c-border)] bg-[var(--c-elevated)] text-[var(--c-text1)] focus:outline-none focus:ring-1 focus:ring-indigo-400"
              />
              {task.loggedMinutes !== null && (
                <p className="text-xs text-[var(--c-text3)] mt-0.5">{formatMinutes(task.loggedMinutes)}</p>
              )}
            </div>
          </div>
          {task.estimatedMinutes !== null && task.loggedMinutes !== null && task.estimatedMinutes > 0 && (
            <div className="mt-2">
              <div className="w-full h-1.5 bg-[var(--c-border2)] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${task.loggedMinutes > task.estimatedMinutes ? 'bg-red-500' : 'bg-indigo-500'}`}
                  style={{ width: `${Math.min((task.loggedMinutes / task.estimatedMinutes) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* ── Prioridade ── */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Flag size={13} className="text-[var(--c-text3)]" />
            <span className="text-xs font-semibold text-[var(--c-text2)]">Prioridade</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {PRIORITIES.map(p => {
              const cfg = PRIORITY_CONFIG[p];
              const active = task.priority === p;
              return (
                <button key={p} onClick={() => updateTask(task.id, { priority: p })}
                  className={`py-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 border
                    ${active
                      ? `${cfg.bg} ${cfg.color} border-transparent shadow-sm`
                      : 'bg-[var(--c-elevated)] border-[var(--c-border)] text-[var(--c-text3)] hover:bg-[var(--c-hover)]'}`}>
                  <Flag size={12} className={active ? '' : 'opacity-50'} />
                  {cfg.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Projeto / Seção ── */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <FolderOpen size={13} className="text-[var(--c-text3)]" />
            <span className="text-xs font-semibold text-[var(--c-text2)]">Projeto / Seção</span>
          </div>

          <FieldDropdown
            open={projectOpen}
            onToggle={() => setProjectOpen(v => !v)}
            trigger={
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-[var(--c-border)] bg-[var(--c-elevated)] text-sm hover:border-[var(--c-border2)] transition-all">
                {projectOf ? (
                  <>
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${PROJECT_COLORS[projectOf.color]?.dot ?? 'bg-gray-400'}`} />
                    <span className="flex-1 text-[var(--c-text1)] truncate">{projectOf.name}</span>
                    {sectionOf && (
                      <span className="text-xs text-[var(--c-text3)] flex items-center gap-1">
                        <Layers size={10} /> {sectionOf.name}
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full shrink-0 bg-gray-400" />
                    <span className="flex-1 text-[var(--c-text3)]">Caixa de Entrada</span>
                  </>
                )}
                <ChevronDown size={12} className="text-[var(--c-text3)] shrink-0" />
              </div>
            }
          >
            <div className="py-1 min-w-[200px] max-h-64 overflow-y-auto">
              <button type="button"
                onClick={() => { updateTask(task.id, { projectId: null, sectionId: null }); setProjectOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-[var(--c-hover)] transition-colors
                  ${!task.projectId ? 'text-indigo-400 font-medium' : 'text-[var(--c-text1)]'}`}>
                <span className="w-2.5 h-2.5 rounded-full bg-gray-400 shrink-0" />
                Caixa de Entrada
                {!task.projectId && <Check size={13} className="ml-auto" />}
              </button>

              {projects.filter(p => !p.archived).map(p => {
                const pSections = sections.filter(s => s.projectId === p.id);
                const isCurrentProj = task.projectId === p.id;
                return (
                  <div key={p.id}>
                    <button type="button"
                      onClick={() => { updateTask(task.id, { projectId: p.id, sectionId: null }); setProjectOpen(false); }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-[var(--c-hover)] transition-colors
                        ${isCurrentProj && !task.sectionId ? 'text-indigo-400 font-medium' : 'text-[var(--c-text1)]'}`}>
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${PROJECT_COLORS[p.color]?.dot ?? 'bg-gray-400'}`} />
                      {p.name}
                      {isCurrentProj && !task.sectionId && <Check size={13} className="ml-auto" />}
                    </button>
                    {pSections.map(s => (
                      <button key={s.id} type="button"
                        onClick={() => { updateTask(task.id, { projectId: p.id, sectionId: s.id }); setProjectOpen(false); }}
                        className={`w-full flex items-center gap-2 pl-7 pr-3 py-1.5 text-xs text-left hover:bg-[var(--c-hover)] transition-colors
                          ${task.sectionId === s.id ? 'text-indigo-400 font-medium' : 'text-[var(--c-text2)]'}`}>
                        <Layers size={10} className="shrink-0 opacity-60" />
                        {s.name}
                        {task.sectionId === s.id && <Check size={11} className="ml-auto" />}
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          </FieldDropdown>
        </div>

        {/* ── Recorrência ── */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <RepeatIcon size={13} className="text-[var(--c-text3)]" />
            <span className="text-xs font-semibold text-[var(--c-text2)]">Recorrência</span>
          </div>
          <FieldDropdown
            open={recurOpen}
            onToggle={() => setRecurOpen(v => !v)}
            trigger={
              <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm hover:border-[var(--c-border2)] transition-all
                ${task.recurrence.type !== 'none'
                  ? 'border-indigo-400/50 bg-indigo-500/10 text-indigo-400'
                  : 'border-[var(--c-border)] bg-[var(--c-elevated)] text-[var(--c-text1)]'}`}>
                <RepeatIcon size={13} className="shrink-0" />
                <span className="flex-1">{currentRecur.label}</span>
                <ChevronDown size={12} className="text-[var(--c-text3)] shrink-0" />
              </div>
            }
          >
            <div className="py-1 min-w-[180px]">
              {RECURRENCE_OPTIONS.map(opt => {
                const isActive = opt.value.type === task.recurrence.type &&
                  (opt.value.interval === task.recurrence.interval || opt.value.type === 'none');
                return (
                  <button key={opt.label} type="button"
                    onClick={() => { updateTask(task.id, { recurrence: opt.value }); setRecurOpen(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-[var(--c-hover)] transition-colors
                      ${isActive ? 'text-indigo-400 font-medium' : 'text-[var(--c-text1)]'}`}>
                    {opt.label}
                    {isActive && <Check size={13} className="ml-auto" />}
                  </button>
                );
              })}
            </div>
          </FieldDropdown>
        </div>

        {/* ── Etiquetas ── */}
        {labels.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Tag size={13} className="text-[var(--c-text3)]" />
              <span className="text-xs font-semibold text-[var(--c-text2)]">Etiquetas</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {labels.map(l => {
                const active = task.labelIds.includes(l.id);
                return (
                  <button key={l.id} onClick={() => toggleLabel(l.id)}
                    className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all border
                      ${active ? 'border-transparent' : 'border-[var(--c-border)] bg-[var(--c-elevated)] text-[var(--c-text2)] hover:bg-[var(--c-hover)]'}`}
                    style={active ? { backgroundColor: l.color + '22', color: l.color, borderColor: l.color + '44' } : {}}>
                    {active && '✓ '}{l.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Dependências ── */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Link2 size={13} className="text-[var(--c-text3)]" />
            <span className="text-xs font-semibold text-[var(--c-text2)]">Dependências</span>
            {task.dependencies.length > 0 && (
              <span className="text-xs bg-amber-500/15 text-amber-400 px-1.5 py-0.5 rounded-full">
                Bloqueada por {task.dependencies.length}
              </span>
            )}
          </div>

          {/* Current deps */}
          {task.dependencies.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {task.dependencies.map(depId => {
                const dep = tasks.find(t => t.id === depId);
                if (!dep) return null;
                return (
                  <span key={depId}
                    className="flex items-center gap-1 text-xs bg-amber-500/10 text-amber-400 px-2 py-1 rounded-lg">
                    {dep.title.substring(0, 25)}{dep.title.length > 25 ? '...' : ''}
                    <button onClick={() => toggleDep(depId)} className="hover:text-red-400 ml-0.5">
                      <X size={10} />
                    </button>
                  </span>
                );
              })}
            </div>
          )}

          {/* Search to add dep */}
          <input
            value={depSearch}
            onChange={e => setDepSearch(e.target.value)}
            placeholder="Buscar tarefa para adicionar..."
            className="w-full text-xs px-3 py-2 rounded-lg border border-[var(--c-border)] bg-[var(--c-elevated)] text-[var(--c-text1)] placeholder-[var(--c-text3)] focus:outline-none focus:ring-1 focus:ring-indigo-400"
          />
          {depSearch.trim() && (
            <div className="mt-1 max-h-32 overflow-y-auto rounded-lg border border-[var(--c-border)] bg-[var(--c-card)]">
              {availableForDep.slice(0, 8).map(t => (
                <button key={t.id}
                  onClick={() => { toggleDep(t.id); setDepSearch(''); }}
                  className="w-full text-left text-xs px-3 py-2 hover:bg-[var(--c-hover)] text-[var(--c-text1)] transition-colors">
                  {t.title}
                </button>
              ))}
              {availableForDep.length === 0 && (
                <p className="text-xs text-[var(--c-text3)] px-3 py-2">Nenhuma tarefa encontrada</p>
              )}
            </div>
          )}
        </div>

        {/* ── Subtarefas ── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <CheckSquare size={13} className="text-[var(--c-text3)]" />
              <span className="text-xs font-semibold text-[var(--c-text2)]">Subtarefas</span>
              {subtaskTotal > 0 && (
                <span className="text-xs text-[var(--c-text3)] ml-0.5">{subtaskDone}/{subtaskTotal}</span>
              )}
            </div>
          </div>

          {/* Progress bar */}
          {subtaskTotal > 0 && (
            <div className="mb-3">
              <div className="w-full h-1.5 bg-[var(--c-border2)] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${subtaskPct === 100 ? 'bg-green-500' : 'bg-indigo-500'}`}
                  style={{ width: `${subtaskPct}%` }}
                />
              </div>
              {subtaskPct === 100 && (
                <p className="text-xs text-green-500 mt-1">🎉 Todas concluídas!</p>
              )}
            </div>
          )}

          <div className="space-y-1 mb-3">
            {task.subtasks.map(st => (
              <div key={st.id}
                className="flex items-center gap-2 group px-2 py-1.5 rounded-lg hover:bg-[var(--c-hover)] transition-colors">
                <button onClick={() => toggleSubtask(task.id, st.id)} className="shrink-0 transition-colors">
                  {st.completed
                    ? <CheckSquare size={15} className="text-indigo-400" />
                    : <Square size={15} className="text-[var(--c-text3)]" />}
                </button>
                <span className={`flex-1 text-sm ${st.completed ? 'line-through text-[var(--c-text3)]' : 'text-[var(--c-text1)]'}`}>
                  {st.title}
                </span>
                <button
                  onClick={() => convertSubtaskToTask(task.id, st.id)}
                  title="Converter em tarefa"
                  className="opacity-0 group-hover:opacity-100 text-[var(--c-text3)] hover:text-indigo-400 transition-all">
                  <ArrowUpRight size={13} />
                </button>
                <button onClick={() => deleteSubtask(task.id, st.id)}
                  className="opacity-0 group-hover:opacity-100 text-[var(--c-text3)] hover:text-red-400 transition-all">
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>

          <form onSubmit={handleAddSubtask}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg border border-dashed border-[var(--c-border)] hover:border-indigo-400/50 transition-colors group/add">
            <Plus size={13} className="text-[var(--c-text3)] group-focus-within/add:text-indigo-400 shrink-0 transition-colors" />
            <input
              value={newSubtask}
              onChange={e => setNewSubtask(e.target.value)}
              placeholder="Adicionar subtarefa..."
              className="flex-1 text-sm text-[var(--c-text1)] placeholder-[var(--c-text3)] focus:outline-none bg-transparent"
            />
            {newSubtask.trim() && (
              <button type="submit" className="text-indigo-400 hover:text-indigo-500">
                <Check size={13} />
              </button>
            )}
          </form>
        </div>

        {/* ── Anexos ── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Paperclip size={13} className="text-[var(--c-text3)]" />
              <span className="text-xs font-semibold text-[var(--c-text2)]">Anexos</span>
              {task.attachments.length > 0 && (
                <span className="text-xs text-[var(--c-text3)]">({task.attachments.length})</span>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-indigo-400 hover:text-indigo-500 flex items-center gap-1">
              <Plus size={11} /> Adicionar
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
          />
          {task.attachments.length > 0 && (
            <div className="space-y-1.5">
              {task.attachments.map(att => (
                <div key={att.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--c-elevated)] border border-[var(--c-border)] group">
                  <Paperclip size={12} className="text-[var(--c-text3)] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <a href={att.url} download={att.name}
                      className="text-xs text-indigo-400 hover:text-indigo-500 truncate block" title={att.name}>
                      {att.name}
                    </a>
                    <p className="text-xs text-[var(--c-text3)]">{formatFileSize(att.size)}</p>
                  </div>
                  <button onClick={() => deleteAttachment(task.id, att.id)}
                    className="opacity-0 group-hover:opacity-100 text-[var(--c-text3)] hover:text-red-400 transition-all shrink-0">
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Comentários ── */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <MessageSquare size={13} className="text-[var(--c-text3)]" />
            <span className="text-xs font-semibold text-[var(--c-text2)]">Comentários</span>
            {task.comments.length > 0 && (
              <span className="text-xs text-[var(--c-text3)]">({task.comments.length})</span>
            )}
          </div>

          {task.comments.length > 0 && (
            <div className="space-y-2 mb-3">
              {task.comments.map(c => (
                <div key={c.id}
                  className="px-3 py-2.5 rounded-xl bg-[var(--c-elevated)] border border-[var(--c-border)] group relative">
                  <p className="text-sm text-[var(--c-text1)] whitespace-pre-wrap">{c.text}</p>
                  <p className="text-xs text-[var(--c-text3)] mt-1">
                    {format(parseISO(c.createdAt), "d 'de' MMM, HH:mm", { locale: ptBR })}
                  </p>
                  <button
                    onClick={() => deleteComment(task.id, c.id)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-[var(--c-text3)] hover:text-red-400 transition-all">
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleAddComment} className="space-y-2">
            <textarea
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleAddComment(e); }}
              placeholder="Adicionar comentário... (Ctrl+Enter para enviar)"
              rows={2}
              className="w-full text-sm px-3 py-2 rounded-xl border border-[var(--c-border)] bg-[var(--c-elevated)] text-[var(--c-text1)] placeholder-[var(--c-text3)] focus:outline-none focus:ring-1 focus:ring-indigo-400 resize-none"
            />
            {newComment.trim() && (
              <button type="submit"
                className="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 flex items-center gap-1">
                <Check size={11} /> Comentar
              </button>
            )}
          </form>
        </div>

      </div>
    </aside>
  );
}
