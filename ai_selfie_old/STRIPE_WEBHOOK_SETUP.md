# Configuração do Webhook Stripe

## Passo a Passo

### 1. Acesse o Stripe Dashboard
- Vá para: https://dashboard.stripe.com/webhooks
- Clique em "Add endpoint"

### 2. Configure o Endpoint

**Para Produção:**
- **Endpoint URL**: `https://seu-dominio.com/api/stripe-webhook`
  - Substitua `seu-dominio.com` pelo seu domínio real (ex: `ai-selfi.vercel.app`)

**Para Desenvolvimento Local:**
- Use o Stripe CLI (veja seção abaixo)

### 3. Selecione os Eventos

Marque apenas este evento:
- ✅ `checkout.session.completed`

### 4. Copie o Webhook Secret

Após criar o webhook:
1. Clique no webhook criado
2. Na seção "Signing secret", clique em "Reveal"
3. Copie o secret (começa com `whsec_`)
4. Adicione ao seu `.env`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_seu_secret_aqui
   ```

### 5. Teste o Webhook

Você pode testar enviando eventos de teste pelo Stripe Dashboard:
- Clique no webhook → "Send test webhook"
- Selecione `checkout.session.completed`
- Clique em "Send test webhook"

---

## Desenvolvimento Local com Stripe CLI

Para testar localmente sem expor seu servidor:

### 1. Instale o Stripe CLI
```bash
# macOS
brew install stripe/stripe-cli/stripe

# Linux
# Baixe de: https://github.com/stripe/stripe-cli/releases
```

### 2. Faça login
```bash
stripe login
```

### 3. Inicie o forwarding
```bash
stripe listen --forward-to localhost:3000/api/stripe-webhook
```

Isso vai:
- Criar um webhook local
- Mostrar o webhook secret (começa com `whsec_`)
- Encaminhar eventos para seu servidor local

### 4. Adicione o secret ao .env
```env
STRIPE_WEBHOOK_SECRET=whsec_seu_secret_do_cli
```

### 5. Teste eventos
Em outro terminal:
```bash
stripe trigger checkout.session.completed
```

---

## Verificação

Após configurar, você deve ver nos logs do servidor:
```
[Stripe Webhook] Received event: checkout.session.completed
[Stripe Webhook] Added X credits to user Y
```

Se houver erros, verifique:
- ✅ O `STRIPE_WEBHOOK_SECRET` está correto no `.env`
- ✅ A URL do webhook está acessível
- ✅ O evento `checkout.session.completed` está selecionado
- ✅ O servidor está rodando e acessível

