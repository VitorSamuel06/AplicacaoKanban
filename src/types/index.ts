export type TaskStatus = 'backlog' | 'in_progress' | 'in_review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';
export type MemberRole = 'scrum_master' | 'developer';

export interface Profile {
  id: string;
  full_name: string;
  email?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  wip_limit: number;
  created_at: string;
  created_by: string;
}

export interface ProjectMember {
  project_id: string;
  user_id: string;
  role: MemberRole;
  joined_at: string;
  profile?: Profile;
}

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_id: string | null;
  created_by: string;
  deadline: string | null;
  created_at: string;
  updated_at: string;
  assignee?: Profile;
}

export const STATUS_LABELS: Record<TaskStatus, string> = {
  backlog: 'Backlog',
  in_progress: 'Em Andamento',
  in_review: 'Em Revisão',
  done: 'Concluído',
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
};

export const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  high: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

export const ROLE_LABELS: Record<MemberRole, string> = {
  scrum_master: 'Scrum Master',
  developer: 'Desenvolvedor',
};
