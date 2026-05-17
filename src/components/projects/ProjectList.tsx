import { useState } from 'react';
import { useProject } from '@/contexts/ProjectContext';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { Plus, FolderKanban, Settings, Trash2, Users, ChevronRight } from 'lucide-react';
import type { Project } from '@/types';

export default function ProjectList() {
  const {
    projects,
    currentProject,
    selectProject,
    createProject,
    updateProject,
    deleteProject,
    loading,
  } = useProject();

  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [wipLimit, setWipLimit] = useState(5);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createProject(name, description, wipLimit);
    setShowCreate(false);
    resetForm();
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;
    await updateProject(editingProject.id, { name, description, wip_limit: wipLimit });
    setShowEdit(false);
    resetForm();
  };

  const handleDelete = async (project: Project) => {
    if (confirm(`Tem certeza que deseja excluir o projeto "${project.name}"?`)) {
      await deleteProject(project.id);
    }
  };

  const openEdit = (project: Project) => {
    setEditingProject(project);
    setName(project.name);
    setDescription(project.description || '');
    setWipLimit(project.wip_limit);
    setShowEdit(true);
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setWipLimit(5);
    setEditingProject(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Projetos
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              resetForm();
              setShowCreate(true);
            }}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {projects.length === 0 ? (
          <div className="text-center py-8 px-4">
            <FolderKanban className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-3">Nenhum projeto ainda</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                resetForm();
                setShowCreate(true);
              }}
            >
              <Plus className="h-3 w-3" />
              Criar projeto
            </Button>
          </div>
        ) : (
          projects.map((project) => (
            <div
              key={project.id}
              className={`group flex items-center gap-2 rounded-lg px-3 py-2.5 cursor-pointer transition-all ${
                currentProject?.id === project.id
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'hover:bg-secondary/80 text-foreground border border-transparent'
              }`}
              onClick={() => selectProject(project)}
            >
              <FolderKanban className="h-4 w-4 shrink-0" />
              <span className="text-sm font-medium truncate flex-1">{project.name}</span>
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openEdit(project);
                  }}
                  className="p-1 rounded hover:bg-secondary cursor-pointer"
                >
                  <Settings className="h-3 w-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(project);
                  }}
                  className="p-1 rounded hover:bg-destructive/10 text-destructive cursor-pointer"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
              {currentProject?.id === project.id && (
                <ChevronRight className="h-3 w-3 shrink-0" />
              )}
            </div>
          ))
        )}
      </div>

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Novo Projeto">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Nome do projeto"
            id="project-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Meu projeto ágil"
            required
          />
          <div>
            <label htmlFor="project-desc" className="block text-sm font-medium text-foreground mb-1.5">
              Descrição (opcional)
            </label>
            <textarea
              id="project-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o projeto..."
              rows={3}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
            />
          </div>
          <Input
            label="Limite WIP (Em Andamento)"
            id="project-wip"
            type="number"
            min={1}
            max={50}
            value={wipLimit}
            onChange={(e) => setWipLimit(parseInt(e.target.value) || 5)}
          />
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-accent/30 rounded-lg p-3">
            <Users className="h-4 w-4 shrink-0" />
            <span>Você será adicionado como Scrum Master automaticamente.</span>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              <Plus className="h-4 w-4" />
              Criar Projeto
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Editar Projeto">
        <form onSubmit={handleEdit} className="space-y-4">
          <Input
            label="Nome do projeto"
            id="edit-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <div>
            <label htmlFor="edit-desc" className="block text-sm font-medium text-foreground mb-1.5">
              Descrição
            </label>
            <textarea
              id="edit-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
            />
          </div>
          <Input
            label="Limite WIP"
            id="edit-wip"
            type="number"
            min={1}
            max={50}
            value={wipLimit}
            onChange={(e) => setWipLimit(parseInt(e.target.value) || 5)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setShowEdit(false)}>
              Cancelar
            </Button>
            <Button type="submit">Salvar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
