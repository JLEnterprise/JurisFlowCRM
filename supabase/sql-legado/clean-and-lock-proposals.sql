-- =========================================================================
-- LIMPEZA DEFINITIVA E BLOQUEIO DE RESÍDUOS DE TESTE NO JURISFLOW CRM
-- =========================================================================

-- 1. Exclui permanentemente propostas ou registros de teste
DELETE FROM proposals WHERE id = 'test_del_123' OR proposal_number = 'PROP-2026/123';

-- 2. Confirma as propostas ativas existentes
SELECT id, proposal_number, client_name, fee_value, status, created_at
FROM proposals
ORDER BY created_at DESC;
