import { useState, useMemo } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useProject } from '@/contexts/ProjectContext';
import KanbanColumn from './KanbanColumn';
import TaskCard from './TaskCard';
import TaskForm from './TaskForm';
import MembersPanel from '@/components/projects/MembersPanel';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { ROLE_LABELS } from '@/types';
import type { Task, TaskStatus } from '@/types';
import { Plus, Users, RefreshCw, Shield, Code, BarChart3 } from 'lucide-react';

export default function KanbanBoard() {
  const { currentProject, tasks, userRole, moveTask, deleteTask, members, refreshTasks } = useProject();
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showMembers, setShowMembers] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const columns: TaskStatus[] = ['backlog', 'in_progress', 'in_review', 'done'];

  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, Task[]> = {
      backlog: [],
      in_progress: [],
      in_review: [],
      done: [],
    };
    tasks.forEach((task) => {
      grouped[task.status].push(task);
    });
    return grouped;
  }, [tasks]);

  const handleDragStart = (event: DragStartEvent) => {
    const task = event.active.data.current?.task as Task;
    setActiveTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus;
    const task = tasks.find((t) => t.id === taskId);

    if (task && task.status !== newStatus) {
      moveTask(taskId, newStatus);
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowTaskForm(true);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (confirm('Excluir esta tarefa?')) {
      await deleteTask(taskId);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshTasks();
    setRefreshing(false);
  };

  const canDelete = userRole === 'scrum_master';

  if (!currentProject) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center animate-fadeIn">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="h-10 w-10 text-primary/60" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Selecione um projeto</h2>
          <p className="text-muted-foreground text-sm max-w-sm">
            Escolha um projeto na barra lateral ou crie um novo para começar a gerenciar suas tarefas.
          </p>
        </div>
      </div>
    );
  }

  // Stats
  const totalTasks = tasks.length;
  const doneTasks = tasksByStatus.done.length;
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Toolbar */}
      <div className="border-b border-border bg-card/50 px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div>
              <h1 className="text-lg font-semibold text-foreground truncate">
                {currentProject.name}
              </h1>
              {currentProject.description && (
                <p className="text-xs text-muted-foreground truncate max-w-md">
                  {currentProject.description}
                </p>
              )}
            </div>
            <Badge variant="outline" className="shrink-0">
              {userRole === 'scrum_master' ? (
                <><Shield className="h-3 w-3 text-amber-500" /> {ROLE_LABELS[userRole]}</>
              ) : userRole === 'developer' ? (
                <><Code className="h-3 w-3 text-blue-500" /> {ROLE_LABELS[userRole]}</>
              ) : (
                'Membro'
              )}
            </Badge>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Progress */}
            <div className="hidden md:flex items-center gap-2 mr-2">
              <div className="w-24 h-1.5 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">{progress}%</span>
            </div>

            <Button variant="ghost" size="icon" onClick={handleRefresh}>
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>

            <Button variant="outline" size="sm" onClick={() => setShowMembers(true)}>
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Membros</span>
              <span className="bg-primary/10 text-primary rounded-full px-1.5 text-xs">
                {members.length}
              </span>
            </Button>

            <Button
              size="sm"
              onClick={() => {
                setEditingTask(null);
                setShowTaskForm(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Nova Tarefa
            </Button>
          </div>
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto p-4">
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-4 gap-4 min-w-[900px] h-full">
            {columns.map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                tasks={tasksByStatus[status]}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
                canDelete={canDelete}
                wipLimit={status === 'in_progress' ? currentProject.wip_limit : undefined}
                showWipWarning={status === 'in_progress'}
              />
            ))}
          </div>

          <DragOverlay>
            {activeTask ? (
              <div className="w-72 opacity-90 rotate-3">
                <TaskCard
                  task={activeTask}
                  onEdit={() => {}}
                  onDelete={() => {}}
                  canDelete={false}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Task Form */}
      <TaskForm
        isOpen={showTaskForm}
        onClose={() => {
          setShowTaskForm(false);
          setEditingTask(null);
        }}
        editTask={editingTask}
      />

      {/* Members Panel */}
      <MembersPanel
        isOpen={showMembers}
        onClose={() => setShowMembers(false)}
      />
    </div>
  );
}
