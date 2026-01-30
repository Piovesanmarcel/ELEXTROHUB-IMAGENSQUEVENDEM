# 🔧 Workflows n8n para ElectroHub SaaS

## Arquivos

| Arquivo | Descrição |
|---------|-----------|
| `stripe-webhooks-alertas.json` | Alertas de vendas e falhas no Telegram |
| `job-retry-automatico.json` | Retry automático de jobs falhados |
| `TELEGRAM_SETUP.md` | Guia para configurar bot Telegram |

---

## Como Importar no n8n

1. Acesse: `https://nwh.visualvendas.cloud`
2. Clique em **+** → **Import from File**
3. Selecione o arquivo `.json` desejado
4. Configure as credenciais:
   - **Telegram API** (primeiro siga o `TELEGRAM_SETUP.md`)
   - **Redis** (já configurado)

---

## Variáveis de Ambiente Necessárias

Configure em **Settings** → **Variables**:

```
TELEGRAM_CHAT_ID=seu_chat_id
SUPABASE_URL=https://uuvecdfazedifnixcjoo.supabase.co
SUPABASE_SERVICE_KEY=sua_service_key
```

---

## Configurar Stripe Webhook

1. Acesse: [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Clique **Add endpoint**
3. URL: `https://nwh.visualvendas.cloud/webhook/stripe-events`
4. Eventos para escutar:
   - `checkout.session.completed`
   - `invoice.payment_failed`
   - `customer.subscription.deleted`

---

## SQL Necessário

Execute no Supabase SQL Editor:
```
supabase/sql/04_get_failed_jobs_rpc.sql
```

---

## Ativar Workflows

Após importar e configurar, ative cada workflow clicando no toggle!
