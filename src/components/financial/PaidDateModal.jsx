import React, { useEffect, useState } from 'react';
import { CalendarCheck } from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { Modal } from '../common/Modal';
import { DateField } from '../common/DateField';
import { formatCurrency } from '../../utils/formatters';
import { fmtDay, instAmount, instClientName, instNumber, instTotal } from './financeUtils';

// Aparece ao dar baixa numa parcela que venceu em mês anterior: a data informada é a que conta
// em "Recebido no mês" e no repasse da equipe.
export function PaidDateModal() {
  const { paidDatePrompt, closePaidDatePrompt, markInstallmentPaid } = useCRM();
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);

  useEffect(() => {
    if (paidDatePrompt) setDate(today);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paidDatePrompt]);

  if (!paidDatePrompt) return null;
  const { installment: inst, dueDate } = paidDatePrompt;

  const confirm = (day) => {
    closePaidDatePrompt();
    markInstallmentPaid(inst.id, day);
  };

  return (
    <Modal isOpen onClose={closePaidDatePrompt} title="Quando foi pago?" maxWidth="max-w-md">
      <div className="space-y-4">
        <p className="text-xs text-slate-600 dark:text-slate-300">
          <b>{instClientName(inst)}</b> · {inst.isDownPayment ? 'Entrada' : `Parcela ${instNumber(inst)} de ${instTotal(inst)}`} ·{' '}
          {formatCurrency(instAmount(inst))}, vencida em <b>{fmtDay(dueDate)}</b>.
        </p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          A data do pagamento decide em que mês o valor entra como recebido (e no repasse da equipe).
          Se o cliente pagou só agora, deixe hoje. Se a baixa é de um pagamento antigo, use a data em que ele pagou.
        </p>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">Data do pagamento</label>
          <DateField
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-800 focus:border-gold-500 focus:outline-none dark:border-slate-700 dark:bg-navy-950 dark:text-slate-100"
          />
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
          <button
            type="button"
            onClick={() => confirm(dueDate)}
            className="rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Pago no vencimento ({fmtDay(dueDate)})
          </button>
          <button
            type="button"
            onClick={() => confirm(date || today)}
            disabled={!date || date > today}
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-brand-700 via-brand-600 to-brand-500 px-4 py-2 text-xs font-bold text-white shadow-md hover:brightness-110 disabled:opacity-40"
          >
            <CalendarCheck className="h-3.5 w-3.5" /> Dar baixa em {fmtDay(date)}
          </button>
        </div>
      </div>
    </Modal>
  );
}
