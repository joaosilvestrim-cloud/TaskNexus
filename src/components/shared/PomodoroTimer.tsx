import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Timer, ChevronDown } from 'lucide-react';
import { useStore } from '../../store/useStore';

type Phase = 'work' | 'break';

const WORK_SECONDS  = 25 * 60;
const BREAK_SECONDS = 5 * 60;

export function PomodoroTimer() {
  const { selectedTaskId, tasks } = useStore();
  const selectedTask = tasks.find(t => t.id === selectedTaskId);

  const [phase, setPhase]         = useState<Phase>('work');
  const [seconds, setSeconds]     = useState(WORK_SECONDS);
  const [running, setRunning]     = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [cycle, setCycle]         = useState(1);
  const intervalRef               = useRef<ReturnType<typeof setInterval> | null>(null);

  const notify = useCallback((msg: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('TaskNexus', { body: msg, icon: '/favicon.ico' });
    }
  }, []);

  const startBreak = useCallback(() => {
    setPhase('break');
    setSeconds(BREAK_SECONDS);
    setRunning(true);
    notify('Pomodoro concluído! Hora do descanso 🎉');
  }, [notify]);

  const startWork = useCallback(() => {
    setPhase('work');
    setSeconds(WORK_SECONDS);
    setRunning(true);
    setCycle(c => c + 1);
    notify('Descanso terminado. Vamos trabalhar! 💪');
  }, [notify]);

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) {
          clearInterval(intervalRef.current!);
          setRunning(false);
          if (phase === 'work') {
            startBreak();
          } else {
            startWork();
          }
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current!);
  }, [running, phase, startBreak, startWork]);

  const reset = () => {
    setRunning(false);
    setPhase('work');
    setSeconds(WORK_SECONDS);
  };

  const togglePlay = () => setRunning(r => !r);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  const totalSeconds = phase === 'work' ? WORK_SECONDS : BREAK_SECONDS;
  const progress = ((totalSeconds - seconds) / totalSeconds) * 100;

  if (minimized) {
    return (
      <div className="fixed bottom-16 md:bottom-4 right-4 z-40">
        <button
          onClick={() => setMinimized(false)}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl shadow-lg border text-sm font-mono font-bold
            ${phase === 'work'
              ? 'bg-indigo-600 border-indigo-700 text-white'
              : 'bg-green-600 border-green-700 text-white'}`}
        >
          <Timer size={14} />
          {timeStr}
          {running && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-16 md:bottom-4 right-4 z-40 w-64 bg-[var(--c-card)] border border-[var(--c-border)] rounded-2xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-2.5
        ${phase === 'work' ? 'bg-indigo-600' : 'bg-green-600'}`}>
        <div className="flex items-center gap-2">
          <Timer size={14} className="text-white" />
          <span className="text-xs font-semibold text-white">
            {phase === 'work' ? `Foco #${cycle}` : 'Descanso'}
          </span>
        </div>
        <button onClick={() => setMinimized(true)} className="text-white/70 hover:text-white">
          <ChevronDown size={14} />
        </button>
      </div>

      {/* Progress arc / timer */}
      <div className="px-4 py-4 flex flex-col items-center">
        {/* Circular progress */}
        <div className="relative w-24 h-24 mb-3">
          <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
            <circle cx="48" cy="48" r="40"
              className="fill-none stroke-[var(--c-border2)]"
              strokeWidth="6"
            />
            <circle cx="48" cy="48" r="40"
              className={`fill-none transition-all duration-1000 ${phase === 'work' ? 'stroke-indigo-500' : 'stroke-green-500'}`}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 40}`}
              strokeDashoffset={`${2 * Math.PI * 40 * (1 - progress / 100)}`}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-mono font-bold text-[var(--c-text1)]">{timeStr}</span>
          </div>
        </div>

        {/* Current task */}
        {selectedTask && (
          <p className="text-xs text-[var(--c-text3)] text-center mb-3 max-w-full truncate px-2">
            {selectedTask.title}
          </p>
        )}

        {/* Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={reset}
            className="p-2 rounded-lg bg-[var(--c-elevated)] border border-[var(--c-border)] text-[var(--c-text2)] hover:bg-[var(--c-hover)] transition-colors">
            <RotateCcw size={14} />
          </button>
          <button
            onClick={togglePlay}
            className={`px-5 py-2 rounded-lg font-semibold text-sm text-white flex items-center gap-2 transition-colors
              ${phase === 'work' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-green-600 hover:bg-green-700'}`}>
            {running ? <Pause size={14} /> : <Play size={14} />}
            {running ? 'Pausar' : 'Iniciar'}
          </button>
        </div>
      </div>
    </div>
  );
}
