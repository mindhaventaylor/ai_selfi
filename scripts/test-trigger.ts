import postgres from "postgres";
import "dotenv/config";

// dotenv/config automatically loads .env from project root

// Try to get DATABASE_URL
let databaseUrl = process.env.DATABASE_URL || "";

if (!databaseUrl || databaseUrl.includes("[YOUR_PASSWORD]") || databaseUrl.includes("[YOUR_SUPABASE_DB_PASSWORD]")) {
  console.error("❌ DATABASE_URL não está configurado corretamente!");
  console.error("");
  console.error("   O DATABASE_URL tem um placeholder. Configure com a senha real:");
  console.error("");
  console.error("   1. Vá ao Supabase Dashboard → Settings → Database");
  console.error("   2. Copie a Connection String (use 'Connection pooling' ou 'Direct connection')");
    console.error("   3. Edite .env e substitua [YOUR_PASSWORD] pela senha real");
  console.error("");
  console.error("   Formato esperado:");
  console.error("   DATABASE_URL=postgresql://postgres.gxwtcdplfkjfidwyrunk:SUA_SENHA@db.gxwtcdplfkjfidwyrunk.supabase.co:5432/postgres");
  console.error("");
  console.error("   Ou use connection pooling:");
  console.error("   DATABASE_URL=postgresql://postgres.gxwtcdplfkjfidwyrunk:SUA_SENHA@aws-0-us-east-1.pooler.supabase.com:6543/postgres");
  process.exit(1);
}

console.log("📋 DATABASE_URL configurado:", databaseUrl.replace(/:[^:@]+@/, ":***@"));

console.log("🔌 Conectando ao banco...");

async function testTrigger() {
  let sql: postgres.Sql | null = null;
  let databaseUrlToUse = databaseUrl;

  // If using direct connection, try pooling first
  if (databaseUrl.includes("db.") && databaseUrl.includes(".supabase.co:5432")) {
    console.log("💡 Tentando connection pooling (mais confiável)...");
    databaseUrlToUse = databaseUrl.replace(
      /db\.([^.]+)\.supabase\.co:5432/,
      "aws-0-us-east-1.pooler.supabase.com:6543"
    );
  }

  try {
    sql = postgres(databaseUrlToUse, {
      max: 1,
      idle_timeout: 20,
      connect_timeout: 10,
    });

    // Test connection
    await sql`SELECT 1`;
    console.log("✅ Conexão estabelecida");

    // Check if trigger exists
    const triggerCheck = await sql`
      SELECT 
        trigger_name, 
        event_object_table, 
        action_timing, 
        event_manipulation
      FROM information_schema.triggers
      WHERE trigger_name = 'photo_job_trigger'
    `;

    if (triggerCheck.length === 0) {
      console.error("❌ Trigger 'photo_job_trigger' não encontrado!");
      console.error("   Execute o SQL em supabase/triggers/photo_generation_queue_trigger.sql");
      await sql.end();
      process.exit(1);
    }

    console.log("✅ Trigger encontrado:", triggerCheck[0]);

    // Listen for notifications
    console.log("👂 Escutando notificações no canal 'photo_generation_queue_channel'...");
    console.log("   (Insira um job na tabela para testar)");

    sql.listen("photo_generation_queue_channel", (payload) => {
      console.log("📨 NOTIFICAÇÃO RECEBIDA:", payload);
      try {
        const jobData = typeof payload === "string" ? JSON.parse(payload) : payload;
        console.log("📋 Job ID:", jobData.id || jobData.job?.id);
        console.log("📋 Batch ID:", jobData.batchId || jobData.job?.batchId);
      } catch (e) {
        console.error("Erro ao parsear:", e);
      }
    });

    console.log("✅ Listener ativo! Pressione Ctrl+C para sair");

    // Keep alive
    process.on("SIGINT", async () => {
      console.log("\n🔌 Desconectando...");
      await sql.end();
      process.exit(0);
    });
  } catch (error: any) {
    // If pooling failed and we were using direct, try direct connection
    if (databaseUrlToUse.includes("pooler") && databaseUrl.includes("db.")) {
      console.log("⚠️  Connection pooling falhou, tentando conexão direta...");
      try {
        if (sql) await sql.end();
        sql = postgres(databaseUrl, {
          max: 1,
          idle_timeout: 20,
          connect_timeout: 10,
        });
        await sql`SELECT 1`;
        console.log("✅ Conexão direta estabelecida");
        
        // Continue with trigger check
        const triggerCheck = await sql`
          SELECT 
            trigger_name, 
            event_object_table, 
            action_timing, 
            event_manipulation
          FROM information_schema.triggers
          WHERE trigger_name = 'photo_job_trigger'
        `;

        if (triggerCheck.length === 0) {
          console.error("❌ Trigger 'photo_job_trigger' não encontrado!");
          console.error("   Execute o SQL em supabase/triggers/photo_generation_queue_trigger.sql");
          await sql.end();
          process.exit(1);
        }

        console.log("✅ Trigger encontrado:", triggerCheck[0]);

        // Listen for notifications
        console.log("👂 Escutando notificações no canal 'photo_generation_queue_channel'...");
        console.log("   (Insira um job na tabela para testar)");

        sql.listen("photo_generation_queue_channel", (payload) => {
          console.log("📨 NOTIFICAÇÃO RECEBIDA:", payload);
          try {
            const jobData = typeof payload === "string" ? JSON.parse(payload) : payload;
            console.log("📋 Job ID:", jobData.id || jobData.job?.id);
            console.log("📋 Batch ID:", jobData.batchId || jobData.job?.batchId);
          } catch (e) {
            console.error("Erro ao parsear:", e);
          }
        });

        console.log("✅ Listener ativo! Pressione Ctrl+C para sair");

        // Keep alive
        process.on("SIGINT", async () => {
          console.log("\n🔌 Desconectando...");
          await sql!.end();
          process.exit(0);
        });
        return; // Success with direct connection
      } catch (directError: any) {
        // Both failed
        console.error("❌ Ambas as conexões falharam");
      }
    }

    console.error("❌ Erro:", error.message);
    if (error.message.includes("password authentication")) {
      console.error("   Verifique se a senha no DATABASE_URL está correta");
      console.error("   A senha está no Supabase Dashboard → Settings → Database");
    } else if (error.message.includes("ECONNREFUSED")) {
      console.error("   Não foi possível conectar ao banco de dados");
      console.error("");
      console.error("   Possíveis causas:");
      console.error("   1. DATABASE_URL ainda tem placeholder [YOUR_PASSWORD]");
      console.error("   2. Senha incorreta");
      console.error("   3. Firewall bloqueando a conexão");
      console.error("   4. Use connection pooling (porta 6543) em vez de direct (5432)");
      console.error("");
      console.error("   Para usar connection pooling, edite .env:");
      console.error("   DATABASE_URL=postgresql://postgres.gxwtcdplfkjfidwyrunk:SUA_SENHA@aws-0-us-east-1.pooler.supabase.com:6543/postgres");
    }
    if (sql) await sql.end();
    process.exit(1);
  }
}

testTrigger();

