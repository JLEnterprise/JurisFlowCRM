-- ============================================================
-- JURISFLOW CRM - SCHEMA DE BANCO DE DADOS SUPABASE POSTGRESQL
-- PROJETO: jurisflowcrmofc (cbaanfpitqayqraizacv)
-- DATA DE CRIAÇÃO: 2026-09-04
-- ============================================================

-- Habilitar extensões UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABELA DE PERFIS DE USUÁRIOS (PROFILES)
CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'admin',
    title TEXT,
    oab TEXT,
    phone TEXT,
    firm_name TEXT,
    avatar TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABELA DE CONFIGURAÇÕES DO ESCRITÓRIO (OFFICE_SETTINGS)
CREATE TABLE IF NOT EXISTS public.office_settings (
    id TEXT PRIMARY KEY DEFAULT 'escritorio_principal',
    office_name TEXT,
    trade_name TEXT,
    cnpj TEXT,
    oab_society TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABELA DE FILIAIS E ESCRITÓRIOS (BRANCHES / ESCRITORIOS)
CREATE TABLE IF NOT EXISTS public.branches (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    cnpj TEXT,
    email TEXT,
    telefone TEXT,
    endereco TEXT,
    cidade TEXT,
    estado TEXT,
    plano TEXT DEFAULT 'enterprise',
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABELA DE LEADS (FUNIL COMERCIAL KANBAN)
CREATE TABLE IF NOT EXISTS public.leads (
    id TEXT PRIMARY KEY,
    escritorio_id TEXT DEFAULT 'escritorio_principal',
    name TEXT NOT NULL,
    company TEXT,
    email TEXT,
    phone TEXT,
    source TEXT,
    legal_area TEXT,
    stage TEXT DEFAULT 'new',
    value NUMERIC DEFAULT 0,
    probability NUMERIC DEFAULT 50,
    notes TEXT,
    responsible TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABELA DE CLIENTES (BASE DE CLIENTES & RELACIONAMENTO)
CREATE TABLE IF NOT EXISTS public.clients (
    id TEXT PRIMARY KEY,
    escritorio_id TEXT DEFAULT 'escritorio_principal',
    name TEXT NOT NULL,
    type TEXT DEFAULT 'PF',
    cpf_cnpj TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    status TEXT DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABELA DE CASOS E PROCESSOS JUDICIAIS (CASES / PROCESSES)
CREATE TABLE IF NOT EXISTS public.cases (
    id TEXT PRIMARY KEY,
    escritorio_id TEXT DEFAULT 'escritorio_principal',
    cnj_number TEXT,
    title TEXT NOT NULL,
    client_id TEXT REFERENCES public.clients(id) ON DELETE CASCADE,
    legal_area TEXT,
    court TEXT,
    status TEXT DEFAULT 'em_andamento',
    value NUMERIC DEFAULT 0,
    responsible TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABELA DE TAREFAS E PRAZOS (TASKS)
CREATE TABLE IF NOT EXISTS public.tasks (
    id TEXT PRIMARY KEY,
    escritorio_id TEXT DEFAULT 'escritorio_principal',
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMPTZ,
    priority TEXT DEFAULT 'medium',
    status TEXT DEFAULT 'pending',
    responsible TEXT,
    case_id TEXT REFERENCES public.cases(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TABELA DE TRANSAÇÕES FINANCEIRAS (FINANCIAL_TRANSACTIONS)
CREATE TABLE IF NOT EXISTS public.financial_transactions (
    id TEXT PRIMARY KEY,
    escritorio_id TEXT DEFAULT 'escritorio_principal',
    description TEXT NOT NULL,
    type TEXT DEFAULT 'receita',
    amount NUMERIC DEFAULT 0,
    category TEXT,
    due_date TIMESTAMPTZ,
    status TEXT DEFAULT 'pago',
    client_id TEXT REFERENCES public.clients(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. TABELA DE COMISSÕES DE VENDAS E ADVOGADOS (COMMISSIONS)
CREATE TABLE IF NOT EXISTS public.commissions (
    id TEXT PRIMARY KEY,
    escritorio_id TEXT DEFAULT 'escritorio_principal',
    user_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount NUMERIC DEFAULT 0,
    percentage NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'pendente',
    reference TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. TABELA DE DOCUMENTOS E GED (DOCUMENTS)
CREATE TABLE IF NOT EXISTS public.documents (
    id TEXT PRIMARY KEY,
    escritorio_id TEXT DEFAULT 'escritorio_principal',
    name TEXT NOT NULL,
    category TEXT,
    file_url TEXT,
    file_size NUMERIC,
    client_id TEXT REFERENCES public.clients(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. TABELA DE AUDITORIA E LOGS (ACTIVITY_LOGS)
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id TEXT PRIMARY KEY,
    escritorio_id TEXT DEFAULT 'escritorio_principal',
    user_id TEXT,
    action TEXT NOT NULL,
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.office_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS PERMISSIVAS PARA OPERAÇÃO DO CRM
CREATE POLICY "Permitir Leitura e Escrita Geral" ON public.profiles FOR ALL USING (true);
CREATE POLICY "Permitir Leitura e Escrita Geral" ON public.office_settings FOR ALL USING (true);
CREATE POLICY "Permitir Leitura e Escrita Geral" ON public.branches FOR ALL USING (true);
CREATE POLICY "Permitir Leitura e Escrita Geral" ON public.leads FOR ALL USING (true);
CREATE POLICY "Permitir Leitura e Escrita Geral" ON public.clients FOR ALL USING (true);
CREATE POLICY "Permitir Leitura e Escrita Geral" ON public.cases FOR ALL USING (true);
CREATE POLICY "Permitir Leitura e Escrita Geral" ON public.tasks FOR ALL USING (true);
CREATE POLICY "Permitir Leitura e Escrita Geral" ON public.financial_transactions FOR ALL USING (true);
CREATE POLICY "Permitir Leitura e Escrita Geral" ON public.commissions FOR ALL USING (true);
CREATE POLICY "Permitir Leitura e Escrita Geral" ON public.documents FOR ALL USING (true);
CREATE POLICY "Permitir Leitura e Escrita Geral" ON public.activity_logs FOR ALL USING (true);
