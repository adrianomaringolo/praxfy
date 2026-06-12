# Praxfy

Plataforma de gestão de serviços para profissionais autônomos e pequenas
empresas de qualquer segmento. Organize clientes, projetos com pipelines de
etapas, contratos recorrentes, recorrências com lembretes por email e um
portal público para o cliente acompanhar o andamento — tudo em um só lugar.

## Funcionalidades

- **Clientes** — cadastro com tags, notas e visão dos serviços vinculados
- **Pipelines** — etapas configuráveis com cores e reordenação
- **Projetos** — acompanhamento por etapa, logs, links, documentos e portal
- **Contratos** — serviços recorrentes com status e portal próprio
- **Recorrências** — lembretes automáticos por email (cron diário)
- **Catálogo** — serviços oferecidos com preço base de referência
- **Portal do cliente** — link público por token, sem login
- **Planos** — Gratuito (com limites) e Pro via Stripe

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 15 (App Router) + TypeScript |
| UI | buildgrid-ui + Tailwind CSS v3 + Lucide React |
| Banco | PostgreSQL (Supabase) + Drizzle ORM |
| Auth | Clerk |
| Email | Resend + React Email |
| Storage | Supabase Storage |
| Pagamentos | Stripe |
| Deploy | Vercel (com cron) |
| Validação | Zod |

## Pré-requisitos

- Node.js 20+
- Contas: [Supabase](https://supabase.com), [Clerk](https://clerk.com),
  [Resend](https://resend.com), [Stripe](https://stripe.com) (opcional em dev)
  e [Vercel](https://vercel.com) (deploy)

> O passo a passo detalhado de criação e configuração de cada serviço está
> no **[SETUP.md](./SETUP.md)**.

## Setup local

```bash
git clone git@github.com:adrianomaringolo/praxfy.git
cd praxfy
npm install
cp .env.example .env.local   # preencha as chaves (ver SETUP.md)

npx drizzle-kit migrate      # cria as tabelas no Supabase
npm run dev                  # http://localhost:3000
```

Dados de exemplo (opcional):

```bash
npx tsx src/db/seed.ts
```

## Variáveis de ambiente

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | Connection string do Supabase (Transaction Pooler, porta 6543) |
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (somente server-side) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Publishable key do Clerk |
| `CLERK_SECRET_KEY` | Secret key do Clerk |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | `/dashboard` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | `/onboarding` |
| `RESEND_API_KEY` | API key do Resend |
| `STRIPE_SECRET_KEY` | Secret key do Stripe |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Publishable key do Stripe |
| `STRIPE_PRO_PRICE_ID` | Price ID do plano Pro (R$49/mês) |
| `STRIPE_WEBHOOK_SECRET` | Signing secret do webhook |
| `NEXT_PUBLIC_APP_URL` | URL base do app (`http://localhost:3000` em dev) |
| `CRON_SECRET` | Secret do endpoint de cron (`openssl rand -hex 32`) |

## Estrutura

```
src/
├── actions/        # Server Actions (um arquivo por entidade)
├── app/
│   ├── (auth)/     # Sign-in / sign-up (Clerk)
│   ├── (app)/      # Área autenticada (dashboard, clientes, projetos...)
│   ├── p/[token]/  # Portal público do cliente
│   └── api/cron/   # Cron de recorrências
├── components/     # Componentes por domínio
├── db/             # Conexão, schema, migrations, queries e seed
├── emails/         # Templates React Email
└── lib/            # Auth, planos, validações Zod, utilitários
```

## Deploy na Vercel

1. Importe o repositório na Vercel.
2. Cadastre todas as variáveis de ambiente com valores de produção.
3. O cron diário (`/api/cron/recurrences`, 8h UTC) é configurado pelo
   `vercel.json`; a Vercel envia o header com `CRON_SECRET` automaticamente.
4. Aponte o webhook do Stripe para `https://SEU-DOMINIO/api/stripe/webhook`.

Detalhes em [SETUP.md](./SETUP.md).
