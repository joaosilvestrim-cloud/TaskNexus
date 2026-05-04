import { useStore } from '../../store/useStore';
import { TaskRow } from '../tasks/TaskRow';
import { QuickAdd } from '../tasks/QuickAdd';
import { PROJECT_COLORS } from '../../utils/priority';
import type { Project } from '../../types';

interface Props { project: Project; }

export function KanbanBoard({ project }: Props) {
  const { sections, tasks } = useStore();

  const projectSections = sections
    .filter((s) => s.projectId === project.id)
    .sort((a, b) => a.order - b.order);

  // If no sections, show a default "To Do / Doing / Done" Kanban
  const columns = projectSections.length > 0
    ? projectSections
    : [
        { id: '__todo__', name: 'A Fazer', projectId: project.id, order: 0, collapsed: false },
        { id: '__doing__', name: 'Em Andamento', projectId: project.id, order: 1, collapsed: false },
        { id: '__done__', name: 'Concluído', projectId: project.id, order: 2, collapsed: false },
      ];

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((col) => {
        const isVirtual = col.id.startsWith('__');
        const colTasks = isVirtual
          ? tasks.filter((t) => t.projectId === project.id && !t.sectionId)
          : tasks.filter((t) => t.projectId === project.id && t.sectionId === col.id);

        const active = colTasks.filter((t) => !t.completed);
        const done = colTasks.filter((t) => t.completed);
        const colors = PROJECT_COLORS[project.color];

        return (
          <div key={col.id} className="flex-shrink-0 w-72">
            {/* Column header */}
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
                <h3 className="text-sm font-semibold text-gray-700">{col.name}</h3>
                <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                  {active.length}
                </span>
              </div>
            </div>

            {/* Tasks */}
            <div className="bg-gray-50 rounded-xl p-2 space-y-1.5 min-h-24">
              {active.map((t) => (
                <div key={t.id} className="bg-white rounded-lg shadow-sm">
                  <TaskRow task={t} />
                </div>
              ))}
              {done.map((t) => (
                <div key={t.id} className="bg-white rounded-lg shadow-sm opacity-60">
                  <TaskRow task={t} />
                </div>
              ))}
              <QuickAdd
                projectId={project.id}
                sectionId={isVirtual ? null : col.id}
                placeholder="+ Tarefa"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
