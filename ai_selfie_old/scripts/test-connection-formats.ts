import postgres from "postgres";
import "dotenv/config";

// dotenv/config automatically loads .env from project root

const password = "xyduoJXoskr2TN64";
const projectRef = "gxwtcdplfkjfidwyrunk";

const formats = [
  {
    name: "Connection Pooling (postgres.PROJECT_REF)",
    url: `postgresql://postgres.${projectRef}:${password}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`,
  },
  {
    name: "Connection Pooling (postgres only)",
    url: `postgresql://postgres:${password}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`,
  },
  {
    name: "Direct Connection (postgres.PROJECT_REF)",
    url: `postgresql://postgres.${projectRef}:${password}@db.${projectRef}.supabase.co:5432/postgres`,
  },
  {
    name: "Direct Connection (postgres only)",
    url: `postgresql://postgres:${password}@db.${projectRef}.supabase.co:5432/postgres`,
  },
  {
    name: "Connection Pooling (alternative host)",
    url: `postgresql://postgres.${projectRef}:${password}@aws-0-us-west-1.pooler.supabase.com:6543/postgres`,
  },
];

async function testFormat(format: { name: string; url: string }) {
  console.log(`\n🧪 Testando: ${format.name}`);
  console.log(`   URL: ${format.url.replace(/:[^:@]+@/, ":***@")}`);
  
  try {
    const sql = postgres(format.url, {
      max: 1,
      connect_timeout: 5,
    });
    
    await sql`SELECT 1`;
    await sql.end();
    
    console.log(`   ✅ SUCESSO! Este formato funciona!`);
    return format.url;
  } catch (error: any) {
    console.log(`   ❌ Falhou: ${error.message.split('\n')[0]}`);
    return null;
  }
}

async function main() {
  console.log("🔍 Testando diferentes formatos de connection string...\n");
  
  for (const format of formats) {
    const workingUrl = await testFormat(format);
    if (workingUrl) {
      console.log(`\n🎉 Formato que funciona encontrado!`);
      console.log(`\nAdicione ao .env:`);
      console.log(`DATABASE_URL=${workingUrl}\n`);
      process.exit(0);
    }
  }
  
  console.log(`\n❌ Nenhum formato funcionou.`);
  console.log(`\nVerifique:`);
  console.log(`1. Se a senha está correta (você resetou recentemente)`);
  console.log(`2. Se copiou a connection string completa do Supabase Dashboard`);
  console.log(`3. Se há restrições de firewall/IP no Supabase`);
  process.exit(1);
}

main();

