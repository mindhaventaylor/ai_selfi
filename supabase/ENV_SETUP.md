# Configuração de Variáveis de Ambiente no Supabase

## ⚠️ Importante: Restrição do Supabase

O Supabase **NÃO permite** criar variáveis de ambiente que começam com o prefixo `SUPABASE_`. 

## Variáveis Necessárias

Configure as seguintes variáveis no **Supabase Dashboard** → **Project Settings** → **Edge Functions** → **Secrets**:

### Variáveis Obrigatórias

1. **PROJECT_URL** (ou use a variável automática `SUPABASE_URL`)
   - Valor: `https://gxwtcdplfkjfidwyrunk.supabase.co`
   - Nota: O Supabase fornece automaticamente `SUPABASE_URL`, mas você pode usar `PROJECT_URL` como alternativa

2. **SERVICE_ROLE_KEY** (ou use a variável automática `SUPABASE_SERVICE_ROLE_KEY`)
   - Valor: Sua Service Role Key (encontre em Project Settings → API)
   - Nota: O Supabase fornece automaticamente `SUPABASE_SERVICE_ROLE_KEY`, mas você pode usar `SERVICE_ROLE_KEY` como alternativa

3. **GEMINI_API_KEY**
   - Valor: Sua chave da API Gemini
   - Exemplo: `AIzaSyA-7_0RKEYOcDRkwBuVlJTWQycGh5tW8K8`

### Variáveis Opcionais

4. **GEMINI_MODEL_NAME** (opcional)
   - Valor padrão: `gemini-2.5-flash-image`
   - Outros valores possíveis: `gemini-2.5-flash-preview-image`

## Como Configurar no Dashboard

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto (`gxwtcdplfkjfidwyrunk`)
3. Vá em **Project Settings** (ícone de engrenagem no canto inferior esquerdo)
4. Clique em **Edge Functions** no menu lateral
5. Role até a seção **Secrets**
6. Clique em **Add new secret** para cada variável
7. Configure:
   - **Name**: Nome da variável (sem prefixo `SUPABASE_`)
   - **Value**: Valor da variável
8. Clique em **Save**

## Variáveis Automáticas do Supabase

O Supabase fornece automaticamente estas variáveis (não precisa configurar):

- `SUPABASE_URL` - URL do projeto
- `SUPABASE_ANON_KEY` - Chave anônima
- `SUPABASE_SERVICE_ROLE_KEY` - Service Role Key

**Nota**: As Edge Functions foram atualizadas para tentar usar primeiro as variáveis automáticas (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) e depois as alternativas (`PROJECT_URL`, `SERVICE_ROLE_KEY`) como fallback.

## Verificação

Após configurar, você pode verificar se as variáveis estão corretas:

```bash
# Ver logs das functions (as variáveis aparecerão nos logs se houver erro)
supabase functions logs generate-images
supabase functions logs train-model
```

## Troubleshooting

### Erro: "Missing required environment variables"
- Verifique se todas as variáveis obrigatórias estão configuradas
- Certifique-se de que os nomes estão corretos (case-sensitive)
- Verifique se não há espaços extras nos valores

### Erro: "Name must not start with the SUPABASE_ prefix"
- Não crie variáveis com nomes que começam com `SUPABASE_`
- Use `PROJECT_URL` ao invés de `SUPABASE_URL` (ou use a variável automática)
- Use `SERVICE_ROLE_KEY` ao invés de `SUPABASE_SERVICE_ROLE_KEY` (ou use a variável automática)

### As variáveis automáticas não funcionam?
- Certifique-se de que está usando a versão mais recente do Supabase CLI
- Tente usar os nomes alternativos (`PROJECT_URL`, `SERVICE_ROLE_KEY`)

