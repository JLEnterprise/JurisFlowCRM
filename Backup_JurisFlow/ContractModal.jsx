import React, { useState, useEffect, useRef } from 'react';
import { useCRM } from '../../context/CRMContext';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../common/Modal';
import { CONTRACT_STATUSES } from '../../data/legalAreas';
import { readFileAsDataUrl, formatFileSize, getFileTypeInfo, downloadAttachment, openAttachment } from '../../utils/fileHelper';
import { UploadCloud, FileText, X, Download, Eye, Paperclip } from 'lucide-react';

export function ContractModal({ isOpen, onClose, contractToEdit = null, prefillData = null }) {
  const { addContract, updateContract, clients = [], legalAreas = [] } = useCRM();
  const { users = [] } = useAuth();
  const fileInputRef = useRef(null);

  const [isDragging, setIsDragging] = useState(false);
  const [formData, setFormData] = useState({
    clientId: '',
    clientName: '',
    title: '',
    legalArea: 'civil',
    responsibleLawyerId: 'usr_2',
    serviceDescription: '',
    status: 'assinado',
    value: '',
    paymentMethod: 'Parcelado (Boleto / PIX)',
    installmentsCount: 1,
    installmentValue: '',
    createdDate: new Date().toISOString().split('T')[0],
    sentDate: '',
    signedDate: new Date().toISOString().split('T')[0],
    observations: '',
    attachments: [],
  });

  useEffect(() => {
    if (contractToEdit) {
      setFormData({
        ...contractToEdit,
        attachments: Array.isArray(contractToEdit.attachments) ? contractToEdit.attachments : [],
      });
    } else if (prefillData) {
      setFormData({
        clientId: prefillData.clientId || '',
        clientName: prefillData.clientName || '',
        title: `Contrato de Prestação de Serviços Advocatícios`,
        legalArea: 'civil',
        responsibleLawyerId: 'usr_2',
        serviceDescription: 'Patrocínio de causa e consultoria jurídica especializada.',
        status: 'assinado',
        value: 20000,
        paymentMethod: 'Parcelado (Boleto / PIX)',
        installmentsCount: 3,
        installmentValue: 6666.66,
        createdDate: new Date().toISOString().split('T')[0],
        sentDate: new Date().toISOString().split('T')[0],
        signedDate: new Date().toISOString().split('T')[0],
        observations: '',
        attachments: Array.isArray(prefillData.attachments) ? prefillData.attachments : [],
      });
    } else {
      setFormData({
        clientId: clients[0]?.id || '',
        clientName: clients[0]?.name || '',
        title: 'Contrato de Prestação de Serviços Advocatícios',
        legalArea: 'civil',
        responsibleLawyerId: 'usr_2',
        serviceDescription: 'Patrocínio de causa e consultoria jurídica especializada.',
        status: 'assinado',
        value: '',
        paymentMethod: 'Parcelado (Boleto / PIX)',
        installmentsCount: 1,
        installmentValue: '',
        createdDate: new Date().toISOString().split('T')[0],
        sentDate: '',
        signedDate: new Date().toISOString().split('T')[0],
        observations: '',
        attachments: [],
      });
    }
  }, [contractToEdit, prefillData, isOpen, clients]);

  const handleClientChange = (clientId) => {
    const selected = clients.find(c => c.id === clientId);
    setFormData(prev => ({
      ...prev,
      clientId,
      clientName: selected ? selected.name : '',
    }));
  };

  const handleFileUpload = async (files) => {
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

    setFormData(prev => ({
      ...prev,
      attachments: [...(prev.attachments || []), ...newAttachments],
    }));
  };

  const removeAttachment = (id) => {
    setFormData(prev => ({
      ...prev,
      attachments: (prev.attachments || []).filter(a => a.id !== id),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.clientName || !formData.value) {
      alert('Por favor, informe o cliente e o valor do contrato.');
      return;
    }

    const lawyer = users.find(u => u.id === formData.responsibleLawyerId);
    const finalData = {
      ...formData,
      responsibleLawyerName: lawyer ? lawyer.name : 'Advogado Responsável',
      value: Number(formData.value) || 0,
      installmentsCount: Number(formData.installmentsCount) || 1,
      installmentValue: (Number(formData.value) || 0) / (Number(formData.installmentsCount) || 1),
      attachments: Array.isArray(formData.attachments) ? formData.attachments : [],
    };

    if (contractToEdit) {
      updateContract(contractToEdit.id, finalData);
    } else {
      addContract(finalData);
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={contractToEdit ? 'Editar Contrato de Honorários' : 'Novo Contrato de Honorários'}
      subtitle="Formalização contratual com valor, forma de pagamento, cláusulas e arquivos anexados"
      maxWidth="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Row 1: Cliente & Título */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Cliente Contratante *
            </label>
            <select
              value={formData.clientId}
              onChange={(e) => handleClientChange(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
            >
              <option value="">Selecione um cliente...</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Título / Identificação do Contrato *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ex: Contrato de Honorários — Ação Revisional"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Row 2: Área, Advogado & Status */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Área Jurídica *
            </label>
            <select
              value={formData.legalArea}
              onChange={(e) => setFormData({ ...formData, legalArea: e.target.value })}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
            >
              {legalAreas.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Advogado Responsável *
            </label>
            <select
              value={formData.responsibleLawyerId}
              onChange={(e) => setFormData({ ...formData, responsibleLawyerId: e.target.value })}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
            >
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Status do Contrato *
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
            >
              {CONTRACT_STATUSES.map(s => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 3: Valor, Forma de Pagamento & Parcelas */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Valor Total dos Honorários (R$) *
            </label>
            <input
              type="number"
              required
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              placeholder="Ex: 25000"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Forma de Pagamento
            </label>
            <input
              type="text"
              value={formData.paymentMethod}
              onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
              placeholder="Ex: 5x Boleto / PIX"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nº de Parcelas
            </label>
            <input
              type="number"
              min="1"
              value={formData.installmentsCount}
              onChange={(e) => setFormData({ ...formData, installmentsCount: e.target.value })}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Row 4: Datas */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Data de Criação
            </label>
            <input
              type="date"
              value={formData.createdDate}
              onChange={(e) => setFormData({ ...formData, createdDate: e.target.value })}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Data de Envio
            </label>
            <input
              type="date"
              value={formData.sentDate}
              onChange={(e) => setFormData({ ...formData, sentDate: e.target.value })}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Data de Assinatura
            </label>
            <input
              type="date"
              value={formData.signedDate}
              onChange={(e) => setFormData({ ...formData, signedDate: e.target.value })}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Escopo & Observações */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Objeto e Escopo dos Serviços Advocatícios
          </label>
          <textarea
            rows={2}
            value={formData.serviceDescription}
            onChange={(e) => setFormData({ ...formData, serviceDescription: e.target.value })}
            placeholder="Descreva detalhadamente o serviço contratado..."
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 p-3 text-xs text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
          />
        </div>

        {/* Seção de Anexos PDF / Word */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-navy-950/50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Paperclip className="h-4 w-4 text-brand-600 dark:text-gold-400" />
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Arquivos do Próprio Escritório (PDF e Word)
              </label>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              Contratos prontos, laudas e minutas (.pdf, .docx, .doc)
            </span>
          </div>

          <div
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (e.dataTransfer.files) handleFileUpload(e.dataTransfer.files);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setIsDragging(false);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer rounded-xl border-2 border-dashed p-4 text-center transition-all ${
              isDragging
                ? 'border-brand-500 bg-brand-50/60 dark:bg-brand-950/30'
                : 'border-slate-300 dark:border-slate-700 hover:border-brand-400 bg-white/60 dark:bg-navy-900/60'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleFileUpload(e.target.files)}
              multiple
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
            />
            <div className="flex items-center justify-center gap-3">
              <UploadCloud className="h-5 w-5 text-brand-600 dark:text-gold-400" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Clique aqui ou arraste arquivos em <strong>PDF</strong> ou <strong>Word (.docx)</strong>
              </span>
            </div>
          </div>

          {/* Lista de Arquivos Anexados no Form */}
          {formData.attachments && formData.attachments.length > 0 && (
            <div className="space-y-2 pt-1">
              <div className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                Arquivos Anexados ({formData.attachments.length}):
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {formData.attachments.map((att) => {
                  const info = getFileTypeInfo(att.name, att.type);
                  return (
                    <div
                      key={att.id}
                      className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-navy-900 p-2 shadow-2xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${info.bgColor} ${info.color}`}>
                          <FileText className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate" title={att.name}>
                            {att.name}
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                            <span className={`px-1 py-0.2 rounded font-semibold text-[8px] uppercase ${info.badgeColor}`}>
                              {info.label}
                            </span>
                            <span>{formatFileSize(att.size)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => openAttachment(att)}
                          className="p-1 rounded-md text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Visualizar / Abrir"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => downloadAttachment(att)}
                          className="p-1 rounded-md text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Baixar arquivo"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeAttachment(att.id)}
                          className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800"
                          title="Remover anexo"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="rounded-xl bg-brand-600 px-5 py-2 text-xs font-semibold text-white shadow-md hover:bg-brand-700 transition-colors"
          >
            {contractToEdit ? 'Salvar Contrato' : 'Criar Contrato'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
