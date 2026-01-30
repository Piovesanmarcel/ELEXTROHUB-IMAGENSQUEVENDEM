# INTEGRAÇÃO N8N - DOCUMENTAÇÃO TÉCNICA COMPLETA

## 📌 VISÃO GERAL

O **n8n** é o CORE do sistema de geração de imagens e monitoramento do ElectroHub. Esta documentação detalha todos os endpoints, contratos de API, fluxos de dados e configurações necessárias para migração.

---

## 🔗 ENDPOINTS N8N

### 1. System Status (READ-ONLY, Público)

**O endpoint mais importante do sistema para monitoramento.**

```
GET https://nwh.visualvendas.cloud/webhook/system-status
```

| Campo | Valor |
|-------|-------|
| **Tipo** | Webhook GET público |
| **Autenticação** | Nenhuma (público) |
| **Fonte de dados** | Redis (read-only) |
| **Usado por** | `useSystemStatus.ts`, `SystemStatus.tsx`, `AdminDashboard.tsx` |
| **Polling** | 30 segundos (fixo) |

#### Contrato de Resposta (IMUTÁVEL)

```json
{
  "status": "OK",
  "worker_status": "NORMAL",
  "queue_size": "0",
  "checked_at": "2026-01-14T10:00:00.000-03:00"
}
```

#### ⚠️ ATENÇÃO: Tipos de Dados

| Campo | Tipo Retornado | Conversão Necessária |
|-------|----------------|---------------------|
| `status` | `string` | Nenhuma |
| `worker_status` | `"NORMAL"` ou `"OFFLINE"` | Nenhuma |
| `queue_size` | `string` (!) | `Number(queue_size)` |
| `checked_at` | `string` ISO-8601 | `new Date(checked_at)` |

#### Regras de Estado (Frontend)

```typescript
// Lógica ÚNICA no hook useSystemStatus.ts
function getSystemState(response): SystemState {
  // Prioridade 1: CRÍTICO se worker offline
  if (response.worker_status === 'OFFLINE') {
    return 'CRITICAL';
  }
  
  // Prioridade 2: ALERTA se fila >= 10
  const queueSize = Number(response.queue_size);
  if (queueSize >= 10) {
    return 'WARNING';
  }
  
  // Default: NORMAL
  return 'NORMAL';
}
```

---

### 2. n8n-proxy (Edge Function)

**Proxy server-to-server para evitar CORS em chamadas ao n8n.**

```
POST https://[PROJECT_ID].supabase.co/functions/v1/n8n-proxy
```

| Campo | Valor |
|-------|-------|
| **Tipo** | Edge Function Supabase |
| **JWT** | `false` (não requer autenticação) |
| **Função** | Proxy para webhooks n8n |

#### Request Body

```json
{
  "webhookUrl": "https://xxx.app.n8n.cloud/webhook/xxx",
  "payload": {
    "requestId": "uuid",
    "prompt": "string",
    "images": ["base64..."],
    "metadata": {},
    "config": {}
  }
}
```

#### Response (Success)

```json
{
  "imageUrl": "https://...",
  "imageBase64": "data:image/png;base64,...",
  "success": true
}
```

#### Response (Error)

```json
{
  "error": "Mensagem de erro",
  "type": "network_error | internal_error",
  "hint": "Dica para resolver"
}
```

#### Domínios Permitidos (Allowlist)

```typescript
const ALLOWED_DOMAINS = [
  'n8n.cloud',
  '.n8n.cloud',
  'app.n8n.cloud'
];

// Também permite qualquer URL com /webhook no path
if (parsed.pathname.includes('/webhook')) {
  return true;
}
```

---

### 3. redis-callback (Edge Function)

**Recebe callbacks do n8n após processamento de imagens.**

```
POST https://[PROJECT_ID].supabase.co/functions/v1/redis-callback
```

| Campo | Valor |
|-------|-------|
| **Tipo** | Edge Function Supabase |
| **JWT** | `false` |
| **Autenticação** | Header `x-callback-secret` |
| **Salva em** | Tabela `generated_images_batch` |

#### Headers Obrigatórios

```
x-callback-secret: [N8N_CALLBACK_SECRET]
Content-Type: application/json
```

#### Request Body

```json
{
  "jobId": "uuid-do-job",
  "userId": "uuid-do-usuario",
  "productName": "Nome do Produto",
  "success": true,
  "images": [
    {
      "url": "https://...",
      "templateId": "template-1",
      "sceneType": "lifestyle"
    }
  ],
  "error": null
}
```

#### Response (Success)

```json
{
  "success": true,
  "jobId": "uuid",
  "saved": [{ "id": "uuid", ... }]
}
```

#### Configuração do Secret

O secret `N8N_CALLBACK_SECRET` deve ser configurado:
- No Supabase (Settings → Cloud → Secrets)
- No n8n workflow como header da requisição HTTP

---

## 🔄 FLUXOS DE DADOS

### Fluxo 1: Monitoramento de Status

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FLUXO DE MONITORAMENTO                       │
└─────────────────────────────────────────────────────────────────────┘

  ┌────────────┐     GET (30s)      ┌─────────────────┐
  │  Frontend  │ ←────────────────→ │ n8n Webhook     │
  │ (React)    │                    │ /system-status  │
  └────────────┘                    └────────┬────────┘
        │                                    │
        │                                    │ Lê
        ▼                                    ▼
  ┌────────────┐                    ┌─────────────────┐
  │ useSystem  │                    │     Redis       │
  │ Status.ts  │                    │  (Upstash)      │
  └────────────┘                    └─────────────────┘
        │
        │ Processa
        ▼
  ┌────────────────────────────────┐
  │ Regras de Estado:              │
  │ - OFFLINE → CRITICAL           │
  │ - queue >= 10 → WARNING        │
  │ - default → NORMAL             │
  └────────────────────────────────┘
```

### Fluxo 2: Geração de Imagens via n8n

```
┌─────────────────────────────────────────────────────────────────────┐
│                    FLUXO DE GERAÇÃO DE IMAGENS                       │
└─────────────────────────────────────────────────────────────────────┘

  ┌────────────┐                    ┌─────────────────┐
  │  Frontend  │ ──────────────────→│  n8n-proxy      │
  │ (React)    │    POST payload    │ Edge Function   │
  └────────────┘                    └────────┬────────┘
                                             │
                                    Server-to-Server
                                             │
                                             ▼
                                    ┌─────────────────┐
                                    │  n8n Workflow   │
                                    │ /webhook/...    │
                                    └────────┬────────┘
                                             │
                                    Processa IA
                                             │
                                             ▼
                                    ┌─────────────────┐
                                    │ Callback para   │
                                    │ redis-callback  │
                                    └────────┬────────┘
                                             │
                                             ▼
                                    ┌─────────────────┐
                                    │   Supabase      │
                                    │ generated_      │
                                    │ images_batch    │
                                    └─────────────────┘
```

---

## 📋 WORKFLOWS N8N NECESSÁRIOS

### Workflow 1: system-status

| Campo | Valor |
|-------|-------|
| **Nome** | `system-status` |
| **Tipo** | Webhook GET |
| **Endpoint** | `/webhook/system-status` |
| **Função** | Retorna status do sistema lendo Redis |

**Nodes necessários:**
1. Webhook (trigger GET)
2. Redis Get (ler status do worker e tamanho da fila)
3. Respond to Webhook (retornar JSON)

**Variáveis Redis:**
- `worker:status` → "NORMAL" ou "OFFLINE"
- `queue:size` → número de jobs na fila

---

### Workflow 2: image-generation

| Campo | Valor |
|-------|-------|
| **Nome** | `image-generation` |
| **Tipo** | Webhook POST |
| **Endpoint** | `/webhook/generate-image` |
| **Função** | Gera imagens com IA |

**Nodes necessários:**
1. Webhook (trigger POST)
2. Validação do payload
3. Chamada para API de IA (OpenAI, Gemini, etc.)
4. Processamento da resposta
5. HTTP Request para `redis-callback` com resultado

---

### Workflow 3: callback-sender (opcional)

| Campo | Valor |
|-------|-------|
| **Nome** | `callback-sender` |
| **Tipo** | Workflow auxiliar |
| **Função** | Envia resultados para redis-callback |

**Headers para callback:**
```json
{
  "Content-Type": "application/json",
  "x-callback-secret": "{{$env.N8N_CALLBACK_SECRET}}"
}
```

---

## 🔐 CONFIGURAÇÃO DE SECRETS

### Secrets no Supabase

| Nome | Descrição | Usado por |
|------|-----------|-----------|
| `N8N_CALLBACK_SECRET` | Secret compartilhado para validar callbacks | `redis-callback` |

### Variáveis no n8n

| Nome | Descrição |
|------|-----------|
| `N8N_CALLBACK_SECRET` | Mesmo valor configurado no Supabase |
| `SUPABASE_CALLBACK_URL` | `https://[PROJECT_ID].supabase.co/functions/v1/redis-callback` |

---

## ⚙️ CONFIG.TOML

Configuração das Edge Functions relacionadas ao n8n:

```toml
[functions.n8n-proxy]
verify_jwt = false

[functions.redis-callback]
verify_jwt = false
```

**Por que `verify_jwt = false`?**
- `n8n-proxy`: Permite chamadas públicas do frontend
- `redis-callback`: Usa header secret próprio, não JWT

---

## 📊 TABELAS RELACIONADAS

### generated_images_batch

Armazena resultados dos callbacks do n8n.

```sql
CREATE TABLE public.generated_images_batch (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL,
  product_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  images JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  error_message TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### n8n_generation_logs

Logs de geração via n8n.

```sql
CREATE TABLE public.n8n_generation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_name TEXT NOT NULL,
  scene_type TEXT NOT NULL,
  webhook_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  request_payload JSONB,
  response_data JSONB,
  image_url TEXT,
  error_message TEXT,
  duration_ms INTEGER,
  attempts INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### authorized_jobs

Jobs autorizados para receber callbacks.

```sql
CREATE TABLE public.authorized_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL,
  expected_images INTEGER DEFAULT 8,
  received_images INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  metadata JSONB DEFAULT '{}',
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '10 minutes'),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 🧪 TESTANDO A INTEGRAÇÃO

### 1. Testar endpoint system-status

```bash
curl -X GET https://nwh.visualvendas.cloud/webhook/system-status
```

Resposta esperada:
```json
{"status":"OK","worker_status":"NORMAL","queue_size":"0","checked_at":"..."}
```

### 2. Testar n8n-proxy

```bash
curl -X POST https://[PROJECT_ID].supabase.co/functions/v1/n8n-proxy \
  -H "Content-Type: application/json" \
  -d '{
    "webhookUrl": "https://seu-webhook.n8n.cloud/webhook/test",
    "payload": {"test": true}
  }'
```

### 3. Testar redis-callback

```bash
curl -X POST https://[PROJECT_ID].supabase.co/functions/v1/redis-callback \
  -H "Content-Type: application/json" \
  -H "x-callback-secret: SEU_SECRET" \
  -d '{
    "jobId": "test-123",
    "userId": "uuid-usuario",
    "productName": "Produto Teste",
    "success": true,
    "images": []
  }'
```

---

## 🚨 TROUBLESHOOTING

### Problema: CORS no frontend

**Sintoma:** Erro de CORS ao chamar webhook n8n diretamente.

**Solução:** Use sempre o `n8n-proxy` para chamadas do frontend.

```typescript
// ❌ ERRADO - causa CORS
await fetch('https://xxx.n8n.cloud/webhook/xxx', { ... })

// ✅ CORRETO - via proxy
await supabase.functions.invoke('n8n-proxy', {
  body: { webhookUrl: 'https://xxx.n8n.cloud/webhook/xxx', payload: {} }
})
```

### Problema: Callback rejeitado (401)

**Sintoma:** redis-callback retorna 401 Unauthorized.

**Solução:** Verificar se o header `x-callback-secret` está correto e se o secret está configurado no Supabase.

### Problema: queue_size não funciona

**Sintoma:** Sempre mostra 0 ou NaN.

**Solução:** Lembre-se que `queue_size` vem como string. Use `Number(queue_size)`.

---

## 📝 CHECKLIST DE MIGRAÇÃO N8N

- [ ] Exportar workflows do n8n atual
- [ ] Configurar secret `N8N_CALLBACK_SECRET` no novo Supabase
- [ ] Atualizar URL do callback nos workflows (novo project ID)
- [ ] Testar endpoint `/webhook/system-status`
- [ ] Testar Edge Function `n8n-proxy`
- [ ] Testar Edge Function `redis-callback`
- [ ] Verificar hook `useSystemStatus.ts` está funcionando
- [ ] Validar que os dados estão sendo salvos em `generated_images_batch`

---

## 📚 ARQUIVOS RELACIONADOS

### Frontend (React)

| Arquivo | Função |
|---------|--------|
| `src/hooks/useSystemStatus.ts` | Hook de monitoramento |
| `src/hooks/useCanvaTemplateN8N.ts` | Hook de geração via n8n |
| `src/pages/SystemStatus.tsx` | Página de status |

### Edge Functions

| Arquivo | Função |
|---------|--------|
| `supabase/functions/n8n-proxy/index.ts` | Proxy para n8n |
| `supabase/functions/redis-callback/index.ts` | Callback do n8n |

### Configuração

| Arquivo | Função |
|---------|--------|
| `supabase/config.toml` | Config das Edge Functions |
