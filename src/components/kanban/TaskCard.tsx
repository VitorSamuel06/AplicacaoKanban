import { useDraggable } from '@dnd-kit/core';
import { Task, PRIORITY_LABELS, PRIORITY_COLORS } from '@/types';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import { Calendar, GripVertical, Pencil, Trash2 } from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  canDelete: boolean;
}

export default function TaskCard({ task, onEdit, onDelete, canDelete }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 50,
      }
    : undefined;

  const deadlineDate = task.deadline ? new Date(task.deadline) : null;
  const isOverdue = deadlineDate ? isPast(deadlineDate) && !isToday(deadlineDate) && task.status !== 'done' : false;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group bg-card border border-border rounded-lg p-3 shadow-sm hover:shadow-md transition-all duration-200 ${
        isDragging ? 'opacity-50 rotate-2 scale-105' : ''
      }`}
    >
      <div className="flex items-start gap-2">
        {/* Drag handle */}
        <button
          {...listeners}
          {...attributes}
          className="mt-0.5 p-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-secondary cursor-grab active:cursor-grabbing touch-none"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>

        <div className="flex-1 min-w-0">
          {/* Title */}
          <h4 className="text-sm font-medium text-foreground leading-snug mb-1.5 line-clamp-2">
            {task.title}
          </h4>

          {/* Description preview */}
          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
              {task.description}
            </p>
          )}

          {/* Meta row */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={PRIORITY_COLORS[task.priority]}>
              {PRIORITY_LABELS[task.priority]}
            </Badge>

            {deadlineDate && (
              <span
                className={`inline-flex items-center gap-1 text-xs ${
                  isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground'
                }`}
              >
                <Calendar className="h-3 w-3" />
                {format(deadlineDate, 'dd MMM', { locale: ptBR })}
              </span>
            )}
          </div>
        </div>

        {/* Actions + Assignee */}
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(task)}
              className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <Pencil className="h-3 w-3" />
            </button>
            {canDelete && (
              <button
                onClick={() => onDelete(task.id)}
                className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive cursor-pointer"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
          {task.assignee && (
            <Avatar name={task.assignee.full_name} size="sm" />
          )}
        </div>
      </div>
    </div>
  );
}
