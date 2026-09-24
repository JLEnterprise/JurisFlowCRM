import React, { useState } from 'react';
import {
  Search,
  Plus,
  Filter,
  Briefcase,
  Edit,
  Trash2,
  ExternalLink,
  Building,
  Scale,
  Calendar,
  Clock,
  User,
  DollarSign,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  List,
  MessageCircle,
  FileCheck2,
  ShieldCheck,
  Flame,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { useAuth } from '../../context/AuthContext';
import { formatDate, formatCNJProcessNumber } from '../../utils/formatters';
import { Badge } from '../common/Badge';
import { EmptyState } from '../common/EmptyState';
import { ConfirmModal } from '../common/ConfirmModal';

export function ProcessList({ onOpenNewProcess, onEditProcess, onNavigate, onOpenCopilot, onOpenWhatsApp }) {
  const { processes, deleteProcess, legalAreas, showToast, logActivity } = useCRM();
  const { users } = useAuth();

  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [viewMode, setViewMode] = useState('dossier'); // 'dossier' | 'table'
  const [expandedProcessId, setExpandedProcessId] = useState(null);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [processToDelete, setProcessToDelete] = useState(null);

  const filteredProcesses = processes.filter(p => {
    const term = search.toLowerCase();
    const matchesSearch =
      p.processNumber?.toLowerCase().includes(term) ||
      p.clientName?.toLowerCase().includes(term) ||
      p.court?.toLowerCase().includes(term) ||
      p.tribunal?.toLowerCase().includes(term);

    const matchesStatus = !selectedStatus || p.status === selectedStatus;
    const matchesArea = !selectedArea || p.legalArea === selectedArea;

    return matchesSearch && matchesStatus && matchesArea;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Em Andamento
          </span>
        );
      case 'suspenso':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Suspenso / Prazo
          </span>
        );
      case 'encerrado':
      case 'ganho':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-gold-500/10 text-gold-600 dark:text-gold-400 border border-gold-500/20">
            <ShieldCheck className="h-3 w-3 text-gold-500" />
            Ganho de Causa
          </span>
        );
      case 'arquivado':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
            Arquivado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
            {status}
          </span>
        );
    }
  };

  const handleRequestDelete = (proc) => {
    setProcessToDelete(proc);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (processToDelete) {
      const procId = processToDelete.id;
      const procNumber = processToDelete.processNumber;
      const clientName = processToDelete.clientName;
      setDeleteModalOpen(false);
      setProcessToDelete(null);
      deleteProcess(procId);
      logActivity('Exclusão de Processo', procNumber, `Processo do cliente ${clientName} excluído.`);
      showToast(`Processo "${procNumber}" excluído com sucesso!`);
    }
  };

  const toggleExpand = (id) => {
    setExpandedProcessId(prev => prev === id ? null : id);
  };

  return (
    <div className="space-y-5 animate-fade-in pb-12">
      {/* Top action header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar por número CNJ, cliente, vara ou tribunal..."
            className="w-full rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#111827] pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-gold-500 focus:outline-none shadow-xs transition-all"
          />
        </div>

        <div className="flex items-center gap-2.5">
          {/* Mode switch */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08]">
            <button
              onClick={() => setViewMode('dossier')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'dossier'
                  ? 'bg-white dark:bg-white/10 text-brand-600 dark:text-gold-400 shadow-xs'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-white'
              }`}
              title="Visualização em Dossiês Executivos"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-white/10 text-brand-600 dark:text-gold-400 shadow-xs'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-white'
              }`}
              title="Visualização em Tabela Compacta"
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={onOpenNewProcess}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-brand-600/20 transition-all btn-tactile"
          >
            <Plus className="h-4 w-4" /> Cadastrar Processo CNJ
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-slate-400 flex items-center gap-1.5 font-semibold text-[11px] uppercase tracking-wider">
          <Filter className="h-3 w-3 text-gold-500" /> Filtros:
        </span>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#111827] px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 shadow-xs focus:outline-none font-medium cursor-pointer"
        >
          <option value="">Todos os Status</option>
          <option value="active">Em Andamento</option>
          <option value="suspenso">Suspenso / Prazo</option>
          <option value="encerrado">Ganho / Encerrado</option>
          <option value="arquivado">Arquivado</option>
        </select>

        <select
          value={selectedArea}
          onChange={(e) => setSelectedArea(e.target.value)}
          className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#111827] px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 shadow-xs focus:outline-none font-medium cursor-pointer"
        >
          <option value="">Todas as Áreas Jurídicas</option>
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
            className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline px-2"
          >
            Limpar Filtros
          </button>
        )}

        <div className="ml-auto text-xs text-slate-400 font-medium">
          {filteredProcesses.length} {filteredProcesses.length === 1 ? 'processo encontrado' : 'processos encontrados'}
        </div>
      </div>

      {/* Main Content */}
      {filteredProcesses.length === 0 ? (
        <EmptyState
          title="Nenhum processo localizado"
          description="Ajuste os filtros de busca ou vincule um novo processo judicial."
          iconName="Briefcase"
          actionLabel="Novo Processo"
          onAction={onOpenNewProcess}
        />
      ) : viewMode === 'dossier' ? (
        /* Modo Dossiê Executivo (Cards Expansíveis de Alto Padrão) */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProcesses.map((proc) => {
            const isExpanded = expandedProcessId === proc.id;
            return (
              <div
                key={proc.id}
                className="executive-dossier p-5 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-white/[0.08] shadow-sm hover:shadow-xl dark:hover:shadow-brand-500/5 transition-all duration-300"
              >
                {/* Header do Dossiê */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-white/[0.06]">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-brand-600 dark:text-gold-400 tracking-wide bg-brand-500/5 dark:bg-gold-500/10 px-2 py-0.5 rounded-md border border-brand-500/10 dark:border-gold-500/20">
                        {formatCNJProcessNumber(proc.processNumber)}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1.5 flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      {proc.clientName}
                    </h3>
                  </div>

                  <div className="flex flex-col items-end gap-1.5">
                    {getStatusBadge(proc.status)}
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                      {proc.tribunal || 'TJSP'}
                    </span>
                  </div>
                </div>

                {/* Corpo do Dossiê */}
                <div className="py-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Scale className="h-3.5 w-3.5 text-gold-500" /> Ramo / Ação:
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {proc.actionType || proc.legalArea || 'Direito Civil'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Building className="h-3.5 w-3.5 text-slate-400" /> Vara / Comarca:
                    </span>
                    <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                      {proc.court || '1ª Vara Cível'}
                    </span>
                  </div>

                  {proc.value && (
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <DollarSign className="h-3.5 w-3.5 text-emerald-500" /> Valor da Causa:
                      </span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(proc.value)}
                      </span>
                    </div>
                  )}

                  {/* Movimentação Recente */}
                  <div className="pt-2 mt-2 border-t border-slate-100 dark:border-white/[0.06] bg-slate-50/70 dark:bg-white/[0.02] p-2.5 rounded-xl">
                    <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1 mb-1">
                      <Clock className="h-3 w-3 text-gold-500" /> Última Movimentação:
                    </div>
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300 line-clamp-2">
                      {proc.lastMovement || 'Aguardando publicação do despacho no DJe.'}
                    </p>
                    <div className="text-[10px] text-slate-400 mt-1">
                      Data: {formatDate(proc.lastMovementDate || proc.distributionDate)}
                    </div>
                  </div>
                </div>

                {/* Seção Expansível com Detalhes Avançados */}
                {isExpanded && (
                  <div className="pt-3 border-t border-slate-100 dark:border-white/[0.06] text-xs space-y-2 animate-fade-in bg-slate-50/40 dark:bg-white/[0.01] p-3 rounded-xl mb-3">
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-400 block">Distribuição:</span>
                        <strong className="text-slate-800 dark:text-slate-200">{formatDate(proc.distributionDate)}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Advogado Responsável:</span>
                        <strong className="text-slate-800 dark:text-slate-200">{proc.responsibleLawyerName || 'Dra. Helena Prado'}</strong>
                      </div>
                    </div>
                    {proc.notes && (
                      <div className="pt-2 text-[11px]">
                        <span className="text-slate-400 block">Observações do Dossiê:</span>
                        <p className="text-slate-600 dark:text-slate-300 italic">{proc.notes}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Rodapé de Ações do Dossiê */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/[0.06]">
                  <button
                    onClick={() => toggleExpand(proc.id)}
                    className="flex items-center gap-1 text-[11px] font-bold text-brand-600 dark:text-gold-400 hover:underline"
                  >
                    {isExpanded ? (
                      <>Menos Detalhes <ChevronUp className="h-3 w-3" /></>
                    ) : (
                      <>Ver Dossiê Completo <ChevronDown className="h-3 w-3" /></>
                    )}
                  </button>

                  <div className="flex items-center gap-1">
                    {onOpenCopilot && (
                      <button
                        onClick={() => onOpenCopilot('explicador')}
                        className="p-1.5 rounded-xl text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors btn-tactile"
                        title="Resumir com IA para o Cliente"
                      >
                        <Flame className="h-3.5 w-3.5" />
                      </button>
                    )}

                    {onOpenWhatsApp && (
                      <button
                        onClick={() => onOpenWhatsApp({
                          clientName: proc.clientName,
                          processNumber: proc.processNumber,
                          updateSummary: proc.lastMovement || 'Movimentação processual registrada nos autos.',
                          templateId: 'andamento_processual',
                        })}
                        className="p-1.5 rounded-xl text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors btn-tactile"
                        title="Notificar Cliente no WhatsApp"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                      </button>
                    )}

                    <button
                      onClick={() => onEditProcess(proc)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors btn-tactile"
                      title="Editar Dossiê"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>

                    <button
                      onClick={() => handleRequestDelete(proc)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-white/5 transition-colors btn-tactile"
                      title="Excluir Dossiê"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Modo Tabela Compacta Executiva */
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#111827] shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 dark:border-white/[0.08] bg-slate-50/75 dark:bg-[#0b0f17]/75 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Número CNJ</th>
                  <th className="px-4 py-3.5">Cliente</th>
                  <th className="px-4 py-3.5">Área / Objeto</th>
                  <th className="px-4 py-3.5">Vara / Tribunal</th>
                  <th className="px-4 py-3.5">Última Movimentação</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                {filteredProcesses.map((proc) => (
                  <tr
                    key={proc.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-4 py-3.5 font-bold font-mono text-brand-600 dark:text-gold-400">
                      {formatCNJProcessNumber(proc.processNumber)}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-800 dark:text-slate-200">
                      {proc.clientName}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-900 dark:text-white">{proc.subject || proc.legalArea}</div>
                      <div className="text-[10px] text-slate-400">{proc.legalArea}</div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400">
                      <div className="font-medium text-slate-800 dark:text-slate-200">{proc.court}</div>
                      <div className="text-[11px] text-slate-400">{proc.tribunal}</div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 max-w-[220px]">
                      <div className="truncate font-medium text-slate-700 dark:text-slate-300">{proc.lastMovement}</div>
                      <div className="text-[10px] text-slate-400">{formatDate(proc.lastMovementDate)}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      {getStatusBadge(proc.status)}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {onOpenCopilot && (
                          <button
                            onClick={() => onOpenCopilot('explicador')}
                            className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
                            title="Resumir com IA para o Cliente"
                          >
                            <Flame className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {onOpenWhatsApp && (
                          <button
                            onClick={() => onOpenWhatsApp({
                              clientName: proc.clientName,
                              processNumber: proc.processNumber,
                              updateSummary: proc.lastMovement || 'Movimentação processual registrada nos autos.',
                              templateId: 'andamento_processual',
                            })}
                            className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                            title="Notificar Cliente no WhatsApp"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => onEditProcess(proc)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                          title="Editar processo"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleRequestDelete(proc)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-white/5 transition-colors"
                          title="Excluir processo"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 dark:border-white/[0.08] px-4 py-3 text-xs text-slate-500">
            <div>Mostrando <strong>{filteredProcesses.length}</strong> de <strong>{processes.length}</strong> processos</div>
          </div>
        </div>
      )}

      {/* Pop-up de Confirmação de Exclusão */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setProcessToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Excluir Dossiê Judicial"
        message={`Deseja excluir o processo CNJ "${processToDelete?.processNumber}" (${processToDelete?.clientName})?`}
        confirmLabel="Sim, Excluir Dossiê"
      />
    </div>
  );
}
