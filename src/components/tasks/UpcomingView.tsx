import { addDays, format, isSameDay, parseISO, startOfToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarDays } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { TaskRow } from './TaskRow';

const DAYS_AHEAD = 14;

export function UpcomingView() {
  const { tasks } = useStore();
  const today = startOfToday();

  const futureTasks = tasks
    .filter((t) => !t.completed && t.dueDate)
    .sort((a, b) => a.dueDate!.localeCompare(b.dueDate!));

  const days = Array.from({ length: DAYS_AHEAD }, (_, i) => addDays(today, i));

  // Tasks with date beyond 14 days
  const beyond = futureTasks.filter((t) => {
    const d = parseISO(t.dueDate!);
    return d > addDays(today, DAYS_AHEAD - 1);
  });

  return (
    <div className="max-w-2xl mx-auto w-full py-8 px-4">
      <div className="flex items-center gap-3 mb-6">
        <CalendarDays size={24} className="text-blue-600" />
        <div>
          <h1 className="text-xl font-bold text-gray-900">Em Breve</h1>
          <p className="text-sm text-gray-500 mt-0.5">Próximos {DAYS_AHEAD} dias</p>
        </div>
      </div>

      <div className="space-y-6">
        {days.map((day) => {
          const dayTasks = futureTasks.filter((t) => isSameDay(parseISO(t.dueDate!), day));
          const isToday = isSameDay(day, today);
          if (dayTasks.length === 0 && !isToday) return null;

          return (
            <div key={day.toISOString()}>
              <div className="flex items-center gap-2 mb-2">
                <h2 className={`text-sm font-semibold capitalize
                  ${isToday ? 'text-green-600' : 'text-gray-700'}`}>
                  {isToday ? 'Hoje' : format(day, "EEEE, d 'de' MMMM", { locale: ptBR })}
                </h2>
                <div className="flex-1 h-px bg-gray-100" />
                {dayTasks.length > 0 && (
                  <span className="text-xs text-gray-400">{dayTasks.length}</span>
                )}
              </div>
              {dayTasks.length === 0
                ? <p className="text-xs text-gray-300 pl-2">Nenhuma tarefa</p>
                : dayTasks.map((t) => <TaskRow key={t.id} task={t} showProject />)
              }
            </div>
          );
        })}

        {beyond.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-sm font-semibold text-gray-500">Mais tarde</h2>
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-400">{beyond.length}</span>
            </div>
            {beyond.map((t) => <TaskRow key={t.id} task={t} showProject />)}
          </div>
        )}
      </div>
    </div>
  );
}
