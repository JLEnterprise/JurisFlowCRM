-- Colunas próprias para dados que até agora ficavam só dentro de raw_data (jsonb).
-- Aditivo e seguro: nada é removido; um gatilho preenche as colunas a partir de raw_data
-- em todo insert/update, então funciona com qualquer versão do app (produção ou teste).

-- Conversões que nunca quebram um salvamento (valor inválido vira null)
create or replace function private.try_numeric(v text) returns numeric
language plpgsql immutable set search_path = pg_temp as $$
begin
  return nullif(trim(v), '')::numeric;
exception when others then
  return null;
end $$;

create or replace function private.try_int(v text) returns integer
language plpgsql immutable set search_path = pg_temp as $$
begin
  return round(nullif(trim(v), '')::numeric)::integer;
exception when others then
  return null;
end $$;

create or replace function private.try_bool(v text) returns boolean
language plpgsql immutable set search_path = pg_temp as $$
begin
  return nullif(trim(v), '')::boolean;
exception when others then
  return null;
end $$;

-- Contratos: plano de pagamento (parcelado / mensal recorrente) e término
alter table public.contracts
  add column if not exists payment_type     text not null default 'parcelado',
  add column if not exists monthly_value    numeric,
  add column if not exists billing_day      integer,
  add column if not exists recurring_months integer,
  add column if not exists auto_renew       boolean not null default false,
  add column if not exists first_due_date   text,
  add column if not exists end_date         text;

-- Parcelas: cliente, mensalidade recorrente e ciclo de renovação
alter table public.installments
  add column if not exists client_id text,
  add column if not exists recurring boolean not null default false,
  add column if not exists cycle     integer;

-- Leads: data em que foi ganho/perdido (relatórios por período)
alter table public.leads add column if not exists closed_at text;

-- Tarefas: quando foi concluída (resumo do dia)
alter table public.tasks add column if not exists completed_at text;

create or replace function private.sync_typed_columns() returns trigger
language plpgsql set search_path = public, pg_temp as $$
declare
  r jsonb := coalesce(new.raw_data, '{}'::jsonb);
begin
  if tg_table_name = 'contracts' then
    new.payment_type     := case when r->>'paymentType' = 'recorrente' then 'recorrente' else 'parcelado' end;
    new.monthly_value    := private.try_numeric(r->>'monthlyValue');
    new.billing_day      := private.try_int(r->>'billingDay');
    new.recurring_months := private.try_int(r->>'recurringMonths');
    new.auto_renew       := coalesce(private.try_bool(r->>'autoRenew'), false);
    new.first_due_date   := nullif(r->>'firstDueDate', '');
    new.end_date         := nullif(coalesce(r->>'endDate', r->>'end_date'), '');
  elsif tg_table_name = 'installments' then
    new.client_id := coalesce(nullif(r->>'clientId', ''), nullif(r->>'client_id', ''), new.client_id);
    new.recurring := coalesce(private.try_bool(r->>'recurring'), false);
    new.cycle     := private.try_int(r->>'cycle');
  elsif tg_table_name = 'leads' then
    new.closed_at := nullif(r->>'closedAt', '');
  elsif tg_table_name = 'tasks' then
    new.completed_at := nullif(r->>'completedAt', '');
  end if;
  return new;
end $$;

drop trigger if exists sync_typed_columns on public.contracts;
create trigger sync_typed_columns before insert or update on public.contracts
  for each row execute function private.sync_typed_columns();

drop trigger if exists sync_typed_columns on public.installments;
create trigger sync_typed_columns before insert or update on public.installments
  for each row execute function private.sync_typed_columns();

drop trigger if exists sync_typed_columns on public.leads;
create trigger sync_typed_columns before insert or update on public.leads
  for each row execute function private.sync_typed_columns();

drop trigger if exists sync_typed_columns on public.tasks;
create trigger sync_typed_columns before insert or update on public.tasks
  for each row execute function private.sync_typed_columns();

-- Preenche as linhas que já existem
update public.contracts    set raw_data = raw_data;
update public.installments set raw_data = raw_data;
update public.leads        set raw_data = raw_data;
update public.tasks        set raw_data = raw_data;

-- Consultas comuns do financeiro
create index if not exists installments_escritorio_due_idx on public.installments (escritorio_id, due_date);
create index if not exists installments_contract_idx on public.installments (contract_id);
