# Guia: Sistema de Reserva de Créditos

Sistema robusto para débito de créditos em processos assíncronos.

## 📊 Fluxo

```
1. RESERVAR → 2. PROCESSAR → 3. CONFIRMAR (ou CANCELAR)
```

## 🔧 Funções SQL

| Função | Descrição |
|--------|-----------|
| `reserve_credit(user_id, job_id, amount)` | Reserva créditos |
| `confirm_credit_debit(reservation_id)` | Confirma e debita |
| `cancel_credit_reservation(reservation_id)` | Cancela reserva |
| `get_user_available_credits(user_id)` | Créditos disponíveis |

## 🔌 Integração n8n

### Passo 1: Reservar (antes de processar)
```
POST: /rest/v1/rpc/reserve_credit
Body: {"p_user_id": "{{userId}}", "p_job_id": "{{jobId}}", "p_amount": 1}
```
Salvar `reservation_id` da resposta.

### Passo 2: Confirmar (após sucesso)
```
POST: /rest/v1/rpc/confirm_credit_debit
Body: {"p_reservation_id": "{{reservationId}}"}
```

### Passo 3: Cancelar (se falhar)
```
POST: /rest/v1/rpc/cancel_credit_reservation
Body: {"p_reservation_id": "{{reservationId}}", "p_reason": "job_failed"}
```

## ⚡ Ajustes no Workflow

**Substituir nós atuais:**

| Atual | Novo |
|-------|------|
| Redis GET (verificar débito) | HTTP: `reserve_credit` |
| SE TRUE DEBITA | IF: reservation_id exists |
| Debitar Crédito Supabase | *Remover* |
| Redis SET debit_done | *Remover* |
| (Após sucesso) | HTTP: `confirm_credit_debit` |
| (Se falhar) | HTTP: `cancel_credit_reservation` |

## 🧹 Limpeza Automática

Configurar CRON no Supabase para limpar reservas expiradas:

```sql
SELECT cron.schedule(
  'cleanup-expired-reservations',
  '*/30 * * * *',  -- A cada 30 min
  $$ SELECT public.cleanup_expired_reservations() $$
);
```
