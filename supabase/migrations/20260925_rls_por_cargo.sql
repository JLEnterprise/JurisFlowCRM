-- Segurança por cargo dentro do escritório (além do isolamento entre escritórios).
-- Espelha as permissões do app (AuthContext → permissions):
--   * Financeiro (installments): ver/alterar/excluir só sócio/admin, dev e financeiro.
--     Qualquer membro do escritório pode CRIAR parcelas (fechamento de contrato no funil),
--     e quem mexe em contratos (advogados, gerente comercial) pode alterar/excluir as parcelas
--     do contrato que edita (recalcular valor, excluir contrato).
--   * Auditoria (activity_logs): ler só sócio/admin e dev; todos continuam registrando.

create or replace function private.has_any_role(p_roles text[]) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select auth.uid() is not null and exists (
    select 1 from public.users u
     where (u.id = auth.uid()::text or lower(u.email) = lower(auth.jwt() ->> 'email'))
       and coalesce(u.status, 'active') = 'active'
       and u.escritorio_id = private.current_escritorio_id()
       and (u.role = any(p_roles) or coalesce(u.raw_data -> 'roles', '[]'::jsonb) ?| p_roles)
  );
$$;

revoke all on function private.has_any_role(text[]) from public, anon;
grant execute on function private.has_any_role(text[]) to authenticated;

-- ===== Parcelas / financeiro =====
drop policy if exists tenant_all on public.installments;
drop policy if exists fin_select on public.installments;
drop policy if exists fin_insert on public.installments;
drop policy if exists fin_update on public.installments;
drop policy if exists fin_delete on public.installments;

create policy fin_select on public.installments for select to authenticated
  using (escritorio_id = private.current_escritorio_id()
         and private.has_any_role(array['admin','dev','financial']));

create policy fin_insert on public.installments for insert to authenticated
  with check (escritorio_id = private.current_escritorio_id());

create policy fin_update on public.installments for update to authenticated
  using (escritorio_id = private.current_escritorio_id()
         and private.has_any_role(array['admin','dev','financial','lawyer','senior_lawyer','sales_manager']))
  with check (escritorio_id = private.current_escritorio_id());

create policy fin_delete on public.installments for delete to authenticated
  using (escritorio_id = private.current_escritorio_id()
         and private.has_any_role(array['admin','dev','financial','lawyer','senior_lawyer','sales_manager']));

-- ===== Auditoria =====
drop policy if exists tenant_all on public.activity_logs;
drop policy if exists audit_select on public.activity_logs;
drop policy if exists audit_insert on public.activity_logs;
drop policy if exists audit_manage on public.activity_logs;
drop policy if exists audit_delete on public.activity_logs;

create policy audit_select on public.activity_logs for select to authenticated
  using (escritorio_id = private.current_escritorio_id()
         and private.has_any_role(array['admin','dev']));

create policy audit_insert on public.activity_logs for insert to authenticated
  with check (escritorio_id = private.current_escritorio_id());

create policy audit_delete on public.activity_logs for delete to authenticated
  using (escritorio_id = private.current_escritorio_id()
         and private.has_any_role(array['admin','dev']));
