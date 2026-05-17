# ScrumFlow - Sistema Kanban + Scrum com Supabase

## 🚀 Configuração

### 1. Supabase Setup

1. Crie um projeto no [Supabase](https://supabase.com)
2. Vá em **SQL Editor** e execute o conteúdo do arquivo `supabase/schema.sql`
3. Copie a **URL** e **anon key** do projeto (Settings > API)

### 2. Variáveis de Ambiente

Edite o arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key-aqui
```

### 3. Configuração de Autenticação

No Supabase Dashboard:
1. Vá em **Authentication > Providers**
2. Habilite **Email** (já vem habilitado por padrão)
3. Opcional: desabilite "Confirm email" para desenvolvimento

### 4. Executar

```bash
npm install
npm run dev
```

## 📋 Funcionalidades

- **Multi-projetos**: cada usuário vê apenas os projetos em que é membro
- **Quadro Kanban**: Backlog → Em Andamento → Em Revisão → Concluído
- **Drag & Drop**: arraste tarefas entre colunas
- **Limite WIP**: controle de tarefas simultâneas em "Em Andamento"
- **Papéis**: Scrum Master e Desenvolvedor com permissões diferentes
- **Gestão de Membros**: adicione/remova membros, altere papéis
- **Tema claro/escuro**: suporte a dark mode
- **RLS**: segurança a nível de linha no banco de dados
- **Triggers SQL**: validação de transições e WIP no backend

## 🔐 Papéis

| Ação | Scrum Master | Desenvolvedor |
|------|:---:|:---:|
| Ver quadro/backlog | ✅ | ✅ |
| Criar tarefas no Backlog | ✅ | ✅ |
| Mover Backlog → Em Andamento | ✅ | ✅ |
| Mover Em Andamento → Em Revisão | ✅ | ✅ |
| Mover Em Revisão → Concluído | ✅ | ❌ |
| Excluir tarefas | ✅ | ❌ |
| Gerenciar membros | ✅ | ❌ |
| Configurar WIP | ✅ | ❌ |

## 🚀 Publicar no GitHub

1. Instale o Git: https://git-scm.com/downloads
2. Abra o terminal na pasta do projeto.
3. Inicialize o repositório (se ainda não estiver):

```powershell
git init
```

4. Adicione os arquivos e faça commit:

```powershell
git add .
git commit -m "Initial commit"
```

5. Crie um repositório no GitHub e conecte o remoto:

```powershell
git remote add origin https://github.com/SEU-USUARIO/SEU-REPO.git
git branch -M main
git push -u origin main
```

6. Quando fizer alterações novas:

```powershell
git add .
git commit -m "Atualiza projeto"
git push
```
