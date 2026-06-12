# SETUP.md — Configurando o Praxfy pela primeira vez

Guia para quem vai rodar o projeto do zero. Ao final você terá todos os
serviços externos criados, o `.env.local` preenchido e o app rodando em
`http://localhost:3000`.

**Serviços necessários** (todos têm plano gratuito suficiente para desenvolvimento):

| Serviço | Para quê | Onde criar conta |
|---|---|---|
| Supabase | Banco PostgreSQL + Storage de documentos | https://supabase.com |
| Clerk | Autenticação (login, cadastro, sessões) | https://clerk.com |
| Resend | Envio de emails transacionais | https://resend.com |
| Stripe | Assinaturas do plano Pro | https://stripe.com |
| Vercel | Deploy + cron job de recorrências | https://vercel.com |

---

## 0. Pré-requisitos locais

- Node.js 20+ e npm
- Git

```bash
git clone git@github.com:adrianomaringolo/praxfy.git
cd praxfy
npm install
cp .env.example .env.local   # se o .env.local ainda não existir
```

Todas as chaves abaixo vão no `.env.local` (nunca commitá-lo — já está no
`.gitignore`).

---

## 1. Supabase (banco + storage)

1. Acesse https://supabase.com/dashboard → **New project**.
   - Nome sugerido: `praxfy` (ou `praxfy-dev`)
   - Defina e **guarde a senha do banco** — ela entra na connection string.
   - Região: `South America (São Paulo)` para menor latência no Brasil.

2. **Connection string do banco** → `DATABASE_URL`
   - Vá em **Project Settings → Database → Connection string**.
   - Selecione a aba **Transaction** (Connection Pooler, porta `6543`) —
     **não** use a conexão direta (porta 5432).
   - Formato esperado:
     ```
     postgresql://postgres.[ref]:[SENHA]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres
     ```

3. **Chaves de API** → `NEXT_PUBLIC_SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`
   - Vá em **Project Settings → API**.
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL` (ex: `https://abcd1234.supabase.co`)
   - `service_role` (em "Project API keys") → `SUPABASE_SERVICE_ROLE_KEY`
   - ⚠️ A service role key dá acesso total ao projeto. Só é usada
     server-side; nunca a exponha no cliente nem a versione.

4. **Bucket de documentos**
   - Vá em **Storage → New bucket**.
   - Nome: `documents` (exatamente esse — o código referencia por nome).
   - **Public bucket: desabilitado** (acesso privado por padrão).

5. **Rodar as migrations** (depois do `DATABASE_URL` preenchido):
   ```bash
   npx drizzle-kit migrate
   ```
   Valide no **Table Editor** do Supabase: devem existir 13 tabelas
   (`users`, `clients`, `pipelines`, `pipeline_stages`, `service_catalog`,
   `projects`, `project_logs`, `project_links`, `project_documents`,
   `contracts`, `recurrences`, `recurrence_occurrences`, `subscriptions`).

---

## 2. Clerk (autenticação)

1. Acesse https://dashboard.clerk.com → **Create application**.
   - Nome: `Praxfy`
   - Métodos de login sugeridos: **Email** + **Google**.

2. **Chaves** → em **Configure → API Keys** (ou na tela inicial do app):
   - `Publishable key` (começa com `pk_test_`) → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `Secret key` (começa com `sk_test_`) → `CLERK_SECRET_KEY`

3. **URLs de redirecionamento** — já vêm prontas no `.env.example`, não
   precisa alterar:
   ```
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
   NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding
   ```

4. Em desenvolvimento nada mais é necessário. Para **produção**, crie uma
   "production instance" no Clerk e configure o domínio do app
   (Configure → Domains).

---

## 3. Resend (email)

1. Acesse https://resend.com → crie a conta.
2. **API key** → em **API Keys → Create API Key** (permissão "Sending access").
   - Resultado (começa com `re_`) → `RESEND_API_KEY`
3. **Domínio de envio**:
   - Em desenvolvimento dá para testar com o domínio sandbox
     `onboarding@resend.dev` (só envia para o seu próprio email).
   - Para produção: **Domains → Add Domain**, adicione os registros
     DNS (SPF/DKIM) indicados e aguarde a verificação. Os emails de
     recorrência partirão desse domínio (ex: `avisos@seudominio.com.br`).

---

## 4. Stripe (assinaturas — plano Pro)

> Pode ser deixado por último: o app funciona no plano Gratuito sem Stripe.

1. Acesse https://dashboard.stripe.com → crie a conta e mantenha o
   **modo Test** durante o desenvolvimento.

2. **Chaves** → em **Developers → API keys**:
   - `Secret key` (`sk_test_...`) → `STRIPE_SECRET_KEY`
   - `Publishable key` (`pk_test_...`) → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
     e `STRIPE_PUBLISHABLE_KEY` (mesmo valor)

3. **Produto e preço do plano Pro**:
   - **Product catalog → Add product**
   - Nome: `Praxfy Pro` · Preço: `R$ 49,00` · Recorrência: **Mensal** · Moeda: **BRL**
   - Copie o **Price ID** (começa com `price_`) → `STRIPE_PRO_PRICE_ID`

4. **Webhook** (necessário para ativar/cancelar assinaturas):
   - Em produção: **Developers → Webhooks → Add endpoint**
     - URL: `https://SEU-DOMINIO/api/stripe/webhook`
     - Eventos: `checkout.session.completed`,
       `customer.subscription.updated`, `customer.subscription.deleted`,
       `invoice.payment_failed`
     - `Signing secret` (`whsec_...`) → `STRIPE_WEBHOOK_SECRET`
   - Em desenvolvimento, use a CLI do Stripe:
     ```bash
     stripe listen --forward-to localhost:3000/api/stripe/webhook
     ```
     O comando imprime o `whsec_...` temporário → `STRIPE_WEBHOOK_SECRET`.

---

## 5. Variáveis do app

```
NEXT_PUBLIC_APP_URL=http://localhost:3000   # em produção: https://seu-dominio
CRON_SECRET=                                # string aleatória — proteja o endpoint de cron
```

Gere o `CRON_SECRET` com:

```bash
openssl rand -hex 32
```

---

## 6. Checklist do `.env.local`

| Variável | Origem |
|---|---|
| `DATABASE_URL` | Supabase → Settings → Database → Connection string (**Transaction**, porta 6543) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk → API Keys → Publishable key |
| `CLERK_SECRET_KEY` | Clerk → API Keys → Secret key |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` etc. | Fixas — já corretas no `.env.example` |
| `RESEND_API_KEY` | Resend → API Keys |
| `STRIPE_SECRET_KEY` | Stripe → Developers → API keys |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe → Developers → API keys |
| `STRIPE_PRO_PRICE_ID` | Stripe → Product catalog → Praxfy Pro → Price ID |
| `STRIPE_WEBHOOK_SECRET` | Stripe → Webhooks (ou `stripe listen` em dev) |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` em dev |
| `CRON_SECRET` | `openssl rand -hex 32` |

---

## 7. Subindo o projeto

```bash
npx drizzle-kit migrate   # cria as tabelas (precisa do DATABASE_URL)
npm run dev               # http://localhost:3000
```

Smoke test:

1. `http://localhost:3000` abre a página inicial.
2. `/sign-up` cria uma conta via Clerk e redireciona para `/onboarding`.
3. No Supabase Table Editor, a tabela `users` ganha uma linha após o login
   (sincronização via `syncUser`, Fase 2).

---

## 8. Deploy na Vercel

1. https://vercel.com → **Add New → Project** → importe o repositório
   `adrianomaringolo/praxfy`.
2. Em **Settings → Environment Variables**, cadastre todas as variáveis do
   checklist acima com os valores de **produção** (Clerk production
   instance, Stripe live keys, `NEXT_PUBLIC_APP_URL` com o domínio final).
3. O cron de recorrências é declarado no `vercel.json`
   (`/api/cron/recurrences`, diariamente às 8h UTC — Fase 7). A Vercel envia
   o header `Authorization: Bearer ${CRON_SECRET}` automaticamente quando a
   variável `CRON_SECRET` existe no projeto.
4. Após o primeiro deploy, atualize o endpoint do webhook do Stripe para o
   domínio de produção.

---

## Problemas comuns

| Sintoma | Causa provável |
|---|---|
| `drizzle-kit migrate` falha com timeout/DNS | `DATABASE_URL` usando conexão direta (5432) em vez do pooler (6543), ou senha errada |
| Upload de documento falha com 403 | Bucket `documents` não existe ou `SUPABASE_SERVICE_ROLE_KEY` ausente |
| Login redireciona em loop | Chaves do Clerk ausentes/inválidas no `.env.local` (reinicie o `npm run dev` após editar) |
| Webhook Stripe retorna 400 | `STRIPE_WEBHOOK_SECRET` não corresponde ao endpoint (cada endpoint/`stripe listen` tem o seu) |
| Cron retorna 401 | `CRON_SECRET` divergente entre Vercel e o código |
