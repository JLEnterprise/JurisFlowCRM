import React, { useEffect, useRef, useState } from 'react';
import { CalendarDays, Check, ChevronDown } from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { PERIOD_OPTIONS, getPeriodLabel } from '../../utils/period';
import { MonthGrid } from './DateField';

// Seletor de período na identidade da marca (substitui o <select> nativo).
export function PeriodFilter({ className = '', align = 'right' }) {
  const { periodFilter, setPeriodFilter } = useCRM();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = periodFilter || 'all';
  const monthValue = current.startsWith('month:') ? current.slice(6) : '';
  const [monthView, setMonthView] = useState(() =>
    monthValue ? new Date(Number(monthValue.slice(0, 4)), 0, 1) : new Date());

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const choose = (value) => {
    setPeriodFilter(value);
    setOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors ${
          open || current !== 'all'
            ? 'border-gold-500/40 text-slate-800 dark:text-gold-100 bg-gold-500/[0.06]'
            : 'border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-300 hover:border-gold-500/40'
        }`}
      >
        <CalendarDays className="h-3.5 w-3.5 text-gold-600 dark:text-gold-400" />
        <span className="first-letter:uppercase whitespace-nowrap">{getPeriodLabel(current)}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          role="listbox"
          className={`absolute ${align === 'left' ? 'left-0' : 'right-0'} top-[calc(100%+8px)] z-50 w-60 rounded-2xl border border-slate-200 dark:border-gold-500/15 bg-white dark:bg-[#0c1322] p-1.5 shadow-2xl animate-fade-in`}
        >
          <div className="px-3 pt-2 pb-1.5 text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
            Período
          </div>
          {PERIOD_OPTIONS.map(opt => {
            const active = current === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => choose(opt.id)}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs transition-colors ${
                  active
                    ? 'bg-gold-500/10 text-slate-900 dark:text-gold-100 font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.05]'
                }`}
              >
                {opt.label}
                {active && <Check className="h-3.5 w-3.5 text-gold-600 dark:text-gold-400" />}
              </button>
            );
          })}

          <div className="mt-1.5 border-t border-slate-100 dark:border-white/[0.06] px-1.5 pt-2.5 pb-1">
            <div className="px-1.5 mb-1 text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
              Mês específico
            </div>
            <MonthGrid
              view={monthView}
              setView={setMonthView}
              selected={monthValue ? new Date(Number(monthValue.slice(0, 4)), Number(monthValue.slice(5, 7)) - 1, 1) : null}
              onPick={(i) => choose(`month:${monthView.getFullYear()}-${String(i + 1).padStart(2, '0')}`)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
