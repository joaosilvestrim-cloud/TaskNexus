import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import {
  tasksApi, subtasksApi, projectsApi, sectionsApi,
  labelsApi, filtersApi, setTaskExtras,
} from '../lib/api';
import type {
  Task, Project, Section, Label, SavedFilter, NavView,
  ProjectColor, ProjectView, KanbanColumn, Comment, Attachment,
  MeetingNote, MeetingTemplate, MeetingActionItem, Recurrence,
  KnowledgeNote,
} from '../types';
import { MEETING_TEMPLATES } from '../utils/meetingParser';

// ── Recurrence: calculate next due date ──────────────────────────────────────
function calcNextDate(current: string, rec: Recurrence): string | null {
  if (!rec || rec.type === 'none') return null;
  const base = new Date(current + 'T00:00:00');

  if (rec.type === 'daily') {
    base.setDate(base.getDate() + (rec.interval ?? 1));
    return base.toISOString().split('T')[0];
  }

  if (rec.type === 'weekly') {
    if (rec.daysOfWeek && rec.daysOfWeek.length > 0) {
      // Find next matching weekday
      const sorted = [...rec.daysOfWeek].sort((a, b) => a - b);
      let next = new Date(base);
      for (let i = 1; i <= 7; i++) {
        next = new Date(base);
        next.setDate(base.getDate() + i);
        if (sorted.includes(next.getDay())) break;
      }
      return next.toISOString().split('T')[0];
    }
    base.setDate(base.getDate() + 7 * (rec.interval ?? 1));
    return base.toISOString().split('T')[0];
  }

  if (rec.type === 'monthly') {
    const day = rec.dayOfMonth ?? base.getDate();
    base.setMonth(base.getMonth() + (rec.interval ?? 1));
    base.setDate(day);
    return base.toISOString().split('T')[0];
  }

  if (rec.type === 'custom' && rec.interval) {
    base.setDate(base.getDate() + rec.interval);
    return base.toISOString().split('T')[0];
  }

  return null;
}

const DEFAULT_COLUMNS: KanbanColumn[] = [
  { id: 'backlog',     label: 'Backlog',      color: 'text-gray-400',   accent: 'bg-gray-400',   order: 0, isDefault: true, wipLimit: null, bgColor: null },
  { id: 'todo',        label: 'A fazer',      color: 'text-blue-400',   accent: 'bg-blue-500',   order: 1, isDefault: true, wipLimit: null, bgColor: null },
  { id: 'in_progress', label: 'Em progresso', color: 'text-yellow-400', accent: 'bg-yellow-400', order: 2, isDefault: true, wipLimit: null, bgColor: null },
  { id: 'done',        label: 'Concluído',    color: 'text-green-400',  accent: 'bg-green-500',  order: 3, isDefault: true, wipLimit: null, bgColor: null },
];

function loadColumns(): KanbanColumn[] {
  try {
    const raw = localStorage.getItem('kanban_columns');
    if (raw) {
      const cols = JSON.parse(raw) as KanbanColumn[];
      // Ensure new fields exist
      return cols.map(c => ({
        ...c,
        wipLimit: c.wipLimit ?? null,
        bgColor: c.bgColor ?? null,
      }));
    }
  } catch { /* ignore */ }
  return DEFAULT_COLUMNS;
}

function saveColumns(cols: KanbanColumn[]) {
  localStorage.setItem('kanban_columns', JSON.stringify(cols));
}

interface AppState {
  tasks: Task[];
  projects: Project[];
  sections: Section[];
  kanbanColumns: KanbanColumn[];
  addKanbanColumn: (label: string) => void;
  updateKanbanColumn: (id: string, changes: Partial<KanbanColumn>) => void;
  deleteKanbanColumn: (id: string) => void;
  reorderKanbanColumns: (cols: KanbanColumn[]) => void;
  labels: Label[];
  filters: SavedFilter[];
  activeView: NavView;
  selectedTaskId: string | null;
  theme: 'dark' | 'light';
  focusActive: boolean;

  // ── Knowledge Notes ────────────────────────────────────────────────────────
  knowledgeNotes: KnowledgeNote[];
  selectedNoteId: string | null;
  setSelectedNote: (id: string | null) => void;
  addKnowledgeNote: () => void;
  updateKnowledgeNote: (id: string, changes: Partial<KnowledgeNote>) => void;
  deleteKnowledgeNote: (id: string) => void;

  setActiveView: (view: NavView) => void;
  setSelectedTask: (id: string | null) => void;
  toggleTheme: () => void;
  toggleFocus: () => void;

  addTask: (partial: Partial<Task> & { title: string }) => Promise<Task>;
  updateTask: (id: string, changes: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTask: (id: string) => void;
  duplicateTask: (id: string) => Promise<void>;
  convertSubtaskToTask: (taskId: string, subtaskId: string) => Promise<void>;

  addSubtask: (taskId: string, title: string) => Promise<void>;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  deleteSubtask: (taskId: string, subtaskId: string) => void;

  addComment: (taskId: string, text: string) => void;
  deleteComment: (taskId: string, commentId: string) => void;
  addAttachment: (taskId: string, attachment: Attachment) => void;
  deleteAttachment: (taskId: string, attachmentId: string) => void;

  addProject: (name: string, color: ProjectColor) => Promise<Project>;
  updateProject: (id: string, changes: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  setProjectView: (id: string, view: ProjectView) => void;

  addSection: (projectId: string, name: string) => Promise<Section>;
  updateSection: (id: string, changes: Partial<Section>) => void;
  deleteSection: (id: string) => void;

  addLabel: (name: string, color: string) => Promise<Label>;
  updateLabel: (id: string, changes: Partial<Label>) => void;
  deleteLabel: (id: string) => void;

  addFilter: (name: string, query: string, color: string) => Promise<SavedFilter>;
  updateFilter: (id: string, changes: Partial<SavedFilter>) => void;
  deleteFilter: (id: string) => void;

  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;

  // ── Meeting Notes ──────────────────────────────────────────────────────────
  meetingNotes: MeetingNote[];
  addMeetingNote: (template?: MeetingTemplate) => MeetingNote;
  updateMeetingNote: (id: string, changes: Partial<MeetingNote>) => void;
  deleteMeetingNote: (id: string) => void;
  convertActionItems: (meetingId: string, itemIds: string[]) => Promise<void>;
  selectedMeetingId: string | null;
  setSelectedMeeting: (id: string | null) => void;
}

const now = () => new Date().toISOString();

// Simple DOM toast for save errors (no external dependency needed)
function showErrorToast(message: string) {
  const el = document.createElement('div');
  el.textContent = message;
  el.style.cssText = [
    'position:fixed', 'bottom:80px', 'left:50%', 'transform:translateX(-50%)',
    'background:#ef4444', 'color:#fff', 'padding:10px 18px', 'border-radius:8px',
    'font-size:13px', 'z-index:99999', 'box-shadow:0 4px 12px rgba(0,0,0,.4)',
    'pointer-events:none', 'max-width:90vw', 'text-align:center',
  ].join(';');
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

// Builds the description for a Kanban card linked to a meeting note
function buildMeetingDescription(note: MeetingNote, projectName: string | null): string {
  const date = new Date(note.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  const client = projectName ? `🏢 Cliente: ${projectName}` : '';
  const participants = note.participants.length > 0 ? `👥 ${note.participants.join(', ')}` : '';
  const actions = note.actionItems.length > 0 ? `✅ ${note.actionItems.length} item(s) de ação` : '';
  return [
    `📅 Data: ${date}`,
    client,
    participants,
    actions,
    note.agenda ? `\n📌 Pauta:\n${note.agenda.slice(0, 200)}${note.agenda.length > 200 ? '...' : ''}` : '',
  ].filter(Boolean).join('\n');
}

// Fields that are stored only in localStorage, not sent to DB
const EXTRA_FIELDS: (keyof Task)[] = ['colorTag', 'estimatedMinutes', 'loggedMinutes', 'dependencies', 'comments', 'attachments'];

export const useStore = create<AppState>()((set, get) => ({
  tasks: [],
  projects: [],
  sections: [],
  labels: [],
  filters: [],
  kanbanColumns: loadColumns(),
  activeView: 'kanban' as const,
  selectedTaskId: null,
  theme: (localStorage.getItem('theme') as 'dark' | 'light') ?? 'dark',
  focusActive: localStorage.getItem('focus_active') === 'true',
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  addKanbanColumn: (label) => {
    const cols = get().kanbanColumns;
    const newCol: KanbanColumn = {
      id: uuid(),
      label,
      color: 'text-purple-400',
      accent: 'bg-purple-400',
      order: cols.length,
      isDefault: false,
      wipLimit: null,
      bgColor: null,
    };
    const next = [...cols, newCol];
    saveColumns(next);
    set({ kanbanColumns: next });
  },

  updateKanbanColumn: (id, changes) => {
    const next = get().kanbanColumns.map(c => c.id === id ? { ...c, ...changes } : c);
    saveColumns(next);
    set({ kanbanColumns: next });
  },

  deleteKanbanColumn: (id) => {
    const next = get().kanbanColumns.filter(c => c.id !== id);
    saveColumns(next);
    set({ kanbanColumns: next });
  },

  reorderKanbanColumns: (cols) => {
    saveColumns(cols);
    set({ kanbanColumns: cols });
  },

  setActiveView: (view) => set({ activeView: view, selectedTaskId: null, sidebarOpen: false }),
  toggleFocus: () => set((s) => {
    const next = !s.focusActive;
    localStorage.setItem('focus_active', String(next));
    return { focusActive: next };
  }),
  setSelectedTask: (id) => set({ selectedTaskId: id }),
  toggleTheme: () => set((s) => {
    const next = s.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', next);
    document.documentElement.classList.toggle('dark', next === 'dark');
    return { theme: next };
  }),

  // ── Tasks ────────────────────────────────────────────────────────────────
  addTask: async (partial) => {
    const optimistic: Task = {
      id: uuid(),
      title: partial.title,
      description: partial.description ?? '',
      projectId: partial.projectId ?? null,
      sectionId: partial.sectionId ?? null,
      priority: partial.priority ?? 'p4',
      status: partial.status ?? 'backlog',
      labelIds: partial.labelIds ?? [],
      dueDate: partial.dueDate ?? null,
      dueTime: partial.dueTime ?? null,
      completed: false,
      completedAt: null,
      subtasks: [],
      recurrence: partial.recurrence ?? { type: 'none' },
      reminders: [],
      order: get().tasks.length,
      createdAt: now(),
      updatedAt: now(),
      colorTag: null,
      estimatedMinutes: null,
      loggedMinutes: null,
      dependencies: [],
      comments: [],
      attachments: [],
    };
    // Optimistic update
    set((s) => ({ tasks: [...s.tasks, optimistic] }));
    try {
      const saved = await tasksApi.create(optimistic);
      // Merge extra fields back (they may be lost after DB round-trip)
      const withExtras: Task = {
        ...saved,
        colorTag: optimistic.colorTag,
        estimatedMinutes: optimistic.estimatedMinutes,
        loggedMinutes: optimistic.loggedMinutes,
        dependencies: optimistic.dependencies,
        comments: optimistic.comments,
        attachments: optimistic.attachments,
      };
      set((s) => ({ tasks: s.tasks.map((t) => t.id === optimistic.id ? withExtras : t) }));
      return withExtras;
    } catch (err) {
      // Rollback on error
      set((s) => ({ tasks: s.tasks.filter((t) => t.id !== optimistic.id) }));
      console.error('[addTask]', err);
      throw err;
    }
  },

  updateTask: (id, changes) => {
    // Separate extra fields from DB fields
    const extraChanges: Partial<Task> = {};
    const dbChanges: Partial<Task> = {};
    (Object.keys(changes) as (keyof Task)[]).forEach(key => {
      if (EXTRA_FIELDS.includes(key)) {
        (extraChanges as Record<string, unknown>)[key] = (changes as Record<string, unknown>)[key];
      } else {
        (dbChanges as Record<string, unknown>)[key] = (changes as Record<string, unknown>)[key];
      }
    });

    // Save extra fields to localStorage immediately
    if (Object.keys(extraChanges).length > 0) {
      setTaskExtras(id, extraChanges as Parameters<typeof setTaskExtras>[1]);
    }

    // Optimistic update: snapshot previous state for rollback
    const previousTask = get().tasks.find(t => t.id === id);
    set((s) => ({
      tasks: s.tasks.map((t) => t.id === id ? { ...t, ...changes, updatedAt: now() } : t),
    }));

    // ── Recurrence: spawn next occurrence when marking complete ──────────────
    if (changes.completed === true && previousTask && previousTask.recurrence?.type !== 'none') {
      const rec = previousTask.recurrence;
      const baseDate = previousTask.dueDate ?? new Date().toISOString().split('T')[0];
      const nextDate = calcNextDate(baseDate, rec);
      if (nextDate && (!rec.endDate || nextDate <= rec.endDate)) {
        get().addTask({
          title: previousTask.title,
          description: previousTask.description,
          projectId: previousTask.projectId,
          sectionId: previousTask.sectionId,
          priority: previousTask.priority,
          labelIds: previousTask.labelIds,
          dueDate: nextDate,
          dueTime: previousTask.dueTime,
          status: 'todo',
          recurrence: rec,
          colorTag: previousTask.colorTag,
          estimatedMinutes: previousTask.estimatedMinutes,
        }).catch(err => console.error('[recurrence spawn]', err));
      }
    }

    // Send DB fields to Supabase and roll back on failure
    if (Object.keys(dbChanges).length > 0) {
      tasksApi.update(id, dbChanges).catch((err) => {
        console.error('[updateTask] Supabase error — rolling back:', err);
        // Show a brief error toast so the user sees save failures
        const msg = err instanceof Error ? err.message : 'Erro ao salvar';
        showErrorToast(`Erro ao salvar tarefa: ${msg}`);
        // Rollback to previous state
        if (previousTask) {
          set((s) => ({
            tasks: s.tasks.map((t) => t.id === id ? previousTask : t),
          }));
        }
      });
    }
  },

  deleteTask: (id) => {
    set((s) => ({
      tasks: s.tasks.filter((t) => t.id !== id),
      selectedTaskId: s.selectedTaskId === id ? null : s.selectedTaskId,
    }));
    tasksApi.delete(id).catch((err) => console.error('[deleteTask]', err));
  },

  toggleTask: (id) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;
    const completed = !task.completed;
    const status = completed ? 'done' : 'backlog';
    const completedAt = completed ? now() : null;
    // Optimistic update
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === id ? { ...t, completed, status, completedAt, updatedAt: now() } : t,
      ),
    }));
    // ── Recurrence: spawn next occurrence when marking complete ──────────────
    if (completed && task.recurrence?.type !== 'none') {
      const baseDate = task.dueDate ?? new Date().toISOString().split('T')[0];
      const nextDate = calcNextDate(baseDate, task.recurrence);
      if (nextDate && (!task.recurrence.endDate || nextDate <= task.recurrence.endDate)) {
        get().addTask({
          title: task.title,
          description: task.description,
          projectId: task.projectId,
          sectionId: task.sectionId,
          priority: task.priority,
          labelIds: task.labelIds,
          dueDate: nextDate,
          dueTime: task.dueTime,
          status: 'todo',
          recurrence: task.recurrence,
          colorTag: task.colorTag,
          estimatedMinutes: task.estimatedMinutes,
        }).catch(err => console.error('[recurrence spawn toggleTask]', err));
      }
    }

    tasksApi.update(id, { completed, status, completedAt })
      .catch((err) => {
        console.error('[toggleTask] Supabase error — rolling back:', err);
        showErrorToast('Erro ao salvar tarefa. Verifique a conexão.');
        set((s) => ({
          tasks: s.tasks.map((t) => t.id === id ? task : t),
        }));
      });
  },

  duplicateTask: async (id) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;
    await get().addTask({
      ...task,
      title: task.title + ' (cópia)',
      completed: false,
      completedAt: null,
      subtasks: [],
    });
  },

  convertSubtaskToTask: async (taskId, subtaskId) => {
    const task = get().tasks.find((t) => t.id === taskId);
    const sub = task?.subtasks.find((s) => s.id === subtaskId);
    if (!sub || !task) return;
    // Create new task with subtask title
    await get().addTask({
      title: sub.title,
      projectId: task.projectId,
      sectionId: task.sectionId,
      priority: task.priority,
      status: 'backlog',
    });
    // Remove subtask from parent
    get().deleteSubtask(taskId, subtaskId);
  },

  // ── Comments ─────────────────────────────────────────────────────────────
  addComment: (taskId, text) => {
    const comment: Comment = { id: uuid(), text, createdAt: now() };
    const task = get().tasks.find(t => t.id === taskId);
    if (!task) return;
    const comments = [...task.comments, comment];
    setTaskExtras(taskId, { comments });
    set((s) => ({
      tasks: s.tasks.map(t => t.id === taskId ? { ...t, comments } : t),
    }));
  },

  deleteComment: (taskId, commentId) => {
    const task = get().tasks.find(t => t.id === taskId);
    if (!task) return;
    const comments = task.comments.filter(c => c.id !== commentId);
    setTaskExtras(taskId, { comments });
    set((s) => ({
      tasks: s.tasks.map(t => t.id === taskId ? { ...t, comments } : t),
    }));
  },

  // ── Attachments ───────────────────────────────────────────────────────────
  addAttachment: (taskId, attachment) => {
    const task = get().tasks.find(t => t.id === taskId);
    if (!task) return;
    const attachments = [...task.attachments, attachment];
    setTaskExtras(taskId, { attachments });
    set((s) => ({
      tasks: s.tasks.map(t => t.id === taskId ? { ...t, attachments } : t),
    }));
  },

  deleteAttachment: (taskId, attachmentId) => {
    const task = get().tasks.find(t => t.id === taskId);
    if (!task) return;
    // Also remove from localStorage
    localStorage.removeItem(`attachment_${attachmentId}`);
    const attachments = task.attachments.filter(a => a.id !== attachmentId);
    setTaskExtras(taskId, { attachments });
    set((s) => ({
      tasks: s.tasks.map(t => t.id === taskId ? { ...t, attachments } : t),
    }));
  },

  // ── Subtasks ─────────────────────────────────────────────────────────────
  addSubtask: async (taskId, title) => {
    const saved = await subtasksApi.create(taskId, title);
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === taskId ? { ...t, subtasks: [...t.subtasks, saved], updatedAt: now() } : t,
      ),
    }));
  },

  toggleSubtask: (taskId, subtaskId) => {
    const task = get().tasks.find((t) => t.id === taskId);
    const sub = task?.subtasks.find((s) => s.id === subtaskId);
    if (!sub) return;
    const completed = !sub.completed;
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === taskId
          ? { ...t, subtasks: t.subtasks.map((st) => st.id === subtaskId ? { ...st, completed } : st) }
          : t,
      ),
    }));
    subtasksApi.toggle(subtaskId, completed).catch((err) => console.error('[toggleSubtask]', err));
  },

  deleteSubtask: (taskId, subtaskId) => {
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === taskId
          ? { ...t, subtasks: t.subtasks.filter((st) => st.id !== subtaskId) }
          : t,
      ),
    }));
    subtasksApi.delete(subtaskId).catch((err) => console.error('[deleteSubtask]', err));
  },

  // ── Projects ─────────────────────────────────────────────────────────────
  addProject: async (name, color) => {
    const optimistic: Project = {
      id: uuid(), name, color, view: 'list',
      order: get().projects.length, archived: false, createdAt: now(),
    };
    set((s) => ({ projects: [...s.projects, optimistic] }));
    try {
      const saved = await projectsApi.create(optimistic);
      set((s) => ({ projects: s.projects.map((p) => p.id === optimistic.id ? saved : p) }));
      return saved;
    } catch (err) {
      set((s) => ({ projects: s.projects.filter((p) => p.id !== optimistic.id) }));
      throw err;
    }
  },

  updateProject: (id, changes) => {
    set((s) => ({ projects: s.projects.map((p) => p.id === id ? { ...p, ...changes } : p) }));
    projectsApi.update(id, changes).catch((err) => console.error('[updateProject]', err));
  },

  deleteProject: (id) => {
    set((s) => ({
      projects: s.projects.filter((p) => p.id !== id),
      tasks: s.tasks.map((t) => t.projectId === id ? { ...t, projectId: null } : t),
      sections: s.sections.filter((sec) => sec.projectId !== id),
    }));
    projectsApi.delete(id).catch((err) => console.error('[deleteProject]', err));
  },

  setProjectView: (id, view) => {
    set((s) => ({ projects: s.projects.map((p) => p.id === id ? { ...p, view } : p) }));
    projectsApi.update(id, { view }).catch((err) => console.error('[setProjectView]', err));
  },

  // ── Sections ─────────────────────────────────────────────────────────────
  addSection: async (projectId, name) => {
    const optimistic: Section = {
      id: uuid(), projectId, name,
      order: get().sections.filter((s) => s.projectId === projectId).length,
      collapsed: false,
    };
    set((s) => ({ sections: [...s.sections, optimistic] }));
    try {
      const saved = await sectionsApi.create(optimistic);
      set((s) => ({ sections: s.sections.map((sec) => sec.id === optimistic.id ? saved : sec) }));
      return saved;
    } catch (err) {
      set((s) => ({ sections: s.sections.filter((sec) => sec.id !== optimistic.id) }));
      throw err;
    }
  },

  updateSection: (id, changes) => {
    set((s) => ({ sections: s.sections.map((sec) => sec.id === id ? { ...sec, ...changes } : sec) }));
    sectionsApi.update(id, changes).catch((err) => console.error('[updateSection]', err));
  },

  deleteSection: (id) => {
    set((s) => ({
      sections: s.sections.filter((sec) => sec.id !== id),
      tasks: s.tasks.map((t) => t.sectionId === id ? { ...t, sectionId: null } : t),
    }));
    sectionsApi.delete(id).catch((err) => console.error('[deleteSection]', err));
  },

  // ── Labels ───────────────────────────────────────────────────────────────
  addLabel: async (name, color) => {
    const saved = await labelsApi.create(name, color);
    set((s) => ({ labels: [...s.labels, saved] }));
    return saved;
  },

  updateLabel: (id, changes) => {
    set((s) => ({ labels: s.labels.map((l) => l.id === id ? { ...l, ...changes } : l) }));
    labelsApi.update(id, changes).catch((err) => console.error('[updateLabel]', err));
  },

  deleteLabel: (id) => {
    set((s) => ({
      labels: s.labels.filter((l) => l.id !== id),
      tasks: s.tasks.map((t) => ({ ...t, labelIds: t.labelIds.filter((lid) => lid !== id) })),
    }));
    labelsApi.delete(id).catch((err) => console.error('[deleteLabel]', err));
  },

  // ── Filters ──────────────────────────────────────────────────────────────
  addFilter: async (name, query, color) => {
    const saved = await filtersApi.create(name, query, color);
    set((s) => ({ filters: [...s.filters, saved] }));
    return saved;
  },

  updateFilter: (id, changes) => {
    set((s) => ({ filters: s.filters.map((f) => f.id === id ? { ...f, ...changes } : f) }));
    filtersApi.update(id, changes).catch((err) => console.error('[updateFilter]', err));
  },

  deleteFilter: (id) => {
    set((s) => ({ filters: s.filters.filter((f) => f.id !== id) }));
    filtersApi.delete(id).catch((err) => console.error('[deleteFilter]', err));
  },

  // ── Knowledge Notes (localStorage) ──────────────────────────────────────
  knowledgeNotes: (() => {
    try { return JSON.parse(localStorage.getItem('knowledge_notes') ?? '[]') as KnowledgeNote[]; }
    catch { return []; }
  })(),
  selectedNoteId: null,
  setSelectedNote: (id) => set({ selectedNoteId: id }),

  addKnowledgeNote: () => {
    const note: KnowledgeNote = {
      id: uuid(), title: 'Nova Nota', emoji: '📝', color: '#6366f1',
      description: '', links: [], files: [], projectId: null,
      pinned: false, tags: [], createdAt: now(), updatedAt: now(),
    };
    set((s) => {
      const next = [note, ...s.knowledgeNotes];
      localStorage.setItem('knowledge_notes', JSON.stringify(next));
      return { knowledgeNotes: next, selectedNoteId: note.id };
    });
  },

  updateKnowledgeNote: (id, changes) => {
    set((s) => {
      const next = s.knowledgeNotes.map(n =>
        n.id === id ? { ...n, ...changes, updatedAt: now() } : n
      );
      localStorage.setItem('knowledge_notes', JSON.stringify(next));
      return { knowledgeNotes: next };
    });
  },

  deleteKnowledgeNote: (id) => {
    set((s) => {
      const next = s.knowledgeNotes.filter(n => n.id !== id);
      localStorage.setItem('knowledge_notes', JSON.stringify(next));
      return { knowledgeNotes: next, selectedNoteId: s.selectedNoteId === id ? null : s.selectedNoteId };
    });
  },

  // ── Meeting Notes (localStorage) ─────────────────────────────────────────
  meetingNotes: (() => {
    try {
      const raw = JSON.parse(localStorage.getItem('meeting_notes') ?? '[]') as MeetingNote[];
      // Migrate old notes that don't have linkedTaskId
      return raw.map(m => ({ ...m, linkedTaskId: m.linkedTaskId ?? null, files: m.files ?? [] }));
    }
    catch { return []; }
  })(),
  selectedMeetingId: null,
  setSelectedMeeting: (id) => set({ selectedMeetingId: id }),

  addMeetingNote: (template = 'blank') => {
    const tpl = MEETING_TEMPLATES[template] ?? MEETING_TEMPLATES.blank;
    const note: MeetingNote = {
      id: uuid(),
      title: 'Nova Ata',
      date: new Date().toISOString().split('T')[0],
      participants: [],
      agenda: tpl.agenda,
      discussion: tpl.discussion,
      decisions: tpl.decisions,
      actionItems: [],
      files: [],
      template,
      projectId: null,
      linkedTaskId: null,
      createdAt: now(),
      updatedAt: now(),
    };

    // Create linked Kanban card immediately
    get().addTask({
      title: `📋 ${note.title}`,
      description: buildMeetingDescription(note, null),
      projectId: null,
      status: 'todo',
      priority: 'p3',
    }).then((task) => {
      const updated: MeetingNote = { ...note, linkedTaskId: task.id };
      set((s) => {
        const next = [updated, ...s.meetingNotes.filter(m => m.id !== note.id)];
        localStorage.setItem('meeting_notes', JSON.stringify(next));
        return { meetingNotes: next };
      });
    });

    set((s) => {
      const next = [note, ...s.meetingNotes];
      localStorage.setItem('meeting_notes', JSON.stringify(next));
      return { meetingNotes: next, selectedMeetingId: note.id };
    });
    return note;
  },

  updateMeetingNote: (id, changes) => {
    set((s) => {
      const prev = s.meetingNotes.find(m => m.id === id);
      const next = s.meetingNotes.map((m) =>
        m.id === id ? { ...m, ...changes, updatedAt: now() } : m
      );
      localStorage.setItem('meeting_notes', JSON.stringify(next));

      // Sync Kanban card if title/date/project changed
      const updated = next.find(m => m.id === id);
      if (updated?.linkedTaskId && prev) {
        const needsSync = changes.title !== undefined || changes.date !== undefined || changes.projectId !== undefined || changes.participants !== undefined;
        if (needsSync) {
          const projectName = s.projects.find(p => p.id === updated.projectId)?.name ?? null;
          get().updateTask(updated.linkedTaskId, {
            title: `📋 ${updated.title}`,
            description: buildMeetingDescription(updated, projectName),
            projectId: updated.projectId,
          });
        }
      }

      return { meetingNotes: next };
    });
  },

  deleteMeetingNote: (id) => {
    set((s) => {
      const meeting = s.meetingNotes.find(m => m.id === id);
      const next = s.meetingNotes.filter((m) => m.id !== id);
      localStorage.setItem('meeting_notes', JSON.stringify(next));
      // Also delete linked Kanban card
      if (meeting?.linkedTaskId) {
        get().deleteTask(meeting.linkedTaskId);
      }
      return {
        meetingNotes: next,
        selectedMeetingId: s.selectedMeetingId === id ? null : s.selectedMeetingId,
      };
    });
  },

  convertActionItems: async (meetingId, itemIds) => {
    const meeting = get().meetingNotes.find((m) => m.id === meetingId);
    if (!meeting) return;
    const updatedItems: MeetingActionItem[] = [...meeting.actionItems];

    for (const itemId of itemIds) {
      const item = updatedItems.find((i) => i.id === itemId);
      if (!item || item.converted) continue;

      const task = await get().addTask({
        title: item.text,
        priority: item.priority,
        dueDate: item.dueDate,
        projectId: meeting.projectId,
        description: `📋 Ata: ${meeting.title} (${meeting.date})`,
        status: 'todo',
      });

      const idx = updatedItems.findIndex((i) => i.id === itemId);
      updatedItems[idx] = { ...item, converted: true, taskId: task.id };
    }

    get().updateMeetingNote(meetingId, { actionItems: updatedItems });
  },
}));
