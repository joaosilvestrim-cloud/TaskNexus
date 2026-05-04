import { Inbox } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { TaskList } from './TaskList';

export function InboxView() {
  const { tasks } = useStore();
  const inboxTasks = tasks
    .filter((t) => t.projectId === null)
    .sort((a, b) => a.order - b.order);

  return (
    <div className="max-w-2xl mx-auto w-full py-8 px-4">
      <div className="flex items-center gap-3 mb-6">
        <Inbox size={24} className="text-indigo-600" />
        <div>
          <h1 className="text-xl font-bold text-gray-900">Caixa de Entrada</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {inboxTasks.filter(t => !t.completed).length} tarefa{inboxTasks.filter(t => !t.completed).length !== 1 ? 's' : ''} pendente{inboxTasks.filter(t => !t.completed).length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
      <TaskList
        tasks={inboxTasks}
        projectId={null}
        emptyMessage="Sua caixa de entrada está vazia 🎉"
      />
    </div>
  );
}
