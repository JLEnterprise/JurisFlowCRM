import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://cbaanfpitqayqraizacv.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiYWFuZnBpdHFheXFyYWl6YWN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0MDI4MTMsImV4cCI6MjEwMzk3ODgxM30.8QLre8HRx0FxDMDEKe5c1DYFYCilzskIeepEQZnJ9A8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  global: {
    headers: {
      'x-client-info': 'jurisflow-crm',
    },
  },
});

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error) throw error;
  return data;
}

export async function signUp(email, password, metadata = {}) {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      data: metadata,
    },
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function resetPasswordForEmail(email) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(
    email.trim().toLowerCase(),
    { redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined }
  );
  if (error) throw error;
  return data;
}

export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
}

export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange(callback);
}

export const checkSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('office_settings').select('id').limit(1);
    if (error) throw error;
    return { success: true, message: 'Conectado ao Supabase com sucesso!' };
  } catch (err) {
    console.warn('Conexão Supabase em modo offline/fallback:', err.message);
    return { success: false, message: err.message };
  }
};