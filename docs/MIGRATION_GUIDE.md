# 📘 GUIA DE MIGRAÇÃO - ElectroHub

> Documento oficial para migração parcial do projeto para outra conta Lovable.

---

## 📋 ÍNDICE

1. [Páginas a Migrar](#1-páginas-a-migrar)
2. [Tabelas Supabase](#2-tabelas-supabase)
3. [Funções de Banco](#3-funções-de-banco)
4. [Edge Functions](#4-edge-functions)
5. [Secrets Necessárias](#5-secrets-necessárias)
6. [Storage Buckets](#6-storage-buckets)
7. [Hooks e Componentes](#7-hooks-e-componentes)
8. [Integrações Externas](#8-integrações-externas)
9. [Dependências NPM](#9-dependências-npm)
10. [Checklist de Migração](#10-checklist-de-migração)
11. [Scripts SQL](#11-scripts-sql)

---

## 1. PÁGINAS A MIGRAR

| Página | Rota | Arquivo | Auth |
|--------|------|---------|------|
| Dashboard | `/painel` | `src/pages/Dashboard.tsx` | ✅ |
| Gerador de Anúncios | `/gerador-anuncios` | `src/pages/AdGenerator.tsx` | ✅ |
| Gerador Unificado | `/gerador-unificado` | `src/pages/UnifiedAdGenerator.tsx` | ✅ |
| Auto Template Mapper | `/auto-template-mapper` | `src/pages/AutoTemplateMapperPage.tsx` | ✅ |
| Gerador de EAN | `/ean-generator` | `src/pages/EanGenerator.tsx` | ✅ |
| Configurações | `/configuracoes` | `src/pages/Settings.tsx` | ✅ |
| Status do Sistema | `/system-status` | `src/pages/SystemStatus.tsx` | ❌ |
| Admin Compras | `/admin/compras` | `src/pages/admin/AdminCompras.tsx` | 🔐 Admin |

---

## 2. TABELAS SUPABASE

### 2.1 Tabelas Core (OBRIGATÓRIAS)

```sql
-- user_roles: Controle de acesso admin/user
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- user_credits: Saldo de créditos
CREATE TABLE public.user_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  credits_balance INTEGER DEFAULT 0,
  credits_used INTEGER DEFAULT 0,
  last_purchase_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- user_subscriptions: Assinaturas Stripe
CREATE TABLE public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan_type TEXT,
  status TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- credit_purchases: Histórico de compras
CREATE TABLE public.credit_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  stripe_session_id TEXT,
  stripe_payment_id TEXT,
  credits_amount INTEGER NOT NULL,
  price_paid DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- credit_usage: Uso detalhado
CREATE TABLE public.credit_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  operation_type TEXT NOT NULL,
  credits_spent INTEGER NOT NULL,
  operation_details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 2.2 Tabelas de Produtos e Geração

```sql
-- produtos: Produtos do usuário
CREATE TABLE public.produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL,
  nome TEXT NOT NULL,
  sku TEXT,
  bling_id TEXT,
  descricao_curta TEXT,
  descricao_longa TEXT,
  preco DECIMAL(10,2),
  imagem_original TEXT,
  imagem_melhorada_1 TEXT,
  imagem_melhorada_2 TEXT,
  imagem_melhorada_3 TEXT,
  imagem_melhorada_4 TEXT,
  imagem_melhorada_5 TEXT,
  imagem_melhorada_6 TEXT,
  imagem_melhorada_7 TEXT,
  imagem_melhorada_8 TEXT,
  imagem_melhorada_9 TEXT,
  imagem_melhorada_10 TEXT,
  ativo BOOLEAN DEFAULT true,
  ready_for_ads BOOLEAN DEFAULT false,
  enhanced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- hosted_images: Imagens hospedadas
CREATE TABLE public.hosted_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  url TEXT NOT NULL,
  r2_path TEXT,
  original_filename TEXT,
  description TEXT,
  tags TEXT[],
  product_id UUID,
  template_id TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- marketing_templates: Templates de marketing
CREATE TABLE public.marketing_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  name TEXT NOT NULL,
  template_key TEXT,
  description TEXT,
  category TEXT,
  base_image_url TEXT,
  thumbnail_url TEXT,
  dimensions JSONB,
  zones JSONB,
  config JSONB,
  color_scheme JSONB,
  detected_fonts TEXT[],
  is_system BOOLEAN DEFAULT false,
  disable_global_logo BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ai_unified_results: Resultados IA consolidados
CREATE TABLE public.ai_unified_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id TEXT NOT NULL,
  results JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ai_usage_logs: Logs de uso de IA
CREATE TABLE public.ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  function_name TEXT NOT NULL,
  api_provider TEXT NOT NULL,
  model_used TEXT,
  command TEXT,
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  total_tokens INTEGER,
  estimated_cost_usd DECIMAL(10,6),
  estimated_cost_brl DECIMAL(10,6),
  usd_to_brl_rate DECIMAL(10,4),
  execution_time_ms INTEGER,
  success BOOLEAN,
  error_message TEXT,
  request_id TEXT,
  client_ip TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 2.3 Tabelas de Fila e Processamento

```sql
-- image_generation_queue: Fila de processamento
CREATE TABLE public.image_generation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  generation_type TEXT NOT NULL,
  input_data JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending',
  priority INTEGER DEFAULT 5,
  result JSONB,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  locked_by TEXT,
  locked_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  processing_time_ms INTEGER,
  queue_wait_time_ms INTEGER,
  credits_debited BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- generation_metrics: Métricas de geração
CREATE TABLE public.generation_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  job_id TEXT,
  generation_type TEXT NOT NULL,
  model_used TEXT,
  tokens_used INTEGER,
  processing_time_ms INTEGER,
  queue_wait_time_ms INTEGER,
  estimated_cost_usd DECIMAL(10,6),
  estimated_cost_brl DECIMAL(10,6),
  success BOOLEAN,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- generated_images_batch: Batches de imagens
CREATE TABLE public.generated_images_batch (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  job_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  images JSONB,
  metadata JSONB,
  error_message TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- authorized_jobs: Jobs autorizados
CREATE TABLE public.authorized_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  job_id TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  expected_images INTEGER,
  received_images INTEGER DEFAULT 0,
  metadata JSONB,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- processed_callbacks: Callbacks processados (dedup)
CREATE TABLE public.processed_callbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  job_id TEXT NOT NULL,
  template_id TEXT NOT NULL,
  callback_hash TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT now()
);

-- n8n_generation_logs: Logs n8n
CREATE TABLE public.n8n_generation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  webhook_url TEXT NOT NULL,
  product_name TEXT NOT NULL,
  scene_type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  request_payload JSONB,
  response_data JSONB,
  image_url TEXT,
  error_message TEXT,
  duration_ms INTEGER,
  attempts INTEGER DEFAULT 0,
  n8n_node_config JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 2.4 Tabelas de Configuração

```sql
-- brand_settings: Configurações de marca
CREATE TABLE public.brand_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  logo_url TEXT,
  logo_position TEXT DEFAULT 'bottom-right',
  logo_size INTEGER DEFAULT 80,
  show_logo_on_templates BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- automation_settings: Configurações de automação
CREATE TABLE public.automation_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  paused BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- user_api_keys: API Keys do usuário
CREATE TABLE public.user_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  provider TEXT NOT NULL,
  api_key_encrypted TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_exhausted BOOLEAN DEFAULT false,
  exhausted_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- admin_audit_logs: Logs de auditoria
CREATE TABLE public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_email TEXT,
  action TEXT NOT NULL,
  page_path TEXT NOT NULL,
  metadata JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- usuarios: Dados extras (Bling)
CREATE TABLE public.usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  bling_access_token TEXT,
  bling_refresh_token TEXT,
  bling_token_expires TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 3. FUNÇÕES DE BANCO

```sql
-- Enum para roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Função: is_admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'admin'
  );
$$;

-- Função: has_role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role::text
  );
$$;

-- Função: debit_generation_credit
CREATE OR REPLACE FUNCTION public.debit_generation_credit(p_user_id UUID, p_amount INTEGER DEFAULT 1)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_balance INTEGER;
BEGIN
  SELECT credits_balance INTO current_balance
  FROM public.user_credits
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF current_balance IS NULL OR current_balance < p_amount THEN
    RETURN FALSE;
  END IF;

  UPDATE public.user_credits
  SET 
    credits_balance = credits_balance - p_amount,
    credits_used = credits_used + p_amount,
    updated_at = now()
  WHERE user_id = p_user_id;

  RETURN TRUE;
END;
$$;

-- Função: check_user_queue_limits
CREATE OR REPLACE FUNCTION public.check_user_queue_limits(p_user_id UUID)
RETURNS TABLE(
  can_enqueue BOOLEAN,
  credits_remaining INTEGER,
  pending_jobs INTEGER,
  max_concurrent INTEGER,
  queue_priority INTEGER,
  reason TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_credits INTEGER;
  v_pending INTEGER;
  v_max_concurrent INTEGER := 5;
  v_priority INTEGER := 5;
BEGIN
  SELECT COALESCE(credits_balance, 0) INTO v_credits
  FROM public.user_credits WHERE user_id = p_user_id;

  SELECT COUNT(*) INTO v_pending
  FROM public.image_generation_queue
  WHERE user_id = p_user_id AND status IN ('pending', 'processing');

  IF v_credits <= 0 THEN
    RETURN QUERY SELECT FALSE, v_credits, v_pending, v_max_concurrent, v_priority, 'Sem créditos disponíveis';
    RETURN;
  END IF;

  IF v_pending >= v_max_concurrent THEN
    RETURN QUERY SELECT FALSE, v_credits, v_pending, v_max_concurrent, v_priority, 'Limite de jobs simultâneos atingido';
    RETURN;
  END IF;

  RETURN QUERY SELECT TRUE, v_credits, v_pending, v_max_concurrent, v_priority, 'OK';
END;
$$;

-- Função: acquire_queue_jobs
CREATE OR REPLACE FUNCTION public.acquire_queue_jobs(p_batch_size INTEGER DEFAULT 1)
RETURNS SETOF public.image_generation_queue
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_worker_id TEXT := gen_random_uuid()::text;
BEGIN
  RETURN QUERY
  WITH locked AS (
    SELECT id
    FROM public.image_generation_queue
    WHERE status = 'pending'
      AND (locked_at IS NULL OR locked_at < now() - interval '5 minutes')
    ORDER BY priority DESC, created_at ASC
    LIMIT p_batch_size
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.image_generation_queue q
  SET 
    status = 'processing',
    locked_by = v_worker_id,
    locked_at = now(),
    started_at = now(),
    queue_wait_time_ms = EXTRACT(EPOCH FROM (now() - q.created_at)) * 1000
  FROM locked
  WHERE q.id = locked.id
  RETURNING q.*;
END;
$$;

-- Função: complete_queue_job
CREATE OR REPLACE FUNCTION public.complete_queue_job(
  p_job_id UUID,
  p_success BOOLEAN,
  p_result JSONB DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL,
  p_model_used TEXT DEFAULT NULL,
  p_tokens_used INTEGER DEFAULT NULL,
  p_cost_usd DECIMAL DEFAULT NULL,
  p_cost_brl DECIMAL DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.image_generation_queue
  SET 
    status = CASE WHEN p_success THEN 'completed' ELSE 'failed' END,
    result = p_result,
    error_message = p_error_message,
    completed_at = now(),
    processing_time_ms = EXTRACT(EPOCH FROM (now() - started_at)) * 1000
  WHERE id = p_job_id;

  RETURN FOUND;
END;
$$;

-- Função: reset_stuck_jobs
CREATE OR REPLACE FUNCTION public.reset_stuck_jobs(
  p_stuck_threshold_minutes INTEGER DEFAULT 10,
  p_max_retries INTEGER DEFAULT 3
)
RETURNS TABLE(reset_count INTEGER, failed_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_reset INTEGER := 0;
  v_failed INTEGER := 0;
BEGIN
  -- Reset jobs que podem ser retentados
  UPDATE public.image_generation_queue
  SET 
    status = 'pending',
    locked_by = NULL,
    locked_at = NULL,
    retry_count = retry_count + 1
  WHERE status = 'processing'
    AND locked_at < now() - (p_stuck_threshold_minutes || ' minutes')::interval
    AND retry_count < p_max_retries;
  GET DIAGNOSTICS v_reset = ROW_COUNT;

  -- Marca como falhos os que excederam retries
  UPDATE public.image_generation_queue
  SET 
    status = 'failed',
    error_message = 'Max retries exceeded',
    completed_at = now()
  WHERE status = 'processing'
    AND locked_at < now() - (p_stuck_threshold_minutes || ' minutes')::interval
    AND retry_count >= p_max_retries;
  GET DIAGNOSTICS v_failed = ROW_COUNT;

  RETURN QUERY SELECT v_reset, v_failed;
END;
$$;

-- Função: cleanup_completed_jobs
CREATE OR REPLACE FUNCTION public.cleanup_completed_jobs(p_retention_hours INTEGER DEFAULT 24)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM public.image_generation_queue
  WHERE status IN ('completed', 'failed')
    AND completed_at < now() - (p_retention_hours || ' hours')::interval;
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

-- Trigger: Criar créditos para novo usuário
CREATE OR REPLACE FUNCTION public.handle_new_user_credits()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_credits (user_id, credits_balance)
  VALUES (NEW.id, 5)
  ON CONFLICT (user_id) DO NOTHING;
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_credits();
```

---

## 4. EDGE FUNCTIONS

### Lista de Edge Functions

| Função | JWT | Descrição |
|--------|-----|-----------|
| `check-admin` | ✅ | Verifica se usuário é admin |
| `check-subscription` | ✅ | Verifica status da assinatura |
| `create-credits-checkout` | ✅ | Cria checkout de créditos Stripe |
| `create-subscription-checkout` | ✅ | Cria checkout de assinatura |
| `customer-portal` | ✅ | Abre portal do cliente Stripe |
| `manage-api-keys` | ✅ | Gerencia API keys do usuário |
| `manage-gemini-keys` | ✅ | Gerencia keys Gemini |
| `unified-commands` | ❌ | Comandos IA unificados |
| `gemini-background-generator` | ❌ | Geração com Gemini |
| `cloudinary-transform` | ❌ | Transformações Cloudinary |
| `cloudinary-upscale` | ❌ | Upscale de imagens |
| `queue-image` | ❌ | Adiciona job à fila |
| `process-queue` | ❌ | Processa fila |
| `check-queue-status` | ❌ | Status da fila |
| `n8n-proxy` | ❌ | Proxy para n8n |
| `redis-callback` | ❌ | Callback do Redis |
| `image-stream` | ❌ | Stream de imagens |
| `import-templates` | ❌ | Importa templates |
| `preflight-check` | ❌ | Verificação preflight |

### Configuração (supabase/config.toml)

```toml
project_id = "SEU_PROJECT_ID"

[functions.check-admin]
verify_jwt = true

[functions.check-subscription]
verify_jwt = true

[functions.create-credits-checkout]
verify_jwt = true

[functions.create-subscription-checkout]
verify_jwt = true

[functions.customer-portal]
verify_jwt = true

[functions.manage-api-keys]
verify_jwt = true

[functions.manage-gemini-keys]
verify_jwt = true

[functions.unified-commands]
verify_jwt = false

[functions.gemini-background-generator]
verify_jwt = false

[functions.cloudinary-transform]
verify_jwt = false

[functions.cloudinary-upscale]
verify_jwt = false

[functions.queue-image]
verify_jwt = false

[functions.process-queue]
verify_jwt = false

[functions.check-queue-status]
verify_jwt = false

[functions.n8n-proxy]
verify_jwt = false

[functions.redis-callback]
verify_jwt = false

[functions.image-stream]
verify_jwt = false

[functions.import-templates]
verify_jwt = false

[functions.preflight-check]
verify_jwt = false
```

---

## 5. SECRETS NECESSÁRIAS

### Obrigatórias

| Secret | Descrição |
|--------|-----------|
| `STRIPE_SECRET_KEY` | Chave secreta Stripe |
| `CLOUDINARY_API_KEY` | API Key Cloudinary |
| `CLOUDINARY_API_SECRET` | Secret Cloudinary |
| `CLOUDINARY_CLOUD_NAME` | Cloud name Cloudinary |
| `GOOGLE_GEMINI_API_KEY` | API Key Gemini |
| `OPENAI_API_KEY` | API Key OpenAI |

### Opcionais

| Secret | Descrição |
|--------|-----------|
| `N8N_CALLBACK_SECRET` | Secret para callbacks n8n |
| `INTERNAL_WORKER_SECRET` | Secret workers internos |
| `RESEND_API_KEY` | API Key Resend (emails) |
| `IMGBB_API_KEY` | API Key ImgBB |
| `STABILITY_API_KEY` | API Key Stability AI |
| `RUNWARE_API_KEY2` | API Key Runware |
| `BFL_API_KEY` | API Key Black Forest Labs |

---

## 6. STORAGE BUCKETS

```sql
-- Criar bucket para templates
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('marketing-templates', 'marketing-templates', true, 10485760);

-- Policy: Leitura pública
CREATE POLICY "Public read marketing-templates"
ON storage.objects FOR SELECT
USING (bucket_id = 'marketing-templates');

-- Policy: Upload autenticado
CREATE POLICY "Authenticated upload marketing-templates"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'marketing-templates' AND auth.role() = 'authenticated');
```

---

## 7. HOOKS E COMPONENTES

### Hooks Essenciais (src/hooks/)

```
useUserRole.ts          - Role do usuário (admin/user)
useAdminAuth.ts         - Autenticação admin
useAdminAudit.ts        - Auditoria de ações admin
useDashboardData.ts     - Dados do dashboard
useSystemStatus.ts      - Status do sistema (endpoint externo)
useSubscription.ts      - Status da assinatura
useEnhancementUsage.ts  - Uso de créditos
useBrandSettings.ts     - Configurações de marca
useMarketingTemplates.ts - Templates de marketing
useTemplateAIMapper.ts  - Mapeamento IA de templates
useHostedImages.ts      - Imagens hospedadas
useBatchResults.ts      - Resultados em batch
useApiKeys.ts           - Gerenciamento de API keys
useGeminiApiKeys.ts     - Keys Gemini específicas
```

### Componentes Essenciais

```
src/components/layouts/
  DashboardLayout.tsx
  NavigationItems.tsx

src/components/auth/
  RequireAuth.tsx
  RequireAdmin.tsx
  SecureWrapper.tsx

src/components/dashboard/
  AdminDashboard.tsx
  UserDashboard.tsx
  CreditsCompactBadge.tsx

src/components/settings/
  ApiKeysManager.tsx
  
src/components/marketing/
  GlobalLogoSettings.tsx
```

---

## 8. INTEGRAÇÕES EXTERNAS

### Endpoint n8n (System Status)

```
URL: GET https://nwh.visualvendas.cloud/webhook/system-status
Tipo: Público, read-only
Polling: 30 segundos
```

**Resposta:**
```json
{
  "status": "OK",
  "worker_status": "NORMAL",
  "queue_size": 0,
  "checked_at": "2026-01-13T23:03:20.465-03:00"
}
```

### Stripe

- Checkout de créditos (pacotes)
- Checkout de assinatura (mensal/anual)
- Customer Portal
- Webhooks para pagamentos

### Cloudinary

- Transformações de imagem
- Upscale
- Hospedagem CDN

---

## 9. DEPENDÊNCIAS NPM

```json
{
  "@supabase/supabase-js": "^2.89.0",
  "@tanstack/react-query": "^5.56.2",
  "@radix-ui/react-tabs": "^1.1.0",
  "@radix-ui/react-dialog": "^1.1.2",
  "@radix-ui/react-dropdown-menu": "^2.1.1",
  "@radix-ui/react-tooltip": "^1.1.4",
  "class-variance-authority": "^0.7.1",
  "clsx": "^2.1.1",
  "date-fns": "^3.6.0",
  "lucide-react": "^0.462.0",
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "react-router-dom": "^6.26.2",
  "recharts": "^2.12.7",
  "sonner": "^1.5.0",
  "tailwind-merge": "^2.5.2",
  "tailwindcss-animate": "^1.0.7",
  "xlsx": "^0.18.5",
  "zod": "^3.23.8"
}
```

---

## 10. CHECKLIST DE MIGRAÇÃO

### ✅ Fase 1: Setup Inicial
- [ ] Criar novo projeto Lovable
- [ ] Habilitar Lovable Cloud
- [ ] Conectar ao GitHub

### ✅ Fase 2: Banco de Dados
- [ ] Criar todas as tabelas (SQL acima)
- [ ] Criar funções de banco
- [ ] Criar enum `app_role`
- [ ] Criar trigger de novo usuário
- [ ] Habilitar RLS em todas as tabelas
- [ ] Criar policies RLS
- [ ] Criar storage bucket `marketing-templates`

### ✅ Fase 3: Secrets
- [ ] Configurar `STRIPE_SECRET_KEY`
- [ ] Configurar `CLOUDINARY_API_KEY`
- [ ] Configurar `CLOUDINARY_API_SECRET`
- [ ] Configurar `CLOUDINARY_CLOUD_NAME`
- [ ] Configurar `GOOGLE_GEMINI_API_KEY`
- [ ] Configurar `OPENAI_API_KEY`
- [ ] Configurar secrets opcionais conforme necessidade

### ✅ Fase 4: Edge Functions
- [ ] Copiar pasta `supabase/functions/`
- [ ] Verificar/atualizar `supabase/config.toml`
- [ ] Deploy automático das funções

### ✅ Fase 5: Frontend
- [ ] Copiar páginas necessárias (`src/pages/`)
- [ ] Copiar hooks necessários (`src/hooks/`)
- [ ] Copiar componentes (`src/components/`)
- [ ] Copiar types (`src/types/`)
- [ ] Atualizar `src/App.tsx` com rotas

### ✅ Fase 6: Testes
- [ ] Testar autenticação (login/signup)
- [ ] Testar dashboard
- [ ] Testar gerador de anúncios
- [ ] Testar configurações
- [ ] Testar status do sistema
- [ ] Testar admin compras
- [ ] Testar pagamentos Stripe

---

## 11. SCRIPTS SQL

### RLS Policies (exemplo para user_credits)

```sql
-- Enable RLS
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

-- Users can read their own credits
CREATE POLICY "Users can read own credits"
ON public.user_credits FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own credits (via functions)
CREATE POLICY "Users can update own credits"
ON public.user_credits FOR UPDATE
USING (auth.uid() = user_id);

-- System can insert credits
CREATE POLICY "System can insert credits"
ON public.user_credits FOR INSERT
WITH CHECK (true);
```

### Criar primeiro admin

```sql
-- Após um usuário se registrar, promova para admin:
UPDATE public.user_roles
SET role = 'admin'
WHERE user_id = 'UUID_DO_USUARIO';
```

---

## 📞 SUPORTE

Em caso de dúvidas durante a migração:
1. Consulte este documento
2. Verifique logs de erro no console
3. Verifique Edge Function logs
4. Consulte documentação Supabase/Stripe

---

**Documento atualizado em:** 2026-01-14
**Versão:** 1.0
