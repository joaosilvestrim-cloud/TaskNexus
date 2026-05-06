import { useState, useMemo } from 'react';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addMonths, subMonths, eachDayOfInterval, isSameMonth, isToday,
  parseISO, isSameDay, addDays,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useStore } from '../../store/useStore';

export function CalendarView() {
  const { tasks, updateTask, setSelectedTask, selectedTaskId, projects } = useStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [dragOverDay, setDragOverDay] = useState<string | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd   = endOfMonth(currentMonth);
  const calStart   = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calEnd     = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days       = eachDayOfInterval({ start: calStart, end: calEnd });

  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const tasksByDay = useMemo(() => {
    const map: Record<string, typeof tasks> = {};
    tasks.forEach(t => {
      if (!t.dueDate) return;
      if (!map[t.dueDate]) map[t.dueDate] = [];
      map[t.dueDate].push(t);
    });
    return map;
  }, [tasks]);

  const selectedDayStr = selectedDay ? format(selectedDay, 'yyyy-MM-dd') : null;
  const selectedDayTasks = selectedDayStr ? (tasksByDay[selectedDayStr] ?? []) : [];

  const getProject = (id: string | null) => projects.find(p => p.id === id);

  const WEEK_DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const handleDrop = (e: React.DragEvent, dayStr: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      updateTask(taskId, { dueDate: dayStr });
    }
    setDragOverDay(null);
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Calendar grid */}
      <div className="flex-1 flex flex-col overflow-hidden p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-[var(--c-text1)]">
            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentMonth(m => subMonths(m, 1))}
              className="p-2 rounded-lg hover:bg-[var(--c-hover)] text-[var(--c-text2)] transition-colors">
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setCurrentMonth(new Date())}
              className="px-3 py-1.5 text-xs rounded-lg border border-[var(--c-border)] text-[var(--c-text2)] hover:bg-[var(--c-hover)] transition-colors">
              Hoje
            </button>
            <button
              onClick={() => setCurrentMonth(m => addMonths(m, 1))}
              className="p-2 rounded-lg hover:bg-[var(--c-hover)] text-[var(--c-text2)] transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Days of week header */}
        <div className="grid grid-cols-7 mb-1">
          {WEEK_DAYS.map(d => (
            <div key={d} className="text-center text-xs font-semibold text-[var(--c-text3)] py-2">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar weeks */}
        <div className="flex-1 overflow-auto">
          <div className="grid grid-rows-6 h-full" style={{ minHeight: '400px' }}>
            {weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 border-t border-[var(--c-border)]">
                {week.map(day => {
                  const dayStr = format(day, 'yyyy-MM-dd');
                  const dayTasks = tasksByDay[dayStr] ?? [];
                  const inMonth = isSameMonth(day, currentMonth);
                  const isSelected = selectedDay ? isSameDay(day, selectedDay) : false;
                  const isDragOver = dragOverDay === dayStr;

                  return (
                    <div
                      key={dayStr}
                      onClick={() => setSelectedDay(isSelected ? null : day)}
                      onDragOver={e => { e.preventDefault(); setDragOverDay(dayStr); }}
                      onDragLeave={() => setDragOverDay(null)}
                      onDrop={e => handleDrop(e, dayStr)}
                      className={`min-h-[80px] p-1.5 border-r border-[var(--c-border)] cursor-pointer transition-all
                        ${!inMonth ? 'opacity-40' : ''}
                        ${isSelected ? 'bg-indigo-500/10' : 'hover:bg-[var(--c-hover)]'}
                        ${isDragOver ? 'bg-indigo-500/20 ring-2 ring-inset ring-indigo-400' : ''}`}
                    >
                      {/* Day number */}
                      <div className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full mb-1
                        ${isToday(day) ? 'bg-indigo-600 text-white' : 'text-[var(--c-text2)]'}`}>
                        {format(day, 'd')}
                      </div>

                      {/* Task dots */}
                      <div className="space-y-0.5">
                        {dayTasks.slice(0, 3).map(t => (
                          <div
                            key={t.id}
                            draggable
                            onDragStart={e => {
                              e.stopPropagation();
                              e.dataTransfer.setData('taskId', t.id);
                            }}
                            onClick={e => { e.stopPropagation(); setSelectedTask(t.id === selectedTaskId ? null : t.id); }}
                            className={`text-xs px-1.5 py-0.5 rounded truncate cursor-pointer transition-colors
                              ${t.colorTag
                                ? 'text-white'
                                : t.completed
                                  ? 'bg-[var(--c-border)] text-[var(--c-text3)] line-through'
                                  : 'bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30'}`}
                            style={t.colorTag ? { backgroundColor: t.colorTag + '33', color: t.colorTag } : {}}
                          >
                            {t.title}
                          </div>
                        ))}
                        {dayTasks.length > 3 && (
                          <div className="text-xs text-[var(--c-text3)] px-1">
                            +{dayTasks.length - 3} mais
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Side panel for selected day */}
      {selectedDay && (
        <div className="w-72 border-l border-[var(--c-border)] flex flex-col bg-[var(--c-card)]">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-[var(--c-border)]">
            <div>
              <p className="text-sm font-semibold text-[var(--c-text1)]">
                {format(selectedDay, "d 'de' MMMM", { locale: ptBR })}
              </p>
              <p className="text-xs text-[var(--c-text3)]">
                {selectedDayTasks.length} tarefa{selectedDayTasks.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button onClick={() => setSelectedDay(null)} className="text-[var(--c-text3)] hover:text-[var(--c-text2)]">
              <X size={14} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {selectedDayTasks.length === 0 && (
              <div className="text-center py-8">
                <p className="text-2xl mb-2">📅</p>
                <p className="text-sm text-[var(--c-text3)]">Sem tarefas neste dia</p>
              </div>
            )}
            {selectedDayTasks.map(t => {
              const proj = getProject(t.projectId);
              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTask(t.id === selectedTaskId ? null : t.id)}
                  className={`px-3 py-2.5 rounded-xl border cursor-pointer transition-all
                    ${t.id === selectedTaskId
                      ? 'bg-[var(--c-active)] border-indigo-500'
                      : 'bg-[var(--c-elevated)] border-[var(--c-border)] hover:border-[var(--c-border2)]'}`}
                  style={t.colorTag ? { borderLeftColor: t.colorTag, borderLeftWidth: '3px' } : {}}
                >
                  <p className={`text-sm font-medium ${t.completed ? 'line-through text-[var(--c-text3)]' : 'text-[var(--c-text1)]'}`}>
                    {t.title}
                  </p>
                  {proj && (
                    <p className="text-xs text-[var(--c-text3)] mt-0.5">{proj.name}</p>
                  )}
                  {t.dueTime && (
                    <p className="text-xs text-indigo-400 mt-0.5">{t.dueTime}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
