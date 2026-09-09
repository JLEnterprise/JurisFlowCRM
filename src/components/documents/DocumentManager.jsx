import React, { useState } from 'react';
import {
  FolderLock,
  Plus,
  Search,
  Download,
  Trash2,
  FileText,
  Shield,
  Upload,
  User,
  Filter,
  FolderPlus,
  ExternalLink,
  Paperclip,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { formatDate } from '../../utils/formatters';
import { EmptyState } from '../common/EmptyState';
import { Modal } from '../common/Modal';
import { ConfirmModal } from '../common/ConfirmModal';
import { readFileAsDataUrl, sanitizeAttachmentForStorage, downloadAttachment, openAttachment, formatFileSize } from '../../utils/fileHelper';

export function DocumentManager() {
  const { documents = [], addDocument, deleteDocument, clients = [], showToast, logActivity } = useCRM();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Deletion confirm modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);

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
    fileName: 'Documento_Digitalizado.pdf',
    fileSize: '1.5 MB',
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

  const [rawFile, setRawFile] = useState(null);

  const handleFilePicked = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRawFile(file);
    const lower = file.name.toLowerCase();
    const autoCat = lower.includes('procur') ? 'Procuração' : (lower.includes('contrat') ? 'Contratos' : (formData.category || 'Documentos pessoais'));
    setFormData(prev => ({
      ...prev,
      title: prev.title || file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '),
      fileName: file.name,
      fileSize: formatFileSize(file.size),
      category: autoCat,
    }));
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.clientName) {
      showToast('Por favor, informe o título e o cliente do documento.', 'danger');
      return;
    }

    let dataUrl = null;
    let safeAtt = null;
    if (rawFile) {
      try {
        dataUrl = await readFileAsDataUrl(rawFile);
        safeAtt = await sanitizeAttachmentForStorage({
          id: `doc_${Date.now()}`,
          name: rawFile.name,
          size: rawFile.size,
          type: rawFile.type,
          dataUrl,
          category: formData.category,
        });
      } catch (err) {
        console.warn('Erro ao processar binário:', err);
      }
    }

    const newDoc = {
      ...formData,
      id: safeAtt?.id || `doc_${Date.now()}`,
      fileName: rawFile ? rawFile.name : (formData.fileName || 'documento.pdf'),
      fileSize: rawFile ? formatFileSize(rawFile.size) : (formData.fileSize || '1.0 MB'),
      uploadedAt: new Date().toISOString(),
      dataUrl: safeAtt?.dataUrl || undefined,
    };

    addDocument(newDoc);
    logActivity('Upload de Documento', newDoc.title, `Documento anexado para o cliente ${formData.clientName}.`);
    showToast('Documento anexado com sucesso!');
    setIsUploadOpen(false);
    setRawFile(null);
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
            Gestão Eletrônica de Documentos protegida por criptografia e controle de acesso LGPD.
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({
              title: '',
              category: selectedCategory || 'Documentos pessoais',
              clientId: clients[0]?.id || '',
              clientName: clients[0]?.name || '',
              fileName: 'Documento_Digitalizado.pdf',
              fileSize: '2.1 MB',
            });
            setIsUploadOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-brand-600/25 hover:from-brand-500 hover:to-brand-600 transition-all btn-tactile"
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
          description="Faça o upload de procurações, contratos ou peças processuais para armazenar com segurança."
          iconName="FolderLock"
          actionLabel="Anexar Documento"
          onAction={() => setIsUploadOpen(true)}
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
                  <th className="px-4 py-3.5">Arquivo & Tamanho</th>
                  <th className="px-4 py-3.5">Data de Upload</th>
                  <th className="px-4 py-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filtered.map((doc) => (
                  <tr
                    key={doc.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Nome do Documento */}
                    <td className="px-4 py-3.5 font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-brand-500 flex-shrink-0" />
                      <span>{doc.title || 'Documento Digitalizado'}</span>
                    </td>

                    {/* Categoria */}
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {doc.category || 'Outros'}
                      </span>
                    </td>

                    {/* Cliente */}
                    <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">
                      {doc.clientName || doc.client_name || 'Geral'}
                    </td>

                    {/* Arquivo */}
                    <td className="px-4 py-3.5 text-slate-500 font-mono text-[11px]">
                      {doc.fileName || 'documento.pdf'} ({doc.fileSize || '1.0 MB'})
                    </td>

                    {/* Data */}
                    <td className="px-4 py-3.5 text-slate-500">
                      {formatDate(doc.uploadedAt || doc.uploaded_at || new Date().toISOString())}
                    </td>

                    {/* Ações */}
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openAttachment(doc)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Visualizar documento"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => downloadAttachment(doc)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Baixar arquivo"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRequestDeleteDoc(doc)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                          title="Excluir documento"
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
        </div>
      )}

      {/* Upload Modal */}
      <Modal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        title="Anexar Novo Documento ao GED"
        subtitle="Carregue procurações, contratos ou peças com classificação e criptografia."
      >
        <form onSubmit={handleUploadSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Arquivo Digitalizado (PDF, Word ou Imagem)
            </label>
            <input
              type="file"
              onChange={handleFilePicked}
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
              className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 dark:file:bg-slate-800 dark:file:text-slate-200"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Título do Documento *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ex: Procuração Ad Judicia Assinada"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Categoria do Arquivo *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
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
                value={formData.clientId}
                onChange={(e) => {
                  const sel = clients.find(c => c.id === e.target.value);
                  setFormData({
                    ...formData,
                    clientId: e.target.value,
                    clientName: sel?.name || 'Cliente',
                  });
                }}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
              >
                <option value="">Selecione um cliente...</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsUploadOpen(false)}
              className="rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-xl bg-brand-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-brand-700 transition-colors"
            >
              Salvar Documento
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
