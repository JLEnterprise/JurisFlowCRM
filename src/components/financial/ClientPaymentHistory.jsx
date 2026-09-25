import React, { useMemo } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MessageSquare,
  Undo2,
  FileCheck,
  UserCheck,
  TrendingUp,
  CalendarClock,
  Phone,
  Mail,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { useCRM } from '../../context/CRMContext';
import { formatCurrency } from '../../utils/formatters';
import { Avatar } from '../common/Avatar';
import {
  instAmount, instDue, instPaidOn, instClientName, instNumber, instTotal, instMethod,
  instState, todayStr, daysBetween, addDays, fmtDay, relativeDay, clientKeyOf,
} from './financeUtils';

// Cores por situação (status reservado: verde = pago, vermelho = atraso; dourado = a vencer / previsão)
const C = { paid: '#2f9b74', overdue: '#d0506a', upcoming: '#b8893a' };
const STATE_LABEL = { paid: 'Pago', overdue: 'Em atraso', upcoming: 'A vencer' };

const monthKey = (day) => String(day).slice(0, 7);
const monthLabel = (key) => {
  const [y, m] = key.split('-').map(Number);
  const s = new Date(y, m - 1, 1).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
  return `${s}/${String(y).slice(2)}`;
};
const nextMonth = (key) => {
  const [y, m] = key.split('-').map(Number);
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;
};
const monthRange = (from, to) => {
  const out = [];
  let k = from;
  while (k <= to && out.length < 120) { out.push(k); k = nextMonth(k); }
  return out;
};
const compact = (v) =>
  v >= 1000 ? `R$${(v / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}k` : `R$${Math.round(v)}`;

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const rows = payload.filter(p => Number(p.value) > 0);
  if (!rows.length) return null;
  return (
    <div className="rounded-xl border border-gold-500/25 bg-white/95 dark:bg-[#0b1220]/95 px-3 py-2 text-xs shadow-xl backdrop-blur">
      <div className="mb-1 font-semibold text-slate-900 dark:text-white">{label}</div>
      {rows.map(p => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4 text-slate-600 dark:text-slate-300">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: p.payload?.[`${p.dataKey}Color`] || p.color }} />
            {p.name}
          </span>
          <span className="font-numeric font-semibold text-slate-900 dark:text-white">{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

function Kpi({ label, value, hint, tone = 'slate', icon: Icon }) {
  const tones = {
    slate: 'text-slate-500 dark:text-slate-400',
    paid: 'text-emerald-600 dark:text-emerald-400',
    overdue: 'text-rose-600 dark:text-rose-400',
    gold: 'text-gold-700 dark:text-gold-300',
  };
  return (
    <div className="dash-panel !p-4">
      <div className="flex items-center justify-between">
        <span className="font-label text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{label}</span>
        {Icon && <Icon className={`h-4 w-4 ${tones[tone]}`} />}
      </div>
      <div className="mt-2 font-numeric text-xl font-semibold text-slate-900 dark:text-white">{value}</div>
      {hint && <div className={`mt-0.5 text-[11px] ${tones[tone]}`}>{hint}</div>}
    </div>
  );
}

export function ClientPaymentHistory({ clientKey, onBack, onOpenWhatsApp, onOpenClient }) {
  const {
    clients = [],
    contracts = [],
    installments = [],
    markInstallmentPaid,
    unmarkInstallmentPaid,
    officeSettings = {},
  } = useCRM();

  const today = todayStr();

  const list = useMemo(
    () => (installments || [])
      .filter(i => clientKeyOf(i, clients) === clientKey)
      .sort((a, b) => instDue(a).localeCompare(instDue(b)) || instNumber(a) - instNumber(b)),
    [installments, clients, clientKey]
  );

  const client = clients.find(c => String(c.id) === clientKey);
  const name = client?.name || (list[0] ? instClientName(list[0]) : 'Cliente');

  const clientContracts = (contracts || []).filter(c =>
    (client && (String(c.clientId || c.client_id) === String(client.id))) ||
    (c.clientName || '').trim().toLowerCase() === name.trim().toLowerCase()
  );

  // ---- Números do cliente ----
  const stats = useMemo(() => {
    const paid = list.filter(i => instState(i) === 'paid');
    const overdue = list.filter(i => instState(i) === 'overdue');
    const upcoming = list.filter(i => instState(i) === 'upcoming');
    const sum = arr => arr.reduce((a, i) => a + instAmount(i), 0);

    const delays = paid
      .filter(i => instPaidOn(i) && instDue(i))
      .map(i => Math.max(0, daysBetween(instDue(i), instPaidOn(i))));
    const onTime = delays.filter(d => d === 0).length;
    const avgDelay = delays.length ? Math.round(delays.reduce((a, d) => a + d, 0) / delays.length) : 0;

    return {
      total: sum(list),
      paid, overdue, upcoming,
      paidSum: sum(paid), overdueSum: sum(overdue), upcomingSum: sum(upcoming),
      punctuality: delays.length ? Math.round((onTime / delays.length) * 100) : null,
      avgDelay,
    };
  }, [list]);

  // Previsão de pagamento de cada parcela em aberto: vencimento + atraso médio do cliente;
  // atrasadas usam a data prometida (se ainda válida) ou daqui a uma semana.
  const projectedOf = (i) => {
    const state = instState(i);
    if (state === 'paid') return instPaidOn(i) || instDue(i);
    if (state === 'overdue') {
      const promised = String(i.promisedDate || i.promised_date || '').split('T')[0];
      return promised && promised >= today ? promised : addDays(today, Math.max(7, stats.avgDelay));
    }
    return addDays(instDue(i), stats.avgDelay);
  };

  const lastProjected = list.reduce((max, i) => {
    if (instState(i) === 'paid') return max;
    const p = projectedOf(i);
    return p > max ? p : max;
  }, '');

  // ---- Gráfico 1: parcelas mês a mês pelo vencimento ----
  const monthly = useMemo(() => {
    if (!list.length) return [];
    const keys = list.map(i => monthKey(instDue(i))).filter(Boolean).sort();
    return monthRange(keys[0], keys[keys.length - 1]).map(k => {
      const row = { key: k, mes: monthLabel(k), paid: 0, overdue: 0, upcoming: 0 };
      list.forEach(i => { if (monthKey(instDue(i)) === k) row[instState(i)] += instAmount(i); });
      return row;
    });
  }, [list]);

  // ---- Gráfico 2: recebido acumulado (real) e projeção até quitar ----
  const cumulative = useMemo(() => {
    if (!list.length) return [];
    const nowKey = monthKey(today);
    const realByMonth = {};
    const projByMonth = {};
    list.forEach(i => {
      if (instState(i) === 'paid') {
        const k = monthKey(instPaidOn(i) || instDue(i));
        realByMonth[k] = (realByMonth[k] || 0) + instAmount(i);
      } else {
        const k = monthKey(projectedOf(i));
        projByMonth[k] = (projByMonth[k] || 0) + instAmount(i);
      }
    });
    const all = [...Object.keys(realByMonth), ...Object.keys(projByMonth), nowKey].sort();
    let real = 0;
    let proj = 0;
    return monthRange(all[0], all[all.length - 1]).map(k => {
      real += realByMonth[k] || 0;
      const row = { key: k, mes: monthLabel(k) };
      if (k <= nowKey) row.realizado = real;
      if (k >= nowKey) { proj += projByMonth[k] || 0; row.projecao = real + proj; }
      return row;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list, stats.avgDelay]);

  const nowLabel = monthLabel(monthKey(today));

  const handleCharge = (inst) => {
    if (!onOpenWhatsApp) return;
    onOpenWhatsApp({
      templateId: 'cobranca_elegante',
      clientName: name,
      phone: client?.phone || client?.telefone || '',
      value: instAmount(inst),
      dueDate: fmtDay(instDue(inst)),
      officeName: officeSettings.officeName || '',
      pixKey: officeSettings.pixKey || '',
    });
  };

  const axisTick = { fontSize: 11, fill: '#94a3b8' };
  const progress = stats.total > 0 ? Math.round((stats.paidSum / stats.total) * 100) : 0;
  const firstFutureIdx = list.findIndex(i => instDue(i) >= today);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Cabeçalho do cliente */}
      <div className="dash-panel">
        <button type="button" onClick={onBack} className="premium-link -ml-2.5 inline-flex items-center gap-1.5">
          <ArrowLeft className="h-3.5 w-3.5" /> Contas & honorários
        </button>

        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <Avatar src={client?.avatar} name={name} size="lg" />
            <div className="min-w-0">
              <div className="font-label text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-700/80 dark:text-gold-300/70">
                Histórico de pagamentos
              </div>
              <h2 className="truncate font-display text-2xl font-semibold text-slate-900 dark:text-white">{name}</h2>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                {(client?.phone || client?.telefone) && (
                  <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{client.phone || client.telefone}</span>
                )}
                {client?.email && <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" />{client.email}</span>}
                {clientContracts.map(c => (
                  <span key={c.id} className="inline-flex items-center gap-1 rounded-full border border-gold-500/25 bg-gold-500/[0.06] px-2 py-0.5 text-gold-800 dark:text-gold-200">
                    <FileCheck className="h-3 w-3" />
                    {c.title || c.type || c.contractType || 'Contrato'} · <span className="font-numeric">{formatCurrency(c.value)}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {stats.overdue.length > 0 && onOpenWhatsApp && (
              <button
                type="button"
                onClick={() => handleCharge(stats.overdue[0])}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-emerald-700"
              >
                <MessageSquare className="h-3.5 w-3.5" /> Cobrar no WhatsApp
              </button>
            )}
            {client && onOpenClient && (
              <button
                type="button"
                onClick={() => onOpenClient(client.id)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-gold-500/40 dark:border-white/[0.08] dark:text-slate-200"
              >
                <UserCheck className="h-3.5 w-3.5" /> Ficha do cliente
              </button>
            )}
          </div>
        </div>

        {/* Barra de quitação */}
        <div className="mt-5">
          <div className="mb-1.5 flex items-end justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              <span className="font-numeric font-semibold text-slate-900 dark:text-white">{formatCurrency(stats.paidSum)}</span> recebidos de{' '}
              <span className="font-numeric">{formatCurrency(stats.total)}</span>
            </span>
            <span className="font-numeric font-semibold text-gold-700 dark:text-gold-300">{progress}% quitado</span>
          </div>
          <div className="flex h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/[0.06]">
            <div style={{ width: `${stats.total ? (stats.paidSum / stats.total) * 100 : 0}%`, background: C.paid }} />
            <div style={{ width: `${stats.total ? (stats.overdueSum / stats.total) * 100 : 0}%`, background: C.overdue }} className="border-l-2 border-white dark:border-[#0b1220]" />
          </div>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="dash-panel py-14 text-center text-sm text-slate-500">
          Nenhuma parcela registrada para este cliente.
        </div>
      ) : (
        <>
          {/* Indicadores */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Kpi label="Recebido" icon={CheckCircle2} tone="paid" value={formatCurrency(stats.paidSum)} hint={`${stats.paid.length} parcela(s) paga(s)`} />
            <Kpi label="A vencer" icon={Clock} tone="gold" value={formatCurrency(stats.upcomingSum)} hint={`${stats.upcoming.length} parcela(s) futura(s)`} />
            <Kpi
              label="Em atraso" icon={AlertTriangle} tone={stats.overdue.length ? 'overdue' : 'slate'}
              value={formatCurrency(stats.overdueSum)} hint={stats.overdue.length ? `${stats.overdue.length} parcela(s) vencida(s)` : 'Nada em atraso'}
            />
            <Kpi
              label="Pontualidade" icon={TrendingUp} tone={stats.punctuality === null ? 'slate' : stats.punctuality >= 80 ? 'paid' : 'overdue'}
              value={stats.punctuality === null ? '—' : `${stats.punctuality}%`}
              hint={stats.punctuality === null ? 'Sem pagamentos ainda' : stats.avgDelay ? `Atraso médio de ${stats.avgDelay} dia(s)` : 'Paga em dia'}
            />
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <div className="dash-panel">
              <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">Parcelas mês a mês</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Valor de cada mês pelo vencimento</p>
              <div className="mt-3 flex flex-wrap gap-4 text-[11px] text-slate-600 dark:text-slate-300">
                {['paid', 'overdue', 'upcoming'].map(s => (
                  <span key={s} className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: C[s] }} />{STATE_LABEL[s]}</span>
                ))}
              </div>
              <div className="mt-2 h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthly} margin={{ top: 20, right: 4, left: -8, bottom: 0 }} barCategoryGap="28%" maxBarSize={44}>
                    <CartesianGrid vertical={false} stroke="rgba(148,163,184,0.15)" />
                    <XAxis dataKey="mes" tick={axisTick} axisLine={false} tickLine={false} />
                    <YAxis tick={axisTick} axisLine={false} tickLine={false} tickFormatter={compact} width={56} />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(197,160,89,0.08)' }} />
                    <ReferenceLine x={nowLabel} stroke="#b8893a" strokeDasharray="3 3" label={{ value: 'hoje', position: 'top', fontSize: 10, fill: '#b8893a' }} />
                    <Bar dataKey="paid" name="Pago" stackId="m" fill={C.paid} stroke="transparent" />
                    <Bar dataKey="overdue" name="Em atraso" stackId="m" fill={C.overdue} />
                    <Bar dataKey="upcoming" name="A vencer" stackId="m" fill={C.upcoming} fillOpacity={0.55} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="dash-panel">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">Recebido e projeção</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Acumulado real e previsão pelo histórico de pontualidade do cliente
                  </p>
                </div>
                {lastProjected && (
                  <div className="shrink-0 rounded-xl border border-gold-500/25 bg-gold-500/[0.06] px-3 py-1.5 text-right">
                    <div className="font-label text-[9px] font-semibold uppercase tracking-[0.16em] text-gold-700/80 dark:text-gold-300/70">Quitação prevista</div>
                    <div className="font-numeric text-sm font-semibold text-slate-900 dark:text-white">
                      {fmtDay(lastProjected, { month: 'long', year: 'numeric' })}
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-4 text-[11px] text-slate-600 dark:text-slate-300">
                <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-4 rounded" style={{ background: C.upcoming }} />Recebido</span>
                <span className="inline-flex items-center gap-1.5"><span className="h-0 w-4 border-t-2 border-dashed" style={{ borderColor: C.upcoming }} />Projeção</span>
                <span className="inline-flex items-center gap-1.5"><span className="h-0 w-4 border-t border-dashed border-slate-400" />Total contratado</span>
              </div>
              <div className="mt-2 h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cumulative} margin={{ top: 10, right: 4, left: -8, bottom: 0 }}>
                    <defs>
                      <linearGradient id="histReal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#d4af37" stopOpacity={0.45} />
                        <stop offset="100%" stopColor="#d4af37" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="rgba(148,163,184,0.15)" />
                    <XAxis dataKey="mes" tick={axisTick} axisLine={false} tickLine={false} />
                    <YAxis tick={axisTick} axisLine={false} tickLine={false} tickFormatter={compact} width={56} domain={[0, Math.max(stats.total, 1)]} />
                    <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgba(197,160,89,0.4)' }} />
                    <ReferenceLine y={stats.total} stroke="#94a3b8" strokeDasharray="4 4" />
                    <Area type="monotone" dataKey="realizado" name="Recebido" stroke={C.upcoming} strokeWidth={2} fill="url(#histReal)" connectNulls dot={false} />
                    <Area type="monotone" dataKey="projecao" name="Projeção" stroke={C.upcoming} strokeWidth={2} strokeDasharray="5 4" fill="transparent" connectNulls dot={{ r: 3, fill: C.upcoming, strokeWidth: 0 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Linha do tempo de todas as parcelas */}
          <div className="dash-panel">
            <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">Todas as parcelas</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Da primeira à última, com a previsão de pagamento das que faltam</p>

            <ol className="relative mt-5 space-y-1 before:absolute before:bottom-3 before:left-[15px] before:top-3 before:w-px before:bg-slate-200 dark:before:bg-white/[0.08]">
              {list.map((inst, idx) => {
                const state = instState(inst);
                const due = instDue(inst);
                const paidOn = instPaidOn(inst);
                const delay = state === 'paid' && paidOn ? daysBetween(due, paidOn) : 0;
                const Icon = state === 'paid' ? CheckCircle2 : state === 'overdue' ? AlertTriangle : CalendarClock;
                let detail;
                if (state === 'paid') {
                  detail = `Pago em ${fmtDay(paidOn || due)}${instMethod(inst) ? ` · ${instMethod(inst)}` : ''}${delay > 0 ? ` · ${delay} dia(s) após o vencimento` : ' · em dia'}`;
                } else if (state === 'overdue') {
                  detail = `Venceu ${relativeDay(due)} · previsão ${fmtDay(projectedOf(inst))}`;
                } else {
                  detail = `Vence ${relativeDay(due)}${stats.avgDelay ? ` · previsão ${fmtDay(projectedOf(inst))}` : ''}`;
                }

                return (
                  <React.Fragment key={inst.id}>
                    {idx === firstFutureIdx && firstFutureIdx > 0 && (
                      <li className="relative flex items-center gap-3 py-2 pl-[7px]">
                        <span className="relative z-[1] h-[17px] w-[17px] rotate-45 border border-gold-500/60 bg-gold-500/20" />
                        <span className="font-label text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-700 dark:text-gold-300">Hoje · {fmtDay(today)}</span>
                        <span className="h-px flex-1 bg-gradient-to-r from-gold-500/40 to-transparent" />
                      </li>
                    )}
                    <li className="group relative flex items-center gap-3 rounded-xl py-2 pr-2 transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.03]">
                      <span
                        className="relative z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-white dark:bg-[#0b1220]"
                        style={{ borderColor: `${C[state]}66`, color: C[state] }}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline gap-x-2">
                          <span className="text-sm font-semibold text-slate-900 dark:text-white">
                            Parcela {instNumber(inst)} de {instTotal(inst)}
                          </span>
                          <span className="text-xs text-slate-400">venc. {fmtDay(due)}</span>
                        </div>
                        <div className={`truncate text-xs ${state === 'overdue' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'}`}>
                          {detail}
                        </div>
                      </div>
                      <span className="font-numeric text-sm font-semibold text-slate-900 dark:text-white">{formatCurrency(instAmount(inst))}</span>
                      <div className="flex w-[4.5rem] shrink-0 justify-end gap-1">
                        {state === 'paid' ? (
                          <button type="button" onClick={() => unmarkInstallmentPaid(inst.id)} title="Estornar baixa"
                            className="rounded-lg p-1.5 text-slate-400 opacity-0 transition hover:bg-gold-500/10 hover:text-gold-600 group-hover:opacity-100">
                            <Undo2 className="h-4 w-4" />
                          </button>
                        ) : (
                          <>
                            {state === 'overdue' && onOpenWhatsApp && (
                              <button type="button" onClick={() => handleCharge(inst)} title="Cobrar no WhatsApp"
                                className="rounded-lg p-1.5 text-emerald-600 transition hover:bg-emerald-500/10">
                                <MessageSquare className="h-4 w-4" />
                              </button>
                            )}
                            <button type="button" onClick={() => markInstallmentPaid(inst.id)} title="Dar baixa (pago hoje)"
                              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-emerald-500/10 hover:text-emerald-600">
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </li>
                  </React.Fragment>
                );
              })}
            </ol>
          </div>
        </>
      )}
    </div>
  );
}
