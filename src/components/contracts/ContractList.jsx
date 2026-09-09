import React, { useState } from 'react';
import {
  Search,
  Plus,
  Filter,
  FileText,
  Download,
  Eye,
  Edit,
  Trash2,
  Copy,
  CheckCircle2,
  Calendar,
  ExternalLink,
  Printer,
  Paperclip,
  UploadCloud,
  FileCode,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Badge } from '../common/Badge';
import { EmptyState } from '../common/EmptyState';
import { ConfirmModal } from '../common/ConfirmModal';
import { pdfService } from '../../services/pdfService';
import { CONTRACT_STATUSES } from '../../data/legalAreas';
import { QuickAttachModal } from './QuickAttachModal';
import { formatFileSize, getFileTypeInfo, downloadAttachment, openAttachment } from '../../utils/fileHelper';

export function ContractList({ onOpenNewContract, onEditContract, onSelectContract, onOpenContractDetail, onNavigate, onSignContract }) {
  const { contracts = [], deleteContract, clients = [], legalAreas = [], officeSettings = {}, addContract, showToast, logActivity } = useCRM();
  const { users = [] } = useAuth();

  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedLawyer, setSelectedLawyer] = useState('');

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [contractToDelete, setContractToDelete] = useState(null);

  // Quick Attach Modal state
  const [quickAttachOpen, setQuickAttachOpen] = useState(false);

  const selectContractFn = onSelectContract || onOpenContractDetail || (() => {});

  const filteredContracts = (contracts || []).filter(c => {
    if (!c) return false;
    const term = (search || '').toLowerCase().trim();
    const contractNumber = String(c.contractNumber || c.contract_number || '').toLowerCase();
    const clientName = String(c.clientName || c.client_name || '').toLowerCase();
    const title = String(c.title || '').toLowerCase();
    const legalArea = String(c.legalArea || c.legal_area || '').toLowerCase();

    const matchesSearch = !term ||
      contractNumber.includes(term) ||
      clientName.includes(term) ||
      title.includes(term) ||
      legalArea.includes(term);

    const matchesStatus = !selectedStatus || (c.status || 'draft') === selectedStatus;
    const matchesArea = !selectedArea || (c.legalArea || c.legal_area) === selectedArea;
    const matchesLawyer = !selectedLawyer || (c.responsibleLawyerId || c.responsible_lawyer_id) === selectedLawyer;

    return matchesSearch && matchesStatus && matchesArea && matchesLawyer;
  }).sort((a, b) => {
    // 1. Mais recente primeiro por data de criação / assinatura
    const dateA = new Date(a.createdDate || a.created_date || a.signedDate || a.createdAt || a.created_at || 0).getTime();
    const dateB = new Date(b.createdDate || b.created_date || b.signedDate || b.createdAt || b.created_at || 0).getTime();
    if (dateB !== dateA) return dateB - dateA;
    // 2. Desempate estável e determinístico por número de contrato / ID
    return String(b.contractNumber || b.contract_number || b.id || '').localeCompare(
      String(a.contractNumber || a.contract_number || a.id || '')
    );
  });

  const getStatusBadgeVariant = (status) => {
    const s = String(status || '').toLowerCase();
    switch (s) {
      case 'assinado':
      case 'active':
        return 'success';
      case 'aguardando_assinatura':
      case 'sent':
        return 'purple';
      case 'enviado':
        return 'primary';
      case 'em_revisao':
      case 'review':
        return 'warning';
      case 'cancelado':
      case 'cancelled':
        return 'danger';
      default:
        return 'default';
    }
  };

  const handleDuplicate = (contract) => {
    if (!contract) return;
    const duplicated = {
      ...contract,
      id: `cnt_${Date.now()}`,
      contractNumber: `CTR-2026/${Math.floor(100 + Math.random() * 900)}`,
      title: `${contract.title || 'Contrato'} (Cópia)`,
      status: 'rascunho',
      createdDate: new Date().toISOString().split('T')[0],
      sentDate: '',
      signedDate: '',
    };
    addContract(duplicated);
    logActivity('Duplicação de Contrato', duplicated.contractNumber, 'Contrato duplicado a partir de modelo existente.');
    showToast('Contrato duplicado com sucesso!');
  };

  const handlePrint = (contract) => {
    if (!contract) return;
    const client = clients.find(c => c.id === (contract.clientId || contract.client_id)) || {
      name: contract.clientName || contract.client_name || 'Cliente',
      address: 'Endereço Principal',
      city: officeSettings?.city || 'São Paulo',
      state: officeSettings?.state || 'SP',
    };
    pdfService.printContract(contract, client, officeSettings);
  };

  const handleRequestDelete = (contract) => {
    setContractToDelete(contract);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (contractToDelete) {
      const contractId = contractToDelete.id;
      const contractNumber = contractToDelete.contractNumber || contractToDelete.contract_number || 'Contrato';
      setDeleteModalOpen(false);
      setContractToDelete(null);
      deleteContract(contractId);
      logActivity('Exclusão de Contrato', contractNumber, 'Contrato excluído definitivamente.');
      showToast(`Contrato "${contractNumber}" excluído com sucesso!`);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Actions & Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <FileText className="h-6 w-6 text-brand-600 dark:text-gold-400" />
            Contratos & Minutas Jurídicas
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Gestão estratégica de honorários, minutas, laudas e arquivos anexados (.pdf, .docx, .doc).
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          {/* Botão de Anexar Arquivos PDF/Word */}
          <button
            onClick={() => setQuickAttachOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-brand-200 dark:border-brand-800/80 bg-brand-50 dark:bg-brand-950/50 px-4 py-2.5 text-xs font-bold text-brand-700 dark:text-gold-300 hover:bg-brand-100 dark:hover:bg-brand-900/60 transition-all shadow-xs btn-tactile"
            title="Anexar contrato pronto, lauda ou minuta do escritório em PDF ou Word"
          >
            <Paperclip className="h-4 w-4" /> Anexar Arquivo (PDF/Word)
          </button>

          {/* Botão de Novo Contrato */}
          <button
            onClick={onOpenNewContract}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-brand-600/25 hover:from-brand-500 hover:to-brand-600 transition-all btn-tactile"
          >
            <Plus className="h-4 w-4" /> Novo Contrato
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-white dark:bg-navy-900/90 border border-slate-200/80 dark:border-white/[0.08] p-3 shadow-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por número, cliente, objeto, anexo ou área..."
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-navy-950/60 pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-brand-500 focus:outline-none"
          />
        </div>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-navy-900 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 shadow-xs focus:outline-none"
        >
          <option value="">Todos os Status</option>
          {CONTRACT_STATUSES.map(s => (
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

        <select
          value={selectedLawyer}
          onChange={(e) => setSelectedLawyer(e.target.value)}
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-navy-900 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 shadow-xs focus:outline-none"
        >
          <option value="">Todos os Advogados</option>
          {users.map(u => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>

        {(selectedStatus || selectedArea || selectedLawyer || search) && (
          <button
            onClick={() => {
              setSelectedStatus('');
              setSelectedArea('');
              setSelectedLawyer('');
              setSearch('');
            }}
            className="text-xs text-rose-600 dark:text-rose-400 hover:underline px-2"
          >
            Limpar Filtros
          </button>
        )}
      </div>

      {/* Contracts Table */}
      {filteredContracts.length === 0 ? (
        <EmptyState
          title="Nenhum contrato encontrado"
          description="Ajuste os filtros de pesquisa, elabore um novo contrato ou anexe seus arquivos PDF e Word do escritório."
          iconName="FileText"
          actionLabel="Criar Contrato"
          onAction={onOpenNewContract}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-navy-900 shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-navy-950/75 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Nº Contrato</th>
                  <th className="px-4 py-3.5">Cliente Contratante</th>
                  <th className="px-4 py-3.5">Objeto / Anexos</th>
                  <th className="px-4 py-3.5">Área</th>
                  <th className="px-4 py-3.5">Honorários</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Assinado em</th>
                  <th className="px-4 py-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredContracts.map((contract) => {
                  const attachments = Array.isArray(contract.attachments) ? contract.attachments : [];
                  const hasAttachments = attachments.length > 0;

                  return (
                    <tr
                      key={contract.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      {/* Número do contrato */}
                      <td className="px-4 py-3.5 font-extrabold text-brand-600 dark:text-gold-400">
                        <button
                          onClick={() => selectContractFn(contract.id || contract)}
                          className="hover:underline text-left font-mono"
                        >
                          {contract.contractNumber || contract.contract_number || 'S/N'}
                        </button>
                      </td>

                      {/* Cliente */}
                      <td className="px-4 py-3.5 font-bold text-slate-800 dark:text-slate-200">
                        {contract.clientName || contract.client_name || 'Cliente'}
                      </td>

                      {/* Título & Anexos */}
                      <td className="px-4 py-3.5 max-w-[220px]">
                        <div className="text-slate-700 dark:text-slate-300 font-medium truncate">
                          {contract.title || 'Contrato de Prestação de Serviços'}
                        </div>
                        {hasAttachments && (
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            {attachments.slice(0, 2).map((att) => {
                              const info = getFileTypeInfo(att.name, att.type);
                              return (
                                <button
                                  key={att.id}
                                  onClick={() => openAttachment(att)}
                                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${info.borderColor} ${info.bgColor} ${info.color} hover:opacity-80 transition-opacity`}
                                  title={`Abrir ${att.name}`}
                                >
                                  <Paperclip className="h-2.5 w-2.5" />
                                  <span className="truncate max-w-[90px]">{att.name}</span>
                                </button>
                              );
                            })}
                            {attachments.length > 2 && (
                              <span className="text-[10px] text-slate-400 font-bold">
                                +{attachments.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Área */}
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300">
                          {contract.legalArea || contract.legal_area || 'Geral'}
                        </span>
                      </td>

                      {/* Honorários */}
                      <td className="px-4 py-3.5 font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                        {formatCurrency(contract.value || 0)}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <Badge variant={getStatusBadgeVariant(contract.status)}>
                          {String(contract.status || 'rascunho').replace(/_/g, ' ')}
                        </Badge>
                      </td>

                      {/* Data de assinatura */}
                      <td className="px-4 py-3.5 text-slate-500">
                        {formatDate(contract.signedDate || contract.signed_date || contract.createdDate || contract.created_date)}
                      </td>

                      {/* Ações */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {onSignContract && (
                            <button
                              onClick={() => onSignContract(contract)}
                              className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                              title="Assinatura Eletrônica com Validade Jurídica (ICP)"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => selectContractFn(contract.id || contract)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Visualizar contrato e anexos"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>

                          {hasAttachments ? (
                            <button
                              onClick={() => downloadAttachment(attachments[0])}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors"
                              title={`Baixar anexo: ${attachments[0]?.name}`}
                            >
                              <Download className="h-3.5 w-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handlePrint(contract)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Imprimir / PDF"
                            >
                              <Printer className="h-3.5 w-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => handleDuplicate(contract)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Duplicar contrato"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>

                          <button
                            onClick={() => onEditContract(contract)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Editar contrato"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              if (e.preventDefault) e.preventDefault();
                              if (e.stopPropagation) e.stopPropagation();
                              handleRequestDelete(contract);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                            title="Excluir contrato"
                          >
                            <Trash2 className="h-3.5 w-3.5 pointer-events-none" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 px-4 py-3 text-xs text-slate-500">
            <div>Mostrando <strong>{filteredContracts.length}</strong> de <strong>{contracts.length}</strong> contratos</div>
            <div className="text-[11px] text-slate-400">Total contratado: {formatCurrency(contracts.reduce((a, b) => a + (Number(b?.value) || 0), 0))}</div>
          </div>
        </div>
      )}

      {/* Modal de Anexo Rápido de Arquivos PDF/Word */}
      <QuickAttachModal
        isOpen={quickAttachOpen}
        onClose={() => setQuickAttachOpen(false)}
        onContractCreated={(newContract) => {
          if (onSelectContract) onSelectContract(newContract);
        }}
      />

      {/* Pop-up de Confirmação de Exclusão do Contrato */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setContractToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Excluir Contrato de Honorários"
        message={`Tem certeza que deseja excluir o contrato "${contractToDelete?.contractNumber || contractToDelete?.contract_number || 'selecionado'}" (${contractToDelete?.title || 'Contrato'})?`}
        confirmLabel="Sim, Excluir Contrato"
      />
    </div>
  );
}
