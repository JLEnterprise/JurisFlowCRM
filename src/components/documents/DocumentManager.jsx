import React, { useState, useRef } from 'react';
import {
  FolderLock,
  Plus,
  Search,
  Download,
  Trash2,
  FileText,
  Shield,
  Upload,
  UploadCloud,
  User,
  Filter,
  FolderPlus,
  ExternalLink,
  Paperclip,
  X,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Eye,
  File,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { formatDate } from '../../utils/formatters';
import { EmptyState } from '../common/EmptyState';
import { Modal } from '../common/Modal';
import { ConfirmModal } from '../common/ConfirmModal';
import {
  readFileAsDataUrl,
  sanitizeAttachmentForStorage,
  downloadAttachment,
  openAttachment,
  formatFileSize,
  getFileTypeInfo,
} from '../../utils/fileHelper';

export function DocumentManager() {
  const { documents = [], addDocument, deleteDocument, clients = [], showToast, logActivity } = useCRM();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Deletion confirm modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);

  // Upload modal state
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const fileInputRef = useRef(null);

  const [categories] = useState([
    'Documentos pessoais',
    'Contratos',
    'Procurações',
    'Comprovantes',
    'Documentos processuais',
    'Outros',
  ]);

  const [formData, setFormData] = useState({
    title: '',
    category: 'Documentos pessoais',
    clientId: '',
    clientName: '',
  });

  const filtered = (documents || []).filter(d => {
    if (!d) return false;
    const term = (search || '').toLowerCase().trim();
    const title = String(d.title || '').toLowerCase();
    const clientName = String(d.clientName || d.client_name || '').toLowerCase();
    const fileName = String(d.fileName || d.file_name || '').toLowerCase();

    const matchesSearch = !term ||
      title.includes(term) ||
      clientName.includes(term) ||
      fileName.includes(term);

    const matchesCat = !selectedCategory || (d.category || 'Outros') === selectedCategory;

    return matchesSearch && matchesCat;
  });

  // Função auxiliar para detectar categoria inteligente pelo nome do arquivo
  const detectCategoryFromName = (fileName = '') => {
    const lower = fileName.toLowerCase();
    if (lower.includes('procur') || lower.includes('substab')) return 'Procurações';
    if (lower.includes('contrat') || lower.includes('termo') || lower.includes('acordo')) return 'Contratos';
    if (lower.includes('comprov') || lower.includes('recibo') || lower.includes('residencia') || lower.includes('pagamento')) return 'Comprovantes';
    if (lower.includes('peti') || lower.includes('recur') || lower.includes('senten') || lower.includes('despacho') || lower.includes('contest')) return 'Documentos processuais';
    if (lower.includes('rg') || lower.includes('cnh') || lower.includes('cpf') || lower.includes('certidao')) return 'Documentos pessoais';
    return 'Outros';
  };

  const handleFilesAdded = (filesList) => {
    if (!filesList || filesList.length === 0) return;
    const newFiles = Array.from(filesList);
    setSelectedFiles(prev => {
      const combined = [...prev, ...newFiles];
      // Deduplicar por nome e tamanho
      const unique = [];
      const seen = new Set();
      for (const f of combined) {
        const key = `${f.name}_${f.size}`;
        if (!seen.has(key)) {
          seen.add(key);
          unique.push(f);
        }
      }
      return unique;
    });

    // Se for o primeiro ou único arquivo adicionado, auto preenche os campos
    if (newFiles.length === 1 && !formData.title) {
      const first = newFiles[0];
      const autoCat = detectCategoryFromName(first.name);
      setFormData(prev => ({
        ...prev,
        title: first.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '),
        category: autoCat,
      }));
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesAdded(e.dataTransfer.files);
    }
  };

  const removeSelectedFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const openUploadModal = () => {
    setFormData({
      title: '',
      category: selectedCategory || 'Documentos pessoais',
      clientId: clients[0]?.id || '',
      clientName: clients[0]?.name || '',
    });
    setSelectedFiles([]);
    setIsUploadOpen(true);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!formData.clientName) {
      showToast('Por favor, selecione o cliente vinculado ao documento.', 'danger');
      return;
    }

    if (selectedFiles.length === 0) {
      showToast('Por favor, selecione ao menos um arquivo PDF, Word ou imagem.', 'danger');
      return;
    }

    setIsUploading(true);

    try {
      let count = 0;
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        let dataUrl = null;
        let safeAtt = null;

        try {
          dataUrl = await readFileAsDataUrl(file);
          safeAtt = await sanitizeAttachmentForStorage({
            id: `doc_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 4)}`,
            name: file.name,
            size: file.size,
            type: file.type,
            dataUrl,
            category: selectedFiles.length === 1 ? formData.category : detectCategoryFromName(file.name),
          });
        } catch (err) {
          console.warn('Erro ao processar binário do arquivo:', file.name, err);
        }

        const docTitle = selectedFiles.length === 1 && formData.title
          ? formData.title
          : file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');

        const docCategory = selectedFiles.length === 1 && formData.category
          ? formData.category
          : detectCategoryFromName(file.name);

        const newDoc = {
          id: safeAtt?.id || `doc_${Date.now()}_${i}`,
          title: docTitle,
          category: docCategory,
          clientId: formData.clientId || clients[0]?.id || '',
          clientName: formData.clientName || clients[0]?.name || 'Cliente Geral',
          fileName: file.name,
          fileSize: formatFileSize(file.size),
          uploadedAt: new Date().toISOString(),
          dataUrl: safeAtt?.dataUrl || undefined,
        };

        addDocument(newDoc);
        logActivity('Upload de Documento', newDoc.title, `Documento anexado no acervo GED para o cliente ${newDoc.clientName}.`);
        count++;
      }

      showToast(`${count} documento(s) anexado(s) com sucesso ao acervo!`, 'success');
      setIsUploadOpen(false);
      setSelectedFiles([]);
    } catch (err) {
      console.error('Erro no upload de documentos:', err);
      showToast('Ocorreu um erro ao salvar o documento. Tente novamente.', 'danger');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRequestDeleteDoc = (doc) => {
    setDocumentToDelete(doc);
    setDeleteModalOpen(true);
  };

  const handleConfirmDeleteDoc = () => {
    if (documentToDelete) {
      const docId = documentToDelete.id;
      const docTitle = documentToDelete.title || 'Documento';
      setDeleteModalOpen(false);
      setDocumentToDelete(null);
      deleteDocument(docId);
      logActivity('Exclusão de Documento', docTitle, 'Documento removido do acervo.');
      showToast('Documento excluído com sucesso!');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top action header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <FolderLock className="h-6 w-6 text-brand-600 dark:text-gold-400" />
            Documentos & GED Jurídico
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Gestão Eletrônica de Documentos com suporte total a PDF e Word, criptografia e controle de acesso LGPD.
          </p>
        </div>

        <button
          onClick={openUploadModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-brand-600/25 hover:from-brand-500 hover:to-brand-600 transition-all btn-tactile cursor-pointer"
        >
          <Upload className="h-4 w-4" /> Anexar Documento
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-white dark:bg-navy-900/90 border border-slate-200/80 dark:border-white/[0.08] p-3 shadow-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por documento, cliente ou arquivo..."
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-navy-950/60 pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-brand-500 focus:outline-none"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-navy-900 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 shadow-xs focus:outline-none"
        >
          <option value="">Todas as Categorias</option>
          {categories.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        {(selectedCategory || search) && (
          <button
            onClick={() => {
              setSelectedCategory('');
              setSearch('');
            }}
            className="text-xs text-rose-600 dark:text-rose-400 hover:underline px-2"
          >
            Limpar Filtros
          </button>
        )}
      </div>

      {/* Documents Table / Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          title="Nenhum documento encontrado"
          description="Faça o upload de procurações, contratos ou peças processuais (PDF e Word) para armazenar com segurança."
          iconName="FolderLock"
          actionLabel="Anexar Documento"
          onAction={openUploadModal}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-navy-900 shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-navy-950/75 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Documento</th>
                  <th className="px-4 py-3.5">Categoria</th>
                  <th className="px-4 py-3.5">Cliente Vinculado</th>
                  <th className="px-4 py-3.5">Arquivo & Formato</th>
                  <th className="px-4 py-3.5">Data de Upload</th>
                  <th className="px-4 py-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filtered.map((doc) => {
                  const fileName = doc.fileName || doc.file_name || doc.name || 'documento.pdf';
                  const typeInfo = getFileTypeInfo(fileName);

                  return (
                    <tr
                      key={doc.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      {/* Nome do Documento */}
                      <td className="px-4 py-3.5 font-bold text-slate-800 dark:text-slate-200">
                        <div className="flex items-center gap-2.5">
                          <div className={`p-1.5 rounded-lg ${typeInfo.bgColor} ${typeInfo.color} flex-shrink-0`}>
                            <FileText className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="block font-bold text-slate-800 dark:text-slate-200">
                              {doc.title || 'Documento Digitalizado'}
                            </span>
                            <span className="text-[11px] font-normal text-slate-400 font-mono">
                              {fileName}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Categoria */}
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {doc.category || 'Outros'}
                        </span>
                      </td>

                      {/* Cliente */}
                      <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300 font-medium">
                        {doc.clientName || doc.client_name || 'Geral'}
                      </td>

                      {/* Arquivo & Formato */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${typeInfo.badgeColor}`}>
                            {typeInfo.label}
                          </span>
                          <span className="text-slate-500 font-mono text-[11px]">
                            {doc.fileSize || formatFileSize(doc.size) || '1.2 MB'}
                          </span>
                        </div>
                      </td>

                      {/* Data */}
                      <td className="px-4 py-3.5 text-slate-500">
                        {formatDate(doc.uploadedAt || doc.uploaded_at || new Date().toISOString())}
                      </td>

                      {/* Ações */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openAttachment(doc)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-slate-800 transition-colors"
                            title="Visualizar documento em nova aba"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              await downloadAttachment(doc);
                              showToast(`Download de "${fileName}" iniciado!`, 'success');
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors"
                            title="Baixar arquivo para o computador"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRequestDeleteDoc(doc)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                            title="Excluir documento"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Upload Modal Profissional com Dropzone */}
      <Modal
        isOpen={isUploadOpen}
        onClose={() => {
          if (!isUploading) {
            setIsUploadOpen(false);
            setSelectedFiles([]);
          }
        }}
        title="Anexar Documentos ao GED Jurídico"
        subtitle="Carregue contratos, procurações ou arquivos PDF e Word com criptografia e organização."
      >
        <form onSubmit={handleUploadSubmit} className="space-y-4">
          {/* Dropzone de Arquivos */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Selecione ou Arraste seus Arquivos (PDF, Word ou Imagem) *
            </label>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 ${
                isDragging
                  ? 'border-brand-500 bg-brand-50/70 dark:bg-brand-950/30 scale-[1.01]'
                  : 'border-slate-300 dark:border-slate-700 hover:border-brand-400 hover:bg-slate-50/60 dark:hover:bg-navy-950/40'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                onChange={(e) => handleFilesAdded(e.target.files)}
                className="hidden"
              />

              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/50 flex items-center justify-center text-brand-600 dark:text-brand-400 shadow-sm">
                  <UploadCloud className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    <span className="text-brand-600 dark:text-gold-400 hover:underline">Clique para selecionar</span> ou arraste os arquivos aqui
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                    Formatos suportados: <strong className="text-slate-600 dark:text-slate-300">PDF (.pdf)</strong>, <strong className="text-slate-600 dark:text-slate-300">Word (.docx, .doc)</strong> e Imagens
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Lista de Arquivos Selecionados */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Arquivos Prontos para Anexo ({selectedFiles.length}):
              </label>
              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                {selectedFiles.map((file, idx) => {
                  const typeInfo = getFileTypeInfo(file.name, file.type);
                  return (
                    <div
                      key={`${file.name}_${idx}`}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/70 dark:bg-navy-950/70 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${typeInfo.badgeColor}`}>
                          {typeInfo.label}
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 dark:text-slate-200 truncate" title={file.name}>
                            {file.name}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSelectedFile(idx);
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800"
                        title="Remover arquivo"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Dados Adicionais (Título se 1 arquivo, Categoria, Cliente) */}
          {selectedFiles.length <= 1 && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Título do Documento *
              </label>
              <input
                type="text"
                required={selectedFiles.length <= 1}
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Contrato de Honorários Assinado"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Categoria do Arquivo *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
              >
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Cliente Vinculado *
              </label>
              <select
                required
                value={formData.clientId}
                onChange={(e) => {
                  const sel = clients.find(c => c.id === e.target.value);
                  setFormData({
                    ...formData,
                    clientId: e.target.value,
                    clientName: sel?.name || 'Cliente',
                  });
                }}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
              >
                <option value="">Selecione o cliente...</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Ações do Modal */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              disabled={isUploading}
              onClick={() => {
                setIsUploadOpen(false);
                setSelectedFiles([]);
              }}
              className="rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isUploading || selectedFiles.length === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-brand-700 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isUploading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processando Arquivo(s)...
                </>
              ) : (
                <>
                  <FileCheck className="w-4 h-4" />
                  Salvar Documento{selectedFiles.length > 1 ? 's' : ''}
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDocumentToDelete(null);
        }}
        onConfirm={handleConfirmDeleteDoc}
        title="Excluir Documento"
        message={`Deseja realmente excluir o documento "${documentToDelete?.title || 'selecionado'}" do acervo?`}
        confirmLabel="Sim, Excluir"
      />
    </div>
  );
}

