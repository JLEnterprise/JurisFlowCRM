import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { FloatingPanel, useFloatingPanel, layoutClasses, isCompact, leadingPadding } from './floatingPanel';

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const MONTHS_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const pad = (n) => String(n).padStart(2, '0');
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// Lê o valor no mesmo formato do <input> nativo
function parseValue(type, value) {
  const v = value ? String(value) : '';
  if (type === 'time') {
    const m = v.match(/^(\d{2}):(\d{2})/);
    return { date: null, time: m ? `${m[1]}:${m[2]}` : '' };
  }
  if (type === 'month') {
    const m = v.match(/^(\d{4})-(\d{2})/);
    return { date: m ? new Date(Number(m[1]), Number(m[2]) - 1, 1) : null, time: '' };
  }
  const m = v.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/);
  if (!m) return { date: null, time: '' };
  return {
    date: new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])),
    time: m[4] ? `${m[4]}:${m[5]}` : '',
  };
}

function formatDisplay(type, date, time) {
  if (type === 'time') return time;
  if (!date) return '';
  if (type === 'month') return `${MONTHS[date.getMonth()]} de ${date.getFullYear()}`;
  const d = `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
  return type === 'datetime-local' && time ? `${d} às ${time}` : d;
}

const PLACEHOLDERS = {
  date: 'Selecionar data',
  'datetime-local': 'Selecionar data e hora',
  time: 'Selecionar horário',
  month: 'Selecionar mês',
};

/**
 * Campo de data premium do JurisFlow. Mesma API do <input type="date|datetime-local|time|month">:
 * <DateField type="date" value="2026-09-24" onChange={(e) => setX(e.target.value)} />
 */
export function DateField({
  type = 'date',
  value,
  onChange,
  name,
  id,
  required,
  disabled,
  min,
  max,
  placeholder,
  className = '',
  'aria-label': ariaLabel,
  title,
}) {
  const { date, time } = parseValue(type, value);
  const compact = isCompact(className);
  const { open, setOpen, triggerRef, panelRef, style, place } = useFloatingPanel({ minWidth: type === 'time' ? 180 : 292 });
  const [view, setView] = useState(() => date || new Date());

  useEffect(() => {
    if (open) {
      setView(date || new Date());
      requestAnimationFrame(place);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const emit = (next) => {
    onChange?.({ target: { value: next, name, id, type }, currentTarget: { value: next, name, id, type } });
  };

  const minDate = min ? parseValue('date', min).date : null;
  const maxDate = max ? parseValue('date', max).date : null;
  const isOutOfRange = (d) => (minDate && d < minDate) || (maxDate && d > maxDate);

  const pickDay = (d) => {
    if (isOutOfRange(d)) return;
    if (type === 'datetime-local') {
      emit(`${ymd(d)}T${time || '09:00'}`);
    } else {
      emit(ymd(d));
      setOpen(false);
      triggerRef.current?.focus();
    }
  };

  const pickTime = (t) => {
    if (type === 'time') {
      emit(t);
    } else {
      emit(`${ymd(date || new Date())}T${t}`);
    }
  };

  const pickMonth = (monthIndex) => {
    emit(`${view.getFullYear()}-${pad(monthIndex + 1)}`);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const today = new Date();
  const setToday = () => {
    if (type === 'month') return pickMonth(today.getMonth());
    if (type === 'time') return pickTime(`${pad(today.getHours())}:${pad(Math.floor(today.getMinutes() / 5) * 5)}`);
    pickDay(new Date(today.getFullYear(), today.getMonth(), today.getDate()));
  };

  const display = formatDisplay(type, date, time);
  const Icon = type === 'time' ? Clock : CalendarDays;

  return (
    <div className={`relative ${layoutClasses(className) || 'inline-block min-w-[10rem]'}`}>
      <button
        ref={triggerRef}
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => setOpen(!open)}
        onKeyDown={(e) => {
          if (!open && (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            setOpen(true);
          }
        }}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={ariaLabel}
        title={title}
        className={`premium-field ${compact ? 'premium-field--sm' : ''} ${open ? 'is-open' : ''} ${leadingPadding(className)}`}
      >
        <span className={`truncate ${display ? '' : 'text-slate-400 dark:text-slate-500'}`}>
          {display || placeholder || PLACEHOLDERS[type] || PLACEHOLDERS.date}
        </span>
        <Icon className={`h-4 w-4 shrink-0 ${open ? 'text-gold-500' : 'text-slate-400'}`} />
      </button>

      {required && (
        <input
          tabIndex={-1}
          aria-hidden="true"
          required
          name={name}
          value={value || ''}
          onChange={() => {}}
          onFocus={() => triggerRef.current?.focus()}
          className="pointer-events-none absolute bottom-0 left-1/2 h-px w-px opacity-0"
        />
      )}

      {open && (
        <FloatingPanel panelRef={panelRef} style={style} role="dialog" aria-label={PLACEHOLDERS[type]}>
          {type === 'month' && <MonthGrid view={view} setView={setView} selected={date} onPick={pickMonth} />}
          {(type === 'date' || type === 'datetime-local') && (
            <CalendarGrid view={view} setView={setView} selected={date} onPick={pickDay} isOutOfRange={isOutOfRange} />
          )}
          {(type === 'time' || type === 'datetime-local') && (
            <TimeColumns value={time} onPick={pickTime} bordered={type === 'datetime-local'} />
          )}

          <div className="mt-2 flex items-center justify-between border-t border-slate-100 dark:border-white/[0.06] pt-2">
            <button type="button" onClick={setToday} className="premium-link">
              {type === 'time' ? 'Agora' : type === 'month' ? 'Este mês' : 'Hoje'}
            </button>
            <div className="flex items-center gap-1">
              {!required && value && (
                <button type="button" onClick={() => { emit(''); setOpen(false); }} className="premium-link text-slate-400">
                  Limpar
                </button>
              )}
              {(type === 'time' || type === 'datetime-local') && (
                <button type="button" onClick={() => setOpen(false)} className="premium-link">
                  Concluir
                </button>
              )}
            </div>
          </div>
        </FloatingPanel>
      )}
    </div>
  );
}

function PanelHeader({ label, onPrev, onNext }) {
  return (
    <div className="mb-2 flex items-center justify-between px-1">
      <button type="button" onClick={onPrev} className="premium-nav" aria-label="Anterior">
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="font-display text-lg font-semibold text-slate-900 dark:text-gold-100">{label}</span>
      <button type="button" onClick={onNext} className="premium-nav" aria-label="Próximo">
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function CalendarGrid({ view, setView, selected, onPick, isOutOfRange }) {
  const year = view.getFullYear();
  const month = view.getMonth();
  const todayKey = ymd(new Date());
  const selectedKey = selected ? ymd(selected) : '';

  const cells = useMemo(() => {
    const first = new Date(year, month, 1);
    const start = new Date(year, month, 1 - first.getDay());
    return Array.from({ length: 42 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  }, [year, month]);

  return (
    <div>
      <PanelHeader
        label={`${MONTHS[month]} ${year}`}
        onPrev={() => setView(new Date(year, month - 1, 1))}
        onNext={() => setView(new Date(year, month + 1, 1))}
      />
      <div className="grid grid-cols-7 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        {WEEKDAYS.map((d, i) => <div key={i} className="py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((d) => {
          const key = ymd(d);
          const outside = d.getMonth() !== month;
          const disabled = isOutOfRange(d);
          return (
            <button
              key={key}
              type="button"
              disabled={disabled}
              onClick={() => onPick(d)}
              className={`premium-day ${outside ? 'is-outside' : ''} ${key === todayKey ? 'is-today' : ''} ${key === selectedKey ? 'is-selected' : ''}`}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function MonthGrid({ view, setView, selected, onPick }) {
  const year = view.getFullYear();
  return (
    <div>
      <PanelHeader
        label={String(year)}
        onPrev={() => setView(new Date(year - 1, 0, 1))}
        onNext={() => setView(new Date(year + 1, 0, 1))}
      />
      <div className="grid grid-cols-3 gap-1">
        {MONTHS_SHORT.map((m, i) => {
          const isSel = selected && selected.getFullYear() === year && selected.getMonth() === i;
          return (
            <button key={m} type="button" onClick={() => onPick(i)} className={`premium-day !h-10 ${isSel ? 'is-selected' : ''}`}>
              {m}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TimeColumns({ value, onPick, bordered }) {
  const [h, m] = value ? value.split(':') : ['', ''];
  const hoursRef = useRef(null);
  const minutesRef = useRef(null);
  const hours = Array.from({ length: 24 }, (_, i) => pad(i));
  const minutes = Array.from({ length: 12 }, (_, i) => pad(i * 5));
  // Minuto fora do passo de 5 (valor antigo) continua aparecendo na lista
  if (m && !minutes.includes(m)) minutes.push(m);

  useEffect(() => {
    hoursRef.current?.querySelector('[data-selected="true"]')?.scrollIntoView({ block: 'center' });
    minutesRef.current?.querySelector('[data-selected="true"]')?.scrollIntoView({ block: 'center' });
  }, []);

  const col = (list, current, ref, make) => (
    <div ref={ref} className="h-40 flex-1 overflow-y-auto space-y-0.5 pr-0.5">
      {list.map(v => (
        <button
          key={v}
          type="button"
          data-selected={v === current}
          onClick={() => onPick(make(v))}
          className={`premium-option !justify-center ${v === current ? 'is-selected' : ''}`}
        >
          {v}
        </button>
      ))}
    </div>
  );

  return (
    <div className={bordered ? 'mt-2 border-t border-slate-100 dark:border-white/[0.06] pt-2' : ''}>
      <div className="mb-1 flex text-center text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        <span className="flex-1">Hora</span><span className="flex-1">Minuto</span>
      </div>
      <div className="flex gap-1.5">
        {col(hours, h, hoursRef, (v) => `${v}:${m || '00'}`)}
        {col(minutes, m, minutesRef, (v) => `${h || '09'}:${v}`)}
      </div>
    </div>
  );
}
