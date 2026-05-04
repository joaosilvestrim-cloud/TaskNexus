import { isToday, isFuture, parseISO, startOfToday } from 'date-fns';
import type { Task, Project, Label } from '../types';

/**
 * Evaluates a TaskNexus filter query against a task.
 * Supported tokens: hoje, today, p1–p4, #ProjectName, @LabelName,
 *                   overdue, sem-data, completed
 * Logical ops: & (AND), | (OR)
 */
export function matchesFilter(
  query: string,
  task: Task,
  projects: Project[],
  labels: Label[],
): boolean {
  // Split by | first (lowest precedence)
  const orParts = query.split('|').map((s) => s.trim());
  return orParts.some((orPart) => {
    const andParts = orPart.split('&').map((s) => s.trim().toLowerCase());
    return andParts.every((token) => evaluateToken(token, task, projects, labels));
  });
}

function evaluateToken(
  token: string,
  task: Task,
  projects: Project[],
  labels: Label[],
): boolean {
  if (token === 'hoje' || token === 'today') {
    return !!task.dueDate && isToday(parseISO(task.dueDate));
  }
  if (token === 'overdue' || token === 'atrasado') {
    if (!task.dueDate) return false;
    return parseISO(task.dueDate) < startOfToday() && !task.completed;
  }
  if (token === 'sem-data' || token === 'no-date') {
    return !task.dueDate;
  }
  if (token === 'completed' || token === 'concluido') {
    return task.completed;
  }
  if (token === 'futuro' || token === 'future') {
    return !!task.dueDate && isFuture(parseISO(task.dueDate));
  }
  if (/^p[1-4]$/.test(token)) {
    return task.priority === token;
  }
  if (token.startsWith('#')) {
    const projectName = token.slice(1).toLowerCase();
    const project = projects.find((p) => p.name.toLowerCase() === projectName);
    return project ? task.projectId === project.id : false;
  }
  if (token.startsWith('@')) {
    const labelName = token.slice(1).toLowerCase();
    const label = labels.find((l) => l.name.toLowerCase() === labelName);
    return label ? task.labelIds.includes(label.id) : false;
  }
  // Search in title
  return task.title.toLowerCase().includes(token);
}

export function filterTasks(
  query: string,
  tasks: Task[],
  projects: Project[],
  labels: Label[],
): Task[] {
  return tasks.filter((t) => !t.completed && matchesFilter(query, t, projects, labels));
}
