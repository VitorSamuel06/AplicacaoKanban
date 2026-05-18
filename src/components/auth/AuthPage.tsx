import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Logo from '@/components/ui/Logo';
import { LogIn, UserPlus } from 'lucide-react';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (isLogin) {
      const result = await signIn(email, password);
      if (result.error) setError(result.error);
    } else {
      if (!fullName.trim()) {
        setError('Nome completo é obrigatório');
        setLoading(false);
        return;
      }
      const result = await signUp(email, password, fullName);
      if (result.error) {
        setError(result.error);
      } else {
        setError('');
        setIsLogin(true);
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.16),_transparent_42%),linear-gradient(180deg,#f8fafc,#eff6ff)] p-4">
      <div className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-white/10 bg-white/95 shadow-2xl shadow-slate-900/10 backdrop-blur-xl animate-fadeIn">
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-br from-primary/20 via-transparent to-transparent pointer-events-none" />
        <div className="relative p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-[1.75rem] bg-primary/10 border border-primary/15 shadow-sm shadow-primary/10 mb-4">
              <Logo className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">ScrumFlow</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Kanban + Scrum para sua equipe
            </p>
          </div>

          <div className="bg-card border border-border/80 rounded-[1.75rem] p-6 shadow-sm shadow-slate-900/5">
          <div className="flex mb-6 bg-secondary rounded-full p-1">
            <button
              type="button"
              onClick={() => { setIsLogin(true); setError(''); }}
              className={`flex-1 rounded-[1rem] py-3 text-sm font-semibold transition-all ${
                isLogin
                  ? 'bg-white text-primary shadow-sm shadow-primary/10'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => { setIsLogin(false); setError(''); }}
              className={`flex-1 rounded-[1rem] py-3 text-sm font-semibold transition-all ${
                !isLogin
                  ? 'bg-white text-primary shadow-sm shadow-primary/10'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Cadastrar
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <Input
                label="Nome completo"
                id="fullName"
                type="text"
                placeholder="Seu nome"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required={!isLogin}
              />
            )}

            <Input
              label="E-mail"
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Senha"
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error && (
              <div className="bg-destructive/10 text-destructive text-sm rounded-lg p-3">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? (
                <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : isLogin ? (
                <>
                  <LogIn className="h-4 w-4" />
                  Entrar
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Criar conta
                </>
              )}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Gerencie seus projetos com agilidade e eficiência.
        </p>
      </div>
    </div>
  </div>
  );
}
