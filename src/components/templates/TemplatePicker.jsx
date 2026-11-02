import React, { useEffect, useMemo, useState } from 'react';
import { Download, Files, Search } from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { DEFAULT_FOLDERS, downloadTemplate, fetchTemplateLibrary } from '../../services/templateService';

// Atalho dentro do contrato: baixa um modelo do escritório para preencher e anexar em seguida.
export function TemplatePicker({ preferredFolder = 'contratos' }) {
  const { currentEscritorioId, ownEscritorioId, isConsolidated, showToast } = useCRM();
  const [open, setOpen] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [customFolders, setCustomFolders] = useState([]);
  const [status, setStatus] = useState('idle');
  const [search, setSearch] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);

  const officeId = isConsolidated ? null : (currentEscritorioId || ownEscritorioId);

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    setStatus('loading');
    fetchTemplateLibrary(officeId)
      .then((library) => {
        if (cancelled) return;
        setTemplates(library.templates);
        setCustomFolders(library.customFolders);
        setStatus('ready');
      })
      .catch((err) => {
        console.error('[modelos] erro ao carregar:', err);
        if (!cancelled) setStatus('error');
      });
    return () => { cancelled = true; };
  }, [open, officeId]);

  const folderName = (id) => [...DEFAULT_FOLDERS, ...customFolders].find(f => f.id === id)?.name || 'Outros';

  // Modelos de contrato aparecem primeiro
  const visible = useMemo(() => {
    const term = search.toLowerCase().trim();
    return templates
      .filter(t => !term || [t.title, t.file_name].some(v => String(v || '').toLowerCase().includes(term)))
      .sort((a, b) => Number(b.folder_id === preferredFolder) - Number(a.folder_id === preferredFolder));
  }, [templates, search, preferredFolder]);

  const handleDownload = async (template) => {
    setDownloadingId(template.id);
    try {
      await downloadTemplate(template);
      showToast('Modelo baixado. Preencha e anexe o arquivo aqui no contrato.');
    } catch (err) {
      console.error('[modelos] erro ao baixar:', err);
      showToast('Não foi possível baixar o modelo. Tente novamente.', 'danger');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-lg border border-gold-300 bg-gold-50 px-2.5 py-1 text-[11px] font-bold text-gold-800 hover:bg-gold-100 dark:border-gold-700 dark:bg-gold-950/40 dark:text-gold-300"
      >
        <Files className="h-3.5 w-3.5 text-gold-600" />
        Usar modelo do escritório
      </button>

      {open && (
        <div className="mt-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-2.5">
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar modelo..."
              aria-label="Buscar modelo"
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-navy-950 pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
            />
          </div>

          {status === 'loading' && <p className="py-3 text-center text-xs text-slate-500 dark:text-slate-400">Carregando modelos...</p>}
          {status === 'error' && <p className="py-3 text-center text-xs text-rose-600 dark:text-rose-400">Não foi possível carregar os modelos.</p>}
          {status === 'ready' && visible.length === 0 && (
            <p className="py-3 text-center text-xs text-slate-500 dark:text-slate-400">
              {search ? 'Nenhum modelo encontrado.' : 'Nenhum modelo ainda. Adicione em Jurídico → Modelos.'}
            </p>
          )}
          {status === 'ready' && visible.length > 0 && (
            <ul className="max-h-44 space-y-1 overflow-y-auto">
              {visible.map(template => (
                <li key={template.id}>
                  <button
                    type="button"
                    disabled={downloadingId === template.id}
                    onClick={() => handleDownload(template)}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-white dark:hover:bg-navy-950 disabled:opacity-50"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-semibold text-slate-800 dark:text-slate-100">{template.title}</span>
                      <span className="block truncate text-[11px] text-slate-500 dark:text-slate-400">{folderName(template.folder_id)}</span>
                    </span>
                    <Download className="h-4 w-4 flex-shrink-0 text-slate-500" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
