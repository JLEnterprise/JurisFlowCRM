import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  FileCode,
  X,
  CheckCircle2,
  AlertCircle,
  Plus,
  Paperclip,
  ArrowRight
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { useCRM } from '../../context/CRMContext';
import { readFileAsDataUrl, formatFileSize, getFileTypeInfo } from '../../utils/fileHelper';

export function QuickAttachModal({ isOpen, onClose, onContractCreated }) {
  const { contracts = [], updateContract, addContract, clients = [], showToast, logActivity } = useCRM();

  const [mode, setMode] = useState('existing'); // 'existing' | 'new'
  const [selectedContractId, setSelectedContractId] = useState('');
  const [clientId, setClientId] = useState('');
  const [contractTitle, setContractTitle] = useState('');
  const [contractValue, setContractValue] = useState('');
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);

  // Limpar estado ao abrir
  React.useEffect(() => {
    if (isOpen) {
      setFiles([]);
      setSelectedContractId(contracts[0]?.id || '');
      setClientId(clients[0]?.id || '');
      setContractTitle('');
      setContractValue('');
      setMode(contracts.length > 0 ? 'existing' : 'new');
    }
  }, [isOpen, contracts, clients]);

  const handleFileSelect = async (selectedFileList) => {
    if (!selectedFileList || selectedFileList.length === 0) return;

    setIsProcessing(true);
    const newFiles = [];

    for (let i = 0; i < selectedFileList.length; i++) {
      const file = selectedFileList[i];
      const validExtensions = ['.pdf', '.doc', '.docx'];
      const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

      if (!validExtensions.includes(fileExt) && !file.type.includes('pdf') && !file.type.includes('word') && !file.type.includes('officedocument')) {
        alert(`O arquivo "${file.name}" não é um PDF ou Word suportado (.pdf, .doc, .docx).`);
        continue;
      }

      try {
        const dataUrl = await readFileAsDataUrl(file);
        newFiles.push({
          id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          size: file.size,
          type: file.type || (fileExt === '.pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'),
          dataUrl,
          uploadedAt: new Date().toISOString(),
        });

        // Se estiver criando novo contrato e o título estiver vazio, usa o nome do arquivo
        if (!contractTitle && newFiles.length === 1) {
          const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
          setContractTitle(`Contrato: ${cleanName}`);
        }
      } catch (err) {
        console.error('Erro ao ler arquivo:', err);
      }
    }

    setFiles(prev => [...prev, ...newFiles]);
    setIsProcessing(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const removeFile = (id) => {
    setFiles(files.filter(f => f.id !== id));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (files.length === 0) {
      alert('Por favor, selecione ao menos um arquivo em PDF ou Word (.docx/.doc).');
      return;
    }

    if (mode === 'existing') {
      const targetContract = contracts.find(c => c.id === selectedContractId);
      if (!targetContract) {
        alert('Selecione um contrato existente para anexar os arquivos.');
        return;
      }

      const existingAttachments = Array.isArray(targetContract.attachments) ? targetContract.attachments : [];
      const updatedAttachments = [...existingAttachments, ...files];

      updateContract(targetContract.id, {
        ...targetContract,
        attachments: updatedAttachments,
      });

      logActivity(
        'Anexo de Documento',
        targetContract.contractNumber || targetContract.contract_number || 'Contrato',
        `${files.length} arquivo(s) (PDF/Word) anexado(s) ao contrato.`
      );

      showToast(`${files.length} arquivo(s) anexado(s) com sucesso ao contrato!`);
      onClose();
    } else {
      // Modo Novo Contrato a partir de arquivo
      const client = clients.find(c => c.id === clientId);
      if (!client) {
        alert('Por favor, selecione o cliente contratante.');
        return;
      }

      const val = Number(contractValue) || 0;
      const newContract = {
        clientId: client.id,
        clientName: client.name,
        title: contractTitle || `Contrato / Minuta (${files[0]?.name || 'Escritório'})`,
        legalArea: client.legalArea || 'civil',
        responsibleLawyerId: client.responsibleLawyerId || 'usr_2',
        serviceDescription: `Contrato formalizado com anexo de documento externo (${files.map(f => f.name).join(', ')}).`,
        status: 'assinado',
        value: val,
        paymentMethod: 'A combinar',
        installmentsCount: 1,
        installmentValue: val,
        createdDate: new Date().toISOString().split('T')[0],
        signedDate: new Date().toISOString().split('T')[0],
        attachments: files,
      };

      addContract(newContract);
      logActivity(
        'Novo Contrato com Anexo',
        newContract.title,
        `Contrato criado a partir de ${files.length} arquivo(s) anexado(s).`
      );

      showToast(`Novo contrato criado com ${files.length} arquivo(s) anexado(s)!`);
      if (onContractCreated) onContractCreated(newContract);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Anexar Arquivos do Escritório (PDF / Word)"
      subtitle="Adicione contratos prontos, laudas, minutas em Word (.docx/.doc) ou PDFs escaneados"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Escolha do Modo */}
        <div className="flex rounded-xl bg-slate-100 dark:bg-navy-950 p-1 border border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setMode('existing')}
            className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${
              mode === 'existing'
                ? 'bg-white dark:bg-navy-800 text-brand-600 dark:text-gold-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Anexar a Contrato Existente
          </button>
          <button
            type="button"
            onClick={() => setMode('new')}
            className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${
              mode === 'new'
                ? 'bg-white dark:bg-navy-800 text-brand-600 dark:text-gold-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Criar Novo Contrato com este Arquivo
          </button>
        </div>

        {/* Campos condicionais baseados no Modo */}
        {mode === 'existing' ? (
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Selecione o Contrato de Destino *
            </label>
            {contracts.length === 0 ? (
              <div className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/40 p-3 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>Nenhum contrato cadastrado ainda. Mude para a opção "Criar Novo Contrato com este Arquivo".</span>
              </div>
            ) : (
              <select
                value={selectedContractId}
                onChange={(e) => setSelectedContractId(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
              >
                {contracts.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.contractNumber || c.contract_number || 'S/N'} — {c.clientName || c.client_name || 'Cliente'} ({c.title || 'Contrato'})
                  </option>
                ))}
              </select>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Cliente Contratante *
              </label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
              >
                <option value="">Selecione o cliente...</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Título / Objeto do Contrato
              </label>
              <input
                type="text"
                value={contractTitle}
                onChange={(e) => setContractTitle(e.target.value)}
                placeholder="Ex: Minuta Própria — Contrato de Honorários"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Valor dos Honorários (R$)
              </label>
              <input
                type="number"
                value={contractValue}
                onChange={(e) => setContractValue(e.target.value)}
                placeholder="Ex: 15000"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Área de Drag and Drop de Arquivos */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Arquivos em PDF ou Word (.pdf, .doc, .docx) *
          </label>
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
              isDragging
                ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/20'
                : 'border-slate-300 dark:border-slate-700 hover:border-brand-400 bg-slate-50/50 dark:bg-navy-950/40'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleFileSelect(e.target.files)}
              multiple
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 dark:bg-brand-950/80 text-brand-600 dark:text-gold-400 shadow-xs">
                <UploadCloud className="h-6 w-6" />
              </div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Arraste os arquivos aqui ou <span className="text-brand-600 dark:text-gold-400 underline">clique para selecionar</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Formatos aceitos: <strong>PDF (.pdf)</strong> e <strong>Word (.doc, .docx)</strong> de laudas e contratos
              </p>
            </div>
          </div>
        </div>

        {/* Lista de Arquivos Selecionados */}
        {files.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Arquivos Prontos para Anexar ({files.length})</span>
              <span className="text-[11px] text-slate-400">
                Total: {formatFileSize(files.reduce((a, b) => a + (b.size || 0), 0))}
              </span>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
              {files.map((file) => {
                const info = getFileTypeInfo(file.name, file.type);
                return (
                  <div
                    key={file.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-navy-900 p-2.5 shadow-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${info.bgColor} ${info.color}`}>
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                          {file.name}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-2">
                          <span className={`px-1.5 py-0.2 rounded font-semibold text-[9px] uppercase ${info.badgeColor}`}>
                            {info.label}
                          </span>
                          <span>{formatFileSize(file.size)}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFile(file.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors shrink-0"
                      title="Remover arquivo"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Botões de Ação */}
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
            disabled={files.length === 0 || isProcessing}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <CheckCircle2 className="h-4 w-4" />
            {mode === 'existing' ? 'Concluir e Anexar Arquivos' : 'Criar Contrato com Anexos'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
