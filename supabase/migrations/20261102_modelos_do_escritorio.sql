-- Modelos do escritório: biblioteca de petições, contratos, laudos e procurações.
-- O arquivo fica no Storage (bucket privado), para qualquer pessoa do escritório abrir de qualquer computador.
-- Caminho do arquivo: {escritorio_id}/modelos/{id}.{ext} (a 1ª pasta decide quem acessa).

create table if not exists public.template_folders (
  id text primary key default gen_random_uuid()::text,
  escritorio_id text not null references public.escritorios(id),
  name text not null check (length(trim(name)) > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.document_templates (
  id text primary key default gen_random_uuid()::text,
  escritorio_id text not null references public.escritorios(id),
  folder_id text not null default 'outros',
  title text not null check (length(trim(title)) > 0),
  notes text,
  file_name text not null,
  file_path text not null unique,
  file_size bigint,
  mime_type text,
  uploaded_by text,
  uploaded_by_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint document_templates_path_do_escritorio check (split_part(file_path, '/', 1) = escritorio_id)
);

create index if not exists template_folders_escritorio_idx on public.template_folders (escritorio_id);
create index if not exists document_templates_escritorio_pasta_idx on public.document_templates (escritorio_id, folder_id);

alter table public.template_folders enable row level security;
alter table public.document_templates enable row level security;

revoke all on public.template_folders, public.document_templates from anon;
grant select, insert, update, delete on public.template_folders, public.document_templates to authenticated;

create policy tenant_all on public.template_folders
  for all to authenticated
  using (escritorio_id in (select unnest(private.accessible_escritorio_ids())))
  with check (escritorio_id in (select unnest(private.accessible_escritorio_ids())));

create policy tenant_all on public.document_templates
  for all to authenticated
  using (escritorio_id in (select unnest(private.accessible_escritorio_ids())))
  with check (escritorio_id in (select unnest(private.accessible_escritorio_ids())));

create trigger trg_enforce_escritorio_id before insert or update on public.template_folders
  for each row execute function private.enforce_escritorio_id();
create trigger trg_enforce_escritorio_id before insert or update on public.document_templates
  for each row execute function private.enforce_escritorio_id();

-- Bucket privado: abrir/baixar exige login e pertencer ao escritório
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'jurisflow-docs', 'jurisflow-docs', false, 20971520,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.oasis.opendocument.text',
    'application/rtf'
  ]
)
on conflict (id) do nothing;

create policy jurisflow_docs_select on storage.objects
  for select to authenticated
  using (bucket_id = 'jurisflow-docs' and (storage.foldername(name))[1] in (select unnest(private.accessible_escritorio_ids())));

create policy jurisflow_docs_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'jurisflow-docs' and (storage.foldername(name))[1] in (select unnest(private.accessible_escritorio_ids())));

create policy jurisflow_docs_update on storage.objects
  for update to authenticated
  using (bucket_id = 'jurisflow-docs' and (storage.foldername(name))[1] in (select unnest(private.accessible_escritorio_ids())))
  with check (bucket_id = 'jurisflow-docs' and (storage.foldername(name))[1] in (select unnest(private.accessible_escritorio_ids())));

create policy jurisflow_docs_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'jurisflow-docs' and (storage.foldername(name))[1] in (select unnest(private.accessible_escritorio_ids())));
