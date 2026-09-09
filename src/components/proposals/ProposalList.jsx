import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Filter,
  FileCheck2,
  Printer,
  Edit,
  Trash2,
  Copy,
  ArrowRight,
  Sparkles,
  Eye,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Badge } from '../common/Badge';
import { EmptyState } from '../common/EmptyState';
import { ConfirmModal } from '../common/ConfirmModal';
import { ProposalDetailModal } from './ProposalDetailModal';
import { pdfService } from '../../services/pdfService';
import { PROPOSAL_STATUSES } from '../../data/legalAreas';

export function ProposalList({ onOpenNewProposal, onEditProposal, onConvertToContract }) {
  const { proposals = [], deleteProposal, addProposal, officeSettings = {}, showToast, logActivity, legalAreas = [] } = useCRM();
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedArea, setSelectedArea] = useState('');

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [proposalToDelete, setProposalToDelete] = useState(null);

  // View modal state
  const [selectedProposalForView, setSelectedProposalForView] = useState(null);

  const filteredProposals = useMemo(() => {
    return (proposals || [])
      .filter(p => {
        if (!p) return false;
        const term = (search || '').toLowerCase().trim();
        const proposalNumber = String(p.proposalNumber || p.proposal_number || '').toLowerCase();
        const clientName = String(p.clientName || p.client_name || p.leadName || p.lead_name || '').toLowerCase();
        const serviceName = String(p.serviceName || p.service_name || p.title || '').toLowerCase();
        const legalArea = String(p.legalArea || p.legal_area || '').toLowerCase();

        const matchesSearch = !term ||
          proposalNumber.includes(term) ||
          clientName.includes(term) ||
          serviceName.includes(term) ||
          legalArea.includes(term);

        const matchesStatus = !selectedStatus || (p.status || 'rascunho') === selectedStatus;
        const matchesArea = !selectedArea || (p.legalArea || p.legal_area) === selectedArea;

        return matchesSearch && matchesStatus && matchesArea;
      })
      .sort((a, b) => {
        // Ordenação fixa e determinística (evita qualquer instabilidade visual ou troca de ordem)
        const getTime = (item) => {
          const raw = item.createdAt || item.created_at || item.sentDate || item.sent_date;
          if (!raw) return 0;
          const t = new Date(raw).getTime();
          return Number.isFinite(t) ? t : 0;
        };
        const timeA = getTime(a);
        const timeB = getTime(b);
        if (timeB !== timeA) return timeB - timeA;

        // Desempate consistente por número de proposta / ID
        const keyA = String(a.proposalNumber || a.proposal_number || a.id || '');
        const keyB = String(b.proposalNumber || b.proposal_number || b.id || '');
        return keyB.localeCompare(keyA);
      });
  }, [proposals, search, selectedStatus, selectedArea]);

  const getStatusBadgeVariant = (status) => {
    const s = String(status || '').toLowerCase();
    switch (s) {
      case 'aceita':
      case 'accepted':
        return 'success';
      case 'em_negociacao':
      case 'negotiating':
        return 'warning';
      case 'enviada':
      case 'sent':
        return 'primary';
      case 'visualizada':
        return 'purple';
      case 'recusada':
      case 'rejected':
        return 'danger';
      case 'expirada':
        return 'default';
      default:
        return 'default';
    }
  };

  const handleDuplicate = (prop) => {
    if (!prop) return;
    const duplicated = {
      ...prop,
      id: `prop_${Date.now()}`,
      proposalNumber: `PROP-2026/${Math.floor(100 + Math.random() * 900)}`,
      status: 'rascunho',
      createdAt: new Date().toISOString(),
    };
    addProposal(duplicated);
    logActivity('Duplicação de Proposta', duplicated.proposalNumber, 'Proposta comercial duplicada.');
    showToast('Proposta comercial duplicada!');
  };

  const handlePrint = (prop) => {
    if (!prop) return;
    pdfService.printProposal(prop, officeSettings);
  };

  const handleRequestDelete = (prop) => {
    setProposalToDelete(prop);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (proposalToDelete) {
      const propId = proposalToDelete.id;
      const propNumber = proposalToDelete.proposalNumber || proposalToDelete.proposal_number || 'Proposta';
      setDeleteModalOpen(false);
      setProposalToDelete(null);
      deleteProposal(propId, propNumber);
      logActivity('Exclusão de Proposta', propNumber, 'Proposta comercial excluída.');
      showToast(`Proposta "${propNumber}" excluída com sucesso!`);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <FileCheck2 className="h-6 w-6 text-brand-600 dark:text-gold-400" />
            Propostas Comerciais & Honorários
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Elabore, envie e converta propostas jurídicas estruturadas com cálculo automático de honorários.
          </p>
        </div>

        <button
          onClick={onOpenNewProposal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-brand-600/25 hover:from-brand-500 hover:to-brand-600 transition-all btn-tactile"
        >
          <Plus className="h-4 w-4" /> Nova Proposta
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-white dark:bg-navy-900/90 border border-slate-200/80 dark:border-white/[0.08] p-3 shadow-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por número, cliente ou serviço..."
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-navy-950/60 pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-brand-500 focus:outline-none"
          />
        </div>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-navy-900 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 shadow-xs focus:outline-none"
        >
          <option value="">Todos os Status</option>
          {PROPOSAL_STATUSES.map(s => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>

        <select
          value={selectedArea}
          onChange={(e) => setSelectedArea(e.target.value)}
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-navy-900 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 shadow-xs focus:outline-none"
        >
          <option value="">Todas as Áreas</option>
          {legalAreas.map(a => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>

        {(selectedStatus || selectedArea || search) && (
          <button
            onClick={() => {
              setSelectedStatus('');
              setSelectedArea('');
              setSearch('');
            }}
            className="text-xs text-rose-600 dark:text-rose-400 hover:underline px-2"
          >
            Limpar Filtros
          </button>
        )}
      </div>

      {/* Proposals Grid / Cards */}
      {filteredProposals.length === 0 ? (
        <EmptyState
          title="Nenhuma proposta comercial encontrada"
          description="Crie uma nova proposta estratégica para enviar a um lead ou cliente."
          iconName="FileCheck2"
          actionLabel="Nova Proposta"
          onAction={onOpenNewProposal}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProposals.map((prop) => (
            <div
              key={prop.id}
              onClick={() => setSelectedProposalForView(prop)}
              className="group relative flex flex-col justify-between rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-white/[0.08] p-5 shadow-xs hover:shadow-md transition-all hover:border-brand-500/30 cursor-pointer"
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-bold text-brand-600 dark:text-gold-400">
                    {prop.proposalNumber || prop.proposal_number || 'PROP-2026/S/N'}
                  </span>
                  <Badge variant={getStatusBadgeVariant(prop.status)}>
                    {String(prop.status || 'rascunho').replace(/_/g, ' ')}
                  </Badge>
                </div>

                {/* Cliente / Lead */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-gold-400 transition-colors">
                    {prop.clientName || prop.client_name || prop.leadName || prop.lead_name || 'Cliente'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {prop.serviceName || prop.service_name || prop.title || 'Honorários Advocatícios'}
                  </p>
                </div>

                {/* Valor */}
                <div className="rounded-2xl bg-slate-50 dark:bg-white/[0.02] p-3 border border-slate-100 dark:border-white/[0.04]">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">Valor da Proposta</div>
                  <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {formatCurrency(prop.value || 0)}
                  </div>
                  {Number(prop.successFeePercent) > 0 && (
                    <div className="text-[10px] text-amber-600 dark:text-gold-400 font-semibold mt-0.5">
                      + {prop.successFeePercent}% de taxa de êxito
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Actions */}
              <div
                className="mt-4 pt-3 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedProposalForView(prop);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Visualizar Proposta Completa"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrint(prop);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Imprimir / Minuta PDF"
                  >
                    <Printer className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDuplicate(prop);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Duplicar proposta"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditProposal && onEditProposal(prop);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Editar proposta"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      if (e.preventDefault) e.preventDefault();
                      if (e.stopPropagation) e.stopPropagation();
                      handleRequestDelete(prop);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                    title="Excluir proposta"
                  >
                    <Trash2 className="h-3.5 w-3.5 pointer-events-none" />
                  </button>
                </div>

                {onConvertToContract && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onConvertToContract(prop);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 text-[11px] font-bold transition-colors"
                  >
                    <Sparkles className="h-3 w-3" /> Gerar Contrato
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Visualização Detalhada da Proposta */}
      <ProposalDetailModal
        isOpen={Boolean(selectedProposalForView)}
        onClose={() => setSelectedProposalForView(null)}
        proposal={selectedProposalForView}
        onEdit={(prop) => {
          setSelectedProposalForView(null);
          onEditProposal && onEditProposal(prop);
        }}
        onConvertToContract={(prop) => {
          setSelectedProposalForView(null);
          onConvertToContract && onConvertToContract(prop);
        }}
        onRequestDelete={(prop) => {
          setSelectedProposalForView(null);
          handleRequestDelete(prop);
        }}
      />

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setProposalToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Excluir Proposta Comercial"
        message={`Deseja realmente excluir a proposta "${proposalToDelete?.proposalNumber || proposalToDelete?.proposal_number || 'selecionada'}"?`}
        confirmLabel="Sim, Excluir Proposta"
      />
    </div>
  );
}
