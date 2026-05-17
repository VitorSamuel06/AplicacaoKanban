import { useState, useEffect } from 'react';
import { useProject } from '@/contexts/ProjectContext';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import type { Task, TaskPriority } from '@/types';
import { Plus, Save } from 'lucide-react';

interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  editTask?: Task | null;
}

export default function TaskForm({ isOpen, onClose, editTask }: TaskFormProps) {
  const { createTask, updateTask, members } = useProject();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [assigneeId, setAssigneeId] = useState('');
  const [deadline, setDeadline] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editTask) {
      setTitle(editTask.title);
      setDescription(editTask.description || '');
      setPriority(editTask.priority);
      setAssigneeId(editTask.assignee_id || '');
      setDeadline(editTask.deadline ? editTask.deadline.slice(0, 10) : '');
    } else {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setAssigneeId('');
      setDeadline('');
    }
  }, [editTask, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (editTask) {
      await updateTask(editTask.id, {
        title,
        description: description || null,
        priority,
        assignee_id: assigneeId || null,
        deadline: deadline || null,
      });
    } else {
      await createTask(
        title,
        description,
        priority,
        assigneeId || null,
        deadline || null
      );
    }

    setLoading(false);
    onClose();
  };

  const memberOptions = [
    { value: '', label: 'Sem responsável' },
    ...members.map((m) => ({
      value: m.user_id,
      label: m.profile?.full_name || m.user_id,
    })),
  ];

  const priorityOptions = [
    { value: 'low', label: '🟢 Baixa' },
    { value: 'medium', label: '🟡 Média' },
    { value: 'high', label: '🔴 Alta' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editTask ? 'Editar Tarefa' : 'Nova Tarefa'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Título"
          id="task-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título da tarefa"
          required
        />

        <div>
          <label htmlFor="task-desc" className="block text-sm font-medium text-foreground mb-1.5">
            Descrição
          </label>
          <textarea
            id="task-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descreva a tarefa..."
            rows={3}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Prioridade"
            id="task-priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
            options={priorityOptions}
          />

          <Select
            label="Responsável"
            id="task-assignee"
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
            options={memberOptions}
          />
        </div>

        <Input
          label="Prazo"
          id="task-deadline"
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : editTask ? (
              <>
                <Save className="h-4 w-4" />
                Salvar
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Criar
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
