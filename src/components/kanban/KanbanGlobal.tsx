import { useState } from 'react';
import { Plus, MoreHorizontal, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useStore } from '../../store/useStore';
import { PRIORITY_CONFIG } from '../../utils/priority';
import type { Task, TaskStatus } from '../../types';

const COLUMNS: { id: TaskStatus; label: string; color: string; dot: string }[] = [
  { id: 'backlog',     label: 'Backlog',      color: 'text-gray-400',  dot: 'bg-gray-500' },
  { id: 'todo',        label: 'A fazer',      color: 'text-blue-400',  dot: 'bg-blue-500' },
  { id: 'in_progress', label: 'Em progresso', color: 'text-yellow-400',dot: 'bg-yellow-400' },
  { id: 'done',        label: 'Concluído',    color: 'text-green-400', dot: 'bg-green-500' },
];

export function KanbanGlobal() {
  const { tasks, projects, updateTask, setSelectedTask, selectedTaskId, addTask } = useStore();
  const [addingTo, setAddingTo] = useState<TaskStatus | null>(null);
  const [newTitle, setNewTitle] = useState('');

  const getProject = (id: string | null) => projects.find(p => p.id === id);

  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) updateTask(taskId, { status, completed: status === 'done' });
    e.currentTarget.classList.remove('ring-2', 'ring-indigo-500');
  };

  const handleAddTask = (status: TaskStatus) => {
    if (!newTitle.trim()) { setAddingTo(null); return; }
    addTask({ title: newTitle.trim(), status });
    setNewTitle('');
    setAddingTo(null);
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-[var(--c-border)]">
        <div className="w-5 h-5 grid grid-cols-2 gap-0.5">
          {[0,1,2,3].map(i => <div key={i} className="bg-[var(--c-text3)] rounded-sm" />)}
        </div>
        <h1 className="text-base font-semibold text-[var(--c-text1)]">Kanban</h1>
      </div>

      {/* Board */}
      <div className="flex gap-4 p-6 overflow-x-auto flex-1 items-start">
        {COLUMNS.map(col => {
          const colTasks = tasks
            .filter(t => t.status === col.id)
            .sort((a, b) => a.order - b.order);

          return (
            <div key={col.id} className="flex-shrink-0 w-72 flex flex-col"
              onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('ring-2','ring-indigo-500','rounded-xl'); }}
              onDragLeave={e => e.currentTarget.classList.remove('ring-2','ring-indigo-500','rounded-xl')}
              onDrop={e => handleDrop(e, col.id)}
            >
              {/* Column header */}
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold ${col.color}`}>
                    {col.label}
                  </span>
                  <span className="text-xs text-[var(--c-text3)] bg-[var(--c-hover)] px-1.5 py-0.5 rounded-full">
                    {colTasks.length}
                  </span>
                </div>
                <button className="p-1 rounded hover:bg-[var(--c-hover)] text-[var(--c-text3)] hover:text-[var(--c-text2)]">
                  <MoreHorizontal size={14} />
                </button>
              </div>

              {/* Cards */}
              <div className="space-y-2 min-h-16">
                {/* Group by date in backlog */}
                {col.id === 'backlog'
                  ? <BacklogGrouped tasks={colTasks} onSelect={setSelectedTask} selectedId={selectedTaskId} getProject={getProject} />
                  : colTasks.map(t => (
                    <TaskCard key={t.id} task={t} isSelected={selectedTaskId === t.id}
                      onSelect={() => setSelectedTask(t.id === selectedTaskId ? null : t.id)}
                      getProject={getProject}
                    />
                  ))
                }
              </div>

              {/* Add task */}
              {addingTo === col.id ? (
                <div className="mt-2 bg-[var(--c-card)] rounded-xl p-3 border border-[var(--c-border2)]">
                  <input autoFocus value={newTitle} onChange={e => setNewTitle(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleAddTask(col.id); if (e.key === 'Escape') { setAddingTo(null); setNewTitle(''); } }}
                    placeholder="Nome da tarefa..."
                    className="w-full bg-transparent text-sm text-[var(--c-text1)] placeholder-[var(--c-text3)] focus:outline-none"
                  />
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => handleAddTask(col.id)} className="px-3 py-1 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700">
                      Salvar
                    </button>
                    <button onClick={() => { setAddingTo(null); setNewTitle(''); }} className="px-3 py-1 text-[var(--c-text2)] text-xs rounded-lg hover:bg-[var(--c-hover)]">
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setAddingTo(col.id)}
                  className="mt-2 flex items-center gap-2 w-full px-2 py-2 text-xs text-[var(--c-text3)] hover:text-[var(--c-text2)] hover:bg-[var(--c-hover)] rounded-xl transition-colors">
                  <Plus size={13} /> Nova tarefa
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Backlog agrupado por data ─────────────────────────────────────────────────
function BacklogGrouped({ tasks, onSelect, selectedId, getProject }:{
  tasks: Task[];
  onSelect: (id: string | null) => void;
  selectedId: string | null;
  getProject: (id: string | null) => { name: string; color: string } | undefined;
}) {
  // Group by date
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

  return (
    <div className="space-y-3">
      {sortedKeys.map(key => (
        <div key={key}>
          <div className="flex items-center gap-2 mb-1.5 px-1">
            <Calendar size={11} className="text-red-400" />
            <span className="text-xs text-[var(--c-text2)] font-medium">
              {key === 'sem-data' ? 'Sem data' : format(parseISO(key), "d 'de' MMM", { locale: ptBR })}
            </span>
          </div>
          <div className="space-y-1.5">
            {groups[key].map(t => (
              <TaskCard key={t.id} task={t} isSelected={selectedId === t.id}
                onSelect={() => onSelect(t.id === selectedId ? null : t.id)}
                getProject={getProject}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Card de tarefa ────────────────────────────────────────────────────────────
function TaskCard({ task, isSelected, onSelect, getProject }: {
  task: Task;
  isSelected: boolean;
  onSelect: () => void;
  getProject: (id: string | null) => { name: string; color: string } | undefined;
}) {
  const project = getProject(task.projectId);
  const cfg = PRIORITY_CONFIG[task.priority];
  const { updateTask } = useStore();

  const PROJECT_DOT: Record<string, string> = {
    red:'bg-red-500', orange:'bg-orange-500', yellow:'bg-yellow-500',
    green:'bg-green-500', teal:'bg-teal-500', blue:'bg-blue-500',
    indigo:'bg-indigo-500', purple:'bg-purple-500', pink:'bg-pink-500', gray:'bg-gray-500',
  };

  return (
    <div
      draggable
      onDragStart={e => e.dataTransfer.setData('taskId', task.id)}
      onClick={onSelect}
      className={`group rounded-xl p-3 border cursor-pointer transition-all select-none
        ${isSelected
          ? 'bg-[var(--c-active)] border-indigo-500'
          : 'bg-[var(--c-card)] border-[var(--c-border)] hover:border-[var(--c-border2)] hover:bg-[var(--c-hover)]'}
        ${task.completed ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start gap-2">
        {/* Checkbox */}
        <button
          onClick={e => { e.stopPropagation(); updateTask(task.id, { completed: !task.completed, status: !task.completed ? 'done' : 'backlog' }); }}
          className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors
            ${task.completed ? 'bg-green-600 border-green-600' : 'border-[var(--c-border2)] hover:border-[var(--c-text3)]'}`}
        >
          {task.completed && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10"><path d="M1.5 5l2.5 2.5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
        </button>

        <div className="flex-1 min-w-0">
          <p className={`text-sm leading-snug ${task.completed ? 'line-through text-[var(--c-text3)]' : 'text-[var(--c-text1)]'}`}>
            {task.title}
          </p>
          {project && (
            <div className="flex items-center gap-1 mt-1.5">
              <span className={`w-2 h-2 rounded-full shrink-0 ${PROJECT_DOT[project.color] ?? 'bg-gray-500'}`} />
              <span className="text-xs text-[var(--c-text3)]">{project.name}</span>
            </div>
          )}
        </div>

        {/* Priority dot */}
        {task.priority !== 'p4' && (
          <span className={`text-xs font-bold shrink-0 mt-0.5 ${cfg.color}`}>{cfg.label}</span>
        )}
      </div>
    </div>
  );
}
