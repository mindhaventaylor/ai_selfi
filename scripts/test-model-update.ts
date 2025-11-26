/**
 * Script para testar se as atualizações na tabela models funcionam corretamente
 * Execute com: npx tsx scripts/test-model-update.ts
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Criar cliente com service role key (bypassa RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function testModelUpdate() {
  console.log('🧪 Testing model updates...\n');

  // 1. Verificar se RLS está habilitado
  console.log('1️⃣ Checking RLS status...');
  const { data: rlsData, error: rlsError } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT tablename, rowsecurity 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename = 'models';
    `,
  });
  
  if (rlsError) {
    // Tentar método alternativo
    console.log('   ⚠️  Could not check RLS via RPC, trying direct query...');
  } else {
    console.log('   ✅ RLS check:', rlsData);
  }

  // 2. Listar políticas existentes
  console.log('\n2️⃣ Checking existing policies...');
  const { data: policies, error: policiesError } = await supabase
    .from('pg_policies')
    .select('*')
    .eq('tablename', 'models');

  if (policiesError) {
    console.log('   ⚠️  Could not query policies via Supabase client');
    console.log('   💡 Try running this SQL in Supabase SQL Editor:');
    console.log('   SELECT * FROM pg_policies WHERE tablename = \'models\';');
  } else {
    console.log('   📋 Policies:', policies);
  }

  // 3. Buscar um modelo de teste
  console.log('\n3️⃣ Finding a test model...');
  const { data: models, error: modelsError } = await supabase
    .from('models')
    .select('id, "userId", name, status')
    .limit(1);

  if (modelsError) {
    console.error('   ❌ Error fetching models:', modelsError);
    return;
  }

  if (!models || models.length === 0) {
    console.log('   ⚠️  No models found. Create a model first to test updates.');
    return;
  }

  const testModel = models[0];
  console.log('   ✅ Found model:', {
    id: testModel.id,
    userId: testModel.userId,
    name: testModel.name,
    status: testModel.status,
  });

  // 4. Testar atualização de status
  console.log('\n4️⃣ Testing status update...');
  const originalStatus = testModel.status;
  const newStatus = originalStatus === 'training' ? 'ready' : 'training';

  console.log(`   📝 Updating model ${testModel.id} from "${originalStatus}" to "${newStatus}"...`);

  const { data: updateData, error: updateError } = await supabase
    .from('models')
    .update({ status: newStatus })
    .eq('id', testModel.id)
    .select();

  if (updateError) {
    console.error('   ❌ Update failed:', updateError);
    console.error('   📋 Error details:', {
      message: updateError.message,
      details: updateError.details,
      hint: updateError.hint,
      code: updateError.code,
    });
    return;
  }

  console.log('   ✅ Update successful!', updateData);

  // 5. Reverter para o status original
  console.log(`\n5️⃣ Reverting to original status "${originalStatus}"...`);
  const { error: revertError } = await supabase
    .from('models')
    .update({ status: originalStatus })
    .eq('id', testModel.id);

  if (revertError) {
    console.error('   ⚠️  Could not revert status:', revertError);
  } else {
    console.log('   ✅ Status reverted successfully');
  }

  // 6. Verificar se service role key está funcionando
  console.log('\n6️⃣ Verifying service role key...');
  const { data: allModels, error: allModelsError } = await supabase
    .from('models')
    .select('id, "userId", status')
    .limit(5);

  if (allModelsError) {
    console.error('   ❌ Error: Service role key might not be working:', allModelsError);
  } else {
    console.log(`   ✅ Service role key working! Can access ${allModels?.length || 0} models`);
    console.log('   💡 With service role key, RLS is bypassed automatically');
  }

  console.log('\n✅ Test completed!');
}

// Executar teste
testModelUpdate().catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});

