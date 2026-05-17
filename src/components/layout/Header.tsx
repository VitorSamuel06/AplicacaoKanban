import { useAuth } from '@/contexts/AuthContext';
import { useProject } from '@/contexts/ProjectContext';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import { Kanban, LogOut, Moon, Sun, ChevronDown, Menu } from 'lucide-react';
import { useState, useEffect } from 'react';

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  const { user, profile, signOut } = useAuth();
  const { currentProject } = useProject();
  const [dark, setDark] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
      document.documentElement.classList.add('dark');
      setDark(true);
    }
  }, []);

  const toggleTheme = () => {
    if (dark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
    setDark(!dark);
  };

  const displayName = profile?.full_name || user?.email || 'Usuário';

  return (
    <header className="h-14 border-b border-border bg-card/80 backdrop-blur-md flex items-center px-4 sticky top-0 z-40">
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <Button variant="ghost" size="icon" onClick={onToggleSidebar} className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        )}
        <div className="flex items-center gap-2 text-primary">
          <Kanban className="h-5 w-5" />
          <span className="font-bold text-lg tracking-tight">ScrumFlow</span>
        </div>
        {currentProject && (
          <>
            <span className="text-muted-foreground">/</span>
            <span className="font-medium text-sm text-foreground truncate max-w-[200px]">
              {currentProject.name}
            </span>
          </>
        )}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-secondary/80 transition-colors cursor-pointer"
          >
            <Avatar name={displayName} size="sm" />
            <span className="text-sm font-medium hidden sm:inline">{displayName}</span>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-lg shadow-lg z-50 animate-scaleIn">
                <div className="p-3 border-b border-border">
                  <p className="text-sm font-medium truncate">{displayName}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
                <div className="p-1">
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      signOut();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-md transition-colors cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                    Sair
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
