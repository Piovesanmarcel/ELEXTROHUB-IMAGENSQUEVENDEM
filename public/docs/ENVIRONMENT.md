# VARIÁVEIS DE AMBIENTE - ELECTROHUB

## 📌 VISÃO GERAL

Este documento lista todas as variáveis de ambiente e secrets necessários para o funcionamento do sistema.

---

## 🔧 VARIÁVEIS FRONTEND (.env)

Estas variáveis são injetadas automaticamente pelo Lovable Cloud:

```env
# ============================================
# SUPABASE (Auto-configurado pelo Lovable Cloud)
# ============================================
VITE_SUPABASE_URL=https://[PROJECT_ID].supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGci...
VITE_SUPABASE_PROJECT_ID=[PROJECT_ID]

# ============================================
# N8N (Configuração manual)
# ============================================
VITE_SYSTEM_STATUS_URL=https://nwh.visualvendas.cloud/webhook/system-status
```

### Notas sobre .env
- **NÃO EDITAR** o arquivo `.env` diretamente
- O Lovable Cloud atualiza automaticamente as variáveis do Supabase
- Variáveis `VITE_` são expostas ao frontend

---

## 🔐 SECRETS (Edge Functions)

Configurar em: **Lovable Cloud → Settings → Secrets**

### OBRIGATÓRIOS

| Secret | Descrição | Exemplo | Usado por |
|--------|-----------|---------|-----------|
| `STRIPE_SECRET_KEY` | Chave secreta do Stripe | `sk_live_...` | Checkout, Webhooks |
| `CLOUDINARY_API_KEY` | API Key do Cloudinary | `123456789012345` | Transformações |
| `CLOUDINARY_API_SECRET` | Secret do Cloudinary | `abcdef...` | Transformações |
| `CLOUDINARY_CLOUD_NAME` | Cloud name do Cloudinary | `my-cloud` | Transformações |
| `GOOGLE_GEMINI_API_KEY` | API Key do Google Gemini | `AIza...` | Geração IA |
| `OPENAI_API_KEY` | API Key da OpenAI | `sk-...` | Geração IA |
| `N8N_CALLBACK_SECRET` | Secret para callbacks n8n | `random-string-32-chars` | redis-callback |

### OPCIONAIS

| Secret | Descrição | Usado por |
|--------|-----------|-----------|
| `INTERNAL_WORKER_SECRET` | Secret para workers internos | process-queue |
| `RESEND_API_KEY` | API Key do Resend (emails) | Notificações |
| `IMGBB_API_KEY` | API Key do ImgBB (hospedagem) | Upload imagens |
| `STABILITY_API_KEY` | API Key do Stability AI | Geração IA alternativa |
| `RUNWARE_API_KEY2` | API Key do Runware | Geração IA alternativa |
| `BFL_API_KEY` | API Key Black Forest Labs | Geração IA alternativa |
| `RUNWAY_API_KEY` | API Key Runway ML | Geração IA alternativa |
| `ALIBABA_CLOUD_API_KEY` | API Key Alibaba Cloud | Geração IA alternativa |
| `QWEN_VL_MAX_API_KEY` | API Key Qwen VL | Geração IA alternativa |
| `QWEN_IMAGE_EDIT_API_KEY` | API Key Qwen Image Edit | Edição IA |
| `FLUXAI_API_KEY` | API Key Flux AI | Geração IA alternativa |
| `LOVABLE_API_KEY` | API Key Lovable AI | Gateway IA |

### AUTOMÁTICOS (Não configurar manualmente)

| Secret | Descrição |
|--------|-----------|
| `SUPABASE_URL` | URL do projeto Supabase |
| `SUPABASE_ANON_KEY` | Chave anon do Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave service role |
| `SUPABASE_DB_URL` | URL do banco PostgreSQL |
| `SUPABASE_PUBLISHABLE_KEY` | Chave pública |

---

## 🔗 INTEGRAÇÕES EXTERNAS

### Stripe

1. Acesse [dashboard.stripe.com](https://dashboard.stripe.com)
2. Vá em Developers → API Keys
3. Copie a **Secret key** (começa com `sk_`)
4. Configure como `STRIPE_SECRET_KEY`

### Cloudinary

1. Acesse [cloudinary.com/console](https://cloudinary.com/console)
2. Copie API Key, API Secret e Cloud Name
3. Configure os 3 secrets

### Google Gemini

1. Acesse [aistudio.google.com](https://aistudio.google.com)
2. Vá em "Get API key"
3. Crie ou copie uma chave
4. Configure como `GOOGLE_GEMINI_API_KEY`

### OpenAI

1. Acesse [platform.openai.com](https://platform.openai.com)
2. Vá em API Keys
3. Crie uma nova chave
4. Configure como `OPENAI_API_KEY`

### n8n

1. Gere um secret aleatório (32+ caracteres):
   ```bash
   openssl rand -hex 32
   ```
2. Configure como `N8N_CALLBACK_SECRET` no Supabase
3. Configure o MESMO valor no n8n workflow como variável de ambiente

---

## 📋 .env.example

Crie este arquivo na raiz do projeto para referência:

```env
# ============================================
# SUPABASE (Auto-configurado pelo Lovable Cloud)
# Não editar manualmente
# ============================================
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_PROJECT_ID=xxx

# ============================================
# N8N
# ============================================
VITE_SYSTEM_STATUS_URL=https://nwh.visualvendas.cloud/webhook/system-status

# ============================================
# SECRETS (Configurar no Lovable Cloud → Settings → Secrets)
# Estes NÃO vão no .env - são configurados na interface do Lovable
# ============================================
# STRIPE_SECRET_KEY=sk_live_...
# CLOUDINARY_API_KEY=...
# CLOUDINARY_API_SECRET=...
# CLOUDINARY_CLOUD_NAME=...
# GOOGLE_GEMINI_API_KEY=...
# OPENAI_API_KEY=sk-...
# N8N_CALLBACK_SECRET=...
```

---

## ✅ CHECKLIST DE CONFIGURAÇÃO

### Migração para Nova Conta

- [ ] **Stripe**
  - [ ] Criar conta ou usar existente
  - [ ] Copiar Secret Key
  - [ ] Configurar `STRIPE_SECRET_KEY`

- [ ] **Cloudinary**
  - [ ] Criar conta ou usar existente
  - [ ] Configurar `CLOUDINARY_API_KEY`
  - [ ] Configurar `CLOUDINARY_API_SECRET`
  - [ ] Configurar `CLOUDINARY_CLOUD_NAME`

- [ ] **Google Gemini**
  - [ ] Obter API Key
  - [ ] Configurar `GOOGLE_GEMINI_API_KEY`

- [ ] **OpenAI**
  - [ ] Obter API Key
  - [ ] Configurar `OPENAI_API_KEY`

- [ ] **n8n**
  - [ ] Gerar secret aleatório
  - [ ] Configurar `N8N_CALLBACK_SECRET` no Supabase
  - [ ] Configurar mesmo secret no n8n

- [ ] **Verificar**
  - [ ] Testar login/signup
  - [ ] Testar geração de imagens
  - [ ] Testar checkout Stripe
  - [ ] Testar endpoint system-status

---

## 🔒 SEGURANÇA

### Regras

1. **NUNCA** commitar secrets no código
2. **NUNCA** expor secrets no frontend (apenas `VITE_` públicos)
3. **SEMPRE** usar Lovable Cloud Secrets para chaves privadas
4. **ROTACIONAR** secrets periodicamente
5. **MONITORAR** uso anormal de APIs

### Secrets que podem ser públicos

| Variável | Pode expor? |
|----------|-------------|
| `VITE_SUPABASE_URL` | ✅ Sim |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | ✅ Sim |
| `VITE_SYSTEM_STATUS_URL` | ✅ Sim |
| `STRIPE_SECRET_KEY` | ❌ NÃO |
| `OPENAI_API_KEY` | ❌ NÃO |
| Qualquer `*_SECRET*` | ❌ NÃO |

---

## 📊 MONITORAMENTO

### Verificar se secrets estão configurados

Via Edge Function `check-secret`:

```typescript
// supabase/functions/check-secret/index.ts
const secret = Deno.env.get('STRIPE_SECRET_KEY');
if (!secret) {
  console.error('STRIPE_SECRET_KEY não configurado!');
}
```

### Logs de uso

Monitorar via:
- Lovable Cloud → Edge Function Logs
- Supabase Dashboard → Logs
- Console do navegador (erros de API)
