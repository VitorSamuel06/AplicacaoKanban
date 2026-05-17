import { useState } from 'react';
import { useProject } from '@/contexts/ProjectContext';
import { useAuth } from '@/contexts/AuthContext';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import { ROLE_LABELS } from '@/types';
import type { MemberRole } from '@/types';
import { Plus, Trash2, Shield, Code, UserPlus } from 'lucide-react';

interface MembersPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MembersPanel({ isOpen, onClose }: MembersPanelProps) {
  const { members, userRole, addMember, removeMember, updateMemberRole, currentProject } = useProject();
  const { user } = useAuth();
  const [showAdd, setShowAdd] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newRole, setNewRole] = useState<MemberRole>('developer');
  const [adding, setAdding] = useState(false);

  const isScrumMaster = userRole === 'scrum_master';

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    await addMember(searchTerm, newRole);
    setAdding(false);
    setSearchTerm('');
    setShowAdd(false);
  };

  const handleRemove = async (userId: string, name: string) => {
    if (confirm(`Remover ${name} do projeto?`)) {
      await removeMember(userId);
    }
  };

  const handleRoleChange = async (userId: string, role: MemberRole) => {
    await updateMemberRole(userId, role);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Membros do Projeto" size="lg">
      <div className="space-y-4">
        {/* Project info */}
        {currentProject && (
          <div className="bg-muted/50 rounded-lg p-3 text-sm">
            <span className="text-muted-foreground">Projeto: </span>
            <span className="font-medium">{currentProject.name}</span>
            <span className="text-muted-foreground ml-4">WIP Limit: </span>
            <span className="font-medium">{currentProject.wip_limit}</span>
          </div>
        )}

        {/* Add member button */}
        {isScrumMaster && (
          <div>
            {!showAdd ? (
              <Button variant="outline" size="sm" onClick={() => setShowAdd(true)}>
                <UserPlus className="h-4 w-4" />
                Adicionar membro
              </Button>
            ) : (
              <form onSubmit={handleAdd} className="bg-muted/30 rounded-lg p-4 space-y-3 border border-border animate-fadeIn">
                <Input
                  label="Nome ou ID do usuário"
                  id="member-search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Nome do usuário"
                  required
                />
                <Select
                  label="Papel"
                  id="member-role"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as MemberRole)}
                  options={[
                    { value: 'developer', label: '👨‍💻 Desenvolvedor' },
                    { value: 'scrum_master', label: '🛡️ Scrum Master' },
                  ]}
                />
                <div className="flex gap-2">
                  <Button type="submit" size="sm" disabled={adding}>
                    <Plus className="h-3 w-3" />
                    Adicionar
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowAdd(false)}>
                    Cancelar
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Members list */}
        <div className="space-y-2">
          {members.map((member) => {
            const name = member.profile?.full_name || member.user_id;
            const isCurrentUser = member.user_id === user?.id;

            return (
              <div
                key={member.user_id}
                className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors"
              >
                <Avatar name={name} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{name}</span>
                    {isCurrentUser && (
                      <Badge className="bg-primary/10 text-primary text-[10px]">Você</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    {member.role === 'scrum_master' ? (
                      <Shield className="h-3 w-3 text-amber-500" />
                    ) : (
                      <Code className="h-3 w-3 text-blue-500" />
                    )}
                    <span className="text-xs text-muted-foreground">
                      {ROLE_LABELS[member.role as MemberRole]}
                    </span>
                  </div>
                </div>

                {isScrumMaster && !isCurrentUser && (
                  <div className="flex items-center gap-2">
                    <select
                      value={member.role}
                      onChange={(e) => handleRoleChange(member.user_id, e.target.value as MemberRole)}
                      className="text-xs rounded-md border border-input bg-background px-2 py-1 cursor-pointer"
                    >
                      <option value="developer">Desenvolvedor</option>
                      <option value="scrum_master">Scrum Master</option>
                    </select>
                    <button
                      onClick={() => handleRemove(member.user_id, name)}
                      className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {members.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Nenhum membro encontrado.
          </div>
        )}
      </div>
    </Modal>
  );
}
