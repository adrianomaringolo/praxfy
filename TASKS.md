# TASKS.md — MVP Servia

Cada tarefa deve ser executada em ordem. Confirme a conclusão de cada uma antes de avançar.
Leia o SPEC.md antes de começar qualquer tarefa.

---

## FASE 0 — Setup do Projeto

### Tarefa 0.1 — Criar projeto Next.js
```bash
npx create-next-app@latest servia \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"
cd servia
```

### Tarefa 0.2 — Instalar dependências
```bash
# Banco (Supabase + Drizzle)
npm install drizzle-orm postgres
npm install -D drizzle-kit

# Storage (Supabase)
npm install @supabase/supabase-js

# Auth (Clerk)
npm install @clerk/nextjs

# UI
npx shadcn@latest init
npx shadcn@latest add button input label textarea select card badge dialog sheet tabs separator skeleton sonner

# Email
npm install resend react-email @react-email/components

# Utilitários
npm install zod nanoid date-fns
```

### Tarefa 0.3 — Configurar variáveis de ambiente
Criar `.env.local` com todas as chaves do SPEC.md.
Criar `.env.example` com as mesmas chaves sem valores.
Adicionar `.env.local` ao `.gitignore`.

### Tarefa 0.4 — Configurar Drizzle
- Criar `drizzle.config.ts` na raiz conforme SPEC.md
- Criar `src/db/index.ts` com conexão postgres + drizzle conforme SPEC.md

### Tarefa 0.5 — Configurar Clerk
- Criar `src/middleware.ts` com `clerkMiddleware` protegendo todas as rotas dentro de `(app)`
- Criar `app/(auth)/sign-in/[[...sign-in]]/page.tsx` com o componente `<SignIn />` do Clerk
- Criar `app/(auth)/sign-up/[[...sign-up]]/page.tsx` com o componente `<SignUp />`

### Tarefa 0.6 — Configurar Supabase Storage
- No dashboard do Supabase, criar bucket `documents` com acesso público desabilitado por padrão
- Criar `src/lib/supabase-storage.ts` conforme SPEC.md com funções `uploadFile` e `deleteFile`

---

## FASE 1 — Banco de Dados

### Tarefa 1.1 — Criar schema Drizzle
Criar `src/db/schema.ts` com todas as tabelas do SPEC.md usando `pgTable`, `pgEnum`, `uuid`, `text`, `boolean`, `timestamp`, `date`, `numeric`, `integer`.

Enums a criar:
```ts
export const contractStatusEnum = pgEnum('contract_status', ['active', 'paused', 'cancelled'])
export const frequencyTypeEnum = pgEnum('frequency_type', ['days', 'weeks', 'months', 'years'])
export const occurrenceStatusEnum = pgEnum('occurrence_status', ['pending', 'done', 'skipped'])
```

Usar `crypto.randomUUID()` como default para todos os campos `id`.

### Tarefa 1.2 — Gerar e rodar migrations
```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```
Verificar no dashboard do Supabase (Table Editor) se as tabelas foram criadas corretamente.

### Tarefa 1.3 — Criar queries base
Criar arquivos em `src/db/queries/`:

- `users.ts` — `getOrCreateUser(clerkId, name, email)`
- `clients.ts` — `getClients`, `getClientById`, `createClient`, `updateClient`, `deleteClient`
- `pipelines.ts` — `getPipelines`, `getPipelineWithStages`, `createPipeline`, `updatePipeline`, `deletePipeline`, `createStage`, `updateStage`, `updateStagesOrder`, `deleteStage`
- `projects.ts` — `getProjects`, `getProjectById`, `getProjectByToken`, `createProject`, `updateProject`, `updateProjectStage`, `toggleProjectToken`
- `project-logs.ts` — `getProjectLogs`, `createProjectLog`
- `project-links.ts` — `getProjectLinks`, `createProjectLink`, `deleteProjectLink`
- `project-documents.ts` — `getProjectDocuments`, `createProjectDocument`, `deleteProjectDocument`
- `contracts.ts` — `getContracts`, `getContractById`, `getContractByToken`, `createContract`, `updateContract`
- `recurrences.ts` — `getRecurrences`, `getRecurrenceById`, `createRecurrence`, `updateRecurrence`, `getOverdueRecurrences`, `updateNextOccurrence`
- `recurrence-occurrences.ts` — `getOccurrencesByRecurrence`, `createOccurrence`, `completeOccurrence`
- `catalog.ts` — `getCatalogItems`, `createCatalogItem`, `updateCatalogItem`, `deleteCatalogItem`

Todas as queries que retornam listas devem filtrar por `userId`.

---

## FASE 2 — Layout e Autenticação

### Tarefa 2.1 — Sincronização de usuário
Criar `src/actions/users.ts` com `syncUser()`:
- Obtém o usuário do Clerk com `currentUser()`
- Faz upsert na tabela `users` (insert se não existir, ignora se existir)
- Retorna o usuário do banco

### Tarefa 2.2 — Layout autenticado
Criar `app/(app)/layout.tsx`:
- Chamar `syncUser()` no início para garantir que o usuário existe no banco
- Sidebar com links: Dashboard, Clientes, Projetos, Contratos, Recorrências, Catálogo, Configurações
- Header com `<UserButton />` do Clerk
- Em mobile: sidebar dentro de `<Sheet>` do shadcn com botão hamburguer no header

### Tarefa 2.3 — Página de onboarding
Criar `app/(app)/onboarding/page.tsx`:
- Verificar se o usuário já tem pipelines; se sim, redirecionar para `/dashboard`
- Formulário: nome do primeiro pipeline (ex: "Meus Projetos") + 3-5 etapas iniciais
- Ao submeter: criar pipeline + etapas e redirecionar para `/dashboard`

---

## FASE 3 — Clientes

### Tarefa 3.1 — Server Actions de clientes
Criar `src/actions/clients.ts` com:
- `createClient(data)` — valida com Zod, insere no banco
- `updateClient(id, data)` — valida ownership (userId), atualiza
- `deleteClient(id)` — valida ownership, deleta

### Tarefa 3.2 — Listagem de clientes
Criar `app/(app)/clients/page.tsx`:
- Tabela com colunas: Nome, Email, Telefone, Tags, Ações
- Botão "Novo Cliente" que abre dialog ou navega para `/clients/new`
- Busca por nome (client-side filtering no MVP)

### Tarefa 3.3 — Formulário de cliente
Criar componente `src/components/clients/ClientForm.tsx`:
- Campos: nome (obrigatório), email, telefone, notas, tags (input com chips simples)
- Validação com Zod + react-hook-form ou ação direta via Server Action
- Reutilizável para criar e editar

### Tarefa 3.4 — Página de detalhe do cliente
Criar `app/(app)/clients/[id]/page.tsx`:
- Dados do cliente com botão editar
- Lista de projetos vinculados (nome, etapa, valor)
- Lista de contratos vinculados (nome, status, valor)

---

## FASE 4 — Pipelines e Configurações

### Tarefa 4.1 — Server Actions de pipelines
Criar `src/actions/pipelines.ts`:
- `createPipeline(name, description)`
- `updatePipeline(id, data)`
- `deletePipeline(id)` — impedir se houver projetos vinculados
- `createStage(pipelineId, name, color, order)`
- `updateStage(id, data)`
- `updateStagesOrder(stages: { id: string; order: number }[])` — para reordenação
- `deleteStage(id)` — impedir se houver projetos nessa etapa

### Tarefa 4.2 — Página de gerenciamento de pipelines
Criar `app/(app)/settings/pipelines/page.tsx`:
- Listar pipelines do usuário
- Criar novo pipeline via dialog
- Para cada pipeline: listar etapas com botão de reordenar (setas cima/baixo no MVP, sem drag-and-drop)
- Criar etapa: nome + seletor de cor (palette de 8 cores predefinidas)
- Botão deletar etapa (com confirmação)

---

## FASE 5 — Projetos

### Tarefa 5.1 — Server Actions de projetos
Criar `src/actions/projects.ts`:
- `createProject(data)` — gerar `publicToken` com `nanoid(16)`
- `updateProject(id, data)`
- `updateProjectStage(id, stageId)` — atualiza etapa e cria log automático
- `toggleProjectToken(id, active)` — ativar/desativar token público
- `setProjectTokenExpiry(id, expiresAt)`

### Tarefa 5.2 — Listagem de projetos
Criar `app/(app)/projects/page.tsx`:
- Tabela com colunas: Nome, Cliente, Etapa atual, Valor, Prazo, Ações
- Filtro por pipeline (select)
- Botão "Novo Projeto"

### Tarefa 5.3 — Criar projeto
Criar `app/(app)/projects/new/page.tsx`:
- Campos: nome, descrição, cliente (select), pipeline (select), etapa inicial (select dinâmico baseado no pipeline), catálogo (select opcional), valor, moeda, data início, prazo
- Ao selecionar pipeline, atualizar as opções de etapa via estado local

### Tarefa 5.4 — Detalhe do projeto
Criar `app/(app)/projects/[id]/page.tsx` com `<Tabs>` do shadcn:
- **Visão Geral**: dados do projeto, cliente, etapa atual, select para mover etapa
- **Logs**: lista + formulário inline para novo log
- **Links**: lista + formulário inline para novo link
- **Documentos**: lista + input de upload
- **Portal**: URL pública + controles

### Tarefa 5.5 — Logs, links e portal
Criar Server Actions em `src/actions/project-logs.ts`, `src/actions/project-links.ts`:
- `createProjectLog(projectId, content, isPublic)`
- `createProjectLink(projectId, label, url, isPublic)`
- `deleteProjectLink(id)`
- `updateProjectLinkVisibility(id, isPublic)`
- `updateProjectLogVisibility(id, isPublic)`

Na aba Portal:
- Mostrar URL: `{NEXT_PUBLIC_APP_URL}/p/{publicToken}`
- Botão copiar URL (clipboard API)
- Toggle ativo/inativo
- Input de data de expiração

### Tarefa 5.6 — Upload de documentos
Criar `src/actions/project-documents.ts`:
- `uploadProjectDocument(projectId, file: FormData)`:
  1. Extrair arquivo do FormData
  2. Fazer upload para Supabase Storage em `documents/{projectId}/{timestamp}-{filename}`
  3. Salvar metadados na tabela `project_documents`
- `deleteProjectDocument(id)`:
  1. Deletar do Supabase Storage usando `storagePath`
  2. Deletar registro do banco
- `updateDocumentVisibility(id, isPublic)`

---

## FASE 6 — Contratos

### Tarefa 6.1 — Server Actions de contratos
Criar `src/actions/contracts.ts`:
- `createContract(data)` — gerar `publicToken` com `nanoid(16)`
- `updateContract(id, data)`
- `toggleContractToken(id, active)`

### Tarefa 6.2 — Listagem e formulário
Criar `app/(app)/contracts/page.tsx`:
- Tabela: Nome, Cliente, Valor, Status, Ações
- Badge colorido por status (ativo=verde, pausado=amarelo, cancelado=vermelho)
- Botão "Novo Contrato"

Criar `app/(app)/contracts/new/page.tsx`:
- Campos: nome, descrição, cliente, catálogo (opcional), valor, moeda, status

### Tarefa 6.3 — Detalhe do contrato
Criar `app/(app)/contracts/[id]/page.tsx`:
- Dados do contrato + botão editar
- Lista de recorrências vinculadas
- Botão "Nova Recorrência" (pré-preenche o vínculo com este contrato)
- Aba/seção Portal com URL pública e controles

---

## FASE 7 — Recorrências

### Tarefa 7.1 — Server Actions de recorrências
Criar `src/actions/recurrences.ts`:
- `createRecurrence(data)` — calcular `nextOccurrenceAt` com `date-fns`
- `updateRecurrence(id, data)`
- `pauseRecurrence(id)` / `cancelRecurrence(id)`
- `completeOccurrence(occurrenceId, notes)`:
  1. Marcar ocorrência como `done` com `executedAt = now()`
  2. Criar próxima `recurrence_occurrence` com nova data
  3. Atualizar `nextOccurrenceAt` na recorrência

### Tarefa 7.2 — Listagem de recorrências
Criar `app/(app)/recurrences/page.tsx`:
- Tabela: Nome, Vinculado a, Frequência, Próxima ocorrência, Status
- Destacar em vermelho recorrências vencidas (`nextOccurrenceAt < today`)
- Destacar em amarelo recorrências vencendo em ≤ 7 dias
- Botão "Nova Recorrência"

### Tarefa 7.3 — Formulário de recorrência
Modal ou página com:
- Nome, descrição
- Vínculo: nenhum / projeto (select) / contrato (select)
- Frequência: valor numérico + tipo (dias/semanas/meses/anos)
- Data de início
- Emails para notificar (input de múltiplos emails — adicionar com Enter, remover com ×)

### Tarefa 7.4 — Detalhe da recorrência
Criar `app/(app)/recurrences/[id]/page.tsx`:
- Dados da recorrência
- Lista de ocorrências (mais recentes primeiro)
- Na ocorrência `pending`: botão "Marcar como feita" abre dialog com campo de observações
- Histórico de ocorrências anteriores com data real de execução

### Tarefa 7.5 — Cron job e email
Criar `app/api/cron/recurrences/route.ts`:
```ts
export async function GET(request: Request) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }
  // 1. buscar recorrências ativas vencidas
  // 2. para cada uma: criar occurrence, enviar email, atualizar nextOccurrenceAt
  return Response.json({ ok: true })
}
```

Criar `src/emails/RecurrenceAlert.tsx` com React Email:
- Nome da recorrência
- Cliente vinculado (se houver)
- Data prevista
- Link para o projeto/contrato no sistema

Criar `vercel.json` na raiz:
```json
{
  "crons": [{ "path": "/api/cron/recurrences", "schedule": "0 8 * * *" }]
}
```

---

## FASE 8 — Catálogo de Serviços

### Tarefa 8.1 — CRUD do catálogo
Criar `app/(app)/catalog/page.tsx`:
- Cards ou tabela com nome, descrição, preço base
- Dialog para criar/editar inline
- Deletar com confirmação (verificar se há projetos/contratos vinculados antes)

Criar `src/actions/catalog.ts`:
- `createCatalogItem`, `updateCatalogItem`, `deleteCatalogItem`

---

## FASE 9 — Portal do Cliente

### Tarefa 9.1 — Página pública
Criar `app/p/[token]/page.tsx` (fora do grupo `(app)`, sem auth):
- Buscar projeto ou contrato pelo token usando `getProjectByToken` / `getContractByToken`
- Se não encontrado, inativo ou expirado: `notFound()`
- Layout sem sidebar, header simples com nome do profissional

Exibir para **projetos**:
- Nome, descrição, cliente
- Stepper com todas as etapas do pipeline, destacando a atual
- Logs públicos (data + conteúdo)
- Links públicos
- Documentos públicos com botão download

Exibir para **contratos**:
- Nome, descrição, status
- Logs públicos (se existirem)
- Links públicos
- Documentos públicos

Rodapé: "Powered by Servia"

---

## FASE 10 — Dashboard

### Tarefa 10.1 — Cards de resumo
Criar `app/(app)/dashboard/page.tsx` com 4 cards:
- Projetos ativos (contagem)
- Contratos ativos (contagem)
- Recorrências vencidas (pendentes com data passada)
- Recorrências vencendo em 7 dias

### Tarefa 10.2 — Listas de atenção
Abaixo dos cards:
- **Próximas recorrências**: lista das 5 mais próximas com nome, cliente e data
- **Projetos sem movimentação**: projetos sem nenhum log nos últimos 15 dias

---

## FASE 11 — Polimento

### Tarefa 11.1 — Loading e error states
- Adicionar `loading.tsx` nas rotas principais com skeletons
- Adicionar `error.tsx` com mensagem amigável e botão "Tentar novamente"
- Garantir `<Toaster />` do sonner no layout raiz
- Todos os Server Actions retornam `{ success: boolean; error?: string }` e disparam toast

### Tarefa 11.2 — Responsividade
- Tabelas longas: scroll horizontal em mobile (`overflow-x-auto`)
- Formulários: stack vertical em mobile
- Sidebar: funcionar como drawer em mobile

### Tarefa 11.3 — Seed de desenvolvimento
Criar `src/db/seed.ts`:
- 2 clientes fictícios
- 1 pipeline "Projetos Web" com 5 etapas
- 2 projetos em etapas diferentes com logs e links
- 1 contrato com 1 recorrência mensal

```bash
npx tsx src/db/seed.ts
```

### Tarefa 11.4 — README
Criar `README.md` com:
- Descrição do projeto
- Stack utilizada
- Pré-requisitos (Node.js, contas Supabase, Clerk, Resend, Vercel)
- Setup local passo a passo
- Instruções de deploy na Vercel
- Tabela de variáveis de ambiente

---

## Ordem Mínima para Primeiro Deploy Funcional

Se quiser validar o fluxo central antes de tudo, implemente nesta ordem:

1. Fase 0 — setup completo
2. Fase 1 — banco e queries
3. Fase 2 — layout e auth
4. Fase 3 — clientes
5. Fase 4 — pipelines
6. Fase 5 (tarefas 5.1 a 5.5) — projetos sem documentos
7. Fase 9 — portal do cliente
8. Fase 10 — dashboard básico

Isso entrega o fluxo completo: **criar cliente → criar projeto → mover etapas → compartilhar link com cliente**.
Documentos (5.6), contratos (6), recorrências (7), catálogo (8) e polimento (11) podem vir depois.
