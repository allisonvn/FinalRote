const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local manually
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Testing Supabase Connection...');
console.log('URL:', supabaseUrl);
console.log('Service Key exists:', !!supabaseServiceKey);

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testConnection() {
  try {
    // Test 1: Check experiment exists
    console.log('\n📊 Test 1: Checking experiment 62547d2d-91b1-42a8-9aa7-c9b1bb7bc927...');
    const { data: experiment, error: expError } = await supabase
      .from('experiments')
      .select('*')
      .eq('id', '62547d2d-91b1-42a8-9aa7-c9b1bb7bc927')
      .single();

    if (expError) {
      console.error('❌ Error:', expError);
    } else if (!experiment) {
      console.log('❌ Experiment not found');
    } else {
      console.log('✅ Experiment found:', {
        id: experiment.id,
        name: experiment.name,
        status: experiment.status,
        type: experiment.type,
        algorithm: experiment.algorithm
      });
    }

    // Test 2: List all experiments
    console.log('\n📊 Test 2: Listing all experiments...');
    const { data: allExperiments, error: listError } = await supabase
      .from('experiments')
      .select('id, name, status')
      .limit(10);

    if (listError) {
      console.error('❌ Error:', listError);
    } else {
      console.log('✅ Found', allExperiments?.length || 0, 'experiments:');
      allExperiments?.forEach(exp => {
        console.log(`  - ${exp.name} (${exp.id}) - ${exp.status}`);
      });
    }

    // Test 3: Check variants
    console.log('\n📊 Test 3: Checking variants for experiment...');
    const { data: variants, error: varError } = await supabase
      .from('variants')
      .select('*')
      .eq('experiment_id', '62547d2d-91b1-42a8-9aa7-c9b1bb7bc927');

    if (varError) {
      console.error('❌ Error:', varError);
    } else {
      console.log('✅ Found', variants?.length || 0, 'variants:');
      variants?.forEach(v => {
        console.log(`  - ${v.name} (control: ${v.is_control})`);
      });
    }

  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

testConnection();
