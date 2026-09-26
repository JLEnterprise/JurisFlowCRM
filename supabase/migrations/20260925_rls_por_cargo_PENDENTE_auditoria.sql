-- ⚠️ AINDA NÃO APLICADA — parte da AUDITORIA da segurança por cargo.
-- Aplicar SÓ DEPOIS que a versão do app com `upsertRespectingRoles` (src/services/storageService.js)
-- estiver publicada em produção. Com o app antigo (upsert puro), quem não tem "Auditoria"
-- (ex.: o usuário financeiro do escritório Tatiane) não consegue registrar ações: o banco
-- recusa o upsert em activity_logs. Testado em transação desfeita em 2026-09-25.
--
-- A parte do FINANCEIRO já foi aplicada: ver 20260925_rls_por_cargo_financeiro.sql
-- (usa a mesma função private.can_access, que lê os "Níveis de acesso" do escritório).

drop policy if exists tenant_all on public.activity_logs;
drop policy if exists audit_select on public.activity_logs;
drop policy if exists audit_insert on public.activity_logs;
drop policy if exists audit_delete on public.activity_logs;

create policy audit_select on public.activity_logs for select to authenticated
  using (escritorio_id = private.current_escritorio_id() and private.can_access('canAccessSecurity'));

create policy audit_insert on public.activity_logs for insert to authenticated
  with check (escritorio_id = private.current_escritorio_id());

create policy audit_delete on public.activity_logs for delete to authenticated
  using (escritorio_id = private.current_escritorio_id() and private.can_access('canAccessSecurity'));
