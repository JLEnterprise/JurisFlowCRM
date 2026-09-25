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
import { CometOrbit } from '../common/CometOrbit';

export function DashboardStats({ onNavigate }) {
  const { leads, clients, contracts, proposals, installments } = useCRM();

  const safeLeads = Array.isArray(leads) ? leads : [];
  const safeClients = Array.isArray(clients) ? clients : [];
  const safeContracts = Array.isArray(contracts) ? contracts : [];
  const safeProposals = Array.isArray(proposals) ? proposals : [];
  const safeInstallments = Array.isArray(installments) ? installments : [];

  // Volume Metrics
  const leadsReceived = safeLeads.length;
  const leadsInAttendance = safeLeads.filter(l => l && (l.stage === 'primeiro_contato' || l.stage === 'qualificacao')).length;
  const leadsQualified = safeLeads.filter(l => l && (l.stage === 'qualificacao' || l.stage === 'reuniao_consulta')).length;
  const proposalsSent = safeProposals.length;
  const contractsInNegotiation = safeLeads.filter(l => l && (l.stage === 'negociacao' || l.stage === 'contrato_enviado')).length;
  const contractsClosed = safeContracts.filter(c => c && (c.status === 'assinado' || c.status === 'active')).length;
  const activeClients = safeClients.filter(c => c && c.status === 'active').length;
  const lostLeads = safeLeads.filter(l => l && l.stage === 'perdido').length;

  // Financial Metrics
  const pipelinePotentialValue = safeLeads
    .filter(l => l && l.stage !== 'perdido' && l.stage !== 'contrato_fechado')
    .reduce((acc, curr) => acc + (Number(curr?.estimatedValue) || 0), 0);

  // Soma o valor de TODOS os contratos ativos
  const totalContractedValue = safeContracts
    .filter(c => c && c.status !== 'cancelado' && c.status !== 'rescindido')
    .reduce((acc, curr) => acc + (typeof curr?.value === 'number' ? curr.value : (Number(curr?.value) || 0)), 0);

  const totalReceivedValue = safeInstallments
    .filter(i => i && i.status === 'paid')
    .reduce((acc, curr) => acc + (Number(curr?.amount || curr?.value) || 0), 0);

  const pendingInstallmentsSum = safeInstallments
    .filter(i => i && i.status === 'pending')
    .reduce((acc, curr) => acc + (Number(curr?.amount || curr?.value) || 0), 0);

  const totalPendingValue = pendingInstallmentsSum > 0 ? pendingInstallmentsSum : Math.max(0, totalContractedValue - totalReceivedValue);

  const averageTicket = contractsClosed > 0 ? totalContractedValue / contractsClosed : (safeContracts.length > 0 ? totalContractedValue / safeContracts.length : 0);

  // Conversions
  // Conversões sempre entre 0% e 100%: leads ganhos / leads; propostas aceitas / propostas
  const wonLeads = safeLeads.filter(l => l && l.stage === 'contrato_fechado').length;
  const acceptedProposals = safeProposals.filter(p => p && ['aceita', 'aprovada', 'accepted', 'convertida'].includes(String(p.status || '').toLowerCase())).length;
  const leadConversionRate = leadsReceived > 0 ? ((wonLeads / leadsReceived) * 100).toFixed(1) : '0.0';
  const proposalConversionRate = proposalsSent > 0 ? ((acceptedProposals / proposalsSent) * 100).toFixed(1) : '0.0';

  const pendingCount = safeInstallments.filter(i => i && i.status === 'pending').length;

  // Fluxo operacional: número em branco/grafite; verde e vermelho só para ganho e perda (status)
  const flow = [
    { label: 'Leads totais', value: leadsReceived, hint: 'Recebidos', tab: 'kanban' },
    { label: 'Em atendimento', value: leadsInAttendance, hint: 'Triagem inicial', tab: 'kanban' },
    { label: 'Qualificados', value: leadsQualified, hint: 'Em consulta', tab: 'kanban' },
    { label: 'Propostas', value: proposalsSent, hint: 'Enviadas', tab: 'proposals' },
    { label: 'Em negociação', value: contractsInNegotiation, hint: 'Aguardando', tab: 'kanban' },
    { label: 'Contratos ganhos', value: contractsClosed, hint: 'Assinados', tab: 'contracts', tone: 'good' },
    { label: 'Clientes ativos', value: activeClients, hint: 'Na base', tab: 'clients' },
    { label: 'Perdidos', value: lostLeads, hint: 'Não fechados', tab: 'kanban', tone: 'bad' },
  ];

  const SectionTitle = ({ icon: Icon, children, aside }) => (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
        <Icon className="h-3.5 w-3.5 text-gold-500" /> {children}
      </h2>
      {aside && <span className="text-[11px] text-slate-400">{aside}</span>}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Indicadores financeiros e de pipeline */}
      <div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Pipeline potencial"
            value={formatCurrency(pipelinePotentialValue)}
            subtitle="Em negociação no funil comercial"
            iconName="TrendingUp"
            onClick={() => onNavigate('kanban')}
          />
          <StatCard
            title="Valor contratado"
            value={formatCurrency(totalContractedValue)}
            subtitle={`${contractsClosed} contratos ativos assinados`}
            iconName="FileCheck2"
            onClick={() => onNavigate('contracts')}
          />
          <StatCard
            title="Receita recebida"
            value={formatCurrency(totalReceivedValue)}
            subtitle="Honorários liquidados em conta"
            iconName="DollarSign"
            onClick={() => onNavigate('financial')}
          />
          <StatCard
            title="Receita a receber"
            value={formatCurrency(totalPendingValue)}
            subtitle={`${pendingCount} ${pendingCount === 1 ? 'parcela' : 'parcelas'} a vencer`}
            iconName="Coins"
            onClick={() => onNavigate('financial')}
          />
        </div>
      </div>

      {/* Conversão e eficiência */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Ticket médio de honorários"
          value={formatCurrency(averageTicket)}
          subtitle="Valor médio por contrato fechado"
          iconName="Scale"
          onClick={() => onNavigate('contracts')}
        />
        <StatCard
          title="Conversão de leads"
          value={`${leadConversionRate}%`}
          subtitle="Leads que viraram contrato"
          iconName="Percent"
          onClick={() => onNavigate('reports')}
        />
        <StatCard
          title="Conversão de propostas"
          value={`${proposalConversionRate}%`}
          subtitle="Propostas aceitas e assinadas"
          iconName="Sparkles"
          onClick={() => onNavigate('proposals')}
        />
      </div>

      {/* Fluxo operacional de leads e clientes */}
      <div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {flow.map(item => (
            <button
              key={item.label}
              type="button"
              onClick={() => onNavigate(item.tab)}
              className="dash-panel has-orbit !p-3.5 text-center transition-all hover:-translate-y-0.5 focus:outline-none"
            >
              <CometOrbit className="card-orbit" />
              <div className="text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{item.label}</div>
              <div className={`font-numeric mt-1.5 text-2xl font-semibold ${
                item.tone === 'good' ? 'text-emerald-600 dark:text-emerald-400'
                  : item.tone === 'bad' ? 'text-rose-600 dark:text-rose-400'
                  : 'text-slate-900 dark:text-white'
              }`}>
                {item.value}
              </div>
              <div className="mt-1 text-[10px] text-gold-700/80 dark:text-gold-300/60">{item.hint}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
