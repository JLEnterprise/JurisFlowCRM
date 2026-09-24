import React, { useState, useRef } from 'react';
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Edit,
  Download,
  Building,
  User,
  Scale,
  Copy,
  Printer,
  Trash2,
  Paperclip,
  UploadCloud,
  Plus,
  Eye,
  X
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Badge } from '../common/Badge';
import { ConfirmModal } from '../common/ConfirmModal';
import { pdfService } from '../../services/pdfService';
import { formatFileSize, getFileTypeInfo, downloadAttachment, openAttachment, readFileAsDataUrl } from '../../utils/fileHelper';

export function ContractDetail({ contractId, contract: propContract, onBack, onEditContract, onNavigate }) {
  const { contracts = [], updateContract, deleteContract, clients = [], officeSettings = {}, showToast, logActivity } = useCRM();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [attachmentToDelete, setAttachmentToDelete] = useState(null);
  const fileInputRef = useRef(null);

  const contract = propContract || contracts.find(c => c.id === contractId);

  if (!contract) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-sm text-slate-500">Contrato não encontrado ou excluído.</p>
        <button
          onClick={onBack}
          className="rounded-xl bg-brand-600 px-4 py-2 text-xs font-bold text-white shadow-sm"
        >
          Voltar aos Contratos
        </button>
      </div>
    );
  }

  const client = clients.find(c => c.id === (contract.clientId || contract.client_id)) || {
    name: contract.clientName || contract.client_name || 'Cliente',
    city: officeSettings?.city || 'São Paulo',
    state: officeSettings?.state || 'SP',
  };

  const contractNumber = contract.contractNumber || contract.contract_number || 'CTR-2026/S/N';
  const clientName = contract.clientName || contract.client_name || 'Cliente';
  const legalArea = contract.legalArea || contract.legal_area || 'Direito Geral';
  const status = contract.status || 'draft';
  const value = Number(contract.value) || 0;
  const attachments = Array.isArray(contract.attachments) ? contract.attachments : [];

  const handlePrint = () => {
    pdfService.printContract(contract, client, officeSettings);
  };

  const handleConfirmDelete = () => {
    const cId = contract.id;
    setDeleteModalOpen(false);
    deleteContract(cId);
    logActivity('Exclusão de Contrato', contractNumber, 'Contrato excluído definitivamente.');
    showToast(`Contrato "${contractNumber}" excluído com sucesso!`);
    if (onBack) onBack();
  };

  const handleDirectFileUpload = async (files) => {
    if (!files || files.length === 0) return;

    const newAttachments = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const validExtensions = ['.pdf', '.doc', '.docx'];
      const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

      if (!validExtensions.includes(fileExt) && !file.type.includes('pdf') && !file.type.includes('word') && !file.type.includes('officedocument')) {
        alert(`O arquivo "${file.name}" não é um PDF ou Word suportado (.pdf, .doc, .docx).`);
        continue;
      }

      try {
        const dataUrl = await readFileAsDataUrl(file);
        newAttachments.push({
          id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          size: file.size,
          type: file.type || (fileExt === '.pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'),
          dataUrl,
          uploadedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.error('Erro ao ler arquivo:', err);
      }
    }

    if (newAttachments.length > 0) {
      const updatedAttachments = [...attachments, ...newAttachments];
      updateContract(contract.id, {
        ...contract,
        attachments: updatedAttachments,
      });

      logActivity(
        'Anexo Adicionado',
        contractNumber,
        `${newAttachments.length} arquivo(s) anexado(s) diretamente aos detalhes do contrato.`
      );

      showToast(`${newAttachments.length} arquivo(s) anexado(s) com sucesso!`);
    }
  };

  const handleRemoveAttachment = (attId) => {
    const updatedAttachments = attachments.filter(a => a.id !== attId);
    updateContract(contract.id, {
      ...contract,
      attachments: updatedAttachments,
    });
    setAttachmentToDelete(null);
    showToast('Arquivo removido do contrato.');
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto pb-12">
      {/* Top action bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar aos Contratos
        </button>

        <div className="flex items-center gap-2">
          {/* Botão de Anexar Arquivo Direto */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-brand-300 dark:border-brand-800 bg-brand-50 dark:bg-brand-950/60 px-3.5 py-1.5 text-xs font-bold text-brand-700 dark:text-gold-300 hover:bg-brand-100 dark:hover:bg-brand-900/60 transition-colors shadow-xs"
          >
            <Paperclip className="h-3.5 w-3.5" /> Anexar PDF / Word
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleDirectFileUpload(e.target.files)}
            multiple
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
          />

          <button
            onClick={() => onEditContract && onEditContract(contract)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-navy-900 px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs"
          >
            <Edit className="h-3.5 w-3.5" /> Editar
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-1.5 text-xs font-bold text-white shadow-md hover:bg-brand-700 transition-colors"
          >
            <Printer className="h-3.5 w-3.5" /> Imprimir / PDF
          </button>
          <button
            onClick={() => setDeleteModalOpen(true)}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
            title="Excluir contrato"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Contract Detail Card */}
      <div className="rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-white/[0.08] p-6 sm:p-8 shadow-xs space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div>
            <div className="text-xs font-bold text-brand-600 dark:text-gold-400 uppercase tracking-wider font-mono">
              {contractNumber}
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
              {contract.title || 'Contrato de Prestação de Serviços Advocatícios'}
            </h1>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Contratante: <strong>{clientName}</strong> • Área: <strong>{legalArea}</strong>
            </div>
          </div>

          <div className="text-right">
            <Badge variant={status === 'assinado' ? 'success' : 'primary'} size="md">
              Status: {String(status).replace(/_/g, ' ').toUpperCase()}
            </Badge>
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">
              {formatCurrency(value)}
            </div>
          </div>
        </div>

        {/* Key Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          <div>
            <span className="text-slate-400 font-semibold block">Advogado(a) Responsável</span>
            <span className="text-slate-900 dark:text-white font-bold text-sm mt-0.5 block">
              {contract.responsibleLawyerName || contract.responsible_lawyer_name || 'Advogado Responsável'}
            </span>
          </div>

          <div>
            <span className="text-slate-400 font-semibold block">Condições de Pagamento</span>
            <span className="text-slate-900 dark:text-white font-bold mt-0.5 block">
              {contract.paymentMethod || contract.payment_method || 'A combinar'} ({contract.installmentsCount || contract.installments_count || 1} parcelas)
            </span>
          </div>

          <div>
            <span className="text-slate-400 font-semibold block">Data de Assinatura</span>
            <span className="text-slate-900 dark:text-white font-bold mt-0.5 block">
              {formatDate(contract.signedDate || contract.signed_date || contract.createdDate || contract.created_date)}
            </span>
          </div>
        </div>

        {/* Seção de Arquivos e Laudas Anexadas do Escritório */}
        <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Paperclip className="h-4 w-4 text-brand-600 dark:text-gold-400" />
              Arquivos, Minutas e Laudas do Escritório ({attachments.length})
            </h2>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 dark:text-gold-400 hover:underline"
            >
              <Plus className="h-3.5 w-3.5" /> Adicionar Arquivo (PDF/Word)
            </button>
          </div>

          {attachments.length === 0 ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-brand-400 p-6 text-center bg-slate-50/50 dark:bg-navy-950/40 transition-colors"
            >
              <UploadCloud className="h-8 w-8 text-slate-400 mx-auto mb-2" />
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Nenhum arquivo ou minuta anexada a este contrato
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Clique aqui para anexar minutas em <strong>Word (.docx)</strong>, laudas, procurações ou <strong>PDFs</strong> escaneados do escritório.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {attachments.map((att) => {
                const info = getFileTypeInfo(att.name, att.type);
                return (
                  <div
                    key={att.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-navy-950/80 p-3.5 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${info.bgColor} ${info.color}`}>
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate" title={att.name}>
                          {att.name}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span className={`px-1.5 py-0.2 rounded font-bold text-[8px] uppercase ${info.badgeColor}`}>
                            {info.label}
                          </span>
                          <span>{formatFileSize(att.size)}</span>
                          {att.uploadedAt && (
                            <span>• {formatDate(att.uploadedAt)}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => openAttachment(att)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-white dark:hover:bg-slate-800 shadow-2xs transition-colors"
                        title="Visualizar / Abrir arquivo"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => downloadAttachment(att)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-white dark:hover:bg-slate-800 shadow-2xs transition-colors"
                        title="Baixar arquivo original"
                      >
                        <Download className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => setAttachmentToDelete(att)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                        title="Excluir anexo"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Clauses and Terms */}
        <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800 text-xs">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Scale className="h-4 w-4 text-brand-500" /> Cláusulas do Contrato
          </h2>

          <div className="rounded-2xl bg-slate-50 dark:bg-navy-950 p-4 border border-slate-200/60 dark:border-slate-800 space-y-3 font-mono text-[11px] leading-relaxed text-slate-700 dark:text-slate-300">
            <p>
              <strong>CLÁUSULA PRIMEIRA – DO OBJETO:</strong> O presente contrato tem por objeto a prestação de serviços advocatícios e consultoria jurídica especializada para a defesa dos direitos e interesses do(a) CONTRATANTE na área de {String(legalArea).toUpperCase()}.
            </p>
            <p>
              <strong>CLÁUSULA SEGUNDA – DOS HONORÁRIOS:</strong> Pelos serviços ora contratados, o(a) CONTRATANTE pagará ao escritório CONTRATADO o valor total de {formatCurrency(value)}, a ser liquidado conforme as condições acordadas: {contract.paymentMethod || contract.payment_method || 'Conforme estipulado'}.
            </p>
            {Number(contract.successFeePercent) > 0 && (
              <p>
                <strong>CLÁUSULA TERCEIRA – DOS HONORÁRIOS DE ÊXITO:</strong> Em caso de êxito na demanda ou acordo extrajudicial, incidirá o percentual de {contract.successFeePercent}% sobre o proveito econômico obtido.
              </p>
            )}
            <p>
              <strong>CLÁUSULA QUARTA – DO FORO:</strong> As partes elegem o foro da Comarca de {officeSettings?.city || 'São Paulo'}/{officeSettings?.state || 'SP'} para dirimir quaisquer dúvidas decorrentes do presente instrumento.
            </p>
          </div>
        </div>
      </div>

      {/* Pop-up de Confirmação de Exclusão do Contrato */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Excluir Contrato"
        message={`Deseja realmente excluir o contrato "${contractNumber}"? Esta ação removerá o contrato do sistema.`}
        confirmLabel="Sim, Excluir Contrato"
      />

      {/* Pop-up de Confirmação de Exclusão de Anexo */}
      <ConfirmModal
        isOpen={!!attachmentToDelete}
        onClose={() => setAttachmentToDelete(null)}
        onConfirm={() => handleRemoveAttachment(attachmentToDelete?.id)}
        title="Remover Arquivo Anexado"
        message={`Deseja remover o arquivo "${attachmentToDelete?.name}" deste contrato?`}
        confirmLabel="Sim, Remover Arquivo"
      />
    </div>
  );
}
