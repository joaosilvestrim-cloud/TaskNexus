import { useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useStore } from '../../store/useStore';
import { TaskList } from './TaskList';

export function TodayView() {
  const { tasks } = useStore();
  const todayStr = new Date().toISOString().split('T')[0];
  const firedRef = useRef(false);

  const todayTasks = tasks
    .filter((t) => t.dueDate === todayStr)
    .sort((a, b) => {
      const pOrder = { p1: 0, p2: 1, p3: 2, p4: 3 };
      return pOrder[a.priority] - pOrder[b.priority];
    });

  const total   = todayTasks.length;
  const done    = todayTasks.filter(t => t.completed).length;
  const allDone = total > 0 && done === total;
  const pct     = total > 0 ? Math.round((done / total) * 100) : 0;

  useEffect(() => {
    if (allDone && !firedRef.current) {
      firedRef.current = true;
      confetti({ particleCount: 160, spread: 80, origin: { y: 0.55 }, colors: ['#6366f1','#22c55e','#f59e0b','#ec4899','#06b6d4'] });
      setTimeout(() => confetti({ particleCount: 80, spread: 120, origin: { y: 0.6, x: 0.2 } }), 250);
      setTimeout(() => confetti({ particleCount: 80, spread: 120, origin: { y: 0.6, x: 0.8 } }), 400);
    }
    if (!allDone) firedRef.current = false;
  }, [allDone]);

  const todayLabel = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR });

  return (
    <div className="max-w-2xl mx-auto w-full py-8 px-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-start gap-4 mb-8">
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(16,185,129,0.2))', border: '1px solid rgba(34,197,94,0.25)' }}>
          <CalendarCheck size={20} className="text-green-400" />
        </div>
        <div className="flex-1">
          <h1 className="text-[22px] font-bold tracking-tight capitalize" style={{ color: 'var(--c-text1)' }}>
            Hoje
          </h1>
          <p className="text-sm mt-0.5 capitalize" style={{ color: 'var(--c-text3)' }}>{todayLabel}</p>
        </div>
        {total > 0 && (
          <div className="text-right">
            <p className="text-[13px] font-semibold" style={{ color: 'var(--c-text2)' }}>{done}/{total}</p>
            <p className="text-[11px]" style={{ color: 'var(--c-text3)' }}>{pct}% concluído</p>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="mb-6 rounded-full overflow-hidden" style={{ height: '3px', background: 'var(--c-border)' }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${pct}%`,
              background: allDone ? '#22c55e' : 'linear-gradient(90deg, #6366f1, #8b5cf6)',
            }}
          />
        </div>
      )}

      {allDone && (
        <div className="mb-6 px-4 py-3 rounded-2xl text-center animate-bounce-in"
          style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
          <p className="text-green-400 font-semibold text-sm">🎉 Todas as tarefas de hoje concluídas!</p>
        </div>
      )}

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
