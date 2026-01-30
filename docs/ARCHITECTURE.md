# ARQUITETURA DO SISTEMA - ELECTROHUB

## 📌 VISÃO GERAL

O ElectroHub é uma plataforma de geração de imagens de marketing para e-commerce, utilizando IA e integração com n8n para automação.

---

## 🏗️ DIAGRAMA DE ARQUITETURA

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                   ELECTROHUB ARCHITECTURE                            │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                      FRONTEND                                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │   React     │  │  Tailwind   │  │   shadcn    │  │   Vite      │                 │
│  │   18.3.1    │  │    CSS      │  │     UI      │  │   Build     │                 │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘                 │
│                                                                                       │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │                              PAGES (React Router)                              │  │
│  │  /painel  /gerador-anuncios  /gerador-unificado  /system-status  /admin/*     │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                       │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │                                   HOOKS                                         │  │
│  │  useSystemStatus  useUserRole  useSubscription  useBrandSettings  useApiKeys   │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          │ HTTPS
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                  LOVABLE CLOUD                                        │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │                              SUPABASE                                        │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │    │
│  │  │   Auth      │  │  Database   │  │   Storage   │  │   Realtime  │        │    │
│  │  │  (JWT)      │  │ (PostgreSQL)│  │  (S3-like)  │  │  (WebSocket)│        │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │    │
│  │                                                                               │    │
│  │  ┌─────────────────────────────────────────────────────────────────────┐    │    │
│  │  │                         EDGE FUNCTIONS (Deno)                        │    │    │
│  │  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐           │    │    │
│  │  │  │  n8n-proxy    │  │ redis-callback│  │ unified-cmds  │           │    │    │
│  │  │  └───────────────┘  └───────────────┘  └───────────────┘           │    │    │
│  │  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐           │    │    │
│  │  │  │ check-admin   │  │ check-sub     │  │ customer-port │           │    │    │
│  │  │  └───────────────┘  └───────────────┘  └───────────────┘           │    │    │
│  │  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐           │    │    │
│  │  │  │ cloudinary-*  │  │ stripe-*      │  │ manage-keys   │           │    │    │
│  │  │  └───────────────┘  └───────────────┘  └───────────────┘           │    │    │
│  │  └─────────────────────────────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          │ HTTPS
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              EXTERNAL SERVICES                                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │    n8n      │  │   Stripe    │  │ Cloudinary  │  │   OpenAI    │                 │
│  │  Workflows  │  │  Payments   │  │   Media     │  │    GPT      │                 │
│  └──────┬──────┘  └─────────────┘  └─────────────┘  └─────────────┘                 │
│         │                                                                             │
│         │         ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│         │         │   Gemini    │  │  Stability  │  │   Runware   │                 │
│         │         │   Google    │  │     AI      │  │     API     │                 │
│         │         └─────────────┘  └─────────────┘  └─────────────┘                 │
│         │                                                                             │
│         ▼                                                                             │
│  ┌─────────────┐                                                                      │
│  │   Redis     │ ◄──── Worker Status + Queue                                         │
│  │  (Upstash)  │                                                                      │
│  └─────────────┘                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 FLUXOS PRINCIPAIS

### 1. Autenticação

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Login   │ ──► │ Supabase │ ──► │   JWT    │ ──► │ Frontend │
│  Form    │     │   Auth   │     │  Token   │     │  State   │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                       │
                       ▼
                 ┌──────────┐
                 │ Trigger  │ ──► user_roles + user_credits
                 │ New User │
                 └──────────┘
```

### 2. Geração de Imagem via n8n

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│ Frontend │ ──► │ n8n-proxy│ ──► │   n8n    │ ──► │   IA     │
│  React   │     │  (Edge)  │     │ Workflow │     │  (GPT/   │
└──────────┘     └──────────┘     └──────────┘     │  Gemini) │
                                        │          └──────────┘
                                        ▼
                                  ┌──────────┐
                                  │ redis-   │ ──► generated_images_batch
                                  │ callback │
                                  └──────────┘
```

### 3. Monitoramento de Status

```
┌──────────┐     ┌──────────────────────────┐     ┌──────────┐
│ Frontend │ ──► │ GET /webhook/system-status│ ──► │  Redis   │
│ (30s)    │     │       (n8n público)       │     │  Status  │
└──────────┘     └──────────────────────────┘     └──────────┘
      │
      ▼
┌─────────────────────────────┐
│ useSystemStatus.ts          │
│ - CRITICAL: worker offline  │
│ - WARNING: queue >= 10      │
│ - NORMAL: default           │
└─────────────────────────────┘
```

### 4. Checkout de Créditos

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│ Frontend │ ──► │ Edge Fn  │ ──► │  Stripe  │ ──► │ Checkout │
│  Button  │     │ checkout │     │   API    │     │   Page   │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                                        │
                                        ▼ (webhook)
                                  ┌──────────┐
                                  │ verify-  │ ──► user_credits
                                  │ payment  │
                                  └──────────┘
```

---

## 📊 TABELAS PRINCIPAIS

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              DATABASE SCHEMA                                      │
└─────────────────────────────────────────────────────────────────────────────────┘

CORE:
├── user_roles          (user_id, role: admin/user)
├── user_credits        (user_id, credits_balance, credits_used)
├── user_subscriptions  (user_id, stripe_customer_id, status)
├── credit_purchases    (user_id, credits_amount, price_paid, status)
└── credit_usage        (user_id, credits_spent, operation_type)

PRODUTOS:
├── produtos            (usuario_id, nome, sku, imagens...)
├── hosted_images       (user_id, url, product_id)
├── marketing_templates (user_id, name, zones, config)
└── ai_unified_results  (user_id, product_id, results)

FILA & PROCESSAMENTO:
├── image_generation_queue  (user_id, status, input_data)
├── generation_metrics      (job_id, processing_time_ms, cost)
├── generated_images_batch  (job_id, user_id, images[])
├── authorized_jobs         (job_id, user_id, expires_at)
├── processed_callbacks     (job_id, callback_hash)
└── n8n_generation_logs     (user_id, webhook_url, status)

CONFIGURAÇÃO:
├── brand_settings      (user_id, logo_url, logo_position)
├── automation_settings (user_id, paused)
├── user_api_keys       (user_id, provider, api_key_encrypted)
└── usuarios            (user_id, bling_token...)
```

---

## 🔧 EDGE FUNCTIONS

| Função | JWT | Descrição |
|--------|-----|-----------|
| `n8n-proxy` | ❌ | Proxy para webhooks n8n |
| `redis-callback` | ❌ | Recebe callbacks do n8n |
| `unified-commands` | ❌ | Comandos IA unificados |
| `check-admin` | ✅ | Verifica role admin |
| `check-subscription` | ✅ | Verifica assinatura |
| `create-credits-checkout` | ✅ | Checkout Stripe |
| `customer-portal` | ✅ | Portal Stripe |
| `cloudinary-transform` | ❌ | Transformação de imagens |
| `manage-api-keys` | ✅ | Gerencia API keys |

---

## 🔐 SEGURANÇA

### RLS (Row Level Security)

Todas as tabelas têm RLS habilitado com políticas:

- **user_id = auth.uid()**: Usuário só vê seus dados
- **is_admin(auth.uid())**: Admins veem tudo
- **service_role**: Backend pode tudo

### Autenticação

```
Frontend ──► Supabase Auth ──► JWT Token
                                   │
                                   ▼
                          Edge Functions
                          (verify_jwt = true)
```

### Secrets

- Armazenados no Lovable Cloud
- Nunca expostos ao frontend
- Acessíveis apenas nas Edge Functions

---

## 📁 ESTRUTURA DE PASTAS

```
electrohub/
├── src/
│   ├── components/
│   │   ├── ui/              # shadcn components
│   │   ├── auth/            # RequireAuth, RequireAdmin
│   │   ├── dashboard/       # Dashboard components
│   │   └── settings/        # Settings components
│   ├── hooks/
│   │   ├── useSystemStatus.ts
│   │   ├── useUserRole.ts
│   │   ├── useSubscription.ts
│   │   └── ...
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── SystemStatus.tsx
│   │   └── admin/
│   ├── integrations/
│   │   └── supabase/
│   └── App.tsx
│
├── supabase/
│   ├── functions/
│   │   ├── n8n-proxy/
│   │   ├── redis-callback/
│   │   └── ...
│   ├── config.toml
│   └── sql/
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── API_CONTRACTS.md
│   ├── N8N_INTEGRATION.md
│   └── SQL_COMPLETE.sql
│
└── .env.example
```

---

## 🚀 DEPLOY

### Lovable Cloud

1. Push para GitHub → Auto-deploy
2. Edge Functions são deployadas automaticamente
3. Migrations são aplicadas via interface

### Requisitos

- Node.js 18+
- Supabase CLI (para desenvolvimento local)
- Conta Stripe (pagamentos)
- Conta Cloudinary (imagens)
- n8n self-hosted ou cloud (automação)

---

## 📈 ESCALABILIDADE

### Atual

- ~100 usuários simultâneos
- ~1000 gerações/dia
- Queue com 2 workers (pg_cron)

### Futuro

- Adicionar mais workers
- Implementar rate limiting por usuário
- Cache com Redis para responses frequentes
- CDN para assets estáticos
