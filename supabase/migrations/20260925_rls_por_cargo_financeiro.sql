-- APLICADA em 2026-09-25 (migração "rls_por_cargo_financeiro").
-- Segurança por cargo no FINANCEIRO (além do isolamento entre escritórios).
-- Lê a mesma tabela de "Níveis de acesso" do app (office_settings.raw_data.rolePermissions);
-- sem tabela salva, usa o padrão de src/utils/accessLevels.js. Dono/admin e dev: acesso total.
--   * Ver parcelas: quem tem "Contas & honorários".
--   * Criar parcelas: qualquer membro do escritório (fechamento de contrato no funil).
--   * Alterar/excluir: quem tem "Contas & honorários" ou "Contratos" (edição do contrato).
-- Testado em transação desfeita com os usuários reais: sócia, dev e financeiro do escritório
-- Tatiane continuam vendo as 165 parcelas e salvando; advogado sem financeiro vê 0.

create or replace function private.can_access(p_key text) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  with me as (
    select u.role, coalesce(u.raw_data -> 'roles', '[]'::jsonb) as roles
      from public.users u
     where (u.id = auth.uid()::text or lower(u.email) = lower(auth.jwt() ->> 'email'))
       and coalesce(u.status, 'active') = 'active'
       and u.escritorio_id = private.current_escritorio_id()
     limit 1
  ),
  my_roles as (select jsonb_array_elements_text(roles) as r from me union select role from me),
  matrix as (select coalesce((select s.raw_data -> 'rolePermissions' from public.office_settings s where s.escritorio_id = private.current_escritorio_id() limit 1), '{}'::jsonb) as m),
  defaults(role, key) as (values ('financial', 'canAccessFinancial'), ('lawyer', 'canAccessContracts'), ('senior_lawyer', 'canAccessContracts'), ('sales_manager', 'canAccessContracts'))
  select auth.uid() is not null and (
    exists (select 1 from my_roles where r in ('admin', 'dev'))
    or exists (select 1 from my_roles, matrix where coalesce((m -> r ->> p_key)::boolean, exists (select 1 from defaults d where d.role = my_roles.r and d.key = p_key)))
  );
$$;

revoke all on function private.can_access(text) from public, anon;
grant execute on function private.can_access(text) to authenticated;

drop policy if exists tenant_all on public.installments;
drop policy if exists fin_select on public.installments;
drop policy if exists fin_insert on public.installments;
drop policy if exists fin_update on public.installments;
drop policy if exists fin_delete on public.installments;

create policy fin_select on public.installments for select to authenticated
  using (escritorio_id = private.current_escritorio_id() and private.can_access('canAccessFinancial'));
create policy fin_insert on public.installments for insert to authenticated
  with check (escritorio_id = private.current_escritorio_id());
create policy fin_update on public.installments for update to authenticated
  using (escritorio_id = private.current_escritorio_id() and (private.can_access('canAccessFinancial') or private.can_access('canAccessContracts')))
  with check (escritorio_id = private.current_escritorio_id());
create policy fin_delete on public.installments for delete to authenticated
  using (escritorio_id = private.current_escritorio_id() and (private.can_access('canAccessFinancial') or private.can_access('canAccessContracts')));
