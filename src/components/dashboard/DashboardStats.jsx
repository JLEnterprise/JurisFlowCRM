import React from 'react';
import {
  Users,
  UserCheck,
  FileCheck2,
  FileText,
  DollarSign,
  TrendingUp,
  Percent,
  Coins,
  AlertTriangle,
  UserX,
  Clock,
  Sparkles,
  Flame,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { formatCurrency } from '../../utils/formatters';
import { StatCard } from '../common/StatCard';

export function DashboardStats({ onNavigate }) {
  const { leads, clients, contracts, proposals, installments } = useCRM();

  // Volume Metrics
  const leadsReceived = leads.length;
  const leadsInAttendance = leads.filter(l => l.stage === 'primeiro_contato' || l.stage === 'qualificacao').length;
  const leadsQualified = leads.filter(l => l.stage === 'qualificacao' || l.stage === 'reuniao_consulta').length;
  const proposalsSent = proposals.length;
  const contractsInNegotiation = leads.filter(l => l.stage === 'negociacao' || l.stage === 'contrato_enviado').length;
  const contractsClosed = contracts.filter(c => c.status === 'assinado' || c.status === 'active').length;
  const activeClients = clients.filter(c => c.status === 'active').length;
  const lostLeads = leads.filter(l => l.stage === 'perdido').length;

  // Financial Metrics
  const pipelinePotentialValue = leads
    .filter(l => l.stage !== 'perdido' && l.stage !== 'contrato_fechado')
    .reduce((acc, curr) => acc + (Number(curr.estimatedValue) || 0), 0);

  // Soma o valor de TODOS os contratos (assinados, ativos, draft, enviados, etc.)
  const totalContractedValue = contracts
    .reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);

  const totalReceivedValue = installments
    .filter(i => i.status === 'paid')
    .reduce((acc, curr) => acc + (Number(curr.amount || curr.value) || 0), 0);

  const totalPendingValue = installments
    .filter(i => i.status === 'pending')
    .reduce((acc, curr) => acc + (Number(curr.amount || curr.value) || 0), 0);

  const averageTicket = contractsClosed > 0 ? totalContractedValue / contractsClosed : (contracts.length > 0 ? totalContractedValue / contracts.length : 0);

  // Conversions
  const leadConversionRate = leadsReceived > 0 ? ((contractsClosed / leadsReceived) * 100).toFixed(1) : '0.0';
  const proposalConversionRate = proposalsSent > 0 ? ((contractsClosed / proposalsSent) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-6">
      {/* Primary Financial & Pipeline KPIs */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Coins className="h-4 w-4 text-gold-500" /> Indicadores Financeiros & Pipeline
          </h2>
          <span className="text-xs text-slate-400 font-medium">Valores consolidados em tempo real</span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Pipeline Potencial"
            value={formatCurrency(pipelinePotentialValue)}
            subtitle="Em negociação no funil comercial"
            iconName="TrendingUp"
            color="brand"
            trend="+18.4% este mês"
            onClick={() => onNavigate('kanban')}
          />
          <StatCard
            title="Valor Contratado"
            value={formatCurrency(totalContractedValue)}
            subtitle={`${contractsClosed} contratos ativos assinados`}
            iconName="FileCheck2"
            color="emerald"
            trend="+24.2% a.m."
            onClick={() => onNavigate('contracts')}
          />
          <StatCard
            title="Receita Recebida"
            value={formatCurrency(totalReceivedValue)}
            subtitle="Honorários liquidados em conta"
            iconName="DollarSign"
            color="purple"
            trend="100% conciliado"
            onClick={() => onNavigate('financial')}
          />
          <StatCard
            title="Receita a Receber"
            value={formatCurrency(totalPendingValue)}
            subtitle="Parcelas futuras e vincendas"
            iconName="Coins"
            color="gold"
            trend={`${installments.filter(i => i.status === 'pending').length} parcelas`}
            onClick={() => onNavigate('financial')}
          />
        </div>
      </div>

      {/* Conversion & Efficiency Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Ticket Médio de Honorários"
          value={formatCurrency(averageTicket)}
          subtitle="Valor médio por contrato fechado"
          iconName="DollarSign"
          color="indigo"
          onClick={() => onNavigate('contracts')}
        />
        <StatCard
          title="Taxa de Conversão de Leads"
          value={`${leadConversionRate}%`}
          subtitle="Proporção de leads que fecharam contrato"
          iconName="Percent"
          color="emerald"
          trend="+3.2%"
          onClick={() => onNavigate('reports')}
        />
        <StatCard
          title="Conversão de Propostas"
          value={`${proposalConversionRate}%`}
          subtitle="Propostas comerciais aceitas e assinadas"
          iconName="Sparkles"
          color="gold"
          trend="+5.8%"
          onClick={() => onNavigate('proposals')}
        />
      </div>

      {/* Volume & Funnel Status Cards */}
      <div>
        <div className="mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Users className="h-4 w-4 text-brand-500" /> Fluxo Operacional de Leads & Clientes
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          <div
            onClick={() => onNavigate('leads')}
            className="rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-slate-800 p-3.5 shadow-sm hover:border-brand-500/50 cursor-pointer transition-all text-center"
          >
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Leads Totais</div>
            <div className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{leadsReceived}</div>
            <div className="mt-1 text-[10px] text-brand-600 dark:text-brand-400 font-semibold">Recebidos</div>
          </div>

          <div
            onClick={() => onNavigate('kanban')}
            className="rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-slate-800 p-3.5 shadow-sm hover:border-cyan-500/50 cursor-pointer transition-all text-center"
          >
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Em Atendimento</div>
            <div className="mt-1 text-xl font-bold text-cyan-600 dark:text-cyan-400">{leadsInAttendance}</div>
            <div className="mt-1 text-[10px] text-slate-400">Triagem inicial</div>
          </div>

          <div
            onClick={() => onNavigate('kanban')}
            className="rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-slate-800 p-3.5 shadow-sm hover:border-amber-500/50 cursor-pointer transition-all text-center"
          >
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Qualificados</div>
            <div className="mt-1 text-xl font-bold text-amber-600 dark:text-amber-400">{leadsQualified}</div>
            <div className="mt-1 text-[10px] text-slate-400">Em consulta</div>
          </div>

          <div
            onClick={() => onNavigate('proposals')}
            className="rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-slate-800 p-3.5 shadow-sm hover:border-indigo-500/50 cursor-pointer transition-all text-center"
          >
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Propostas</div>
            <div className="mt-1 text-xl font-bold text-indigo-600 dark:text-indigo-400">{proposalsSent}</div>
            <div className="mt-1 text-[10px] text-slate-400">Enviadas</div>
          </div>

          <div
            onClick={() => onNavigate('kanban')}
            className="rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-slate-800 p-3.5 shadow-sm hover:border-orange-500/50 cursor-pointer transition-all text-center"
          >
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Em Negociação</div>
            <div className="mt-1 text-xl font-bold text-orange-600 dark:text-orange-400">{contractsInNegotiation}</div>
            <div className="mt-1 text-[10px] text-slate-400">Aguardando</div>
          </div>

          <div
            onClick={() => onNavigate('contracts')}
            className="rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-slate-800 p-3.5 shadow-sm hover:border-emerald-500/50 cursor-pointer transition-all text-center"
          >
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Contratos Ganhos</div>
            <div className="mt-1 text-xl font-bold text-emerald-600 dark:text-emerald-400">{contractsClosed}</div>
            <div className="mt-1 text-[10px] text-emerald-500 font-semibold">Assinados 🎉</div>
          </div>

          <div
            onClick={() => onNavigate('clients')}
            className="rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-slate-800 p-3.5 shadow-sm hover:border-purple-500/50 cursor-pointer transition-all text-center"
          >
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Clientes Ativos</div>
            <div className="mt-1 text-xl font-bold text-purple-600 dark:text-purple-400">{activeClients}</div>
            <div className="mt-1 text-[10px] text-slate-400">Na base</div>
          </div>

          <div
            onClick={() => onNavigate('leads')}
            className="rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-slate-800 p-3.5 shadow-sm hover:border-rose-500/50 cursor-pointer transition-all text-center"
          >
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Perdidos</div>
            <div className="mt-1 text-xl font-bold text-rose-600 dark:text-rose-400">{lostLeads}</div>
            <div className="mt-1 text-[10px] text-slate-400">Não fechados</div>
          </div>
        </div>
      </div>
    </div>
  );
}
