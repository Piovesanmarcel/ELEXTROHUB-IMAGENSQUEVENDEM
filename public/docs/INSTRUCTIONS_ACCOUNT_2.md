# INSTRUÇÕES PARA LOVABLE - CONTA 2

## 📌 CONTEXTO DO PROJETO

Este é o **ElectroHub**, uma plataforma de geração de imagens de marketing para e-commerce com IA.

**Stack:**
- Frontend: React + Vite + TypeScript + Tailwind CSS + shadcn/ui
- Backend: Lovable Cloud (Supabase)
- Automação: n8n
- 52 Edge Functions

---

## 🚀 PASSO A PASSO DE CONFIGURAÇÃO

### Passo 1: Conectar GitHub

```
1. Acessar Settings → GitHub
2. Conectar ao repositório: [URL_DO_REPOSITÓRIO]
3. Sincronizar branch principal (main)
4. Aguardar build completo
```

### Passo 2: Habilitar Lovable Cloud

```
1. O Lovable Cloud será habilitado automaticamente após conectar o GitHub
2. Aguardar criação do projeto Supabase
3. Anotar o novo PROJECT_ID (será diferente do antigo)
```

### Passo 3: Executar SQL Completo

**MUITO IMPORTANTE!**

1. Copiar o conteúdo completo de `/docs/SQL_COMPLETE.sql`
2. Executar via ferramenta de migração do Lovable
3. Este script cria:
   - 22 tabelas
   - 12 funções de banco
   - Todas as RLS policies
   - Storage bucket `marketing-templates`

### Passo 4: Configurar Secrets (7 obrigatórios)

```
Settings → Cloud → Secrets

OBRIGATÓRIOS:
├── STRIPE_SECRET_KEY          (sk_live_... ou sk_test_...)
├── CLOUDINARY_API_KEY         (número de 15 dígitos)
├── CLOUDINARY_API_SECRET      (string alfanumérica)
├── CLOUDINARY_CLOUD_NAME      (nome do cloud)
├── GOOGLE_GEMINI_API_KEY      (AIza...)
├── OPENAI_API_KEY             (sk-...)
└── N8N_CALLBACK_SECRET        (string de 32+ caracteres)
```

### Passo 5: Verificar Edge Functions

As 52 Edge Functions serão deployadas automaticamente.

Verificar em: **Settings → Cloud → Edge Functions**

Principais funções:
- `n8n-proxy` - Proxy para webhooks n8n
- `redis-callback` - Recebe callbacks do n8n
- `check-admin` - Verifica role admin
- `check-subscription` - Verifica assinatura
- `create-credits-checkout` - Checkout Stripe
- `unified-commands` - Comandos IA unificados

### Passo 6: Configurar n8n

```
1. Atualizar URLs de callback nos workflows n8n para usar novo PROJECT_ID:
   https://[NOVO_PROJECT_ID].supabase.co/functions/v1/redis-callback

2. Configurar header x-callback-secret com o valor de N8N_CALLBACK_SECRET

3. Testar endpoint:
   GET https://nwh.visualvendas.cloud/webhook/system-status
```

### Passo 7: Promover Primeiro Admin

Após criar a primeira conta de usuário, execute:

```sql
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users 
WHERE email = 'email-do-admin@exemplo.com';
```

---

## ✅ CHECKLIST DE VALIDAÇÃO

Execute estes testes na ordem:

### 1. Verificar Banco de Dados
- [ ] 22 tabelas criadas
- [ ] 12 funções criadas (is_admin, has_role, etc.)
- [ ] RLS habilitado em todas as tabelas
- [ ] Bucket `marketing-templates` criado

### 2. Verificar Secrets
- [ ] STRIPE_SECRET_KEY
- [ ] CLOUDINARY_API_KEY
- [ ] CLOUDINARY_API_SECRET
- [ ] CLOUDINARY_CLOUD_NAME
- [ ] GOOGLE_GEMINI_API_KEY
- [ ] OPENAI_API_KEY
- [ ] N8N_CALLBACK_SECRET

### 3. Verificar Edge Functions
- [ ] 52 Edge Functions deployadas
- [ ] `n8n-proxy` ativo
- [ ] `redis-callback` ativo

### 4. Testar Funcionalidades
- [ ] Login/Signup funcionando
- [ ] `/system-status` retornando dados do n8n
- [ ] `/migration-guide` acessível
- [ ] Primeiro admin configurado
- [ ] Créditos iniciais (10) criados para novos usuários

---

## 📄 ARQUIVOS DE REFERÊNCIA

| Arquivo | Descrição |
|---------|-----------|
| `/docs/HANDOVER.md` | Documento de transferência |
| `/docs/SQL_COMPLETE.sql` | Script SQL completo |
| `/docs/N8N_INTEGRATION.md` | Documentação n8n |
| `/docs/API_CONTRACTS.md` | Contratos de API |
| `/docs/ENVIRONMENT.md` | Variáveis de ambiente |
| `/docs/ARCHITECTURE.md` | Arquitetura do sistema |
| `/docs/COMPLETE_MIGRATION.md` | Guia detalhado |

---

## 🚨 PROBLEMAS COMUNS

### Erro: "function is_admin does not exist"
**Causa:** SQL não executado completamente.
**Solução:** Re-executar SQL_COMPLETE.sql

### Erro: CORS ao chamar n8n
**Causa:** Chamando n8n direto do frontend.
**Solução:** Usar Edge Function `n8n-proxy`

### Erro: "Unauthorized" no callback
**Causa:** Secret não configurado ou diferente.
**Solução:** Verificar N8N_CALLBACK_SECRET

### Erro: "No credits" para novos usuários
**Causa:** Trigger de novo usuário não executou.
**Solução:** Verificar trigger ou inserir manualmente créditos.

---

## 💡 PROMPT INICIAL PARA LOVABLE

Copie e cole este texto na primeira mensagem do Lovable na conta 2:

```
Olá! Este é o projeto ElectroHub migrado de outra conta Lovable.

Por favor:
1. Leia /docs/HANDOVER.md para contexto geral
2. Leia /docs/COMPLETE_MIGRATION.md para instruções detalhadas
3. Execute o SQL de /docs/SQL_COMPLETE.sql no banco de dados
4. Configure os 7 secrets obrigatórios listados em /docs/ENVIRONMENT.md

Após configuração, valide:
- Login funcionando
- Endpoint https://nwh.visualvendas.cloud/webhook/system-status retornando OK
- Página /migration-guide acessível

Se algo não funcionar, consulte /docs/INSTRUCTIONS_ACCOUNT_2.md para troubleshooting.
```

---

## 📞 SUPORTE

Se algo não funcionar:
1. Verifique os logs em Settings → Cloud → Logs
2. Confirme se todos os secrets estão configurados
3. Teste endpoints individualmente
4. Consulte a documentação em /docs/

---

**Última atualização:** 2026-01-14
**Versão:** 1.0.0
