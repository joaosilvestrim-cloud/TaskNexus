import { useEffect, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { X, Target, CheckCircle2, Clock, Power } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { PRIORITY_CONFIG } from '../../utils/priority';

export function FocusMode() {
  const {
    tasks, setActiveView, setSelectedTask, selectedTaskId,
    updateTask, projects, focusActive, toggleFocus,
  } = useStore();

  // Escape to exit
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveView('kanban');
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [setActiveView]);

  const todayStr = new Date().toISOString().split('T')[0];

  const focusTasks = useMemo(() => {
    if (!focusActive) return [];
    return tasks.filter(t => {
      if (t.completed) return false;
      if (t.dueDate === todayStr) return true;
      if (t.dueDate && t.dueDate < todayStr) return true;
      return false;
    }).sort((a, b) => {
      const aOverdue = a.dueDate && a.dueDate < todayStr;
      const bOverdue = b.dueDate && b.dueDate < todayStr;
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;
      return a.priority.localeCompare(b.priority);
    });
  }, [tasks, todayStr, focusActive]);

  const totalToday = tasks.filter(t => t.dueDate === todayStr).length;
  const doneToday  = tasks.filter(t => t.completed && t.completedAt?.startsWith(todayStr)).length;
  const progress   = totalToday > 0 ? (doneToday / totalToday) * 100 : 0;
  const overdueTasks = focusTasks.filter(t => t.dueDate && t.dueDate < todayStr);
  const todayTasks   = focusTasks.filter(t => t.dueDate === todayStr);
  const getProject   = (id: string | null) => projects.find(p => p.id === id);

  return (
    <div className="flex-1 flex flex-col bg-[var(--c-bg)]">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-[var(--c-border)]">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${focusActive ? 'bg-indigo-600' : 'bg-[var(--c-hover)]'}`}>
            <Target size={18} className={focusActive ? 'text-white' : 'text-[var(--c-text3)]'} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[var(--c-text1)]">Modo Foco</h1>
            <p className="text-xs text-[var(--c-text3)]">
              {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Toggle ON/OFF */}
          <div className="flex items-center gap-2.5">
            <span className={`text-sm font-medium transition-colors ${focusActive ? 'text-indigo-400' : 'text-[var(--c-text3)]'}`}>
              {focusActive ? 'Ativo' : 'Inativo'}
            </span>
            <button
              onClick={toggleFocus}
              className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
                focusActive ? 'bg-indigo-600' : 'bg-[var(--c-border2)]'
              }`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                focusActive ? 'translate-x-6' : 'translate-x-0'
              }`} />
            </button>
            <Power size={15} className={focusActive ? 'text-indigo-400' : 'text-[var(--c-text3)]'} />
          </div>

          <div className="w-px h-5 bg-[var(--c-border)]" />

          <button
            onClick={() => setActiveView('kanban')}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[var(--c-text3)] hover:bg-[var(--c-hover)] hover:text-[var(--c-text2)] transition-colors">
            <X size={14} /> Sair (Esc)
          </button>
        </div>
      </div>

      {/* ── Desativado ─────────────────────────────────────────────── */}
      {!focusActive && (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center px-8">
          <div className="w-20 h-20 rounded-3xl bg-[var(--c-hover)] flex items-center justify-center">
            <Target size={40} className="text-[var(--c-text3)]" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[var(--c-text1)]">Modo Foco desativado</p>
            <p className="text-[var(--c-text3)] text-sm mt-2 max-w-sm">
              Ative para ver apenas as tarefas de hoje e as atrasadas, sem distrações.
            </p>
          </div>
          <button
            onClick={toggleFocus}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-colors shadow-lg"
          >
            <Power size={17} /> Ativar Modo Foco
          </button>
          <p className="text-xs text-[var(--c-text3)]">
            {totalToday} tarefa(s) para hoje · {overdueTasks.length === 0 && !focusActive ? tasks.filter(t => !t.completed && t.dueDate && t.dueDate < todayStr).length : overdueTasks.length} atrasada(s)
          </p>
        </div>
      )}

      {/* ── Ativo ──────────────────────────────────────────────────── */}
      {focusActive && (
        <>
          {/* Progress */}
          <div className="px-8 py-4 border-b border-[var(--c-border)] bg-[var(--c-elevated)]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-green-400" />
                <span className="text-sm font-medium text-[var(--c-text1)]">
                  {doneToday} de {totalToday} concluídas hoje
                </span>
              </div>
              <span className="text-sm font-bold text-indigo-400">{Math.round(progress)}%</span>
            </div>
            <div className="w-full h-2.5 bg-[var(--c-border2)] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${progress === 100 ? 'bg-green-500' : 'bg-indigo-500'}`}
                style={{ width: `${progress}%` }}
              />
            </div>
            {progress === 100 && totalToday > 0 && (
              <p className="text-sm text-green-500 mt-2 text-center font-medium">
                🎉 Parabéns! Todas as tarefas de hoje foram concluídas!
              </p>
            )}
            {focusTasks.length === 0 && (
              <p className="text-sm text-[var(--c-text3)] mt-2 text-center">
                Nenhuma tarefa pendente para hoje. Aproveite! 🌟
              </p>
            )}
          </div>

          {/* Tasks */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-2xl mx-auto px-8 py-6 space-y-6">

              {overdueTasks.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Clock size={14} className="text-red-400" />
                    <h2 className="text-sm font-semibold text-red-400">Atrasadas ({overdueTasks.length})</h2>
                  </div>
                  <div className="space-y-2">
                    {overdueTasks.map(t => (
                      <FocusTaskItem key={t.id} task={t} isSelected={t.id === selectedTaskId}
                        onSelect={() => setSelectedTask(t.id === selectedTaskId ? null : t.id)}
                        onToggle={() => updateTask(t.id, { completed: true, status: 'done' })}
                        getProject={getProject} isOverdue />
                    ))}
                  </div>
                </div>
              )}

              {todayTasks.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Target size={14} className="text-indigo-400" />
                    <h2 className="text-sm font-semibold text-[var(--c-text1)]">Para hoje ({todayTasks.length})</h2>
                  </div>
                  <div className="space-y-2">
                    {todayTasks.map(t => (
                      <FocusTaskItem key={t.id} task={t} isSelected={t.id === selectedTaskId}
                        onSelect={() => setSelectedTask(t.id === selectedTaskId ? null : t.id)}
                        onToggle={() => updateTask(t.id, { completed: true, status: 'done' })}
                        getProject={getProject} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function FocusTaskItem({ task, isSelected, onSelect, onToggle, getProject, isOverdue }: {
  task: ReturnType<typeof useStore.getState>['tasks'][0];
  isSelected: boolean;
  onSelect: () => void;
  onToggle: () => void;
  getProject: (id: string | null) => { name: string } | undefined;
  isOverdue?: boolean;
}) {
  const cfg = PRIORITY_CONFIG[task.priority];
  const proj = getProject(task.projectId);

  return (
    <div
      onClick={onSelect}
      className={`flex items-center gap-4 px-4 py-3.5 rounded-xl border cursor-pointer transition-all group
        ${isSelected
          ? 'bg-[var(--c-active)] border-indigo-500'
          : 'bg-[var(--c-card)] border-[var(--c-border)] hover:border-[var(--c-border2)] hover:bg-[var(--c-hover)]'}
        ${isOverdue ? 'border-l-4 border-l-red-500' : ''}`}
      style={task.colorTag ? { borderLeftColor: task.colorTag, borderLeftWidth: '4px' } : {}}
    >
      <button
        onClick={e => { e.stopPropagation(); onToggle(); }}
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all
          ${task.completed ? 'bg-green-600 border-green-600' : 'border-[var(--c-border2)] hover:border-indigo-400'}`}
      >
        {task.completed && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 10 10">
            <path d="M1.5 5l2.5 2.5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${task.completed ? 'line-through text-[var(--c-text3)]' : 'text-[var(--c-text1)]'}`}>
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {proj && <span className="text-xs text-[var(--c-text3)]">{proj.name}</span>}
          {isOverdue && task.dueDate && (
            <span className="text-xs text-red-400">
              Venceu {format(parseISO(task.dueDate), "d 'de' MMM", { locale: ptBR })}
            </span>
          )}
        </div>
      </div>

      <span className={`text-xs font-bold px-2 py-0.5 rounded shrink-0 ${cfg?.color ?? ''}`}>
        {task.priority.toUpperCase()}
      </span>
    </div>
  );
}
