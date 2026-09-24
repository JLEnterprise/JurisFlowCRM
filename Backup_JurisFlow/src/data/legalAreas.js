export const INITIAL_LEGAL_AREAS = [
  { id: 'trabalhista', name: 'Direito Trabalhista', color: '#3b82f6', icon: 'Briefcase' },
  { id: 'familia', name: 'Direito de Família', color: '#ec4899', icon: 'HeartHandshake' },
  { id: 'civil', name: 'Direito Civil', color: '#8b5cf6', icon: 'Scale' },
  { id: 'empresarial', name: 'Direito Empresarial', color: '#0ea5e9', icon: 'Building2' },
  { id: 'previdenciario', name: 'Direito Previdenciário', color: '#10b981', icon: 'ShieldCheck' },
  { id: 'criminal', name: 'Direito Criminal', color: '#ef4444', icon: 'Gavel' },
  { id: 'imobiliario', name: 'Direito Imobiliário', color: '#f59e0b', icon: 'Home' },
  { id: 'tributario', name: 'Direito Tributário', color: '#6366f1', icon: 'Coins' },
  { id: 'consumidor', name: 'Direito do Consumidor', color: '#14b8a6', icon: 'ShoppingBag' },
  { id: 'outros', name: 'Outros Ramos', color: '#64748b', icon: 'FileText' },
];

export const INITIAL_LEAD_SOURCES = [
  { id: 'instagram', name: 'Instagram', color: '#e1306c', icon: 'Instagram' },
  { id: 'google', name: 'Google Ads / Orgânico', color: '#4285f4', icon: 'Search' },
  { id: 'whatsapp', name: 'WhatsApp Direto', color: '#25d366', icon: 'MessageCircle' },
  { id: 'site', name: 'Site Institucional', color: '#0c8de3', icon: 'Globe' },
  { id: 'indicacao', name: 'Indicação de Cliente', color: '#10b981', icon: 'Users' },
  { id: 'facebook', name: 'Facebook Ads', color: '#1877f2', icon: 'Share2' },
  { id: 'tiktok', name: 'TikTok', color: '#000000', icon: 'Video' },
  { id: 'evento', name: 'Evento / Palestra', color: '#f59e0b', icon: 'Calendar' },
  { id: 'cliente_antigo', name: 'Cliente Antigo', color: '#8b5cf6', icon: 'UserCheck' },
  { id: 'outros', name: 'Outros Canais', color: '#64748b', icon: 'MoreHorizontal' },
];

export const KANBAN_STAGES = [
  { id: 'novo_lead', name: 'Novo Lead', color: 'border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400', order: 1 },
  { id: 'primeiro_contato', name: 'Primeiro Contato', color: 'border-cyan-500 text-cyan-600 bg-cyan-50 dark:bg-cyan-950/40 dark:text-cyan-400', order: 2 },
  { id: 'qualificacao', name: 'Qualificação', color: 'border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400', order: 3 },
  { id: 'reuniao_consulta', name: 'Reunião / Consulta', color: 'border-purple-500 text-purple-600 bg-purple-50 dark:bg-purple-950/40 dark:text-purple-400', order: 4 },
  { id: 'proposta', name: 'Proposta Enviada', color: 'border-indigo-500 text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-400', order: 5 },
  { id: 'negociacao', name: 'Negociação', color: 'border-orange-500 text-orange-600 bg-orange-50 dark:bg-orange-950/40 dark:text-orange-400', order: 6 },
  { id: 'contrato_enviado', name: 'Contrato Enviado', color: 'border-teal-500 text-teal-600 bg-teal-50 dark:bg-teal-950/40 dark:text-teal-400', order: 7 },
  { id: 'contrato_fechado', name: 'Contrato Fechado', color: 'border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400', order: 8 },
  { id: 'perdido', name: 'Perdido', color: 'border-rose-500 text-rose-600 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400', order: 9 },
];

export const CONTRACT_STATUSES = [
  { id: 'rascunho', label: 'Rascunho', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  { id: 'em_revisao', label: 'Em Revisão', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300' },
  { id: 'enviado', label: 'Enviado', color: 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300' },
  { id: 'aguardando_assinatura', label: 'Aguardando Assinatura', color: 'bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300' },
  { id: 'assinado', label: 'Assinado', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300' },
  { id: 'cancelado', label: 'Cancelado', color: 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300' },
];

export const PROPOSAL_STATUSES = [
  { id: 'rascunho', label: 'Rascunho', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  { id: 'enviada', label: 'Enviada', color: 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300' },
  { id: 'visualizada', label: 'Visualizada', color: 'bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300' },
  { id: 'em_negociacao', label: 'Em Negociação', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300' },
  { id: 'aceita', label: 'Aceita', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300' },
  { id: 'recusada', label: 'Recusada', color: 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300' },
  { id: 'expirada', label: 'Expirada', color: 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
];

export const TASK_PRIORITIES = [
  { id: 'baixa', label: 'Baixa', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  { id: 'media', label: 'Média', color: 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300' },
  { id: 'alta', label: 'Alta', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300' },
  { id: 'urgente', label: 'Urgente', color: 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300' },
];

export const ATTENDANCE_CHANNELS = [
  { id: 'whatsapp', label: 'WhatsApp', icon: 'MessageCircle', color: 'text-emerald-500' },
  { id: 'telefone', label: 'Telefone', icon: 'Phone', color: 'text-blue-500' },
  { id: 'email', label: 'E-mail', icon: 'Mail', color: 'text-amber-500' },
  { id: 'presencial', label: 'Presencial', icon: 'MapPin', color: 'text-purple-500' },
  { id: 'videoconferencia', label: 'Videoconferência', icon: 'Video', color: 'text-indigo-500' },
  { id: 'instagram', label: 'Instagram Direct', icon: 'Instagram', color: 'text-pink-500' },
];

export const TASK_TYPES = [
  { id: 'peticao', label: 'Petição / Peça', color: 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300', icon: 'FileText' },
  { id: 'prazo_fatal', label: 'Prazo Fatal', color: 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300', icon: 'AlertTriangle' },
  { id: 'audiencia', label: 'Audiência', color: 'bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300', icon: 'Gavel' },
  { id: 'diligencia', label: 'Diligência', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300', icon: 'MapPin' },
  { id: 'atendimento', label: 'Atendimento / Follow-up', color: 'bg-teal-100 text-teal-800 dark:bg-teal-950/50 dark:text-teal-300', icon: 'UserCheck' },
  { id: 'elaboracao_contrato', label: 'Contrato / Minuta', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300', icon: 'FileCheck' },
  { id: 'cobranca', label: 'Cobrança', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300', icon: 'Coins' },
  { id: 'analise', label: 'Análise / Parecer', color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/50 dark:text-cyan-300', icon: 'Search' },
  { id: 'personalizado', label: 'Personalizado', color: 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300', icon: 'Edit3' },
];

