import React, { useState, useEffect, useRef } from 'react';
import { useCRM } from '../../context/CRMContext';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../common/Modal';
import { CONTRACT_STATUSES } from '../../data/legalAreas';
import { readFileAsDataUrl, formatFileSize, getFileTypeInfo, downloadAttachment, openAttachment } from '../../utils/fileHelper';
import { UploadCloud, FileText, X, Download, Eye, Paperclip, Sparkles, ShieldCheck, RefreshCw } from 'lucide-react';
import { generateContractWithAdvJuris } from '../../services/aiService';

export function ContractModal({ isOpen, onClose, contractToEdit = null, prefillData = null }) {
  const { addContract, updateContract, clients = [], legalAreas = [], showToast } = useCRM();
  const { users = [] } = useAuth();
  const fileInputRef = useRef(null);

  const [isDragging, setIsDragging] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
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

  // Assistência de Cláusulas com AdvJuris
  const handleAutoFillAdvJurisClauses = () => {
    const advJurisStandardClauses = `CLÁUSULAS PADRÃO BLINDADAS (ADVJURIS):
1. INADIMPLEMENTO (Regra 46): Multa moratória de 2% sobre o valor devido, juros de mora de 1% ao mês e correção monetária pelo IPCA/IBGE.
2. CONFIDENCIALIDADE & LGPD: Tratamento de dados pessoais em estrita conformidade com a Lei nº 13.709/2018 e sigilo profissional da OAB.
3. RESCISÃO: Aviso prévio por escrito de 30 dias, com quitação proporcional dos atos praticados.
4. FORO DE ELEIÇÃO: Comarca da sede do escritório contratado, com renúncia a qualquer outro.`;

    setFormData(prev => ({
      ...prev,
      observations: prev.observations ? `${prev.observations}\n\n${advJurisStandardClauses}` : advJurisStandardClauses
    }));

    if (showToast) {
      showToast('Cláusulas blindadas do AdvJuris inseridas com sucesso!', 'success');
    }
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
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-xs text-slate-800 dark:text-slate-100 focus:border-brand-500 focus:outline-none"
              required
            >
              <option value="">Selecione o Cliente</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Título do Instrumento *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Ex: Contrato de Prestação de Serviços Advocatícios"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-xs text-slate-800 dark:text-slate-100 focus:border-brand-500 focus:outline-none"
              required
            />
          </div>
        </div>

        {/* Row 2: Área Jurídica, Advogado Responsável & Status */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Área de Atuação
            </label>
            <select
              value={formData.legalArea}
              onChange={(e) => setFormData(prev => ({ ...prev, legalArea: e.target.value }))}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-xs text-slate-800 dark:text-slate-100 focus:border-brand-500 focus:outline-none"
            >
              {legalAreas.map(area => (
                <option key={area.id} value={area.id}>{area.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Advogado Responsável
            </label>
            <select
              value={formData.responsibleLawyerId}
              onChange={(e) => setFormData(prev => ({ ...prev, responsibleLawyerId: e.target.value }))}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-xs text-slate-800 dark:text-slate-100 focus:border-brand-500 focus:outline-none"
            >
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Status do Contrato
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-xs text-slate-800 dark:text-slate-100 focus:border-brand-500 focus:outline-none"
            >
              {CONTRACT_STATUSES.map(st => (
                <option key={st.id} value={st.id}>{st.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 3: Valores & Pagamento */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Valor Total dos Honorários (R$) *
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.value}
              onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
              placeholder="0.00"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-xs text-slate-800 dark:text-slate-100 focus:border-brand-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Forma de Pagamento
            </label>
            <select
              value={formData.paymentMethod}
              onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-xs text-slate-800 dark:text-slate-100 focus:border-brand-500 focus:outline-none"
            >
              <option value="À Vista (PIX / TED)">À Vista (PIX / TED)</option>
              <option value="Parcelado (Boleto / PIX)">Parcelado (Boleto / PIX)</option>
              <option value="Cartão de Crédito">Cartão de Crédito</option>
              <option value="Êxito / Quota Litis">Êxito / Quota Litis</option>
              <option value="Misto (Entrada + Êxito)">Misto (Entrada + Êxito)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nº de Parcelas
            </label>
            <input
              type="number"
              min="1"
              max="60"
              value={formData.installmentsCount}
              onChange={(e) => setFormData(prev => ({ ...prev, installmentsCount: e.target.value }))}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-xs text-slate-800 dark:text-slate-100 focus:border-brand-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Row 4: Objeto do Contrato */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Objeto do Contrato / Descrição dos Serviços
          </label>
          <textarea
            rows={3}
            value={formData.serviceDescription}
            onChange={(e) => setFormData(prev => ({ ...prev, serviceDescription: e.target.value }))}
            placeholder="Detalhe os serviços contratados, instâncias cobertas, etc..."
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 p-3 text-xs text-slate-800 dark:text-slate-100 focus:border-brand-500 focus:outline-none"
          />
        </div>

        {/* Row 5: Cláusulas Especiais & Assistente AdvJuris */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Cláusulas Especiais & Observações
            </label>
            <button
              type="button"
              onClick={handleAutoFillAdvJurisClauses}
              className="flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-amber-600" />
              Inserir Cláusulas Blindadas (AdvJuris)
            </button>
          </div>
          <textarea
            rows={4}
            value={formData.observations}
            onChange={(e) => setFormData(prev => ({ ...prev, observations: e.target.value }))}
            placeholder="Multas, condições de rescisão, foro de eleição, LGPD..."
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 p-3 text-xs text-slate-800 dark:text-slate-100 focus:border-brand-500 focus:outline-none"
          />
        </div>

        {/* Row 6: Anexos (PDF / Word) */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Anexos do Contrato (PDF, DOC, DOCX)
          </label>
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              handleFileUpload(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer rounded-2xl border-2 border-dashed p-4 text-center transition-colors ${
              isDragging
                ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/20'
                : 'border-slate-200 hover:border-brand-300 dark:border-slate-800 dark:hover:border-slate-700'
            }`}
          >
            <UploadCloud className="mx-auto h-6 w-6 text-slate-400" />
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
              Clique ou arraste minutas, laudas e contratos em PDF ou Word
            </p>
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleFileUpload(e.target.files)}
              multiple
              accept=".pdf,.doc,.docx"
              className="hidden"
            />
          </div>

          {formData.attachments && formData.attachments.length > 0 && (
            <div className="mt-3 space-y-2">
              {formData.attachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Paperclip className="h-4 w-4 shrink-0 text-slate-400" />
                    <span className="truncate text-xs font-medium text-slate-700 dark:text-slate-300">
                      {att.name}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      ({formatFileSize(att.size)})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAttachment(att.id)}
                    className="p-1 text-slate-400 hover:text-rose-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="rounded-xl bg-brand-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-brand-600/20 hover:bg-brand-700"
          >
            {contractToEdit ? 'Salvar Alterações' : 'Criar Contrato'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
