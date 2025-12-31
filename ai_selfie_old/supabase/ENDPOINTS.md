# Supabase Edge Functions Endpoints

## URLs das Functions

### Generate Images
```
https://gxwtcdplfkjfidwyrunk.supabase.co/functions/v1/generate-images
```

### Train Model
```
https://gxwtcdplfkjfidwyrunk.supabase.co/functions/v1/train-model
```

## Como são construídas

As URLs são construídas automaticamente pela função `getSupabaseFunctionUrl()` no código:

```typescript
function getSupabaseFunctionUrl(functionName: string): string {
  const supabaseUrl = process.env.SUPABASE_URL || "";
  // Remove trailing slash if present
  const baseUrl = supabaseUrl.endsWith("/") 
    ? supabaseUrl.slice(0, -1) 
    : supabaseUrl;
  // Edge Functions are at /functions/v1/<function-name>
  return `${baseUrl}/functions/v1/${functionName}`;
}
```

**Fórmula:** `${SUPABASE_URL}/functions/v1/${functionName}`

## Autenticação

As functions requerem autenticação via header `Authorization` com a Service Role Key:

```typescript
headers: {
  "Content-Type": "application/json",
  Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
  "apikey": SUPABASE_SERVICE_ROLE_KEY,
}
```

## Testar manualmente

### Generate Images
```bash
curl -X POST \
  https://gxwtcdplfkjfidwyrunk.supabase.co/functions/v1/generate-images \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "apikey: YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "batchId": 123,
    "userId": 456,
    "modelId": 789,
    "trainingImageUrls": ["https://..."],
    "exampleImages": [{"id": 1, "url": "https://...", "prompt": "..."}],
    "basePrompt": "Create a photorealistic...",
    "aspectRatio": "1:1",
    "numImagesPerExample": 4,
    "glasses": "no",
    "backgrounds": [],
    "styles": []
  }'
```

### Train Model
```bash
curl -X POST \
  https://gxwtcdplfkjfidwyrunk.supabase.co/functions/v1/train-model \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "apikey: YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "modelId": 123,
    "userId": 456,
    "trainingImageUrls": ["https://..."]
  }'
```

## Verificar se estão funcionando

Você pode verificar os logs das functions no Supabase Dashboard:
- **Edge Functions** → Selecione a function → **Logs**

Ou via CLI:
```bash
supabase functions logs generate-images
supabase functions logs train-model
```

