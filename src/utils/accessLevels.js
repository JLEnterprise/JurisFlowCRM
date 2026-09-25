// Níveis de acesso por cargo (hierarquia do escritório).
// O padrão abaixo reproduz as regras que o app sempre usou; o escritório pode ajustar em
// Configurações → Níveis de acesso (salvo em office_settings.rolePermissions).
// Dono/sócio-administrador e Dev têm acesso total sempre (não editável).

export const ACCESS_ROLES = [
  { id: 'senior_lawyer', label: 'Gestor jurídico', hint: 'Advogado(a) sênior / coordenação' },
  { id: 'lawyer', label: 'Advogado(a)', hint: 'Pleno / associado' },
  { id: 'sales_manager', label: 'Gestor comercial', hint: 'Head comercial' },
  { id: 'sales', label: 'Comercial', hint: 'SDR / atendimento de leads' },
  { id: 'financial', label: 'Financeiro', hint: 'Controller / cobrança' },
  { id: 'secretary', label: 'Secretária', hint: 'Recepção, agenda e documentos' },
];

export const ACCESS_MODULES = [
  { group: 'Comercial', items: [
    { key: 'canAccessFunnel', label: 'Funil comercial', hint: 'Leads e etapas de venda' },
    { key: 'canAccessProposals', label: 'Propostas' },
    { key: 'canAccessAttendance', label: 'Atendimentos' },
    { key: 'canAccessClients', label: 'Clientes' },
  ] },
  { group: 'Jurídico', items: [
    { key: 'canAccessProcesses', label: 'Processos' },
    { key: 'canAccessContracts', label: 'Contratos & minutas' },
    { key: 'canAccessDocuments', label: 'Documentos' },
  ] },
  { group: 'Agenda & prazos', items: [
    { key: 'canAccessAgenda', label: 'Agenda & audiências' },
    { key: 'canViewAllAgendas', label: 'Ver a agenda de toda a equipe', hint: 'Sem isso, vê só a própria' },
    { key: 'canAccessTasks', label: 'Prazos & tarefas' },
  ] },
  { group: 'Financeiro', items: [
    { key: 'canAccessFinancial', label: 'Contas & honorários', hint: 'Parcelas, recebimentos e cobrança' },
    { key: 'canAccessReports', label: 'Relatórios' },
  ] },
  { group: 'Escritório', items: [
    { key: 'canAccessTeam', label: 'Colaboradores', hint: 'Cadastrar e editar a equipe' },
    { key: 'canAccessSettings', label: 'Configurações do escritório', hint: 'Inclui estes níveis de acesso' },
    { key: 'canAccessSecurity', label: 'Auditoria', hint: 'Histórico de ações e LGPD' },
  ] },
];

export const MODULE_KEYS = ACCESS_MODULES.flatMap(g => g.items.map(i => i.key));

const ALL = ACCESS_ROLES.map(r => r.id);
// Quem tinha acesso a cada módulo nas regras originais (além de dono e dev)
const DEFAULT_WHO = {
  canAccessFunnel: ['sales', 'sales_manager', 'lawyer', 'senior_lawyer'],
  canAccessProposals: ['sales', 'sales_manager', 'lawyer', 'senior_lawyer'],
  canAccessAttendance: ALL,
  canAccessClients: ALL,
  canAccessProcesses: ['lawyer', 'senior_lawyer'],
  canAccessContracts: ['lawyer', 'senior_lawyer', 'sales_manager'],
  canAccessDocuments: ['lawyer', 'senior_lawyer', 'financial', 'secretary'],
  canAccessAgenda: ALL,
  canViewAllAgendas: ['secretary'],
  canAccessTasks: ALL,
  canAccessFinancial: ['financial'],
  canAccessReports: ['financial', 'senior_lawyer', 'sales_manager'],
  canAccessTeam: ['senior_lawyer'],
  canAccessSettings: [],
  canAccessSecurity: [],
};

export const DEFAULT_ROLE_MATRIX = Object.fromEntries(
  ACCESS_ROLES.map(r => [r.id, Object.fromEntries(MODULE_KEYS.map(k => [k, DEFAULT_WHO[k].includes(r.id)]))])
);

// Valor de um módulo para um cargo: o que o escritório salvou, senão o padrão
export function roleAllows(matrix, roleId, key) {
  const saved = matrix?.[roleId]?.[key];
  if (typeof saved === 'boolean') return saved;
  return !!DEFAULT_ROLE_MATRIX[roleId]?.[key];
}

// Permissões finais de uma pessoa (soma dos cargos dela)
export function permissionsForRoles(roles, matrix, { fullAccess = false } = {}) {
  return Object.fromEntries(MODULE_KEYS.map(k => [
    k,
    fullAccess || (roles || []).some(r => roleAllows(matrix, r, k)),
  ]));
}
