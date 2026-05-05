import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarCheck } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { TaskList } from './TaskList';

export function TodayView() {
  const { tasks } = useStore();
  const todayStr = new Date().toISOString().split('T')[0];

  const todayTasks = tasks
    .filter((t) => t.dueDate === todayStr)
    .sort((a, b) => {
      // P1 first, then by time
      const pOrder = { p1: 0, p2: 1, p3: 2, p4: 3 };
      return pOrder[a.priority] - pOrder[b.priority];
    });

  const todayLabel = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR });

  return (
    <div className="max-w-2xl mx-auto w-full py-8 px-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="relative">
          <CalendarCheck size={24} className="text-green-600" />
          <span className="absolute -bottom-1 -right-1 text-[9px] font-bold text-green-700">
            {new Date().getDate()}
          </span>
        </div>
        <div>
          <h1 className="text-xl font-bold text-[var(--c-text1)]">Hoje</h1>
          <p className="text-sm text-[var(--c-text2)] mt-0.5 capitalize">{todayLabel}</p>
        </div>
      </div>
      <TaskList
        tasks={todayTasks}
        showProject
        showQuickAdd
        projectId={null}
        emptyMessage="Nenhuma tarefa para hoje 🎉"
      />
    </div>
  );
}
