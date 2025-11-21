# Upload Example Images to Supabase Storage

## Problema

As imagens de exemplo estão em `client/public/` e são servidas localmente. Quando a Edge Function roda no Supabase Cloud, ela não consegue acessar `localhost:3000`.

## Solução

Fazer upload das imagens de exemplo para o Supabase Storage e usar URLs públicas.

## Passos

### 1. Criar um bucket público para imagens de exemplo

No Supabase Dashboard:
1. Vá em **Storage**
2. Clique em **New bucket**
3. Nome: `example-images`
4. **Public bucket**: ✅ (marcar como público)
5. **File size limit**: 5MB (ou mais se necessário)
6. Clique em **Create bucket**

### 2. Fazer upload das imagens

Você pode fazer upload via Dashboard ou criar um script:

**Via Dashboard:**
1. Vá em **Storage** → **example-images**
2. Clique em **Upload file**
3. Faça upload de todas as imagens de exemplo:
   - `image.webp`
   - `image_1.webp`
   - `image_10.webp`
   - `image_100.jpg`
   - `image_101.jpg`
   - `image_102.jpg`

**Via Script (opcional):**
```bash
# Instalar Supabase CLI se ainda não tiver
npm install -g supabase

# Fazer login
supabase login

# Linkar ao projeto
supabase link --project-ref gxwtcdplfkjfidwyrunk

# Fazer upload (exemplo)
supabase storage upload example-images image.webp --bucket example-images
```

### 3. Obter URLs públicas

Após fazer upload, você pode obter as URLs públicas:

**Via Dashboard:**
1. Vá em **Storage** → **example-images**
2. Clique na imagem
3. Copie a URL pública (formato: `https://gxwtcdplfkjfidwyrunk.supabase.co/storage/v1/object/public/example-images/image.webp`)

**Via código:**
```typescript
const { data } = supabase.storage
  .from('example-images')
  .getPublicUrl('image.webp');
console.log(data.publicUrl);
```

### 4. Atualizar `exampleImages.ts`

Atualize o arquivo `client/src/data/exampleImages.ts` com as URLs públicas:

```typescript
export const exampleImages: ExampleImage[] = [
  {
    id: 1,
    url: "https://gxwtcdplfkjfidwyrunk.supabase.co/storage/v1/object/public/example-images/image.webp",
    // ... resto
  },
  {
    id: 2,
    url: "https://gxwtcdplfkjfidwyrunk.supabase.co/storage/v1/object/public/example-images/image_1.webp",
    // ... resto
  },
  // ... etc
];
```

### 5. Alternativa: Usar variável de ambiente

Se você quiser manter URLs relativas mas usar um domínio público em produção:

1. Adicione no `.env`:
   ```
   VITE_PUBLIC_DOMAIN=https://seu-dominio.com
   ```

2. O código já está preparado para usar `VITE_PUBLIC_DOMAIN` se disponível

## Verificação

Após fazer upload e atualizar as URLs, teste a geração de imagens. A Edge Function deve conseguir baixar as imagens corretamente.

## Estrutura recomendada no Storage

```
example-images/
  image.webp
  image_1.webp
  image_10.webp
  image_100.jpg
  image_101.jpg
  image_102.jpg
```

Todos os arquivos na raiz do bucket para facilitar acesso.

