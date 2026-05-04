/**
 * TaskNexus – Supabase API helpers
 * Todas as operações de banco de dados passam por aqui.
 */
import { supabase } from './supabase';
import type { Task, Project, Section, Label, SavedFilter, SubTask } from '../types';

// ── helpers ──────────────────────────────────────────────────────────────────
const uid = async () => {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
};

// ── PROJECTS ─────────────────────────────────────────────────────────────────
export const projectsApi = {
  async list(): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('sort_order');
    if (error) throw error;
    return (data ?? []).map(dbToProject);
  },

  async create(p: Omit<Project, 'id' | 'createdAt'>): Promise<Project> {
    const user_id = await uid();
    const { data, error } = await supabase
      .from('projects')
      .insert({ name: p.name, color: p.color, view: p.view, sort_order: p.order, archived: p.archived, user_id })
      .select()
      .single();
    if (error) throw error;
    return dbToProject(data);
  },

  async update(id: string, changes: Partial<Project>): Promise<void> {
    const { error } = await supabase
      .from('projects')
      .update({
        ...(changes.name !== undefined && { name: changes.name }),
        ...(changes.color !== undefined && { color: changes.color }),
        ...(changes.view !== undefined && { view: changes.view }),
        ...(changes.order !== undefined && { sort_order: changes.order }),
        ...(changes.archived !== undefined && { archived: changes.archived }),
      })
      .eq('id', id);
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) throw error;
  },
};

// ── SECTIONS ─────────────────────────────────────────────────────────────────
export const sectionsApi = {
  async list(): Promise<Section[]> {
    const { data, error } = await supabase
      .from('sections')
      .select('*')
      .order('sort_order');
    if (error) throw error;
    return (data ?? []).map(dbToSection);
  },

  async create(s: Omit<Section, 'id'>): Promise<Section> {
    const { data, error } = await supabase
      .from('sections')
      .insert({ project_id: s.projectId, name: s.name, sort_order: s.order, collapsed: s.collapsed })
      .select()
      .single();
    if (error) throw error;
    return dbToSection(data);
  },

  async update(id: string, changes: Partial<Section>): Promise<void> {
    const { error } = await supabase
      .from('sections')
      .update({
        ...(changes.name !== undefined && { name: changes.name }),
        ...(changes.collapsed !== undefined && { collapsed: changes.collapsed }),
        ...(changes.order !== undefined && { sort_order: changes.order }),
      })
      .eq('id', id);
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('sections').delete().eq('id', id);
    if (error) throw error;
  },
};

// ── LABELS ───────────────────────────────────────────────────────────────────
export const labelsApi = {
  async list(): Promise<Label[]> {
    const { data, error } = await supabase.from('labels').select('*').order('name');
    if (error) throw error;
    return (data ?? []).map((r: Record<string, string>) => ({ id: r.id, name: r.name, color: r.color }));
  },

  async create(name: string, color: string): Promise<Label> {
    const user_id = await uid();
    const { data, error } = await supabase
      .from('labels')
      .insert({ name, color, user_id })
      .select()
      .single();
    if (error) throw error;
    return { id: data.id, name: data.name, color: data.color };
  },

  async update(id: string, changes: Partial<Label>): Promise<void> {
    const { error } = await supabase.from('labels').update(changes).eq('id', id);
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('labels').delete().eq('id', id);
    if (error) throw error;
  },
};

// ── TASKS ────────────────────────────────────────────────────────────────────
export const tasksApi = {
  async list(): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*, subtasks(*), task_labels(label_id)')
      .order('sort_order');
    if (error) throw error;
    return (data ?? []).map(dbToTask);
  },

  async create(t: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    const user_id = await uid();
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        title: t.title,
        description: t.description,
        project_id: t.projectId,
        section_id: t.sectionId,
        priority: t.priority,
        status: t.status ?? 'backlog',
        due_date: t.dueDate,
        due_time: t.dueTime,
        completed: t.completed,
        recurrence: t.recurrence,
        reminders: t.reminders,
        sort_order: t.order,
        user_id,
      })
      .select('*, subtasks(*), task_labels(label_id)')
      .single();
    if (error) throw error;

    // Insert label associations
    if (t.labelIds.length > 0) {
      await supabase.from('task_labels').insert(
        t.labelIds.map(label_id => ({ task_id: data.id, label_id }))
      );
    }

    return dbToTask({ ...data, task_labels: t.labelIds.map(lid => ({ label_id: lid })) });
  },

  async update(id: string, changes: Partial<Task>): Promise<void> {
    const dbChanges: Record<string, unknown> = {};
    if (changes.title !== undefined) dbChanges.title = changes.title;
    if (changes.description !== undefined) dbChanges.description = changes.description;
    if (changes.projectId !== undefined) dbChanges.project_id = changes.projectId;
    if (changes.sectionId !== undefined) dbChanges.section_id = changes.sectionId;
    if (changes.priority !== undefined) dbChanges.priority = changes.priority;
    if (changes.dueDate !== undefined) dbChanges.due_date = changes.dueDate;
    if (changes.dueTime !== undefined) dbChanges.due_time = changes.dueTime;
    if (changes.completed !== undefined) {
      dbChanges.completed = changes.completed;
      dbChanges.completed_at = changes.completed ? new Date().toISOString() : null;
    }
    if (changes.status !== undefined) dbChanges.status = changes.status;
    if (changes.recurrence !== undefined) dbChanges.recurrence = changes.recurrence;
    if (changes.reminders !== undefined) dbChanges.reminders = changes.reminders;
    if (changes.order !== undefined) dbChanges.sort_order = changes.order;

    if (Object.keys(dbChanges).length > 0) {
      const { error } = await supabase.from('tasks').update(dbChanges).eq('id', id);
      if (error) throw error;
    }

    // Update label associations
    if (changes.labelIds !== undefined) {
      await supabase.from('task_labels').delete().eq('task_id', id);
      if (changes.labelIds.length > 0) {
        await supabase.from('task_labels').insert(
          changes.labelIds.map(label_id => ({ task_id: id, label_id }))
        );
      }
    }
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) throw error;
  },
};

// ── SUBTASKS ─────────────────────────────────────────────────────────────────
export const subtasksApi = {
  async create(taskId: string, title: string): Promise<SubTask> {
    const { data, error } = await supabase
      .from('subtasks')
      .insert({ task_id: taskId, title, completed: false })
      .select()
      .single();
    if (error) throw error;
    return { id: data.id, title: data.title, completed: data.completed, createdAt: data.created_at };
  },

  async toggle(id: string, completed: boolean): Promise<void> {
    const { error } = await supabase.from('subtasks').update({ completed }).eq('id', id);
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('subtasks').delete().eq('id', id);
    if (error) throw error;
  },
};

// ── SAVED FILTERS ────────────────────────────────────────────────────────────
export const filtersApi = {
  async list(): Promise<SavedFilter[]> {
    const { data, error } = await supabase.from('saved_filters').select('*').order('name');
    if (error) throw error;
    return (data ?? []).map((r: Record<string, string>) => ({ id: r.id, name: r.name, query: r.query, color: r.color }));
  },

  async create(name: string, query: string, color: string): Promise<SavedFilter> {
    const user_id = await uid();
    const { data, error } = await supabase
      .from('saved_filters')
      .insert({ name, query, color, user_id })
      .select()
      .single();
    if (error) throw error;
    return { id: data.id, name: data.name, query: data.query, color: data.color };
  },

  async update(id: string, changes: Partial<SavedFilter>): Promise<void> {
    const { error } = await supabase.from('saved_filters').update(changes).eq('id', id);
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('saved_filters').delete().eq('id', id);
    if (error) throw error;
  },
};

// ── DB → APP type mappers ────────────────────────────────────────────────────
function dbToProject(r: Record<string, unknown>): Project {
  return {
    id: r.id as string,
    name: r.name as string,
    color: r.color as Project['color'],
    view: r.view as Project['view'],
    order: r.sort_order as number,
    archived: r.archived as boolean,
    createdAt: r.created_at as string,
  };
}

function dbToSection(r: Record<string, unknown>): Section {
  return {
    id: r.id as string,
    projectId: r.project_id as string,
    name: r.name as string,
    order: r.sort_order as number,
    collapsed: r.collapsed as boolean,
  };
}

function dbToTask(r: Record<string, unknown>): Task {
  const rawSubtasks = (r.subtasks as Array<Record<string, unknown>>) ?? [];
  const subtasks = rawSubtasks.map((s) => ({
    id: s.id as string,
    title: s.title as string,
    completed: s.completed as boolean,
    createdAt: (s.created_at ?? s.createdAt) as string,
  }));
  const labelIds = ((r.task_labels as { label_id: string }[]) ?? []).map(tl => tl.label_id);

  return {
    id: r.id as string,
    title: r.title as string,
    description: (r.description ?? '') as string,
    projectId: (r.project_id ?? null) as string | null,
    sectionId: (r.section_id ?? null) as string | null,
    priority: r.priority as Task['priority'],
    status: (r.status ?? 'backlog') as Task['status'],
    labelIds,
    dueDate: (r.due_date ?? null) as string | null,
    dueTime: (r.due_time ?? null) as string | null,
    completed: r.completed as boolean,
    completedAt: (r.completed_at ?? null) as string | null,
    subtasks,
    recurrence: (r.recurrence ?? { type: 'none' }) as Task['recurrence'],
    reminders: (r.reminders ?? []) as Task['reminders'],
    order: r.sort_order as number,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}
