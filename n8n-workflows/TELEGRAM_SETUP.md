# 🤖 Guia: Configurar Bot Telegram para n8n

## Passo 1: Criar Bot no Telegram

1. **Abra o Telegram** e busque por `@BotFather`
2. Envie o comando: `/newbot`
3. Escolha um **nome** para o bot (ex: `ElectroHub Alertas`)
4. Escolha um **username** único (ex: `electrohub_alertas_bot`)
5. O BotFather vai retornar um **TOKEN** assim:
   ```
   7123456789:AAHxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
   **⚠️ Guarde este token!**

---

## Passo 2: Obter seu Chat ID

1. Inicie uma conversa com seu bot:
   - Busque pelo username que você criou (ex: `@electrohub_alertas_bot`)
   - Clique em **Iniciar** / **Start**

2. Envie qualquer mensagem para o bot (ex: "Olá")

3. Acesse esta URL no navegador (substitua TOKEN):
   ```
   https://api.telegram.org/bot<SEU_TOKEN>/getUpdates
   ```

4. Procure pelo `"chat":{"id":` na resposta JSON:
   ```json
   "chat": {
     "id": 123456789,
     "first_name": "Seu Nome",
     ...
   }
   ```
   **⚠️ Guarde este Chat ID!**

---

## Passo 3: Configurar no n8n

1. Acesse seu n8n: `https://nwh.visualvendas.cloud`
2. Vá em **Settings** → **Credentials** → **Add Credential**
3. Busque por **Telegram API**
4. Preencha:
   - **Credential Name**: `Telegram ElectroHub`
   - **Access Token**: Cole o token do BotFather

---

## Passo 4: Testar o Bot

Teste com cURL:
```bash
curl -X POST "https://api.telegram.org/bot<SEU_TOKEN>/sendMessage" \
  -H "Content-Type: application/json" \
  -d '{"chat_id": <SEU_CHAT_ID>, "text": "🚀 Teste do ElectroHub!"}'
```

Se receber a mensagem no Telegram, está configurado!

---

## Dados para os Workflows

Após configurar, terá:
- **Bot Token**: `7123456789:AAHxxx...`
- **Chat ID**: `123456789`

Esses dados serão usados nos workflows de alertas.
