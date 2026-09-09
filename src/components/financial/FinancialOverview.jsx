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
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { StatCard } from '../common/StatCard';
import { Badge } from '../common/Badge';
import { EmptyState } from '../common/EmptyState';
import { exportService } from '../../services/exportService';

export function FinancialOverview() {
  const { contracts, installments, markInstallmentPaid } = useCRM();
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const totalContracted = contracts.reduce((acc, c) => acc + (Number(c.value) || 0), 0);
  const totalReceived = installments.filter(i => i.status === 'paid').reduce((acc, i) => acc + (Number(i.amount || i.value) || 0), 0);
  const totalPending = installments.filter(i => i.status === 'pending').reduce((acc, i) => acc + (Number(i.amount || i.value) || 0), 0);
  const averageTicket = contracts.length > 0 ? totalContracted / contracts.length : 0;
  const overdueInstallments = installments.filter(i => i.status === 'pending' && i.dueDate && new Date(i.dueDate) < new Date());
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
                {filteredInstallments.map(inst => (
                  <tr key={inst.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">
                      {inst.clientName || inst.client_name || 'Cliente'}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-600 dark:text-slate-300">
                      {inst.installmentNumber || inst.number || 1} / {inst.totalInstallments || 1}
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
                    <td className="px-4 py-3.5 text-slate-500">
                      {formatDate(inst.paymentDate)}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">
                      {inst.paymentMethod || 'PIX'}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {inst.status !== 'paid' ? (
                        <button
                          onClick={() => markInstallmentPaid(inst.id)}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors"
                        >
                          <CheckCircle2 className="h-3 w-3" /> Dar Baixa
                        </button>
                      ) : (
                        <button
                          onClick={() => alert(`Recibo de Pagamento:\n\nCliente: ${inst.clientName}\nValor: ${formatCurrency(inst.amount)}\nData: ${formatDate(inst.paymentDate)}\nForma: ${inst.paymentMethod}\n\nAutenticado pelo JurisFlow CRM`)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                        >
                          <Receipt className="h-3 w-3" /> Recibo
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
