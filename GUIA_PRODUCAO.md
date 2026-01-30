# 🚀 GUIA DE PRODUÇÃO - ELECTROHUB

## ✅ PRÉ-REQUISITOS ANTES DO LANÇAMENTO

### 1. CONFIGURAÇÕES OBRIGATÓRIAS

#### 📊 **Sentry - Monitoramento de Erros**

1. Criar conta gratuita em [sentry.io](https://sentry.io)
2. Criar novo projeto tipo **React**
3. Copiar o **DSN** fornecido
4. Adicionar no painel do Lovable Cloud:
   ```
   VITE_SENTRY_DSN=https://xxxxxxx@xxxxxxx.ingest.sentry.io/xxxxxxx
   ```

#### 🛡️ **Rate Limiting - Proteção contra Abuso**

1. **Rodar migration SQL** (já criada):
   ```bash
   # No painel do Supabase:
   # SQL Editor → Executar o arquivo:
   # supabase/migrations/20260128_rate_limiting.sql
   ```

2. **Verificar tabela criada:**
   ```sql
   SELECT * FROM public.rate_limit_log LIMIT 1;
   ```

3. **Limites já configurados:**
   - ✅ Autenticação: 5 tentativas / 5 minutos
   - ✅ APIs de IA: 10 requests / minuto
   - ✅ Operações gerais: 60 requests / minuto

#### 💾 **Backups Automáticos do Supabase**

1. Acessar: https://supabase.com/dashboard/project/SEU_PROJECT_ID/settings/backups
2. Verificar configurações:
   - **Backup diário automático**: ✅ Ativado (Plano Pro+)
   - **Point-in-Time Recovery (PITR)**: ✅ Ativado (recomendado)
   - **Retenção**: Mínimo 7 dias

3. **Backup manual (antes do lançamento):**
   ```bash
   # No painel do Supabase:
   # Settings → Database → Backup Now
   ```

---

## 🔐 CONFIGURAÇÕES DE SEGURANÇA

### SSL/HTTPS
✅ **Automático** no Lovable Cloud e Supabase

### Row Level Security (RLS)
✅ **Já configurado** - Testado e funcionando

### Variáveis de Ambiente
✅ **Configuradas** - Verificar no painel Lovable Cloud

### CORS
✅ **Automático** via Supabase

---

## 📋 CHECKLIST DE DEPLOY

### Antes de fazer deploy:

- [ ] **Executar testes locais**
  ```bash
  npm run build
  npm run preview
  # Testar todas as funcionalidades principais
  ```

- [ ] **Rodar migration de rate limiting**
  ```sql
  -- No Supabase SQL Editor
  \i supabase/migrations/20260128_rate_limiting.sql
  ```

- [ ] **Configurar Sentry DSN**
  - Adicionar `VITE_SENTRY_DSN` no Lovable Cloud

- [ ] **Criar backup manual do banco**
  - Supabase → Settings → Database → Backup Now

- [ ] **Verificar variáveis de ambiente**
  - Supabase URL ✓
  - Supabase Publishable Key ✓
  - Sentry DSN ✓
  - N8N URL ✓

- [ ] **Testar fluxo completo:**
  - [ ] Registro de novo usuário
  - [ ] Login
  - [ ] Geração de imagem
  - [ ] Pagamento (Stripe modo test)
  - [ ] Logout

### Durante o deploy:

- [ ] **Deploy no Lovable Cloud**
  ```bash
  # Commitar mudanças no Git
  git add .
  git commit -m "Preparação para produção: Rate limiting, Sentry, docs"
  git push origin main

  # Lovable Cloud faz auto-deploy
  ```

- [ ] **Verificar logs de deploy**
  - Sem erros de build ✓
  - Todas as migrations executadas ✓

### Após o deploy:

- [ ] **Testar em produção:**
  - [ ] Acessar URL de produção
  - [ ] Criar conta de teste
  - [ ] Testar funcionalidades principais
  - [ ] Verificar Sentry recebendo eventos

- [ ] **Configurar alertas no Sentry:**
  - Email para erros críticos
  - Slack/Discord webhook (opcional)

- [ ] **Monitorar primeiras 24h:**
  - Logs do Supabase
  - Dashboard do Sentry
  - Métricas de performance

---

## 🚨 RATE LIMITING - CONFIGURAÇÃO

### Limites Atuais (já configurados):

| Endpoint | Limite | Janela |
|----------|--------|--------|
| Autenticação (login/registro) | 5 requisições | 5 minutos |
| APIs de IA (Gemini, OpenAI) | 10 requisições | 1 minuto |
| Operações gerais | 60 requisições | 1 minuto |
| Filas/Webhooks | 100 requisições | 1 minuto |

### Como funciona:

1. **Cada Edge Function verifica automaticamente** antes de processar
2. **Se exceder limite**: Retorna HTTP 429 (Too Many Requests)
3. **Logs são armazenados** na tabela `rate_limit_log`
4. **Limpeza automática**: Logs com +24h são removidos

### Exemplo de uso em Edge Function:

```typescript
import { checkRateLimit, RATE_LIMITS, rateLimitResponse } from "../_shared/rate-limiter.ts";

// Dentro da função:
const rateLimit = await checkRateLimit(userId, RATE_LIMITS.auth);

if (!rateLimit.allowed) {
  return rateLimitResponse(rateLimit);
}

// Continuar processamento...
```

### Ajustar limites (se necessário):

Editar arquivo: `supabase/functions/_shared/rate-limiter.ts`

```typescript
export const RATE_LIMITS = {
  auth: {
    maxRequests: 5,    // Aumentar se muitos usuários legítimos sendo bloqueados
    windowSeconds: 300, // 5 minutos
    limitKey: "auth"
  },
  // ...
};
```

---

## 📊 MONITORAMENTO COM SENTRY

### O que o Sentry monitora:

✅ **Erros JavaScript** em tempo real
✅ **Performance** da aplicação
✅ **Session Replay** de erros (10% das sessões)
✅ **Breadcrumbs** (histórico de ações do usuário)

### Como usar:

1. **Acesse o dashboard:** https://sentry.io/organizations/seu-org/issues/
2. **Veja erros em tempo real**
3. **Configurar alertas:**
   - Settings → Alerts → Create Alert
   - Notificar por email quando erro ocorrer

### Capturar erros customizados:

```typescript
import { captureError } from "@/lib/sentry";

try {
  // Operação que pode falhar
  await generateImage(prompt);
} catch (error) {
  captureError(error, {
    extra: { prompt, userId }
  });

  toast.error("Erro ao gerar imagem");
}
```

### Métricas importantes:

- **Error Rate**: < 1% (ideal)
- **Session Duration**: Média de tempo na plataforma
- **Crash-Free Sessions**: > 99.5%

---

## 💾 BACKUPS E DISASTER RECOVERY

### Backups Automáticos do Supabase:

| Tipo | Frequência | Retenção |
|------|------------|----------|
| Backup Diário | 1x por dia (3:00 AM UTC) | 7 dias (Free), 30 dias (Pro) |
| Point-in-Time Recovery | Contínuo | 7 dias |

### Como restaurar um backup:

1. **Supabase Dashboard** → Settings → Database → Backups
2. Selecionar backup desejado
3. Clicar em **Restore**
4. ⚠️ **ATENÇÃO**: Isso sobrescreve o banco atual!

### Backup manual (recomendado antes de updates grandes):

```bash
# Via Supabase CLI:
supabase db dump -f backup_$(date +%Y%m%d).sql

# OU via dashboard:
# Settings → Database → Backup Now
```

### Estratégia de Backup Recomendada:

1. **Antes do lançamento**: Backup manual
2. **Semanalmente**: Verificar backups automáticos funcionando
3. **Antes de migrations grandes**: Backup manual
4. **Após mudanças críticas**: Backup manual

### Disaster Recovery Plan:

**Se o banco cair completamente:**

1. ✅ Supabase tem 99.9% uptime SLA
2. ✅ Backups automáticos diários
3. ✅ Point-in-Time Recovery para últimos 7 dias
4. ✅ Suporte 24/7 (Plano Pro+)

**Se houver corrupção de dados:**

1. Identificar quando ocorreu
2. Restaurar backup do ponto anterior
3. Reprocessar dados perdidos (se possível)

---

## 🔧 MANUTENÇÃO PÓS-LANÇAMENTO

### Tarefas Diárias:

- [ ] Verificar dashboard do Sentry (5 min)
- [ ] Monitorar logs do Supabase (5 min)
- [ ] Verificar rate limit logs (eventos bloqueados)

### Tarefas Semanais:

- [ ] Revisar backups automáticos funcionando
- [ ] Limpar tabela `rate_limit_log` (se não configurado cron)
- [ ] Verificar métricas de performance

### Tarefas Mensais:

- [ ] Revisar e ajustar rate limits se necessário
- [ ] Atualizar dependências (`npm audit`)
- [ ] Backup manual antes de updates
- [ ] Revisar alertas do Sentry

---

## 📞 SUPORTE E ESCALAÇÃO

### Se algo der errado:

**Erro Crítico em Produção:**
1. **Reverter deploy** (se possível)
2. **Verificar Sentry** para stack trace
3. **Restaurar backup** se necessário
4. **Notificar usuários** via email/status page

**Performance Degradada:**
1. Verificar logs do Supabase
2. Checar rate limit bloqueando usuários legítimos
3. Escalar recursos no Supabase (se necessário)

**Suporte Supabase:**
- Dashboard → Support
- Email: support@supabase.com
- Docs: https://supabase.com/docs

**Suporte Lovable:**
- https://lovable.dev/support

---

## ✅ COMPLIANCE E LEGAL

### Documentos Necessários (Brasil - LGPD):

- [ ] **Termos de Uso** - Criar página /termos
- [ ] **Política de Privacidade** - Criar página /privacidade
- [ ] **Cookie Consent** - Banner de consentimento
- [ ] **Direitos LGPD** - Processo para solicitação de dados/exclusão

### Templates Recomendados:

- https://termly.io/products/privacy-policy-generator/
- https://www.privacypolicies.com/

---

## 🎯 MÉTRICAS DE SUCESSO

### KPIs a monitorar:

| Métrica | Meta |
|---------|------|
| Uptime | > 99.5% |
| Error Rate | < 1% |
| Response Time (API) | < 500ms (p95) |
| Crash-Free Sessions | > 99% |
| Rate Limit Blocks | < 5% dos requests |

---

## 📚 RECURSOS ADICIONAIS

- [Supabase Docs](https://supabase.com/docs)
- [Sentry React Docs](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Lovable Cloud Docs](https://docs.lovable.dev/)
- [Rate Limiting Best Practices](https://cloud.google.com/architecture/rate-limiting-strategies-techniques)

---

## 🚀 ESTÁ PRONTO PARA LANÇAR!

Após completar este guia:

✅ Rate Limiting configurado
✅ Sentry monitorando erros
✅ Backups automáticos ativos
✅ Segurança validada
✅ Deploy testado

**BOA SORTE COM O LANÇAMENTO! 🎉**
