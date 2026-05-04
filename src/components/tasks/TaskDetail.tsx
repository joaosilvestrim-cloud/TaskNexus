import { useState } from 'react';
import { X, Trash2, Calendar, Flag, Tag, Plus, CheckSquare, Square, RepeatIcon, AlignLeft } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { PRIORITY_CONFIG } from '../../utils/priority';
import type { Priority, Recurrence } from '../../types';

const PRIORITIES: Priority[] = ['p1', 'p2', 'p3', 'p4'];

const RECURRENCE_OPTIONS: { label: string; value: Recurrence }[] = [
  { label: 'Nenhuma', value: { type: 'none' } },
  { label: 'Diária', value: { type: 'daily', interval: 1 } },
  { label: 'Semanal', value: { type: 'weekly', interval: 1 } },
  { label: 'Mensal', value: { type: 'monthly', interval: 1 } },
  { label: 'A cada 2 dias', value: { type: 'daily', interval: 2 } },
  { label: 'A cada 3 dias', value: { type: 'daily', interval: 3 } },
];

export function TaskDetail() {
  const {
    selectedTaskId, setSelectedTask,
    tasks, updateTask, deleteTask, toggleTask,
    labels, projects, sections,
    addSubtask, toggleSubtask, deleteSubtask,
  } = useStore();

  const [newSubtask, setNewSubtask] = useState('');

  const task = tasks.find((t) => t.id === selectedTaskId);
  if (!task) return null;


  const toggleLabel = (labelId: string) => {
    const has = task.labelIds.includes(labelId);
    updateTask(task.id, {
      labelIds: has ? task.labelIds.filter((id) => id !== labelId) : [...task.labelIds, labelId],
    });
  };

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtask.trim()) return;
    addSubtask(task.id, newSubtask.trim());
    setNewSubtask('');
  };

  return (
    <aside className="w-96 bg-white border-l border-gray-200 flex flex-col overflow-y-auto shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
        <span className="text-xs text-gray-400 font-medium">Detalhes da Tarefa</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => { deleteTask(task.id); }}
            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
          >
            <Trash2 size={15} />
          </button>
          <button
            onClick={() => setSelectedTask(null)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      <div className="flex-1 px-5 py-4 space-y-5">
        {/* Title */}
        <div>
          <div className="flex items-start gap-3">
            <button onClick={() => toggleTask(task.id)} className={`mt-1 shrink-0 ${PRIORITY_CONFIG[task.priority].color}`}>
              {task.completed
                ? <CheckSquare size={20} className="text-gray-300" />
                : <Square size={20} />}
            </button>
            <textarea
              value={task.title}
              onChange={(e) => updateTask(task.id, { title: e.target.value })}
              className={`flex-1 text-base font-medium text-gray-900 focus:outline-none resize-none bg-transparent leading-snug
                ${task.completed ? 'line-through text-gray-400' : ''}`}
              rows={2}
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <AlignLeft size={14} className="text-gray-400" />
            <span className="text-xs font-medium text-gray-500">Descrição</span>
          </div>
          <textarea
            value={task.description}
            onChange={(e) => updateTask(task.id, { description: e.target.value })}
            placeholder="Adicionar descrição..."
            className="w-full text-sm text-gray-700 focus:outline-none resize-none bg-gray-50 rounded-lg px-3 py-2 placeholder-gray-400"
            rows={3}
          />
        </div>

        {/* Due date & time */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={14} className="text-gray-400" />
            <span className="text-xs font-medium text-gray-500">Prazo</span>
          </div>
          <div className="flex gap-2">
            <input
              type="date"
              value={task.dueDate ?? ''}
              onChange={(e) => updateTask(task.id, { dueDate: e.target.value || null })}
              className="flex-1 text-sm px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            <input
              type="time"
              value={task.dueTime ?? ''}
              onChange={(e) => updateTask(task.id, { dueTime: e.target.value || null })}
              className="w-28 text-sm px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
        </div>

        {/* Priority */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Flag size={14} className="text-gray-400" />
            <span className="text-xs font-medium text-gray-500">Prioridade</span>
          </div>
          <div className="flex gap-2">
            {PRIORITIES.map((p) => {
              const cfg = PRIORITY_CONFIG[p];
              return (
                <button
                  key={p}
                  onClick={() => updateTask(task.id, { priority: p })}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all
                    ${task.priority === p
                      ? `${cfg.bg} ${cfg.color} ring-1 ${cfg.ring}`
                      : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                >
                  {cfg.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Project & Section */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium text-gray-500">Projeto / Seção</span>
          </div>
          <div className="flex gap-2">
            <select
              value={task.projectId ?? ''}
              onChange={(e) => updateTask(task.id, { projectId: e.target.value || null, sectionId: null })}
              className="flex-1 text-sm px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
            >
              <option value="">Caixa de Entrada</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            {task.projectId && (
              <select
                value={task.sectionId ?? ''}
                onChange={(e) => updateTask(task.id, { sectionId: e.target.value || null })}
                className="flex-1 text-sm px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
              >
                <option value="">Sem seção</option>
                {sections.filter((s) => s.projectId === task.projectId).map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Recurrence */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <RepeatIcon size={14} className="text-gray-400" />
            <span className="text-xs font-medium text-gray-500">Recorrência</span>
          </div>
          <select
            value={task.recurrence.type === 'none' ? 'none' : JSON.stringify(task.recurrence)}
            onChange={(e) => {
              const val = e.target.value;
              updateTask(task.id, { recurrence: val === 'none' ? { type: 'none' } : JSON.parse(val) });
            }}
            className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
          >
            {RECURRENCE_OPTIONS.map((opt) => (
              <option key={opt.label} value={opt.value.type === 'none' ? 'none' : JSON.stringify(opt.value)}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Labels */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Tag size={14} className="text-gray-400" />
            <span className="text-xs font-medium text-gray-500">Etiquetas</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {labels.map((l) => {
              const active = task.labelIds.includes(l.id);
              return (
                <button
                  key={l.id}
                  onClick={() => toggleLabel(l.id)}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all border
                    ${active ? 'border-transparent' : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'}`}
                  style={active ? { backgroundColor: l.color + '22', color: l.color, borderColor: l.color + '44' } : {}}
                >
                  @{l.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Subtasks */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <CheckSquare size={14} className="text-gray-400" />
            <span className="text-xs font-medium text-gray-500">
              Subtarefas {task.subtasks.length > 0 && `(${task.subtasks.filter(s => s.completed).length}/${task.subtasks.length})`}
            </span>
          </div>
          <div className="space-y-1 mb-2">
            {task.subtasks.map((st) => (
              <div key={st.id} className="flex items-center gap-2 group">
                <button onClick={() => toggleSubtask(task.id, st.id)}
                  className={st.completed ? 'text-gray-300' : 'text-gray-500'}>
                  {st.completed
                    ? <CheckSquare size={15} className="text-indigo-400" />
                    : <Square size={15} />}
                </button>
                <span className={`flex-1 text-sm ${st.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                  {st.title}
                </span>
                <button
                  onClick={() => deleteSubtask(task.id, st.id)}
                  className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all"
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
          <form onSubmit={handleAddSubtask} className="flex items-center gap-2">
            <Plus size={14} className="text-gray-400 shrink-0" />
            <input
              value={newSubtask}
              onChange={(e) => setNewSubtask(e.target.value)}
              placeholder="Adicionar subtarefa..."
              className="flex-1 text-sm text-gray-700 placeholder-gray-400 focus:outline-none bg-transparent border-b border-gray-200 pb-1 focus:border-indigo-400"
            />
          </form>
        </div>
      </div>
    </aside>
  );
}
