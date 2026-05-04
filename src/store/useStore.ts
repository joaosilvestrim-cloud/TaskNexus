import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';
import type {
  Task, Project, Section, Label, SavedFilter, NavView,
  SubTask, ProjectColor, ProjectView,
} from '../types';

interface AppState {
  // Data
  tasks: Task[];
  projects: Project[];
  sections: Section[];
  labels: Label[];
  filters: SavedFilter[];

  // UI
  activeView: NavView;
  selectedTaskId: string | null;
  sidebarCollapsed: boolean;

  // Navigation
  setActiveView: (view: NavView) => void;
  setSelectedTask: (id: string | null) => void;
  toggleSidebar: () => void;

  // Tasks
  addTask: (partial: Partial<Task> & { title: string }) => Task;
  updateTask: (id: string, changes: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTask: (id: string) => void;
  reorderTasks: (ids: string[]) => void;

  // Subtasks
  addSubtask: (taskId: string, title: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  deleteSubtask: (taskId: string, subtaskId: string) => void;

  // Projects
  addProject: (name: string, color: ProjectColor) => Project;
  updateProject: (id: string, changes: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  setProjectView: (id: string, view: ProjectView) => void;

  // Sections
  addSection: (projectId: string, name: string) => Section;
  updateSection: (id: string, changes: Partial<Section>) => void;
  deleteSection: (id: string) => void;

  // Labels
  addLabel: (name: string, color: string) => Label;
  updateLabel: (id: string, changes: Partial<Label>) => void;
  deleteLabel: (id: string) => void;

  // Filters
  addFilter: (name: string, query: string, color: string) => SavedFilter;
  updateFilter: (id: string, changes: Partial<SavedFilter>) => void;
  deleteFilter: (id: string) => void;
}

const now = () => new Date().toISOString();

const defaultLabels: Label[] = [
  { id: uuid(), name: 'urgente', color: '#ef4444' },
  { id: uuid(), name: 'escritório', color: '#3b82f6' },
  { id: uuid(), name: '15min', color: '#10b981' },
  { id: uuid(), name: 'pessoal', color: '#8b5cf6' },
];

const defaultProject: Project = {
  id: 'project-default',
  name: 'Trabalho',
  color: 'blue',
  view: 'list',
  order: 0,
  archived: false,
  createdAt: now(),
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      tasks: [],
      projects: [defaultProject],
      sections: [
        { id: uuid(), projectId: 'project-default', name: 'Planejamento', order: 0, collapsed: false },
        { id: uuid(), projectId: 'project-default', name: 'Execução', order: 1, collapsed: false },
        { id: uuid(), projectId: 'project-default', name: 'Análise', order: 2, collapsed: false },
      ],
      labels: defaultLabels,
      filters: [
        { id: uuid(), name: 'Urgente Hoje', query: 'hoje & p1', color: '#ef4444' },
        { id: uuid(), name: 'Trabalho Hoje', query: 'hoje & #Trabalho', color: '#3b82f6' },
      ],
      activeView: 'inbox',
      selectedTaskId: null,
      sidebarCollapsed: false,

      setActiveView: (view) => set({ activeView: view, selectedTaskId: null }),
      setSelectedTask: (id) => set({ selectedTaskId: id }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

      // ── Tasks ──────────────────────────────────────────────────────────
      addTask: (partial) => {
        const task: Task = {
          id: uuid(),
          title: partial.title,
          description: partial.description ?? '',
          projectId: partial.projectId ?? null,
          sectionId: partial.sectionId ?? null,
          priority: partial.priority ?? 'p4',
          labelIds: partial.labelIds ?? [],
          dueDate: partial.dueDate ?? null,
          dueTime: partial.dueTime ?? null,
          completed: false,
          completedAt: null,
          subtasks: partial.subtasks ?? [],
          recurrence: partial.recurrence ?? { type: 'none' },
          reminders: partial.reminders ?? [],
          order: get().tasks.length,
          createdAt: now(),
          updatedAt: now(),
        };
        set((s) => ({ tasks: [...s.tasks, task] }));
        return task;
      },

      updateTask: (id, changes) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, ...changes, updatedAt: now() } : t,
          ),
        })),

      deleteTask: (id) =>
        set((s) => ({
          tasks: s.tasks.filter((t) => t.id !== id),
          selectedTaskId: s.selectedTaskId === id ? null : s.selectedTaskId,
        })),

      toggleTask: (id) => {
        const task = get().tasks.find((t) => t.id === id);
        if (!task) return;
        const completed = !task.completed;
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id
              ? { ...t, completed, completedAt: completed ? now() : null, updatedAt: now() }
              : t,
          ),
        }));
      },

      reorderTasks: (ids) =>
        set((s) => ({
          tasks: s.tasks.map((t) => {
            const idx = ids.indexOf(t.id);
            return idx >= 0 ? { ...t, order: idx } : t;
          }),
        })),

      // ── Subtasks ───────────────────────────────────────────────────────
      addSubtask: (taskId, title) => {
        const sub: SubTask = { id: uuid(), title, completed: false, createdAt: now() };
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? { ...t, subtasks: [...t.subtasks, sub], updatedAt: now() }
              : t,
          ),
        }));
      },

      toggleSubtask: (taskId, subtaskId) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  subtasks: t.subtasks.map((st) =>
                    st.id === subtaskId ? { ...st, completed: !st.completed } : st,
                  ),
                  updatedAt: now(),
                }
              : t,
          ),
        })),

      deleteSubtask: (taskId, subtaskId) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  subtasks: t.subtasks.filter((st) => st.id !== subtaskId),
                  updatedAt: now(),
                }
              : t,
          ),
        })),

      // ── Projects ───────────────────────────────────────────────────────
      addProject: (name, color) => {
        const project: Project = {
          id: uuid(),
          name,
          color,
          view: 'list',
          order: get().projects.length,
          archived: false,
          createdAt: now(),
        };
        set((s) => ({ projects: [...s.projects, project] }));
        return project;
      },

      updateProject: (id, changes) =>
        set((s) => ({
          projects: s.projects.map((p) => (p.id === id ? { ...p, ...changes } : p)),
        })),

      deleteProject: (id) =>
        set((s) => ({
          projects: s.projects.filter((p) => p.id !== id),
          tasks: s.tasks.map((t) => (t.projectId === id ? { ...t, projectId: null } : t)),
          sections: s.sections.filter((sec) => sec.projectId !== id),
        })),

      setProjectView: (id, view) =>
        set((s) => ({
          projects: s.projects.map((p) => (p.id === id ? { ...p, view } : p)),
        })),

      // ── Sections ───────────────────────────────────────────────────────
      addSection: (projectId, name) => {
        const section: Section = {
          id: uuid(),
          projectId,
          name,
          order: get().sections.filter((s) => s.projectId === projectId).length,
          collapsed: false,
        };
        set((s) => ({ sections: [...s.sections, section] }));
        return section;
      },

      updateSection: (id, changes) =>
        set((s) => ({
          sections: s.sections.map((sec) => (sec.id === id ? { ...sec, ...changes } : sec)),
        })),

      deleteSection: (id) =>
        set((s) => ({
          sections: s.sections.filter((sec) => sec.id !== id),
          tasks: s.tasks.map((t) => (t.sectionId === id ? { ...t, sectionId: null } : t)),
        })),

      // ── Labels ─────────────────────────────────────────────────────────
      addLabel: (name, color) => {
        const label: Label = { id: uuid(), name, color };
        set((s) => ({ labels: [...s.labels, label] }));
        return label;
      },

      updateLabel: (id, changes) =>
        set((s) => ({
          labels: s.labels.map((l) => (l.id === id ? { ...l, ...changes } : l)),
        })),

      deleteLabel: (id) =>
        set((s) => ({
          labels: s.labels.filter((l) => l.id !== id),
          tasks: s.tasks.map((t) => ({
            ...t,
            labelIds: t.labelIds.filter((lid) => lid !== id),
          })),
        })),

      // ── Filters ────────────────────────────────────────────────────────
      addFilter: (name, query, color) => {
        const filter: SavedFilter = { id: uuid(), name, query, color };
        set((s) => ({ filters: [...s.filters, filter] }));
        return filter;
      },

      updateFilter: (id, changes) =>
        set((s) => ({
          filters: s.filters.map((f) => (f.id === id ? { ...f, ...changes } : f)),
        })),

      deleteFilter: (id) =>
        set((s) => ({ filters: s.filters.filter((f) => f.id !== id) })),
    }),
    { name: 'tasknexus-store' },
  ),
);
