import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://cbaanfpitqayqraizacv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiYWFuZnBpdHFheXFyYWl6YWN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0MDI4MTMsImV4cCI6MjEwMzk3ODgxM30.8QLre8HRx0FxDMDEKe5c1DYFYCilzskIeepEQZnJ9A8';
const client = createClient(supabaseUrl, supabaseAnonKey);
async function check() {
  const tables = ['clients', 'leads', 'contracts', 'proposals', 'processes', 'tasks', 'appointments', 'attendances', 'installments', 'documents', 'activity_logs', 'notifications', 'office_settings', 'escritorios'];
  for (const t of tables) {
    const { data, error } = await client.from(t).select('*');
    console.log('Table [' + t + ']: ' + (data ? data.length : 0) + ' rows | error: ' + (error ? error.message : 'none'));
    if (data && data.length > 0) {
      console.log('  Sample [' + t + ']:', JSON.stringify(data[0]).substring(0, 180));
    }
  }
}
check();
