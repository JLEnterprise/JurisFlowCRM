import React, { useState } from 'react';
import {
  Plus,
  MessageCircle,
  Clock,
  DollarSign,
  User,
  Calendar,
  MoreVertical,
  CheckCircle2,
  FileCheck2,
  AlertTriangle,
  ArrowRight,
  Flame,
  FileText,
  Sparkles,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { useAuth } from '../../context/AuthContext';
import { KANBAN_STAGES } from '../../data/legalAreas';
import { formatCurrency, formatRelativeTime, formatDate } from '../../utils/formatters';
import { TemperatureBadge } from '../common/Badge';
import { Modal } from '../common/Modal';

export function KanbanBoard({ onOpenNewLead, onEditLead, onCloseContract, onNavigate }) {
  const { leads, moveLeadStage, legalAreas } = useCRM();
  const { users } = useAuth();

  const [draggedLeadId, setDraggedLeadId] = useState(null);
  const [lossModalOpen, setLossModalOpen] = useState(false);
  const [pendingLossLeadId, setPendingLossLeadId] = useState(null);
  const [lossReasonInput, setLossReasonInput] = useState('');

  const getUserName = (userId) => {
    const found = (users || []).find(u => u && u.id === userId);
    if (!found) return 'Equipe';
    const nameStr = (found.name || found.email || 'Equipe').trim();
    return nameStr.split(' ')[0] || 'Equipe';
  };

  const getAreaName = (areaId) => {
    const found = (legalAreas || []).find(a => a && a.id === areaId);
    return found ? (found.name ? found.name.replace('Direito ', '') : areaId) : areaId;
  };

  // Drag handlers
  const handleDragStart = (e, leadId) => {
    setDraggedLeadId(leadId);
    e.dataTransfer.setData('text/plain', leadId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetStage) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('text/plain') || draggedLeadId;
    if (!leadId) return;

    if (targetStage === 'fechado_perdido' || targetStage === 'perdido') {
      setPendingLossLeadId(leadId);
      setLossModalOpen(true);
    } else {
      moveLeadStage(leadId, targetStage);
    }
    setDraggedLeadId(null);
  };

  const handleConfirmLoss = (e) => {
    e.preventDefault();
    if (pendingLossLeadId) {
      moveLeadStage(pendingLossLeadId, 'fechado_perdido', lossReasonInput || 'Desistência do cliente');
      setLossModalOpen(false);
      setPendingLossLeadId(null);
      setLossReasonInput('');
    }
  };

  return (
    <div className="space-y-4 animate-fade-in pb-12">
      {/* Top action bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2 font-sans">
            Funil Comercial & Pipeline de Conversão
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Arraste os cards entre as etapas para avançar a negociação em tempo real
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {onNavigate && (
            <button
              onClick={() => onNavigate('leads')}
              className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#111827] px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-all shadow-xs btn-tactile"
            >
              Ver em Tabela
            </button>
          )}
          <button
            onClick={onOpenNewLead}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-brand-600/20 transition-all btn-tactile"
          >
            <Plus className="h-4 w-4" /> Novo Lead
          </button>
        </div>
      </div>

      {/* Kanban Horizontal Scrollable Board */}
      <div className="flex gap-3.5 overflow-x-auto pb-4 pt-1 kanban-column-scroll min-h-[calc(100vh-240px)]">
        {KANBAN_STAGES.map((stage) => {
          const stageLeads = leads.filter((l) => l.stage === stage.id);
          const stageTotalValue = stageLeads.reduce(
            (acc, curr) => acc + (Number(curr.estimatedValue) || 0),
            0
          );

          const isWonStage = stage.id === 'fechado_ganho' || stage.id === 'contrato_fechado';
          const isLostStage = stage.id === 'fechado_perdido' || stage.id === 'perdido';

          return (
            <div
              key={stage.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.id)}
              className="flex w-76 sm:w-80 flex-shrink-0 flex-col rounded-2xl bg-slate-100/80 dark:bg-[#0b0f17]/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] p-3 shadow-xs transition-colors"
            >
              {/* Column Header */}
              <div className="mb-3 flex items-center justify-between border-b border-slate-200/70 dark:border-white/[0.06] pb-2.5">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${
                    isWonStage
                      ? 'bg-emerald-500 shadow-glow-emerald'
                      : isLostStage
                      ? 'bg-rose-500'
                      : 'bg-brand-500'
                  }`} />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {stage.name}
                  </span>
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white dark:bg-white/[0.08] text-[10px] font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/[0.05]">
                    {stageLeads.length}
                  </span>
                </div>

                <div className="text-[11px] font-bold text-slate-600 dark:text-gold-400 font-sans">
                  {formatCurrency(stageTotalValue)}
                </div>
              </div>

              {/* Column Cards Container */}
              <div className="flex-1 space-y-3 overflow-y-auto max-h-[calc(100vh-310px)] pr-1">
                {stageLeads.length === 0 ? (
                  <div className="py-10 text-center text-xs text-slate-400 dark:text-slate-600 border border-dashed border-slate-200 dark:border-white/[0.08] rounded-xl font-medium">
                    Nenhum lead nesta etapa
                  </div>
                ) : (
                  stageLeads.map((lead) => (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, lead.id)}
                      className="group relative rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-white/[0.08] p-4 shadow-sm hover:shadow-xl dark:hover:shadow-brand-500/5 hover:-translate-y-1 hover:border-gold-500/50 dark:hover:border-gold-500/40 cursor-grab active:cursor-grabbing transition-all duration-300 animate-fade-in"
                    >
                      {/* Top row: Area & Temperature */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-brand-500/10 text-brand-700 dark:text-brand-300 border border-brand-500/20">
                          {getAreaName(lead.legalArea)}
                        </span>
                        <TemperatureBadge temperature={lead.temperature} />
                      </div>

                      {/* Lead Name */}
                      <div
                        onClick={() => onEditLead(lead)}
                        className="font-bold text-sm text-slate-900 dark:text-white hover:text-brand-600 dark:hover:text-gold-400 transition-colors cursor-pointer"
                      >
                        {lead.name}
                      </div>

                      {/* Potential value */}
                      <div className="mt-2 flex items-center justify-between text-xs">
                        <span className="font-extrabold text-emerald-600 dark:text-emerald-400 font-sans">
                          {formatCurrency(lead.estimatedValue)}
                        </span>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                          <User className="h-3 w-3" /> {getUserName(lead.assignedTo)}
                        </span>
                      </div>

                      {/* Notes snippet if exists */}
                      {lead.notes && (
                        <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 bg-slate-50 dark:bg-white/[0.02] p-2 rounded-xl border border-slate-100 dark:border-white/[0.04]">
                          {lead.notes}
                        </p>
                      )}

                      {/* Loss Reason if in Perdido */}
                      {isLostStage && lead.lossReason && (
                        <div className="mt-2 text-[10px] text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2 rounded-xl font-medium">
                          Motivo: {lead.lossReason}
                        </div>
                      )}

                      {/* Next Action & Timing footer */}
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

                      {/* Quick Card Action Buttons */}
                      <div className="mt-2.5 flex items-center justify-between pt-1">
                        <a
                          href={`https://wa.me/55${(lead.whatsapp || lead.phone || '').replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                        >
                          <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                        </a>

                        {/* Botão Fechar Contrato */}
                        {!isWonStage && !isLostStage && (
                          <button
                            onClick={() => onCloseContract(lead)}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-2.5 py-1 text-[10px] font-bold text-white shadow-xs transition-colors btn-tactile"
                          >
                            <FileCheck2 className="h-3 w-3" /> Fechar
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Loss Reason Modal */}
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
