import React, { useMemo, useState } from 'react';
import { AlertTriangle, CalendarClock, CheckCircle2, ChevronDown, Clock, Coins, ListChecks } from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/formatters';
import {
  instAmount, instDue, instPaidOn, isPaid, todayStr, addDays,
} from '../financial/financeUtils';

const dayOf = (v) => String(v || '').split('T')[0];
const brl = (v) => formatCurrency(v).replace(/,00$/, '');

// Resumo do dia no rodapé do menu: entradas, tarefas e avisos úteis.
// Fica fixo embaixo; os grupos do menu rolam por cima sem empurrar o painel.
export function SidebarToday({ onNavigate }) {
  const { installments = [], tasks = [], appointments = [] } = useCRM();
  const { currentUser, permissions } = useAuth();

  const [minimized, setMinimized] = useState(() => {
    try {
      const saved = window.localStorage.getItem('jurisflow_resumo_dia');
      if (saved !== null) return saved === '1';
    } catch { /* sem storage */ }
    return window.innerHeight < 760; // telas baixas começam compactas
  });
  const toggle = () => {
    setMinimized(prev => {
      try { window.localStorage.setItem('jurisflow_resumo_dia', prev ? '0' : '1'); } catch { /* sem storage */ }
      return !prev;
    });
  };

  const showMoney = !!permissions?.canAccessFinancial;
  const seeAll = !!permissions?.canViewAllAgendas;

  const data = useMemo(() => {
    const today = todayStr();
    const tomorrow = addDays(today, 1);

    // Dinheiro
    const dueToday = installments.filter(i => instDue(i) === today);
    const expected = dueToday.reduce((a, i) => a + instAmount(i), 0);
    const received = installments.filter(i => isPaid(i) && instPaidOn(i) === today).reduce((a, i) => a + instAmount(i), 0);
    const overdueInst = installments.filter(i => !isPaid(i) && instDue(i) && instDue(i) < today);
    const tomorrowInst = installments.filter(i => !isPaid(i) && instDue(i) === tomorrow);

    // Tarefas (advogado vê só as suas; secretaria/sócios veem as do escritório)
    const mine = seeAll ? tasks : tasks.filter(t => !t.assignedTo && !t.assigned_to ? true : String(t.assignedTo || t.assigned_to) === String(currentUser?.id));
    const open = mine.filter(t => t && t.status !== 'completed' && t.status !== 'refused');
    const openDue = open.filter(t => dayOf(t.dueDate || t.due_date) && dayOf(t.dueDate || t.due_date) <= today);
    const overdueTasks = open.filter(t => dayOf(t.dueDate || t.due_date) && dayOf(t.dueDate || t.due_date) < today);
    const doneToday = mine.filter(t => t.status === 'completed' && dayOf(t.completedAt || t.completed_at) === today);
    const tomorrowTasks = open.filter(t => dayOf(t.dueDate || t.due_date) === tomorrow);

    // Próximo compromisso de hoje
    const nowHm = new Date().toTimeString().slice(0, 5);
    const nextApt = appointments
      .filter(a => dayOf(a.date) === today && (a.startTime || a.time || '99:99') >= nowHm)
      .sort((a, b) => String(a.startTime || a.time).localeCompare(String(b.startTime || b.time)))[0];

    return {
      expected, received, dueTodayCount: dueToday.length,
      overdueInst, tomorrowInst,
      taskTotal: openDue.length + doneToday.length, taskDone: doneToday.length,
      overdueTasks, tomorrowTasks, nextApt,
    };
  }, [installments, tasks, appointments, seeAll, currentUser?.id]);

  // Avisos em ordem de urgência (no máximo 3)
  const alerts = [];
  if (showMoney && data.overdueInst.length) {
    alerts.push({ tone: 'rose', icon: AlertTriangle, text: `${data.overdueInst.length} parcela(s) em atraso`, tab: 'financial' });
  }
  if (data.overdueTasks.length) {
    alerts.push({ tone: 'rose', icon: AlertTriangle, text: `${data.overdueTasks.length} prazo(s) vencido(s)`, tab: 'tasks' });
  }
  if (data.nextApt) {
    alerts.push({ tone: 'gold', icon: CalendarClock, text: `${data.nextApt.startTime || data.nextApt.time || ''} · ${data.nextApt.title || 'Compromisso'}`, tab: 'agenda' });
  }
  if (data.tomorrowTasks.length) {
    alerts.push({ tone: 'slate', icon: Clock, text: `${data.tomorrowTasks.length} tarefa(s) vencem amanhã`, tab: 'tasks' });
  }
  if (showMoney && data.tomorrowInst.length) {
    alerts.push({ tone: 'slate', icon: Coins, text: `${data.tomorrowInst.length} parcela(s) vencem amanhã`, tab: 'financial' });
  }
  const shownAlerts = alerts.slice(0, 3);
  const urgent = alerts.filter(a => a.tone === 'rose').length;

  const moneyPct = data.expected > 0 ? Math.min(100, (data.received / data.expected) * 100) : data.received > 0 ? 100 : 0;
  const taskPct = data.taskTotal > 0 ? (data.taskDone / data.taskTotal) * 100 : 0;
  const dateLabel = new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' }).replace(/\./g, '');

  const go = (tab) => onNavigate && onNavigate(tab);

  return (
    <div className="sidebar-today mx-3 mb-3 rounded-2xl border border-gold-500/20 bg-gradient-to-b from-gold-500/[0.06] to-transparent">
      <button type="button" onClick={toggle} className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left" aria-expanded={!minimized}>
        <span className="flex items-baseline gap-2">
          <span className="font-label text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-700 dark:text-gold-300">Hoje</span>
          <span className="text-[10px] text-slate-400">{dateLabel}</span>
        </span>
        <span className="flex items-center gap-1.5">
          {minimized && urgent > 0 && (
            <span className="rounded-full bg-rose-500 px-1.5 text-[9px] font-bold leading-4 text-white">{urgent}</span>
          )}
          {minimized && (
            <span className="font-numeric text-[10px] text-slate-500 dark:text-slate-400">
              {data.taskDone}/{data.taskTotal} tarefas
            </span>
          )}
          <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${minimized ? '-rotate-90' : ''}`} />
        </span>
      </button>

      {!minimized && (
        <div className="space-y-3 px-3 pb-3 animate-fade-in">
          {showMoney && (
            <button type="button" onClick={() => go('financial')} className="block w-full text-left">
              <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-1"><Coins className="h-3 w-3 text-gold-600 dark:text-gold-400" /> Entradas</span>
                <span>{data.dueTodayCount ? `${data.dueTodayCount} prevista(s)` : 'nada previsto'}</span>
              </div>
              <div className="mt-1 flex items-baseline gap-1 font-numeric">
                <span className="text-sm font-semibold text-slate-900 dark:text-white">{brl(data.received)}</span>
                <span className="text-[10px] text-slate-400">de {brl(data.expected)}</span>
              </div>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/[0.07]">
                <div className="h-full rounded-full bg-gradient-to-r from-gold-500 to-emerald-500 transition-all duration-500" style={{ width: `${moneyPct}%` }} />
              </div>
            </button>
          )}

          <button type="button" onClick={() => go('tasks')} className="block w-full text-left">
            <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1"><ListChecks className="h-3 w-3 text-gold-600 dark:text-gold-400" /> Tarefas do dia</span>
              <span>{data.taskTotal - data.taskDone} a fazer</span>
            </div>
            <div className="mt-1 flex items-baseline gap-1 font-numeric">
              <span className="text-sm font-semibold text-slate-900 dark:text-white">{data.taskDone}</span>
              <span className="text-[10px] text-slate-400">de {data.taskTotal} concluídas</span>
            </div>
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/[0.07]">
              <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${taskPct}%` }} />
            </div>
          </button>

          <div className="space-y-1 border-t border-slate-200/70 pt-2.5 dark:border-white/[0.06]">
            {shownAlerts.length === 0 ? (
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" /> Tudo em dia
              </div>
            ) : shownAlerts.map((a, idx) => {
              const Icon = a.icon;
              const tone = a.tone === 'rose' ? 'text-rose-600 dark:text-rose-400' : a.tone === 'gold' ? 'text-gold-700 dark:text-gold-300' : 'text-slate-500 dark:text-slate-400';
              return (
                <button key={idx} type="button" onClick={() => go(a.tab)} className={`flex w-full items-center gap-1.5 rounded-md py-0.5 text-left text-[11px] hover:underline ${tone}`}>
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{a.text}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
