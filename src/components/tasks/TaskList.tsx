import { TaskRow } from './TaskRow';
import { QuickAdd } from './QuickAdd';
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
  const active = tasks.filter((t) => !t.completed);
  const done = tasks.filter((t) => t.completed);

  return (
    <div className="space-y-0.5">
      {active.length === 0 && !showQuickAdd && emptyMessage && (
        <p className="text-sm text-gray-400 py-4 text-center">{emptyMessage}</p>
      )}
      {active.map((t) => (
        <TaskRow key={t.id} task={t} showProject={showProject} />
      ))}

      {showQuickAdd && (
        <div className="pt-1">
          <QuickAdd projectId={projectId} sectionId={sectionId} />
        </div>
      )}

      {done.length > 0 && (
        <details className="mt-3">
          <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600 py-2 select-none">
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
