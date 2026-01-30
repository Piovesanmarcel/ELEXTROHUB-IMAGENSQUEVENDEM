# CONTRATOS DE API - ELECTROHUB

## 📌 VISÃO GERAL

Este documento define todos os contratos de API do sistema. **ESTES CONTRATOS SÃO IMUTÁVEIS** - qualquer alteração deve ser retrocompatível.

---

## 🔗 ENDPOINTS EXTERNOS

### 1. n8n System Status

```
GET https://nwh.visualvendas.cloud/webhook/system-status
```

#### Request
- Método: GET
- Headers: Nenhum obrigatório
- Body: Nenhum

#### Response (200 OK)
```json
{
  "status": "OK",
  "worker_status": "NORMAL",
  "queue_size": "0",
  "checked_at": "2026-01-14T10:00:00.000-03:00"
}
```

#### Tipos
| Campo | Tipo | Valores Possíveis |
|-------|------|-------------------|
| `status` | string | `"OK"`, `"ERROR"` |
| `worker_status` | string | `"NORMAL"`, `"OFFLINE"` |
| `queue_size` | string | Número como string (ex: `"5"`) |
| `checked_at` | string | ISO-8601 com timezone |

#### Notas
- **PÚBLICO** - Sem autenticação
- **READ-ONLY** - Apenas leitura
- **IMUTÁVEL** - Não alterar contrato

---

## 🔧 EDGE FUNCTIONS

### 2. n8n-proxy

```
POST /functions/v1/n8n-proxy
```

#### Request
```json
{
  "webhookUrl": "https://xxx.n8n.cloud/webhook/xxx",
  "payload": {
    "requestId": "550e8400-e29b-41d4-a716-446655440000",
    "prompt": "Descrição do que gerar",
    "images": ["base64..."],
    "metadata": {
      "productName": "Produto XYZ",
      "templateId": "template-1"
    },
    "config": {
      "quality": "high",
      "includeLogo": true
    }
  }
}
```

#### Response (200 OK)
```json
{
  "imageUrl": "https://...",
  "imageBase64": "data:image/png;base64,...",
  "success": true,
  "metadata": {}
}
```

#### Response (4xx/5xx)
```json
{
  "error": "Mensagem de erro",
  "type": "network_error",
  "hint": "Dica para resolver",
  "n8nStatus": 500,
  "details": {}
}
```

#### Tipos de Erro
| type | Status | Descrição |
|------|--------|-----------|
| `network_error` | 502 | Não conseguiu conectar ao n8n |
| `internal_error` | 500 | Erro interno do proxy |

---

### 3. redis-callback

```
POST /functions/v1/redis-callback
```

#### Headers
```
Content-Type: application/json
x-callback-secret: [N8N_CALLBACK_SECRET]
```

#### Request
```json
{
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "auth-user-uuid",
  "productName": "Nome do Produto",
  "success": true,
  "images": [
    {
      "url": "https://storage.example.com/image1.png",
      "templateId": "template-lifestyle-1",
      "sceneType": "lifestyle"
    }
  ],
  "error": null
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "saved": [{ "id": "uuid", "job_id": "..." }]
}
```

#### Response (401 Unauthorized)
```json
{
  "error": "Unauthorized"
}
```

#### Response (400 Bad Request)
```json
{
  "error": "jobId e userId são obrigatórios"
}
```

---

### 4. check-admin

```
POST /functions/v1/check-admin
```

#### Headers
```
Authorization: Bearer [JWT_TOKEN]
```

#### Response (200 OK)
```json
{
  "isAdmin": true,
  "userId": "auth-user-uuid"
}
```

---

### 5. check-subscription

```
POST /functions/v1/check-subscription
```

#### Headers
```
Authorization: Bearer [JWT_TOKEN]
```

#### Response (200 OK)
```json
{
  "hasSubscription": true,
  "status": "active",
  "planType": "pro",
  "currentPeriodEnd": "2026-02-14T00:00:00.000Z"
}
```

---

### 6. create-credits-checkout

```
POST /functions/v1/create-credits-checkout
```

#### Headers
```
Authorization: Bearer [JWT_TOKEN]
```

#### Request
```json
{
  "credits": 100,
  "successUrl": "https://app.example.com/success",
  "cancelUrl": "https://app.example.com/cancel"
}
```

#### Response (200 OK)
```json
{
  "url": "https://checkout.stripe.com/..."
}
```

---

### 7. create-subscription-checkout

```
POST /functions/v1/create-subscription-checkout
```

#### Headers
```
Authorization: Bearer [JWT_TOKEN]
```

#### Request
```json
{
  "priceId": "price_xxx",
  "successUrl": "https://app.example.com/success",
  "cancelUrl": "https://app.example.com/cancel"
}
```

#### Response (200 OK)
```json
{
  "url": "https://checkout.stripe.com/..."
}
```

---

### 8. customer-portal

```
POST /functions/v1/customer-portal
```

#### Headers
```
Authorization: Bearer [JWT_TOKEN]
```

#### Request
```json
{
  "returnUrl": "https://app.example.com/settings"
}
```

#### Response (200 OK)
```json
{
  "url": "https://billing.stripe.com/..."
}
```

---

### 9. unified-commands

```
POST /functions/v1/unified-commands
```

#### Request
```json
{
  "command": "generate_background",
  "payload": {
    "productImage": "base64...",
    "prompt": "Produto em ambiente moderno",
    "style": "realistic"
  }
}
```

#### Commands Disponíveis
| Command | Descrição |
|---------|-----------|
| `generate_background` | Gera background para produto |
| `enhance_image` | Melhora qualidade da imagem |
| `remove_background` | Remove fundo da imagem |

#### Response (200 OK)
```json
{
  "success": true,
  "result": {
    "imageUrl": "https://...",
    "imageBase64": "..."
  },
  "usage": {
    "tokens": 1500,
    "cost_usd": 0.05
  }
}
```

---

### 10. cloudinary-transform

```
POST /functions/v1/cloudinary-transform
```

#### Request
```json
{
  "imageUrl": "https://...",
  "transformations": [
    {"width": 1200, "height": 1200, "crop": "fill"},
    {"quality": "auto"},
    {"format": "webp"}
  ]
}
```

#### Response (200 OK)
```json
{
  "url": "https://res.cloudinary.com/...",
  "secure_url": "https://res.cloudinary.com/...",
  "width": 1200,
  "height": 1200
}
```

---

### 11. manage-api-keys

```
POST /functions/v1/manage-api-keys
```

#### Headers
```
Authorization: Bearer [JWT_TOKEN]
```

#### Request (List)
```json
{
  "action": "list"
}
```

#### Request (Create)
```json
{
  "action": "create",
  "name": "Minha Key OpenAI",
  "provider": "openai",
  "apiKey": "sk-..."
}
```

#### Request (Delete)
```json
{
  "action": "delete",
  "keyId": "uuid"
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "keys": [
    {
      "id": "uuid",
      "name": "Minha Key",
      "provider": "openai",
      "is_active": true,
      "last_used_at": "2026-01-14T10:00:00.000Z"
    }
  ]
}
```

---

### 12. admin-get-purchases

```
POST /functions/v1/admin-get-purchases
```

#### Headers
```
Authorization: Bearer [JWT_TOKEN]
```

**Requer role `admin`**

#### Request
```json
{
  "limit": 50,
  "offset": 0,
  "status": "completed"
}
```

#### Response (200 OK)
```json
{
  "purchases": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "credits_amount": 100,
      "price_paid": 29.90,
      "status": "completed",
      "created_at": "2026-01-14T10:00:00.000Z"
    }
  ],
  "total": 150
}
```

---

### 13. admin-get-metrics

```
POST /functions/v1/admin-get-metrics
```

#### Headers
```
Authorization: Bearer [JWT_TOKEN]
```

**Requer role `admin`**

#### Response (200 OK)
```json
{
  "totalUsers": 150,
  "totalCreditsUsed": 5000,
  "totalRevenue": 4500.00,
  "activeSubscriptions": 45,
  "generationsToday": 230,
  "queueSize": 5
}
```

---

## 📦 EDGE FUNCTIONS ADICIONAIS

### Geração de Imagens

#### fluxai-generator
```
POST /functions/v1/fluxai-generator
verify_jwt: false
```

#### gemini-carousel
```
POST /functions/v1/gemini-carousel
verify_jwt: false
```

#### stability-generator
```
POST /functions/v1/stability-generator
verify_jwt: false
```

#### fotographer-background
```
POST /functions/v1/fotographer-background
verify_jwt: false
```

#### tongyi-wanxiang
```
POST /functions/v1/tongyi-wanxiang
verify_jwt: false
```

#### generate-logo
```
POST /functions/v1/generate-logo
verify_jwt: false
```

#### generate-marketing-image
```
POST /functions/v1/generate-marketing-image
verify_jwt: false
```

### Upload & Storage

#### cloudflare-upload
```
POST /functions/v1/cloudflare-upload
verify_jwt: false
```

#### storage-upload
```
POST /functions/v1/storage-upload
verify_jwt: false
```

#### download-images-proxy
```
POST /functions/v1/download-images-proxy
verify_jwt: false
```

#### image-proxy
```
GET /functions/v1/image-proxy
verify_jwt: false
```

### Sync & Automação

#### auto-group-3cliques
```
POST /functions/v1/auto-group-3cliques
verify_jwt: false
```

#### auto-sync-products
```
POST /functions/v1/auto-sync-products
verify_jwt: false
```

#### sync-log
```
POST /functions/v1/sync-log
verify_jwt: false
```

### Templates

#### analyze-template
```
POST /functions/v1/analyze-template
verify_jwt: true
```

### Auth

#### send-password-reset
```
POST /functions/v1/send-password-reset
verify_jwt: false
```

### Pagamentos

#### verify-credits-payment
```
POST /functions/v1/verify-credits-payment
verify_jwt: false
```

### Testes

| Função | Endpoint | JWT |
|--------|----------|-----|
| bfl-test | POST /functions/v1/bfl-test | false |
| deepai-chat-test | POST /functions/v1/deepai-chat-test | false |
| freepik-test | POST /functions/v1/freepik-test | false |
| runware-test | POST /functions/v1/runware-test | false |
| runway-test | POST /functions/v1/runway-test | false |
| test-api-keys | POST /functions/v1/test-api-keys | false |
| check-secret | POST /functions/v1/check-secret | false |

---

## 🗄️ DATABASE FUNCTIONS (RPC)

### acquire_queue_jobs

```sql
SELECT * FROM acquire_queue_jobs(10);
```

#### Parâmetros
| Nome | Tipo | Default | Descrição |
|------|------|---------|-----------|
| `p_batch_size` | integer | 10 | Quantidade de jobs a adquirir |

#### Retorno
Array de `image_generation_queue` rows com status atualizado para `processing`.

---

### check_user_queue_limits

```sql
SELECT * FROM check_user_queue_limits('user-uuid');
```

#### Retorno
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `can_enqueue` | boolean | Se pode adicionar à fila |
| `pending_jobs` | integer | Jobs pendentes do usuário |
| `max_concurrent` | integer | Limite de jobs simultâneos |
| `credits_remaining` | integer | Créditos disponíveis |
| `queue_priority` | integer | Prioridade na fila |
| `reason` | text | Motivo se não puder enfileirar |

---

### debit_generation_credit

```sql
SELECT debit_generation_credit('user-uuid', 1);
```

#### Retorno
`boolean` - `true` se débito bem-sucedido, `false` se créditos insuficientes.

---

### complete_queue_job

```sql
SELECT complete_queue_job(
  'job-uuid',
  true,
  '{"imageUrl": "..."}'::jsonb,
  null,
  'gemini-2.0',
  1500,
  0.05,
  0.28
);
```

#### Retorno
`boolean` - `true` se job completado com sucesso.

---

## 📊 SCHEMAS DE RESPOSTA PADRÃO

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operação realizada com sucesso"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Descrição do erro",
  "code": "ERROR_CODE",
  "details": { ... }
}
```

### Pagination Response
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "hasMore": true
  }
}
```

---

## 🔒 AUTENTICAÇÃO

### JWT Token

Todas as Edge Functions com `verify_jwt = true` requerem:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

O token é obtido via `supabase.auth.getSession()`.

### Service Role

Algumas operações usam service role internamente para bypass de RLS.

### Custom Secret

O `redis-callback` usa header customizado:

```
x-callback-secret: [N8N_CALLBACK_SECRET]
```

---

## 📝 VERSIONAMENTO

| Versão | Data | Mudanças |
|--------|------|----------|
| 1.0.0 | 2026-01-14 | Versão inicial |

**Regras de versionamento:**
- Novas fields opcionais: minor version
- Novas endpoints: minor version
- Mudanças breaking: major version (evitar!)
