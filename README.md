# NT Automação Hub

Sistema web de gestão de automações e base de conhecimento para o grupo Nova Trindade SSC.

---

## Stack

- **Next.js 14** (App Router, TypeScript)
- **Supabase** (PostgreSQL + Auth)
- **Tailwind CSS**

---

## Setup — passo a passo

### 1. Criar projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um novo projeto
2. Aguarde o provisionamento completo do banco de dados

### 2. Configurar o banco de dados

1. No painel do Supabase, acesse **SQL Editor**
2. Abra o arquivo `supabase/schema.sql` deste repositório
3. Cole o conteúdo no editor e clique em **Run** — isso criará todas as tabelas, funções, triggers e políticas RLS

### 3. Popular dados iniciais (opcional, apenas para desenvolvimento)

> ⚠️ O `seed.sql` insere perfis com UUIDs fictícios. Os usuários correspondentes precisam existir em `auth.users` primeiro.
> Para criar o usuário admin real:
> - Supabase Dashboard → **Authentication → Users → Invite user** (ou via tela `/admin/users/new` do sistema)
> - Após criar, atualize o UUID no `seed.sql` se desejar usar os dados de exemplo

Se quiser os artigos e chamados de exemplo, abra `supabase/seed.sql` no SQL Editor e rode **após** criar os usuários e substituir os UUIDs pelas IDs reais.

### 4. Configurar variáveis de ambiente

```bash
cp .env.local.example .env.local
```

Edite `.env.local` com os valores do seu projeto Supabase:

```
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

Você encontra esses valores em **Project Settings → API** no painel do Supabase.

### 5. Instalar dependências e rodar

```bash
npm install
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

---

## Criar o primeiro usuário admin

Como não existe auto-cadastro, o primeiro usuário admin deve ser criado diretamente no Supabase:

1. Supabase Dashboard → **Authentication → Users → Add user**
2. Preencha e-mail e senha
3. No **SQL Editor**, insira o perfil manualmente:

```sql
INSERT INTO public.profiles (id, full_name, email, role, company, active)
VALUES (
  'UUID_DO_USUARIO_CRIADO_ACIMA',
  'Pedro Ghiraldelli',
  'pedro@novatrindade.com.br',
  'admin',
  'Nova Trindade SSC',
  true
);
```

4. Após criar o admin, use a tela `/admin/users/new` para criar todos os outros usuários.

---

## Hierarquia de usuários

| Role | Permissões |
|---|---|
| `admin` | Acesso total, criação de usuários |
| `analyst` | Igual ao admin, exceto criação de usuários |
| `director` | Vê chamados e usuários da empresa que gerencia |
| `collaborator` | Abre chamados, lê e cria artigos |

---

## Estrutura do projeto

```
app/
├── (auth)/login/          # Página de login
├── (app)/
│   ├── dashboard/         # Painel inicial por role
│   ├── requests/          # Lista, wizard e detalhe de chamados
│   ├── pipeline/          # Kanban (admin/analyst)
│   ├── knowledge/         # Base de conhecimento
│   └── admin/users/       # Gestão de usuários (admin)
├── actions/users.ts       # Server Action para criar usuário
components/
├── providers/             # UserProvider, ToastProvider
├── Sidebar.tsx            # Navegação lateral
├── Header.tsx             # Barra superior
├── Badge.tsx              # Badges de status/complexidade
├── Modal.tsx              # Modal genérico
├── MarkdownRenderer.tsx   # Renderizador de markdown simples
└── StepWizard.tsx         # Wizard com barra de progresso
lib/
├── supabase/              # Clients browser e server
├── types.ts               # TypeScript interfaces
├── constants.ts           # Constantes de domínio
└── utils.ts               # Utilitários (formatação de data, etc.)
supabase/
├── schema.sql             # Schema completo do banco
└── seed.sql               # Dados de exemplo
middleware.ts              # Proteção de rotas por role
```

---

## Conexão com n8n (extensão futura)

Qualquer chamado que mudar para status `approved` pode disparar um webhook no n8n:

```
Supabase → Database Webhooks → automation_requests → UPDATE → n8n webhook URL
```

O payload conterá todos os dados do chamado para automação de notificação via Teams ou e-mail.
