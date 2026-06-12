# GUIDE.md — Praxfy: Guia de Implementação

> Leia este arquivo inteiro antes de começar. Ele define as decisões de design, stack, componentes e padrões que devem ser seguidos em toda a implementação. Consulte também o `SPEC.md` para o modelo de dados e regras de negócio, e o `TASKS.md` para a ordem de execução.

---

## 1. Visão do Produto

**Praxfy** é uma plataforma de gestão de serviços para profissionais autônomos e pequenas empresas de qualquer segmento. O sistema deve transmitir **confiança, clareza e profissionalismo** — como um assistente executivo digital que organiza o caos do dia a dia de quem presta serviços.

**Idioma:** Português do Brasil (PT-BR) em toda a interface. Sem internacionalização por enquanto.

---

## 2. Stack Completa

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 15 (App Router) |
| Linguagem | TypeScript |
| UI Components | **buildgrid-ui** (`npm install buildgrid-ui`) |
| Estilo | Tailwind CSS v3 |
| Banco | PostgreSQL via Supabase + Drizzle ORM |
| Auth | Clerk |
| Email | Resend + React Email |
| Storage | Supabase Storage |
| Ícones | **Lucide React** (`npm install lucide-react`) |
| Pagamentos | Stripe (`npm install stripe @stripe/stripe-js`) |
| Deploy | Vercel |
| Validação | Zod |
| Utilitários | date-fns, nanoid |

### Instalação dos pacotes principais

```bash
npm install buildgrid-ui lucide-react
npm install stripe @stripe/stripe-js
npm install drizzle-orm postgres @supabase/supabase-js
npm install @clerk/nextjs
npm install resend react-email @react-email/components
npm install zod nanoid date-fns
npm install -D drizzle-kit
```

---

## 3. Sistema de Design

### 3.1 Paleta de Cores

A identidade visual do Praxfy é construída sobre um contraste deliberado: um azul-ardósia escuro e sólido como cor primária (transmite autoridade e foco), um índigo vibrante como accent (energia, ação), e fundos levemente aquecidos (não brancos puros) para reduzir fadiga visual em uso prolongado.

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        // Primária — azul-ardósia (identidade, navegação, headers)
        primary: {
          50:  '#f0f4ff',
          100: '#e0e9ff',
          200: '#c7d7fe',
          300: '#a5b9fd',
          400: '#8191f8',
          500: '#6366f1', // base
          600: '#4f46e5', // hover
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        // Accent — índigo vibrante (CTAs, badges ativos, destaques)
        accent: {
          DEFAULT: '#6366f1',
          hover:   '#4f46e5',
          light:   '#e0e7ff',
        },
        // Superfície — fundos levemente aquecidos
        surface: {
          DEFAULT: '#f8f7ff', // fundo geral (não branco puro)
          card:    '#ffffff',
          muted:   '#f1f0f9',
        },
        // Feedback
        success: { DEFAULT: '#10b981', light: '#d1fae5' },
        warning: { DEFAULT: '#f59e0b', light: '#fef3c7' },
        danger:  { DEFAULT: '#ef4444', light: '#fee2e2' },
        info:    { DEFAULT: '#3b82f6', light: '#dbeafe' },
        // Texto
        text: {
          primary:   '#1e1b4b',
          secondary: '#6b7280',
          muted:     '#9ca3af',
          inverse:   '#ffffff',
        },
        // Sidebar
        sidebar: {
          bg:     '#1e1b4b',
          hover:  '#312e81',
          active: '#4f46e5',
          text:   '#c7d7fe',
          muted:  '#818cf8',
        },
      },
    },
  },
}
```

**Regras de uso:**
- `primary-600` → cor principal de botões, links ativos, ícones de destaque
- `surface-DEFAULT` → fundo de todas as páginas (nunca `bg-white` direto no body)
- `surface-card` → cards, modais, painéis
- `sidebar-bg` → fundo fixo da sidebar
- Nunca misturar mais de 2 cores de feedback na mesma tela

### 3.2 Tipografia

```js
// tailwind.config.js — dentro de extend
fontFamily: {
  sans:    ['Inter', 'system-ui', 'sans-serif'],
  display: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
  mono:    ['JetBrains Mono', 'monospace'],
},
```

Importar no `app/layout.tsx` via `next/font/google`:

```ts
import { Inter, Plus_Jakarta_Sans } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-display',
})
```

**Escala tipográfica:**

| Uso | Classe Tailwind | Peso |
|---|---|---|
| Título de página | `text-2xl font-display font-bold` | 700 |
| Título de seção | `text-lg font-display font-semibold` | 600 |
| Label de card/stat | `text-sm font-medium tracking-wide uppercase` | 500 |
| Corpo de texto | `text-sm text-text-secondary` | 400 |
| Caption / meta | `text-xs text-text-muted` | 400 |
| Número de destaque | `text-3xl font-display font-bold text-primary-700` | 700 |

**Regra:** Títulos usam `font-display` (Plus Jakarta Sans). Corpo e labels usam `font-sans` (Inter). Nunca usar `font-bold` em textos de parágrafo.

### 3.3 Espaçamento e Bordas

```
Padding de página:    px-6 py-6 (desktop) / px-4 py-4 (mobile)
Gap entre cards:      gap-4 (mobile) / gap-6 (desktop)
Border radius padrão: rounded-xl (cards) / rounded-lg (inputs, botões) / rounded-full (badges, avatars)
Sombra de card:       shadow-sm (default) / shadow-md (hover / elevated)
Border:               border border-gray-100 (cards) / border border-primary-100 (focused)
```

### 3.4 Ícones — Lucide React

Usar **exclusivamente** Lucide React. Não misturar com outras bibliotecas de ícones.

```tsx
import { LayoutDashboard, Users, FolderKanban, FileText,
         RefreshCw, BookOpen, Settings, ChevronRight,
         Plus, Pencil, Trash2, Eye, EyeOff, Copy,
         CheckCircle2, Clock, AlertCircle, ExternalLink,
         Upload, Download, Link2, Tag, Calendar } from 'lucide-react'
```

**Tamanhos padrão:**
- Sidebar nav: `size={18}`
- Ícone em botão: `size={16}`
- Ícone standalone (empty state, destaque): `size={40}`
- Badge/tag: `size={12}`

---

## 4. Componentes buildgrid-ui — Mapa de Uso

Todos os imports seguem o padrão:
```tsx
import { ComponentName } from 'buildgrid-ui'
```

### Layout Principal

```tsx
// app/(app)/layout.tsx
import {
  Sidebar, SidebarHeader, SidebarBody, SidebarNav,
  SidebarList, SidebarListItem, SidebarFooter
} from 'buildgrid-ui'
```

A sidebar é `fixed` em desktop. Em mobile, usar `isOpen` controlado com botão hamburguer no header.

### Listagens

Usar `DataTable` do buildgrid-ui para todas as listagens (clientes, projetos, contratos, recorrências, catálogo):

```tsx
import { DataTable } from 'buildgrid-ui'

// Sempre definir labels em PT-BR
const tableLabels = {
  searchPlaceholder: 'Buscar...',
  exportButton: 'Exportar CSV',
  clearAllButton: 'Limpar filtros',
  noDataAvailable: 'Nenhum registro encontrado.',
  noResultsWithFilters: 'Nenhum resultado para os filtros aplicados.',
  paginationCounter: 'Exibindo {{startIndex}} a {{endIndex}} de {{totalItems}} registros',
  columnsButton: 'Colunas',
  rowSelectedSingular: 'linha selecionada',
  rowSelectedPlural: 'linhas selecionadas',
  clearSelectionButton: 'Limpar seleção',
}
```

### Formulários

```tsx
import {
  Input, Textarea, Select, Checkbox, Switch,
  Label, DatePicker, CurrencyInput, TagInput,
  MultiSelect, SearchBar
} from 'buildgrid-ui'
```

- `CurrencyInput` → campos de valor monetário (projetos, contratos, catálogo)
- `TagInput` → tags de clientes
- `MultiSelect` → seleção de emails para notificação em recorrências
- `DatePicker` → data de início, prazo, expiração de token

### Feedback e Estado

```tsx
import {
  Toaster, Alert, Spinner, Skeleton,
  Badge, Progress, Tooltip
} from 'buildgrid-ui'
```

```tsx
import { EmptyMessage } from 'buildgrid-ui'

// Usar em todas as listagens vazias
<EmptyMessage
  title="Nenhum projeto ainda"
  description="Crie seu primeiro projeto para começar."
  action={<Button onClick={...}>Criar projeto</Button>}
/>
```

### Modais e Painéis

```tsx
import { Dialog, Sheet, AlertDialog, Drawer } from 'buildgrid-ui'
```

- `Dialog` → formulários de criação/edição em desktop
- `Sheet` → sidebar mobile / painéis laterais de detalhe
- `AlertDialog` → confirmações de exclusão
- `Drawer` → ações rápidas em mobile

### Upload de Arquivos

```tsx
import { FileUploadDropzone } from 'buildgrid-ui'

// Na aba Documentos de projetos e contratos
<FileUploadDropzone
  onFilesSelected={(files) => handleUpload(files)}
  accept={{ 'application/pdf': [], 'image/*': [] }}
  maxSize={10 * 1024 * 1024} // 10MB
/>
```

### Wizard — Onboarding

```tsx
import { Wizard } from 'buildgrid-ui'

// Na página /onboarding: guiar o usuário na criação do primeiro pipeline
```

### Paginação

```tsx
import { PaginationControls } from 'buildgrid-ui'
// Usar em conjunto com DataTable quando necessário controle externo
```

---

## 5. Padrões de Interface

### 5.1 Estrutura de Página Padrão

```tsx
// Toda página autenticada segue esta estrutura
export default function PaginaExemplo() {
  return (
    <div className="flex flex-col gap-6 px-6 py-6">
      {/* Header da página */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-text-primary">
            Título da Página
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Descrição opcional da seção
          </p>
        </div>
        <Button onClick={...}>
          <Plus size={16} className="mr-2" />
          Nova ação
        </Button>
      </div>

      {/* Conteúdo */}
      <DataTable ... />
    </div>
  )
}
```

### 5.2 Cards de Estatística (Dashboard)

```tsx
// Padrão para os 4 cards do dashboard
function StatCard({ label, value, icon: Icon, trend, color }) {
  return (
    <div className="bg-surface-card rounded-xl border border-gray-100 shadow-sm p-5 flex items-start gap-4">
      <div className={`p-2.5 rounded-lg ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="text-xs font-medium tracking-wide uppercase text-text-muted">
          {label}
        </p>
        <p className="text-3xl font-display font-bold text-text-primary mt-1">
          {value}
        </p>
        {trend && (
          <p className={`text-xs mt-1 ${trend > 0 ? 'text-success' : 'text-danger'}`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)} este mês
          </p>
        )}
      </div>
    </div>
  )
}
```

### 5.3 Badge de Status

```tsx
// Padrão para status de contratos, recorrências, ocorrências
const statusConfig = {
  active:    { label: 'Ativo',     className: 'bg-success-light text-success' },
  paused:    { label: 'Pausado',   className: 'bg-warning-light text-warning' },
  cancelled: { label: 'Cancelado', className: 'bg-danger-light text-danger' },
  pending:   { label: 'Pendente',  className: 'bg-info-light text-info' },
  done:      { label: 'Concluído', className: 'bg-success-light text-success' },
  overdue:   { label: 'Vencida',   className: 'bg-danger-light text-danger' },
}

function StatusBadge({ status }) {
  const config = statusConfig[status]
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  )
}
```

### 5.4 Sidebar Navigation

```tsx
// Itens de navegação com ícones Lucide
const navItems = [
  { href: '/dashboard',    label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/clients',      label: 'Clientes',     icon: Users },
  { href: '/projects',     label: 'Projetos',     icon: FolderKanban },
  { href: '/contracts',    label: 'Contratos',    icon: FileText },
  { href: '/recurrences',  label: 'Recorrências', icon: RefreshCw },
  { href: '/catalog',      label: 'Catálogo',     icon: BookOpen },
  { href: '/settings',     label: 'Configurações', icon: Settings },
]
```

Estilo da sidebar:
```tsx
<Sidebar fixed className="bg-sidebar-bg w-64">
  <SidebarHeader className="px-4 py-5">
    {/* Logo Praxfy */}
    <span className="text-xl font-display font-bold text-white tracking-tight">
      Prax<span className="text-accent">fy</span>
    </span>
  </SidebarHeader>
  <SidebarBody>
    <SidebarNav>
      <SidebarList>
        {navItems.map((item) => (
          <SidebarListItem
            key={item.href}
            onClick={() => router.push(item.href)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
              ${isActive(item.href)
                ? 'bg-sidebar-active text-white'
                : 'text-sidebar-text hover:bg-sidebar-hover'}`}
          >
            <item.icon size={18} />
            {item.label}
          </SidebarListItem>
        ))}
      </SidebarList>
    </SidebarNav>
  </SidebarBody>
  <SidebarFooter className="px-4 py-4 border-t border-primary-800">
    {/* UserButton do Clerk */}
  </SidebarFooter>
</Sidebar>
```

### 5.5 Stepper de Etapas (Portal do Cliente)

Implementar com Tailwind puro — sem biblioteca adicional:

```tsx
function StagesStepper({ stages, currentStageId }) {
  const currentIndex = stages.findIndex(s => s.id === currentStageId)
  return (
    <div className="flex items-center gap-0">
      {stages.map((stage, index) => (
        <div key={stage.id} className="flex items-center">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium
            ${index < currentIndex  ? 'bg-success-light text-success' : ''}
            ${index === currentIndex ? 'text-white' : ''}
            ${index > currentIndex  ? 'bg-gray-100 text-text-muted' : ''}`}
            style={index === currentIndex ? { backgroundColor: stage.color } : {}}
          >
            {index < currentIndex && <CheckCircle2 size={12} />}
            {stage.name}
          </div>
          {index < stages.length - 1 && (
            <ChevronRight size={14} className="text-gray-300 mx-1" />
          )}
        </div>
      ))}
    </div>
  )
}
```

### 5.6 Empty States

Todo estado vazio deve ser informativo e orientar a ação:

```tsx
// Exemplos de copy para cada seção
const emptyStates = {
  clients:     { title: 'Nenhum cliente cadastrado', description: 'Adicione seu primeiro cliente para começar a organizar seus serviços.' },
  projects:    { title: 'Nenhum projeto ainda',       description: 'Crie um projeto e acompanhe cada etapa até a entrega.' },
  contracts:   { title: 'Nenhum contrato ativo',      description: 'Contratos recorrentes aparecem aqui. Crie um para começar.' },
  recurrences: { title: 'Nenhuma recorrência criada', description: 'Configure lembretes automáticos para manutenções, renovações e mais.' },
  catalog:     { title: 'Catálogo vazio',             description: 'Cadastre os serviços que você oferece para usar nos projetos.' },
  logs:        { title: 'Nenhuma atualização ainda',  description: 'Registre o progresso do projeto para manter o histórico.' },
}
```

---

## 6. Portal do Cliente — Design Específico

O portal (`/p/[token]`) tem identidade visual própria, mais limpa e focada no cliente.

```tsx
// Layout do portal — sem sidebar
// Fundo: branco. Header simples. Sem menus internos.

// Paleta do portal
const portalColors = {
  bg:      'bg-white',
  header:  'bg-primary-950',  // dark header com nome do profissional
  accent:  '#6366f1',
  muted:   '#f8f7ff',
}
```

**Estrutura visual do portal:**
1. Header escuro com nome do profissional / empresa
2. Hero card com nome do projeto, cliente e etapa atual
3. Stepper de etapas (se for projeto)
4. Timeline de atualizações públicas (logs)
5. Seção de links e documentos
6. Rodapé: "Acompanhamento gerado pelo Praxfy"

---

## 7. Planos e Pagamentos (Stripe)

### 7.1 Estrutura de Planos

```ts
// src/lib/plans.ts
export const PLANS = {
  FREE: {
    id: 'free',
    name: 'Gratuito',
    price: 0,
    limits: {
      clients: 3,
      projects: 5,
      contracts: 2,
      recurrences: 3,
    },
    features: [
      'Até 3 clientes',
      'Até 5 projetos',
      'Portal do cliente',
      'Recorrências básicas',
    ],
  },
  PRO: {
    id: 'pro',
    name: 'Pro',
    price: 4900, // centavos = R$49,00/mês
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID!,
    limits: {
      clients: Infinity,
      projects: Infinity,
      contracts: Infinity,
      recurrences: Infinity,
    },
    features: [
      'Clientes ilimitados',
      'Projetos ilimitados',
      'Contratos ilimitados',
      'Recorrências ilimitadas',
      'Upload de documentos',
      'Exportação CSV',
      'Suporte prioritário',
    ],
  },
} as const

export type PlanId = keyof typeof PLANS
```

### 7.2 Schema de Planos no Banco

Adicionar ao `src/db/schema.ts`:

```ts
export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'active', 'canceled', 'past_due', 'trialing', 'incomplete'
])

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  stripeCustomerId: text('stripe_customer_id').unique(),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  stripePriceId: text('stripe_price_id'),
  planId: text('plan_id').notNull().default('free'),
  status: subscriptionStatusEnum('status').default('active'),
  currentPeriodStart: timestamp('current_period_start'),
  currentPeriodEnd: timestamp('current_period_end'),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})
```

### 7.3 Variáveis de Ambiente do Stripe

```
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_PRO_PRICE_ID=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

### 7.4 Endpoints Stripe

Criar os seguintes arquivos:

**`src/lib/stripe.ts`** — cliente Stripe server-side:
```ts
import Stripe from 'stripe'
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia',
})
```

**`app/api/stripe/checkout/route.ts`** — criar sessão de checkout:
```ts
// POST — recebe { priceId } e retorna { url }
// Criar ou recuperar stripeCustomerId do usuário
// Criar checkout session com success_url e cancel_url
// Retornar a URL do checkout
```

**`app/api/stripe/portal/route.ts`** — portal de billing:
```ts
// POST — redireciona para Stripe Customer Portal
// Para o usuário gerenciar/cancelar a assinatura
```

**`app/api/stripe/webhook/route.ts`** — webhooks:
```ts
// POST — processar eventos do Stripe:
// checkout.session.completed → ativar assinatura
// customer.subscription.updated → atualizar status/plano
// customer.subscription.deleted → downgrade para free
// invoice.payment_failed → marcar como past_due
```

### 7.5 Middleware de Limites

```ts
// src/lib/plan-limits.ts
export async function checkPlanLimit(
  userId: string,
  resource: 'clients' | 'projects' | 'contracts' | 'recurrences'
): Promise<{ allowed: boolean; limit: number; current: number }> {
  // 1. Buscar subscription do usuário
  // 2. Determinar o plano (free ou pro)
  // 3. Contar registros atuais do recurso
  // 4. Comparar com o limite do plano
  // 5. Retornar { allowed, limit, current }
}
```

Chamar `checkPlanLimit` em todas as Server Actions de criação (createClient, createProject, etc.) antes de inserir no banco. Se `!allowed`, retornar erro com mensagem de upgrade.

### 7.6 Página de Planos

Criar `app/(app)/settings/billing/page.tsx`:

```
Layout:
┌─────────────────────────────────────────────┐
│  Plano atual: Gratuito                      │
│  [card com limites e uso atual]             │
├─────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────────────┐ │
│  │   Gratuito   │  │        Pro           │ │
│  │   R$0/mês    │  │      R$49/mês        │ │
│  │   3 clientes │  │  Tudo ilimitado      │ │
│  │   [Atual]    │  │  [Fazer upgrade]     │ │
│  └──────────────┘  └──────────────────────┘ │
└─────────────────────────────────────────────┘
```

### 7.7 Banner de Limite Atingido

Mostrar globalmente quando o usuário atinge um limite do plano free:

```tsx
// src/components/billing/UpgradeBanner.tsx
// Banner fixo no topo da área autenticada quando limit reached
// "Você atingiu o limite de 3 clientes no plano Gratuito. [Fazer upgrade →]"
// Cor: bg-accent-light border-accent text-primary-800
```

---

## 8. Variáveis de Ambiente Completas

```
# Banco
DATABASE_URL=

# Supabase Storage
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# Email
RESEND_API_KEY=

# Stripe
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_PRO_PRICE_ID=
STRIPE_WEBHOOK_SECRET=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_SECRET=
```

---

## 9. Convenções de Código

### Nomenclatura
- Componentes: PascalCase (`ProjectCard`, `StatusBadge`)
- Server Actions: camelCase com verbo (`createProject`, `updateProjectStage`)
- Queries: camelCase com verbo + entidade (`getProjectById`, `getClientsByUser`)
- Hooks: prefixo `use` (`usePlanLimit`, `useCopyToClipboard`)
- Arquivos de componente: kebab-case (`project-card.tsx`, `status-badge.tsx`)

### Server Actions — padrão de retorno
```ts
// Sempre retornar este formato
type ActionResult<T = void> = 
  | { success: true; data: T }
  | { success: false; error: string }

// Exemplo
export async function createProject(data: CreateProjectInput): Promise<ActionResult<Project>> {
  try {
    // 1. Autenticar usuário (Clerk)
    // 2. Verificar limite do plano
    // 3. Validar com Zod
    // 4. Inserir no banco
    // 5. Revalidar path
    return { success: true, data: project }
  } catch (error) {
    return { success: false, error: 'Erro ao criar projeto. Tente novamente.' }
  }
}
```

### Feedback ao usuário (Toaster buildgrid-ui)
```tsx
// Em todo componente cliente que chama Server Action
import { toast } from 'buildgrid-ui' // ou useToast do buildgrid-ui

const result = await createProject(data)
if (result.success) {
  toast({ title: 'Projeto criado', variant: 'success' })
  router.push(`/projects/${result.data.id}`)
} else {
  toast({ title: 'Erro', description: result.error, variant: 'destructive' })
}
```

### Loading states
```tsx
// Sempre usar Skeleton do buildgrid-ui em loading.tsx
import { Skeleton } from 'buildgrid-ui'

export default function Loading() {
  return (
    <div className="flex flex-col gap-4 px-6 py-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}
```

---

## 10. Ordem de Implementação

Seguir a ordem do `TASKS.md`. Resumo das prioridades:

**Fase crítica (não pule):**
1. Setup + banco + auth (Fases 0, 1, 2)
2. Clientes + pipelines (Fases 3, 4)
3. Projetos com portal (Fases 5, 9)

**Fase de valor (depois do fluxo básico):**
4. Contratos + recorrências + email (Fases 6, 7)
5. Catálogo (Fase 8)
6. Dashboard (Fase 10)

**Monetização (pode ser paralelo ao desenvolvimento):**
7. Stripe + planos + billing (seção 7 deste guia)
   - Configurar Stripe no início (criar produtos/preços no dashboard)
   - Implementar webhook e tabela `subscriptions` junto com a Fase 1
   - UI de billing na Fase de polimento

**Validar antes de avançar entre fases:**
- Fase 0→1: conexão com Supabase funciona, `drizzle-kit migrate` sem erros
- Fase 1→2: tabelas criadas corretamente no dashboard Supabase
- Fase 2→3: login/logout funciona, `syncUser()` cria o usuário no banco
- Fase 4→5: criar pipeline com etapas funciona em `/settings/pipelines`
- Fase 5→9: portal abre com token válido e retorna 404 com token inválido

---

## 11. Referências

- buildgrid-ui docs: https://adrianomaringolo.github.io/buildgrid-ui/docs/intro
- buildgrid-ui Storybook: https://main--6944355833ad98d1ee729cd0.chromatic.com
- Lucide icons: https://lucide.dev/icons
- Drizzle + Supabase: https://orm.drizzle.team/docs/tutorials/drizzle-with-supabase
- Clerk Next.js: https://clerk.com/docs/quickstarts/nextjs
- Stripe Next.js: https://stripe.com/docs/stripe-js/react
- Resend + React Email: https://resend.com/docs/send-with-nextjs
