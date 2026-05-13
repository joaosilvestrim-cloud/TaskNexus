/**
 * Hook que sincroniza o Zustand store com o Supabase.
 * Carrega todos os dados do usuário após autenticação.
 */
import { useEffect, useState } from 'react';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { projectsApi, sectionsApi, labelsApi, tasksApi, filtersApi } from '../lib/api';
import { useStore, initUserStorage } from '../store/useStore';


export function useSupabaseSync() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);


  const loadAll = async (uid?: string) => {
    setLoading(true);
    setError(null);
    try {
      // Init user-scoped localStorage BEFORE reading any data
      if (uid) {
        initUserStorage(uid);
        // Store user in global store so components can read it
        const session = await supabase.auth.getSession();
        const u = session.data.session?.user;
        if (u) useStore.getState().setCurrentUser({ id: u.id, email: u.email ?? '' });
      }

      const [projects, sections, labels, tasks, filters] = await Promise.all([
        projectsApi.list(),
        sectionsApi.list(),
        labelsApi.list(),
        tasksApi.list(),
        filtersApi.list(),
      ]);

      // Populate store from Supabase (localStorage state already set by initUserStorage)
      useStore.setState({ projects, sections, labels, tasks, filters });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao carregar dados';
      setError(msg);
      console.error('[SupabaseSync] Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Get current session
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user;
      if (u) {
        setUser({ id: u.id, email: u.email ?? '' });
        loadAll(u.id);
      } else {
        setLoading(false);
      }
    });

    // Listen to auth state changes — only reload data on actual sign-in/sign-out,
    // NOT on TOKEN_REFRESHED (which fires every hour and would overwrite local state)
    const { data: listener } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      const u = session?.user;
      if (event === 'SIGNED_IN') {
        setUser(u ? { id: u.id, email: u.email ?? '' } : null);
        if (u) loadAll(u.id);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        useStore.setState({
          tasks: [], projects: [], sections: [], labels: [], filters: [],
          meetingNotes: [], knowledgeNotes: [], kanbanColumns: [],
          currentUser: null,
        });
        setLoading(false);
      } else if (event === 'TOKEN_REFRESHED' && u) {
        // Only update the user object, do NOT reload all data
        setUser({ id: u.id, email: u.email ?? '' });
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return { loading, error, user, reload: loadAll };
}
