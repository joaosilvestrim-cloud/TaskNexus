import { Inbox } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { TaskList } from './TaskList';

export function InboxView() {
  const { tasks } = useStore();
  const inboxTasks = tasks
    .filter((t) => t.projectId === null)
    .sort((a, b) => a.order - b.order);

  const pending = inboxTasks.filter(t => !t.completed).length;

  return (
    <div className="max-w-2xl mx-auto w-full py-8 px-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-start gap-4 mb-8">
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))', border: '1px solid rgba(99,102,241,0.25)' }}>
          <Inbox size={20} className="text-indigo-400" />
        </div>
        <div>
          <h1 className="text-[22px] font-bold tracking-tight" style={{ color: 'var(--c-text1)' }}>
            Caixa de entrada
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--c-text3)' }}>
            {pending === 0 ? 'Tudo em dia 🎉' : `${pending} tarefa${pending !== 1 ? 's' : ''} pendente${pending !== 1 ? 's' : ''}`}
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
