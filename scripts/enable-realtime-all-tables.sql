-- ============================================================
-- SCRIPT: Habilitar Realtime e REPLICA IDENTITY FULL em TODAS
-- as tabelas do CRM para sincronização em tempo real
-- 
-- EXECUTAR NO SUPABASE SQL EDITOR (Dashboard > SQL Editor)
-- ============================================================

-- 1. Adicionar TODAS as tabelas à publicação supabase_realtime
-- (necessário para que postgres_changes funcione)
DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'leads', 'clients', 'contracts', 'proposals', 'processes',
    'tasks', 'appointments', 'attendances', 'installments',
    'documents', 'activity_logs', 'notifications',
    'office_settings', 'escritorios', 'users'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    -- Verifica se a tabela existe antes de tentar alterar
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl) THEN
      -- Tenta adicionar à publicação (ignora erro se já estiver)
      BEGIN
        EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tbl);
        RAISE NOTICE 'Tabela % adicionada à publicação supabase_realtime', tbl;
      EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'Tabela % já está na publicação supabase_realtime', tbl;
      END;
      
      -- Define REPLICA IDENTITY FULL para que o Realtime envie o payload completo
      EXECUTE format('ALTER TABLE public.%I REPLICA IDENTITY FULL', tbl);
      RAISE NOTICE 'REPLICA IDENTITY FULL definido para %', tbl;
    ELSE
      RAISE NOTICE 'Tabela % não encontrada — ignorando', tbl;
    END IF;
  END LOOP;
END
$$;

-- 2. Verificar se as tabelas estão na publicação
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;

-- 3. Verificar REPLICA IDENTITY de cada tabela
SELECT c.relname AS table_name, 
       CASE c.relreplident 
         WHEN 'd' THEN 'DEFAULT' 
         WHEN 'n' THEN 'NOTHING' 
         WHEN 'f' THEN 'FULL' 
         WHEN 'i' THEN 'INDEX' 
       END AS replica_identity
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' 
  AND c.relkind = 'r'
  AND c.relname IN (
    'leads', 'clients', 'contracts', 'proposals', 'processes',
    'tasks', 'appointments', 'attendances', 'installments',
    'documents', 'activity_logs', 'notifications',
    'office_settings', 'escritorios', 'users'
  )
ORDER BY c.relname;
