const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qptaizbqcgproqtvwvet.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwdGFpemJxY2dwcm9xdHZ3dmV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MTkzNjcsImV4cCI6MjA3NDQ5NTM2N30.QfOqZvQyQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQ';

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key:', supabaseKey ? 'Present' : 'Missing');

const supabase = createClient(supabaseUrl, supabaseKey);

const testData = {
  experiment_id: 'c9226905-fd8e-4460-8b36-2c13371b0a5d',
  variant_id: null,
  visitor_id: 'test-server-supabase',
  event_type: 'page_view',
  event_name: 'page_view',
  event_data: { variant: null, url: 'https://esmalt.com.br' },
  utm_data: {},
  value: null,
  created_at: new Date().toISOString()
};

supabase.from('events').insert(testData).then(r => {
  console.log('Server Supabase test result:', r.data, 'Error:', r.error);
}).catch(err => {
  console.log('Server Supabase test error:', err);
});
