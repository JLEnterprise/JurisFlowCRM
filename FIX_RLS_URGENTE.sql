-- ==============================================================================
-- JURISFLOW CRM — CORREÇÃO URGENTE DE RLS (Row Level Security)
-- EXECUTAR NO PAINEL SUPABASE: SQL Editor → New Query → Cole e Execute
-- ==============================================================================
-- PROBLEMA: A auditoria detectou que as tabelas retornam dados SEM autenticação.
-- Isso significa que o RLS não está ativo ou as políticas não foram criadas.
-- Este script corrige TUDO de forma segura e idempotente.
-- ==============================================================================

-- PASSO 1: Garantir que a extensão UUID existe
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PASSO 2: Recriar a função helper de isolamento de tenant
CREATE OR REPLACE FUNCTION public.current_user_escritorio_id()
RETURNS UUID AS $$
  SELECT escritorio_id 
  FROM public.users 
  WHERE id = auth.uid() 
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- PASSO 3: ATIVAR RLS EM TODAS AS TABELAS
ALTER TABLE public.escritorios    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendances    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.office_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications  ENABLE ROW LEVEL SECURITY;

-- PASSO 4: REMOVER POLÍTICAS ANTIGAS
DROP POLICY IF EXISTS "RLS_escritorios_select"   ON public.escritorios;
DROP POLICY IF EXISTS "RLS_escritorios_update"   ON public.escritorios;
DROP POLICY IF EXISTS "RLS_escritorios_insert"   ON public.escritorios;
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

-- PASSO 5: CRIAR POLÍTICAS RLS DE ISOLAMENTO TOTAL POR TENANT

-- 5.1. ESCRITÓRIOS
CREATE POLICY "RLS_escritorios_select" ON public.escritorios
  FOR SELECT TO authenticated
  USING (id = public.current_user_escritorio_id());

CREATE POLICY "RLS_escritorios_update" ON public.escritorios
  FOR UPDATE TO authenticated
  USING (id = public.current_user_escritorio_id())
  WITH CHECK (id = public.current_user_escritorio_id());

CREATE POLICY "RLS_escritorios_insert" ON public.escritorios
  FOR INSERT TO authenticated
  WITH CHECK (id = public.current_user_escritorio_id());

-- 5.2. USERS
CREATE POLICY "RLS_users_all" ON public.users
  FOR ALL TO authenticated
  USING (escritorio_id = public.current_user_escritorio_id())
  WITH CHECK (escritorio_id = public.current_user_escritorio_id());

-- 5.3. LEADS
CREATE POLICY "RLS_leads_all" ON public.leads
  FOR ALL TO authenticated
  USING (escritorio_id = public.current_user_escritorio_id())
  WITH CHECK (escritorio_id = public.current_user_escritorio_id());

-- 5.4. CLIENTS
CREATE POLICY "RLS_clients_all" ON public.clients
  FOR ALL TO authenticated
  USING (escritorio_id = public.current_user_escritorio_id())
  WITH CHECK (escritorio_id = public.current_user_escritorio_id());

-- 5.5. CONTRACTS
CREATE POLICY "RLS_contracts_all" ON public.contracts
  FOR ALL TO authenticated
  USING (escritorio_id = public.current_user_escritorio_id())
  WITH CHECK (escritorio_id = public.current_user_escritorio_id());

-- 5.6. PROPOSALS
CREATE POLICY "RLS_proposals_all" ON public.proposals
  FOR ALL TO authenticated
  USING (escritorio_id = public.current_user_escritorio_id())
  WITH CHECK (escritorio_id = public.current_user_escritorio_id());

-- 5.7. PROCESSES
CREATE POLICY "RLS_processes_all" ON public.processes
  FOR ALL TO authenticated
  USING (escritorio_id = public.current_user_escritorio_id())
  WITH CHECK (escritorio_id = public.current_user_escritorio_id());

-- 5.8. TASKS
CREATE POLICY "RLS_tasks_all" ON public.tasks
  FOR ALL TO authenticated
  USING (escritorio_id = public.current_user_escritorio_id())
  WITH CHECK (escritorio_id = public.current_user_escritorio_id());

-- 5.9. APPOINTMENTS
CREATE POLICY "RLS_appointments_all" ON public.appointments
  FOR ALL TO authenticated
  USING (escritorio_id = public.current_user_escritorio_id())
  WITH CHECK (escritorio_id = public.current_user_escritorio_id());

-- 5.10. ATTENDANCES
CREATE POLICY "RLS_attendances_all" ON public.attendances
  FOR ALL TO authenticated
  USING (escritorio_id = public.current_user_escritorio_id())
  WITH CHECK (escritorio_id = public.current_user_escritorio_id());

-- 5.11. INSTALLMENTS
CREATE POLICY "RLS_installments_all" ON public.installments
  FOR ALL TO authenticated
  USING (escritorio_id = public.current_user_escritorio_id())
  WITH CHECK (escritorio_id = public.current_user_escritorio_id());

-- 5.12. DOCUMENTS
CREATE POLICY "RLS_documents_all" ON public.documents
  FOR ALL TO authenticated
  USING (escritorio_id = public.current_user_escritorio_id())
  WITH CHECK (escritorio_id = public.current_user_escritorio_id());

-- 5.13. OFFICE SETTINGS
CREATE POLICY "RLS_office_settings_all" ON public.office_settings
  FOR ALL TO authenticated
  USING (escritorio_id = public.current_user_escritorio_id())
  WITH CHECK (escritorio_id = public.current_user_escritorio_id());

-- 5.14. ACTIVITY LOGS
CREATE POLICY "RLS_activity_logs_all" ON public.activity_logs
  FOR ALL TO authenticated
  USING (escritorio_id = public.current_user_escritorio_id())
  WITH CHECK (escritorio_id = public.current_user_escritorio_id());

-- 5.15. NOTIFICATIONS
CREATE POLICY "RLS_notifications_all" ON public.notifications
  FOR ALL TO authenticated
  USING (escritorio_id = public.current_user_escritorio_id())
  WITH CHECK (escritorio_id = public.current_user_escritorio_id());

-- PASSO 6: VERIFICAÇÃO FINAL
SELECT 
  relname AS tabela,
  CASE WHEN relrowsecurity THEN 'RLS ATIVO' ELSE 'RLS DESATIVADO' END as rls_status
FROM pg_class
WHERE relname IN (
  'escritorios', 'users', 'leads', 'clients', 'contracts',
  'proposals', 'processes', 'tasks', 'appointments', 'attendances',
  'installments', 'documents', 'office_settings', 'activity_logs', 'notifications'
)
ORDER BY relname;
