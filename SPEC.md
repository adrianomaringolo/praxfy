# SPEC.md — Servia: Plataforma de Gestão de Serviços

## Visão Geral

Servia é uma plataforma SaaS para profissionais que prestam serviços, permitindo gerenciar projetos, contratos recorrentes, clientes e comunicação — tudo em um único lugar. O sistema é genérico e configurável para qualquer tipo de serviço (desenvolvimento web, criação de conteúdo, limpeza automotiva, contabilidade, etc).

---

## Stack Técnica

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 15 (App Router) |
| Linguagem | TypeScript |
| UI | shadcn/ui + Tailwind CSS |
| Banco de dados | PostgreSQL via Supabase |
| ORM | Drizzle ORM + Drizzle Kit |
| Auth | Clerk |
| Email | Resend + React Email |
| Storage | Supabase Storage |
| Deploy | Vercel |
| Validação | Zod |

> **Por que essa combinação?**
> Supabase centraliza banco + storage em um único dashboard e billing.
> Clerk é mantido para auth por ter componentes prontos, MFA e social login superiores ao Supabase Auth.
> Resend é mantido para email transacional com templates React customizáveis.

---

## Configuração do Banco (Supabase + Drizzle)

```ts
// src/db/index.ts
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

const client = postgres(process.env.DATABASE_URL!)
export const db = drizzle({ client })
```

```ts
// drizzle.config.ts
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
```

> **Connection string do Supabase**: usar a string de **Connection Pooler (Transaction mode)** disponível em
> Project Settings → Database → Connection string → Transaction.
> Formato: `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`

---

## Configuração do Storage (Supabase Storage)

```ts
// src/lib/supabase-storage.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // service role para uploads server-side
)

export async function uploadFile(
  bucket: string,
  path: string,
  file: Buffer,
  contentType: string
) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { contentType, upsert: false })
  if (error) throw error
  return supabase.storage.from(bucket).getPublicUrl(data.path).data.publicUrl
}

export async function deleteFile(bucket: string, path: string) {
  const { error } = await supabase.storage.from(bucket).remove([path])
  if (error) throw error
}
```

Buckets necessários no Supabase Storage:
- `documents` — documentos de projetos e contratos (acesso misto: público para itens marcados como públicos, privado por padrão)

---

## Variáveis de Ambiente

```
# Banco (Supabase)
DATABASE_URL=                         # Connection string (Transaction Pooler)

# Supabase Storage
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=            # Apenas server-side, nunca expor no cliente

# Auth (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# Email
RESEND_API_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_SECRET=                          # Secret para proteger o endpoint de cron
```

---

## Modelo de Dados

### `users`
Gerenciado pelo Clerk. O `clerkId` é a chave de vínculo com todos os outros registros.

```ts
users {
  id: uuid PK default crypto.randomUUID()
  clerkId: text UNIQUE NOT NULL
  name: text NOT NULL
  email: text NOT NULL
  createdAt: timestamp default now()
}
```

### `clients`
```ts
clients {
  id: uuid PK
  userId: uuid FK -> users.id ON DELETE CASCADE
  name: text NOT NULL
  email: text
  phone: text
  notes: text
  tags: text[]
  createdAt: timestamp default now()
}
```

### `pipelines`
Cada profissional pode ter múltiplos pipelines (ex: "Projetos Web", "Serviços Mensais").
```ts
pipelines {
  id: uuid PK
  userId: uuid FK -> users.id ON DELETE CASCADE
  name: text NOT NULL
  description: text
  createdAt: timestamp default now()
}
```

### `pipeline_stages`
Etapas dentro de um pipeline, ordenadas.
```ts
pipeline_stages {
  id: uuid PK
  pipelineId: uuid FK -> pipelines.id ON DELETE CASCADE
  name: text NOT NULL
  color: text NOT NULL   # hex color, ex: "#3b82f6"
  order: integer NOT NULL
}
```

### `service_catalog`
Catálogo de serviços do profissional.
```ts
service_catalog {
  id: uuid PK
  userId: uuid FK -> users.id ON DELETE CASCADE
  name: text NOT NULL
  description: text
  basePrice: numeric(10,2)
  currency: text default 'BRL'
  createdAt: timestamp default now()
}
```

### `projects`
Projetos com início e fim definidos.
```ts
projects {
  id: uuid PK
  userId: uuid FK -> users.id ON DELETE CASCADE
  clientId: uuid FK -> clients.id
  pipelineId: uuid FK -> pipelines.id
  currentStageId: uuid FK -> pipeline_stages.id
  catalogItemId: uuid FK -> service_catalog.id  (nullable)
  name: text NOT NULL
  description: text
  value: numeric(10,2)
  currency: text default 'BRL'
  startDate: date
  dueDate: date
  publicToken: text UNIQUE NOT NULL   # nanoid(16), gerado na criação
  publicTokenActive: boolean default true
  publicTokenExpiresAt: timestamp
  createdAt: timestamp default now()
  updatedAt: timestamp default now()
}
```

### `project_logs`
Histórico de atividades de um projeto.
```ts
project_logs {
  id: uuid PK
  projectId: uuid FK -> projects.id ON DELETE CASCADE
  stageId: uuid FK -> pipeline_stages.id  (nullable)
  content: text NOT NULL
  isPublic: boolean default false
  createdAt: timestamp default now()
}
```

### `project_links`
Links associados a um projeto.
```ts
project_links {
  id: uuid PK
  projectId: uuid FK -> projects.id ON DELETE CASCADE
  label: text NOT NULL    # ex: "Repositório", "Staging", "Figma"
  url: text NOT NULL
  isPublic: boolean default false
  createdAt: timestamp default now()
}
```

### `project_documents`
Documentos anexados a um projeto.
```ts
project_documents {
  id: uuid PK
  projectId: uuid FK -> projects.id ON DELETE CASCADE
  name: text NOT NULL
  storagePath: text NOT NULL   # path no Supabase Storage, ex: "documents/proj_id/filename.pdf"
  publicUrl: text NOT NULL     # URL pública ou assinada
  mimeType: text NOT NULL
  isPublic: boolean default false
  createdAt: timestamp default now()
}
```

### `contracts`
Contratos de serviço recorrentes (sem prazo de término).
```ts
contracts {
  id: uuid PK
  userId: uuid FK -> users.id ON DELETE CASCADE
  clientId: uuid FK -> clients.id
  catalogItemId: uuid FK -> service_catalog.id  (nullable)
  name: text NOT NULL
  description: text
  value: numeric(10,2)
  currency: text default 'BRL'
  status: enum('active', 'paused', 'cancelled') default 'active'
  publicToken: text UNIQUE NOT NULL
  publicTokenActive: boolean default true
  createdAt: timestamp default now()
  updatedAt: timestamp default now()
}
```

### `recurrences`
Recorrências vinculadas a um projeto, contrato, ou globais.
```ts
recurrences {
  id: uuid PK
  userId: uuid FK -> users.id ON DELETE CASCADE
  projectId: uuid FK -> projects.id   (nullable)
  contractId: uuid FK -> contracts.id (nullable)
  name: text NOT NULL
  description: text
  frequencyType: enum('days', 'weeks', 'months', 'years') NOT NULL
  frequencyValue: integer NOT NULL
  startDate: date NOT NULL
  nextOccurrenceAt: date NOT NULL
  status: enum('active', 'paused', 'cancelled') default 'active'
  notifyEmails: text[] NOT NULL default '{}'
  createdAt: timestamp default now()
}
```

### `recurrence_occurrences`
Cada ciclo de execução de uma recorrência.
```ts
recurrence_occurrences {
  id: uuid PK
  recurrenceId: uuid FK -> recurrences.id ON DELETE CASCADE
  scheduledAt: date NOT NULL
  executedAt: timestamp
  status: enum('pending', 'done', 'skipped') default 'pending'
  notes: text
  createdAt: timestamp default now()
}
```

---

## Estrutura de Rotas (Next.js App Router)

```
app/
├── (auth)/
│   ├── sign-in/[[...sign-in]]/page.tsx
│   └── sign-up/[[...sign-up]]/page.tsx
│
├── (app)/                              # Área autenticada (clerkMiddleware)
│   ├── layout.tsx                      # Sidebar + header
│   ├── onboarding/page.tsx             # Configuração inicial (pipeline padrão)
│   ├── dashboard/page.tsx
│   ├── clients/
│   │   ├── page.tsx                    # Lista de clientes
│   │   ├── new/page.tsx
│   │   └── [id]/page.tsx
│   ├── projects/
│   │   ├── page.tsx                    # Lista de projetos
│   │   ├── new/page.tsx
│   │   └── [id]/
│   │       └── page.tsx                # Detalhe com abas: Visão Geral, Logs, Links, Documentos, Portal
│   ├── contracts/
│   │   ├── page.tsx
│   │   ├── new/page.tsx
│   │   └── [id]/page.tsx
│   ├── recurrences/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── catalog/
│   │   └── page.tsx
│   └── settings/
│       ├── page.tsx                    # Perfil
│       └── pipelines/page.tsx          # Gerenciar pipelines e etapas
│
├── p/
│   └── [token]/page.tsx                # Portal público do cliente (sem auth)
│
└── api/
    └── cron/
        └── recurrences/route.ts        # Cron job diário
```

---

## Portal do Cliente

Acessível via `/p/[token]` — sem necessidade de login.

**Exibe:**
- Nome e descrição do projeto ou contrato
- Etapa atual com stepper visual (apenas projetos)
- Logs com `isPublic = true`, ordenados por data
- Links com `isPublic = true`
- Documentos com `isPublic = true` com link de download

**Regras:**
- Token gerado com `nanoid(16)` na criação
- Retorna 404 se `publicTokenActive = false` ou `publicTokenExpiresAt < now()`
- Página sem sidebar, com rodapé "Powered by Servia"
- Sem nenhuma informação financeira ou interna

---

## Sistema de Recorrências e Email

Cron job diário em `/api/cron/recurrences`:
1. Busca recorrências com `status = 'active'` e `nextOccurrenceAt <= today`
2. Para cada uma:
   - Cria `recurrence_occurrence` com `status = 'pending'`
   - Envia email para todos em `notifyEmails` via Resend
   - Calcula e atualiza `nextOccurrenceAt` com base em `frequencyType` + `frequencyValue`

**Cálculo da próxima ocorrência:**
```ts
import { addDays, addWeeks, addMonths, addYears } from 'date-fns'

function nextDate(current: Date, type: string, value: number): Date {
  switch (type) {
    case 'days':   return addDays(current, value)
    case 'weeks':  return addWeeks(current, value)
    case 'months': return addMonths(current, value)
    case 'years':  return addYears(current, value)
  }
}
```

**Configuração do cron no Vercel:**
```json
// vercel.json
{
  "crons": [{ "path": "/api/cron/recurrences", "schedule": "0 8 * * *" }]
}
```

O endpoint deve validar o header `Authorization: Bearer ${CRON_SECRET}`.

---

## Regras de Negócio

- Usuário só acessa dados onde `userId` corresponde ao seu `clerkId`
- Ao mudar a etapa de um projeto, criar log automático: *"Etapa alterada para [nome]"* com `isPublic = false`
- Um cliente pode ter múltiplos projetos e contratos simultaneamente
- Recorrências podem ser vinculadas a projeto, contrato ou nenhum (global)
- O catálogo é referência — valores no projeto/contrato podem diferir
- Upload de documentos: salvar em `documents/{projectId}/{timestamp}-{filename}` no Supabase Storage

---

## Convenções de Código

```
src/
├── actions/          # Server Actions (um arquivo por entidade)
├── db/
│   ├── index.ts      # Conexão Drizzle
│   ├── schema.ts     # Schema completo
│   ├── migrations/   # Gerado pelo Drizzle Kit
│   └── queries/      # Funções de query (um arquivo por entidade)
├── emails/           # Templates React Email
├── lib/
│   ├── supabase-storage.ts
│   ├── utils.ts
│   └── validations/  # Schemas Zod
├── components/
│   ├── ui/           # shadcn/ui
│   └── [feature]/    # Componentes por domínio
└── types/            # Tipos globais TypeScript
```

---

## Fora do Escopo do MVP

- Multi-usuário / equipe (sócios, assistentes)
- Controle financeiro detalhado (parcelas, pagamentos)
- Time tracking
- Geração de propostas em PDF
- App mobile
- Integrações externas (Notion, Trello, etc.)
