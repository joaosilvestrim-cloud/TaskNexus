import { addDays, addWeeks, addMonths, nextMonday, nextDay, startOfTomorrow, startOfToday } from 'date-fns';
import type { Priority, Recurrence } from '../types';

export interface ParsedTask {
  title: string;
  projectName?: string;   // #ProjectName
  labelNames: string[];   // @label
  priority?: Priority;    // p1–p4
  dueDate?: string;       // ISO date
  dueTime?: string;       // HH:mm
  recurrence?: Recurrence;
}

const PRIORITY_MAP: Record<string, Priority> = {
  p1: 'p1', p2: 'p2', p3: 'p3', p4: 'p4',
};

const DATE_WORDS: Record<string, () => Date> = {
  hoje: () => startOfToday(),
  today: () => startOfToday(),
  amanhã: () => startOfTomorrow(),
  amanha: () => startOfTomorrow(),
  tomorrow: () => startOfTomorrow(),
  'próxima semana': () => addWeeks(startOfToday(), 1),
  'next week': () => addWeeks(startOfToday(), 1),
  'próximo mês': () => addMonths(startOfToday(), 1),
  'next month': () => addMonths(startOfToday(), 1),
  segunda: () => nextMonday(new Date()),
  monday: () => nextMonday(new Date()),
  terça: () => nextDay(new Date(), 2),
  tuesday: () => nextDay(new Date(), 2),
  quarta: () => nextDay(new Date(), 3),
  wednesday: () => nextDay(new Date(), 3),
  quinta: () => nextDay(new Date(), 4),
  thursday: () => nextDay(new Date(), 4),
  sexta: () => nextDay(new Date(), 5),
  friday: () => nextDay(new Date(), 5),
  sábado: () => nextDay(new Date(), 6),
  saturday: () => nextDay(new Date(), 6),
  domingo: () => nextDay(new Date(), 0),
  sunday: () => nextDay(new Date(), 0),
};

const RECURRENCE_WORDS: Record<string, Recurrence> = {
  'todo dia': { type: 'daily', interval: 1 },
  'every day': { type: 'daily', interval: 1 },
  'toda semana': { type: 'weekly', interval: 1 },
  'every week': { type: 'weekly', interval: 1 },
  'todo mês': { type: 'monthly', interval: 1 },
  'every month': { type: 'monthly', interval: 1 },
};

function toISODate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function parseTime(text: string): { time: string; rest: string } | null {
  // "às 14h", "às 14h30", "at 2pm", "at 14:30"
  const match = text.match(/(?:às?|at)\s+(\d{1,2})(?::(\d{2}))?(?:h(\d{0,2}))?(?:\s*(am|pm))?/i);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const mins = parseInt(match[2] || match[3] || '0', 10);
  const meridiem = match[4]?.toLowerCase();
  if (meridiem === 'pm' && hours < 12) hours += 12;
  if (meridiem === 'am' && hours === 12) hours = 0;
  const time = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  const rest = text.replace(match[0], '').trim();
  return { time, rest };
}

export function parseNaturalTask(input: string): ParsedTask {
  let text = input.trim();
  const result: ParsedTask = { title: '', labelNames: [] };

  // ── Priority: p1 p2 p3 p4 ──────────────────────────────────────────
  const priorityMatch = text.match(/\b(p[1-4])\b/i);
  if (priorityMatch) {
    result.priority = PRIORITY_MAP[priorityMatch[1].toLowerCase()];
    text = text.replace(priorityMatch[0], '').trim();
  }

  // ── Project: #ProjectName ───────────────────────────────────────────
  const projectMatch = text.match(/#([\wÀ-ÿ]+)/u);
  if (projectMatch) {
    result.projectName = projectMatch[1];
    text = text.replace(projectMatch[0], '').trim();
  }

  // ── Labels: @label ──────────────────────────────────────────────────
  const labelMatches = [...text.matchAll(/@([\wÀ-ÿ]+)/gu)];
  result.labelNames = labelMatches.map((m) => m[1]);
  text = text.replace(/@[\wÀ-ÿ]+/gu, '').trim();

  // ── Recurrence ──────────────────────────────────────────────────────
  for (const [phrase, rec] of Object.entries(RECURRENCE_WORDS)) {
    if (text.toLowerCase().includes(phrase)) {
      result.recurrence = rec;
      text = text.replace(new RegExp(phrase, 'i'), '').trim();
      break;
    }
  }

  // "a cada N dias / semanas / meses"
  const customRecMatch = text.match(/a cada (\d+)\s*(dia|semana|mes|mês|month|week|day)s?/i);
  if (customRecMatch) {
    const n = parseInt(customRecMatch[1], 10);
    const unit = customRecMatch[2].toLowerCase();
    if (unit.startsWith('dia') || unit.startsWith('day')) result.recurrence = { type: 'daily', interval: n };
    else if (unit.startsWith('sem') || unit.startsWith('week')) result.recurrence = { type: 'weekly', interval: n };
    else result.recurrence = { type: 'monthly', interval: n };
    text = text.replace(customRecMatch[0], '').trim();
  }

  // ── Time ────────────────────────────────────────────────────────────
  const timeParsed = parseTime(text);
  if (timeParsed) {
    result.dueTime = timeParsed.time;
    text = timeParsed.rest;
  }

  // ── Date ────────────────────────────────────────────────────────────
  // "em N dias", "in N days"
  const inNDaysMatch = text.match(/em (\d+) dias?|in (\d+) days?/i);
  if (inNDaysMatch) {
    const n = parseInt(inNDaysMatch[1] || inNDaysMatch[2], 10);
    result.dueDate = toISODate(addDays(startOfToday(), n));
    text = text.replace(inNDaysMatch[0], '').trim();
  } else {
    for (const [word, getDate] of Object.entries(DATE_WORDS)) {
      const regex = new RegExp(`\\b${word}\\b`, 'i');
      if (regex.test(text)) {
        result.dueDate = toISODate(getDate());
        text = text.replace(regex, '').trim();
        break;
      }
    }
  }

  // ── Cleanup & title ──────────────────────────────────────────────────
  result.title = text.replace(/\s{2,}/g, ' ').trim();

  return result;
}
