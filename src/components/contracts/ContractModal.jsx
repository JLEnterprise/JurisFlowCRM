import React, { useState, useEffect, useRef } from 'react';
import { useCRM } from '../../context/CRMContext';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../common/Modal';
import { CONTRACT_STATUSES } from '../../data/legalAreas';
import { readFileAsDataUrl, formatFileSize, getFileTypeInfo, downloadAttachment, openAttachment, sanitizeAttachmentForStorage } from '../../utils/fileHelper';
import { UploadCloud, FileText, X, Download, Eye, Paperclip, Sparkles, ShieldCheck, RefreshCw } from 'lucide-react';
import { generateContractWithAdvJuris } from '../../services/aiService';
import { Select } from '../common/Select';
import { PaymentPlanPicker } from './PaymentPlanPicker';
import { DateField } from '../common/DateField';
import { normalizePlan } from '../../utils/paymentPlan';

export function ContractModal({ isOpen, onClose, contractToEdit = null, prefillData = null }) {
  const { contracts = [], addContract, updateContract, clients = [], legalAreas = [], showToast } = useCRM();
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

  const isExistingContract = Boolean(
    contractToEdit && contractToEdit.id && contracts.some(c => c.id === contractToEdit.id)
  );
  const effectivePrefill = prefillData || (!isExistingContract && contractToEdit ? contractToEdit : null);

  useEffect(() => {
    if (isExistingContract && contractToEdit) {
      setFormData({
        ...contractToEdit,
        attachments: Array.isArray(contractToEdit.attachments) ? contractToEdit.attachments : [],
      });
    } else if (effectivePrefill) {
      const prefVal = effectivePrefill.value !== undefined && effectivePrefill.value !== ''
        ? effectivePrefill.value
        : (effectivePrefill.feeValue !== undefined ? effectivePrefill.feeValue : 20000);
      const prefInstCount = Number(effectivePrefill.installmentsCount) || 3;
      const numericVal = Number(prefVal) || 0;

      setFormData({
        clientId: effectivePrefill.clientId || '',
        clientName: effectivePrefill.clientName || effectivePrefill.leadName || '',
        title: effectivePrefill.title || `Contrato de Prestação de Serviços Advocatícios`,
        legalArea: effectivePrefill.legalArea || 'civil',
        responsibleLawyerId: effectivePrefill.responsibleLawyerId || effectivePrefill.responsibleId || 'usr_2',
        serviceDescription: effectivePrefill.serviceDescription || effectivePrefill.description || 'Patrocínio de causa e consultoria jurídica especializada.',
        status: effectivePrefill.status || 'assinado',
        value: prefVal,
        paymentMethod: effectivePrefill.paymentMethod || 'Parcelado (Boleto / PIX)',
        installmentsCount: prefInstCount,
        installmentValue: numericVal > 0 ? (numericVal / prefInstCount).toFixed(2) : '',
        createdDate: effectivePrefill.createdDate || new Date().toISOString().split('T')[0],
        sentDate: effectivePrefill.sentDate || new Date().toISOString().split('T')[0],
        signedDate: effectivePrefill.signedDate || new Date().toISOString().split('T')[0],
        observations: effectivePrefill.observations || '',
        attachments: Array.isArray(effectivePrefill.attachments) ? effectivePrefill.attachments : [],
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
  }, [contractToEdit, prefillData, isOpen, clients, isExistingContract]);

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
        const rawAtt = {
          id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          size: file.size,
          type: file.type || (fileExt === '.pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'),
          dataUrl,
          uploadedAt: new Date().toISOString(),
          category: file.name.toLowerCase().includes('procur') ? 'Procuração' : 'Contratos',
        };
        const safeAtt = await sanitizeAttachmentForStorage(rawAtt);
        newAttachments.push(safeAtt);
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
    // Valor, nº de parcelas e 1º vencimento saem do plano (no mensal: mensalidade × meses do ciclo)
    const plan = normalizePlan(formData);
    if (!formData.clientName || !plan.value) {
      alert(plan.paymentType === 'recorrente'
        ? 'Por favor, informe o cliente e o valor da mensalidade.'
        : 'Por favor, informe o cliente e o valor do contrato.');
      return;
    }

    const lawyer = users.find(u => u.id === formData.responsibleLawyerId);
    const finalData = {
      ...formData,
      ...plan,
      responsibleLawyerName: lawyer ? lawyer.name : 'Advogado Responsável',
      attachments: Array.isArray(formData.attachments) ? formData.attachments : [],
    };

    if (isExistingContract && contractToEdit?.id) {
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
      title={isExistingContract ? 'Editar Contrato de Honorários' : 'Novo Contrato de Honorários'}
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
            <Select
              value={formData.clientId}
              onChange={(e) => handleClientChange(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-xs text-slate-800 dark:text-slate-100 focus:border-brand-500 focus:outline-none"
              required
            >
              <option value="">Selecione o Cliente</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
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
            <Select
              value={formData.legalArea}
              onChange={(e) => setFormData(prev => ({ ...prev, legalArea: e.target.value }))}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-xs text-slate-800 dark:text-slate-100 focus:border-brand-500 focus:outline-none"
            >
              {legalAreas.map(area => (
                <option key={area.id} value={area.id}>{area.name}</option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Advogado Responsável
            </label>
            <Select
              value={formData.responsibleLawyerId}
              onChange={(e) => setFormData(prev => ({ ...prev, responsibleLawyerId: e.target.value }))}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-xs text-slate-800 dark:text-slate-100 focus:border-brand-500 focus:outline-none"
            >
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Status do Contrato
            </label>
            <Select
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-xs text-slate-800 dark:text-slate-100 focus:border-brand-500 focus:outline-none"
            >
              {CONTRACT_STATUSES.map(st => (
                <option key={st.id} value={st.id}>{st.label}</option>
              ))}
            </Select>
          </div>
        </div>

        {/* Row 3: Plano de pagamento (parcelado ou mensal recorrente) & forma */}
        <PaymentPlanPicker
          plan={formData}
          onChange={(partial) => setFormData(prev => ({ ...prev, ...partial }))}
          paymentMethodField={(
            <div className="sm:w-1/3">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Forma de Pagamento
              </label>
              <Select
                value={formData.paymentMethod}
                onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-xs text-slate-800 dark:text-slate-100 focus:border-brand-500 focus:outline-none"
              >
                <option value="À Vista (PIX / TED)">À Vista (PIX / TED)</option>
                <option value="Parcelado (Boleto / PIX)">Parcelado (Boleto / PIX)</option>
                <option value="Mensalidade (Boleto / PIX)">Mensalidade (Boleto / PIX)</option>
                <option value="Débito Automático">Débito Automático</option>
                <option value="Cartão de Crédito">Cartão de Crédito</option>
                <option value="Êxito / Quota Litis">Êxito / Quota Litis</option>
                <option value="Misto (Entrada + Êxito)">Misto (Entrada + Êxito)</option>
              </Select>
            </div>
          )}
        />

        {/* Datas: assinatura e término (vencimento do contrato) */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Data de Assinatura
            </label>
            <DateField
              type="date"
              value={formData.signedDate || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, signedDate: e.target.value }))}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-xs text-slate-800 dark:text-slate-100 focus:border-brand-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Término do Contrato <span className="font-normal text-slate-400">(opcional)</span>
            </label>
            <DateField
              type="date"
              value={formData.endDate || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-xs text-slate-800 dark:text-slate-100 focus:border-brand-500 focus:outline-none"
            />
          </div>
          <p className="self-end pb-2 text-[11px] leading-snug text-slate-400">
            {formData.paymentType === 'recorrente' && Number(formData.recurringMonths) === 0
              ? 'Mensal sem prazo: deixe o término vazio.'
              : 'Sem término, o vencimento considera a última parcela.'}
          </p>
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
              className="flex items-center gap-1.5 rounded-lg border border-gold-300 bg-gold-50 px-2.5 py-1 text-[11px] font-bold text-gold-800 hover:bg-gold-100 dark:border-gold-700 dark:bg-gold-950/40 dark:text-gold-300"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-gold-600" />
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
            className="rounded-full bg-gradient-to-r from-brand-700 via-brand-600 to-brand-500 px-5 py-2 text-xs font-bold text-white shadow-md shadow-brand-900/20 hover:brightness-110"
          >
            {contractToEdit ? 'Salvar Alterações' : 'Criar Contrato'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
