# GUIA COMPLETO DE MIGRAÇÃO - ELECTROHUB

## 📌 OBJETIVO

Este documento fornece instruções **completas e definitivas** para migrar o projeto ElectroHub para uma nova conta Lovable, garantindo que TUDO funcione corretamente.

---

## 🧠 PRINCÍPIOS DA MIGRAÇÃO

### O que MIGRA

| Item | Como migrar |
|------|-------------|
| Código Frontend | GitHub → Nova conta Lovable |
| Edge Functions | GitHub → Auto-deploy |
| Schema SQL | Executar `SQL_COMPLETE.sql` |
| Workflows n8n | Exportar JSON → Importar |
| Documentação | Já está no GitHub |

### O que NÃO MIGRA

| Item | Ação necessária |
|------|-----------------|
| Dados de usuários | Não migra (começa do zero) |
| Secrets/API Keys | Reconfigurar manualmente |
| Auth users | Novos signups necessários |
| Storage files | Upload novamente se necessário |

---

## 📋 CHECKLIST COMPLETO

### FASE 1: Preparação (Conta Atual)

- [ ] **1.1** Verificar se todo código está commitado no GitHub
- [ ] **1.2** Confirmar que branch `main` está atualizada
- [ ] **1.3** Copiar todos os valores de Secrets atuais
- [ ] **1.4** Exportar workflows do n8n (JSON)
- [ ] **1.5** Documentar URLs e endpoints externos

### FASE 2: Nova Conta Lovable

- [ ] **2.1** Criar novo projeto no Lovable
- [ ] **2.2** Habilitar Lovable Cloud (Supabase automático)
- [ ] **2.3** Conectar repositório GitHub existente
- [ ] **2.4** Aguardar sincronização completa

### FASE 3: Configuração do Banco de Dados

- [ ] **3.1** Acessar Lovable Cloud → Database
- [ ] **3.2** Executar `docs/SQL_COMPLETE.sql` no SQL Editor
- [ ] **3.3** Verificar criação de todas as tabelas (20+)
- [ ] **3.4** Verificar criação de funções (11+)
- [ ] **3.5** Verificar policies RLS em cada tabela
- [ ] **3.6** Verificar bucket `marketing-templates` criado

### FASE 4: Configuração de Secrets

- [ ] **4.1** Acessar Settings → Cloud → Secrets
- [ ] **4.2** Configurar `STRIPE_SECRET_KEY`
- [ ] **4.3** Configurar `CLOUDINARY_API_KEY`
- [ ] **4.4** Configurar `CLOUDINARY_API_SECRET`
- [ ] **4.5** Configurar `CLOUDINARY_CLOUD_NAME`
- [ ] **4.6** Configurar `GOOGLE_GEMINI_API_KEY`
- [ ] **4.7** Configurar `OPENAI_API_KEY`
- [ ] **4.8** Configurar `N8N_CALLBACK_SECRET`
- [ ] **4.9** Configurar secrets opcionais conforme necessário

### FASE 5: Configuração do n8n

- [ ] **5.1** Importar workflows JSON no n8n
- [ ] **5.2** Atualizar URL do callback (novo project ID)
- [ ] **5.3** Configurar `N8N_CALLBACK_SECRET` no n8n
- [ ] **5.4** Testar webhook `/system-status`
- [ ] **5.5** Ativar todos os workflows

### FASE 6: Validação

- [ ] **6.1** Testar página inicial (/)
- [ ] **6.2** Testar signup/login
- [ ] **6.3** Verificar créditos iniciais (10)
- [ ] **6.4** Testar página /system-status
- [ ] **6.5** Testar geração de imagem
- [ ] **6.6** Testar checkout de créditos (modo teste)
- [ ] **6.7** Testar área admin (/admin/compras)

### FASE 7: Primeiro Admin

- [ ] **7.1** Criar conta com email do admin
- [ ] **7.2** Executar SQL para promover a admin:

```sql
UPDATE public.user_roles 
SET role = 'admin' 
WHERE user_id = (
  SELECT id FROM auth.users 
  WHERE email = 'seu-email@admin.com'
);
```

---

## 🔧 PASSO A PASSO DETALHADO

### Passo 1: Criar Novo Projeto Lovable

1. Acesse [lovable.dev](https://lovable.dev)
2. Crie nova conta ou faça login
3. Clique em "New Project"
4. Selecione "Import from GitHub"
5. Conecte seu repositório
6. Aguarde a sincronização

### Passo 2: Habilitar Lovable Cloud

1. No projeto, vá em Settings → Cloud
2. Clique em "Enable Lovable Cloud"
3. Aguarde a criação do Supabase (alguns segundos)
4. Anote o novo `PROJECT_ID` (será diferente do antigo)

### Passo 3: Executar SQL

1. Vá em Settings → Cloud → Open Cloud Dashboard
2. Navegue até SQL Editor
3. Abra o arquivo `docs/SQL_COMPLETE.sql`
4. Execute o script completo
5. Verifique se não há erros

### Passo 4: Configurar Secrets

1. Vá em Settings → Cloud → Secrets
2. Para cada secret listado em `ENVIRONMENT.md`:
   - Clique em "Add Secret"
   - Cole o nome exato
   - Cole o valor
   - Salve

### Passo 5: Atualizar n8n

1. No n8n, encontre o workflow `system-status`
2. Verifique se o endpoint está público
3. Nos workflows que chamam `redis-callback`:
   - Atualize a URL: `https://[NOVO_PROJECT_ID].supabase.co/functions/v1/redis-callback`
   - Atualize o header `x-callback-secret` com o novo valor

### Passo 6: Testar Tudo

Execute os testes na ordem:

```bash
# 1. Testar endpoint público
curl https://nwh.visualvendas.cloud/webhook/system-status

# 2. Testar Edge Function (substituir PROJECT_ID)
curl -X POST https://[PROJECT_ID].supabase.co/functions/v1/n8n-proxy \
  -H "Content-Type: application/json" \
  -d '{"webhookUrl": "https://test.n8n.cloud/webhook/test", "payload": {}}'
```

---

## 📄 ARQUIVOS DE REFERÊNCIA

| Arquivo | Descrição |
|---------|-----------|
| `docs/SQL_COMPLETE.sql` | Script SQL completo |
| `docs/N8N_INTEGRATION.md` | Documentação n8n |
| `docs/API_CONTRACTS.md` | Contratos de API |
| `docs/ENVIRONMENT.md` | Variáveis de ambiente |
| `docs/ARCHITECTURE.md` | Arquitetura do sistema |
| `.env.example` | Template de .env |

---

## 🚨 PROBLEMAS COMUNS

### Erro: "function is_admin does not exist"

**Causa:** Script SQL não executado completamente.

**Solução:** Re-executar a PARTE 7 (Funções) do SQL.

### Erro: "permission denied for table"

**Causa:** RLS policies não aplicadas.

**Solução:** Re-executar a PARTE 9 (RLS) do SQL.

### Erro: "CORS" ao chamar n8n

**Causa:** Chamando n8n direto do frontend.

**Solução:** Usar `n8n-proxy` Edge Function.

### Erro: "Unauthorized" no callback

**Causa:** Secret não configurado ou diferente.

**Solução:** Verificar `N8N_CALLBACK_SECRET` em ambos os lados.

### Erro: "No credits"

**Causa:** Trigger de novo usuário não executou.

**Solução:** 
1. Verificar se trigger existe
2. Ou inserir manualmente:
```sql
INSERT INTO user_credits (user_id, credits_balance)
SELECT id, 10 FROM auth.users WHERE email = 'usuario@email.com';
```

---

## 📞 CONTATOS E RECURSOS

- **Documentação Lovable:** [docs.lovable.dev](https://docs.lovable.dev)
- **Documentação Supabase:** [supabase.com/docs](https://supabase.com/docs)
- **Documentação n8n:** [docs.n8n.io](https://docs.n8n.io)

---

## ✅ SUCESSO!

Se todos os itens do checklist estiverem marcados:

1. ✅ Banco de dados configurado
2. ✅ Secrets configurados
3. ✅ n8n integrado
4. ✅ Testes passando
5. ✅ Admin configurado

**O sistema está pronto para uso!**

---

## 📝 NOTAS FINAIS

### Para o próximo Lovable Agent

Quando receber este projeto:

1. **Leia primeiro:** `docs/COMPLETE_MIGRATION.md` (este arquivo)
2. **Execute:** `docs/SQL_COMPLETE.sql` no banco
3. **Configure:** Todos os secrets de `docs/ENVIRONMENT.md`
4. **Teste:** Endpoint n8n `/webhook/system-status`
5. **Valide:** Hook `useSystemStatus.ts` está funcionando

### Arquivos que NUNCA devem ser editados

- `src/integrations/supabase/client.ts` (auto-gerado)
- `src/integrations/supabase/types.ts` (auto-gerado)
- `supabase/config.toml` (auto-gerado)
- `.env` (auto-gerado)

### Arquivos importantes para entender o sistema

1. `src/hooks/useSystemStatus.ts` - Lógica de monitoramento
2. `supabase/functions/n8n-proxy/index.ts` - Proxy n8n
3. `supabase/functions/redis-callback/index.ts` - Callback n8n
4. `docs/N8N_INTEGRATION.md` - Documentação técnica n8n
