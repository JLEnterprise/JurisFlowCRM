import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  Coins,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  Search,
  Download,
  Receipt,
  Trash2,
  Undo2,
  Edit,
  X,
  ExternalLink,
  MessageSquare,
  FileText,
  Calendar,
  Save,
  Check,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  UserCheck,
  Sparkles,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { StatCard } from '../common/StatCard';
import { Badge } from '../common/Badge';
import { EmptyState } from '../common/EmptyState';
import { exportService } from '../../services/exportService';
import { ConfirmModal } from '../common/ConfirmModal';
import { Select } from '../common/Select';
import { DateField } from '../common/DateField';
import { Avatar } from '../common/Avatar';
import { ClientPaymentHistory } from './ClientPaymentHistory';
import {
  instAmount, instDue, instPaidOn, instClientName, instNumber, instTotal, instMethod,
  instState, fmtDay, relativeDay, clientKeyOf,
} from './financeUtils';

const KPI_ICONS = { FileText, DollarSign, Coins, TrendingUp, AlertTriangle };

const ICON_BTN ='rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-white/[0.06] dark:hover:text-white';

// Motivos pré-configurados de inadimplência comuns na advocacia
const DEFAULT_OVERDUE_REASONS = [
  'Aguardando liberação de benefício / FGTS / RPV',
  'Aguardando recebimento de salário ou comissão',
  'Solicitou prorrogação / renegociação de data',
  'Problema técnico bancário / limite diário PIX',
  'Cliente alega dificuldade financeira temporária',
  'Tentativa de contato sem sucesso (não atende / sem retorno)',
  'Contestação de valores ou serviços prestados',
  'Outro motivo (especificado nas notas)',
];

// Status do funil de cobrança
const COLLECTION_STAGES = [
  { id: 'pendente_contato', label: 'Pendente de Contato' },
  { id: 'aviso_enviado', label: '1º Lembrete Enviado' },
  { id: 'em_negociacao', label: 'Em Negociação' },
  { id: 'acordo_firmado', label: 'Acordo Firmado' },
  { id: 'notificacao_extrajudicial', label: 'Notificação Extrajudicial' },
  { id: 'cobranca_judicial', label: 'Cobrança Judicial / Execução' },
];

export function FinancialOverview({ onOpenWhatsApp, onSelectClient, onSelectContract, onNavigate }) {
  const {
    clients = [],
    contracts = [],
    installments = [],
    markInstallmentPaid,
    unmarkInstallmentPaid,
    deleteInstallment,
    updateInstallment,
    officeSettings = {},
  } = useCRM();

  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(''); // '', 'paid', 'pending', 'overdue'
  const [activeCardKey, setActiveCardKey] = useState(null); // 'contracted', 'received', 'pending', 'ticket', 'overdue'
  const [historyClientKey, setHistoryClientKey] = useState(null); // cliente aberto no histórico de pagamentos

  // Modals de exclusão e edição padrão
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [installmentToDelete, setInstallmentToDelete] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [installmentToEdit, setInstallmentToEdit] = useState(null);

  // Modal exclusivo de Gestão de Inadimplência & Motivos
  const [overdueModalOpen, setOverdueModalOpen] = useState(false);
  const [selectedOverdueInstallment, setSelectedOverdueInstallment] = useState(null);
  const [overdueForm, setOverdueForm] = useState({
    overdueReason: '',
    overdueNotes: '',
    promisedDate: '',
    collectionStage: 'pendente_contato',
  });
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  // Formulário padrão de edição
  const [editForm, setEditForm] = useState({
    status: '',
    paymentMethod: '',
    dueDate: '',
  });

  // Função auxiliar para calcular se a parcela está em atraso
  const checkIsOverdue = (inst) => {
    if (!inst || inst.status === 'paid') return false;
    const due = inst.dueDate || inst.due_date;
    if (!due) return false;
    const todayStr = new Date().toISOString().split('T')[0];
    const dueStr = String(due).split('T')[0];
    return dueStr < todayStr;
  };

  // Dias de atraso
  const getDaysOverdue = (inst) => {
    const due = inst.dueDate || inst.due_date;
    if (!due) return 0;
    const dueTime = new Date(due).getTime();
    const nowTime = new Date().getTime();
    const diffDays = Math.floor((nowTime - dueTime) / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  // Cálculos de Totais
  const contractsTotal = (contracts || [])
    .filter((c) => c.status !== 'cancelado' && c.status !== 'rescindido')
    .reduce((acc, c) => acc + (Number(c.value) || 0), 0);

  const totalReceived = (installments || [])
    .filter((i) => i.status === 'paid')
    .reduce((acc, i) => acc + (Number(i.amount || i.value) || 0), 0);

  const pendingInstallmentsSum = (installments || [])
    .filter((i) => i.status === 'pending')
    .reduce((acc, i) => acc + (Number(i.amount || i.value) || 0), 0);

  const totalContracted = Math.max(contractsTotal, totalReceived + pendingInstallmentsSum);
  const totalPending = pendingInstallmentsSum > 0 ? pendingInstallmentsSum : Math.max(0, totalContracted - totalReceived);
  const activeContractsCount = (contracts || []).filter((c) => c.status !== 'cancelado' && c.status !== 'rescindido').length;
  const averageTicket = activeContractsCount > 0 ? totalContracted / activeContractsCount : (totalContracted > 0 ? totalContracted : 0);

  // Lista de todas as parcelas em atraso
  const overdueInstallments = useMemo(() => {
    return (installments || []).filter(checkIsOverdue);
  }, [installments]);

  const defaultRate = totalContracted > 0
    ? ((overdueInstallments.reduce((a, b) => a + (Number(b.amount || b.value) || 0), 0) / totalContracted) * 100).toFixed(1)
    : '0.0';

  // Filtro de parcelas para a tabela
  const filteredInstallments = useMemo(() => {
    return (installments || []).filter((i) => {
      const clientName = String(i.clientName || i.client_name || '').toLowerCase();
      const matchesSearch = !search || clientName.includes(search.toLowerCase());

      let matchesStatus = true;
      if (selectedStatus === 'paid') {
        matchesStatus = i.status === 'paid';
      } else if (selectedStatus === 'pending') {
        matchesStatus = i.status === 'pending' && !checkIsOverdue(i);
      } else if (selectedStatus === 'overdue') {
        matchesStatus = checkIsOverdue(i);
      } else if (selectedStatus) {
        matchesStatus = i.status === selectedStatus;
      }

      return matchesSearch && matchesStatus;
    });
  }, [installments, search, selectedStatus]);

  // Ordem da lista: atrasadas (mais antigas primeiro), depois a vencer (mais próximas), por fim pagas (mais recentes)
  const sortedInstallments = useMemo(() => {
    const rank = { overdue: 0, upcoming: 1, paid: 2 };
    return [...filteredInstallments].sort((a, b) => {
      const ra = rank[instState(a)];
      const rb = rank[instState(b)];
      if (ra !== rb) return ra - rb;
      if (ra === 2) return (instPaidOn(b) || instDue(b)).localeCompare(instPaidOn(a) || instDue(a));
      return instDue(a).localeCompare(instDue(b));
    });
  }, [filteredInstallments]);

  const handleShowReceipt = (inst) => {
    alert(
      `Recibo de pagamento\n\nCliente: ${instClientName(inst)}\nParcela: ${instNumber(inst)} de ${instTotal(inst)}\nValor: ${formatCurrency(instAmount(inst))}\nData: ${fmtDay(instPaidOn(inst) || instDue(inst))}\nForma: ${instMethod(inst) || 'PIX'}`
    );
  };

  // Ações ao clicar em cada Card de KPI
  const handleCardClick = (cardKey) => {
    if (activeCardKey === cardKey) {
      // Se clicou no mesmo card, limpa o filtro
      setActiveCardKey(null);
      setSelectedStatus('');
      return;
    }

    setActiveCardKey(cardKey);

    switch (cardKey) {
      case 'contracted':
        // Receita Contratada: exibe todas as parcelas ou navega para contratos
        setSelectedStatus('');
        break;

      case 'received':
        // Receita Recebida: filtra na tabela apenas as Pagas
        setSelectedStatus('paid');
        break;

      case 'pending':
        // Receita a Receber: filtra na tabela as Pendentes a Vencer
        setSelectedStatus('pending');
        break;

      case 'ticket':
        // Ticket Médio: se houver onNavigate, pode alternar para a aba de Contratos
        if (onNavigate) {
          onNavigate('contracts');
        } else {
          setSelectedStatus('');
        }
        break;

      case 'overdue':
        // Inadimplência: filtra por parcelas em atraso E abre o painel de inadimplência
        setSelectedStatus('overdue');
        setOverdueModalOpen(true);
        if (overdueInstallments.length > 0) {
          handleOpenOverdueDetail(overdueInstallments[0]);
        }
        break;

      default:
        setSelectedStatus('');
        break;
    }
  };

  // Abre modal para detalhar e registrar motivo de inadimplência de uma parcela específica
  const handleOpenOverdueDetail = (inst) => {
    setSelectedOverdueInstallment(inst);
    setOverdueForm({
      overdueReason: inst.overdueReason || inst.overdue_reason || DEFAULT_OVERDUE_REASONS[0],
      overdueNotes: inst.overdueNotes || inst.overdue_notes || '',
      promisedDate: inst.promisedDate || inst.promised_date || '',
      collectionStage: inst.collectionStage || inst.collection_stage || 'pendente_contato',
    });
    setOverdueModalOpen(true);
    setSaveSuccessMsg(false);
  };

  // Salva o motivo da inadimplência e histórico de cobrança
  const handleSaveOverdueReason = (e) => {
    e.preventDefault();
    if (!selectedOverdueInstallment) return;

    updateInstallment(selectedOverdueInstallment.id, {
      overdueReason: overdueForm.overdueReason,
      overdueNotes: overdueForm.overdueNotes,
      promisedDate: overdueForm.promisedDate,
      collectionStage: overdueForm.collectionStage,
    });

    setSaveSuccessMsg(true);
    setTimeout(() => {
      setSaveSuccessMsg(false);
    }, 2500);
  };

  // Ação de cobrança via WhatsApp
  const handleSendCollectionWhatsApp = (inst) => {
    const targetClient = (clients || []).find((c) =>
      c.id === (inst.clientId || inst.client_id) ||
      (c.name && inst.clientName && c.name.trim().toLowerCase() === inst.clientName.trim().toLowerCase())
    );

    const clientPhone = targetClient?.phone || targetClient?.telefone || inst.phone || '';

    if (onOpenWhatsApp) {
      onOpenWhatsApp({
        templateId: 'cobranca_elegante',
        clientName: inst.clientName || inst.client_name || 'Cliente',
        phone: clientPhone,
        value: inst.amount || inst.value || 0,
        dueDate: formatDate(inst.dueDate || inst.due_date),
        officeName: officeSettings.officeName || 'JurisFlow Advocacia & Consultoria',
        pixKey: officeSettings.pixKey || 'pix@escritorioadv.com.br',
      });
    } else {
      alert(`Abrindo cobrança para ${inst.clientName}:\nValor: ${formatCurrency(inst.amount || inst.value)}\nVencimento: ${formatDate(inst.dueDate || inst.due_date)}`);
    }
  };

  // Handlers para Edição Padrão
  const handleOpenEdit = (inst) => {
    setInstallmentToEdit(inst);
    setEditForm({
      status: inst.status || 'pending',
      paymentMethod: inst.paymentMethod || inst.payment_method || 'PIX',
      dueDate: inst.dueDate || inst.due_date || '',
    });
    setEditModalOpen(true);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (installmentToEdit) {
      updateInstallment(installmentToEdit.id, {
        status: editForm.status,
        paymentMethod: editForm.paymentMethod,
        dueDate: editForm.dueDate,
        paymentDate: editForm.status === 'paid' ? (installmentToEdit.paymentDate || new Date().toISOString()) : null,
      });
      setEditModalOpen(false);
      setInstallmentToEdit(null);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      { key: 'clientName', label: 'Cliente' },
      { key: 'number', label: 'Parcela', formatter: (val, row) => `${val}/${row.totalInstallments}` },
      { key: 'amount', label: 'Valor (R$)', formatter: (val) => val },
      { key: 'dueDate', label: 'Vencimento' },
      { key: 'paymentDate', label: 'Data Pagamento' },
      { key: 'status', label: 'Status' },
      { key: 'overdueReason', label: 'Motivo do Atraso' },
      { key: 'collectionStage', label: 'Fase da Cobrança' },
      { key: 'paymentMethod', label: 'Forma' },
    ];
    exportService.exportToCSV('Relatorio_Financeiro_JurisFlow', filteredInstallments, headers);
  };

  // Tela de histórico de um cliente (substitui a lista, com botão de voltar)
  if (historyClientKey) {
    return (
      <ClientPaymentHistory
        clientKey={historyClientKey}
        onBack={() => setHistoryClientKey(null)}
        onOpenWhatsApp={onOpenWhatsApp}
        onOpenClient={onSelectClient ? (id) => onSelectClient(id) : undefined}
      />
    );
  }

  const STATUS_TABS = [
    { id: '', label: 'Todas', count: installments.length },
    { id: 'pending', label: 'A vencer', count: (installments || []).filter(i => i.status !== 'paid' && !checkIsOverdue(i)).length },
    { id: 'overdue', label: 'Em atraso', count: overdueInstallments.length, tone: 'is-lost' },
    { id: 'paid', label: 'Pagas', count: (installments || []).filter(i => i.status === 'paid').length, tone: 'is-won' },
  ];

  const kpis = [
    { key: 'contracted', title: 'Receita contratada', value: formatCurrency(totalContracted), subtitle: `${activeContractsCount} contrato(s) ativo(s)`, iconName: 'FileText', color: 'gold' },
    { key: 'received', title: 'Recebido', value: formatCurrency(totalReceived), subtitle: 'Honorários liquidados', iconName: 'DollarSign', color: 'emerald' },
    { key: 'pending', title: 'A receber', value: formatCurrency(totalPending), subtitle: 'Parcelas em aberto', iconName: 'Coins', color: 'gold' },
    { key: 'ticket', title: 'Ticket médio', value: formatCurrency(averageTicket), subtitle: 'Por contrato', iconName: 'TrendingUp', color: 'gold' },
    {
      key: 'overdue', title: 'Inadimplência', value: `${defaultRate}%`,
      subtitle: overdueInstallments.length ? `${overdueInstallments.length} parcela(s) em atraso` : 'Nenhuma parcela em atraso',
      iconName: 'AlertTriangle', color: overdueInstallments.length > 0 ? 'rose' : 'emerald',
    },
  ];

  const STATE_PILL = {
    paid: 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/25 dark:text-emerald-300',
    overdue: 'bg-rose-500/10 text-rose-700 ring-rose-500/30 dark:text-rose-300',
    upcoming: 'bg-gold-500/10 text-gold-800 ring-gold-500/30 dark:text-gold-200',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Indicadores (clicáveis: filtram a lista) */}
      <div className="dash-panel !p-0 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-slate-200/80 dark:divide-white/[0.06] lg:divide-x">
        {kpis.map((k) => {
          const active = activeCardKey === k.key || (k.key !== 'contracted' && k.key !== 'ticket' && selectedStatus === k.key);
          const Icon = KPI_ICONS[k.iconName];
          const tone = k.color === 'rose' ? 'text-rose-500' : k.color === 'emerald' ? 'text-emerald-500' : 'text-gold-600 dark:text-gold-400';
          return (
            <button
              key={k.key}
              type="button"
              onClick={() => handleCardClick(k.key)}
              className={`group relative px-5 py-4 text-left transition-colors hover:bg-gold-500/[0.04] ${active ? 'bg-gold-500/[0.07]' : ''}`}
            >
              {active && <span className="absolute inset-x-5 bottom-0 h-0.5 rounded-full bg-gold-500" />}
              <div className="flex items-center justify-between gap-2">
                <span className="font-label text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{k.title}</span>
                {Icon && <Icon className={`h-3.5 w-3.5 shrink-0 ${tone}`} />}
              </div>
              <div className="mt-2 whitespace-nowrap font-numeric text-lg font-semibold text-slate-900 dark:text-white">{k.value}</div>
              <div className="mt-0.5 truncate text-[11px] text-slate-500 dark:text-slate-400">{k.subtitle}</div>
            </button>
          );
        })}
      </div>

      {/* Contas a receber */}
      <div className="dash-panel !p-0 overflow-hidden">
        <div className="flex flex-col gap-4 px-5 pt-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">Contas a receber</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Clique no cliente para ver o histórico de pagamentos e a projeção</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {overdueInstallments.length > 0 && (
              <button
                onClick={() => {
                  setSelectedStatus('overdue');
                  setActiveCardKey('overdue');
                  handleOpenOverdueDetail(overdueInstallments[0]);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/[0.07] px-3 py-1.5 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-500/[0.12] dark:text-rose-300"
              >
                <AlertTriangle className="h-3.5 w-3.5" /> Inadimplência ({overdueInstallments.length})
              </button>
            )}
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-gold-500/40 hover:text-slate-900 dark:border-white/[0.08] dark:text-slate-300 dark:hover:text-white"
            >
              <Download className="h-3.5 w-3.5" /> Exportar
            </button>
          </div>
        </div>

        {/* Filtros numa linha só */}
        <div className="flex flex-wrap items-center gap-3 px-5 py-4">
          <div className="funil-tabs">
            {STATUS_TABS.map(t => (
              <button
                key={t.id || 'all'}
                type="button"
                onClick={() => { setSelectedStatus(t.id); setActiveCardKey(t.id || null); }}
                className={`funil-tab ${t.tone || ''} ${selectedStatus === t.id ? 'is-active' : ''}`}
              >
                {t.label} <span className="funil-tab__count">{t.count}</span>
              </button>
            ))}
          </div>
          <div className="relative ml-auto w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar cliente..."
              className="w-full rounded-full border border-slate-200 bg-white/70 py-1.5 pl-8 pr-3 text-xs text-slate-900 focus:border-gold-500/50 focus:outline-none dark:border-white/[0.08] dark:bg-white/[0.02] dark:text-white"
            />
          </div>
        </div>

        {sortedInstallments.length === 0 ? (
          <div className="px-5 pb-6">
            <EmptyState
              title="Nenhuma parcela encontrada"
              description={
                selectedStatus === 'overdue'
                  ? 'Nenhuma parcela em atraso nesta carteira.'
                  : 'Não há parcelas para os filtros escolhidos.'
              }
              iconName={selectedStatus === 'overdue' ? 'CheckCircle2' : 'Coins'}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-y border-slate-200/80 bg-slate-50/70 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:border-white/[0.06] dark:bg-white/[0.02] dark:text-slate-400">
                  <th className="px-5 py-3 font-label">Cliente</th>
                  <th className="px-4 py-3 font-label">Parcela</th>
                  <th className="px-4 py-3 font-label">Vencimento</th>
                  <th className="px-4 py-3 font-label text-right">Valor</th>
                  <th className="px-4 py-3 font-label">Situação</th>
                  <th className="px-5 py-3 font-label text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                {sortedInstallments.map((inst) => {
                  const state = instState(inst);
                  const due = instDue(inst);
                  const paidOn = instPaidOn(inst);
                  const number = instNumber(inst);
                  const total = instTotal(inst);
                  const reason = inst.overdueReason || inst.overdue_reason;

                  return (
                    <tr key={inst.id} className="group transition-colors hover:bg-gold-500/[0.035]">
                      <td className="px-5 py-3">
                        <button
                          type="button"
                          onClick={() => setHistoryClientKey(clientKeyOf(inst, clients))}
                          className="flex items-center gap-3 text-left"
                          title="Ver histórico de pagamentos"
                        >
                          <Avatar name={instClientName(inst)} size="sm" />
                          <span className="min-w-0">
                            <span className="block truncate font-semibold text-slate-900 transition-colors group-hover:text-gold-700 dark:text-white dark:group-hover:text-gold-300">
                              {instClientName(inst)}
                            </span>
                            {state === 'overdue' && reason ? (
                              <span className="block max-w-[14rem] truncate text-[11px] text-rose-600 dark:text-rose-400">{reason}</span>
                            ) : (
                              <span className="block text-[11px] text-slate-400">Ver histórico</span>
                            )}
                          </span>
                        </button>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-numeric text-xs font-semibold text-slate-700 dark:text-slate-200">{number} de {total}</div>
                        <div className="mt-1 flex h-1 w-16 gap-[2px]">
                          {Array.from({ length: Math.min(total, 12) }).map((_, n) => (
                            <span
                              key={n}
                              className={`flex-1 rounded-full ${n < Math.round((number / total) * Math.min(total, 12)) ? 'bg-gold-500/80' : 'bg-slate-200 dark:bg-white/[0.08]'}`}
                            />
                          ))}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-numeric text-xs text-slate-800 dark:text-slate-200">{fmtDay(due)}</div>
                        <div className={`text-[11px] ${state === 'overdue' ? 'font-semibold text-rose-600 dark:text-rose-400' : 'text-slate-400'}`}>
                          {state === 'paid' ? `pago ${fmtDay(paidOn || due, { day: '2-digit', month: '2-digit' })}` : relativeDay(due)}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-right font-numeric font-semibold text-slate-900 dark:text-white">
                        {formatCurrency(instAmount(inst))}
                      </td>

                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={state === 'overdue' ? () => handleOpenOverdueDetail(inst) : undefined}
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${STATE_PILL[state]} ${state === 'overdue' ? 'cursor-pointer' : 'cursor-default'}`}
                          title={state === 'overdue' ? 'Registrar motivo do atraso' : undefined}
                        >
                          {state === 'paid' && <CheckCircle2 className="h-3 w-3" />}
                          {state === 'overdue' && <AlertTriangle className="h-3 w-3" />}
                          {state === 'upcoming' && <Clock className="h-3 w-3" />}
                          {state === 'paid' ? `Pago${instMethod(inst) ? ` · ${instMethod(inst)}` : ''}` : state === 'overdue' ? `${getDaysOverdue(inst)} dia(s) de atraso` : 'A vencer'}
                        </button>
                      </td>

                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-0.5">
                          {state !== 'paid' ? (
                            <button
                              onClick={() => markInstallmentPaid(inst.id)}
                              className="mr-1 inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 transition-colors hover:bg-emerald-500/10 dark:text-emerald-300"
                              title="Dar baixa (pago hoje)"
                            >
                              <Check className="h-3 w-3" /> Baixa
                            </button>
                          ) : (
                            <button onClick={() => unmarkInstallmentPaid(inst.id)} className={ICON_BTN} title="Estornar baixa">
                              <Undo2 className="h-4 w-4" />
                            </button>
                          )}
                          {state === 'overdue' && (
                            <button onClick={() => handleSendCollectionWhatsApp(inst)} className={`${ICON_BTN} hover:!text-emerald-600`} title="Cobrar no WhatsApp">
                              <MessageSquare className="h-4 w-4" />
                            </button>
                          )}
                          {state === 'paid' && (
                            <button onClick={() => handleShowReceipt(inst)} className={ICON_BTN} title="Recibo">
                              <Receipt className="h-4 w-4" />
                            </button>
                          )}
                          <button onClick={() => handleOpenEdit(inst)} className={ICON_BTN} title="Editar parcela">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => { setInstallmentToDelete(inst); setDeleteModalOpen(true); }}
                            className={`${ICON_BTN} hover:!text-rose-600`}
                            title="Excluir parcela"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL ESPECIAL: GESTÃO DE INADIMPLÊNCIA & MOTIVOS DE ATRASO              */}
      {/* ========================================================================= */}
      {overdueModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOverdueModalOpen(false);
          }}
        >
          <div className="premium-modal w-full max-w-4xl rounded-3xl bg-white shadow-2xl dark:bg-navy-900 border border-gold-500/25 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Header do Modal */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 p-6 dark:border-slate-800 dark:bg-navy-950 shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    Gestão de Inadimplência & Motivos de Atraso
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Registre justificativas, promessas de pagamento e acione cobranças no WhatsApp
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setOverdueModalOpen(false)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Conteúdo do Modal */}
            <div className="p-6 overflow-y-auto space-y-6">
              {overdueInstallments.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Parabéns! 100% de Pontualidade na Carteira
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    Nenhuma parcela está em atraso neste escritório. Todos os honorários vencidos foram liquidados ou as parcelas ainda estão a vencer.
                  </p>
                  <button
                    onClick={() => {
                      setOverdueModalOpen(false);
                      setSelectedStatus('pending');
                      setActiveCardKey('pending');
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-gold-700 via-gold-600 to-gold-500 hover:brightness-110 text-white text-xs font-bold transition-all shadow-sm"
                  >
                    Ver Parcelas a Vencer <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  {/* Coluna Esquerda: Lista de Parcelas em Atraso */}
                  <div className="md:col-span-5 space-y-3 border-r border-slate-100 dark:border-slate-800 pr-0 md:pr-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Inadimplentes ({overdueInstallments.length})
                      </span>
                      <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                        Total: {formatCurrency(overdueInstallments.reduce((a, b) => a + (Number(b.amount || b.value) || 0), 0))}
                      </span>
                    </div>

                    <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
                      {overdueInstallments.map((inst) => {
                        const isSelected = selectedOverdueInstallment?.id === inst.id;
                        const days = getDaysOverdue(inst);

                        return (
                          <div
                            key={inst.id}
                            onClick={() => handleOpenOverdueDetail(inst)}
                            className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-500/50 shadow-sm'
                                : 'bg-slate-50/50 dark:bg-navy-950/50 border-slate-200/70 dark:border-slate-800 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                                {inst.clientName || inst.client_name || 'Cliente'}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 shrink-0">
                                {days}d atraso
                              </span>
                            </div>

                            <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                              <span className="font-extrabold text-slate-800 dark:text-slate-200">
                                {formatCurrency(inst.amount || inst.value || 0)}
                              </span>
                              <span className="text-[11px]">
                                Venc: {formatDate(inst.dueDate || inst.due_date)}
                              </span>
                            </div>

                            {/* Motivo registrado */}
                            <div className="mt-2 text-[10px] text-slate-600 dark:text-slate-400 truncate">
                              📌 {inst.overdueReason || inst.overdue_reason || 'Motivo não informado ainda'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Coluna Direita: Detalhamento & Formulário de Motivo da Inadimplência */}
                  <div className="md:col-span-7 space-y-5">
                    {selectedOverdueInstallment ? (
                      <form onSubmit={handleSaveOverdueReason} className="space-y-4">
                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              Cliente Selecionado
                            </span>
                            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                              {selectedOverdueInstallment.clientName || selectedOverdueInstallment.client_name}
                            </h4>
                            <p className="text-xs text-slate-500">
                              Parcela {selectedOverdueInstallment.installmentNumber || 1}/{selectedOverdueInstallment.totalInstallments || 1} •{' '}
                              <strong className="text-rose-600 dark:text-rose-400 font-bold">
                                {formatCurrency(selectedOverdueInstallment.amount || selectedOverdueInstallment.value)}
                              </strong>{' '}
                              (Venceu em {formatDate(selectedOverdueInstallment.dueDate || selectedOverdueInstallment.due_date)})
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleSendCollectionWhatsApp(selectedOverdueInstallment)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm shrink-0"
                            title="Abrir WhatsApp com mensagem amigável de cobrança"
                          >
                            <MessageSquare className="h-4 w-4" /> Cobrar no WhatsApp
                          </button>
                        </div>

                        {/* Campo 1: Motivo Principal da Inadimplência */}
                        <div>
                          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                            Motivo Principal da Inadimplência
                          </label>
                          <Select
                            value={overdueForm.overdueReason}
                            onChange={(e) => setOverdueForm((prev) => ({ ...prev, overdueReason: e.target.value }))}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-gold-500 focus:outline-none dark:border-slate-800 dark:bg-navy-950 dark:text-white font-medium"
                          >
                            {DEFAULT_OVERDUE_REASONS.map((reason) => (
                              <option key={reason} value={reason}>
                                {reason}
                              </option>
                            ))}
                          </Select>
                        </div>

                        {/* Campo 2: Fase da Cobrança */}
                        <div>
                          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                            Fase / Etapa da Cobrança
                          </label>
                          <Select
                            value={overdueForm.collectionStage}
                            onChange={(e) => setOverdueForm((prev) => ({ ...prev, collectionStage: e.target.value }))}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-gold-500 focus:outline-none dark:border-slate-800 dark:bg-navy-950 dark:text-white font-medium"
                          >
                            {COLLECTION_STAGES.map((st) => (
                              <option key={st.id} value={st.id}>
                                {st.label}
                              </option>
                            ))}
                          </Select>
                        </div>

                        {/* Campo 3: Data Prometida para Pagamento */}
                        <div>
                          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                            Data Prometida para Quitação / Reagendamento
                          </label>
                          <DateField
                            type="date"
                            value={overdueForm.promisedDate}
                            onChange={(e) => setOverdueForm((prev) => ({ ...prev, promisedDate: e.target.value }))}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-gold-500 focus:outline-none dark:border-slate-800 dark:bg-navy-950 dark:text-white"
                          />
                        </div>

                        {/* Campo 4: Observações e Histórico */}
                        <div>
                          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                            Observações do Contato & Acordo com o Cliente
                          </label>
                          <textarea
                            rows={3}
                            value={overdueForm.overdueNotes}
                            onChange={(e) => setOverdueForm((prev) => ({ ...prev, overdueNotes: e.target.value }))}
                            placeholder="Ex: Cliente atendeu informando que o benefício cai dia 15. Combinado pagamento integral via PIX."
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-900 focus:border-gold-500 focus:outline-none dark:border-slate-800 dark:bg-navy-950 dark:text-white resize-none"
                          />
                        </div>

                        {/* Feedback de salvamento */}
                        {saveSuccessMsg && (
                          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                            <Check className="h-4 w-4 text-emerald-500" />
                            Motivo e histórico de inadimplência salvos com sucesso!
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                          <button
                            type="button"
                            onClick={() => {
                              markInstallmentPaid(selectedOverdueInstallment.id);
                              setOverdueModalOpen(false);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" /> Dar Baixa (Quitado)
                          </button>

                          <button
                            type="submit"
                            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-gradient-to-r from-gold-700 via-gold-600 to-gold-500 hover:brightness-110 text-white text-xs font-bold transition-all shadow-lg shadow-gold-500/20 active:scale-95"
                          >
                            <Save className="h-4 w-4" /> Salvar Motivo & Histórico
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="py-12 text-center text-xs text-slate-400">
                        Selecione um cliente inadimplente na lista ao lado para ver e registrar o motivo.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Exclusão de Parcela */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setInstallmentToDelete(null);
        }}
        onConfirm={() => {
          if (installmentToDelete) {
            deleteInstallment(installmentToDelete.id);
            setDeleteModalOpen(false);
            setInstallmentToDelete(null);
          }
        }}
        title="Excluir Parcela / Recibo"
        message={`Deseja realmente excluir a parcela de ${formatCurrency(
          installmentToDelete?.amount || installmentToDelete?.value || 0
        )} do cliente ${
          installmentToDelete?.clientName || installmentToDelete?.client_name
        }? Esta ação não pode ser desfeita.`}
        confirmLabel="Sim, Excluir"
      />

      {/* Modal Padrão de Edição de Parcela */}
      {editModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setEditModalOpen(false);
              setInstallmentToEdit(null);
            }
          }}
        >
          <div className="premium-modal w-full max-w-md rounded-3xl bg-white shadow-2xl dark:bg-navy-900 border border-gold-500/25 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 p-6 dark:border-slate-800 dark:bg-navy-950/50 shrink-0">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Edit className="h-5 w-5 text-gold-600 dark:text-gold-400" />
                Editar Parcela / Recibo
              </h2>
              <button
                type="button"
                onClick={() => {
                  setEditModalOpen(false);
                  setInstallmentToEdit(null);
                }}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-5 overflow-y-auto">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Status
                </label>
                <Select
                  required
                  value={editForm.status}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, status: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 focus:border-gold-500 focus:outline-none dark:border-slate-800 dark:bg-navy-950/50 dark:text-white"
                >
                  <option value="pending">Pendente</option>
                  <option value="paid">Liquidado (Pago)</option>
                </Select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Forma de Pagamento
                </label>
                <Select
                  required
                  value={editForm.paymentMethod}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, paymentMethod: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 focus:border-gold-500 focus:outline-none dark:border-slate-800 dark:bg-navy-950/50 dark:text-white"
                >
                  <option value="PIX">PIX</option>
                  <option value="Boleto">Boleto</option>
                  <option value="Cartão de Crédito">Cartão de Crédito</option>
                  <option value="Transferência">Transferência Bancária</option>
                  <option value="Dinheiro">Dinheiro em Espécie</option>
                  <option value="Êxito / Quota Litis">Êxito / Quota Litis</option>
                  <option value="A combinar">A combinar</option>
                </Select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Data de Vencimento
                </label>
                <DateField
                  type="date"
                  required
                  value={editForm.dueDate}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 focus:border-gold-500 focus:outline-none dark:border-slate-800 dark:bg-navy-950/50 dark:text-white [&::-webkit-calendar-picker-indicator]:dark:invert"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setEditModalOpen(false);
                    setInstallmentToEdit(null);
                  }}
                  className="rounded-xl px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-gradient-to-r from-gold-700 via-gold-600 to-gold-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-gold-500/25 hover:brightness-110 active:scale-95 transition-all"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
