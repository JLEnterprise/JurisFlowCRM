import React, { useState } from 'react';
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
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { StatCard } from '../common/StatCard';
import { Badge } from '../common/Badge';
import { EmptyState } from '../common/EmptyState';
import { exportService } from '../../services/exportService';
import { ConfirmModal } from '../common/ConfirmModal';

export function FinancialOverview({ onOpenWhatsApp, onSelectClient, onSelectContract }) {
  const { clients = [], contracts = [], installments = [], markInstallmentPaid, unmarkInstallmentPaid, deleteInstallment, updateInstallment } = useCRM();
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [installmentToDelete, setInstallmentToDelete] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [installmentToEdit, setInstallmentToEdit] = useState(null);

  // Edit form state
  const [editForm, setEditForm] = useState({
    status: '',
    paymentMethod: '',
    dueDate: '',
  });

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

  const contractsTotal = (contracts || [])
    .filter(c => c.status !== 'cancelado' && c.status !== 'rescindido')
    .reduce((acc, c) => acc + (Number(c.value) || 0), 0);

  const totalReceived = (installments || [])
    .filter(i => i.status === 'paid')
    .reduce((acc, i) => acc + (Number(i.amount || i.value) || 0), 0);

  const pendingInstallmentsSum = (installments || [])
    .filter(i => i.status === 'pending')
    .reduce((acc, i) => acc + (Number(i.amount || i.value) || 0), 0);

  // A Receita Contratada reflete os contratos ativos ou a soma total de parcelas
  const totalContracted = Math.max(contractsTotal, totalReceived + pendingInstallmentsSum);
  const totalPending = pendingInstallmentsSum > 0 ? pendingInstallmentsSum : Math.max(0, totalContracted - totalReceived);
  const activeContractsCount = (contracts || []).filter(c => c.status !== 'cancelado' && c.status !== 'rescindido').length;
  const averageTicket = activeContractsCount > 0 ? totalContracted / activeContractsCount : (totalContracted > 0 ? totalContracted : 0);
  const overdueInstallments = installments.filter(i => i.status === 'pending' && (i.dueDate || i.due_date) && new Date(i.dueDate || i.due_date) < new Date());
  const defaultRate = totalContracted > 0 ? ((overdueInstallments.reduce((a, b) => a + (Number(b.amount || b.value) || 0), 0) / totalContracted) * 100).toFixed(1) : '0.0';

  const filteredInstallments = installments.filter(i => {
    const clientName = String(i.clientName || i.client_name || '').toLowerCase();
    const matchesSearch = !search || clientName.includes(search.toLowerCase());
    const matchesStatus = !selectedStatus || i.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const handleExportCSV = () => {
    const headers = [
      { key: 'clientName', label: 'Cliente' },
      { key: 'number', label: 'Parcela', formatter: (val, row) => `${val}/${row.totalInstallments}` },
      { key: 'amount', label: 'Valor (R$)', formatter: (val) => val },
      { key: 'dueDate', label: 'Vencimento' },
      { key: 'paymentDate', label: 'Data Pagamento' },
      { key: 'status', label: 'Status' },
      { key: 'paymentMethod', label: 'Forma' },
    ];
    exportService.exportToCSV('Relatorio_Financeiro_Parcelas', filteredInstallments, headers);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Receita Contratada"
          value={formatCurrency(totalContracted)}
          subtitle="Total em contratos ativos"
          iconName="FileText"
          color="brand"
        />
        <StatCard
          title="Receita Recebida"
          value={formatCurrency(totalReceived)}
          subtitle="Honorários já liquidados"
          iconName="DollarSign"
          color="emerald"
        />
        <StatCard
          title="Receita a Receber"
          value={formatCurrency(totalPending)}
          subtitle="Parcelas futuras e em aberto"
          iconName="Coins"
          color="gold"
        />
        <StatCard
          title="Ticket Médio"
          value={formatCurrency(averageTicket)}
          subtitle="Média por contrato"
          iconName="TrendingUp"
          color="indigo"
        />
        <StatCard
          title="Inadimplência"
          value={`${defaultRate}%`}
          subtitle={`${overdueInstallments.length} parcela(s) em atraso`}
          iconName="AlertTriangle"
          color={overdueInstallments.length > 0 ? 'rose' : 'emerald'}
        />
      </div>

      {/* Installments Management Section */}
      <div className="rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              Gestão de Contas a Receber & Parcelas
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Controle detalhado de vencimentos, baixas manuais e métodos de recebimento
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
            >
              <Download className="h-3.5 w-3.5" /> Exportar Planilha
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por cliente..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-navy-950 pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none"
            />
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-navy-950 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="">Todos os Status</option>
            <option value="paid">Pagas</option>
            <option value="pending">Pendentes</option>
          </select>
        </div>

        {/* Table */}
        {filteredInstallments.length === 0 ? (
          <EmptyState
            title="Nenhuma parcela encontrada"
            description="Não há registros financeiros correspondentes aos filtros."
            iconName="Coins"
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
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Data do Pagamento</th>
                  <th className="px-4 py-3.5">Forma</th>
                  <th className="px-4 py-3.5 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredInstallments.map(inst => {
                  const resolvedClientId = inst.clientId || inst.client_id || (clients.find(c => c.name?.trim().toLowerCase() === (inst.clientName || inst.client_name || '').trim().toLowerCase())?.id);
                  const linkedContract = (contracts || []).find(c =>
                    c.id === (inst.contractId || inst.contract_id) ||
                    (inst.clientName && c.clientName?.trim().toLowerCase() === inst.clientName?.trim().toLowerCase()) ||
                    (resolvedClientId && (c.clientId === resolvedClientId || c.client_id === resolvedClientId))
                  );
                  const resolvedContractId = inst.contractId || inst.contract_id || linkedContract?.id;

                  return (
                  <tr key={inst.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td 
                      className={`px-4 py-3.5 font-bold text-slate-900 dark:text-white ${(resolvedContractId || resolvedClientId) ? 'cursor-pointer hover:text-brand-600 dark:hover:text-brand-400 group' : ''}`}
                      title={resolvedContractId ? 'Clique para abrir o Contrato firmado' : (resolvedClientId ? 'Clique para ver o Cliente' : '')}
                      onClick={() => {
                        if (resolvedContractId && onSelectContract) {
                          onSelectContract(resolvedContractId);
                        } else if (resolvedClientId && onSelectClient) {
                          onSelectClient(resolvedClientId, 'contracts');
                        }
                      }}
                    >
                      <span className="inline-flex items-center gap-1.5 group-hover:underline">
                        {inst.clientName || inst.client_name || 'Cliente'}
                        {(resolvedContractId || resolvedClientId) && (
                          <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 text-brand-500 transition-opacity" />
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-600 dark:text-slate-300">
                      {inst.installmentNumber || inst.number || 1} / {inst.totalInstallments || inst.total_installments || 1}
                    </td>
                    <td className="px-4 py-3.5 font-extrabold text-slate-900 dark:text-white">
                      {formatCurrency(inst.amount || inst.value || 0)}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">
                      {formatDate(inst.dueDate || inst.due_date)}
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant={inst.status === 'paid' ? 'success' : 'warning'}>
                        {inst.status === 'paid' ? 'Liquidado' : 'Pendente'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 font-mono text-[11px]">
                      {inst.status === 'paid' ? formatDate(inst.paymentDate || inst.payment_date || inst.paidDate || inst.paid_date || new Date()) : '-'}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">
                      {inst.paymentMethod || inst.payment_method || 'PIX'}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {inst.status !== 'paid' ? (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => markInstallmentPaid(inst.id)}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors cursor-pointer"
                            title="Dar Baixa"
                          >
                            <CheckCircle2 className="h-3 w-3" /> Baixa
                          </button>
                          <button
                            onClick={() => handleOpenEdit(inst)}
                            className="p-1 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-slate-800 transition-colors"
                            title="Editar Parcela"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
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
                              const pDate = formatDate(inst.paymentDate || inst.payment_date || inst.paidDate || inst.paid_date || new Date());
                              const pMethod = inst.paymentMethod || inst.payment_method || 'PIX';
                              alert(`Recibo de Pagamento:\n\nCliente: ${inst.clientName || inst.client_name}\nValor: ${formatCurrency(inst.amount || inst.value)}\nData: ${pDate}\nForma: ${pMethod}\n\nAutenticado pelo JurisFlow CRM`);
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
        message={`Deseja realmente excluir a parcela de ${formatCurrency(installmentToDelete?.amount || installmentToDelete?.value || 0)} do cliente ${installmentToDelete?.clientName || installmentToDelete?.client_name}? Esta ação não pode ser desfeita.`}
        confirmLabel="Sim, Excluir"
      />

      {/* Edit Installment Modal */}
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
                  onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
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
                  onChange={(e) => setEditForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
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
                  onChange={(e) => setEditForm(prev => ({ ...prev, dueDate: e.target.value }))}
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
