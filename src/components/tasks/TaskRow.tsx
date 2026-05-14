import { format, parseISO, isToday, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle2, Circle, Calendar, ChevronRight, RepeatIcon, MessageSquare, Paperclip } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { PRIORITY_CONFIG } from '../../utils/priority';
import type { Task } from '../../types';

interface Props {
  task: Task;
  showProject?: boolean;
}

const PRIORITY_ACCENT: Record<string, string> = {
  p1: '#ef4444',
  p2: '#f97316',
  p3: '#6366f1',
  p4: 'transparent',
};

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

  const isDueToday = !!task.dueDate && isToday(parseISO(task.dueDate));

  const taskLabels = labels.filter((l) => task.labelIds.includes(l.id));
  const project = projects.find((p) => p.id === task.projectId);
  const subtaskDone  = task.subtasks.filter((s) => s.completed).length;
  const subtaskTotal = task.subtasks.length;

  const accentColor = PRIORITY_ACCENT[task.priority] ?? 'transparent';

  return (
    <div
      onClick={() => setSelectedTask(isSelected ? null : task.id)}
      className={`group flex items-start gap-3 px-4 py-3 cursor-pointer transition-all duration-150 relative
        ${task.completed ? 'opacity-40' : ''}`}
      style={{
        borderRadius: '14px',
        marginBottom: '2px',
        borderLeft: `3px solid ${task.completed ? 'transparent' : accentColor}`,
        background: isSelected
          ? 'linear-gradient(90deg, rgba(99,102,241,0.12), rgba(99,102,241,0.04))'
          : undefined,
        boxShadow: isSelected ? 'inset 0 0 0 1px rgba(99,102,241,0.2)' : undefined,
      }}
      onMouseEnter={e => {
        if (!isSelected) {
          (e.currentTarget as HTMLElement).style.background = 'var(--c-hover)';
        }
      }}
      onMouseLeave={e => {
        if (!isSelected) {
          (e.currentTarget as HTMLElement).style.background = '';
        }
      }}
    >
      {/* Color tag strip */}
      {task.colorTag && !task.completed && (
        <div
          className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full opacity-60"
          style={{ backgroundColor: task.colorTag }}
        />
      )}

      {/* Checkbox */}
      <button
        onClick={(e) => { e.stopPropagation(); toggleTask(task.id); }}
        className={`mt-0.5 shrink-0 transition-all duration-200 hover:scale-110 ${cfg.color}`}
        style={{ opacity: task.completed ? 0.5 : 1 }}
      >
        {task.completed
          ? <CheckCircle2 size={17} className="text-indigo-400" />
          : <Circle size={17} />}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-[13.5px] leading-snug font-medium transition-colors
          ${task.completed
            ? 'line-through text-[var(--c-text3)]'
            : isSelected
              ? 'text-indigo-300'
              : 'text-[var(--c-text1)]'}`}>
          {task.title}
        </p>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
          {/* Due date chip */}
          {dueDateLabel && (
            <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full transition-colors
              ${isOverdue
                ? 'bg-red-500/15 text-red-400 ring-1 ring-red-500/20'
                : isDueToday
                  ? 'bg-green-500/15 text-green-400 ring-1 ring-green-500/20'
                  : 'bg-[var(--c-elevated)] text-[var(--c-text3)]'}`}>
              <Calendar size={10} />
              {dueDateLabel}
            </span>
          )}

          {/* Recurrence */}
          {task.recurrence.type !== 'none' && (
            <span className="inline-flex items-center gap-1 text-[11px] text-[var(--c-text3)] bg-[var(--c-elevated)] px-1.5 py-0.5 rounded-full">
              <RepeatIcon size={10} />
            </span>
          )}

          {/* Subtasks */}
          {subtaskTotal > 0 && (
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium
              ${subtaskDone === subtaskTotal
                ? 'bg-green-500/15 text-green-400'
                : 'bg-[var(--c-elevated)] text-[var(--c-text3)]'}`}>
              {subtaskDone}/{subtaskTotal}
            </span>
          )}

          {/* Attachments badge */}
          {task.attachments?.length > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] text-[var(--c-text3)] bg-[var(--c-elevated)] px-1.5 py-0.5 rounded-full">
              <Paperclip size={10} /> {task.attachments.length}
            </span>
          )}

          {/* Comments badge */}
          {task.comments?.length > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] text-[var(--c-text3)] bg-[var(--c-elevated)] px-1.5 py-0.5 rounded-full">
              <MessageSquare size={10} /> {task.comments.length}
            </span>
          )}

          {/* Labels */}
          {taskLabels.map((l) => (
            <span
              key={l.id}
              className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
              style={{ backgroundColor: l.color + '18', color: l.color, boxShadow: `inset 0 0 0 1px ${l.color}30` }}>
              {l.name}
            </span>
          ))}

          {/* Project name */}
          {showProject && project && (
            <span className="text-[11px] text-[var(--c-text3)] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-50" />
              {project.name}
            </span>
          )}
        </div>
      </div>

      {/* Chevron */}
      <ChevronRight
        size={13}
        className={`mt-1 shrink-0 transition-all duration-200 ${
          isSelected
            ? 'text-indigo-400 opacity-100'
            : 'opacity-0 group-hover:opacity-60 text-[var(--c-text3)]'
        }`}
      />
    </div>
  );
}
