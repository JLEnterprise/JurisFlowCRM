-- =====================================================================
-- JurisFlow CRM — Segurança multi-tenant — FASE B (fechamento total)
-- Aplicar SOMENTE depois que o novo código de login (Supabase Auth real)
-- estiver publicado na Vercel.
--  * remove as políticas abertas (qualquer pessoa lia/alterava tudo)
--  * remove todo acesso do papel "anon" (visitante sem login)
-- =====================================================================
do $$
declare p record;
begin
  for p in
    select tablename, policyname from pg_policies
     where schemaname = 'public'
       and (policyname like 'allow_all_%'
            or policyname in ('tenant_isolation_all', 'tenant_isolation_select', 'support_tables_policy'))
  loop
    execute format('drop policy %I on public.%I', p.policyname, p.tablename);
  end loop;
end $$;

revoke all on all tables    in schema public from anon;
revoke all on all sequences in schema public from anon;
revoke all on all functions in schema public from anon;
alter default privileges in schema public revoke all on tables    from anon;
alter default privileges in schema public revoke all on sequences from anon;
alter default privileges in schema public revoke all on functions from anon;
