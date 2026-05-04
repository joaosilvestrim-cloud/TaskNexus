export type Priority = 'p1' | 'p2' | 'p3' | 'p4';

export type RecurrenceType =
  | 'none'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'custom';

export interface Recurrence {
  type: RecurrenceType;
  interval?: number; // every N days/weeks/months
  daysOfWeek?: number[]; // 0=Sun ... 6=Sat
  dayOfMonth?: number;
  endDate?: string;
}

export interface Reminder {
  id: string;
  minutesBefore?: number; // relative to due date
  absoluteTime?: string;  // ISO string
}

export interface Label {
  id: string;
  name: string;
  color: string;
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  projectId: string | null; // null = Inbox
  sectionId: string | null;
  priority: Priority;
  labelIds: string[];
  dueDate: string | null;   // ISO date string
  dueTime: string | null;   // "HH:mm"
  completed: boolean;
  completedAt: string | null;
  subtasks: SubTask[];
  recurrence: Recurrence;
  reminders: Reminder[];
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Section {
  id: string;
  projectId: string;
  name: string;
  order: number;
  collapsed: boolean;
}

export type ProjectView = 'list' | 'board';
export type ProjectColor =
  | 'red' | 'orange' | 'yellow' | 'green'
  | 'teal' | 'blue' | 'indigo' | 'purple' | 'pink' | 'gray';

export interface Project {
  id: string;
  name: string;
  color: ProjectColor;
  view: ProjectView;
  order: number;
  archived: boolean;
  createdAt: string;
}

export interface SavedFilter {
  id: string;
  name: string;
  query: string; // e.g. "today & p1 & #Trabalho"
  color: string;
}

export type NavView =
  | 'inbox'
  | 'today'
  | 'upcoming'
  | { type: 'project'; id: string }
  | { type: 'label'; id: string }
  | { type: 'filter'; id: string };
