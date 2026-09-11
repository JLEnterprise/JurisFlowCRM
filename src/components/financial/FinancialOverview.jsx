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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 5 KPIs CLICÁVEIS E INTERATIVOS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Receita Contratada */}
        <div
          onClick={() => handleCardClick('contracted')}
          className={`cursor-pointer transition-all duration-200 transform hover:-translate-y-1 ${
            activeCardKey === 'contracted'
              ? 'ring-2 ring-brand-500 rounded-2xl shadow-lg shadow-brand-500/10'
              : ''
          }`}
          title="Clique para ver todos os contratos e parcelas ativas"
        >
          <StatCard
            title="Receita Contratada"
            value={formatCurrency(totalContracted)}
            subtitle="Total em contratos ativos (Clique p/ ver)"
            iconName="FileText"
            color="brand"
            className="h-full"
          />
        </div>

        {/* Card 2: Receita Recebida */}
        <div
          onClick={() => handleCardClick('received')}
          className={`cursor-pointer transition-all duration-200 transform hover:-translate-y-1 ${
            activeCardKey === 'received' || selectedStatus === 'paid'
              ? 'ring-2 ring-emerald-500 rounded-2xl shadow-lg shadow-emerald-500/10'
              : ''
          }`}
          title="Clique para filtrar apenas parcelas liquidadas/pagas"
        >
          <StatCard
            title="Receita Recebida"
            value={formatCurrency(totalReceived)}
            subtitle="Honorários liquidados (Clique p/ filtrar)"
            iconName="DollarSign"
            color="emerald"
            className="h-full"
          />
        </div>

        {/* Card 3: Receita a Receber */}
        <div
          onClick={() => handleCardClick('pending')}
          className={`cursor-pointer transition-all duration-200 transform hover:-translate-y-1 ${
            activeCardKey === 'pending' || selectedStatus === 'pending'
              ? 'ring-2 ring-gold-500 rounded-2xl shadow-lg shadow-gold-500/10'
              : ''
          }`}
          title="Clique para filtrar apenas parcelas a receber"
        >
          <StatCard
            title="Receita a Receber"
            value={formatCurrency(totalPending)}
            subtitle="Parcelas futuras e em aberto (Clique)"
            iconName="Coins"
            color="gold"
            className="h-full"
          />
        </div>

        {/* Card 4: Ticket Médio */}
        <div
          onClick={() => handleCardClick('ticket')}
          className={`cursor-pointer transition-all duration-200 transform hover:-translate-y-1 ${
            activeCardKey === 'ticket'
              ? 'ring-2 ring-indigo-500 rounded-2xl shadow-lg shadow-indigo-500/10'
              : ''
          }`}
          title="Clique para ir à aba de Contratos & Minutas"
        >
          <StatCard
            title="Ticket Médio"
            value={formatCurrency(averageTicket)}
            subtitle="Média por contrato (Ir p/ Contratos)"
            iconName="TrendingUp"
            color="indigo"
            className="h-full"
          />
        </div>

        {/* Card 5: Inadimplência */}
        <div
          onClick={() => handleCardClick('overdue')}
          className={`cursor-pointer transition-all duration-200 transform hover:-translate-y-1 ${
            activeCardKey === 'overdue' || selectedStatus === 'overdue'
              ? 'ring-2 ring-rose-500 rounded-2xl shadow-lg shadow-rose-500/20 animate-pulse'
              : ''
          }`}
          title="Clique para abrir a Gestão de Inadimplência e Motivos de Atraso"
        >
          <StatCard
            title="Inadimplência"
            value={`${defaultRate}%`}
            subtitle={`${overdueInstallments.length} parcela(s) em atraso (Ver Motivos)`}
            iconName="AlertTriangle"
            color={overdueInstallments.length > 0 ? 'rose' : 'emerald'}
            className="h-full"
          />
        </div>
      </div>

      {/* BANNER INFORMATIVO DE FILTRO ATIVO (Feedback visual amigável) */}
      {(selectedStatus || activeCardKey) && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-brand-50/50 dark:bg-brand-950/20 border border-brand-200/60 dark:border-brand-900/40 text-xs text-brand-900 dark:text-brand-200 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-brand-600 dark:text-brand-400 shrink-0" />
            <span>
              Filtro ativo por card:{' '}
              <strong className="font-bold uppercase tracking-wider">
                {selectedStatus === 'paid' && 'Honorários Liquidados (Pagas)'}
                {selectedStatus === 'pending' && 'Parcelas Futuras / Pendentes'}
                {selectedStatus === 'overdue' && `Inadimplência (${overdueInstallments.length} em atraso)`}
                {activeCardKey === 'contracted' && 'Todas as Parcelas Contratadas'}
                {activeCardKey === 'ticket' && 'Ticket Médio de Contratos'}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {selectedStatus === 'overdue' && (
              <button
                onClick={() => setOverdueModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition-all shadow-sm"
              >
                <AlertCircle className="h-3.5 w-3.5" /> Abrir Painel de Motivos
              </button>
            )}
            {activeCardKey === 'contracted' && onNavigate && (
              <button
                onClick={() => onNavigate('contracts')}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold transition-all shadow-sm"
              >
                <FileText className="h-3.5 w-3.5" /> Ir para Contratos & Minutas
              </button>
            )}
            <button
              onClick={() => {
                setSelectedStatus('');
                setActiveCardKey(null);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors font-semibold"
            >
              <X className="h-3.5 w-3.5" /> Limpar Filtro
            </button>
          </div>
        </div>
      )}

      {/* SEÇÃO PRINCIPAL: Gestão de Contas a Receber & Parcelas */}
      <div className="rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Coins className="h-5 w-5 text-gold-500" />
              Gestão de Contas a Receber & Parcelas
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Controle detalhado de vencimentos, baixas manuais, motivos de inadimplência e recibos
            </p>
          </div>

          <div className="flex items-center gap-2">
            {overdueInstallments.length > 0 && (
              <button
                onClick={() => {
                  setSelectedStatus('overdue');
                  setActiveCardKey('overdue');
                  setOverdueModalOpen(true);
                  handleOpenOverdueDetail(overdueInstallments[0]);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 px-3.5 py-1.5 text-xs font-bold text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors shadow-sm"
              >
                <AlertTriangle className="h-3.5 w-3.5 text-rose-500 animate-pulse" />
                Painel de Inadimplência ({overdueInstallments.length})
              </button>
            )}

            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
            >
              <Download className="h-3.5 w-3.5" /> Exportar Planilha
            </button>
          </div>
        </div>

        {/* Barra de Filtros */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por cliente contratante..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-navy-950 pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none"
            />
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setActiveCardKey(e.target.value);
            }}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-navy-950 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="">Todos os Status</option>
            <option value="paid">✅ Liquidadas (Pagas)</option>
            <option value="pending">⏳ Pendentes (A Vencer)</option>
            <option value="overdue">🚨 Em Atraso (Inadimplentes)</option>
          </select>

          {selectedStatus && (
            <button
              onClick={() => {
                setSelectedStatus('');
                setActiveCardKey(null);
              }}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 underline"
            >
              Ver todas ({installments.length})
            </button>
          )}
        </div>

        {/* Tabela de Parcelas */}
        {filteredInstallments.length === 0 ? (
          <EmptyState
            title="Nenhuma parcela encontrada"
            description={
              selectedStatus === 'overdue'
                ? 'Excelente notícia! Nenhuma parcela em atraso registrada nesta carteira.'
                : 'Não há registros financeiros correspondentes aos filtros selecionados.'
            }
            iconName={selectedStatus === 'overdue' ? 'CheckCircle2' : 'Coins'}
          />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-navy-950 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3.5">Cliente Contratante</th>
                  <th className="px-4 py-3.5">Parcela</th>
                  <th className="px-4 py-3.5">Valor da Parcela</th>
                  <th className="px-4 py-3.5">Vencimento</th>
                  <th className="px-4 py-3.5">Status & Situação</th>
                  <th className="px-4 py-3.5">Data do Pagamento</th>
                  <th className="px-4 py-3.5">Forma</th>
                  <th className="px-4 py-3.5 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredInstallments.map((inst) => {
                  const isOverdue = checkIsOverdue(inst);
                  const daysOverdue = getDaysOverdue(inst);

                  const resolvedClientId =
                    inst.clientId ||
                    inst.client_id ||
                    clients.find(
                      (c) =>
                        c.name?.trim().toLowerCase() ===
                        (inst.clientName || inst.client_name || '').trim().toLowerCase()
                    )?.id;

                  const linkedContract = (contracts || []).find(
                    (c) =>
                      c.id === (inst.contractId || inst.contract_id) ||
                      (inst.clientName && c.clientName?.trim().toLowerCase() === inst.clientName?.trim().toLowerCase()) ||
                      (resolvedClientId && (c.clientId === resolvedClientId || c.client_id === resolvedClientId))
                  );
                  const resolvedContractId = inst.contractId || inst.contract_id || linkedContract?.id;

                  return (
                    <tr
                      key={inst.id}
                      className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors ${
                        isOverdue ? 'bg-rose-50/30 dark:bg-rose-950/10' : ''
                      }`}
                    >
                      <td
                        className={`px-4 py-3.5 font-bold text-slate-900 dark:text-white ${
                          resolvedContractId || resolvedClientId ? 'cursor-pointer hover:text-brand-600 dark:hover:text-brand-400 group' : ''
                        }`}
                        title={
                          resolvedContractId
                            ? 'Clique para abrir o Contrato firmado'
                            : resolvedClientId
                            ? 'Clique para ver o Cliente'
                            : ''
                        }
                        onClick={() => {
                          if (resolvedContractId && onSelectContract) {
                            onSelectContract(resolvedContractId);
                          } else if (resolvedClientId && onSelectClient) {
                            onSelectClient(resolvedClientId, 'contracts');
                          }
                        }}
                      >
                        <div className="flex flex-col">
                          <span className="inline-flex items-center gap-1.5 group-hover:underline">
                            {inst.clientName || inst.client_name || 'Cliente'}
                            {(resolvedContractId || resolvedClientId) && (
                              <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 text-brand-500 transition-opacity" />
                            )}
                          </span>

                          {/* Se tiver motivo de inadimplência cadastrado, exibe um mini badge */}
                          {isOverdue && (inst.overdueReason || inst.overdue_reason) && (
                            <span className="text-[10px] text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1 mt-0.5">
                              📌 {inst.overdueReason || inst.overdue_reason}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 font-semibold text-slate-600 dark:text-slate-300">
                        {inst.installmentNumber || inst.number || 1} / {inst.totalInstallments || inst.total_installments || 1}
                      </td>

                      <td className="px-4 py-3.5 font-extrabold text-slate-900 dark:text-white">
                        {formatCurrency(inst.amount || inst.value || 0)}
                      </td>

                      <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">
                        <div className="flex flex-col">
                          <span>{formatDate(inst.dueDate || inst.due_date)}</span>
                          {isOverdue && (
                            <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">
                              {daysOverdue} dia(s) de atraso
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        {inst.status === 'paid' ? (
                          <Badge variant="success">Liquidado</Badge>
                        ) : isOverdue ? (
                          <button
                            onClick={() => handleOpenOverdueDetail(inst)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 font-bold text-[11px] hover:bg-rose-200 dark:hover:bg-rose-900/60 transition-colors"
                            title="Clique para ver ou cadastrar motivo de inadimplência"
                          >
                            <AlertTriangle className="h-3 w-3 text-rose-500" />
                            Em Atraso
                          </button>
                        ) : (
                          <Badge variant="warning">Pendente</Badge>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-slate-500 font-mono text-[11px]">
                        {inst.status === 'paid'
                          ? formatDate(inst.paymentDate || inst.payment_date || inst.paidDate || inst.paid_date || new Date())
                          : '-'}
                      </td>

                      <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">
                        {inst.paymentMethod || inst.payment_method || 'PIX'}
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        {inst.status !== 'paid' ? (
                          <div className="flex items-center justify-end gap-1">
                            {/* Botão de Dar Baixa */}
                            <button
                              onClick={() => markInstallmentPaid(inst.id)}
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors cursor-pointer"
                              title="Dar Baixa"
                            >
                              <CheckCircle2 className="h-3 w-3" /> Baixa
                            </button>

                            {/* Botão de Cobrança / Motivo se estiver em atraso */}
                            {isOverdue && (
                              <>
                                <button
                                  onClick={() => handleOpenOverdueDetail(inst)}
                                  className="p-1 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                                  title="Registrar / Ver Motivo da Inadimplência"
                                >
                                  <AlertCircle className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleSendCollectionWhatsApp(inst)}
                                  className="p-1 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors"
                                  title="Cobrar via WhatsApp"
                                >
                                  <MessageSquare className="h-4 w-4" />
                                </button>
                              </>
                            )}

                            {/* Botão de Editar */}
                            <button
                              onClick={() => handleOpenEdit(inst)}
                              className="p-1 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-slate-800 transition-colors"
                              title="Editar Parcela"
                            >
                              <Edit className="h-4 w-4" />
                            </button>

                            {/* Botão de Excluir */}
                            <button
                              onClick={() => {
                                setInstallmentToDelete(inst);
                                setDeleteModalOpen(true);
                              }}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                              title="Excluir Parcela"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => unmarkInstallmentPaid(inst.id)}
                              className="p-1 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-800 transition-colors"
                              title="Estornar Baixa"
                            >
                              <Undo2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleOpenEdit(inst)}
                              className="p-1 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-slate-800 transition-colors"
                              title="Editar Recibo"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                setInstallmentToDelete(inst);
                                setDeleteModalOpen(true);
                              }}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                              title="Excluir Recibo"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                const pDate = formatDate(
                                  inst.paymentDate ||
                                  inst.payment_date ||
                                  inst.paidDate ||
                                  inst.paid_date ||
                                  new Date()
                                );
                                const pMethod = inst.paymentMethod || inst.payment_method || 'PIX';
                                alert(
                                  `Recibo de Pagamento:\n\nCliente: ${
                                    inst.clientName || inst.client_name
                                  }\nValor: ${formatCurrency(
                                    inst.amount || inst.value
                                  )}\nData: ${pDate}\nForma: ${pMethod}\n\nAutenticado pelo JurisFlow CRM`
                                );
                              }}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
                            >
                              <Receipt className="h-3 w-3" /> Recibo
                            </button>
                          </div>
                        )}
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
          <div className="w-full max-w-4xl rounded-3xl bg-white shadow-2xl dark:bg-navy-900 border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
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
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition-all shadow-sm"
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
                          <select
                            value={overdueForm.overdueReason}
                            onChange={(e) => setOverdueForm((prev) => ({ ...prev, overdueReason: e.target.value }))}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-navy-950 dark:text-white font-medium"
                          >
                            {DEFAULT_OVERDUE_REASONS.map((reason) => (
                              <option key={reason} value={reason}>
                                {reason}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Campo 2: Fase da Cobrança */}
                        <div>
                          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                            Fase / Etapa da Cobrança
                          </label>
                          <select
                            value={overdueForm.collectionStage}
                            onChange={(e) => setOverdueForm((prev) => ({ ...prev, collectionStage: e.target.value }))}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-navy-950 dark:text-white font-medium"
                          >
                            {COLLECTION_STAGES.map((st) => (
                              <option key={st.id} value={st.id}>
                                {st.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Campo 3: Data Prometida para Pagamento */}
                        <div>
                          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                            Data Prometida para Quitação / Reagendamento
                          </label>
                          <input
                            type="date"
                            value={overdueForm.promisedDate}
                            onChange={(e) => setOverdueForm((prev) => ({ ...prev, promisedDate: e.target.value }))}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-navy-950 dark:text-white"
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
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-navy-950 dark:text-white resize-none"
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
                            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition-all shadow-lg shadow-brand-500/20 active:scale-95"
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
          <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl dark:bg-navy-900 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 p-6 dark:border-slate-800 dark:bg-navy-950/50 shrink-0">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Edit className="h-5 w-5 text-brand-600 dark:text-brand-400" />
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
                <select
                  required
                  value={editForm.status}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, status: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-navy-950/50 dark:text-white"
                >
                  <option value="pending">Pendente</option>
                  <option value="paid">Liquidado (Pago)</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Forma de Pagamento
                </label>
                <select
                  required
                  value={editForm.paymentMethod}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, paymentMethod: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-navy-950/50 dark:text-white"
                >
                  <option value="PIX">PIX</option>
                  <option value="Boleto">Boleto</option>
                  <option value="Cartão de Crédito">Cartão de Crédito</option>
                  <option value="Transferência">Transferência Bancária</option>
                  <option value="Dinheiro">Dinheiro em Espécie</option>
                  <option value="Êxito / Quota Litis">Êxito / Quota Litis</option>
                  <option value="A combinar">A combinar</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Data de Vencimento
                </label>
                <input
                  type="date"
                  required
                  value={editForm.dueDate}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-navy-950/50 dark:text-white [&::-webkit-calendar-picker-indicator]:dark:invert"
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
                  className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-500/30 hover:bg-brand-700 active:scale-95 transition-all"
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
