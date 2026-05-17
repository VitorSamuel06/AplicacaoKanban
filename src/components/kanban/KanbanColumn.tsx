import { useDroppable } from '@dnd-kit/core';
import { Task, TaskStatus, STATUS_LABELS } from '@/types';
import TaskCard from './TaskCard';
import { cn } from '@/utils/cn';
import { AlertTriangle } from 'lucide-react';

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  canDelete: boolean;
  wipLimit?: number;
  showWipWarning?: boolean;
}

const COLUMN_STYLES: Record<TaskStatus, { headerBg: string; dot: string }> = {
  backlog: {
    headerBg: 'bg-slate-100 dark:bg-slate-800',
    dot: 'bg-slate-400',
  },
  in_progress: {
    headerBg: 'bg-blue-50 dark:bg-blue-950/50',
    dot: 'bg-blue-500',
  },
  in_review: {
    headerBg: 'bg-amber-50 dark:bg-amber-950/50',
    dot: 'bg-amber-500',
  },
  done: {
    headerBg: 'bg-emerald-50 dark:bg-emerald-950/50',
    dot: 'bg-emerald-500',
  },
};

export default function KanbanColumn({
  status,
  tasks,
  onEditTask,
  onDeleteTask,
  canDelete,
  wipLimit,
  showWipWarning,
}: KanbanColumnProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: status,
  });

  const style = COLUMN_STYLES[status];
  const isAtLimit = status === 'in_progress' && wipLimit && tasks.length >= wipLimit;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col rounded-xl border border-border bg-muted/30 min-h-[400px] transition-all duration-200',
        isOver && 'ring-2 ring-primary/50 bg-primary/5'
      )}
    >
      {/* Column header */}
      <div className={cn('rounded-t-xl px-4 py-3 border-b border-border', style.headerBg)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn('h-2.5 w-2.5 rounded-full', style.dot)} />
            <h3 className="text-sm font-semibold text-foreground">
              {STATUS_LABELS[status]}
            </h3>
            <span className="bg-background/80 text-muted-foreground text-xs font-medium rounded-full px-2 py-0.5">
              {tasks.length}
            </span>
          </div>

          {status === 'in_progress' && wipLimit && (
            <div
              className={cn(
                'flex items-center gap-1 text-xs font-medium rounded-full px-2 py-0.5',
                isAtLimit
                  ? 'bg-destructive/10 text-destructive'
                  : 'bg-background/80 text-muted-foreground'
              )}
            >
              {isAtLimit && <AlertTriangle className="h-3 w-3" />}
              WIP: {tasks.length}/{wipLimit}
            </div>
          )}
        </div>
        {showWipWarning && isAtLimit && (
          <p className="text-xs text-destructive mt-1.5 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Limite WIP atingido!
          </p>
        )}
      </div>

      {/* Cards */}
      <div className="flex-1 p-2 space-y-2 overflow-y-auto">
        {tasks.length === 0 ? (
          <div className="flex items-center justify-center h-24 text-xs text-muted-foreground/60">
            {isOver ? 'Solte aqui' : 'Sem tarefas'}
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
              canDelete={canDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}
