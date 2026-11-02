import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Download,
  ExternalLink,
  FileText,
  FolderOpen,
  FolderPlus,
  Layers,
  Pencil,
  Search,
  Trash2,
  Upload,
  UploadCloud,
  X,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Modal } from '../common/Modal';
import { ConfirmModal } from '../common/ConfirmModal';
import { EmptyState } from '../common/EmptyState';
import { Select } from '../common/Select';
import { formatDate } from '../../utils/formatters';
import { formatFileSize, getFileTypeInfo } from '../../utils/fileHelper';
import {
  DEFAULT_FOLDERS,
  TEMPLATE_ACCEPT,
  TEMPLATE_MAX_BYTES,
  createTemplateFolder,
  deleteTemplate,
  deleteTemplateFolder,
  downloadTemplate,
  fetchTemplateLibrary,
  isPdfTemplate,
  isSupportedTemplate,
  openTemplatePdf,
  renameTemplateFolder,
  updateTemplate,
  uploadTemplate,
} from '../../services/templateService';

const ALL = '__todas__';
const FIELD = 'w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none';
const LABEL = 'block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1';
const PRIMARY = 'inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-700 via-brand-600 to-brand-500 px-4 py-2 text-xs font-semibold tracking-wide text-white shadow-md shadow-brand-900/20 hover:brightness-110 transition btn-tactile disabled:opacity-50';
const SECONDARY = 'rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50';

const titleFromFile = (name) => name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ').trim();

export function TemplatesView() {
  const { currentEscritorioId, ownEscritorioId, isConsolidated, showToast, logActivity } = useCRM();
  const { currentUser } = useAuth();

  const [customFolders, setCustomFolders] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState('');
  const [activeFolder, setActiveFolder] = useState(ALL);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [files, setFiles] = useState([]);
  const [uploadForm, setUploadForm] = useState({ title: '', folderId: 'peticoes', notes: '' });
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const [editing, setEditing] = useState(null);
  const [folderModal, setFolderModal] = useState(null); // { id?, name }
  const [toDelete, setToDelete] = useState(null);
  const [folderToDelete, setFolderToDelete] = useState(null);
  const [saving, setSaving] = useState(false);

  // Na visão consolidada mostra tudo, mas o que é novo entra na matriz
  const writeOfficeId = isConsolidated ? ownEscritorioId : (currentEscritorioId || ownEscritorioId);
  const readOfficeId = isConsolidated ? null : writeOfficeId;

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const library = await fetchTemplateLibrary(readOfficeId);
      setCustomFolders(library.customFolders);
      setTemplates(library.templates);
    } catch (err) {
      console.error('[modelos] erro ao carregar:', err);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [readOfficeId]);

  useEffect(() => { load(); }, [load]);

  // O que um colega adiciona aparece aqui sem recarregar a página
  useEffect(() => {
    let timer = null;
    const reload = () => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        try {
          const library = await fetchTemplateLibrary(readOfficeId);
          setCustomFolders(library.customFolders);
          setTemplates(library.templates);
        } catch (err) {
          console.warn('[modelos] erro ao atualizar:', err.message);
        }
      }, 400);
    };
    const channel = supabase.channel(`realtime_modelos_${readOfficeId || 'todos'}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'document_templates' }, reload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'template_folders' }, reload)
      .subscribe();
    window.addEventListener('focus', reload);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('focus', reload);
      supabase.removeChannel(channel);
    };
  }, [readOfficeId]);

  const folders = useMemo(() => {
    // "Outros" fica sempre por último, depois das pastas criadas pela equipe
    const outros = DEFAULT_FOLDERS.find(f => f.id === 'outros');
    return [...DEFAULT_FOLDERS.filter(f => f.id !== 'outros'), ...customFolders, outros];
  }, [customFolders]);

  // Modelo em pasta que não existe mais conta como "Outros"
  const folderIdOf = useCallback((template) => (
    folders.some(f => f.id === template.folder_id) ? template.folder_id : 'outros'
  ), [folders]);

  const counts = useMemo(() => {
    const map = {};
    templates.forEach((t) => {
      const id = folderIdOf(t);
      map[id] = (map[id] || 0) + 1;
    });
    return map;
  }, [templates, folderIdOf]);

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();
    return templates.filter((t) => {
      if (activeFolder !== ALL && folderIdOf(t) !== activeFolder) return false;
      if (!term) return true;
      return [t.title, t.file_name, t.notes].some(v => String(v || '').toLowerCase().includes(term));
    });
  }, [templates, activeFolder, search, folderIdOf]);

  const folderName = (id) => folders.find(f => f.id === id)?.name || 'Outros';
  const isCustomFolder = (id) => customFolders.some(f => f.id === id);

  const openUpload = () => {
    setFiles([]);
    setUploadForm({ title: '', folderId: activeFolder !== ALL ? activeFolder : 'peticoes', notes: '' });
    setUploadOpen(true);
  };

  const addFiles = (list) => {
    const incoming = Array.from(list || []);
    const accepted = [];
    incoming.forEach((file) => {
      if (!isSupportedTemplate(file.name)) {
        showToast(`"${file.name}": envie PDF, Word (.doc, .docx), .odt ou .rtf.`, 'danger');
      } else if (file.size > TEMPLATE_MAX_BYTES) {
        showToast(`"${file.name}" passa de 20 MB.`, 'danger');
      } else {
        accepted.push(file);
      }
    });
    if (accepted.length === 0) return;
    setFiles((prev) => {
      const seen = new Set(prev.map(f => `${f.name}_${f.size}`));
      const next = [...prev, ...accepted.filter(f => !seen.has(`${f.name}_${f.size}`))];
      if (next.length === 1) {
        setUploadForm(form => ({ ...form, title: form.title || titleFromFile(next[0].name) }));
      }
      return next;
    });
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (files.length === 0) return;
    setUploading(true);
    const added = [];
    const failed = [];
    for (const file of files) {
      try {
        const created = await uploadTemplate({
          file,
          title: files.length === 1 && uploadForm.title.trim() ? uploadForm.title : titleFromFile(file.name),
          folderId: uploadForm.folderId,
          notes: uploadForm.notes,
          escritorioId: writeOfficeId,
          uploadedBy: currentUser?.id,
          uploadedByName: currentUser?.name,
        });
        added.push(created);
      } catch (err) {
        console.error('[modelos] erro no envio:', err);
        failed.push(file);
      }
    }
    setUploading(false);
    if (added.length > 0) {
      setTemplates(prev => [...added, ...prev]);
      logActivity('Modelo adicionado', added.map(t => t.title).join(', '), `Pasta: ${folderName(uploadForm.folderId)}`);
    }
    if (failed.length === 0) {
      showToast(added.length === 1 ? 'Modelo adicionado!' : `${added.length} modelos adicionados!`);
      setUploadOpen(false);
      setFiles([]);
    } else {
      // Mantém na janela só o que falhou, para tentar de novo sem repetir o que já subiu
      setFiles(failed);
      showToast(`Não foi possível enviar ${failed.length} arquivo(s). Tente novamente.`, 'danger');
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await updateTemplate(editing.id, editing);
      setTemplates(prev => prev.map(t => (t.id === updated.id ? updated : t)));
      showToast('Modelo atualizado!');
      setEditing(null);
    } catch (err) {
      console.error('[modelos] erro ao salvar:', err);
      showToast('Não foi possível salvar. Tente novamente.', 'danger');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveFolder = async (e) => {
    e.preventDefault();
    const name = folderModal.name.trim();
    if (!name) return;
    const taken = folders.some(f => f.id !== folderModal.id && f.name.toLowerCase() === name.toLowerCase());
    if (taken) {
      showToast('Já existe uma pasta com esse nome.', 'danger');
      return;
    }
    setSaving(true);
    try {
      if (folderModal.id) {
        const updated = await renameTemplateFolder(folderModal.id, name);
        setCustomFolders(prev => prev.map(f => (f.id === updated.id ? updated : f)));
      } else {
        const created = await createTemplateFolder(writeOfficeId, name);
        setCustomFolders(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')));
        setActiveFolder(created.id);
      }
      setFolderModal(null);
    } catch (err) {
      console.error('[modelos] erro na pasta:', err);
      showToast('Não foi possível salvar a pasta. Tente novamente.', 'danger');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFolder = async () => {
    const folder = folderToDelete;
    setFolderToDelete(null);
    try {
      await deleteTemplateFolder(folder.id);
      setCustomFolders(prev => prev.filter(f => f.id !== folder.id));
      if (activeFolder === folder.id) setActiveFolder(ALL);
      showToast('Pasta excluída.');
    } catch (err) {
      console.error('[modelos] erro ao excluir pasta:', err);
      showToast('Não foi possível excluir a pasta.', 'danger');
    }
  };

  const requestDeleteFolder = (folder) => {
    if (counts[folder.id]) {
      showToast('Mova ou exclua os modelos desta pasta antes de apagá-la.', 'danger');
      return;
    }
    setFolderToDelete(folder);
  };

  const handleDelete = async () => {
    const template = toDelete;
    setToDelete(null);
    try {
      await deleteTemplate(template);
      setTemplates(prev => prev.filter(t => t.id !== template.id));
      logActivity('Modelo excluído', template.title, `Pasta: ${folderName(folderIdOf(template))}`);
      showToast('Modelo excluído.');
    } catch (err) {
      console.error('[modelos] erro ao excluir:', err);
      showToast('Não foi possível excluir o modelo.', 'danger');
    }
  };

  const handleDownload = async (template) => {
    try {
      await downloadTemplate(template);
    } catch (err) {
      console.error('[modelos] erro ao baixar:', err);
      showToast('Não foi possível baixar o arquivo. Tente novamente.', 'danger');
    }
  };

  const handleOpen = async (template) => {
    try {
      await openTemplatePdf(template);
    } catch (err) {
      console.error('[modelos] erro ao abrir:', err);
      showToast('Não foi possível abrir o arquivo. Tente novamente.', 'danger');
    }
  };

  const folderCard = (id, name, count, Icon = FolderOpen) => {
    const active = activeFolder === id;
    return (
      <button
        type="button"
        onClick={() => setActiveFolder(id)}
        aria-pressed={active}
        className={`w-full rounded-2xl border p-3 text-left transition-colors ${
          active
            ? 'border-gold-500/70 bg-gold-500/10'
            : 'border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-navy-900 hover:border-gold-500/40'
        }`}
      >
        <Icon className={`h-5 w-5 ${active ? 'text-gold-600 dark:text-gold-400' : 'text-slate-500 dark:text-slate-400'}`} />
        <span className="mt-2 block truncate pr-8 text-xs font-bold text-slate-800 dark:text-slate-100" title={name}>{name}</span>
        <span className="font-numeric text-[11px] text-slate-500 dark:text-slate-400">
          {count} {count === 1 ? 'modelo' : 'modelos'}
        </span>
      </button>
    );
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Barra única: busca à esquerda, ações à direita */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar modelo..."
            className="w-full rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-gold-500/60 focus:outline-none"
          />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFolderModal({ name: '' })}
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <FolderPlus className="h-3.5 w-3.5" /> Nova pasta
          </button>
          <button type="button" onClick={openUpload} className={PRIMARY}>
            <Upload className="h-3.5 w-3.5" /> Adicionar modelo
          </button>
        </div>
      </div>

      {/* Pastas */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {folderCard(ALL, 'Todos os modelos', templates.length, Layers)}
        {folders.map(folder => (
          <div key={folder.id} className="relative">
            {folderCard(folder.id, folder.name, counts[folder.id] || 0)}
            {isCustomFolder(folder.id) && (
              <div className="absolute right-1.5 top-1.5 flex">
                <button
                  type="button"
                  onClick={() => setFolderModal({ id: folder.id, name: folder.name })}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-600 dark:hover:bg-slate-800"
                  aria-label={`Renomear a pasta ${folder.name}`}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => requestDeleteFolder(folder)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-slate-800"
                  aria-label={`Excluir a pasta ${folder.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modelos */}
      {loading ? (
        <p className="py-12 text-center text-xs text-slate-500 dark:text-slate-400">Carregando modelos...</p>
      ) : loadError ? (
        <div className="py-12 text-center">
          <p className="text-xs text-slate-600 dark:text-slate-300">Não foi possível carregar os modelos.</p>
          <button type="button" onClick={load} className="premium-link mt-2">Tentar novamente</button>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={search ? 'Nenhum modelo encontrado' : 'Nenhum modelo nesta pasta'}
          description={search
            ? 'Tente buscar por outro nome.'
            : 'Adicione aqui as petições, contratos e laudos que o escritório usa. Toda a equipe passa a ter acesso.'}
          iconName="FileText"
          actionLabel="Adicionar modelo"
          onAction={openUpload}
        />
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800/60 overflow-hidden rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-navy-900 shadow-xs">
          {filtered.map((template) => {
            const typeInfo = getFileTypeInfo(template.file_name, template.mime_type);
            return (
              <li key={template.id} className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-slate-50/80 dark:hover:bg-white/[0.02]">
                <div className={`flex-shrink-0 rounded-lg p-1.5 ${typeInfo.bgColor} ${typeInfo.color}`}>
                  <FileText className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1 basis-48">
                  <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-100" title={template.title}>{template.title}</p>
                  <p className="truncate text-[11px] text-slate-500 dark:text-slate-400" title={template.notes || template.file_name}>
                    {template.notes || template.file_name}
                  </p>
                </div>
                <span className="hidden rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300 md:inline-flex">
                  {folderName(folderIdOf(template))}
                </span>
                <span className={`rounded px-2 py-0.5 text-[10px] font-extrabold uppercase ${typeInfo.badgeColor}`}>{typeInfo.label}</span>
                <span className="hidden w-16 text-right font-numeric text-[11px] text-slate-500 lg:inline">{formatFileSize(template.file_size)}</span>
                <span className="hidden w-40 truncate text-[11px] text-slate-500 dark:text-slate-400 lg:inline" title={template.uploaded_by_name || ''}>
                  {formatDate(template.created_at)}{template.uploaded_by_name ? ` · ${template.uploaded_by_name}` : ''}
                </span>
                <div className="ml-auto flex items-center gap-1">
                  {isPdfTemplate(template) && (
                    <button
                      type="button"
                      onClick={() => handleOpen(template)}
                      className="rounded-lg p-1.5 text-slate-500 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-slate-800"
                      title="Abrir em nova aba"
                      aria-label={`Abrir ${template.title}`}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDownload(template)}
                    className="rounded-lg p-1.5 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-slate-800"
                    title="Baixar para usar"
                    aria-label={`Baixar ${template.title}`}
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing({ id: template.id, title: template.title, folderId: folderIdOf(template), notes: template.notes || '' })}
                    className="rounded-lg p-1.5 text-slate-500 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-slate-800"
                    title="Renomear ou mudar de pasta"
                    aria-label={`Editar ${template.title}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setToDelete(template)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-slate-800"
                    title="Excluir modelo"
                    aria-label={`Excluir ${template.title}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Adicionar modelo */}
      <Modal
        isOpen={uploadOpen}
        onClose={() => { if (!uploading) setUploadOpen(false); }}
        title="Adicionar modelo"
        subtitle="O arquivo fica disponível para toda a equipe do escritório."
      >
        <form onSubmit={handleUpload} className="space-y-4">
          <label
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); addFiles(e.dataTransfer.files); }}
            className={`block cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-colors ${
              isDragging
                ? 'border-brand-500 bg-brand-50/70 dark:bg-brand-950/30'
                : 'border-slate-300 dark:border-slate-700 hover:border-brand-400'
            }`}
          >
            <input
              type="file"
              multiple
              accept={TEMPLATE_ACCEPT}
              onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }}
              className="hidden"
            />
            <UploadCloud className="mx-auto h-6 w-6 text-slate-400" />
            <p className="mt-2 text-xs font-bold text-slate-800 dark:text-slate-200">Clique para selecionar ou arraste os arquivos aqui</p>
            <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">PDF, Word (.doc, .docx), .odt ou .rtf, até 20 MB cada</p>
          </label>

          {files.length > 0 && (
            <ul className="max-h-40 space-y-1.5 overflow-y-auto pr-1">
              {files.map((file, index) => (
                <li key={`${file.name}_${file.size}`} className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/70 dark:bg-navy-950/70 p-2.5 text-xs">
                  <span className="min-w-0 truncate font-semibold text-slate-800 dark:text-slate-200" title={file.name}>{file.name}</span>
                  <span className="ml-auto flex-shrink-0 font-numeric text-[10px] text-slate-500">{formatFileSize(file.size)}</span>
                  <button
                    type="button"
                    onClick={() => setFiles(prev => prev.filter((_, i) => i !== index))}
                    className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-slate-800"
                    aria-label={`Remover ${file.name}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {files.length <= 1 && (
            <div>
              <label htmlFor="template-title" className={LABEL}>Nome do modelo</label>
              <input
                id="template-title"
                type="text"
                value={uploadForm.title}
                onChange={(e) => setUploadForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Ex: Petição inicial trabalhista"
                className={FIELD}
              />
            </div>
          )}

          <div>
            <label htmlFor="template-folder" className={LABEL}>Pasta</label>
            <Select
              id="template-folder"
              value={uploadForm.folderId}
              onChange={(e) => setUploadForm(f => ({ ...f, folderId: e.target.value }))}
              className={FIELD}
            >
              {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </Select>
          </div>

          {files.length <= 1 && (
            <div>
              <label htmlFor="template-notes" className={LABEL}>
                Observação <span className="font-normal text-slate-400">(opcional)</span>
              </label>
              <input
                id="template-notes"
                type="text"
                value={uploadForm.notes}
                onChange={(e) => setUploadForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Ex: Usar em ações contra INSS"
                className={FIELD}
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800 pt-4">
            <button type="button" disabled={uploading} onClick={() => setUploadOpen(false)} className={SECONDARY}>Cancelar</button>
            <button type="submit" disabled={uploading || files.length === 0} className={PRIMARY}>
              {uploading ? 'Enviando...' : (files.length > 1 ? `Adicionar ${files.length} modelos` : 'Adicionar modelo')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Editar modelo */}
      <Modal isOpen={Boolean(editing)} onClose={() => { if (!saving) setEditing(null); }} title="Editar modelo">
        {editing && (
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div>
              <label htmlFor="edit-template-title" className={LABEL}>Nome do modelo</label>
              <input
                id="edit-template-title"
                type="text"
                required
                value={editing.title}
                onChange={(e) => setEditing(v => ({ ...v, title: e.target.value }))}
                className={FIELD}
              />
            </div>
            <div>
              <label htmlFor="edit-template-folder" className={LABEL}>Pasta</label>
              <Select
                id="edit-template-folder"
                value={editing.folderId}
                onChange={(e) => setEditing(v => ({ ...v, folderId: e.target.value }))}
                className={FIELD}
              >
                {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </Select>
            </div>
            <div>
              <label htmlFor="edit-template-notes" className={LABEL}>
                Observação <span className="font-normal text-slate-400">(opcional)</span>
              </label>
              <input
                id="edit-template-notes"
                type="text"
                value={editing.notes}
                onChange={(e) => setEditing(v => ({ ...v, notes: e.target.value }))}
                className={FIELD}
              />
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800 pt-4">
              <button type="button" disabled={saving} onClick={() => setEditing(null)} className={SECONDARY}>Cancelar</button>
              <button type="submit" disabled={saving || !editing.title.trim()} className={PRIMARY}>
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Nova pasta / renomear */}
      <Modal
        isOpen={Boolean(folderModal)}
        onClose={() => { if (!saving) setFolderModal(null); }}
        title={folderModal?.id ? 'Renomear pasta' : 'Nova pasta'}
        maxWidth="max-w-md"
      >
        {folderModal && (
          <form onSubmit={handleSaveFolder} className="space-y-4">
            <div>
              <label htmlFor="folder-name" className={LABEL}>Nome da pasta</label>
              <input
                id="folder-name"
                type="text"
                required
                autoFocus
                maxLength={60}
                value={folderModal.name}
                onChange={(e) => setFolderModal(v => ({ ...v, name: e.target.value }))}
                placeholder="Ex: Recursos"
                className={FIELD}
              />
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800 pt-4">
              <button type="button" disabled={saving} onClick={() => setFolderModal(null)} className={SECONDARY}>Cancelar</button>
              <button type="submit" disabled={saving || !folderModal.name.trim()} className={PRIMARY}>
                {saving ? 'Salvando...' : (folderModal.id ? 'Salvar' : 'Criar pasta')}
              </button>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmModal
        isOpen={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={handleDelete}
        title="Excluir modelo"
        message={`Excluir "${toDelete?.title || ''}"? O arquivo sai da biblioteca para toda a equipe.`}
        confirmLabel="Sim, excluir"
      />
      <ConfirmModal
        isOpen={Boolean(folderToDelete)}
        onClose={() => setFolderToDelete(null)}
        onConfirm={handleDeleteFolder}
        title="Excluir pasta"
        message={`Excluir a pasta "${folderToDelete?.name || ''}"?`}
        confirmLabel="Sim, excluir"
      />
    </div>
  );
}
