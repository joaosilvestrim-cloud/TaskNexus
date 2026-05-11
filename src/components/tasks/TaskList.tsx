import { useState } from 'react';
import { TaskRow } from './TaskRow';
import { QuickAdd } from './QuickAdd';
import { useStore } from '../../store/useStore';
import type { Task } from '../../types';

interface Props {
  tasks: Task[];
  projectId?: string | null;
  sectionId?: string | null;
  showProject?: boolean;
  showQuickAdd?: boolean;
  emptyMessage?: string;
}

export function TaskList({
  tasks, projectId, sectionId, showProject, showQuickAdd = true, emptyMessage,
}: Props) {
  const { updateTask } = useStore();
  const [draggingId, setDraggingId]   = useState<string | null>(null);
  const [dragOverId, setDragOverId]   = useState<string | null>(null);

  const active = tasks.filter((t) => !t.completed);
  const done   = tasks.filter((t) => t.completed);

  const handleDrop = (targetId: string) => {
    if (!draggingId || draggingId === targetId) return;
    const list   = [...active];
    const fromIdx = list.findIndex(t => t.id === draggingId);
    const toIdx   = list.findIndex(t => t.id === targetId);
    if (fromIdx < 0 || toIdx < 0) return;
    const reordered = [...list];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    reordered.forEach((t, i) => { if (t.order !== i) updateTask(t.id, { order: i }); });
    setDraggingId(null);
    setDragOverId(null);
  };

  return (
    <div className="space-y-0.5">
      {active.length === 0 && !showQuickAdd && emptyMessage && (
        <p className="text-sm text-[var(--c-text3)] py-4 text-center">{emptyMessage}</p>
      )}

      {active.map((t) => (
        <div
          key={t.id}
          draggable
          onDragStart={() => setDraggingId(t.id)}
          onDragEnd={() => { setDraggingId(null); setDragOverId(null); }}
          onDragOver={e => { e.preventDefault(); setDragOverId(t.id); }}
          onDragLeave={() => setDragOverId(null)}
          onDrop={() => handleDrop(t.id)}
          className={`rounded-xl transition-all ${
            draggingId === t.id   ? 'opacity-40 scale-[0.98]' : ''
          } ${
            dragOverId === t.id && draggingId !== t.id
              ? 'ring-2 ring-indigo-400 ring-offset-1'
              : ''
          }`}
        >
          <TaskRow task={t} showProject={showProject} />
        </div>
      ))}

      {showQuickAdd && (
        <div className="pt-1">
          <QuickAdd projectId={projectId} sectionId={sectionId} />
        </div>
      )}

      {done.length > 0 && (
        <details className="mt-3">
          <summary className="text-xs text-[var(--c-text3)] cursor-pointer hover:text-[var(--c-text2)] py-2 select-none">
            {done.length} concluída{done.length > 1 ? 's' : ''}
          </summary>
          <div className="mt-1 space-y-0.5">
            {done.map((t) => <TaskRow key={t.id} task={t} showProject={showProject} />)}
          </div>
        </details>
      )}
    </div>
  );
}
