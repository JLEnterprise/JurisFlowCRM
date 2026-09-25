import React, { useMemo, useRef, useState } from 'react';
import { useHorizontalWheel } from '../../utils/useHorizontalWheel';
import {
  Plus,
  MessageCircle,
  Clock,
  User,
  Calendar,
  FileCheck2,
  XCircle,
  Trophy,
  ChevronDown,
  Columns3,
  List,
  RotateCcw,
  Download,
  Inbox,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { useAuth } from '../../context/AuthContext';
import { KANBAN_STAGES } from '../../data/legalAreas';
import { formatCurrency, formatRelativeTime, formatDate } from '../../utils/formatters';
import { isInPeriod, getPeriodLabel, toMonthKey, formatMonthKey } from '../../utils/period';
import { TemperatureBadge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { PeriodFilter } from '../common/PeriodFilter';
import { Select } from '../common/Select';

const WON_STAGE = 'contrato_fechado';
const LOST_STAGE = 'perdido';
const ACTIVE_STAGES = KANBAN_STAGES.filter(s => s.id !== WON_STAGE && s.id !== LOST_STAGE);
const VIEW_STORAGE_KEY = 'jurisflow_funil_view';

// Data de entrada do lead no funil (filtro de período nas visões Kanban e Lista)
const entryDate = (lead) => lead.createdAt || lead.firstContactDate;
// Data em que foi ganho/perdido (filtro e agrupamento das planilhas)
const closedDate = (lead) => lead.closedAt || lead.lastContactDate || lead.createdAt;

function loadView() {
  try {
    return window.localStorage.getItem(VIEW_STORAGE_KEY) || 'kanban';
  } catch {
    return 'kanban';
  }
}

export function KanbanBoard({ onOpenNewLead, onEditLead, onCloseContract }) {
  const { leads = [], moveLeadStage, legalAreas, periodFilter } = useCRM();
  const { users } = useAuth();

  const [view, setView] = useState(loadView);
  const [draggedLeadId, setDraggedLeadId] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const [lossModalOpen, setLossModalOpen] = useState(false);
  const [pendingLossLeadId, setPendingLossLeadId] = useState(null);
  const [lossReasonInput, setLossReasonInput] = useState('');

  const changeView = (next) => {
    setView(next);
    try { window.localStorage.setItem(VIEW_STORAGE_KEY, next); } catch { /* sem storage: só não lembra */ }
  };

  const getUserName = (userId) => {
    const found = (users || []).find(u => u && u.id === userId);
    if (!found) return 'Equipe';
    return (found.name || found.email || 'Equipe').trim().split(' ')[0] || 'Equipe';
  };

  const getAreaName = (areaId) => {
    const found = (legalAreas || []).find(a => a && a.id === areaId);
    return found ? (found.name ? found.name.replace('Direito ', '') : areaId) : (areaId || '—');
  };

  const period = periodFilter || 'all';
  const activeLeads = useMemo(
    () => leads.filter(l => l && l.stage !== WON_STAGE && l.stage !== LOST_STAGE && isInPeriod(entryDate(l), period)),
    [leads, period]
  );
  const wonLeads = useMemo(
    () => leads.filter(l => l && l.stage === WON_STAGE && isInPeriod(closedDate(l), period)),
    [leads, period]
  );
  const lostLeads = useMemo(
    () => leads.filter(l => l && l.stage === LOST_STAGE && isInPeriod(closedDate(l), period)),
    [leads, period]
  );

  // --- Mover leads ---
  const requestMove = (leadId, targetStage) => {
    if (!leadId) return;
    if (targetStage === LOST_STAGE) {
      setPendingLossLeadId(leadId);
      setLossReasonInput('');
      setLossModalOpen(true);
    } else {
      moveLeadStage(leadId, targetStage);
    }
  };

  const handleDragStart = (e, leadId) => {
    setDraggedLeadId(leadId);
    e.dataTransfer.setData('text/plain', leadId);
  };

  const handleDragOver = (e, stageId) => {
    e.preventDefault();
    if (dropTarget !== stageId) setDropTarget(stageId);
  };

  const handleDrop = (e, targetStage) => {
    e.preventDefault();
    requestMove(e.dataTransfer.getData('text/plain') || draggedLeadId, targetStage);
    setDraggedLeadId(null);
    setDropTarget(null);
  };

  const handleConfirmLoss = (e) => {
    e.preventDefault();
    if (pendingLossLeadId) {
      moveLeadStage(pendingLossLeadId, LOST_STAGE, { lossReason: lossReasonInput.trim() || 'Não informado' });
    }
    setLossModalOpen(false);
    setPendingLossLeadId(null);
    setLossReasonInput('');
  };

  const views = [
    { id: 'kanban', label: 'Kanban', icon: Columns3 },
    { id: 'lista', label: 'Lista', icon: List },
    { id: 'ganhos', label: 'Ganhos', icon: Trophy, count: wonLeads.length },
    { id: 'perdidos', label: 'Perdidos', icon: XCircle, count: lostLeads.length },
  ];

  return (
    <div className="space-y-5 animate-fade-in pb-12">
      {/* Barra de opções */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="funil-tabs" role="tablist" aria-label="Visualização do funil">
          {views.map(({ id, label, icon: Icon, count }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={view === id}
              onClick={() => changeView(id)}
              className={`funil-tab ${view === id ? 'is-active' : ''} ${id === 'ganhos' ? 'is-won' : ''} ${id === 'perdidos' ? 'is-lost' : ''}`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{label}</span>
              {count !== undefined && <span className="funil-tab__count">{count}</span>}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <PeriodFilter className="lg:hidden" align="right" />
          <button
            onClick={onOpenNewLead}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-700 via-brand-600 to-brand-500 px-4 py-2 text-xs font-semibold tracking-wide text-white shadow-md shadow-brand-900/20 hover:brightness-110 transition btn-tactile"
          >
            <Plus className="h-4 w-4" /> Novo Lead
          </button>
        </div>
      </div>

      {(view === 'kanban' || view === 'lista') && period !== 'all' && (
        <p className="text-[11px] text-slate-500 dark:text-slate-400 -mt-2">
          Mostrando leads que entraram no funil em <span className="font-semibold text-slate-700 dark:text-slate-200">{getPeriodLabel(period).toLowerCase()}</span>.
        </p>
      )}

      {view === 'kanban' && (
        <KanbanView
          activeLeads={activeLeads}
          wonCount={wonLeads.length}
          lostCount={lostLeads.length}
          dropTarget={dropTarget}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragLeave={() => setDropTarget(null)}
          onDrop={handleDrop}
          onEditLead={onEditLead}
          onCloseContract={onCloseContract}
          onMarkLost={(id) => requestMove(id, LOST_STAGE)}
          getUserName={getUserName}
          getAreaName={getAreaName}
        />
      )}

      {view === 'lista' && (
        <GroupedListView
          activeLeads={activeLeads}
          onEditLead={onEditLead}
          onCloseContract={onCloseContract}
          onMove={requestMove}
          getUserName={getUserName}
          getAreaName={getAreaName}
        />
      )}

      {(view === 'ganhos' || view === 'perdidos') && (
        <ClosedLeadsSheet
          type={view === 'ganhos' ? 'won' : 'lost'}
          items={view === 'ganhos' ? wonLeads : lostLeads}
          period={period}
          onEditLead={onEditLead}
          onReopen={(id) => moveLeadStage(id, 'negociacao')}
          getUserName={getUserName}
          getAreaName={getAreaName}
        />
      )}

      {/* Motivo da perda */}
      <Modal
        isOpen={lossModalOpen}
        onClose={() => setLossModalOpen(false)}
        title="Registrar Motivo da Perda do Lead"
      >
        <form onSubmit={handleConfirmLoss} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Descreva por que a negociação não foi convertida:
            </label>
            <textarea
              rows={3}
              required
              value={lossReasonInput}
              onChange={(e) => setLossReasonInput(e.target.value)}
              placeholder="Ex: Valor dos honorários acima do orçamento do cliente / Optou por defensoria pública / Acordo extrajudicial prévio..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0b0f17] p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setLossModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm"
            >
              Confirmar Perda
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

/* ============================== KANBAN ============================== */


function KanbanView({
  activeLeads, wonCount, lostCount, dropTarget, onDragStart, onDragOver, onDragLeave, onDrop,
  onEditLead, onCloseContract, onMarkLost, getUserName, getAreaName,
}) {
  const boardRef = useRef(null);
  useHorizontalWheel(boardRef);

  return (
    <div ref={boardRef} className="flex gap-3.5 overflow-x-auto pb-4 pt-1 kanban-column-scroll min-h-[calc(100vh-250px)]">
      {ACTIVE_STAGES.map((stage) => {
        const stageLeads = activeLeads.filter((l) => l.stage === stage.id);
        const total = stageLeads.reduce((acc, l) => acc + (Number(l.estimatedValue) || 0), 0);

        return (
          <div
            key={stage.id}
            onDragOver={(e) => onDragOver(e, stage.id)}
            onDragLeave={onDragLeave}
            onDrop={(e) => onDrop(e, stage.id)}
            className={`flex w-76 sm:w-80 flex-shrink-0 flex-col rounded-2xl bg-slate-100/80 dark:bg-[#0b0f17]/80 border p-3 transition-colors ${
              dropTarget === stage.id ? 'border-gold-500/50' : 'border-slate-200/80 dark:border-white/[0.08]'
            }`}
          >
            <div className="mb-3 flex items-center justify-between border-b border-slate-200/70 dark:border-white/[0.06] pb-2.5">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rotate-45 bg-gold-500/80" />
                <span className="font-display text-[1.05rem] font-semibold leading-none text-slate-900 dark:text-white">{stage.name}</span>
                <span className="flex h-5 min-w-[1.25rem] px-1 items-center justify-center rounded-full bg-white dark:bg-white/[0.08] text-[10px] font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/[0.05]">
                  {stageLeads.length}
                </span>
              </div>
              <div className="text-[11px] font-semibold tracking-wide text-slate-600 dark:text-gold-300/90">{formatCurrency(total)}</div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto max-h-[calc(100vh-320px)] pr-1">
              {stageLeads.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400 dark:text-slate-600 border border-dashed border-slate-200 dark:border-white/[0.08] rounded-xl font-medium">
                  Nenhum lead nesta etapa
                </div>
              ) : (
                stageLeads.map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    onDragStart={onDragStart}
                    onEditLead={onEditLead}
                    onCloseContract={onCloseContract}
                    onMarkLost={onMarkLost}
                    getUserName={getUserName}
                    getAreaName={getAreaName}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}

      {/* Destinos finais: soltar aqui envia para as planilhas de Ganhos/Perdidos */}
      <div className="flex w-52 flex-shrink-0 flex-col gap-3.5">
        {[
          { id: WON_STAGE, label: 'Ganho', hint: 'Solte aqui para marcar como ganho', count: wonCount, icon: Trophy, tone: 'emerald' },
          { id: LOST_STAGE, label: 'Perdido', hint: 'Solte aqui para marcar como perdido', count: lostCount, icon: XCircle, tone: 'rose' },
        ].map(({ id, label, hint, count, icon: Icon, tone }) => (
          <div
            key={id}
            onDragOver={(e) => onDragOver(e, id)}
            onDragLeave={onDragLeave}
            onDrop={(e) => onDrop(e, id)}
            className={`flex flex-1 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed p-4 text-center transition-colors ${
              dropTarget === id
                ? tone === 'emerald' ? 'border-emerald-500/70 bg-emerald-500/10' : 'border-rose-500/70 bg-rose-500/10'
                : 'border-slate-300 dark:border-white/[0.1]'
            }`}
          >
            <Icon className={`h-5 w-5 ${tone === 'emerald' ? 'text-emerald-500' : 'text-rose-500'}`} />
            <div className="text-xs font-bold text-slate-800 dark:text-white">
              {label} <span className="font-medium text-slate-400">· {count}</span>
            </div>
            <p className="text-[10px] leading-snug text-slate-400">{hint}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function LeadCard({ lead, onDragStart, onEditLead, onCloseContract, onMarkLost, getUserName, getAreaName }) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, lead.id)}
      className="group relative rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-white/[0.08] p-4 shadow-sm hover:shadow-xl hover:-translate-y-0.5 hover:border-gold-500/50 dark:hover:border-gold-500/40 cursor-grab active:cursor-grabbing transition-all duration-300 animate-fade-in"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-brand-500/10 text-brand-700 dark:text-brand-300 border border-brand-500/20">
          {getAreaName(lead.legalArea)}
        </span>
        <TemperatureBadge temperature={lead.temperature} />
      </div>

      <button
        type="button"
        onClick={() => onEditLead(lead)}
        className="block text-left font-display text-[1.1rem] font-semibold leading-tight text-slate-900 dark:text-white hover:text-brand-600 dark:hover:text-gold-400 transition-colors"
      >
        {lead.name}
      </button>

      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{formatCurrency(lead.estimatedValue)}</span>
        <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
          <User className="h-3 w-3" /> {getUserName(lead.assignedTo)}
        </span>
      </div>

      {lead.notes && (
        <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 bg-slate-50 dark:bg-white/[0.02] p-2 rounded-xl border border-slate-100 dark:border-white/[0.04]">
          {lead.notes}
        </p>
      )}

      <div className="mt-3 flex items-center justify-between border-t border-slate-100 dark:border-white/[0.06] pt-2 text-[10px] text-slate-400">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3 text-gold-500" />
          {formatRelativeTime(lead.lastContactDate)}
        </span>
        {lead.nextActionDate && (
          <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1" title="Próximo follow-up">
            <Calendar className="h-3 w-3" />
            {formatDate(lead.nextActionDate)}
          </span>
        )}
      </div>

      <div className="mt-2.5 flex items-center justify-between pt-1">
        <a
          href={`https://wa.me/55${(lead.whatsapp || lead.phone || '').replace(/\D/g, '')}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
        >
          <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
        </a>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onMarkLost(lead.id)}
            className="rounded-lg p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
            title="Marcar como perdido"
            aria-label="Marcar como perdido"
          >
            <XCircle className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onCloseContract(lead)}
            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-2.5 py-1 text-[10px] font-bold text-white shadow-xs transition-colors btn-tactile"
          >
            <FileCheck2 className="h-3 w-3" /> Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ======================= LISTA AGRUPADA POR ETAPA ======================= */

function GroupedListView({ activeLeads, onEditLead, onCloseContract, onMove, getUserName, getAreaName }) {
  const [collapsed, setCollapsed] = useState({});
  const toggle = (id) => setCollapsed(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="space-y-4">
      {ACTIVE_STAGES.map((stage) => {
        const stageLeads = activeLeads.filter(l => l.stage === stage.id);
        const total = stageLeads.reduce((acc, l) => acc + (Number(l.estimatedValue) || 0), 0);
        const isOpen = !collapsed[stage.id];

        return (
          <section key={stage.id} className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#111827] overflow-hidden">
            <button
              type="button"
              onClick={() => toggle(stage.id)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
            >
              <span className="flex items-center gap-2.5">
                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? '' : '-rotate-90'}`} />
                <span className="h-1.5 w-1.5 rotate-45 bg-gold-500/80" />
                <span className="font-display text-lg font-semibold leading-none text-slate-900 dark:text-white">{stage.name}</span>
                <span className="rounded-full bg-slate-100 dark:bg-white/[0.06] px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                  {stageLeads.length}
                </span>
              </span>
              <span className="text-xs font-bold text-slate-600 dark:text-gold-400">{formatCurrency(total)}</span>
            </button>

            {isOpen && (
              stageLeads.length === 0 ? (
                <div className="border-t border-slate-100 dark:border-white/[0.05] px-4 py-4 text-xs text-slate-400">
                  Nenhum lead nesta etapa.
                </div>
              ) : (
                <div className="border-t border-slate-100 dark:border-white/[0.05]">
                  {/* Cabeçalho das colunas (desktop) */}
                  <div className="hidden md:grid grid-cols-[minmax(0,2fr)_90px_120px_110px_110px_150px_auto] gap-3 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                    <span>Lead</span><span>Temperatura</span><span>Valor</span><span>Responsável</span><span>Próx. ação</span><span>Etapa</span><span className="text-right">Ações</span>
                  </div>
                  {stageLeads.map(lead => (
                    <div
                      key={lead.id}
                      className="grid grid-cols-2 md:grid-cols-[minmax(0,2fr)_90px_120px_110px_110px_150px_auto] items-center gap-x-3 gap-y-2 border-t border-slate-100 dark:border-white/[0.04] px-4 py-3 hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="col-span-2 md:col-span-1 min-w-0">
                        <button
                          type="button"
                          onClick={() => onEditLead(lead)}
                          className="block max-w-full truncate text-left font-display text-[1.05rem] font-semibold text-slate-900 dark:text-white hover:text-brand-600 dark:hover:text-gold-400"
                        >
                          {lead.name}
                        </button>
                        <div className="text-[11px] text-slate-400 truncate">
                          {getAreaName(lead.legalArea)} · entrou {formatDate(entryDate(lead))}
                        </div>
                      </div>
                      <div><TemperatureBadge temperature={lead.temperature} /></div>
                      <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 text-right md:text-left">{formatCurrency(lead.estimatedValue)}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1"><User className="h-3 w-3" />{getUserName(lead.assignedTo)}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 text-right md:text-left">
                        {lead.nextActionDate ? formatDate(lead.nextActionDate) : '—'}
                      </div>
                      <Select
                        value={lead.stage}
                        onChange={(e) => onMove(lead.id, e.target.value)}
                        aria-label={`Etapa de ${lead.name}`}
                        className="col-span-2 md:col-span-1 w-full rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] px-2 py-1.5 text-[11px] font-medium text-slate-700 dark:text-slate-200 focus:border-gold-500/60 focus:outline-none dark:[color-scheme:dark]"
                      >
                        {ACTIVE_STAGES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        <option value={WON_STAGE}>✓ Ganho</option>
                        <option value={LOST_STAGE}>✕ Perdido</option>
                      </Select>
                      <div className="col-span-2 md:col-span-1 flex items-center justify-end gap-1.5">
                        <a
                          href={`https://wa.me/55${(lead.whatsapp || lead.phone || '').replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                          title="WhatsApp"
                          aria-label="WhatsApp"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </a>
                        <button
                          type="button"
                          onClick={() => onCloseContract(lead)}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-2.5 py-1 text-[10px] font-bold text-white transition-colors"
                        >
                          <FileCheck2 className="h-3 w-3" /> Fechar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </section>
        );
      })}
    </div>
  );
}

/* ================= PLANILHAS DE LEADS GANHOS / PERDIDOS ================= */

function ClosedLeadsSheet({ type, items, period, onEditLead, onReopen, getUserName, getAreaName }) {
  const isWon = type === 'won';
  const total = items.reduce((acc, l) => acc + (Number(l.estimatedValue) || 0), 0);

  // Agrupa por mês de fechamento, do mais recente para o mais antigo
  const groups = useMemo(() => {
    const map = new Map();
    [...items]
      .sort((a, b) => String(closedDate(b) || '').localeCompare(String(closedDate(a) || '')))
      .forEach(l => {
        const key = toMonthKey(closedDate(l));
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(l);
      });
    return [...map.entries()];
  }, [items]);

  const topReason = useMemo(() => {
    if (isWon) return null;
    const counts = {};
    items.forEach(l => {
      const r = (l.lossReason || 'Não informado').trim();
      counts[r] = (counts[r] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';
  }, [items, isWon]);

  const exportCsv = () => {
    const header = ['Data de fechamento', 'Lead', 'Área', 'Origem', 'Responsável', 'Valor (R$)', 'Telefone', 'E-mail'];
    if (!isWon) header.push('Motivo da perda');
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = items.map(l => {
      const row = [
        formatDate(closedDate(l)),
        l.name,
        getAreaName(l.legalArea),
        l.source || '',
        getUserName(l.assignedTo),
        (Number(l.estimatedValue) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
        l.whatsapp || l.phone || '',
        l.email || '',
      ];
      if (!isWon) row.push(l.lossReason || '');
      return row.map(esc).join(';');
    });
    // BOM + ";" para o Excel em português abrir com acentos e colunas certas
    const csv = '﻿' + [header.map(esc).join(';'), ...rows].join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-${isWon ? 'ganhos' : 'perdidos'}-${period.replace(':', '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const stats = isWon
    ? [
        { label: 'Leads ganhos', value: items.length },
        { label: 'Valor fechado', value: formatCurrency(total) },
        { label: 'Ticket médio', value: formatCurrency(items.length ? total / items.length : 0) },
      ]
    : [
        { label: 'Leads perdidos', value: items.length },
        { label: 'Valor perdido', value: formatCurrency(total) },
        { label: 'Motivo mais comum', value: topReason, small: true },
      ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {stats.map(s => (
          <div key={s.label} className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#111827] px-4 py-3">
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">{s.label}</div>
            <div className={`mt-1 font-bold text-slate-900 dark:text-white truncate ${s.small ? 'text-sm' : 'text-xl'}`} title={String(s.value)}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {isWon ? 'Ganhos' : 'Perdidos'} em <span className="font-semibold text-slate-700 dark:text-slate-200">{getPeriodLabel(period).toLowerCase()}</span>, agrupados pelo mês de fechamento. Troque o período no seletor do topo.
        </p>
        <button
          type="button"
          onClick={exportCsv}
          disabled={items.length === 0}
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-white/[0.1] px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:border-gold-500/50 disabled:opacity-40 transition-colors"
        >
          <Download className="h-3.5 w-3.5" /> Exportar planilha
        </button>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-200 dark:border-white/[0.08] py-14 text-center">
          <Inbox className="h-6 w-6 text-slate-400" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Nenhum lead {isWon ? 'ganho' : 'perdido'} neste período
          </p>
          <p className="text-xs text-slate-400">
            {isWon ? 'Ao fechar um contrato, o lead aparece aqui.' : 'Ao marcar um lead como perdido, ele aparece aqui com o motivo.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#111827]">
          <table className="w-full min-w-[720px] text-left text-xs">
            <thead>
              <tr className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Lead</th>
                <th className="px-4 py-3">Área</th>
                <th className="px-4 py-3">Responsável</th>
                {!isWon && <th className="px-4 py-3">Motivo</th>}
                <th className="px-4 py-3 text-right">Valor</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            {groups.map(([monthKey, monthLeads]) => {
              const monthTotal = monthLeads.reduce((acc, l) => acc + (Number(l.estimatedValue) || 0), 0);
              return (
                <tbody key={monthKey}>
                  <tr className="bg-slate-50 dark:bg-white/[0.03] border-t border-slate-100 dark:border-white/[0.05]">
                    <td colSpan={isWon ? 4 : 5} className="px-4 py-2 font-display text-sm font-semibold text-slate-800 dark:text-gold-100">
                      {monthKey === 'sem-data' ? 'Sem data' : formatMonthKey(monthKey)}
                      <span className="ml-2 font-sans text-[11px] font-medium text-slate-400">
                        {monthLeads.length} {monthLeads.length === 1 ? 'lead' : 'leads'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right font-bold text-slate-700 dark:text-slate-200">{formatCurrency(monthTotal)}</td>
                    <td />
                  </tr>
                  {monthLeads.map(l => (
                    <tr key={l.id} className="border-t border-slate-100 dark:border-white/[0.04] hover:bg-slate-50/70 dark:hover:bg-white/[0.02]">
                      <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">{formatDate(closedDate(l))}</td>
                      <td className="px-4 py-2.5">
                        <button
                          type="button"
                          onClick={() => onEditLead(l)}
                          className="text-left font-semibold text-slate-900 dark:text-white hover:text-brand-600 dark:hover:text-gold-400"
                        >
                          {l.name}
                        </button>
                      </td>
                      <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">{getAreaName(l.legalArea)}</td>
                      <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">{getUserName(l.assignedTo)}</td>
                      {!isWon && (
                        <td className="px-4 py-2.5 text-rose-600 dark:text-rose-400 max-w-[220px] truncate" title={l.lossReason}>
                          {l.lossReason || 'Não informado'}
                        </td>
                      )}
                      <td className={`px-4 py-2.5 text-right font-bold whitespace-nowrap ${isWon ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300'}`}>
                        {formatCurrency(l.estimatedValue)}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => onReopen(l.id)}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-500 hover:text-brand-600 dark:hover:text-gold-400 hover:bg-slate-100 dark:hover:bg-white/[0.05]"
                          title="Voltar o lead para o funil (etapa Negociação)"
                        >
                          <RotateCcw className="h-3 w-3" /> Reabrir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              );
            })}
          </table>
        </div>
      )}
    </div>
  );
}
