import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import type { Project, ProjectMember, Task, TaskStatus, MemberRole, Profile } from '@/types';
import toast from 'react-hot-toast';

interface ProjectContextType {
  projects: Project[];
  currentProject: Project | null;
  members: ProjectMember[];
  tasks: Task[];
  userRole: MemberRole | null;
  loading: boolean;
  selectProject: (project: Project) => void;
  createProject: (name: string, description: string, wipLimit: number) => Promise<void>;
  updateProject: (id: string, data: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  addMember: (email: string, role: MemberRole) => Promise<void>;
  removeMember: (userId: string) => Promise<void>;
  updateMemberRole: (userId: string, role: MemberRole) => Promise<void>;
  createTask: (title: string, description: string, priority: string, assigneeId: string | null, deadline: string | null) => Promise<void>;
  updateTask: (id: string, data: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  moveTask: (taskId: string, newStatus: TaskStatus) => Promise<void>;
  refreshTasks: () => Promise<void>;
  refreshMembers: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [userRole, setUserRole] = useState<MemberRole | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchProjects = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: memberRows } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('user_id', user.id);

      if (memberRows && memberRows.length > 0) {
        const projectIds = memberRows.map((m) => m.project_id);
        const { data: projectData } = await supabase
          .from('projects')
          .select('*')
          .in('id', projectIds)
          .order('created_at', { ascending: false });

        setProjects(projectData || []);
      } else {
        setProjects([]);
      }
    } catch {
      toast.error('Erro ao carregar projetos');
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const refreshMembers = useCallback(async () => {
    if (!currentProject) return;
    const { data } = await supabase
      .from('project_members')
      .select('*')
      .eq('project_id', currentProject.id);

    if (data) {
      const userIds = data.map((m) => m.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);

      const membersWithProfiles = data.map((m) => ({
        ...m,
        profile: profiles?.find((p: Profile) => p.id === m.user_id),
      }));
      setMembers(membersWithProfiles);

      if (user) {
        const myMembership = data.find((m) => m.user_id === user.id);
        setUserRole(myMembership ? (myMembership.role as MemberRole) : null);
      }
    }
  }, [currentProject, user]);

  const refreshTasks = useCallback(async () => {
    if (!currentProject) return;
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', currentProject.id)
      .order('created_at', { ascending: false });

    if (data) {
      const assigneeIds = data
        .map((t) => t.assignee_id)
        .filter((id): id is string => id !== null);

      let profiles: Profile[] = [];
      if (assigneeIds.length > 0) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .in('id', assigneeIds);
        profiles = profileData || [];
      }

      const tasksWithAssignees = data.map((t) => ({
        ...t,
        assignee: profiles.find((p) => p.id === t.assignee_id),
      }));
      setTasks(tasksWithAssignees);
    }
  }, [currentProject]);

  useEffect(() => {
    if (currentProject) {
      refreshMembers();
      refreshTasks();
    }
  }, [currentProject, refreshMembers, refreshTasks]);

  const selectProject = (project: Project) => {
    setCurrentProject(project);
    setMembers([]);
    setTasks([]);
    setUserRole(null);
  };

  const createProject = async (name: string, description: string, wipLimit: number) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('projects')
      .insert({
        name,
        description: description || null,
        wip_limit: wipLimit,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      toast.error('Erro ao criar projeto: ' + error.message);
      return;
    }

    await supabase.from('project_members').insert({
      project_id: data.id,
      user_id: user.id,
      role: 'scrum_master',
    });

    toast.success('Projeto criado com sucesso!');
    await fetchProjects();
    setCurrentProject(data);
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    const { error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id);

    if (error) {
      toast.error('Erro ao atualizar projeto: ' + error.message);
      return;
    }

    toast.success('Projeto atualizado!');
    await fetchProjects();
    if (currentProject?.id === id) {
      setCurrentProject((prev) => (prev ? { ...prev, ...updates } : null));
    }
  };

  const deleteProject = async (id: string) => {
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) {
      toast.error('Erro ao excluir projeto: ' + error.message);
      return;
    }

    toast.success('Projeto excluído!');
    if (currentProject?.id === id) {
      setCurrentProject(null);
      setMembers([]);
      setTasks([]);
    }
    await fetchProjects();
  };

  const addMember = async (email: string, role: MemberRole) => {
    if (!currentProject) return;

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id')
      .ilike('full_name', `%${email}%`);

    let userId: string | null = null;

    if (profiles && profiles.length > 0) {
      userId = profiles[0].id;
    } else {
      const { data: authUsers } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', email);

      if (authUsers && authUsers.length > 0) {
        userId = authUsers[0].id;
      }
    }

    if (!userId) {
      // Try to find by looking up email in auth - use RPC or direct query
      // For simplicity, we'll search profiles by stored email or name
      toast.error('Usuário não encontrado. Verifique o nome ou ID.');
      return;
    }

    const existing = members.find((m) => m.user_id === userId);
    if (existing) {
      toast.error('Este usuário já é membro do projeto.');
      return;
    }

    const { error } = await supabase.from('project_members').insert({
      project_id: currentProject.id,
      user_id: userId,
      role,
    });

    if (error) {
      toast.error('Erro ao adicionar membro: ' + error.message);
      return;
    }

    toast.success('Membro adicionado!');
    await refreshMembers();
  };

  const removeMember = async (userId: string) => {
    if (!currentProject) return;

    const { error } = await supabase
      .from('project_members')
      .delete()
      .eq('project_id', currentProject.id)
      .eq('user_id', userId);

    if (error) {
      toast.error('Erro ao remover membro: ' + error.message);
      return;
    }

    toast.success('Membro removido!');
    await refreshMembers();
  };

  const updateMemberRole = async (userId: string, role: MemberRole) => {
    if (!currentProject) return;

    const { error } = await supabase
      .from('project_members')
      .update({ role })
      .eq('project_id', currentProject.id)
      .eq('user_id', userId);

    if (error) {
      toast.error('Erro ao atualizar papel: ' + error.message);
      return;
    }

    toast.success('Papel atualizado!');
    await refreshMembers();
  };

  const createTask = async (
    title: string,
    description: string,
    priority: string,
    assigneeId: string | null,
    deadline: string | null
  ) => {
    if (!currentProject || !user) return;

    const { error } = await supabase.from('tasks').insert({
      project_id: currentProject.id,
      title,
      description: description || null,
      status: 'backlog',
      priority,
      assignee_id: assigneeId,
      created_by: user.id,
      deadline: deadline || null,
    });

    if (error) {
      toast.error('Erro ao criar tarefa: ' + error.message);
      return;
    }

    toast.success('Tarefa criada!');
    await refreshTasks();
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    const { error } = await supabase
      .from('tasks')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      toast.error('Erro ao atualizar tarefa: ' + error.message);
      return;
    }

    toast.success('Tarefa atualizada!');
    await refreshTasks();
  };

  const deleteTask = async (id: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) {
      toast.error('Erro ao excluir tarefa: ' + error.message);
      return;
    }

    toast.success('Tarefa excluída!');
    await refreshTasks();
  };

  const moveTask = async (taskId: string, newStatus: TaskStatus) => {
    if (!currentProject || !user) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const currentStatus = task.status;

    // Validate transition order
    const statusOrder: TaskStatus[] = ['backlog', 'in_progress', 'in_review', 'done'];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const newIndex = statusOrder.indexOf(newStatus);

    if (newIndex <= currentIndex) {
      toast.error('Não é permitido movimentação reversa.');
      return;
    }

    if (newIndex > currentIndex + 1) {
      toast.error('Mova a tarefa apenas uma etapa por vez.');
      return;
    }

    // Check role permissions
    if (newStatus === 'in_review' && userRole === 'developer') {
      // Developer can move to in_review - OK
    } else if (newStatus === 'in_review' && userRole === 'scrum_master') {
      // Scrum Master can do any transition - OK
    } else if (newStatus === 'in_review') {
      toast.error('Apenas Desenvolvedores ou Scrum Masters podem mover para "Em Revisão".');
      return;
    }

    if (newStatus === 'done' && userRole !== 'scrum_master') {
      toast.error('Apenas o Scrum Master pode mover tarefas para "Concluído".');
      return;
    }

    // Check WIP limit
    if (newStatus === 'in_progress') {
      const inProgressCount = tasks.filter((t) => t.status === 'in_progress').length;
      if (inProgressCount >= currentProject.wip_limit) {
        toast.error(
          `Limite de WIP atingido! Máximo de ${currentProject.wip_limit} tarefas em andamento.`
        );
        return;
      }
    }

    // Perform the update
    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', taskId);

    if (error) {
      toast.error('Erro ao mover tarefa: ' + error.message);
      return;
    }

    await refreshTasks();
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        currentProject,
        members,
        tasks,
        userRole,
        loading,
        selectProject,
        createProject,
        updateProject,
        deleteProject,
        addMember,
        removeMember,
        updateMemberRole,
        createTask,
        updateTask,
        deleteTask,
        moveTask,
        refreshTasks,
        refreshMembers,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}
