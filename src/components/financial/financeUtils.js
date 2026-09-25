// Leitura padronizada das parcelas (os registros antigos usam camelCase ou snake_case)

const DAY = 24 * 60 * 60 * 1000;

export const instAmount = (i) => Number(i?.amount ?? i?.value ?? 0) || 0;
export const instDue = (i) => String(i?.dueDate || i?.due_date || '').split('T')[0];
export const instPaidOn = (i) =>
  String(i?.paymentDate || i?.payment_date || i?.paidDate || i?.paid_date || '').split('T')[0];
export const instClientName = (i) => i?.clientName || i?.client_name || 'Cliente';
export const instNumber = (i) => i?.installmentNumber || i?.number || 1;
export const instTotal = (i) => i?.totalInstallments || i?.total_installments || 1;
export const instMethod = (i) => i?.paymentMethod || i?.payment_method || '';

// Data "AAAA-MM-DD" como data local (evita cair no dia anterior pelo fuso)
export function parseDay(str) {
  if (!str) return null;
  const [y, m, d] = String(str).split('T')[0].split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

export function toDayStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const todayStr = () => toDayStr(new Date());

export function daysBetween(fromStr, toStr) {
  const a = parseDay(fromStr);
  const b = parseDay(toStr);
  if (!a || !b) return 0;
  return Math.round((b - a) / DAY);
}

export function addDays(dayStr, n) {
  const d = parseDay(dayStr);
  if (!d) return dayStr;
  d.setDate(d.getDate() + n);
  return toDayStr(d);
}

export const isPaid = (i) => i?.status === 'paid';
export const isOverdue = (i) => !isPaid(i) && !!instDue(i) && instDue(i) < todayStr();

// Situação única de cada parcela: 'paid' | 'overdue' | 'upcoming'
export const instState = (i) => (isPaid(i) ? 'paid' : isOverdue(i) ? 'overdue' : 'upcoming');

export function fmtDay(str, opts = { day: '2-digit', month: '2-digit', year: 'numeric' }) {
  const d = parseDay(str);
  return d ? d.toLocaleDateString('pt-BR', opts) : '—';
}

// Texto relativo curto: "hoje", "em 5 dias", "há 3 dias"
export function relativeDay(str) {
  const n = daysBetween(todayStr(), str);
  if (n === 0) return 'hoje';
  if (n === 1) return 'amanhã';
  if (n === -1) return 'ontem';
  return n > 0 ? `em ${n} dias` : `há ${-n} dias`;
}

// Chave do cliente de uma parcela: id quando existe, senão o nome normalizado
export function clientKeyOf(inst, clients = []) {
  const id = inst?.clientId || inst?.client_id;
  if (id) return String(id);
  const name = instClientName(inst).trim().toLowerCase();
  const found = clients.find(c => (c.name || '').trim().toLowerCase() === name);
  return found ? String(found.id) : `nome:${name}`;
}
