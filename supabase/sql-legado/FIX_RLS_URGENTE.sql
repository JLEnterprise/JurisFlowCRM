-- ==============================================================================
-- JURISFLOW CRM — CORREÇÃO URGENTE DE RLS (Row Level Security)
-- EXECUTAR NO PAINEL SUPABASE: SQL Editor → New Query → Cole e Execute
-- ==============================================================================
-- CORREÇÃO APLICADA: 
-- 1. Coluna 'id' e 'escritorio_id' são do tipo TEXT nas tabelas.
-- 2. 'auth.uid()' retorna UUID. Usamos casting explícito ::text.
-- 3. A função retorna TEXT para compatibilidade total com os IDs do sistema.
-- 4. Suporte a lookup duplo: por auth.uid() e por auth.jwt()->>'email'.
-- ==============================================================================

-- PASSO 1: Garantir extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PASSO 2: Função helper de isolamento de tenant com casting TEXT
CREATE OR REPLACE FUNCTION public.current_user_escritorio_id()
RETURNS TEXT AS $$
  SELECT escritorio_id::text
  FROM public.users
  WHERE id::text = auth.uid()::text
     OR LOWER(email::text) = LOWER((auth.jwt()->>'email')::text)
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- PASSO 3: ATIVAR RLS EM TODAS AS 15 TABELAS
ALTER TABLE public.escritorios     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendances     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.office_settings  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications   ENABLE ROW LEVEL SECURITY;

-- PASSO 4: REMOVER TODAS AS POLÍTICAS ANTIGAS (Garante idempotência)
DROP POLICY IF EXISTS "RLS_escritorios_select"   ON public.escritorios;
DROP POLICY IF EXISTS "RLS_escritorios_update"   ON public.escritorios;
DROP POLICY IF EXISTS "RLS_escritorios_insert"   ON public.escritorios;
DROP POLICY IF EXISTS "RLS_users_select"         ON public.users;
DROP POLICY IF EXISTS "RLS_users_insert"         ON public.users;
DROP POLICY IF EXISTS "RLS_users_update"         ON public.users;
DROP POLICY IF EXISTS "RLS_users_all"            ON public.users;
DROP POLICY IF EXISTS "RLS_leads_all"            ON public.leads;
DROP POLICY IF EXISTS "RLS_clients_all"          ON public.clients;
DROP POLICY IF EXISTS "RLS_contracts_all"        ON public.contracts;
DROP POLICY IF EXISTS "RLS_proposals_all"        ON public.proposals;
DROP POLICY IF EXISTS "RLS_processes_all"        ON public.processes;
DROP POLICY IF EXISTS "RLS_tasks_all"            ON public.tasks;
DROP POLICY IF EXISTS "RLS_appointments_all"     ON public.appointments;
DROP POLICY IF EXISTS "RLS_attendances_all"      ON public.attendances;
DROP POLICY IF EXISTS "RLS_installments_all"     ON public.installments;
DROP POLICY IF EXISTS "RLS_documents_all"        ON public.documents;
DROP POLICY IF EXISTS "RLS_office_settings_all"  ON public.office_settings;
DROP POLICY IF EXISTS "RLS_activity_logs_all"    ON public.activity_logs;
DROP POLICY IF EXISTS "RLS_notifications_all"    ON public.notifications;

-- PASSO 5: CRIAR AS NOVAS POLÍTICAS RLS COM ISOLAMENTO TOTAL

-- 5.1. ESCRITÓRIOS (Tenant raiz)
CREATE POLICY "RLS_escritorios_select" ON public.escritorios
  FOR SELECT TO authenticated
  USING (id::text = public.current_user_escritorio_id());

CREATE POLICY "RLS_escritorios_update" ON public.escritorios
  FOR UPDATE TO authenticated
  USING (id::text = public.current_user_escritorio_id())
  WITH CHECK (id::text = public.current_user_escritorio_id());

CREATE POLICY "RLS_escritorios_insert" ON public.escritorios
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- 5.2. USERS (Usuários do sistema)
CREATE POLICY "RLS_users_select" ON public.users
  FOR SELECT TO authenticated
  USING (
    escritorio_id::text = public.current_user_escritorio_id()
    OR id::text = auth.uid()::text
    OR LOWER(email::text) = LOWER((auth.jwt()->>'email')::text)
  );

CREATE POLICY "RLS_users_insert" ON public.users
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "RLS_users_update" ON public.users
  FOR UPDATE TO authenticated
  USING (
    escritorio_id::text = public.current_user_escritorio_id()
    OR id::text = auth.uid()::text
  )
  WITH CHECK (
    escritorio_id::text = public.current_user_escritorio_id()
    OR id::text = auth.uid()::text
  );

-- 5.3. DEMAIS TABELAS (Estritamente isoladas por escritorio_id)
CREATE POLICY "RLS_leads_all" ON public.leads
  FOR ALL TO authenticated
  USING (escritorio_id::text = public.current_user_escritorio_id())
  WITH CHECK (escritorio_id::text = public.current_user_escritorio_id());

CREATE POLICY "RLS_clients_all" ON public.clients
  FOR ALL TO authenticated
  USING (escritorio_id::text = public.current_user_escritorio_id())
  WITH CHECK (escritorio_id::text = public.current_user_escritorio_id());

CREATE POLICY "RLS_contracts_all" ON public.contracts
  FOR ALL TO authenticated
  USING (escritorio_id::text = public.current_user_escritorio_id())
  WITH CHECK (escritorio_id::text = public.current_user_escritorio_id());

CREATE POLICY "RLS_proposals_all" ON public.proposals
  FOR ALL TO authenticated
  USING (escritorio_id::text = public.current_user_escritorio_id())
  WITH CHECK (escritorio_id::text = public.current_user_escritorio_id());

CREATE POLICY "RLS_processes_all" ON public.processes
  FOR ALL TO authenticated
  USING (escritorio_id::text = public.current_user_escritorio_id())
  WITH CHECK (escritorio_id::text = public.current_user_escritorio_id());

CREATE POLICY "RLS_tasks_all" ON public.tasks
  FOR ALL TO authenticated
  USING (escritorio_id::text = public.current_user_escritorio_id())
  WITH CHECK (escritorio_id::text = public.current_user_escritorio_id());

CREATE POLICY "RLS_appointments_all" ON public.appointments
  FOR ALL TO authenticated
  USING (escritorio_id::text = public.current_user_escritorio_id())
  WITH CHECK (escritorio_id::text = public.current_user_escritorio_id());

CREATE POLICY "RLS_attendances_all" ON public.attendances
  FOR ALL TO authenticated
  USING (escritorio_id::text = public.current_user_escritorio_id())
  WITH CHECK (escritorio_id::text = public.current_user_escritorio_id());

CREATE POLICY "RLS_installments_all" ON public.installments
  FOR ALL TO authenticated
  USING (escritorio_id::text = public.current_user_escritorio_id())
  WITH CHECK (escritorio_id::text = public.current_user_escritorio_id());

CREATE POLICY "RLS_documents_all" ON public.documents
  FOR ALL TO authenticated
  USING (escritorio_id::text = public.current_user_escritorio_id())
  WITH CHECK (escritorio_id::text = public.current_user_escritorio_id());

CREATE POLICY "RLS_office_settings_all" ON public.office_settings
  FOR ALL TO authenticated
  USING (escritorio_id::text = public.current_user_escritorio_id())
  WITH CHECK (escritorio_id::text = public.current_user_escritorio_id());

CREATE POLICY "RLS_activity_logs_all" ON public.activity_logs
  FOR ALL TO authenticated
  USING (escritorio_id::text = public.current_user_escritorio_id())
  WITH CHECK (escritorio_id::text = public.current_user_escritorio_id());

CREATE POLICY "RLS_notifications_all" ON public.notifications
  FOR ALL TO authenticated
  USING (escritorio_id::text = public.current_user_escritorio_id())
  WITH CHECK (escritorio_id::text = public.current_user_escritorio_id());

-- PASSO 6: VERIFICAÇÃO FINAL DO STATUS DO RLS
SELECT 
  relname AS tabela,
  CASE WHEN relrowsecurity THEN 'RLS ATIVO' ELSE 'RLS DESATIVADO' END AS status_seguranca
FROM pg_class
WHERE relname IN (
  'escritorios', 'users', 'leads', 'clients', 'contracts',
  'proposals', 'processes', 'tasks', 'appointments', 'attendances',
  'installments', 'documents', 'office_settings', 'activity_logs', 'notifications'
)
ORDER BY relname;
