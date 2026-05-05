import { format, parseISO, isToday, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle2, Circle, Calendar, ChevronRight, RepeatIcon } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { PRIORITY_CONFIG } from '../../utils/priority';
import type { Task } from '../../types';

interface Props {
  task: Task;
  showProject?: boolean;
}

export function TaskRow({ task, showProject }: Props) {
  const { toggleTask, setSelectedTask, selectedTaskId, labels, projects } = useStore();
  const isSelected = selectedTaskId === task.id;
  const cfg = PRIORITY_CONFIG[task.priority];

  const dueDateLabel = task.dueDate
    ? isToday(parseISO(task.dueDate))
      ? `Hoje${task.dueTime ? ` ${task.dueTime}` : ''}`
      : format(parseISO(task.dueDate), "d MMM", { locale: ptBR }) + (task.dueTime ? ` ${task.dueTime}` : '')
    : null;

  const isOverdue =
    !task.completed &&
    !!task.dueDate &&
    isPast(parseISO(task.dueDate)) &&
    !isToday(parseISO(task.dueDate));

  const taskLabels = labels.filter((l) => task.labelIds.includes(l.id));
  const project = projects.find((p) => p.id === task.projectId);
  const subtaskDone = task.subtasks.filter((s) => s.completed).length;
  const subtaskTotal = task.subtasks.length;

  return (
    <div
      onClick={() => setSelectedTask(isSelected ? null : task.id)}
      className={`group flex items-start gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all
        ${isSelected ? 'bg-[var(--c-active)] ring-1 ring-indigo-300' : 'hover:bg-[var(--c-hover)]'}
        ${task.completed ? 'opacity-50' : ''}`}
    >
      {/* Checkbox */}
      <button
        onClick={(e) => { e.stopPropagation(); toggleTask(task.id); }}
        className={`mt-0.5 shrink-0 transition-colors ${cfg.color}`}
      >
        {task.completed
          ? <CheckCircle2 size={18} className="text-gray-300" />
          : <Circle size={18} />}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-snug ${task.completed ? 'line-through text-[var(--c-text3)]' : 'text-[var(--c-text1)]'}`}>
          {task.title}
        </p>

        <div className="flex flex-wrap items-center gap-2 mt-1">
          {/* Due date */}
          {dueDateLabel && (
            <span className={`flex items-center gap-1 text-xs font-medium
              ${isOverdue ? 'text-red-500' : isToday(parseISO(task.dueDate!)) ? 'text-green-600' : 'text-gray-400'}`}>
              <Calendar size={11} />
              {dueDateLabel}
            </span>
          )}

          {/* Recurrence */}
          {task.recurrence.type !== 'none' && (
            <RepeatIcon size={11} className="text-gray-400" />
          )}

          {/* Subtasks */}
          {subtaskTotal > 0 && (
            <span className="text-xs text-gray-400">
              {subtaskDone}/{subtaskTotal}
            </span>
          )}

          {/* Labels */}
          {taskLabels.map((l) => (
            <span key={l.id}
              className="text-xs px-1.5 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: l.color + '22', color: l.color }}>
              @{l.name}
            </span>
          ))}

          {/* Project name (when in Today/Upcoming views) */}
          {showProject && project && (
            <span className="text-xs text-[var(--c-text3)]">· {project.name}</span>
          )}
        </div>
      </div>

      <ChevronRight size={14}
        className={`mt-1 shrink-0 transition-opacity ${isSelected ? 'text-indigo-400 opacity-100' : 'opacity-0 group-hover:opacity-100 text-[var(--c-text3)]'}`}
      />
    </div>
  );
}
