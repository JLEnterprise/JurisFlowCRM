// Filtro de período global (seletor do cabeçalho).
// Valores: 'today' | '7d' | '30d' | '90d' | '12m' | 'this_month' | 'last_month' | 'all' | 'month:AAAA-MM'

export const PERIOD_OPTIONS = [
  { id: 'today', label: 'Hoje' },
  { id: '7d', label: 'Últimos 7 dias' },
  { id: '30d', label: 'Últimos 30 dias' },
  { id: '90d', label: 'Últimos 90 dias' },
  { id: 'this_month', label: 'Este mês' },
  { id: 'last_month', label: 'Mês passado' },
  { id: '12m', label: 'Últimos 12 meses' },
  { id: 'all', label: 'Todo o período' },
];

const MONTH_NAMES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho',
  'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

// "2026-09-24" vira data local (sem o deslocamento de fuso do new Date('AAAA-MM-DD'))
export function parseDateValue(value) {
  if (!value) return null;
  if (value instanceof Date) return isNaN(value) ? null : value;
  const str = String(value);
  const m = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(str);
  return isNaN(d) ? null : d;
}

export function getPeriodRange(period, now = new Date()) {
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const today = startOfDay(now);
  const daysAgo = (n) => new Date(today.getFullYear(), today.getMonth(), today.getDate() - n);

  if (typeof period === 'string' && period.startsWith('month:')) {
    const [y, mo] = period.slice(6).split('-').map(Number);
    return { start: new Date(y, mo - 1, 1), end: new Date(y, mo, 1) };
  }

  switch (period) {
    case 'today': return { start: today, end: null };
    case '7d': return { start: daysAgo(6), end: null };
    case '30d': return { start: daysAgo(29), end: null };
    case '90d': return { start: daysAgo(89), end: null };
    case '12m': return { start: new Date(today.getFullYear() - 1, today.getMonth(), today.getDate() + 1), end: null };
    case 'this_month': return { start: new Date(today.getFullYear(), today.getMonth(), 1), end: null };
    case 'last_month': return {
      start: new Date(today.getFullYear(), today.getMonth() - 1, 1),
      end: new Date(today.getFullYear(), today.getMonth(), 1),
    };
    default: return { start: null, end: null };
  }
}

export function isInPeriod(value, period) {
  if (!period || period === 'all') return true;
  const date = parseDateValue(value);
  if (!date) return false;
  const { start, end } = getPeriodRange(period);
  if (start && date < start) return false;
  if (end && date >= end) return false;
  return true;
}

export function getPeriodLabel(period) {
  if (typeof period === 'string' && period.startsWith('month:')) {
    const [y, mo] = period.slice(6).split('-').map(Number);
    return `${MONTH_NAMES[mo - 1]} de ${y}`;
  }
  return PERIOD_OPTIONS.find(o => o.id === period)?.label || 'Todo o período';
}

// "2026-09" -> "Setembro de 2026"
export function formatMonthKey(key) {
  const [y, mo] = key.split('-').map(Number);
  const name = MONTH_NAMES[mo - 1] || '';
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} de ${y}`;
}

export function toMonthKey(value) {
  const d = parseDateValue(value);
  return d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` : 'sem-data';
}
