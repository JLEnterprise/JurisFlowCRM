import React, { useState, useRef } from 'react';
import {
  ArrowLeft,
  Printer,
  Edit,
  Trash2,
  Calendar,
  DollarSign,
  User,
  Shield,
  FileText,
  Clock,
  Download,
  Paperclip,
  Plus,
  Send,
  FileCheck,
  ShieldCheck,
  ExternalLink,
  Sparkles,
  RefreshCw,
  Check,
  Copy,
  AlertTriangle,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Badge } from '../common/Badge';
import { ConfirmModal } from '../common/ConfirmModal';
import { getFileTypeInfo, readFileAsDataUrl, sanitizeAttachmentForStorage, downloadAttachment, openAttachment } from '../../utils/fileHelper';
import { analyzeContractWithAdvJuris } from '../../services/aiService';

export function ContractDetail({
  contractId,
  onBack,
  onEditContract,
  onSignContract,
  onSendWhatsApp,
}) {
  const { contracts = [], updateContract, deleteContract, showToast, logActivity } = useCRM();

  const contract = contracts.find(c => c.id === contractId);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [attachmentToDelete, setAttachmentToDelete] = useState(null);
  const fileInputRef = useRef(null);

  // Estado da Auditoria AdvJuris
  const [auditing, setAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState(null);
  const [showAuditPanel, setShowAuditPanel] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!contract) {
    return (
      <div className="p-8 text-center text-slate-500">
        <p>Contrato não localizado.</p>
        <button
          onClick={onBack}
          className="mt-4 rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white"
        >
          Voltar aos Contratos
        </button>
      </div>
    );
  }

  const contractNumber = contract.contractNumber || contract.number || `CTR-${contract.id.slice(-6).toUpperCase()}`;
  const clientName = contract.clientName || 'Cliente';
  const lawyerName = contract.responsibleLawyerName || 'Advogado Responsável';
  const legalArea = contract.legalArea || 'Geral';
  const attachments = Array.isArray(contract.attachments) ? contract.attachments : [];

  const handlePrint = () => {
    window.print();
  };

  const handleConfirmDelete = () => {
    deleteContract(contract.id);
    logActivity('Exclusão de Contrato', contractNumber, 'Contrato removido do sistema.');
    showToast('Contrato excluído com sucesso.', 'success');
    onBack();
  };

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      const newAttachments = [...attachments];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const dataUrl = await readFileAsDataUrl(file);
        const typeInfo = getFileTypeInfo(file.name);

        const rawAtt = {
          id: `att_${Date.now()}_${i}`,
          name: file.name,
          size: file.size,
          type: typeInfo.type,
          dataUrl: dataUrl,
          uploadedAt: new Date().toISOString(),
          category: file.name.toLowerCase().includes('procur') ? 'Procuração' : 'Contratos',
        };
        const safeAtt = await sanitizeAttachmentForStorage(rawAtt);
        newAttachments.push(safeAtt);
      }

      updateContract(contract.id, { attachments: newAttachments });
      logActivity('Upload de Anexo em Contrato', contractNumber, `${files.length} arquivo(s) anexado(s).`);
      showToast(`${files.length} arquivo(s) anexado(s) com sucesso!`, 'success');
    } catch (err) {
      showToast('Erro ao carregar o arquivo.', 'error');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteAttachment = (attachmentId) => {
    const updated = attachments.filter(a => a.id !== attachmentId);
    updateContract(contract.id, { attachments: updated });
    logActivity('Exclusão de Anexo', contractNumber, 'Arquivo removido do contrato.');
    showToast('Anexo removido.', 'success');
    setAttachmentToDelete(null);
  };

  // Executar Auditoria de Risco com AdvJuris
  const handleRunAdvJurisAudit = async () => {
    setAuditing(true);
    setShowAuditPanel(true);
    try {
      const res = await analyzeContractWithAdvJuris({
        title: contract.title || contractNumber,
        clientName: clientName,
        value: contract.value,
        serviceDescription: contract.serviceDescription || '',
        observations: contract.observations || '',
        contractText: contract.contractText || '',
      });
      setAuditResult(res);
      showToast('Auditoria de risco concluída pelo AdvJuris!', 'success');
    } catch (e) {
      showToast('Erro na auditoria: ' + e.message, 'error');
    } finally {
      setAuditing(false);
    }
  };

  const handleCopyAudit = () => {
    if (!auditResult?.analysis) return;
    navigator.clipboard.writeText(auditResult.analysis);
    setCopied(true);
    showToast('Parecer copiado!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para Contratos
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {/* Botão de Auditoria AdvJuris */}
          <button
            onClick={handleRunAdvJurisAudit}
            disabled={auditing}
            className="flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-800 shadow-sm hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
          >
            {auditing ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5 text-amber-600" />}
            Auditar com AdvJuris (IA)
          </button>

          {/* Assinatura Digital ICP */}
          {onSignContract && (
            <button
              onClick={() => onSignContract(contract)}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700"
            >
              <FileCheck className="h-3.5 w-3.5" />
              Assinatura Digital (ICP)
            </button>
          )}

          {/* WhatsApp */}
          {onSendWhatsApp && (
            <button
              onClick={() =>
                onSendWhatsApp({
                  clientName: clientName,
                  phone: contract.clientPhone || '',
                  templateKey: 'contract_signature',
                  variables: {
                    contratoNumero: contractNumber,
                    valor: formatCurrency(contract.value || 0),
                  },
                })
              }
              className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-600"
            >
              <Send className="h-3.5 w-3.5" />
              Enviar no WhatsApp
            </button>
          )}

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            <Printer className="h-3.5 w-3.5" />
            Imprimir
          </button>

          {onEditContract && (
            <button
              onClick={() => onEditContract(contract)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              <Edit className="h-3.5 w-3.5" />
              Editar
            </button>
          )}

          <button
            onClick={() => setDeleteModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-100 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-400"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Excluir
          </button>
        </div>
      </div>

      {/* Painel Interativo de Auditoria AdvJuris */}
      {showAuditPanel && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-5 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500 text-white">
                <Scale className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Parecer de Risco Contratual — ADVJURIS (Legal Engineer)
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Auditoria automática de conformidade jurídica, LGPD e Regra 46
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {auditResult && (
                <button
                  onClick={handleCopyAudit}
                  className="flex items-center gap-1 rounded-lg border border-amber-300 bg-white px-2.5 py-1 text-[11px] font-bold text-amber-800 hover:bg-amber-50 dark:border-amber-700 dark:bg-slate-800 dark:text-amber-300"
                >
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  Copiar Parecer
                </button>
              )}
              <button
                onClick={() => setShowAuditPanel(false)}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                Fechar
              </button>
            </div>
          </div>

          {auditing ? (
            <div className="flex items-center gap-2 py-6 text-xs text-amber-700 dark:text-amber-400">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Analisando cláusulas com as 52 Regras do AdvJuris...
            </div>
          ) : auditResult ? (
            <div className="mt-4 space-y-3">
              {auditResult.risks && auditResult.risks.length > 0 && (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {auditResult.risks.map((r, i) => (
                    <div key={i} className={`rounded-xl border p-3 text-xs ${r.badgeClass}`}>
                      <div className="flex items-center justify-between font-bold">
                        <span>{r.clause}</span>
                        <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-white/60 dark:bg-black/40">
                          {r.level}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] opacity-90">{r.issue}</p>
                      <p className="mt-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                        💡 {r.suggestion}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs leading-relaxed text-slate-800 font-sans whitespace-pre-wrap dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
                {auditResult.analysis}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Main Contract Document Preview */}
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {/* Document Header */}
        <div className="flex flex-col justify-between border-b border-slate-100 pb-6 dark:border-slate-800 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                {contract.title || 'Contrato de Prestação de Serviços'}
              </h2>
              <Badge variant={contract.status === 'assinado' ? 'success' : contract.status === 'enviado' ? 'warning' : 'neutral'}>
                {contract.status?.toUpperCase() || 'RASCUNHO'}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Número de Registro: <span className="font-semibold text-slate-700 dark:text-slate-200">{contractNumber}</span>
            </p>
          </div>

          <div className="mt-4 text-right sm:mt-0">
            <span className="text-xs text-slate-400">Valor Total do Contrato</span>
            <div className="text-2xl font-black text-brand-600 dark:text-brand-400">
              {formatCurrency(contract.value || 0)}
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 gap-6 py-6 sm:grid-cols-2 md:grid-cols-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/30 dark:text-brand-400">
              <User className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400">Contratante</span>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{clientName}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400">Advogado Responsável</span>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{lawyerName}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400">Data de Emissão</span>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{formatDate(contract.createdDate || new Date())}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
              <FileCheck className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400">Área Jurídica</span>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{legalArea.toUpperCase()}</p>
            </div>
          </div>
        </div>

        {/* Objeto e Cláusulas */}
        <div className="space-y-6 pt-6">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Objeto do Contrato</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
              {contract.serviceDescription || 'Prestação de serviços advocatícios e consultoria jurídica especializada.'}
            </p>
          </div>

          {contract.observations && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Cláusulas Especiais & Observações</h3>
              <div className="mt-2 rounded-xl bg-slate-50 p-4 text-xs leading-relaxed text-slate-700 dark:bg-slate-800/50 dark:text-slate-300">
                {contract.observations}
              </div>
            </div>
          )}

          {/* Anexos */}
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Documentos Anexos ({attachments.length})
              </h3>
              <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-brand-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-brand-400">
                <Plus className="h-3.5 w-3.5" />
                Anexar Arquivo
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                  multiple
                  className="hidden"
                />
              </label>
            </div>

            {attachments.length === 0 ? (
              <p className="mt-3 text-xs italic text-slate-400">Nenhum anexo adicionado a este contrato.</p>
            ) : (
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                {attachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/40"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Paperclip className="h-4 w-4 shrink-0 text-slate-400" />
                      <span className="truncate text-xs font-medium text-slate-700 dark:text-slate-200">
                        {att.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openAttachment(att)}
                        className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-brand-600 dark:hover:bg-slate-700"
                        title="Visualizar anexo"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadAttachment(att)}
                        className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700"
                        title="Baixar anexo"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setAttachmentToDelete(att.id)}
                        className="rounded-lg p-1 text-rose-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30"
                        title="Remover anexo"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      {deleteModalOpen && (
        <ConfirmModal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={handleConfirmDelete}
          title="Excluir Contrato"
          message={`Tem certeza que deseja excluir o contrato ${contractNumber}? Esta ação não pode ser desfeita.`}
          confirmText="Excluir Definitivamente"
          isDanger
        />
      )}

      {/* Delete Attachment Modal */}
      {attachmentToDelete && (
        <ConfirmModal
          isOpen={Boolean(attachmentToDelete)}
          onClose={() => setAttachmentToDelete(null)}
          onConfirm={() => handleDeleteAttachment(attachmentToDelete)}
          title="Excluir Anexo"
          message="Deseja remover este anexo do contrato?"
          confirmText="Remover"
          isDanger
        />
      )}
    </div>
  );
}
