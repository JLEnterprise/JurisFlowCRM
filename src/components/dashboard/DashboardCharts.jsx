import React, { useMemo } from 'react';
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
} from 'recharts';
import { useCRM } from '../../context/CRMContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/formatters';
import { KANBAN_STAGES } from '../../data/legalAreas';

// Paleta da marca, validada (tema escuro, superfície #0b1220): contraste, daltonismo e
// separação entre vizinhas. Ordem fixa — a cor segue a categoria, nunca a posição no ranking.
const PALETTE = ['#b8893a', '#3f7fc4', '#d0703a', '#2f9b74', '#8a6ad0'];
const OTHER_COLOR = '#64748b';
const GOLD_TOP = '#d9b76e';
const GOLD_BOTTOM = '#8f6a2b';
const STATUS = { good: '#2f9b74', critical: '#d9534f', neutral: '#b8893a' };

const AXIS = { fill: '#7b8798', fontSize: 11 };
const GRID = 'rgba(148, 163, 184, 0.12)';
const BAR_CURSOR = { fill: 'rgba(197, 160, 89, 0.08)' };           // substitui o quadrado branco padrão
const LINE_CURSOR = { stroke: 'rgba(197, 160, 89, 0.45)', strokeWidth: 1 };

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

// Canais de exemplo (só aparecem, com selo "Exemplo", enquanto houver poucos canais reais)
const EXAMPLE_CHANNELS = [
  { name: 'Instagram', value: 34 },
  { name: 'Google Ads', value: 27 },
  { name: 'Indicação de cliente', value: 19 },
  { name: 'Site do escritório', value: 11 },
  { name: 'Facebook', value: 6 },
  { name: 'YouTube', value: 3 },
];

const monthKey = (value) => {
  if (!value) return null;
  const m = String(value).match(/^(\d{4})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}`;
  const d = new Date(value);
  return isNaN(d) ? null : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

function lastMonths(n) {
  const now = new Date();
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (n - 1 - i), 1);
    return { key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: MONTHS[d.getMonth()] };
  });
}

// Agrupa em até 5 categorias + "Outros" (nunca inventa uma 6ª cor)
function topWithOther(entries) {
  const sorted = [...entries].sort((a, b) => b.value - a.value);
  if (sorted.length <= PALETTE.length) return sorted;
  const top = sorted.slice(0, PALETTE.length);
  const rest = sorted.slice(PALETTE.length).reduce((acc, e) => acc + e.value, 0);
  return [...top, { name: 'Outros', value: rest, isOther: true }];
}

export function DashboardCharts() {
  const { leads, contracts, leadSources, legalAreas } = useCRM();
  const { users } = useAuth();

  const safeLeads = Array.isArray(leads) ? leads.filter(Boolean) : [];
  const safeContracts = Array.isArray(contracts) ? contracts.filter(Boolean) : [];
  const safeUsers = Array.isArray(users) ? users.filter(Boolean) : [];

  const data = useMemo(() => {
    const months = lastMonths(6);
    const contractDate = (c) => c.signedAt || c.startDate || c.createdAt || c.created_at;

    const overTime = months.map(m => ({
      mes: m.label,
      leads: safeLeads.filter(l => monthKey(l.createdAt || l.created_at) === m.key).length,
      fechados: safeContracts.filter(c => monthKey(contractDate(c)) === m.key).length,
    }));

    const revenue = months.map(m => ({
      mes: m.label,
      valor: safeContracts
        .filter(c => monthKey(contractDate(c)) === m.key)
        .reduce((acc, c) => acc + (Number(c.value) || 0), 0),
    }));

    const funnel = KANBAN_STAGES
      .filter(s => s.id !== 'perdido')
      .map(s => ({ etapa: s.name, quantidade: safeLeads.filter(l => l.stage === s.id).length }));

    // Canal: UTM do link/anúncio > "como conheceu" (cadastro manual) > origem antiga
    const channelCount = {};
    safeLeads.forEach(l => {
      const legacy = (leadSources || []).find(s => s && s.id === l.source)?.name;
      const name = l.utmSource || l.utm_source || l.howFound
        || (l.source && l.source !== 'manual' ? (legacy || l.source) : 'Cadastro manual');
      channelCount[name] = (channelCount[name] || 0) + 1;
    });
    const realChannels = Object.entries(channelCount).map(([name, value]) => ({ name, value }));
    const channelsAreExample = realChannels.length < 3;
    const channels = topWithOther(channelsAreExample ? EXAMPLE_CHANNELS : realChannels);

    const areaCount = {};
    safeLeads.forEach(l => {
      const found = (legalAreas || []).find(a => a && a.id === l.legalArea);
      const name = (found?.name || l.legalArea || 'Outras').replace('Direito ', '');
      areaCount[name] = (areaCount[name] || 0) + 1;
    });
    const areas = Object.entries(areaCount).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

    const team = safeUsers.map(u => {
      const parts = String(u.name || u.email || 'Colaborador').trim().split(/\s+/);
      return {
        nome: parts.slice(0, 2).join(' '),
        leads: safeLeads.filter(l => l.assignedTo === u.id || l.lawyerId === u.id).length,
        contratos: safeContracts.filter(c => c.responsibleLawyerId === u.id).length,
      };
    });

    const won = safeLeads.filter(l => l.stage === 'contrato_fechado').length;
    const lost = safeLeads.filter(l => l.stage === 'perdido').length;
    const open = safeLeads.length - won - lost;
    const balance = [
      { name: 'Ganhos', value: won, color: STATUS.good },
      { name: 'Em andamento', value: open, color: STATUS.neutral },
      { name: 'Perdidos', value: lost, color: STATUS.critical },
    ];

    return { overTime, revenue, funnel, channels, channelsAreExample, areas, team, balance };
  }, [safeLeads, safeContracts, safeUsers, leadSources, legalAreas]);

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <Panel title="Evolução de leads & fechamentos" subtitle="Leads captados e contratos fechados nos últimos 6 meses"
        legend={[{ label: 'Leads captados', color: PALETTE[0] }, { label: 'Contratos fechados', color: PALETTE[3] }]}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data.overTime} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="dashLeads" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={PALETTE[0]} stopOpacity={0.35} />
                <stop offset="100%" stopColor={PALETTE[0]} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="dashClosed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={PALETTE[3]} stopOpacity={0.3} />
                <stop offset="100%" stopColor={PALETTE[3]} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke={GRID} />
            <XAxis dataKey="mes" tick={AXIS} axisLine={false} tickLine={false} />
            <YAxis tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip cursor={LINE_CURSOR} content={<ChartTooltip />} />
            <Area type="monotone" dataKey="leads" name="Leads captados" stroke={PALETTE[0]} strokeWidth={2} fill="url(#dashLeads)" dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: '#0b1220' }} />
            <Area type="monotone" dataKey="fechados" name="Contratos fechados" stroke={PALETTE[3]} strokeWidth={2} fill="url(#dashClosed)" dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: '#0b1220' }} />
          </AreaChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title="Receita de honorários contratados" subtitle="Valor dos contratos fechados por mês">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.revenue} margin={{ top: 8, right: 8, left: -6, bottom: 0 }}>
            {goldDefs('dashRevenue')}
            <CartesianGrid vertical={false} stroke={GRID} />
            <XAxis dataKey="mes" tick={AXIS} axisLine={false} tickLine={false} />
            <YAxis tick={AXIS} axisLine={false} tickLine={false} tickFormatter={(v) => (v >= 1000 ? `R$${Math.round(v / 1000)}k` : `R$${v}`)} />
            <Tooltip cursor={BAR_CURSOR} content={<ChartTooltip currency />} />
            <Bar dataKey="valor" name="Valor contratado" fill="url(#dashRevenue)" radius={[4, 4, 0, 0]} maxBarSize={44} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title="Volume por etapa do funil" subtitle="Leads em cada etapa, até o contrato fechado">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart layout="vertical" data={data.funnel} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            {goldDefs('dashFunnel', true)}
            <CartesianGrid horizontal={false} stroke={GRID} />
            <XAxis type="number" tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} />
            <YAxis dataKey="etapa" type="category" tick={AXIS} axisLine={false} tickLine={false} width={118} />
            <Tooltip cursor={BAR_CURSOR} content={<ChartTooltip />} />
            <Bar dataKey="quantidade" name="Leads" fill="url(#dashFunnel)" radius={[0, 4, 4, 0]} maxBarSize={18} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title="Canais de origem dos leads" subtitle="De onde vêm os leads: links, anúncios e cadastros manuais"
        badge={data.channelsAreExample ? 'Exemplo' : null}>
        <DonutWithList data={data.channels} centerLabel="leads" />
      </Panel>

      <Panel title="Demanda por área jurídica" subtitle="Áreas com mais leads">
        {data.areas.length === 0 ? <EmptyChart /> : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.areas} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              {goldDefs('dashAreas')}
              <CartesianGrid vertical={false} stroke={GRID} />
              <XAxis dataKey="name" tick={AXIS} axisLine={false} tickLine={false} interval={0} />
              <YAxis tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip cursor={BAR_CURSOR} content={<ChartTooltip />} />
              <Bar dataKey="value" name="Leads" fill="url(#dashAreas)" radius={[4, 4, 0, 0]} maxBarSize={44} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Panel>

      <Panel title="Produtividade da equipe" subtitle="Leads atendidos e contratos fechados por pessoa"
        legend={[{ label: 'Leads atendidos', color: PALETTE[0] }, { label: 'Contratos fechados', color: PALETTE[3] }]}>
        {data.team.length === 0 ? <EmptyChart /> : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.team} margin={{ top: 8, right: 8, left: -18, bottom: 0 }} barGap={2}>
              <CartesianGrid vertical={false} stroke={GRID} />
              <XAxis dataKey="nome" tick={AXIS} axisLine={false} tickLine={false} interval={0} />
              <YAxis tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip cursor={BAR_CURSOR} content={<ChartTooltip />} />
              <Bar dataKey="leads" name="Leads atendidos" fill={PALETTE[0]} radius={[4, 4, 0, 0]} maxBarSize={28} />
              <Bar dataKey="contratos" name="Contratos fechados" fill={PALETTE[3]} radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Panel>

      <Panel title="Balanço comercial" subtitle="Leads ganhos, em andamento e perdidos" className="lg:col-span-2" height="h-56">
        <DonutWithList data={data.balance} centerLabel="leads" useOwnColors />
      </Panel>
    </div>
  );
}

/* ============================== Peças ============================== */

function Panel({ title, subtitle, legend, badge, className = '', height = 'h-64', children }) {
  return (
    <section className={`dash-panel ${className}`}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 font-display text-lg font-semibold leading-tight text-slate-900 dark:text-white">
            {title}
            {badge && (
              <span className="rounded-full border border-gold-500/40 px-2 py-0.5 font-sans text-[10px] font-semibold uppercase tracking-wider text-gold-700 dark:text-gold-300">
                {badge}
              </span>
            )}
          </h3>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
        </div>
        {legend && (
          <div className="flex flex-wrap items-center gap-3">
            {legend.map(item => (
              <span key={item.label} className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                {item.label}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className={`${height} w-full`}>{children}</div>
    </section>
  );
}

// Função (e não componente): o Recharts só desenha filhos que ele conhece, como <defs>
function goldDefs(id, horizontal = false) {
  return (
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2={horizontal ? '1' : '0'} y2={horizontal ? '0' : '1'}>
        <stop offset="0%" stopColor={horizontal ? GOLD_BOTTOM : GOLD_TOP} />
        <stop offset="100%" stopColor={horizontal ? GOLD_TOP : GOLD_BOTTOM} />
      </linearGradient>
    </defs>
  );
}

function ChartTooltip({ active, payload, label, currency = false }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-xl border border-gold-500/25 bg-white/95 px-3 py-2 text-xs shadow-xl backdrop-blur dark:bg-[#0b1220]/95">
      {label !== undefined && <p className="mb-1 font-semibold text-slate-900 dark:text-white">{label}</p>}
      {payload.map((entry, i) => {
        const swatch = entry.payload?.fill && !String(entry.payload.fill).startsWith('url') ? entry.payload.fill
          : String(entry.color || '').startsWith('url') ? GOLD_TOP : entry.color;
        return (
          <p key={i} className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: swatch }} />
            {entry.name}: <span className="font-semibold text-slate-900 dark:text-white tabular-nums">
              {currency ? formatCurrency(entry.value) : entry.value}
            </span>
          </p>
        );
      })}
    </div>
  );
}

// Rosca à esquerda, lista à direita do maior para o menor (nome, quantidade e %)
function DonutWithList({ data, centerLabel, useOwnColors = false }) {
  const total = data.reduce((acc, d) => acc + d.value, 0);
  const rows = data.map((d, i) => ({
    ...d,
    color: useOwnColors ? d.color : d.isOther ? OTHER_COLOR : PALETTE[i % PALETTE.length],
  }));

  if (total === 0) return <EmptyChart />;

  return (
    <div className="flex h-full flex-col items-center gap-5 sm:flex-row">
      <div className="relative h-44 w-44 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={rows} dataKey="value" nameKey="name" innerRadius="68%" outerRadius="100%" paddingAngle={2} stroke="none" startAngle={90} endAngle={-270}>
              {rows.map((r, i) => <Cell key={i} fill={r.color} />)}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold leading-none text-slate-900 dark:text-white tabular-nums">{total}</span>
          <span className="mt-1 text-[10px] uppercase tracking-[0.18em] text-slate-400">{centerLabel}</span>
        </div>
      </div>

      <ul className="w-full min-w-0 flex-1 max-w-md space-y-2">
        {[...rows].sort((a, b) => (a.isOther ? 1 : b.isOther ? -1 : b.value - a.value)).map(r => {
          const pct = Math.round((r.value / total) * 100);
          return (
            <li key={r.name} className="flex items-center gap-3 text-xs">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: r.color }} />
              <span className="min-w-0 flex-1 truncate text-slate-700 dark:text-slate-200">{r.name}</span>
              <div className="hidden h-1 w-24 overflow-hidden rounded-full bg-slate-100 dark:bg-white/[0.06] md:block">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: r.color }} />
              </div>
              <span className="w-8 text-right font-semibold tabular-nums text-slate-900 dark:text-white">{r.value}</span>
              <span className="w-10 text-right tabular-nums text-slate-400">{pct}%</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-200 text-xs text-slate-400 dark:border-white/[0.08]">
      Ainda não há dados suficientes
    </div>
  );
}
