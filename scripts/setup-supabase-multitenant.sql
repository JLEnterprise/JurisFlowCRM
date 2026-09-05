-- ============================================================
-- JURISFLOW CRM — ESQUEMA MULTI-TENANT & RLS SUPABASE
-- Projeto: cbaanfpitqayqraizacv (Região: us-east-2)
-- ============================================================

-- 1. TABELA DE ESCRITORIOS (Tenants)
CREATE TABLE IF NOT EXISTS public.escritorios (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  cnpj TEXT,
  email TEXT,
  telefone TEXT,
  endereco TEXT,
  cidade TEXT,
  estado TEXT,
  logo_url TEXT,
  plano TEXT DEFAULT 'pro',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'trial', 'blocked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  raw_data JSONB DEFAULT '{}'::jsonb
);

-- Escritório Padrão (Matriz)
INSERT INTO public.escritorios (id, nome, cnpj, email, telefone, endereco, cidade, estado, plano, status)
VALUES (
  'escritorio_principal',
  'Prado & Mendes Advocacia Associados',
  '12.345.678/0001-90',
  'contato@pradomendes.adv.br',
  '(11) 3456-7890',
  'Av. Paulista, 1000 - Bela Vista',
  'São Paulo',
  'SP',
  'enterprise',
  'active'
)
ON CONFLICT (id) DO NOTHING;

-- 2. VINCULAR TODAS AS TABELAS AO ESCRITORIO (escritorio_id)
DO $$ 
DECLARE 
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'users', 'clients', 'processes', 'leads', 'contracts',
    'proposals', 'tasks', 'appointments', 'attendances',
    'installments', 'documents', 'activity_logs', 'notifications',
    'office_settings', 'legal_areas', 'lead_sources'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl) THEN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = tbl AND column_name = 'escritorio_id') THEN
        EXECUTE format('ALTER TABLE public.%I ADD COLUMN escritorio_id TEXT DEFAULT %L REFERENCES public.escritorios(id) ON DELETE CASCADE;', tbl, 'escritorio_principal');
      END IF;
      EXECUTE format('UPDATE public.%I SET escritorio_id = %L WHERE escritorio_id IS NULL;', tbl, 'escritorio_principal');
    END IF;
  END LOOP;
END $$;

-- 3. VIEWS DE COMPATIBILIDADE EM PORTUGUÊS
CREATE OR REPLACE VIEW public.clientes_finais WITH (security_invoker = true) AS 
SELECT * FROM public.clients;

CREATE OR REPLACE VIEW public.usuarios WITH (security_invoker = true) AS 
SELECT * FROM public.users;

-- 4. FUNÇÃO DE OBTENÇÃO DO ESCRITÓRIO DO USUÁRIO LOGADO
CREATE OR REPLACE FUNCTION public.get_current_user_escritorio_id()
RETURNS TEXT AS $$
DECLARE
  user_escritorio TEXT;
  user_email TEXT;
BEGIN
  user_email := auth.jwt()->>'email';
  
  IF auth.uid() IS NOT NULL THEN
    SELECT escritorio_id INTO user_escritorio 
    FROM public.users 
    WHERE id = auth.uid()::text OR email = user_email 
    LIMIT 1;
  END IF;

  RETURN COALESCE(user_escritorio, 'escritorio_principal');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 5. TRIGGER DE AUTO-PREENCHIMENTO DO ESCRITORIO_ID
CREATE OR REPLACE FUNCTION public.set_escritorio_id_default()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.escritorio_id IS NULL OR NEW.escritorio_id = '' THEN
    NEW.escritorio_id := public.get_current_user_escritorio_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ 
DECLARE 
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'users', 'clients', 'processes', 'leads', 'contracts',
    'proposals', 'tasks', 'appointments', 'attendances',
    'installments', 'documents', 'activity_logs', 'notifications',
    'office_settings'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl) THEN
      EXECUTE format('DROP TRIGGER IF EXISTS trg_set_escritorio_id ON public.%I;', tbl);
      EXECUTE format('CREATE TRIGGER trg_set_escritorio_id BEFORE INSERT ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_escritorio_id_default();', tbl);
    END IF;
  END LOOP;
END $$;

-- 6. HABILITAR ROW LEVEL SECURITY (RLS) EM TODAS AS TABELAS
ALTER TABLE public.escritorios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.office_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_sources ENABLE ROW LEVEL SECURITY;

-- Políticas de Isolamento Tenant
DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'escritorios', 'users', 'clients', 'processes', 'leads', 'contracts',
    'proposals', 'tasks', 'appointments', 'attendances',
    'installments', 'documents', 'activity_logs', 'notifications',
    'office_settings'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS "tenant_isolation_select" ON public.%I;', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "tenant_isolation_insert" ON public.%I;', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "tenant_isolation_update" ON public.%I;', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "tenant_isolation_delete" ON public.%I;', tbl);

    IF tbl = 'escritorios' THEN
      EXECUTE format('CREATE POLICY "tenant_isolation_select" ON public.%I FOR SELECT TO authenticated, anon USING (true);', tbl);
      EXECUTE format('CREATE POLICY "tenant_isolation_all" ON public.%I FOR ALL TO authenticated, anon USING (true);', tbl);
    ELSE
      EXECUTE format('
        CREATE POLICY "tenant_isolation_select" ON public.%I FOR SELECT TO authenticated, anon
        USING (escritorio_id = public.get_current_user_escritorio_id() OR escritorio_id IS NULL OR escritorio_id = %L);
      ', tbl, 'escritorio_principal');

      EXECUTE format('
        CREATE POLICY "tenant_isolation_insert" ON public.%I FOR INSERT TO authenticated, anon
        WITH CHECK (true);
      ', tbl);

      EXECUTE format('
        CREATE POLICY "tenant_isolation_update" ON public.%I FOR UPDATE TO authenticated, anon
        USING (escritorio_id = public.get_current_user_escritorio_id() OR escritorio_id = %L);
      ', tbl, 'escritorio_principal');

      EXECUTE format('
        CREATE POLICY "tenant_isolation_delete" ON public.%I FOR DELETE TO authenticated, anon
        USING (escritorio_id = public.get_current_user_escritorio_id() OR escritorio_id = %L);
      ', tbl, 'escritorio_principal');
    END IF;
  END LOOP;
END $$;

-- 7. ÍNDICES DE PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_users_escritorio ON public.users(escritorio_id);
CREATE INDEX IF NOT EXISTS idx_clients_escritorio ON public.clients(escritorio_id);
CREATE INDEX IF NOT EXISTS idx_processes_escritorio ON public.processes(escritorio_id);
CREATE INDEX IF NOT EXISTS idx_leads_escritorio ON public.leads(escritorio_id);
CREATE INDEX IF NOT EXISTS idx_contracts_escritorio ON public.contracts(escritorio_id);
CREATE INDEX IF NOT EXISTS idx_tasks_escritorio ON public.tasks(escritorio_id);
CREATE INDEX IF NOT EXISTS idx_appointments_escritorio ON public.appointments(escritorio_id);
CREATE INDEX IF NOT EXISTS idx_attendances_escritorio ON public.attendances(escritorio_id);
