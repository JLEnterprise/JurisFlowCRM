-- Filiais (multi-escritório).
-- Uma filial aponta para a matriz em escritorios.parent_id. O dono/sócio-administrador da matriz
-- enxerga e edita a matriz + as filiais; cada colaborador continua preso ao próprio escritório
-- (users.escritorio_id). Quem não tem filial vê exatamente o mesmo de antes.

alter table public.escritorios
  add column if not exists parent_id text references public.escritorios(id) on delete cascade;
create index if not exists escritorios_parent_idx on public.escritorios (parent_id);

-- Escritórios que a pessoa logada pode acessar: o dela + filiais (se for admin/dev da matriz)
create or replace function private.accessible_escritorio_ids() returns text[]
language sql stable security definer set search_path = public, pg_temp as $$
  select case
    when s.own is null then array[]::text[]
    else array[s.own] || coalesce(
      (select array_agg(e.id) from public.escritorios e
        where e.parent_id = s.own and private.is_escritorio_admin()),
      array[]::text[])
  end
  from (select private.current_escritorio_id() as own) s;
$$;
revoke all on function private.accessible_escritorio_ids() from public, anon;
grant execute on function private.accessible_escritorio_ids() to authenticated;

-- Tabelas de dados: isolamento passa a aceitar as filiais acessíveis
do $$
declare t text;
begin
  foreach t in array array[
    'appointments','attendances','clients','contracts','documents','lead_sources','leads',
    'legal_areas','notifications','office_settings','processes','proposals','tasks'
  ] loop
    execute format('drop policy if exists tenant_all on public.%I', t);
    execute format(
      'create policy tenant_all on public.%I for all to authenticated
         using (escritorio_id in (select unnest(private.accessible_escritorio_ids())))
         with check (escritorio_id in (select unnest(private.accessible_escritorio_ids())))', t);
  end loop;
end $$;

-- Financeiro (mantém a segurança por cargo)
drop policy if exists fin_select on public.installments;
drop policy if exists fin_insert on public.installments;
drop policy if exists fin_update on public.installments;
drop policy if exists fin_delete on public.installments;
create policy fin_select on public.installments for select to authenticated
  using (escritorio_id in (select unnest(private.accessible_escritorio_ids())) and private.can_access('canAccessFinancial'));
create policy fin_insert on public.installments for insert to authenticated
  with check (escritorio_id in (select unnest(private.accessible_escritorio_ids())));
create policy fin_update on public.installments for update to authenticated
  using (escritorio_id in (select unnest(private.accessible_escritorio_ids()))
         and (private.can_access('canAccessFinancial') or private.can_access('canAccessContracts')))
  with check (escritorio_id in (select unnest(private.accessible_escritorio_ids())));
create policy fin_delete on public.installments for delete to authenticated
  using (escritorio_id in (select unnest(private.accessible_escritorio_ids()))
         and (private.can_access('canAccessFinancial') or private.can_access('canAccessContracts')));

-- Auditoria: só o dono lê (agora incluindo as filiais dele)
drop policy if exists audit_select on public.activity_logs;
drop policy if exists audit_insert on public.activity_logs;
drop policy if exists audit_delete on public.activity_logs;
create policy audit_select on public.activity_logs for select to authenticated
  using (escritorio_id in (select unnest(private.accessible_escritorio_ids())) and private.is_escritorio_admin());
create policy audit_insert on public.activity_logs for insert to authenticated
  with check (escritorio_id in (select unnest(private.accessible_escritorio_ids())));
create policy audit_delete on public.activity_logs for delete to authenticated
  using (escritorio_id in (select unnest(private.accessible_escritorio_ids())) and private.is_escritorio_admin());

-- Escritórios: ver os acessíveis; dono cria/edita/exclui filiais da própria matriz
drop policy if exists escritorios_select on public.escritorios;
drop policy if exists escritorios_update on public.escritorios;
drop policy if exists escritorios_insert on public.escritorios;
drop policy if exists escritorios_delete on public.escritorios;
create policy escritorios_select on public.escritorios for select to authenticated
  using (id in (select unnest(private.accessible_escritorio_ids())));
create policy escritorios_insert on public.escritorios for insert to authenticated
  with check (parent_id = private.current_escritorio_id() and private.is_escritorio_admin());
create policy escritorios_update on public.escritorios for update to authenticated
  using (id in (select unnest(private.accessible_escritorio_ids())) and private.is_escritorio_admin())
  with check (id in (select unnest(private.accessible_escritorio_ids())));
create policy escritorios_delete on public.escritorios for delete to authenticated
  using (parent_id = private.current_escritorio_id() and private.is_escritorio_admin());

-- Equipe: dono gerencia colaboradores da matriz e das filiais
drop policy if exists users_select on public.users;
drop policy if exists users_insert on public.users;
drop policy if exists users_update on public.users;
drop policy if exists users_delete on public.users;
create policy users_select on public.users for select to authenticated
  using (escritorio_id in (select unnest(private.accessible_escritorio_ids()))
         or id = (auth.uid())::text or lower(email) = lower(auth.jwt() ->> 'email'));
create policy users_insert on public.users for insert to authenticated
  with check (escritorio_id in (select unnest(private.accessible_escritorio_ids())) and private.is_escritorio_admin());
create policy users_update on public.users for update to authenticated
  using (escritorio_id in (select unnest(private.accessible_escritorio_ids()))
         and (private.is_escritorio_admin() or id = (auth.uid())::text or lower(email) = lower(auth.jwt() ->> 'email')))
  with check (escritorio_id in (select unnest(private.accessible_escritorio_ids())));
create policy users_delete on public.users for delete to authenticated
  using (escritorio_id in (select unnest(private.accessible_escritorio_ids()))
         and private.is_escritorio_admin() and id <> (auth.uid())::text);

-- Gatilho que carimba o escritório: aceita filial acessível; senão usa o da pessoa
create or replace function private.enforce_escritorio_id() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_esc text;
begin
  if auth.uid() is null then
    return new;
  end if;
  v_esc := private.current_escritorio_id();
  if v_esc is null then
    raise exception 'Usuário sem escritório vinculado' using errcode = '42501';
  end if;
  if new.escritorio_id is not null and new.escritorio_id = any (private.accessible_escritorio_ids()) then
    return new;
  end if;
  new.escritorio_id := v_esc;
  return new;
end;
$$;
