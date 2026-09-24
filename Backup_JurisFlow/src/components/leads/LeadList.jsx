import React, { useState } from 'react';
import {
  Search,
  Plus,
  Filter,
  MessageCircle,
  Phone,
  MoreVertical,
  Calendar,
  CheckCircle2,
  Trash2,
  Edit,
  ArrowRight,
  UserCheck,
  FileCheck2,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatCPF, formatPhone, formatDate } from '../../utils/formatters';
import { Badge, TemperatureBadge } from '../common/Badge';
import { EmptyState } from '../common/EmptyState';
import { ConfirmModal } from '../common/ConfirmModal';
import { KANBAN_STAGES } from '../../data/legalAreas';

export function LeadList({ onOpenNewLead, onEditLead, onCloseContract, onNavigate }) {
  const { leads, deleteLead, legalAreas, showToast, logActivity } = useCRM();
  const { users } = useAuth();

  const [search, setSearch] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedStage, setSelectedStage] = useState('');
  const [selectedTemp, setSelectedTemp] = useState('');
  const [selectedAssignee, setSelectedAssignee] = useState('');

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState(null);

  // Filtering
  const filteredLeads = leads.filter(l => {
    const matchesSearch =
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      (l.cpf && l.cpf.includes(search)) ||
      (l.phone && l.phone.includes(search)) ||
      (l.email && l.email.toLowerCase().includes(search.toLowerCase())) ||
      (l.city && l.city.toLowerCase().includes(search.toLowerCase()));

    const matchesArea = !selectedArea || l.legalArea === selectedArea;
    const matchesStage = !selectedStage || l.stage === selectedStage;
    const matchesTemp = !selectedTemp || l.temperature === selectedTemp;
    const matchesAssignee = !selectedAssignee || l.assignedTo === selectedAssignee;

    return matchesSearch && matchesArea && matchesStage && matchesTemp && matchesAssignee;
  });

  const getStageLabel = (stageId) => {
    const found = KANBAN_STAGES.find(s => s.id === stageId);
    return found ? found.name : stageId;
  };

  const getAreaLabel = (areaId) => {
    const found = legalAreas.find(a => a.id === areaId);
    return found ? found.name : areaId;
  };

  const getUserName = (userId) => {
    const found = users.find(u => u.id === userId);
    return found ? found.name : 'Não atribuído';
  };

  const handleRequestDelete = (lead) => {
    setLeadToDelete(lead);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (leadToDelete) {
      const leadId = leadToDelete.id;
      const leadName = leadToDelete.name;
      setDeleteModalOpen(false);
      setLeadToDelete(null);
      deleteLead(leadId);
      logActivity('Exclusão de Lead', leadName, 'Lead removido do pipeline.');
      showToast(`Lead "${leadName}" excluído(a) com sucesso!`);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Top Bar: Search & Action button */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, telefone, CPF, cidade..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-navy-900 pl-10 pr-4 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-brand-500 focus:outline-none shadow-sm"
            />
          </div>

          {onNavigate && (
            <button
              onClick={() => onNavigate('kanban')}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-navy-900 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-colors"
            >
              Visualizar no Funil (Kanban)
            </button>
          )}
        </div>

        <button
          onClick={onOpenNewLead}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-brand-700 transition-colors"
        >
          <Plus className="h-4 w-4" /> Cadastrar Lead
        </button>
      </div>

      {/* Filter Chips Bar */}
      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
        <span className="text-slate-400 flex items-center gap-1 font-medium">
          <Filter className="h-3.5 w-3.5" /> Filtros:
        </span>

        {/* Área jurídica */}
        <select
          value={selectedArea}
          onChange={(e) => setSelectedArea(e.target.value)}
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-navy-900 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 shadow-sm focus:outline-none"
        >
          <option value="">Todas as Áreas</option>
          {legalAreas.map(a => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>

        {/* Etapa do Funil */}
        <select
          value={selectedStage}
          onChange={(e) => setSelectedStage(e.target.value)}
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-navy-900 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 shadow-sm focus:outline-none"
        >
          <option value="">Todas as Etapas</option>
          {KANBAN_STAGES.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        {/* Temperatura */}
        <select
          value={selectedTemp}
          onChange={(e) => setSelectedTemp(e.target.value)}
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-navy-900 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 shadow-sm focus:outline-none"
        >
          <option value="">Todas as Temperaturas</option>
          <option value="hot">Quente 🔥</option>
          <option value="warm">Morno ⚡</option>
          <option value="cold">Frio ❄️</option>
        </select>

        {/* Responsável */}
        <select
          value={selectedAssignee}
          onChange={(e) => setSelectedAssignee(e.target.value)}
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-navy-900 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 shadow-sm focus:outline-none"
        >
          <option value="">Todos os Responsáveis</option>
          {users.map(u => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>

        {(selectedArea || selectedStage || selectedTemp || selectedAssignee || search) && (
          <button
            onClick={() => {
              setSelectedArea('');
              setSelectedStage('');
              setSelectedTemp('');
              setSelectedAssignee('');
              setSearch('');
            }}
            className="text-xs text-rose-600 dark:text-rose-400 hover:underline px-2"
          >
            Limpar Filtros
          </button>
        )}
      </div>

      {/* Table */}
      {filteredLeads.length === 0 ? (
        <EmptyState
          title="Nenhum lead encontrado"
          description="Ajuste os filtros de pesquisa ou cadastre um novo lead comercial."
          iconName="Users"
          actionLabel="Cadastrar Lead"
          onAction={onOpenNewLead}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-navy-900 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-navy-950/75 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Nome / Contato</th>
                  <th className="px-4 py-3.5">Área Jurídica</th>
                  <th className="px-4 py-3.5">Temperatura</th>
                  <th className="px-4 py-3.5">Etapa do Funil</th>
                  <th className="px-4 py-3.5">Valor Estimado</th>
                  <th className="px-4 py-3.5">Responsável</th>
                  <th className="px-4 py-3.5">Último Contato</th>
                  <th className="px-4 py-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Nome & Contato */}
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {lead.name}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                        <a
                          href={`https://wa.me/55${(lead.whatsapp || lead.phone || '').replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-emerald-500 flex items-center gap-1 font-semibold"
                        >
                          <MessageCircle className="h-3 w-3 text-emerald-500" />
                          {formatPhone(lead.whatsapp || lead.phone)}
                        </a>
                        {lead.city && <span>• {lead.city}</span>}
                      </div>
                    </td>

                    {/* Área */}
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium bg-brand-50 text-brand-700 dark:bg-brand-950/80 dark:text-brand-300">
                        {getAreaLabel(lead.legalArea)}
                      </span>
                    </td>

                    {/* Temperatura */}
                    <td className="px-4 py-3.5">
                      <TemperatureBadge temperature={lead.temperature} />
                    </td>

                    {/* Etapa */}
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        lead.stage === 'contrato_fechado'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : lead.stage === 'perdido'
                          ? 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        {getStageLabel(lead.stage)}
                      </span>
                    </td>

                    {/* Valor Estimado */}
                    <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">
                      {formatCurrency(lead.estimatedValue)}
                    </td>

                    {/* Responsável */}
                    <td className="px-4 py-3.5 text-slate-700 dark:text-slate-300 font-medium">
                      {getUserName(lead.assignedTo)}
                    </td>

                    {/* Data */}
                    <td className="px-4 py-3.5 text-slate-500">
                      {formatDate(lead.lastContactDate)}
                    </td>

                    {/* Ações */}
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {lead.stage !== 'contrato_fechado' && lead.stage !== 'perdido' && (
                          <button
                            onClick={() => onCloseContract(lead)}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2 py-1 text-[11px] font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors"
                            title="Fechar contrato e converter lead"
                          >
                            <FileCheck2 className="h-3 w-3" /> Fechar
                          </button>
                        )}

                        <button
                          onClick={() => onEditLead(lead)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Editar lead"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>

                        <button
                          onClick={() => handleRequestDelete(lead)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                          title="Excluir lead"
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

          <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 px-4 py-3 text-xs text-slate-500">
            <div>Mostrando <strong>{filteredLeads.length}</strong> de <strong>{leads.length}</strong> leads cadastrados</div>
            <div className="text-[11px] text-slate-400">Total em pipeline: {formatCurrency(leads.reduce((a, b) => a + (Number(b.estimatedValue) || 0), 0))}</div>
          </div>
        </div>
      )}

      {/* Pop-up de Confirmação de Exclusão do Lead (Fecha Imediatamente) */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setLeadToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Excluir Lead Comercial"
        message={`Deseja realmente excluir o lead "${leadToDelete?.name}" do pipeline comercial?`}
        confirmLabel="Sim, Excluir Lead"
      />
    </div>
  );
}
