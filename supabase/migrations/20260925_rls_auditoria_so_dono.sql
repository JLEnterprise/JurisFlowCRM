-- APLICADA em 2026-09-25 (migração "rls_auditoria_so_dono"), depois de publicar o app com
-- `upsertRespectingRoles` (src/services/storageService.js).
-- Histórico de ações (activity_logs): LER e EXCLUIR só o dono da conta (admin/dev do escritório);
-- todos continuam REGISTRANDO. Decisão do usuário: "quem pode ler o histórico de ações: só o dono".
-- Testado em transação desfeita: o financeiro do escritório Tatiane lê 0 e continua registrando
-- (o upsert é recusado e o app refaz como inserção simples); a sócia lê todo o histórico.

drop policy if exists tenant_all on public.activity_logs;
drop policy if exists audit_select on public.activity_logs;
drop policy if exists audit_insert on public.activity_logs;
drop policy if exists audit_delete on public.activity_logs;

create policy audit_select on public.activity_logs for select to authenticated
  using (escritorio_id = private.current_escritorio_id() and private.is_escritorio_admin());
create policy audit_insert on public.activity_logs for insert to authenticated
  with check (escritorio_id = private.current_escritorio_id());
create policy audit_delete on public.activity_logs for delete to authenticated
  using (escritorio_id = private.current_escritorio_id() and private.is_escritorio_admin());
