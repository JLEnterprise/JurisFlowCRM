-- =====================================================================
-- JurisFlow CRM — Segurança multi-tenant — FASE A (não quebra o app)
-- 2026-09-24
--  * limpa senhas em texto puro gravadas em users.raw_data
--  * e-mail único por usuário (1 pessoa = 1 escritório)
--  * confirma e-mail dos usuários já existentes (login real via Supabase Auth)
--  * funções auxiliares em schema privado (não exposto pela API)
--  * trigger que FORÇA escritorio_id do usuário logado em todo insert/update
--  * trigger que impede usuário comum de se promover a admin / trocar e-mail
--  * criação automática do escritório no 1º acesso (trigger em auth.users)
--  * políticas RLS finais por escritório (as abertas "allow_all_*"
--    continuam até a FASE B, depois do deploy do novo código)
-- =====================================================================

-- ---------- 1. Dados ----------
update public.users set raw_data = raw_data - 'password' where raw_data ? 'password';

create unique index if not exists users_email_lower_unique on public.users (lower(email));

update auth.users
   set email_confirmed_at = now()
 where email_confirmed_at is null
   and lower(email) in (select lower(email) from public.users);

-- ---------- 2. Schema privado + funções auxiliares ----------
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.current_escritorio_id()
returns text
language sql stable security definer
set search_path = public, pg_temp
as $$
  select case when auth.uid() is null then null else coalesce(
    (select u.escritorio_id from public.users u where u.id = auth.uid()::text limit 1),
    (select u.escritorio_id from public.users u
      where lower(u.email) = lower(auth.jwt() ->> 'email') limit 1)
  ) end;
$$;

create or replace function private.is_escritorio_admin()
returns boolean
language sql stable security definer
set search_path = public, pg_temp
as $$
  select auth.uid() is not null and exists (
    select 1 from public.users u
     where (u.id = auth.uid()::text or lower(u.email) = lower(auth.jwt() ->> 'email'))
       and coalesce(u.status, 'active') = 'active'
       and (u.role in ('admin', 'dev')
            or coalesce(u.raw_data -> 'roles', '[]'::jsonb) ?| array['admin', 'dev'])
  );
$$;

revoke all on function private.current_escritorio_id() from public, anon;
revoke all on function private.is_escritorio_admin()   from public, anon;
grant execute on function private.current_escritorio_id() to authenticated;
grant execute on function private.is_escritorio_admin()   to authenticated;

-- ---------- 3. Trigger: força o escritorio_id do usuário logado ----------
create or replace function private.enforce_escritorio_id()
returns trigger
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare v_esc text;
begin
  -- service_role / processos internos (sem usuário logado): mantém o valor enviado
  if auth.uid() is null then
    return new;
  end if;
  v_esc := private.current_escritorio_id();
  if v_esc is null then
    raise exception 'Usuário sem escritório vinculado' using errcode = '42501';
  end if;
  new.escritorio_id := v_esc;   -- ignora qualquer escritorio_id vindo do navegador
  return new;
end;
$$;

-- ---------- 4. Trigger: proteção de privilégios na tabela users ----------
create or replace function private.protect_user_row()
returns trigger
language plpgsql security definer
set search_path = public, pg_temp
as $$
begin
  new.raw_data := coalesce(new.raw_data, '{}'::jsonb) - 'password';
  if tg_op = 'UPDATE' and auth.uid() is not null and not private.is_escritorio_admin() then
    new.role   := old.role;
    new.status := old.status;
    new.email  := old.email;
    new.raw_data := new.raw_data || jsonb_strip_nulls(jsonb_build_object(
      'role',   old.raw_data -> 'role',
      'roles',  old.raw_data -> 'roles',
      'status', old.raw_data -> 'status',
      'email',  old.raw_data -> 'email'));
  end if;
  return new;
end;
$$;

-- ---------- 5. Criação automática do escritório no 1º acesso ----------
create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_meta  jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_email text  := lower(new.email);
  v_esc   text;
  v_firm  text;
  v_name  text;
begin
  if new.email_confirmed_at is null then return new; end if;
  if tg_op = 'UPDATE' and old.email_confirmed_at is not null then return new; end if;

  -- já existe perfil (usuário antigo ou colaborador pré-cadastrado pelo admin)
  if exists (select 1 from public.users where lower(email) = v_email or id = new.id::text) then
    return new;
  end if;
  -- cadastro via convite só entra se o admin tiver pré-cadastrado o e-mail na Equipe
  if coalesce(v_meta ->> 'invite', '') <> '' then return new; end if;

  v_esc  := 'esc_' || replace(gen_random_uuid()::text, '-', '');
  v_firm := coalesce(nullif(trim(v_meta ->> 'firmName'), ''), 'Meu Escritório');
  v_name := coalesce(nullif(trim(v_meta ->> 'name'), ''), split_part(v_email, '@', 1));

  insert into public.escritorios (id, nome, email, status, plano, raw_data)
  values (v_esc, v_firm, v_email, 'active', 'trial',
          jsonb_build_object('id', v_esc, 'nome', v_firm, 'email', v_email));

  insert into public.office_settings (id, escritorio_id, office_name, email, raw_data)
  values ('settings_' || v_esc, v_esc, v_firm, v_email,
          jsonb_build_object('officeName', v_firm, 'tradeName', v_firm,
                             'email', v_email, 'escritorio_id', v_esc));

  insert into public.users (id, name, email, role, title, status, escritorio_id, raw_data)
  values (new.id::text, v_name, v_email, 'admin', 'Sócio Administrador', 'active', v_esc,
          jsonb_build_object('id', new.id::text, 'name', v_name, 'email', v_email,
                             'role', 'admin', 'roles', jsonb_build_array('admin'),
                             'title', 'Sócio Administrador',
                             'titles', jsonb_build_array('Sócio Administrador'),
                             'status', 'active', 'escritorio_id', v_esc));
  return new;
end;
$$;

revoke all on function private.enforce_escritorio_id() from public, anon, authenticated;
revoke all on function private.protect_user_row()      from public, anon, authenticated;
revoke all on function private.handle_new_auth_user()  from public, anon, authenticated;

drop trigger if exists on_auth_user_confirmed on auth.users;
create trigger on_auth_user_confirmed
  after insert or update of email_confirmed_at on auth.users
  for each row execute function private.handle_new_auth_user();

-- ---------- 6. Triggers + políticas por tabela ----------
do $$
declare
  t text;
  p record;
  tenant_tables text[] := array[
    'activity_logs','appointments','attendances','clients','contracts','documents',
    'installments','lead_sources','leads','legal_areas','notifications',
    'office_settings','processes','proposals','tasks'];
begin
  -- remove políticas antigas/duplicadas (mantém só as abertas até a FASE B)
  for p in
    select tablename, policyname from pg_policies
     where schemaname = 'public'
       and policyname not like 'allow_all_%'
       and policyname not in ('tenant_isolation_all', 'support_tables_policy')
       and not (tablename = 'escritorios' and policyname = 'tenant_isolation_select')
  loop
    execute format('drop policy if exists %I on public.%I', p.policyname, p.tablename);
  end loop;

  foreach t in array tenant_tables || array['users'] loop
    execute format('drop trigger if exists trg_set_escritorio_id on public.%I', t);
    execute format('drop trigger if exists trg_enforce_escritorio_id on public.%I', t);
    execute format('create trigger trg_enforce_escritorio_id before insert or update on public.%I
                    for each row execute function private.enforce_escritorio_id()', t);
    execute format('alter table public.%I enable row level security', t);
  end loop;

  foreach t in array tenant_tables loop
    execute format('create policy tenant_all on public.%I for all to authenticated
                    using (escritorio_id = private.current_escritorio_id())
                    with check (escritorio_id = private.current_escritorio_id())', t);
  end loop;
end $$;

-- users
drop trigger if exists trg_protect_user_row on public.users;
create trigger trg_protect_user_row before insert or update on public.users
  for each row execute function private.protect_user_row();

create policy users_select on public.users for select to authenticated
  using (escritorio_id = private.current_escritorio_id()
         or id = auth.uid()::text
         or lower(email) = lower(auth.jwt() ->> 'email'));
create policy users_insert on public.users for insert to authenticated
  with check (escritorio_id = private.current_escritorio_id() and private.is_escritorio_admin());
create policy users_update on public.users for update to authenticated
  using (escritorio_id = private.current_escritorio_id()
         and (private.is_escritorio_admin()
              or id = auth.uid()::text
              or lower(email) = lower(auth.jwt() ->> 'email')))
  with check (escritorio_id = private.current_escritorio_id());
create policy users_delete on public.users for delete to authenticated
  using (escritorio_id = private.current_escritorio_id()
         and private.is_escritorio_admin()
         and id <> auth.uid()::text);

-- escritorios (criação só pelo trigger de cadastro; ninguém apaga pela API)
alter table public.escritorios enable row level security;
create policy escritorios_select on public.escritorios for select to authenticated
  using (id = private.current_escritorio_id());
create policy escritorios_update on public.escritorios for update to authenticated
  using (id = private.current_escritorio_id() and private.is_escritorio_admin())
  with check (id = private.current_escritorio_id());

-- ---------- 7. Funções antigas / inseguras ----------
drop function if exists public.set_escritorio_id_default();
drop function if exists public.get_current_user_escritorio_id();
drop function if exists public.current_user_escritorio_id();
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
