import React, { useMemo, useRef, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Sector,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { CheckCircle2, Clock3, XCircle } from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { formatCurrency } from '../../utils/formatters';
import { KANBAN_STAGES } from '../../data/legalAreas';

// Paleta da marca, validada (tema escuro, superfície #0b1220): contraste, daltonismo e separação
// entre vizinhas. Ordem fixa — a cor segue a categoria, nunca a posição no ranking.
// Cada cor ganha um tom "vivo" (topo do degradê) para dar brilho sem perder a identidade.
const PALETTE = ['#b8893a', '#3f7fc4', '#d0703a', '#2f9b74', '#8a6ad0'];
const OTHER_COLOR = '#64748b';
const BRIGHT = {
  '#b8893a': '#f2d08a',
  '#3f7fc4': '#7fbaf5',
  '#d0703a': '#f5a66e',
  '#2f9b74': '#62d6a8',
  '#8a6ad0': '#b9a0f7',
  '#64748b': '#a3b1c2',
  '#d9534f': '#f5918d',
};
const STATUS = { good: '#2f9b74', neutral: '#b8893a', critical: '#d9534f' };
const SERIES_COLOR = { leads: PALETTE[0], fechados: PALETTE[1], contratos: PALETTE[1], valor: PALETTE[0], quantidade: PALETTE[0] };

// Tema claro: dourado e azul trocam de lugar (azul vira a cor principal dos gráficos),
// seguindo a troca de paleta do sistema (ver src/index.css)
const GOLD = '#b8893a';
const BLUE = '#3f7fc4';
function applyChartTheme(isDark) {
  PALETTE[0] = isDark ? GOLD : BLUE;
  PALETTE[1] = isDark ? BLUE : GOLD;
  STATUS.neutral = PALETTE[0];
  Object.assign(SERIES_COLOR, { leads: PALETTE[0], fechados: PALETTE[1], contratos: PALETTE[1], valor: PALETTE[0], quantidade: PALETTE[0] });
}

const AXIS = { fill: '#7b8798', fontSize: 11 };
const GRID = 'rgba(148, 163, 184, 0.10)';
const BAR_CURSOR = { fill: 'rgba(197, 160, 89, 0.07)' };           // substitui o quadrado branco padrão
const LINE_CURSOR = { stroke: 'rgba(197, 160, 89, 0.45)', strokeWidth: 1 };
const ANIM = { isAnimationActive: true, animationDuration: 1100, animationEasing: 'ease-out' };

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

// Até 5 categorias + "Outros" (nunca inventa uma 6ª cor)
function topWithOther(entries) {
  const sorted = [...entries].sort((a, b) => b.value - a.value);
  if (sorted.length <= PALETTE.length) return sorted;
  const top = sorted.slice(0, PALETTE.length);
  const rest = sorted.slice(PALETTE.length).reduce((acc, e) => acc + e.value, 0);
  return [...top, { name: 'Outros', value: rest, isOther: true }];
}

// <defs> com degradê vivo → cor da marca. Função (não componente): o Recharts só desenha filhos que conhece.
function gradient(id, color, { horizontal = false, fade = false } = {}) {
  const bright = BRIGHT[color] || color;
  return (
    <linearGradient key={id} id={id} x1="0" y1="0" x2={horizontal ? '1' : '0'} y2={horizontal ? '0' : '1'}>
      {fade ? (
        <>
          <stop offset="0%" stopColor={bright} stopOpacity={0.55} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </>
      ) : horizontal ? (
        <>
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor={bright} />
        </>
      ) : (
        <>
          <stop offset="0%" stopColor={bright} />
          <stop offset="100%" stopColor={color} />
        </>
      )}
    </linearGradient>
  );
}

export function DashboardCharts({ onNavigate }) {
  const { leads, contracts, clients = [], proposals = [], leadSources, legalAreas } = useCRM();
  const { users } = useAuth();
  const { isDark } = useTheme();
  applyChartTheme(isDark);

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
      valor: safeContracts.filter(c => monthKey(contractDate(c)) === m.key).reduce((acc, c) => acc + (Number(c.value) || 0), 0),
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
    const channels = topWithOther(channelsAreExample ? EXAMPLE_CHANNELS : realChannels)
      .map((c, i) => ({ ...c, color: c.isOther ? OTHER_COLOR : PALETTE[i % PALETTE.length] }));

    const areaCount = {};
    safeLeads.forEach(l => {
      const found = (legalAreas || []).find(a => a && a.id === l.legalArea);
      const name = (found?.name || l.legalArea || 'Outras').replace('Direito ', '');
      areaCount[name] = (areaCount[name] || 0) + 1;
    });
    const areas = Object.entries(areaCount).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

    const team = safeUsers.map(u => ({
      nome: String(u.name || u.email || 'Colaborador').trim().split(/\s+/).slice(0, 2).join(' '),
      leads: safeLeads.filter(l => l.assignedTo === u.id || l.lawyerId === u.id).length,
      contratos: safeContracts.filter(c => c.responsibleLawyerId === u.id).length,
    }));

    const won = safeLeads.filter(l => l.stage === 'contrato_fechado').length;
    const lost = safeLeads.filter(l => l.stage === 'perdido').length;
    const open = Math.max(0, safeLeads.length - won - lost);
    const balance = [
      { name: 'Ganhos', value: won, color: STATUS.good, icon: CheckCircle2, hint: 'Viraram contrato' },
      { name: 'Em andamento', value: open, color: STATUS.neutral, icon: Clock3, hint: 'Ainda no funil' },
      { name: 'Perdidos', value: lost, color: STATUS.critical, icon: XCircle, hint: 'Não fecharam' },
    ];

    return { overTime, revenue, funnel, channels, channelsAreExample, areas, team, balance, won, lost };
  }, [safeLeads, safeContracts, safeUsers, leadSources, legalAreas, isDark]);

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <Panel index={0} title="Funil comercial" subtitle="Do lead recebido ao contrato fechado: quantos chegaram a cada etapa e quanto converteu"
        className="lg:col-span-2" height="h-auto">
        {(play) => (
          <PremiumFunnel
            key={play}
            leads={safeLeads}
            clients={Array.isArray(clients) ? clients.filter(Boolean) : []}
            proposals={Array.isArray(proposals) ? proposals.filter(Boolean) : []}
            onNavigate={onNavigate}
          />
        )}
      </Panel>

      <Panel index={1} title="Evolução de leads & fechamentos" subtitle="Leads captados e contratos fechados nos últimos 6 meses"
        legend={[{ label: 'Leads captados', color: PALETTE[0] }, { label: 'Contratos fechados', color: PALETTE[1] }]}>
        {(play) => (
          <ResponsiveContainer width="100%" height="100%" key={play}>
            <AreaChart data={data.overTime} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <defs>
                {gradient('evoLeadsFill', PALETTE[0], { fade: true })}
                {gradient('evoClosedFill', PALETTE[1], { fade: true })}
                {gradient('evoLeadsLine', PALETTE[0], { horizontal: true })}
                {gradient('evoClosedLine', PALETTE[1], { horizontal: true })}
              </defs>
              <CartesianGrid vertical={false} stroke={GRID} />
              <XAxis dataKey="mes" tick={AXIS} axisLine={false} tickLine={false} />
              <YAxis tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip cursor={LINE_CURSOR} content={<ChartTooltip />} />
              <Area type="monotone" dataKey="leads" name="Leads captados" stroke="url(#evoLeadsLine)" strokeWidth={2.5} fill="url(#evoLeadsFill)" dot={false}
                activeDot={{ r: 5, strokeWidth: 2, stroke: '#0b1220', fill: BRIGHT[PALETTE[0]] }} {...ANIM} />
              <Area type="monotone" dataKey="fechados" name="Contratos fechados" stroke="url(#evoClosedLine)" strokeWidth={2.5} fill="url(#evoClosedFill)" dot={false}
                activeDot={{ r: 5, strokeWidth: 2, stroke: '#0b1220', fill: BRIGHT[PALETTE[1]] }} {...ANIM} animationBegin={150} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Panel>

      <Panel index={2} title="Receita de honorários contratados" subtitle="Valor dos contratos fechados por mês">
        {(play) => (
          <ResponsiveContainer width="100%" height="100%" key={play}>
            <BarChart data={data.revenue} margin={{ top: 8, right: 8, left: -6, bottom: 0 }}>
              <defs>{gradient('revBar', PALETTE[0])}</defs>
              <CartesianGrid vertical={false} stroke={GRID} />
              <XAxis dataKey="mes" tick={AXIS} axisLine={false} tickLine={false} />
              <YAxis tick={AXIS} axisLine={false} tickLine={false} tickFormatter={(v) => (v >= 1000 ? `R$${Math.round(v / 1000)}k` : `R$${v}`)} />
              <Tooltip cursor={BAR_CURSOR} content={<ChartTooltip currency />} />
              <Bar dataKey="valor" name="Valor contratado" fill="url(#revBar)" radius={[5, 5, 0, 0]} maxBarSize={44}
                activeBar={{ fill: BRIGHT[PALETTE[0]] }} {...ANIM} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Panel>

      <Panel index={3} title="Canais de origem dos leads" subtitle="De onde vêm os leads: links, anúncios e cadastros manuais"
        badge={data.channelsAreExample ? 'Exemplo' : null}>
        {(play) => <DonutWithList key={play} id="canais" data={data.channels} centerLabel="leads" />}
      </Panel>

      <Panel index={4} title="Demanda por área jurídica" subtitle="Áreas com mais leads">
        {(play) => (data.areas.length === 0 ? <EmptyChart /> : (
          <ResponsiveContainer width="100%" height="100%" key={play}>
            <BarChart data={data.areas} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <defs>{gradient('areaBar', PALETTE[0])}</defs>
              <CartesianGrid vertical={false} stroke={GRID} />
              <XAxis dataKey="name" tick={AXIS} axisLine={false} tickLine={false} interval={0} />
              <YAxis tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip cursor={BAR_CURSOR} content={<ChartTooltip />} />
              <Bar dataKey="value" name="Leads" fill="url(#areaBar)" radius={[5, 5, 0, 0]} maxBarSize={44}
                activeBar={{ fill: BRIGHT[PALETTE[0]] }} {...ANIM} />
            </BarChart>
          </ResponsiveContainer>
        ))}
      </Panel>

      <Panel index={5} title="Produtividade da equipe" subtitle="Leads atendidos e contratos fechados por pessoa"
        legend={[{ label: 'Leads atendidos', color: PALETTE[0] }, { label: 'Contratos fechados', color: PALETTE[1] }]}>
        {(play) => (data.team.length === 0 ? <EmptyChart /> : (
          <ResponsiveContainer width="100%" height="100%" key={play}>
            <BarChart data={data.team} margin={{ top: 8, right: 8, left: -18, bottom: 0 }} barGap={3}>
              <defs>
                {gradient('teamLeads', PALETTE[0])}
                {gradient('teamClosed', PALETTE[1])}
              </defs>
              <CartesianGrid vertical={false} stroke={GRID} />
              <XAxis dataKey="nome" tick={AXIS} axisLine={false} tickLine={false} interval={0} />
              <YAxis tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip cursor={BAR_CURSOR} content={<ChartTooltip />} />
              <Bar dataKey="leads" name="Leads atendidos" fill="url(#teamLeads)" radius={[5, 5, 0, 0]} maxBarSize={28} activeBar={{ fill: BRIGHT[PALETTE[0]] }} {...ANIM} />
              <Bar dataKey="contratos" name="Contratos fechados" fill="url(#teamClosed)" radius={[5, 5, 0, 0]} maxBarSize={28} activeBar={{ fill: BRIGHT[PALETTE[1]] }} {...ANIM} animationBegin={150} />
            </BarChart>
          </ResponsiveContainer>
        ))}
      </Panel>

      <Panel index={6} title="Balanço comercial" subtitle="Quanto do funil virou contrato, segue em andamento ou foi perdido" className="lg:col-span-2" height="h-auto">
        {(play) => <CommercialBalance key={play} data={data.balance} won={data.won} lost={data.lost} />}
      </Panel>
    </div>
  );
}

/* ============================== Peças ============================== */

// Funil comercial no estilo painel de BI: um funil contínuo desenhado em SVG (cores do tema:
// dourado no escuro, azul no claro), com a conversão entre etapas e um painel lateral de leitura rápida.
// Junta o que antes eram 8 quadradinhos (leads, atendimento, qualificados, propostas, negociação,
// ganhos, clientes ativos, perdidos). Cada faixa conta os leads que CHEGARAM à etapa (estão nela ou além).
const FUNNEL_GROUPS = [
  { id: 'recebidos', label: 'Leads recebidos', hint: 'Entraram no funil', minOrder: 1 },
  { id: 'atendimento', label: 'Em atendimento', hint: 'Primeiro contato feito', minOrder: 2 },
  { id: 'qualificados', label: 'Qualificados', hint: 'Qualificação e consulta', minOrder: 3 },
  { id: 'proposta', label: 'Proposta enviada', hint: 'Receberam proposta', minOrder: 5 },
  { id: 'negociacao', label: 'Em negociação', hint: 'Negociação e contrato enviado', minOrder: 6 },
  { id: 'ganhos', label: 'Contratos fechados', hint: 'Viraram clientes', minOrder: 8 },
];
const ROW_H = 58;
const GAP = 5;

function PremiumFunnel({ leads, clients, proposals, onNavigate }) {
  const [hover, setHover] = useState(null);
  const orderOf = Object.fromEntries(KANBAN_STAGES.map(s => [s.id, s.order]));
  const total = leads.length;
  const active = leads.filter(l => l.stage !== 'perdido');
  const lost = total - active.length;
  const activeClients = clients.filter(c => c && c.status === 'active').length;

  const rows = FUNNEL_GROUPS.map((g, i) => {
    const reached = i === 0 ? total : active.filter(l => (orderOf[l.stage] || 1) >= g.minOrder).length;
    const nextMin = FUNNEL_GROUPS[i + 1]?.minOrder ?? 99;
    const here = active.filter(l => {
      const o = orderOf[l.stage] || 1;
      return o >= g.minOrder && o < nextMin;
    }).length;
    return { ...g, reached, here };
  });
  rows.forEach((r, i) => {
    r.step = i === 0 ? null : rows[i - 1].reached ? Math.round((r.reached / rows[i - 1].reached) * 100) : 0;
    r.ofTotal = total ? Math.round((r.reached / total) * 100) : 0;
  });

  if (total === 0) return <EmptyChart />;

  const won = rows[rows.length - 1].reached;
  const conversion = total ? (won / total) * 100 : 0;
  // Maior queda entre duas etapas (onde o funil mais perde gente)
  const drops = rows.slice(1).map((r, i) => ({ from: rows[i], to: r, lostN: rows[i].reached - r.reached }));
  const worst = drops.reduce((a, b) => (b.lostN > (a?.lostN ?? 0) ? b : a), null);

  // Geometria do SVG (coordenadas 0–1000 na largura; a altura acompanha as faixas)
  const W = 1000;
  const H = rows.length * ROW_H;
  const MIN = 0.2;
  const widthOf = (n) => W * (MIN + (1 - MIN) * (n / total));
  const cx = W / 2;

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_16rem]">
      {/* Funil */}
      <div className="grid grid-cols-[8.5rem_1fr_6.5rem] gap-x-3 sm:grid-cols-[10rem_1fr_7.5rem]">
        {/* Rótulos à esquerda */}
        <div>
          {rows.map((r, i) => (
            <div key={r.id} style={{ height: ROW_H }} className={`flex flex-col justify-center pr-1 text-right transition-opacity ${hover !== null && hover !== i ? 'opacity-50' : ''}`}>
              <span className="text-[13px] font-semibold leading-tight text-slate-800 dark:text-slate-100">{r.label}</span>
              <span className="text-[10px] text-slate-400">{r.hint}</span>
            </div>
          ))}
        </div>

        {/* Desenho */}
        <div className="relative" style={{ height: H }}>
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
            <defs>
              {rows.map((r, i) => {
                const last = i === rows.length - 1;
                const t = i / (rows.length - 1);
                return (
                  <linearGradient key={r.id} id={`pf-${r.id}`} x1="0" x2="1" y1="0" y2="0">
                    <stop offset="0%" style={{ stopColor: last ? '#1f8a63' : `rgb(var(--gold-${t > 0.6 ? 700 : 600}))` }} />
                    <stop offset="50%" style={{ stopColor: last ? '#3fcf97' : `rgb(var(--gold-${t > 0.6 ? 400 : 300}))` }} />
                    <stop offset="100%" style={{ stopColor: last ? '#1f8a63' : `rgb(var(--gold-${t > 0.6 ? 700 : 600}))` }} />
                  </linearGradient>
                );
              })}
              <linearGradient id="pf-gloss" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#fff" stopOpacity="0.35" />
                <stop offset="45%" stopColor="#fff" stopOpacity="0.06" />
                <stop offset="100%" stopColor="#fff" stopOpacity="0" />
              </linearGradient>
            </defs>
            {rows.map((r, i) => {
              const top = widthOf(r.reached);
              const next = rows[i + 1];
              const bottom = next ? widthOf(next.reached) : top * 0.82;
              const y = i * ROW_H;
              const h = ROW_H - GAP;
              const d = `M ${cx - top / 2} ${y} L ${cx + top / 2} ${y} L ${cx + bottom / 2} ${y + h} L ${cx - bottom / 2} ${y + h} Z`;
              return (
                <g
                  key={r.id}
                  className="funnel-seg"
                  style={{ animationDelay: `${i * 80}ms`, opacity: hover !== null && hover !== i ? 0.45 : 1 }}
                >
                  <path d={d} fill={`url(#pf-${r.id})`} />
                  <path d={d} fill="url(#pf-gloss)" />
                  <path d={`M ${cx - top / 2} ${y + 0.5} L ${cx + top / 2} ${y + 0.5}`} stroke="#fff" strokeOpacity="0.45" strokeWidth="1" vectorEffect="non-scaling-stroke" />
                </g>
              );
            })}
          </svg>

          {/* Números e área de hover por cima do desenho */}
          {rows.map((r, i) => (
            <button
              key={r.id}
              type="button"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              onClick={() => onNavigate && onNavigate(i === rows.length - 1 ? 'contracts' : 'kanban')}
              className="absolute inset-x-0 flex items-center justify-center focus:outline-none"
              style={{ top: i * ROW_H, height: ROW_H - GAP }}
              aria-label={`${r.label}: ${r.reached} leads`}
            >
              <span className="font-numeric text-lg font-bold leading-none text-white drop-shadow-[0_1px_2px_rgb(0_0_0_/_0.45)]">
                {r.reached}
              </span>
              {hover === i && (
                <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-1 w-56 -translate-x-1/2 rounded-xl border border-gold-500/30 bg-white/95 px-3 py-2 text-left text-xs shadow-xl backdrop-blur dark:bg-[#0b1220]/95">
                  <span className="block font-semibold text-slate-900 dark:text-white">{r.label}</span>
                  <span className="mt-1 flex justify-between text-slate-500 dark:text-slate-400"><span>Chegaram aqui</span><b className="font-numeric text-slate-900 dark:text-white">{r.reached}</b></span>
                  <span className="flex justify-between text-slate-500 dark:text-slate-400"><span>Parados nesta etapa</span><b className="font-numeric text-slate-900 dark:text-white">{r.here}</b></span>
                  <span className="flex justify-between text-slate-500 dark:text-slate-400"><span>Do total recebido</span><b className="font-numeric text-slate-900 dark:text-white">{r.ofTotal}%</b></span>
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Conversão à direita */}
        <div>
          {rows.map((r, i) => (
            <div key={r.id} style={{ height: ROW_H }} className={`flex flex-col justify-center transition-opacity ${hover !== null && hover !== i ? 'opacity-50' : ''}`}>
              {r.step === null ? (
                <span className="text-[11px] text-slate-400">entrada</span>
              ) : (
                <span className={`inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 font-numeric text-[11px] font-bold ring-1 ring-inset ${
                  r.step >= 60 ? 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/25 dark:text-emerald-300'
                    : r.step >= 30 ? 'bg-gold-500/10 text-gold-800 ring-gold-500/25 dark:text-gold-200'
                    : 'bg-rose-500/10 text-rose-700 ring-rose-500/25 dark:text-rose-300'
                }`}>
                  ▼ {r.step}%
                </span>
              )}
              <span className="mt-0.5 font-numeric text-[10px] text-slate-400">{r.ofTotal}% do total</span>
            </div>
          ))}
        </div>
      </div>

      {/* Leitura rápida */}
      <div className="flex flex-col gap-3">
        <div className="rounded-2xl border border-gold-500/25 bg-gold-500/[0.05] p-4">
          <div className="font-label text-[10px] font-semibold uppercase tracking-[0.18em] text-gold-700 dark:text-gold-300">Conversão total</div>
          <div className="mt-2 flex items-center gap-3">
            <svg viewBox="0 0 36 36" className="h-14 w-14 -rotate-90" aria-hidden="true">
              <circle cx="18" cy="18" r="15.5" fill="none" strokeWidth="3.5" className="stroke-slate-200 dark:stroke-white/10" />
              <circle
                cx="18" cy="18" r="15.5" fill="none" strokeWidth="3.5" strokeLinecap="round"
                style={{ stroke: 'rgb(var(--gold-500))', strokeDasharray: `${(conversion / 100) * 97.4} 97.4` }}
              />
            </svg>
            <div>
              <div className="font-numeric text-2xl font-semibold text-slate-900 dark:text-white">{conversion.toFixed(1)}%</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">{won} de {total} viraram contrato</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={() => onNavigate && onNavigate('clients')} className="rounded-2xl border border-slate-200 p-3 text-left transition-colors hover:border-gold-500/40 dark:border-white/[0.08]">
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Clientes ativos</div>
            <div className="mt-1 font-numeric text-xl font-semibold text-slate-900 dark:text-white">{activeClients}</div>
          </button>
          <button type="button" onClick={() => onNavigate && onNavigate('kanban')} className="rounded-2xl border border-slate-200 p-3 text-left transition-colors hover:border-rose-500/40 dark:border-white/[0.08]">
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Perdidos</div>
            <div className="mt-1 font-numeric text-xl font-semibold text-rose-600 dark:text-rose-400">{lost}</div>
            <div className="text-[10px] text-slate-400">{total ? Math.round((lost / total) * 100) : 0}% do total</div>
          </button>
          <button type="button" onClick={() => onNavigate && onNavigate('proposals')} className="col-span-2 flex items-center justify-between rounded-2xl border border-slate-200 p-3 text-left transition-colors hover:border-gold-500/40 dark:border-white/[0.08]">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Propostas emitidas</span>
            <span className="font-numeric text-xl font-semibold text-slate-900 dark:text-white">{proposals.length}</span>
          </button>
        </div>

        {worst && worst.lostN > 0 && (
          <div className="rounded-2xl border border-rose-500/25 bg-rose-500/[0.05] p-3 text-xs text-slate-600 dark:text-slate-300">
            <div className="font-label text-[10px] font-semibold uppercase tracking-[0.16em] text-rose-600 dark:text-rose-400">Maior perda</div>
            <p className="mt-1 leading-snug">
              De <b>{worst.from.label}</b> para <b>{worst.to.label}</b>: saem <b className="font-numeric">{worst.lostN}</b> leads
              ({100 - (worst.to.step ?? 0)}%). Vale olhar essa etapa primeiro.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Painel com entrada animada em sequência; ao passar o mouse o gráfico se redesenha (no máx. a cada 2,5 s)
function Panel({ index = 0, title, subtitle, legend, badge, className = '', height = 'h-64', children }) {
  const [play, setPlay] = useState(0);
  const lastPlay = useRef(Date.now());
  const replay = () => {
    const now = Date.now();
    if (now - lastPlay.current < 2500) return;
    lastPlay.current = now;
    setPlay(p => p + 1);
  };

  return (
    <section
      className={`dash-panel dash-panel--enter ${className}`}
      style={{ animationDelay: `${index * 90}ms` }}
      onMouseEnter={replay}
    >
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
                <span className="h-2 w-2 rounded-full" style={{ background: `linear-gradient(135deg, ${BRIGHT[item.color] || item.color}, ${item.color})` }} />
                {item.label}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className={`${height} w-full`}>{children(play)}</div>
    </section>
  );
}

function ChartTooltip({ active, payload, label, currency = false }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-xl border border-gold-500/25 bg-white/95 px-3 py-2 text-xs shadow-xl backdrop-blur dark:bg-[#0b1220]/95">
      {label !== undefined && <p className="mb-1 font-semibold text-slate-900 dark:text-white">{label}</p>}
      {payload.map((entry, i) => {
        // Séries com degradê chegam como "url(#...)": a cor vem do nome da série
        const raw = SERIES_COLOR[entry.dataKey] || entry.payload?.color || entry.color || '';
        const swatch = String(raw).startsWith('url') ? BRIGHT[PALETTE[0]] : (BRIGHT[raw] || raw || BRIGHT[PALETTE[0]]);
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

// Fatia sob o mouse cresce levemente e ganha um anel fino
function renderActiveSlice(props) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <g>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 6} startAngle={startAngle} endAngle={endAngle} fill={fill} />
      <Sector cx={cx} cy={cy} innerRadius={outerRadius + 9} outerRadius={outerRadius + 11} startAngle={startAngle} endAngle={endAngle} fill={fill} opacity={0.5} />
    </g>
  );
}

// Rosca à esquerda, lista à direita do maior para o menor (nome, barra, quantidade e %)
function DonutWithList({ id, data, centerLabel }) {
  const [active, setActive] = useState(-1);
  const total = data.reduce((acc, d) => acc + d.value, 0);
  if (total === 0) return <EmptyChart />;
  const ordered = [...data].sort((a, b) => (a.isOther ? 1 : b.isOther ? -1 : b.value - a.value));

  return (
    <div className="flex h-full flex-col items-center gap-6 sm:flex-row">
      <div className="relative h-48 w-48 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <defs>{data.map((d, i) => gradient(`${id}-slice-${i}`, d.color))}</defs>
            <Pie
              data={data} dataKey="value" nameKey="name"
              innerRadius="64%" outerRadius="88%" paddingAngle={2.5} cornerRadius={3} stroke="none"
              startAngle={90} endAngle={-270}
              activeIndex={active} activeShape={renderActiveSlice}
              onMouseEnter={(_, i) => setActive(i)} onMouseLeave={() => setActive(-1)}
              isAnimationActive animationDuration={1200} animationEasing="ease-out"
            >
              {data.map((d, i) => <Cell key={i} fill={`url(#${id}-slice-${i})`} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-numeric text-2xl font-semibold leading-none text-slate-900 dark:text-white">
            {active >= 0 ? data[active].value : total}
          </span>
          <span className="mt-1 max-w-[6.5rem] truncate text-center text-[10px] uppercase tracking-[0.16em] text-slate-400">
            {active >= 0 ? data[active].name : centerLabel}
          </span>
        </div>
      </div>

      <ul className="w-full min-w-0 max-w-md flex-1 space-y-2.5">
        {ordered.map((r, i) => {
          const pct = Math.round((r.value / total) * 100);
          const idx = data.indexOf(r);
          return (
            <li key={r.name}
              onMouseEnter={() => setActive(idx)} onMouseLeave={() => setActive(-1)}
              className={`flex items-center gap-3 rounded-lg px-1.5 py-1 text-xs transition-colors ${active === idx ? 'bg-gold-500/[0.06]' : ''}`}>
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: `linear-gradient(135deg, ${BRIGHT[r.color] || r.color}, ${r.color})` }} />
              <span className="min-w-0 flex-1 truncate text-slate-700 dark:text-slate-200">{r.name}</span>
              <div className="hidden h-1.5 w-14 shrink-0 overflow-hidden rounded-full bg-slate-100 dark:bg-white/[0.06] md:block xl:w-20">
                <div className="dash-bar-grow h-full rounded-full" style={{ width: `${pct}%`, animationDelay: `${i * 80}ms`, background: `linear-gradient(90deg, ${r.color}, ${BRIGHT[r.color] || r.color})` }} />
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

// Balanço: rosca com a taxa de conversão no centro + três cartões de resultado
function CommercialBalance({ data, won, lost }) {
  const total = data.reduce((acc, d) => acc + d.value, 0);
  const decided = won + lost;
  const winRate = decided > 0 ? Math.round((won / decided) * 100) : 0;
  const [active, setActive] = useState(-1);

  if (total === 0) return <div className="h-48"><EmptyChart /></div>;

  return (
    <div className="flex flex-col items-center gap-6 md:flex-row">
      <div className="relative h-48 w-48 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <defs>{data.map((d, i) => gradient(`balance-slice-${i}`, d.color))}</defs>
            <Pie
              data={data} dataKey="value" nameKey="name"
              innerRadius="66%" outerRadius="88%" paddingAngle={2.5} cornerRadius={3} stroke="none"
              startAngle={90} endAngle={-270}
              activeIndex={active} activeShape={renderActiveSlice}
              onMouseEnter={(_, i) => setActive(i)} onMouseLeave={() => setActive(-1)}
              isAnimationActive animationDuration={1200} animationEasing="ease-out"
            >
              {data.map((d, i) => <Cell key={i} fill={`url(#balance-slice-${i})`} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-numeric text-3xl font-semibold leading-none text-slate-900 dark:text-white">{winRate}%</span>
          <span className="mt-1 text-[10px] uppercase tracking-[0.16em] text-slate-400">conversão</span>
        </div>
      </div>

      <div className="grid w-full flex-1 grid-cols-1 gap-3 sm:grid-cols-3">
        {data.map((d, i) => {
          const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
          const Icon = d.icon;
          return (
            <div key={d.name}
              onMouseEnter={() => setActive(i)} onMouseLeave={() => setActive(-1)}
              className={`rounded-xl border p-4 transition-colors ${active === i ? 'border-gold-500/40 bg-gold-500/[0.05]' : 'border-slate-200 dark:border-white/[0.07]'}`}>
              <div className="flex items-center justify-between">
                <span className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{d.name}</span>
                <Icon className="h-4 w-4" style={{ color: BRIGHT[d.color] }} />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-numeric text-2xl font-semibold text-slate-900 dark:text-white">{d.value}</span>
                <span className="text-xs tabular-nums text-slate-400">{pct}%</span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/[0.06]">
                <div className="dash-bar-grow h-full rounded-full" style={{ width: `${pct}%`, animationDelay: `${i * 120}ms`, background: `linear-gradient(90deg, ${d.color}, ${BRIGHT[d.color]})` }} />
              </div>
              <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">{d.hint}</p>
            </div>
          );
        })}
      </div>
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
