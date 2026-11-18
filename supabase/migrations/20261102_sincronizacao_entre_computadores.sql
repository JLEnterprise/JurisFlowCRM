-- Tudo o que um computador grava aparece nos outros do escritório sem recarregar.
-- Faltavam no tempo real: áreas, origens de lead e a biblioteca de modelos.
alter publication supabase_realtime add table
  public.legal_areas,
  public.lead_sources,
  public.document_templates,
  public.template_folders;

-- Índices apontados pelo verificador do Supabase (consultas por escritório)
create index if not exists activity_logs_escritorio_idx on public.activity_logs (escritorio_id);
create index if not exists documents_escritorio_idx on public.documents (escritorio_id);
create index if not exists lead_sources_escritorio_idx on public.lead_sources (escritorio_id);
create index if not exists legal_areas_escritorio_idx on public.legal_areas (escritorio_id);
create index if not exists notifications_escritorio_idx on public.notifications (escritorio_id);
create index if not exists office_settings_escritorio_idx on public.office_settings (escritorio_id);
create index if not exists proposals_escritorio_idx on public.proposals (escritorio_id);
