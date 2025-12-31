# Configuração da API Gemini no Google Cloud

## ⚠️ Erro 403: "Method doesn't allow unregistered callers"

Este erro indica que a API Key não está sendo reconhecida pelo Google Cloud. Siga estes passos:

## 1. Verificar se a API está Habilitada

1. Acesse o [Google Cloud Console](https://console.cloud.google.com)
2. Selecione o projeto: **ia-rag** (Project ID: `ia-rag-473917`)
3. Vá em **APIs & Services** → **Enabled APIs** (ou **Library**)
4. Procure por **"Generative Language API"** ou **"Gemini API"**
5. Se não estiver habilitada, clique em **Enable**

## 2. Criar ou Verificar a API Key

1. No Google Cloud Console, vá em **APIs & Services** → **Credentials**
2. Clique em **Create Credentials** → **API Key**
3. Ou use uma API Key existente
4. **IMPORTANTE**: Configure as restrições da API Key:
   - **API restrictions**: Selecione "Restrict key"
   - Adicione **"Generative Language API"** à lista de APIs permitidas
   - **Application restrictions**: Pode deixar "None" para testes, ou configurar restrições de IP/HTTP referrer

## 3. Configurar no Supabase Secrets

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto (`gxwtcdplfkjfidwyrunk`)
3. Vá em **Project Settings** → **Edge Functions** → **Secrets**
4. Adicione ou verifique a variável:
   - **Name**: `GEMINI_API_KEY`
   - **Value**: Sua API Key do Google Cloud (começa com `AIza...`)
5. Clique em **Save**

## 4. Verificar a API Key

A API Key deve:
- Começar com `AIza`
- Ter aproximadamente 39 caracteres
- Estar ativa no Google Cloud Console
- Ter a "Generative Language API" habilitada no projeto

## 5. Testar Localmente (Opcional)

Você pode testar a API Key diretamente:

```bash
curl -X POST \
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=YOUR_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "contents": [{
      "parts": [{
        "text": "Hello"
      }]
    }]
  }'
```

Substitua `YOUR_API_KEY` pela sua chave real.

## 6. Verificar Logs da Edge Function

Após configurar, faça o deploy e verifique os logs:

```bash
supabase functions logs generate-images --follow
```

Os logs devem mostrar:
- `GEMINI_API_KEY: ✅ Set (length: XX)` - Se a chave está sendo lida
- `Using API key: AIza...XXXX (length: XX)` - Preview da chave sendo usada

## Troubleshooting

### Erro 403 persiste após configurar a API Key

1. **Verifique se a API está habilitada**: 
   - Vá em Google Cloud Console → APIs & Services → Enabled APIs
   - Procure por "Generative Language API" ou "Gemini API"
   - Se não estiver, habilite-a

2. **Verifique as restrições da API Key**:
   - Vá em APIs & Services → Credentials
   - Clique na sua API Key
   - Verifique se "Generative Language API" está na lista de APIs permitidas

3. **Verifique se a API Key está correta no Supabase**:
   - Vá em Supabase Dashboard → Project Settings → Edge Functions → Secrets
   - Verifique se `GEMINI_API_KEY` está configurada corretamente
   - Certifique-se de que não há espaços extras ou caracteres inválidos

4. **Verifique o projeto do Google Cloud**:
   - Certifique-se de que está usando o projeto correto: **ia-rag** (Project ID: `ia-rag-473917`)
   - A API Key deve estar associada a este projeto

### A API Key não aparece nos logs

- Verifique se o nome da variável está correto: `GEMINI_API_KEY` (case-sensitive)
- Certifique-se de que fez o deploy da função após configurar o secret
- Verifique se não há erros de sintaxe na função

## Informações do Projeto

- **Project Name**: ia rag
- **Project ID**: ia-rag-473917
- **Project Number**: 376832868443

Certifique-se de que a API Key está associada a este projeto específico.

