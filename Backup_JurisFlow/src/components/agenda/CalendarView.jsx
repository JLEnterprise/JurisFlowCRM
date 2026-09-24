import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  User,
  Trash2,
  Edit,
  Sparkles,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { formatDate } from '../../utils/formatters';
import { Badge } from '../common/Badge';

export const PRESET_EVENT_LABELS = {
  consulta: 'Consulta Jurídica',
  reuniao: 'Reunião Estratégica',
  audiencia: 'Audiência Judicial',
  prazo: 'Prazo Processual',
  retorno: 'Retorno de Caso',
  'follow-up': 'Follow-up Comercial',
  diligencia: 'Diligência Externa',
  atendimento: 'Atendimento Geral',
};

export const formatEventType = (type) => {
  if (!type) return 'Compromisso';
  const clean = String(type).trim();
  if (PRESET_EVENT_LABELS[clean.toLowerCase()]) {
    return PRESET_EVENT_LABELS[clean.toLowerCase()];
  }
  return clean.charAt(0).toUpperCase() + clean.slice(1);
};

export const getEventTypeColor = (type) => {
  const t = (type || '').toLowerCase().trim();
  if (t === 'consulta') return 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300 dark:border-purple-800';
  if (t === 'reuniao') return 'bg-brand-100 text-brand-800 dark:bg-brand-950/60 dark:text-brand-300 border-brand-300 dark:border-brand-800';
  if (t === 'audiencia' || t.includes('audiência') || t.includes('audiencia')) return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800';
  if (t === 'prazo') return 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-800';
  if (t === 'follow-up') return 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300 dark:border-blue-800';
  if (t === 'retorno') return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300 border-cyan-300 dark:border-cyan-800';
  if (t === 'diligencia' || t.includes('diligência') || t.includes('diligencia')) return 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border-teal-300 dark:border-teal-800';
  if (t === 'atendimento') return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
  
  // Estilo dourado premium para qualquer tipo personalizado
  return 'bg-gradient-to-r from-gold-500/15 to-amber-500/15 text-gold-800 dark:text-gold-300 border-gold-400/50 dark:border-gold-500/50';
};

export function CalendarView({ onOpenNewEvent }) {
  const { appointments, deleteAppointment } = useCRM();
  const [viewMode, setViewMode] = useState('month'); // 'month' | 'week' | 'day'
  const [currentDate, setCurrentDate] = useState(new Date('2026-09-02T12:00:00'));

  const nextMonth = () => {
    const next = new Date(currentDate);
    next.setMonth(next.getMonth() + 1);
    setCurrentDate(next);
  };

  const prevMonth = () => {
    const prev = new Date(currentDate);
    prev.setMonth(prev.getMonth() - 1);
    setCurrentDate(prev);
  };

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  // Dias do mês atual (Setembro 2026 tem 30 dias, começa na terça-feira)
  const daysInMonth = Array.from({ length: 30 }, (_, i) => i + 1);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Calendar Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
            <CalendarIcon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white capitalize">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {appointments.length} compromissos agendados
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex rounded-xl bg-slate-100 dark:bg-navy-950 p-1 text-xs">
            <button
              onClick={() => setViewMode('month')}
              className={`rounded-lg px-3 py-1 font-semibold transition-colors ${
                viewMode === 'month' ? 'bg-white dark:bg-navy-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'
              }`}
            >
              Mês
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`rounded-lg px-3 py-1 font-semibold transition-colors ${
                viewMode === 'week' ? 'bg-white dark:bg-navy-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`rounded-lg px-3 py-1 font-semibold transition-colors ${
                viewMode === 'day' ? 'bg-white dark:bg-navy-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'
              }`}
            >
              Dia
            </button>
          </div>

          <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-800 pl-2">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <button
            onClick={() => onOpenNewEvent()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md hover:bg-brand-700 transition-colors"
          >
            <Plus className="h-4 w-4" /> Agendar
          </button>
        </div>
      </div>

      {/* Main Month Grid View */}
      {viewMode === 'month' && (
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-navy-900 shadow-sm overflow-hidden">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-navy-950 text-center text-xs font-bold text-slate-500 dark:text-slate-400 py-3">
            <div>Dom</div>
            <div>Seg</div>
            <div>Ter</div>
            <div>Qua</div>
            <div>Qui</div>
            <div>Sex</div>
            <div>Sáb</div>
          </div>

          {/* Days cells */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 dark:divide-slate-800/60 min-h-[500px]">
            {/* Offset for Setembro 2026 (Começa na terça-feira = 2 vazios) */}
            <div className="p-2 bg-slate-50/30 dark:bg-navy-950/20" />
            <div className="p-2 bg-slate-50/30 dark:bg-navy-950/20" />

            {daysInMonth.map((day) => {
              const dateStr = `2026-09-${day < 10 ? '0' + day : day}`;
              const dayEvents = appointments.filter(a => a.date === dateStr);
              const isToday = day === 2; // Data corrente de demonstração

              return (
                <div
                  key={day}
                  onClick={() => onOpenNewEvent(dateStr)}
                  className={`p-2 min-h-[95px] transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/30 cursor-pointer ${
                    isToday ? 'bg-brand-50/40 dark:bg-brand-950/20' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                        isToday
                          ? 'bg-brand-600 text-white'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {day}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="text-[10px] text-slate-400 font-semibold">
                        {dayEvents.length}
                      </span>
                    )}
                  </div>

                  {/* Event pills inside day */}
                  <div className="space-y-1">
                    {dayEvents.map(evt => {
                      const isCustom = !PRESET_EVENT_LABELS[(evt.type || '').toLowerCase()];
                      return (
                        <div
                          key={evt.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onOpenNewEvent) onOpenNewEvent(evt.date, evt);
                          }}
                          className={`group relative rounded-lg border px-2 py-1 text-[10px] font-semibold truncate transition-all shadow-xs cursor-pointer hover:scale-[1.02] ${getEventTypeColor(evt.type)}`}
                          title={`${evt.startTime} - ${evt.title} (${evt.clientName || 'Geral'}) [${formatEventType(evt.type)}]`}
                        >
                          <div className="truncate flex items-center gap-1">
                            <span className="font-bold shrink-0">{evt.startTime}</span>
                            <span className="truncate">{evt.title}</span>
                            {isCustom && (
                              <Sparkles className="h-2.5 w-2.5 text-gold-500 shrink-0" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Agenda Events Detailed List */}
      <div className="rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          Próximos Compromissos & Audiências da Equipe
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {appointments.map(evt => (
            <div
              key={evt.id}
              className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-navy-950/50 space-y-2 relative"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider border mb-1.5 shadow-xs ${getEventTypeColor(evt.type)}`}>
                    {!PRESET_EVENT_LABELS[(evt.type || '').toLowerCase()] && (
                      <Sparkles className="h-2.5 w-2.5 text-gold-600 dark:text-gold-400 shrink-0" />
                    )}
                    <span>{formatEventType(evt.type)}</span>
                  </span>
                  <div className="font-bold text-sm text-slate-900 dark:text-white">
                    {evt.title}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onOpenNewEvent && onOpenNewEvent(evt.date, evt)}
                    className="p-1 text-slate-400 hover:text-brand-600 dark:hover:text-gold-400 transition-colors"
                    title="Editar compromisso"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Deseja cancelar o compromisso "${evt.title}"?`)) {
                        deleteAppointment(evt.id);
                      }
                    }}
                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                    title="Cancelar evento"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400 pt-1">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-brand-500" />
                  <span>{formatDate(evt.date)} às {evt.startTime}</span>
                </div>
                <div className="flex items-center gap-1.5 truncate">
                  <User className="h-3.5 w-3.5 text-purple-500" />
                  <span className="truncate">{evt.clientName}</span>
                </div>
              </div>

              {evt.location && (
                <div className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-1 border-t border-slate-200/50 dark:border-slate-800">
                  <MapPin className="h-3.5 w-3.5 text-rose-500" />
                  <span>{evt.location}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
