/**
 * Script para criar os packs de créditos no banco de dados
 * Execute com: npx tsx scripts/create-credit-packs.ts
 */

import { getDb } from "../server/db.js";
import { creditPacks } from "../drizzle/schema.js";
import { eq } from "drizzle-orm";

const db = getDb();

// Definir os packs necessários
const packsToCreate = [
  // ============================================
  // PAGE1 VARIANTS (Flow Original)
  // ============================================
  {
    name: "Starter Pack",
    description: "40 professional AI-generated photos",
    price: "29.00",
    credits: 40,
    stripePriceId: null as string | null, // Você precisará adicionar o stripePriceId do Stripe
  },
  {
    name: "Pro Pack",
    description: "100 professional AI-generated photos",
    price: "39.00",
    credits: 100,
    stripePriceId: null as string | null,
  },
  {
    name: "Premium Pack",
    description: "150 professional AI-generated photos",
    price: "49.00",
    credits: 150, // Altere para 140 se preferir
    stripePriceId: null as string | null,
  },
  
  // ============================================
  // PAGE2 VARIANTS (Flow com Preços Promocionais)
  // ============================================
  {
    name: "Basic Pack",
    description: "40 professional AI-generated photos",
    price: "18.00",
    credits: 40,
    stripePriceId: null as string | null,
  },
  {
    name: "Standard Pack",
    description: "60 professional AI-generated photos",
    price: "25.00",
    credits: 60,
    stripePriceId: null as string | null,
  },
  {
    name: "Premium Pack (Page2)",
    description: "100 professional AI-generated photos",
    price: "40.00",
    credits: 100,
    stripePriceId: null as string | null,
  },
];

async function createPacks() {
  console.log("🚀 Iniciando criação de packs de créditos...\n");

  try {
    // Verificar packs existentes
    const existingPacks = await db.select().from(creditPacks);
    console.log(`📦 Packs existentes no banco: ${existingPacks.length}`);
    
    if (existingPacks.length > 0) {
      console.log("\n📋 Packs existentes:");
      existingPacks.forEach((pack) => {
        console.log(`  - ID: ${pack.id}, Nome: ${pack.name}, Preço: $${pack.price}, Créditos: ${pack.credits}`);
      });
      console.log("\n⚠️  Se você continuar, os packs com mesmo preço e créditos serão atualizados (ON CONFLICT).");
      console.log("   Para evitar conflitos, você pode deletar os packs existentes primeiro.\n");
    }

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const pack of packsToCreate) {
      try {
        // Verificar se já existe um pack com mesmo preço e créditos
        const existing = existingPacks.find(
          (p) => p.price === pack.price && p.credits === pack.credits
        );

        if (existing) {
          // Atualizar pack existente
          await db
            .update(creditPacks)
            .set({
              name: pack.name,
              description: pack.description,
              stripePriceId: pack.stripePriceId,
            })
            .where(eq(creditPacks.id, existing.id));
          
          console.log(`✅ Atualizado: ${pack.name} (ID: ${existing.id}) - $${pack.price}, ${pack.credits} créditos`);
          updated++;
        } else {
          // Criar novo pack
          const result = await db.insert(creditPacks).values({
            name: pack.name,
            description: pack.description,
            price: pack.price,
            credits: pack.credits,
            stripePriceId: pack.stripePriceId,
          }).returning();
          
          console.log(`✅ Criado: ${pack.name} (ID: ${result[0].id}) - $${pack.price}, ${pack.credits} créditos`);
          created++;
        }
      } catch (error: any) {
        console.error(`❌ Erro ao criar/atualizar ${pack.name}:`, error.message);
        skipped++;
      }
    }

    console.log(`\n📊 Resumo:`);
    console.log(`   ✅ Criados: ${created}`);
    console.log(`   🔄 Atualizados: ${updated}`);
    console.log(`   ⏭️  Ignorados: ${skipped}`);

    // Listar todos os packs finais
    console.log(`\n📦 Packs finais no banco:`);
    const finalPacks = await db.select().from(creditPacks).orderBy(creditPacks.price);
    finalPacks.forEach((pack) => {
      console.log(`   - ID: ${pack.id} | ${pack.name.padEnd(25)} | $${pack.price.toString().padStart(6)} | ${pack.credits.toString().padStart(3)} créditos`);
    });

    console.log("\n✨ Processo concluído!");
    console.log("\n⚠️  PRÓXIMOS PASSOS:");
    console.log("   1. Crie os produtos no Stripe Dashboard");
    console.log("   2. Copie os stripePriceId de cada produto");
    console.log("   3. Execute este script novamente com os stripePriceId preenchidos");
    console.log("   4. Ou atualize manualmente no banco: UPDATE credit_packs SET \"stripePriceId\" = 'price_xxx' WHERE id = X;");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Erro fatal:", error);
    process.exit(1);
  }
}

createPacks();

