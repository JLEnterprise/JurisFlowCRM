-- ==============================================================================
-- JURISFLOW CRM - SCHEMA MULTI-TENANT & POLÍTICAS RLS DE ISOLAMENTO TOTAL
-- Data: 2026-09-05
-- Descrição: Script completo para criação das tabelas com isolamento multi-tenant,
--            vínculo com Supabase Auth e políticas de Row Level Security (RLS)
--            no PostgreSQL e no Supabase Storage.
-- ==============================================================================

-- 1. EXTENSÕES NECESSÁRIAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABELA DE ESCRITÓRIOS (TENANTS)
CREATE TABLE IF NOT EXISTS public.escritorios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    cnpj VARCHAR(20),
    oab VARCHAR(50),
    email VARCHAR(255),
    telefone VARCHAR(50),
    endereco TEXT,
    cidade VARCHAR(100),
    estado VARCHAR(10),
    plano VARCHAR(50) DEFAULT 'professional', -- starter, professional, enterprise
    limite_usuarios INT DEFAULT 5,
    logo_url TEXT,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. TABELA DE PERFIS DE USUÁRIOS (VINCULADA AO SUPABASE AUTH)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    escritorio_id UUID NOT NULL REFERENCES public.escritorios(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    roles TEXT[] DEFAULT ARRAY['Advogado(a)']::TEXT[],
    oab VARCHAR(50),
    phone VARCHAR(50),
    avatar_url TEXT,
    is_admin BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- FUNÇÃO HELPER: Obter o escritorio_id do usuário atualmente autenticado
CREATE OR REPLACE FUNCTION public.current_user_escritorio_id()
RETURNS UUID AS $$
    SELECT escritorio_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 4. TABELAS DE DADOS DO CRM COM ISOLAMENTO
-- 4.1. LEADS
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    escritorio_id UUID NOT NULL REFERENCES public.escritorios(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    legal_area VARCHAR(100),
    source VARCHAR(100),
    stage VARCHAR(50) DEFAULT 'novo_lead',
    value NUMERIC(12,2) DEFAULT 0,
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4.2. CLIENTES
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    escritorio_id UUID NOT NULL REFERENCES public.escritorios(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    document VARCHAR(50), -- CPF ou CNPJ
    email VARCHAR(255),
    phone VARCHAR(50),
    legal_area VARCHAR(100),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(10),
    lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4.3. CONTRATOS
CREATE TABLE IF NOT EXISTS public.contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    escritorio_id UUID NOT NULL REFERENCES public.escritorios(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    value NUMERIC(12,2) NOT NULL DEFAULT 0,
    legal_area VARCHAR(100),
    status VARCHAR(50) DEFAULT 'rascunho',
    installments_count INT DEFAULT 1,
    start_date DATE,
    end_date DATE,
    content TEXT,
    document_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4.4. PROCESSOS JUDICIAIS
CREATE TABLE IF NOT EXISTS public.processes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    escritorio_id UUID NOT NULL REFERENCES public.escritorios(id) ON DELETE CASCADE,
    process_number VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    court VARCHAR(100),
    legal_area VARCHAR(100),
    status VARCHAR(50) DEFAULT 'em_andamento',
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    value NUMERIC(12,2) DEFAULT 0,
    next_deadline DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4.5. TAREFAS & PRAZOS (COM SUPORTE A TIPO PERSONALIZADO)
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    escritorio_id UUID NOT NULL REFERENCES public.escritorios(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    task_type VARCHAR(50) DEFAULT 'peticao',
    custom_type VARCHAR(150),
    priority VARCHAR(20) DEFAULT 'media',
    status VARCHAR(20) DEFAULT 'pending',
    due_date DATE NOT NULL,
    due_time VARCHAR(10) DEFAULT '14:00',
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    process_id UUID REFERENCES public.processes(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4.6. PROPOSTAS DE HONORÁRIOS
CREATE TABLE IF NOT EXISTS public.proposals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    escritorio_id UUID NOT NULL REFERENCES public.escritorios(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    value NUMERIC(12,2) NOT NULL DEFAULT 0,
    legal_area VARCHAR(100),
    status VARCHAR(50) DEFAULT 'rascunho',
    valid_until DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4.7. ATENDIMENTOS (LOGS DE INTERAÇÃO)
CREATE TABLE IF NOT EXISTS public.attendances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    escritorio_id UUID NOT NULL REFERENCES public.escritorios(id) ON DELETE CASCADE,
    channel VARCHAR(50) NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4.8. DOCUMENTOS & ARQUIVOS
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    escritorio_id UUID NOT NULL REFERENCES public.escritorios(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_type VARCHAR(50),
    file_size BIGINT,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
    uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 5. ATIVAÇÃO DE ROW LEVEL SECURITY (RLS) EM TODAS AS TABELAS
-- ==============================================================================
ALTER TABLE public.escritorios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 6. POLÍTICAS DE ACESSO (POLICIES) - ISOLAMENTO 100% AUTOMÁTICO
-- ==============================================================================

-- 6.1. ESCRITORIOS: Usuário só vê o escritório a que pertence
CREATE POLICY "RLS_escritorios_select" ON public.escritorios
    FOR SELECT USING (id = public.current_user_escritorio_id());

CREATE POLICY "RLS_escritorios_update" ON public.escritorios
    FOR UPDATE USING (id = public.current_user_escritorio_id());

-- 6.2. PROFILES: Usuário só vê membros do mesmo escritório
CREATE POLICY "RLS_profiles_all" ON public.profiles
    FOR ALL USING (escritorio_id = public.current_user_escritorio_id());

-- 6.3. LEADS: Isolamento total por escritorio_id
CREATE POLICY "RLS_leads_all" ON public.leads
    FOR ALL USING (escritorio_id = public.current_user_escritorio_id());

-- 6.4. CLIENTS: Isolamento total por escritorio_id
CREATE POLICY "RLS_clients_all" ON public.clients
    FOR ALL USING (escritorio_id = public.current_user_escritorio_id());

-- 6.5. CONTRACTS: Isolamento total por escritorio_id
CREATE POLICY "RLS_contracts_all" ON public.contracts
    FOR ALL USING (escritorio_id = public.current_user_escritorio_id());

-- 6.6. PROCESSES: Isolamento total por escritorio_id
CREATE POLICY "RLS_processes_all" ON public.processes
    FOR ALL USING (escritorio_id = public.current_user_escritorio_id());

-- 6.7. TASKS: Isolamento total por escritorio_id
CREATE POLICY "RLS_tasks_all" ON public.tasks
    FOR ALL USING (escritorio_id = public.current_user_escritorio_id());

-- 6.8. PROPOSALS: Isolamento total por escritorio_id
CREATE POLICY "RLS_proposals_all" ON public.proposals
    FOR ALL USING (escritorio_id = public.current_user_escritorio_id());

-- 6.9. ATTENDANCES: Isolamento total por escritorio_id
CREATE POLICY "RLS_attendances_all" ON public.attendances
    FOR ALL USING (escritorio_id = public.current_user_escritorio_id());

-- 6.10. DOCUMENTS: Isolamento total por escritorio_id
CREATE POLICY "RLS_documents_all" ON public.documents
    FOR ALL USING (escritorio_id = public.current_user_escritorio_id());

-- ==============================================================================
-- 7. ISOLAMENTO DO SUPABASE STORAGE (BUCKETS & PASTAS)
-- ==============================================================================

-- Criação do Bucket de Documentos caso não exista
INSERT INTO storage.buckets (id, name, public) 
VALUES ('jurisflow-docs', 'jurisflow-docs', false)
ON CONFLICT (id) DO NOTHING;

-- Política de Leitura no Storage: Só acessa arquivos dentro da pasta do seu escritorio_id
CREATE POLICY "Storage_Tenant_Select" ON storage.objects
    FOR SELECT TO authenticated
    USING (
        bucket_id = 'jurisflow-docs'
        AND (storage.foldername(name))[1] = (public.current_user_escritorio_id())::text
    );

-- Política de Upload no Storage: Só grava na pasta do seu escritorio_id
CREATE POLICY "Storage_Tenant_Insert" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'jurisflow-docs'
        AND (storage.foldername(name))[1] = (public.current_user_escritorio_id())::text
    );

-- Política de Exclusão no Storage: Só exclui arquivos da sua pasta
CREATE POLICY "Storage_Tenant_Delete" ON storage.objects
    FOR DELETE TO authenticated
    USING (
        bucket_id = 'jurisflow-docs'
        AND (storage.foldername(name))[1] = (public.current_user_escritorio_id())::text
    );
