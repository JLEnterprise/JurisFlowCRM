-- Repasses da equipe: percentual de cada colaborador sobre o bruto recebido no mês.
-- Os percentuais são sigilosos: o dono (e quem tem "Configurações do escritório") vê e edita todos;
-- cada colaborador lê só a própria linha. Por isso ficam numa tabela própria, e não em office_settings
-- (que toda a equipe lê).

create table if not exists public.team_payout_shares (
  escritorio_id text not null references public.escritorios(id),
  user_id text not null,
  percent numeric(5,2) not null default 0 check (percent >= 0 and percent <= 100),
  is_owner boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by text,
  primary key (escritorio_id, user_id)
);

alter table public.team_payout_shares enable row level security;
revoke all on public.team_payout_shares from anon;
grant select, insert, update, delete on public.team_payout_shares to authenticated;

-- Linha da pessoa logada em public.users (o app identifica por id OU e-mail)
create or replace function private.current_user_id()
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select u.id from public.users u
   where (u.id = auth.uid()::text or lower(u.email) = lower(auth.jwt() ->> 'email'))
     and coalesce(u.status, 'active') = 'active'
     and u.escritorio_id = private.current_escritorio_id()
   limit 1;
$$;

create or replace function private.can_manage_payouts()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select private.is_escritorio_admin() or private.can_access('canAccessSettings');
$$;

create policy payout_select on public.team_payout_shares
  for select to authenticated
  using (
    escritorio_id in (select unnest(private.accessible_escritorio_ids()))
    and ((select private.can_manage_payouts()) or user_id = (select private.current_user_id()))
  );

create policy payout_insert on public.team_payout_shares
  for insert to authenticated
  with check (
    escritorio_id in (select unnest(private.accessible_escritorio_ids()))
    and (select private.can_manage_payouts())
  );

create policy payout_update on public.team_payout_shares
  for update to authenticated
  using (
    escritorio_id in (select unnest(private.accessible_escritorio_ids()))
    and (select private.can_manage_payouts())
  )
  with check (
    escritorio_id in (select unnest(private.accessible_escritorio_ids()))
    and (select private.can_manage_payouts())
  );

create policy payout_delete on public.team_payout_shares
  for delete to authenticated
  using (
    escritorio_id in (select unnest(private.accessible_escritorio_ids()))
    and (select private.can_manage_payouts())
  );

create trigger trg_enforce_escritorio_id before insert or update on public.team_payout_shares
  for each row execute function private.enforce_escritorio_id();

-- "Meu repasse": o colaborador pode não ter acesso ao financeiro (não lê as parcelas), então o
-- bruto do mês é somado aqui. Só responde para quem tem percentual maior que zero.
create or replace function public.my_team_payout(p_month text)
returns table (gross numeric, payments integer, percent numeric)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_esc text := private.current_escritorio_id();
  v_me text := private.current_user_id();
  v_percent numeric;
begin
  if auth.uid() is null or v_esc is null or v_me is null then
    return;
  end if;
  if p_month !~ '^\d{4}-\d{2}$' then
    raise exception 'Mes invalido' using errcode = '22023';
  end if;
  select s.percent into v_percent
    from public.team_payout_shares s
   where s.escritorio_id = v_esc and s.user_id = v_me and not s.is_owner;
  if coalesce(v_percent, 0) <= 0 then
    return;
  end if;
  return query
    select coalesce(sum(coalesce(i.amount,
             case when i.raw_data ->> 'value' ~ '^-?\d+(\.\d+)?$' then (i.raw_data ->> 'value')::numeric end, 0)), 0),
           count(*)::integer,
           v_percent
      from public.installments i
     where i.escritorio_id = v_esc
       and i.status = 'paid'
       and left(coalesce(nullif(i.payment_date, ''), i.raw_data ->> 'paymentDate', i.raw_data ->> 'paidDate', i.raw_data ->> 'paid_date', ''), 7) = p_month;
end;
$$;

revoke execute on function public.my_team_payout(text) from public, anon;
grant execute on function public.my_team_payout(text) to authenticated;

alter publication supabase_realtime add table public.team_payout_shares;
