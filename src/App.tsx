import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ProjectProvider } from '@/contexts/ProjectContext';
import AuthPage from '@/components/auth/AuthPage';
import Header from '@/components/layout/Header';
import ProjectList from '@/components/projects/ProjectList';
import KanbanBoard from '@/components/kanban/KanbanBoard';

function AppContent() {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center animate-fadeIn">
          <div className="h-10 w-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <ProjectProvider>
      <div className="min-h-screen flex flex-col bg-background">
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <div className="flex-1 flex min-h-0 relative">
          {/* Mobile sidebar overlay */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/40 z-30 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Sidebar */}
          <aside
            className={`
              w-64 border-r border-border bg-card shrink-0 flex flex-col
              fixed md:relative inset-y-0 left-0 z-40 top-14 md:top-0
              transition-transform duration-300 md:translate-x-0
              ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
              md:flex
            `}
          >
            <ProjectList />
          </aside>

          {/* Main content */}
          <main className="flex-1 flex flex-col min-h-0 min-w-0">
            <KanbanBoard />
          </main>
        </div>
      </div>
    </ProjectProvider>
  );
}

export default function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'var(--card)',
            color: 'var(--card-foreground)',
            border: '1px solid var(--border)',
            borderRadius: '0.75rem',
            fontSize: '0.875rem',
            fontFamily: 'var(--font-sans)',
          },
          success: {
            iconTheme: {
              primary: 'oklch(0.5854 0.2041 277.1173)',
              secondary: 'white',
            },
          },
          error: {
            iconTheme: {
              primary: 'oklch(0.6368 0.2078 25.3313)',
              secondary: 'white',
            },
          },
        }}
      />
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </>
  );
}
