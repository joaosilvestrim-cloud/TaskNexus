import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórias.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export type Database = {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string;
          name: string;
          color: string;
          view: 'list' | 'board';
          sort_order: number;
          archived: boolean;
          user_id: string;
          created_at: string;
        };
        Insert: Omit<Projects['Row'], 'id' | 'created_at'> & { id?: string };
        Update: Partial<Projects['Row']>;
      };
      tasks: {
        Row: {
          id: string;
          title: string;
          description: string;
          project_id: string | null;
          section_id: string | null;
          priority: 'p1' | 'p2' | 'p3' | 'p4';
          due_date: string | null;
          due_time: string | null;
          completed: boolean;
          completed_at: string | null;
          recurrence: object;
          reminders: object[];
          sort_order: number;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
      };
      sections: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          sort_order: number;
          collapsed: boolean;
          created_at: string;
        };
      };
      labels: {
        Row: {
          id: string;
          name: string;
          color: string;
          user_id: string;
          created_at: string;
        };
      };
      subtasks: {
        Row: {
          id: string;
          task_id: string;
          title: string;
          completed: boolean;
          sort_order: number;
          created_at: string;
        };
      };
      task_labels: {
        Row: {
          task_id: string;
          label_id: string;
        };
      };
      saved_filters: {
        Row: {
          id: string;
          name: string;
          query: string;
          color: string;
          user_id: string;
          created_at: string;
        };
      };
    };
  };
};

// Alias helpers
type Projects = Database['public']['Tables']['projects'];
