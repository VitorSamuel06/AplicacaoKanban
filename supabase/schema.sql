-- ================================================
-- ScrumFlow - Database Schema for Supabase
-- ================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- 1. PROFILES TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on sign up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ================================================
-- 2. PROJECTS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  wip_limit INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);

-- ================================================
-- 3. PROJECT MEMBERS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS project_members (
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('scrum_master', 'developer')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (project_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_project_members_user ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_members_project ON project_members(project_id);

-- ================================================
-- 4. TASKS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'backlog' CHECK (status IN ('backlog', 'in_progress', 'in_review', 'done')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  assignee_id UUID REFERENCES auth.users(id),
  created_by UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
  deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_status ON tasks(project_id, status);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tasks_updated_at ON tasks;
CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ================================================
-- 5. WIP LIMIT VALIDATION TRIGGER
-- ================================================
CREATE OR REPLACE FUNCTION validate_wip_limit()
RETURNS TRIGGER AS $$
DECLARE
  current_wip INTEGER;
  project_wip_limit INTEGER;
BEGIN
  -- Only check when moving TO in_progress
  IF NEW.status = 'in_progress' AND (OLD.status IS NULL OR OLD.status != 'in_progress') THEN
    SELECT wip_limit INTO project_wip_limit
    FROM projects
    WHERE id = NEW.project_id;

    SELECT COUNT(*) INTO current_wip
    FROM tasks
    WHERE project_id = NEW.project_id
      AND status = 'in_progress'
      AND id != NEW.id;

    IF current_wip >= project_wip_limit THEN
      RAISE EXCEPTION 'WIP limit reached. Maximum % tasks in progress.', project_wip_limit;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_wip_limit ON tasks;
CREATE TRIGGER check_wip_limit
  BEFORE INSERT OR UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION validate_wip_limit();

-- ================================================
-- 6. STATUS TRANSITION VALIDATION TRIGGER
-- ================================================
CREATE OR REPLACE FUNCTION validate_status_transition()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
  status_order TEXT[] := ARRAY['backlog', 'in_progress', 'in_review', 'done'];
  old_idx INTEGER;
  new_idx INTEGER;
BEGIN
  -- Only validate on UPDATE when status changes
  IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    old_idx := array_position(status_order, OLD.status);
    new_idx := array_position(status_order, NEW.status);

    -- No backward movement
    IF new_idx < old_idx THEN
      RAISE EXCEPTION 'Backward status transitions are not allowed.';
    END IF;

    -- Only one step at a time
    IF new_idx > old_idx + 1 THEN
      RAISE EXCEPTION 'Can only move one step at a time.';
    END IF;

    -- Get user role in project
    SELECT role INTO user_role
    FROM project_members
    WHERE project_id = NEW.project_id
      AND user_id = auth.uid();

    IF user_role IS NULL THEN
      RAISE EXCEPTION 'User is not a member of this project.';
    END IF;

    -- in_progress -> in_review: developer or scrum_master
    IF OLD.status = 'in_progress' AND NEW.status = 'in_review' THEN
      IF user_role NOT IN ('developer', 'scrum_master') THEN
        RAISE EXCEPTION 'Only developers or scrum masters can move to review.';
      END IF;
    END IF;

    -- in_review -> done: only scrum_master
    IF OLD.status = 'in_review' AND NEW.status = 'done' THEN
      IF user_role != 'scrum_master' THEN
        RAISE EXCEPTION 'Only scrum masters can move tasks to done.';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_status_transition ON tasks;
CREATE TRIGGER check_status_transition
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION validate_status_transition();

-- ================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- ================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Helper functions for project_members membership checks
CREATE OR REPLACE FUNCTION public.is_project_member(project_uuid UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET row_security = off
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM project_members
    WHERE project_id = project_uuid
      AND user_id = auth.uid()
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_project_scrum_master(project_uuid UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET row_security = off
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM project_members
    WHERE project_id = project_uuid
      AND user_id = auth.uid()
      AND role = 'scrum_master'
  );
END;
$$;

-- PROFILES policies
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- PROJECTS policies
DROP POLICY IF EXISTS "Members can view their projects" ON projects;
CREATE POLICY "Members can view their projects"
  ON projects FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Authenticated users can create projects" ON projects;
CREATE POLICY "Authenticated users can create projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "Scrum masters can update projects" ON projects;
CREATE POLICY "Scrum masters can update projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT project_id FROM project_members
      WHERE user_id = auth.uid() AND role = 'scrum_master'
    )
  );

DROP POLICY IF EXISTS "Creator or scrum master can delete projects" ON projects;
CREATE POLICY "Creator or scrum master can delete projects"
  ON projects FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid() OR
    id IN (
      SELECT project_id FROM project_members
      WHERE user_id = auth.uid() AND role = 'scrum_master'
    )
  );

-- PROJECT MEMBERS policies
DROP POLICY IF EXISTS "Members can view project members" ON project_members;
CREATE POLICY "Members can view project members"
  ON project_members FOR SELECT
  TO authenticated
  USING (is_project_member(project_id));

DROP POLICY IF EXISTS "Scrum masters can manage members" ON project_members;
CREATE POLICY "Scrum masters can manage members"
  ON project_members FOR INSERT
  TO authenticated
  WITH CHECK (
    is_project_scrum_master(project_id)
    OR (
      user_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM projects
        WHERE id = project_members.project_id
          AND created_by = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Scrum masters can update members" ON project_members;
CREATE POLICY "Scrum masters can update members"
  ON project_members FOR UPDATE
  TO authenticated
  USING (
    project_id IN (
      SELECT project_id FROM project_members
      WHERE user_id = auth.uid() AND role = 'scrum_master'
    )
  );

DROP POLICY IF EXISTS "Scrum masters can remove members" ON project_members;
CREATE POLICY "Scrum masters can remove members"
  ON project_members FOR DELETE
  TO authenticated
  USING (
    project_id IN (
      SELECT project_id FROM project_members
      WHERE user_id = auth.uid() AND role = 'scrum_master'
    )
  );

-- TASKS policies
DROP POLICY IF EXISTS "Members can view project tasks" ON tasks;
CREATE POLICY "Members can view project tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Members can create tasks" ON tasks;
CREATE POLICY "Members can create tasks"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    project_id IN (
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

DROP POLICY IF EXISTS "Members can update tasks" ON tasks;
CREATE POLICY "Members can update tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (
    project_id IN (
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Scrum masters can delete any task" ON tasks;
CREATE POLICY "Scrum masters can delete any task"
  ON tasks FOR DELETE
  TO authenticated
  USING (
    project_id IN (
      SELECT project_id FROM project_members
      WHERE user_id = auth.uid() AND role = 'scrum_master'
    )
  );
