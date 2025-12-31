# Setup de Packs de Créditos

Este guia explica como criar os packs de créditos necessários para o sistema funcionar corretamente.

## 📦 Packs Necessários

### Page1 (Flow Original) - Variation 1:
- **Starter Pack**: $5.00 - 40 créditos
- **Pro Pack**: $10.00 - 100 créditos
- **Premium Pack**: $15.00 - 150 créditos

### Page2 (Flow Promocional) - Variation 2:
- **Basic Pack**: $5.00 - 40 créditos
- **Standard Pack**: $10.00 - 60 créditos
- **Premium Pack**: $15.00 - 100 créditos

## 🚀 Métodos de Criação

### Método 1: Script TypeScript (Recomendado)

1. **Execute o script:**
   ```bash
   npx tsx scripts/create-credit-packs.ts
   ```

2. **O script irá:**
   - Verificar packs existentes
   - Criar novos packs ou atualizar existentes
   - Mostrar um resumo completo

3. **Adicionar Stripe Price IDs:**
   - Crie os produtos no Stripe Dashboard
   - Copie os `stripePriceId` de cada produto
   - Edite o script e preencha os `stripePriceId`
   - Execute o script novamente

### Método 2: SQL Direto (Supabase)

1. **Acesse o Supabase SQL Editor**

2. **Execute o script SQL:**
   ```bash
   # Copie o conteúdo de supabase/create_credit_packs.sql
   # Cole no SQL Editor e execute
   ```

3. **Adicione os Stripe Price IDs:**
   ```sql
   -- Atualize cada pack com o stripePriceId correto
   UPDATE public.credit_packs 
   SET "stripePriceId" = 'price_xxxxx' 
   WHERE name = 'Starter Pack';
   ```

## ⚙️ Configuração do Stripe

1. **Acesse o Stripe Dashboard** → Products

2. **Crie os produtos:**
   - Starter Pack: $5.00
   - Pro Pack: $10.00
   - Premium Pack: $15.00
   - Basic Pack: $5.00
   - Standard Pack: $10.00
   - Premium Pack (Page2): $15.00

3. **Copie os Price IDs:**
   - Cada produto terá um ou mais preços
   - Copie o `price_xxxxx` de cada um
   - Adicione no banco de dados (via script ou SQL)

## 🔍 Verificação

Após criar os packs, verifique se estão corretos:

```sql
SELECT 
  id,
  name,
  price,
  credits,
  "stripePriceId",
  "createdAt"
FROM public.credit_packs
ORDER BY price ASC;
```

**Resultado esperado:**
- Starter Pack: $5.00, 40 créditos
- Basic Pack: $5.00, 40 créditos
- Pro Pack: $10.00, 100 créditos
- Standard Pack: $10.00, 60 créditos
- Premium Pack: $15.00, 150 créditos
- Premium Pack (Page2): $15.00, 100 créditos

## ⚠️ Notas Importantes

1. **Stripe Price IDs são obrigatórios** para o checkout funcionar
2. **Não duplique packs** com mesmo preço e créditos
3. **Teste o checkout** após criar os packs
4. **Atualize o script** se precisar mudar quantidades de créditos

## 🐛 Troubleshooting

### Pack não aparece na página
- Verifique se o pack foi criado no banco
- Confira os logs do console do navegador
- Verifique se o mapeamento está correto

### Stripe mostra preço errado
- Verifique o `stripePriceId` no banco
- Confirme que o Price ID no Stripe está correto
- Teste o checkout em modo teste do Stripe

### Erro ao criar packs
- Verifique permissões no banco (precisa ser admin ou bypass RLS)
- Confirme que a tabela `credit_packs` existe
- Veja os logs de erro para detalhes

