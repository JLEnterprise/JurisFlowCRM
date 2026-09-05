import { createClient } from '@supabase/supabase-js';
import { DEFAULT_LOGO_BASE64 } from './src/data/defaultLogo.js';
const supabaseUrl = 'https://cbaanfpitqayqraizacv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiYWFuZnBpdHFheXFyYWl6YWN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0MDI4MTMsImV4cCI6MjEwMzk3ODgxM30.8QLre8HRx0FxDMDEKe5c1DYFYCilzskIeepEQZnJ9A8';
const client = createClient(supabaseUrl, supabaseAnonKey);

async function fixSettings() {
  const cleanSettings = {
    id: 'settings_default',
    office_name: 'JurisFlow Advocacia',
    cnpj: '',
    email: 'contato@jurisflow.adv.br',
    phone: '(11) 99999-9999',
    address: 'Av. Paulista, 1000 - Bela Vista',
    raw_data: {
      id: 'settings_default',
      officeName: 'JurisFlow Advocacia',
      cnpj: '',
      oab: '123.456/SP',
      email: 'contato@jurisflow.adv.br',
      phone: '(11) 99999-9999',
      whatsapp: '(11) 99999-9999',
      website: 'https://jurisflow.adv.br',
      address: 'Av. Paulista, 1000',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01310-100',
      logoUrl: DEFAULT_LOGO_BASE64,
      primaryColor: '#c69214',
      secondaryColor: '#1e293b',
      theme: 'dark',
      notificationsEmail: true,
      notificationsWhatsapp: true,
      defaultFeePercent: 20,
      lateFeePercent: 2,
      interestRatePercent: 1,
      appointmentDurationMinutes: 60,
      autoReminders: true,
      pixKey: 'contato@jurisflow.adv.br',
      pixKeyType: 'email',
      bankName: 'Banco do Brasil',
      bankAgency: '1234-5',
      bankAccount: '67890-1',
      bankAccountType: 'corrente',
      escritorio_id: 'escritorio_principal'
    }
  };
  const resSet = await client.from('office_settings').upsert([cleanSettings], { onConflict: 'id' });
  console.log('Tabela [office_settings] upsert:', resSet.error ? resSet.error.message : 'SUCESSO');
}
fixSettings();
