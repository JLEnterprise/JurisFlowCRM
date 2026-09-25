import React from 'react';
import { Layers, Repeat, CalendarClock, Infinity as InfinityIcon, Check } from 'lucide-react';
import { DateField } from '../common/DateField';
import { formatCurrency } from '../../utils/formatters';
import { normalizePlan, buildSchedule, parseDay } from '../../utils/paymentPlan';

const INPUT = 'w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-xs text-slate-800 dark:text-slate-100 focus:border-gold-500 focus:outline-none';
const LABEL = 'block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1';

const INSTALLMENT_CHIPS = [1, 3, 6, 12, 24, 36, 60];
const TERM_CHIPS = [
  { months: 6, label: '6 meses' },
  { months: 12, label: '12 meses' },
  { months: 24, label: '24 meses' },
  { months: 0, label: 'Sem prazo' },
];

const monthShort = (str) => {
  const d = parseDay(str);
  return d ? d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '') : '';
};
const fmtDay = (str) => {
  const d = parseDay(str);
  return d ? d.toLocaleDateString('pt-BR') : '—';
};

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
        active
          ? 'bg-gold-500/15 text-gold-800 ring-1 ring-inset ring-gold-500/50 dark:text-gold-200'
          : 'text-slate-500 ring-1 ring-inset ring-slate-200 hover:text-slate-900 dark:text-slate-400 dark:ring-white/10 dark:hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}

/**
 * Escolha do plano de pagamento do contrato: Parcelado ou Mensal recorrente.
 * `plan` usa os mesmos campos do contrato (paymentType, value, installmentsCount, firstDueDate,
 * monthlyValue, billingDay, recurringMonths, autoRenew); `onChange(parcial)` devolve só o que mudou.
 * `valueKey` permite usar outro nome para o valor total (ex.: contractValue no fechamento).
 */
export function PaymentPlanPicker({ plan, onChange, valueKey = 'value', paymentMethodField = null }) {
  const type = plan.paymentType === 'recorrente' ? 'recorrente' : 'parcelado';
  const normalized = normalizePlan({ ...plan, value: plan[valueKey] });
  const schedule = (Number(plan[valueKey]) > 0 || Number(plan.monthlyValue) > 0) ? buildSchedule({ ...plan, value: plan[valueKey] }) : [];
  const preview = schedule.slice(0, 12);

  const setType = (next) => {
    if (next === type) return;
    if (next === 'recorrente') {
      // Aproveita o valor já digitado como mensalidade quando fizer sentido
      const count = Number(plan.installmentsCount) || 1;
      const guess = Number(plan[valueKey]) > 0 ? Math.round((Number(plan[valueKey]) / count) * 100) / 100 : '';
      onChange({
        paymentType: 'recorrente',
        monthlyValue: plan.monthlyValue || guess,
        billingDay: plan.billingDay || 10,
        recurringMonths: plan.recurringMonths ?? 12,
        autoRenew: plan.autoRenew ?? true,
        firstDueDate: '',
      });
    } else {
      onChange({ paymentType: 'parcelado', firstDueDate: '' });
    }
  };

  return (
    <div className="space-y-3">
      {/* Tipo de cobrança */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {[
          { id: 'parcelado', icon: Layers, title: 'Parcelado', text: 'Valor fechado dividido em parcelas — 3x, 30x, 60x…' },
          { id: 'recorrente', icon: Repeat, title: 'Mensal recorrente', text: 'Mensalidade fixa, comum para empresas. Renova sozinho.' },
        ].map(opt => {
          const Icon = opt.icon;
          const active = type === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setType(opt.id)}
              aria-pressed={active}
              className={`relative flex items-start gap-3 rounded-2xl border px-3.5 py-3 text-left transition-all ${
                active
                  ? 'border-gold-500/60 bg-gold-500/[0.08] ring-1 ring-inset ring-gold-500/30'
                  : 'border-slate-200 hover:border-gold-500/40 dark:border-white/[0.08]'
              }`}
            >
              <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${active ? 'bg-gold-500/15 text-gold-700 dark:text-gold-300' : 'bg-slate-100 text-slate-400 dark:bg-white/[0.05]'}`}>
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-slate-900 dark:text-white">{opt.title}</span>
                <span className="block text-[11px] leading-snug text-slate-500 dark:text-slate-400">{opt.text}</span>
              </span>
              {active && <Check className="absolute right-3 top-3 h-4 w-4 text-gold-600 dark:text-gold-400" />}
            </button>
          );
        })}
      </div>

      {type === 'parcelado' ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className={LABEL}>Valor total dos honorários (R$) *</label>
            <input
              type="number" step="0.01" min="0" required
              value={plan[valueKey]}
              onChange={(e) => onChange({ [valueKey]: e.target.value })}
              placeholder="0,00"
              className={INPUT}
            />
          </div>
          <div>
            <label className={LABEL}>Nº de parcelas</label>
            <input
              type="number" min="1" max="120"
              value={plan.installmentsCount}
              onChange={(e) => onChange({ installmentsCount: e.target.value })}
              className={INPUT}
            />
          </div>
          <div>
            <label className={LABEL}>1º vencimento</label>
            <DateField
              type="date"
              value={plan.firstDueDate || ''}
              onChange={(e) => onChange({ firstDueDate: e.target.value })}
              className={INPUT}
            />
          </div>
          <div className="flex flex-wrap items-center gap-1.5 sm:col-span-3">
            <span className="mr-1 text-[11px] text-slate-400">Atalhos:</span>
            {INSTALLMENT_CHIPS.map(n => (
              <Chip key={n} active={Number(plan.installmentsCount) === n} onClick={() => onChange({ installmentsCount: n })}>
                {n === 1 ? 'À vista' : `${n}x`}
              </Chip>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className={LABEL}>Mensalidade (R$) *</label>
            <input
              type="number" step="0.01" min="0" required
              value={plan.monthlyValue ?? ''}
              onChange={(e) => onChange({ monthlyValue: e.target.value })}
              placeholder="0,00"
              className={INPUT}
            />
          </div>
          <div>
            <label className={LABEL}>Vence todo dia</label>
            <input
              type="number" min="1" max="28"
              value={plan.billingDay ?? 10}
              onChange={(e) => onChange({ billingDay: e.target.value, firstDueDate: '' })}
              className={INPUT}
            />
          </div>
          <div>
            <label className={LABEL}>1º vencimento</label>
            <DateField
              type="date"
              value={plan.firstDueDate || normalized.firstDueDate}
              onChange={(e) => onChange({ firstDueDate: e.target.value })}
              className={INPUT}
            />
          </div>
          <div className="flex flex-wrap items-center gap-1.5 sm:col-span-3">
            <span className="mr-1 text-[11px] text-slate-400">Vigência:</span>
            {TERM_CHIPS.map(t => (
              <Chip
                key={t.months}
                active={(Number(plan.recurringMonths) || 0) === t.months}
                onClick={() => onChange({ recurringMonths: t.months, ...(t.months === 0 ? { autoRenew: true } : {}) })}
              >
                {t.months === 0 && <InfinityIcon className="mr-1 inline h-3 w-3 -translate-y-px" />}
                {t.label}
              </Chip>
            ))}
            <label className={`ml-auto inline-flex items-center gap-2 text-[11px] font-semibold ${normalized.recurringMonths === 0 ? 'text-slate-400' : 'cursor-pointer text-slate-600 dark:text-slate-300'}`}>
              <input
                type="checkbox"
                className="h-3.5 w-3.5 accent-current"
                checked={normalized.autoRenew}
                disabled={normalized.recurringMonths === 0}
                onChange={(e) => onChange({ autoRenew: e.target.checked })}
              />
              Renovar automaticamente
            </label>
          </div>
        </div>
      )}

      {paymentMethodField}

      {/* Resumo com a linha do tempo dos próximos vencimentos */}
      {preview.length > 0 && (
        <div className="rounded-2xl border border-gold-500/25 bg-gold-500/[0.05] px-4 py-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div className="text-xs text-slate-600 dark:text-slate-300">
              {type === 'recorrente' ? (
                <>
                  <span className="font-numeric text-sm font-semibold text-slate-900 dark:text-white">{formatCurrency(normalized.monthlyValue)}</span>/mês · vence todo dia {normalized.billingDay}
                  {' · '}{normalized.recurringMonths ? `${normalized.recurringMonths} meses` : 'sem prazo'}
                  {normalized.autoRenew && <span className="ml-1 text-gold-700 dark:text-gold-300">· renova sozinho</span>}
                </>
              ) : (
                <>
                  <span className="font-numeric text-sm font-semibold text-slate-900 dark:text-white">{normalized.installmentsCount}× {formatCurrency(normalized.installmentValue)}</span>
                  {' · '}de {fmtDay(schedule[0]?.dueDate)} a {fmtDay(schedule[schedule.length - 1]?.dueDate)}
                </>
              )}
            </div>
            <div className="text-right text-[11px] text-slate-500 dark:text-slate-400">
              {type === 'recorrente' ? (normalized.recurringMonths ? 'Total do contrato' : 'Por ano') : 'Total'}{' '}
              <span className="font-numeric text-sm font-semibold text-slate-900 dark:text-white">{formatCurrency(normalized.value)}</span>
            </div>
          </div>

          <div className="mt-3 flex items-end gap-[3px]" aria-hidden="true">
            {preview.map((r, i) => (
              <div key={i} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-[3px] bg-gradient-to-t from-gold-600/70 to-gold-400/80"
                  style={{ height: type === 'recorrente' ? 16 : 10 + Math.min(10, 120 / normalized.installmentsCount) }}
                />
                <span className="text-[9px] uppercase text-slate-400">{monthShort(r.dueDate)}</span>
              </div>
            ))}
            {schedule.length > 12 && (
              <span className="pb-3 pl-1 text-[10px] text-slate-400">+{schedule.length - 12}</span>
            )}
          </div>
          <p className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <CalendarClock className="h-3.5 w-3.5 text-gold-600 dark:text-gold-400" />
            {type === 'recorrente'
              ? normalized.autoRenew
                ? 'As mensalidades vão para Contas & honorários e o próximo ciclo é criado sozinho perto do fim.'
                : 'As mensalidades vão para Contas & honorários; ao fim da vigência o contrato encerra.'
              : 'As parcelas vão para Contas & honorários com esses vencimentos.'}
          </p>
        </div>
      )}
    </div>
  );
}
