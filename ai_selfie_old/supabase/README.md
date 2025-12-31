# Supabase Edge Functions

Este diretório contém as Supabase Edge Functions para processamento assíncrono de treinamento de modelos e geração de imagens.

## Funções Disponíveis

### 1. `train-model`
Processa o treinamento de modelos de forma assíncrona. As imagens de treinamento são baixadas do Supabase Storage e processadas.

**Endpoint:** `https://[project-ref].supabase.co/functions/v1/train-model`

**Payload:**
```json
{
  "modelId": 123,
  "userId": 456,
  "trainingImageUrls": ["https://...", "https://..."]
}
```

### 2. `generate-images`
Gera imagens usando a API Gemini de forma assíncrona. As imagens geradas são automaticamente salvas no Supabase Storage e registradas no banco de dados.

**Endpoint:** `https://[project-ref].supabase.co/functions/v1/generate-images`

**Payload:**
```json
{
  "batchId": 789,
  "userId": 456,
  "modelId": 123,
  "referenceImageUrls": ["https://...", "https://..."],
  "prompt": "Create a photorealistic professional portrait...",
  "aspectRatio": "1:1",
  "totalImages": 4
}
```

## Configuração

### Variáveis de Ambiente Necessárias

As seguintes variáveis de ambiente devem estar configuradas no Supabase Dashboard:

- `SUPABASE_URL` - URL do projeto Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Service Role Key do Supabase
- `GEMINI_API_KEY` - Chave da API Gemini
- `GEMINI_MODEL_NAME` (opcional) - Nome do modelo Gemini (padrão: `gemini-2.5-flash-image`)

### Como Configurar no Supabase Dashboard

1. Acesse o Supabase Dashboard
2. Vá em **Project Settings** > **Edge Functions**
3. Configure as variáveis de ambiente listadas acima

## Deploy

### Usando Supabase CLI

```bash
# Instalar Supabase CLI (se ainda não tiver)
npm install -g supabase

# Fazer login
supabase login

# Linkar ao projeto
supabase link --project-ref gxwtcdplfkjfidwyrunk

# Deploy das functions
supabase functions deploy train-model
supabase functions deploy generate-images
```

### Usando o Dashboard

1. Acesse o Supabase Dashboard
2. Vá em **Edge Functions**
3. Clique em **Create a new function**
4. Faça upload dos arquivos de cada function

## Como Funciona

### Treinamento de Modelos

1. O frontend cria um modelo com status "training"
2. O servidor chama a Edge Function `train-model` de forma assíncrona
3. A Edge Function:
   - Baixa as imagens de treinamento do Supabase Storage
   - Processa o treinamento (atualmente simulado)
   - Atualiza o status do modelo para "ready" quando concluído

### Geração de Imagens

1. O frontend cria um batch com status "processing"
2. Os créditos são deduzidos imediatamente
3. O servidor chama a Edge Function `generate-images` de forma assíncrona
4. A Edge Function:
   - Baixa as imagens de referência do Supabase Storage
   - Gera imagens usando a API Gemini
   - Faz upload das imagens geradas para o Supabase Storage
   - Cria registros de fotos no banco de dados
   - Atualiza o status do batch para "completed"

## Vantagens

- **Processamento Assíncrono**: As operações continuam mesmo se o site estiver fechado
- **Escalabilidade**: Edge Functions escalam automaticamente
- **Confiabilidade**: Processamento isolado do servidor principal
- **Monitoramento**: Logs disponíveis no Supabase Dashboard

## Troubleshooting

### Verificar Logs

```bash
# Ver logs de uma function específica
supabase functions logs train-model
supabase functions logs generate-images
```

Ou no Dashboard: **Edge Functions** > **Selecione a function** > **Logs**

### Testar Localmente

```bash
# Iniciar Supabase localmente
supabase start

# Executar function localmente
supabase functions serve train-model
supabase functions serve generate-images
```

### Erros Comuns

1. **"Missing Supabase environment variables"**
   - Verifique se as variáveis de ambiente estão configuradas no Dashboard

2. **"Failed to download training images"**
   - Verifique se as URLs das imagens estão corretas
   - Verifique as políticas RLS do bucket `model-training-images`

3. **"Gemini API error"**
   - Verifique se `GEMINI_API_KEY` está configurada corretamente
   - Verifique se há rate limits na API Gemini

