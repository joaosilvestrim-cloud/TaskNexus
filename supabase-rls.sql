-- ============================================================
-- TaskNexus — RLS (Row Level Security) Migration
-- Cole isso no Supabase Dashboard > SQL Editor e execute
-- ============================================================

-- 1. Garantir que user_id existe em todas as tabelas principais
ALTER TABLE tasks         ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE projects      ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE labels        ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE saved_filters ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Ativar RLS em todas as tabelas
ALTER TABLE tasks         ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects      ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections      ENABLE ROW LEVEL SECURITY;
ALTER TABLE labels        ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_filters ENABLE ROW LEVEL SECURITY;
ALTER TABLE subtasks      ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_labels   ENABLE ROW LEVEL SECURITY;

-- 3. Remover policies antigas (se existirem)
DROP POLICY IF EXISTS "tasks_user_policy"       ON tasks;
DROP POLICY IF EXISTS "projects_user_policy"    ON projects;
DROP POLICY IF EXISTS "sections_user_policy"    ON sections;
DROP POLICY IF EXISTS "labels_user_policy"      ON labels;
DROP POLICY IF EXISTS "filters_user_policy"     ON saved_filters;
DROP POLICY IF EXISTS "subtasks_user_policy"    ON subtasks;
DROP POLICY IF EXISTS "task_labels_user_policy" ON task_labels;

-- 4. TASKS — cada usuário vê e modifica só as suas
CREATE POLICY "tasks_user_policy" ON tasks
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. PROJECTS — idem
CREATE POLICY "projects_user_policy" ON projects
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 6. SECTIONS — herdam do projeto (sem user_id direto)
CREATE POLICY "sections_user_policy" ON sections
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = sections.project_id
        AND projects.user_id = auth.uid()
    )
  );

-- 7. LABELS — cada usuário vê as suas
CREATE POLICY "labels_user_policy" ON labels
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 8. SAVED FILTERS
CREATE POLICY "filters_user_policy" ON saved_filters
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 9. SUBTASKS — herdam da task pai
CREATE POLICY "subtasks_user_policy" ON subtasks
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = subtasks.task_id
        AND tasks.user_id = auth.uid()
    )
  );

-- 10. TASK_LABELS — herdam da task pai
CREATE POLICY "task_labels_user_policy" ON task_labels
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_labels.task_id
        AND tasks.user_id = auth.uid()
    )
  );

-- 11. Índices para performance das policies
CREATE INDEX IF NOT EXISTS idx_tasks_user_id         ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_user_id      ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_labels_user_id        ON labels(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_filters_user_id ON saved_filters(user_id);

-- ============================================================
-- Pronto! Cada usuário agora só vê os próprios dados.
-- ============================================================
