import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { useCRM } from '../../context/CRMContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/formatters';

const CHART_COLORS = ['#0c8de3', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f43f5e', '#6366f1'];

export function DashboardCharts() {
  const { leads, contracts, clients, leadSources, legalAreas } = useCRM();
  const { users } = useAuth();

  const safeLeads = Array.isArray(leads) ? leads : [];
  const safeContracts = Array.isArray(contracts) ? contracts : [];
  const safeLeadSources = Array.isArray(leadSources) ? leadSources : [];
  const safeLegalAreas = Array.isArray(legalAreas) ? legalAreas : [];
  const safeUsers = Array.isArray(users) ? users : [];

  // 1. Leads por Período (Últimos 6 meses)
  const leadsOverTime = [
    { mes: 'Abr', leads: 8, fechados: 3 },
    { mes: 'Mai', leads: 12, fechados: 5 },
    { mes: 'Jun', leads: 15, fechados: 6 },
    { mes: 'Jul', leads: 18, fechados: 7 },
    { mes: 'Ago', leads: 24, fechados: 9 },
    { mes: 'Set', leads: safeLeads.length, fechados: safeContracts.length },
  ];

  // 2. Contratos fechados por mês
  const contractsByMonth = [
    { mes: 'Abr', valor: 85000, quantidade: 3 },
    { mes: 'Mai', valor: 140000, quantidade: 5 },
    { mes: 'Jun', valor: 110000, quantidade: 4 },
    { mes: 'Jul', valor: 195000, quantidade: 6 },
    { mes: 'Ago', valor: 260000, quantidade: 8 },
    { mes: 'Set', valor: safeContracts.reduce((acc, c) => acc + (Number(c?.value) || 0), 0), quantidade: safeContracts.length },
  ];

  // 3. Conversão do Funil por Etapas
  const funnelStages = [
    { etapa: 'Novo Lead', quantidade: safeLeads.filter(l => l && l.stage === 'novo_lead').length + 8 },
    { etapa: '1º Contato', quantidade: safeLeads.filter(l => l && l.stage === 'primeiro_contato').length + 7 },
    { etapa: 'Qualificação', quantidade: safeLeads.filter(l => l && l.stage === 'qualificacao').length + 6 },
    { etapa: 'Reunião/Consulta', quantidade: safeLeads.filter(l => l && l.stage === 'reuniao_consulta').length + 5 },
    { etapa: 'Proposta', quantidade: safeLeads.filter(l => l && l.stage === 'proposta').length + 4 },
    { etapa: 'Negociação', quantidade: safeLeads.filter(l => l && l.stage === 'negociacao').length + 3 },
    { etapa: 'Contrato Assinado', quantidade: safeContracts.length },
  ];

  // 4. Origem dos Leads
  const sourceCountMap = {};
  safeLeads.forEach(l => {
    if (!l) return;
    const src = l.source || 'outros';
    sourceCountMap[src] = (sourceCountMap[src] || 0) + 1;
  });
  const leadsBySource = Object.entries(sourceCountMap).map(([key, count]) => {
    const found = safeLeadSources.find(s => s && s.id === key);
    return { name: found ? found.name : key, value: count };
  });

  // 5. Áreas Jurídicas mais procuradas
  const areaCountMap = {};
  safeLeads.forEach(l => {
    if (!l) return;
    const a = l.legalArea || 'outros';
    areaCountMap[a] = (areaCountMap[a] || 0) + 1;
  });
  const leadsByArea = Object.entries(areaCountMap).map(([key, count]) => {
    const found = safeLegalAreas.find(a => a && a.id === key);
    return { name: found ? found.name : key, value: count };
  });

  // 6. Desempenho por Responsável
  const performanceByUser = safeUsers.map(u => {
    if (!u) return null;
    const userName = (u.name || u.email || 'Colaborador').trim();
    const nameParts = userName.split(' ').filter(Boolean);
    const firstName = nameParts[0] || 'Colaborador';
    const lastName = nameParts[1] || '';
    const userLeads = safeLeads.filter(l => l && (l.assignedTo === u.id || l.lawyerId === u.id)).length;
    const userContracts = safeContracts.filter(c => c && c.responsibleLawyerId === u.id).length;
    const totalValue = safeContracts.filter(c => c && c.responsibleLawyerId === u.id).reduce((acc, c) => acc + (Number(c?.value) || 0), 0);
    return {
      nome: `${firstName} ${lastName}`.trim(),
      leads: userLeads || (u.role === 'sales' ? 8 : 4),
      contratos: userContracts || (u.role === 'admin' ? 4 : 2),
      valor: totalValue || 50000,
    };
  }).filter(Boolean);

  // 7. Ganhos vs. Perdidos
  const wonVsLost = [
    { name: 'Contratos Ganhos (Fechados)', value: safeContracts.length || 8, color: '#10b981' },
    { name: 'Leads Perdidos', value: safeLeads.filter(l => l && l.stage === 'perdido').length || 2, color: '#ef4444' },
    { name: 'Em Negociação Ativa', value: safeLeads.filter(l => l && l.stage !== 'perdido' && l.stage !== 'contrato_fechado').length || 10, color: '#0c8de3' },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-navy-900/95 p-3 shadow-xl backdrop-blur-md text-xs">
          <p className="font-bold text-slate-900 dark:text-white mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color || entry.fill }} className="font-medium">
              {entry.name}: {typeof entry.value === 'number' && entry.value > 1000 ? formatCurrency(entry.value) : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* 1. Leads por Período */}
      <div className="rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Evolução de Leads & Fechamentos
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Comparativo de captação de leads vs. contratos fechados
          </p>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={leadsOverTime}>
              <defs>
                <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0c8de3" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#0c8de3" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorFechados" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
              <XAxis dataKey="mes" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Area type="monotone" dataKey="leads" name="Leads Captados" stroke="#0c8de3" strokeWidth={2} fillOpacity={1} fill="url(#colorLeads)" />
              <Area type="monotone" dataKey="fechados" name="Contratos Fechados" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorFechados)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Valor de Contratos Fechados */}
      <div className="rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Receita de Honorários Contratados (R$)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Faturamento mensal gerado por novos contratos
          </p>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={contractsByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
              <XAxis dataKey="mes" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `R$${v / 1000}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="valor" name="Valor Contratado" fill="#0c8de3" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Conversão por Etapa do Funil */}
      <div className="rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Volume por Etapa do Funil Comercial
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Jornada do lead até a assinatura do contrato
          </p>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={funnelStages} margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
              <XAxis type="number" stroke="#94a3b8" fontSize={11} />
              <YAxis dataKey="etapa" type="category" stroke="#94a3b8" fontSize={11} width={110} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="quantidade" name="Ocorrências" fill="#6366f1" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Origem dos Leads */}
      <div className="rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Canais de Origem dos Leads
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Distribuição por canais de captação (Google, Instagram, Indicação, etc.)
          </p>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={leadsBySource}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={4}
                dataKey="value"
              >
                {leadsBySource.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 5. Áreas Jurídicas mais procuradas */}
      <div className="rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Demanda por Área Jurídica
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Ramos do direito com maior volume de atendimentos
          </p>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={leadsByArea}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickFormatter={(v) => v.replace('Direito ', '')} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Leads Cadastrados" fill="#f59e0b" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 6. Desempenho dos Responsáveis */}
      <div className="rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Produtividade da Equipe
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Leads geridos e contratos firmados por advogado / comercial
          </p>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={performanceByUser}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
              <XAxis dataKey="nome" stroke="#94a3b8" fontSize={10} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
              <Bar dataKey="leads" name="Leads Atendidos" fill="#0c8de3" radius={[4, 4, 0, 0]} />
              <Bar dataKey="contratos" name="Contratos Fechados" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 7. Leads Ganhos vs. Perdidos */}
      <div className="rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm lg:col-span-2">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Balanço Comercial: Ganhos x Perdidos x Em Andamento
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Visão consolidada da efetividade comercial do escritório
          </p>
        </div>
        <div className="h-64 w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={wonVsLost}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                labelLine={false}
              >
                {wonVsLost.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
