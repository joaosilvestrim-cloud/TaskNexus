/**
 * Hook que sincroniza o Zustand store com o Supabase.
 * Carrega todos os dados do usuário após autenticação.
 */
import { useEffect, useState } from 'react';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { projectsApi, sectionsApi, labelsApi, tasksApi, filtersApi } from '../lib/api';
import { useStore } from '../store/useStore';

export function useSupabaseSync() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);


  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [projects, sections, labels, tasks, filters] = await Promise.all([
        projectsApi.list(),
        sectionsApi.list(),
        labelsApi.list(),
        tasksApi.list(),
        filtersApi.list(),
      ]);

      // Populate store from Supabase
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
        loadAll();
      } else {
        setLoading(false);
      }
    });

    // Listen to auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      const u = session?.user;
      if (u) {
        setUser({ id: u.id, email: u.email ?? '' });
        loadAll();
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return { loading, error, user, reload: loadAll };
}
