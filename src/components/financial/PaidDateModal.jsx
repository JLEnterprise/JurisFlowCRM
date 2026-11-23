import React, { useEffect, useMemo, useState } from 'react';
import { CalendarCheck, History } from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { Modal } from '../common/Modal';
import { DateField } from '../common/DateField';
import { formatCurrency } from '../../utils/formatters';
import { daysBetween, fmtDay, instAmount, instClientName, instDue, instNumber, instTotal } from './financeUtils';

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const refMonth = (day) => {
  const [y, m] = String(day || '').split('-');
  return y && m ? `${MONTHS[Number(m) - 1]}/${y}` : '—';
};
const label = (i) => (i.isDownPayment ? 'Entrada' : `Parcela ${instNumber(i)} de ${instTotal(i)}`);

// Toda baixa passa por aqui. A data informada é quando o dinheiro ENTROU (é ela que conta no
// "recebido no mês" e no repasse). A parcela continua mostrando o mês a que o pagamento se refere,
// e quantos dias depois do vencimento foi pago. Dá para baixar, de uma vez, as outras parcelas
// em aberto do mesmo contrato que o cliente quitou junto.
export function PaidDateModal() {
  const { paidDatePrompt, closePaidDatePrompt, markInstallmentPaid, installments = [] } = useCRM();
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [selected, setSelected] = useState(new Set());

  const main = paidDatePrompt?.installment;
  // Outras parcelas em aberto do mesmo contrato que já venceram (candidatas a quitar junto)
  const others = useMemo(() => {
    if (!main) return [];
    const contractId = String(main.contractId || main.contract_id || '');
    if (!contractId) return [];
    return installments
      .filter(i => i.status !== 'paid' && String(i.id) !== String(main.id)
        && String(i.contractId || i.contract_id || '') === contractId && instDue(i) && instDue(i) <= today)
      .sort((a, b) => instDue(a).localeCompare(instDue(b)));
  }, [installments, main, today]);

  useEffect(() => {
    if (paidDatePrompt) {
      setDate(today);
      setSelected(new Set());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paidDatePrompt]);

  if (!main) return null;

  const chosen = [main, ...others.filter(i => selected.has(String(i.id)))];
  const total = chosen.reduce((acc, i) => acc + instAmount(i), 0);
  const toggle = (id) => setSelected(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  // Recebido agora: todas entram na data informada (mês em que o dinheiro entrou)
  const confirmReceived = () => {
    closePaidDatePrompt();
    chosen.forEach(i => markInstallmentPaid(i.id, date || today));
  };
  // Lançamento de histórico: foi pago lá atrás, cada uma na data do próprio vencimento
  const confirmHistory = () => {
    closePaidDatePrompt();
    chosen.forEach(i => markInstallmentPaid(i.id, instDue(i) || today));
  };

  const late = (i) => {
    const d = daysBetween(instDue(i), date || today);
    return d > 0 ? `${d} dia(s) de atraso` : 'em dia';
  };

  return (
    <Modal isOpen onClose={closePaidDatePrompt} title="Dar baixa no pagamento" maxWidth="max-w-lg">
      <div className="space-y-4">
        <p className="text-xs text-slate-600 dark:text-slate-300">
          <b>{instClientName(main)}</b> · {label(main)} · {formatCurrency(instAmount(main))}
          {' '}· referente a <b>{refMonth(instDue(main))}</b> (vencimento {fmtDay(instDue(main))})
        </p>

        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">Data em que o pagamento entrou</label>
          <DateField
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-800 focus:border-gold-500 focus:outline-none dark:border-slate-700 dark:bg-navy-950 dark:text-slate-100"
          />
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Esta data define o mês em que o valor conta como recebido (e no repasse). A parcela continua indicando o mês a que se refere.
          </p>
        </div>

        {others.length > 0 && (
          <div className="rounded-xl border border-slate-200 p-3 dark:border-white/[0.08]">
            <p className="mb-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
              O cliente quitou outras parcelas em aberto deste contrato no mesmo pagamento?
            </p>
            <div className="max-h-40 space-y-1 overflow-y-auto">
              {others.map(i => (
                <label key={i.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-1.5 py-1 text-xs hover:bg-slate-50 dark:hover:bg-white/[0.03]">
                  <input type="checkbox" className="h-3.5 w-3.5 accent-current" checked={selected.has(String(i.id))} onChange={() => toggle(String(i.id))} />
                  <span className="flex-1 text-slate-700 dark:text-slate-200">{label(i)} · ref. {refMonth(instDue(i))}</span>
                  <span className="font-numeric text-slate-500">{formatCurrency(instAmount(i))}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:bg-white/[0.03] dark:text-slate-300">
          {chosen.length === 1 ? '1 parcela' : `${chosen.length} parcelas`} · <b className="font-numeric">{formatCurrency(total)}</b>
          {' '}· entrada em {fmtDay(date || today)}
          <span className="block text-[11px] text-slate-500 dark:text-slate-400">
            {chosen.map(i => `${refMonth(instDue(i))}: ${late(i)}`).join(' · ')}
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
          <button
            type="button"
            onClick={confirmHistory}
            title="Use só ao cadastrar pagamentos antigos que já tinham entrado antes: cada parcela fica com a data do próprio vencimento e não conta como recebida neste mês."
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 px-3 py-2 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <History className="h-3.5 w-3.5" /> Histórico: já tinha sido pago no vencimento
          </button>
          <button
            type="button"
            onClick={confirmReceived}
            disabled={!date || date > today}
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-brand-700 via-brand-600 to-brand-500 px-4 py-2 text-xs font-bold text-white shadow-md hover:brightness-110 disabled:opacity-40"
          >
            <CalendarCheck className="h-3.5 w-3.5" /> Confirmar recebimento em {fmtDay(date || today)}
          </button>
        </div>
      </div>
    </Modal>
  );
}
