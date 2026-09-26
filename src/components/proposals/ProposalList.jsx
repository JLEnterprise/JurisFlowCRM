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
  List,
  LayoutGrid,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Badge } from '../common/Badge';
import { EmptyState } from '../common/EmptyState';
import { ConfirmModal } from '../common/ConfirmModal';
import { ProposalDetailModal } from './ProposalDetailModal';
import { pdfService } from '../../services/pdfService';
import { storageService } from '../../services/storageService';
import { PROPOSAL_STATUSES } from '../../data/legalAreas';
import { Select } from '../common/Select';

export function ProposalList({ onOpenNewProposal, onEditProposal, onConvertToContract }) {
  const { proposals = [], deleteProposal, addProposal, officeSettings = {}, showToast, logActivity, legalAreas = [] } = useCRM();
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  // Visualização em lista ou em blocos (lembrada entre sessões)
  const [viewMode, setViewModeState] = useState(() => {
    try { return window.localStorage.getItem('jurisflow_propostas_visao') || 'list'; } catch { return 'list'; }
  });
  const setViewMode = (mode) => {
    setViewModeState(mode);
    try { window.localStorage.setItem('jurisflow_propostas_visao', mode); } catch { /* sem storage */ }
  };
  const valueOf = (p) => Number(p.value ?? p.feeValue ?? p.fee_value) || 0;
  const areaName = (id) => legalAreas.find(a => a.id === id)?.name?.replace('Direito ', '') || id || '—';

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [proposalToDelete, setProposalToDelete] = useState(null);

  // View modal state
  const [selectedProposalForView, setSelectedProposalForView] = useState(null);

  const filteredProposals = useMemo(() => {
    return (proposals || [])
      .filter(p => {
        if (!p) return false;
        const id = String(p.id || '');
        const pNum = String(p.proposalNumber || p.proposal_number || '');
        if (storageService.isDeleted(id) || (pNum && storageService.isDeleted(pNum))) return false;
        if (p.deleted === true || p.is_deleted === true || (p.raw_data && (p.raw_data.deleted || p.raw_data.is_deleted))) return false;

        const term = (search || '').toLowerCase().trim();
        const proposalNumber = pNum.toLowerCase();
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
      {/* Busca, filtros e ação numa linha só */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar número, cliente ou serviço..."
            className="w-full rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-gold-500 focus:outline-none"
          />
        </div>

        <Select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] px-3 py-2 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
        >
          <option value="">Todos os Status</option>
          {PROPOSAL_STATUSES.map(s => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </Select>

        <Select
          value={selectedArea}
          onChange={(e) => setSelectedArea(e.target.value)}
          className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] px-3 py-2 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
        >
          <option value="">Todas as Áreas</option>
          {legalAreas.map(a => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </Select>

        {(selectedStatus || selectedArea || search) && (
          <button
            onClick={() => {
              setSelectedStatus('');
              setSelectedArea('');
              setSearch('');
            }}
            className="text-xs text-rose-600 dark:text-rose-400 hover:underline px-1"
          >
            Limpar
          </button>
        )}

        <div className="funil-tabs ml-auto">
          <button type="button" onClick={() => setViewMode('list')} className={`funil-tab ${viewMode === 'list' ? 'is-active' : ''}`}>
            <List className="h-3.5 w-3.5" /> Lista
          </button>
          <button type="button" onClick={() => setViewMode('grid')} className={`funil-tab ${viewMode === 'grid' ? 'is-active' : ''}`}>
            <LayoutGrid className="h-3.5 w-3.5" /> Blocos
          </button>
        </div>

        <button
          onClick={onOpenNewProposal}
          className="inline-flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-brand-700 via-brand-600 to-brand-500 px-4 py-2 text-xs font-bold text-white shadow-md hover:brightness-110 transition-all btn-tactile"
        >
          <Plus className="h-4 w-4" /> Nova Proposta
        </button>
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
      ) : viewMode === 'list' ? (
        /* Lista: uma linha por proposta */
        <div className="dash-panel !p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/70 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:border-white/[0.06] dark:bg-white/[0.02] dark:text-slate-400">
                  <th className="px-5 py-3 font-label">Cliente / Lead</th>
                  <th className="px-4 py-3 font-label">Serviço</th>
                  <th className="px-4 py-3 font-label">Área</th>
                  <th className="px-4 py-3 font-label text-right">Valor</th>
                  <th className="px-4 py-3 font-label">Validade</th>
                  <th className="px-4 py-3 font-label">Status</th>
                  <th className="px-5 py-3 font-label text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                {filteredProposals.map((prop) => (
                  <tr key={prop.id} onClick={() => setSelectedProposalForView(prop)} className="group cursor-pointer transition-colors hover:bg-gold-500/[0.035]">
                    <td className="px-5 py-3">
                      <div className="font-semibold text-slate-900 transition-colors group-hover:text-gold-700 dark:text-white dark:group-hover:text-gold-300">
                        {prop.clientName || prop.client_name || prop.leadName || prop.lead_name || 'Cliente'}
                      </div>
                      <div className="font-mono text-[11px] text-slate-400">{prop.proposalNumber || prop.proposal_number || 'S/N'}</div>
                    </td>
                    <td className="max-w-[16rem] px-4 py-3 text-xs text-slate-600 dark:text-slate-300">
                      <span className="line-clamp-2">{prop.serviceName || prop.service_name || prop.title || 'Honorários advocatícios'}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">{areaName(prop.legalArea || prop.legal_area)}</td>
                    <td className="px-4 py-3 text-right font-numeric font-semibold text-slate-900 dark:text-white whitespace-nowrap">{formatCurrency(valueOf(prop))}</td>
                    <td className="px-4 py-3 font-numeric text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {prop.validityDate ? formatDate(prop.validityDate) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={getStatusBadgeVariant(prop.status)}>{String(prop.status || 'rascunho').replace(/_/g, ' ')}</Badge>
                    </td>
                    <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-0.5">
                        {onConvertToContract && (
                          <button onClick={() => onConvertToContract(prop)} className="mr-1 inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2 py-1 text-[11px] font-bold text-emerald-700 transition-colors hover:bg-emerald-500/20 dark:text-emerald-300" title="Gerar contrato">
                            <Sparkles className="h-3 w-3" /> Contrato
                          </button>
                        )}
                        <button onClick={() => handlePrint(prop)} className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-white/[0.06] dark:hover:text-white" title="Imprimir / PDF"><Printer className="h-4 w-4" /></button>
                        <button onClick={() => handleDuplicate(prop)} className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-white/[0.06] dark:hover:text-white" title="Duplicar"><Copy className="h-4 w-4" /></button>
                        <button onClick={() => onEditProposal && onEditProposal(prop)} className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-white/[0.06] dark:hover:text-white" title="Editar"><Edit className="h-4 w-4" /></button>
                        <button onClick={() => handleRequestDelete(prop)} className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-500/10 hover:text-rose-600" title="Excluir"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
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
                    {formatCurrency(valueOf(prop))}
                  </div>
                  {Number(prop.successFeePercent) > 0 && (
                    <div className="text-[10px] text-gold-600 dark:text-gold-400 font-semibold mt-0.5">
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
