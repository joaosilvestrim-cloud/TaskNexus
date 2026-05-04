import { Tag } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { TaskList } from './TaskList';

interface Props { labelId: string; }

export function LabelView({ labelId }: Props) {
  const { tasks, labels } = useStore();
  const label = labels.find((l) => l.id === labelId);
  if (!label) return null;

  const labelTasks = tasks
    .filter((t) => t.labelIds.includes(labelId))
    .sort((a, b) => a.order - b.order);

  return (
    <div className="max-w-2xl mx-auto w-full py-8 px-4">
      <div className="flex items-center gap-3 mb-6">
        <Tag size={22} style={{ color: label.color }} />
        <div>
          <h1 className="text-xl font-bold text-gray-900">@{label.name}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {labelTasks.filter(t => !t.completed).length} tarefa{labelTasks.filter(t => !t.completed).length !== 1 ? 's' : ''} com esta etiqueta
          </p>
        </div>
      </div>
      <TaskList tasks={labelTasks} showProject showQuickAdd={false} emptyMessage="Nenhuma tarefa com esta etiqueta" />
    </div>
  );
}
