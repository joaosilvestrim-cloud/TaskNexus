/**
 * Hook que verifica lembretes e tarefas vencidas e envia emails via Resend.
 * Roda em background enquanto o app está aberto.
 */
import { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { emailTaskReminder, emailTaskDue, emailDailySummary } from '../lib/email';

const STORAGE_KEY = 'tasknexus_sent_notifications';
const CHECK_INTERVAL_MS = 60_000; // verifica a cada 1 minuto

function getSentSet(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return new Set(JSON.parse(raw) as string[]);
  } catch { /* ignore */ }
  return new Set();
}

function markSent(key: string) {
  const set = getSentSet();
  set.add(key);
  // Limpa entradas antigas (> 7 dias) para não crescer indefinidamente
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const filtered = [...set].filter(k => {
    const ts = parseInt(k.split('|').pop() ?? '0', 10);
    return isNaN(ts) || ts > cutoff;
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

function wasSent(key: string): boolean {
  return getSentSet().has(key);
}

export function useEmailNotifications() {
  const { tasks } = useStore();
  const dailySentRef = useRef<string>('');

  useEffect(() => {
    const check = async () => {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const nowMin = now.getHours() * 60 + now.getMinutes();

      for (const task of tasks) {
        if (task.completed) continue;

        // ── Lembretes configurados na tarefa ──────────────────────────────
        if (task.reminders && task.reminders.length > 0 && task.dueDate) {
          for (const reminder of task.reminders) {
            // reminder pode ser string (ISO) ou objeto {type, minutes}
            let reminderTime: Date | null = null;

            if (typeof reminder === 'string') {
              reminderTime = new Date(reminder);
            } else if (typeof reminder === 'object' && 'minutes' in reminder && task.dueDate) {
              // minutos antes do prazo
              const dueMs = new Date(task.dueDate + (task.dueTime ? `T${task.dueTime}` : 'T23:59')).getTime();
              reminderTime = new Date(dueMs - (reminder as { minutes: number }).minutes * 60_000);
            }

            if (!reminderTime) continue;

            const diffMin = (reminderTime.getTime() - now.getTime()) / 60_000;
            // janela de ±1 minuto
            if (diffMin > -1 && diffMin <= 1) {
              const key = `reminder|${task.id}|${reminderTime.toISOString().slice(0, 16)}`;
              if (!wasSent(key)) {
                markSent(key);
                await emailTaskReminder(task.title, task.dueDate, task.dueTime);
              }
            }
          }
        }

        // ── Tarefas vencidas (envia 1x por dia por tarefa) ────────────────
        if (task.dueDate && task.dueDate < todayStr) {
          const key = `overdue|${task.id}|${todayStr}`;
          if (!wasSent(key)) {
            markSent(key);
            await emailTaskDue(task.title, task.dueDate);
          }
        }
      }

      // ── Resumo diário às 08:00 ────────────────────────────────────────
      const dailyKey = `daily|${todayStr}`;
      if (nowMin >= 8 * 60 && nowMin < 8 * 60 + 2 && dailySentRef.current !== todayStr && !wasSent(dailyKey)) {
        const todayTasks = tasks.filter(
          t => !t.completed && t.dueDate === todayStr
        ).map(t => ({ title: t.title, dueDate: t.dueDate!, priority: t.priority }));

        if (todayTasks.length > 0) {
          dailySentRef.current = todayStr;
          markSent(dailyKey);
          await emailDailySummary(todayTasks);
        }
      }
    };

    // Roda imediatamente e depois a cada minuto
    check();
    const interval = setInterval(check, CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [tasks]);
}
