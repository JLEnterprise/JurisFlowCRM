// Plano de pagamento do contrato: PARCELADO (valor fechado dividido em N parcelas)
// ou MENSAL RECORRENTE (mensalidade fixa por X meses ou sem prazo, com renovação automática).
//
// Campos guardados no contrato:
//   paymentType      'parcelado' | 'recorrente'   (contratos antigos, sem o campo, são 'parcelado')
//   installmentsCount  nº de parcelas (parcelado) ou meses do ciclo (recorrente)
//   firstDueDate     'AAAA-MM-DD' do 1º vencimento
//   monthlyValue     mensalidade (recorrente)
//   billingDay       dia do vencimento todo mês (recorrente)
//   recurringMonths  meses por ciclo; 0 = sem prazo (gera 12 por vez e renova)
//   autoRenew        renova sozinho ao fim do ciclo (sempre true quando sem prazo)

export const RECURRING_WINDOW = 12; // meses gerados por ciclo quando o contrato é "sem prazo"
export const RENEW_AHEAD_DAYS = 45; // renova quando a última mensalidade vence em até 45 dias

const pad = (n) => String(n).padStart(2, '0');
export const dayStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function parseDay(str) {
  if (!str) return null;
  const [y, m, d] = String(str).split('T')[0].split('-').map(Number);
  return y && m && d ? new Date(y, m - 1, d) : null;
}

// Soma meses mantendo o dia (31/01 + 1 mês = 28 ou 29/02)
export function addMonths(str, n, preferredDay) {
  const base = parseDay(str) || new Date();
  const day = preferredDay || base.getDate();
  const target = new Date(base.getFullYear(), base.getMonth() + n, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(day, lastDay));
  return dayStr(target);
}

export const isRecurring = (c) => (c?.paymentType || c?.payment_type) === 'recorrente';

// Próximo vencimento no dia escolhido (hoje conta, se ainda for o dia)
export function nextBillingDate(billingDay, from = new Date()) {
  const day = Math.min(Math.max(Number(billingDay) || 10, 1), 28);
  const d = new Date(from.getFullYear(), from.getMonth(), day);
  if (d < new Date(from.getFullYear(), from.getMonth(), from.getDate())) d.setMonth(d.getMonth() + 1);
  return dayStr(d);
}

// Normaliza os campos do plano a partir do formulário/contrato
export function normalizePlan(c = {}) {
  if (isRecurring(c)) {
    const monthly = Number(c.monthlyValue) || 0;
    const months = Number(c.recurringMonths) || 0; // 0 = sem prazo
    const cycle = months || RECURRING_WINDOW;
    const billingDay = Math.min(Math.max(Number(c.billingDay) || 10, 1), 28);
    return {
      paymentType: 'recorrente',
      monthlyValue: monthly,
      billingDay,
      recurringMonths: months,
      autoRenew: months === 0 ? true : !!c.autoRenew,
      installmentsCount: cycle,
      firstDueDate: c.firstDueDate || nextBillingDate(billingDay),
      value: monthly * cycle,
      installmentValue: monthly,
    };
  }
  const count = Math.max(1, Number(c.installmentsCount || c.installments_count) || 1);
  const total = Number(c.value) || 0;
  return {
    paymentType: 'parcelado',
    installmentsCount: count,
    firstDueDate: c.firstDueDate || '',
    value: total,
    installmentValue: count ? total / count : total,
  };
}

// Cronograma de vencimentos de um ciclo. Parcelado: 1º vencimento = firstDueDate ou baseDate/hoje.
// Recorrente: vence sempre no billingDay. cycle > 1 continua a partir de afterDate.
export function buildSchedule(contract, { baseDate, cycle = 1, afterDate, startNumber = 1 } = {}) {
  const plan = normalizePlan(contract);
  const count = plan.installmentsCount;
  const rows = [];

  if (plan.paymentType === 'recorrente') {
    const first = afterDate ? addMonths(afterDate, 1, plan.billingDay) : plan.firstDueDate;
    for (let i = 0; i < count; i++) {
      rows.push({
        installmentNumber: startNumber + i,
        totalInstallments: plan.recurringMonths ? startNumber - 1 + count : null,
        value: plan.monthlyValue,
        dueDate: addMonths(first, i, plan.billingDay),
        recurring: true,
        cycle,
      });
    }
    return rows;
  }

  const first = plan.firstDueDate || (baseDate ? String(baseDate).split('T')[0] : dayStr(new Date()));
  for (let i = 0; i < count; i++) {
    rows.push({
      installmentNumber: i + 1,
      totalInstallments: count,
      value: plan.installmentValue,
      dueDate: addMonths(first, i),
    });
  }
  return rows;
}

// Texto curto do plano, para resumos e listas
export function planSummary(contract, fmt = (v) => `R$ ${Number(v || 0).toFixed(2)}`) {
  const p = normalizePlan(contract);
  if (p.paymentType === 'recorrente') {
    const term = p.recurringMonths ? `${p.recurringMonths} meses` : 'sem prazo';
    return `${fmt(p.monthlyValue)}/mês · dia ${p.billingDay} · ${term}${p.autoRenew ? ' · renova sozinho' : ''}`;
  }
  return `${p.installmentsCount}× ${fmt(p.installmentValue)}`;
}
