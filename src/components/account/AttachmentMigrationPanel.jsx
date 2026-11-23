import React, { useState } from 'react';
import { CheckCircle2, HardDriveUpload, Search } from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { supabase } from '../../lib/supabase';
import { dataUrlToBlob, formatFileSize, mimeOf, uploadAttachmentBlob } from '../../utils/fileHelper';

// Move os arquivos guardados DENTRO dos contratos e documentos (texto base64 no banco) para o
// espaço de arquivos (Storage). O registro passa a guardar só o caminho, e a lista de contratos
// volta a carregar rápido. Pode rodar quantas vezes quiser: o que já foi movido é pulado.
// Ordem segura: o arquivo sobe primeiro; o registro só muda depois que todos os arquivos dele subiram.

const isEmbedded = (v) => typeof v === 'string' && v.startsWith('data:');
const embeddedBytes = (v) => (isEmbedded(v) ? Math.round((v.length - v.indexOf(',') - 1) * 0.75) : 0);

export function AttachmentMigrationPanel() {
  const { currentEscritorioId, ownEscritorioId, isConsolidated, showToast, logActivity } = useCRM();
  const officeId = isConsolidated ? ownEscritorioId : (currentEscritorioId || ownEscritorioId);

  const [status, setStatus] = useState('idle'); // idle | checking | checked | moving | done
  const [summary, setSummary] = useState(null);
  const [progress, setProgress] = useState({ done: 0, total: 0, failed: 0 });

  // Contratos um por um: buscar todos juntos é justamente o que passa do tempo limite hoje
  const listContracts = async () => {
    const { data, error } = await supabase.from('contracts').select('id').eq('escritorio_id', officeId);
    if (error) throw error;
    return (data || []).map(r => r.id);
  };
  const loadContract = async (id) => {
    const { data, error } = await supabase.from('contracts').select('id, raw_data').eq('id', id).single();
    if (error) throw error;
    return data;
  };
  const listDocuments = async () => {
    const { data, error } = await supabase
      .from('documents').select('id, raw_data')
      .eq('escritorio_id', officeId)
      .like('raw_data->>dataUrl', 'data:%');
    if (error) throw error;
    return data || [];
  };

  const handleCheck = async () => {
    setStatus('checking');
    try {
      const ids = await listContracts();
      let files = 0;
      let bytes = 0;
      let contractsWithFiles = 0;
      for (const id of ids) {
        const row = await loadContract(id);
        const atts = (row.raw_data?.attachments || []).filter(a => isEmbedded(a?.dataUrl));
        if (atts.length) contractsWithFiles += 1;
        files += atts.length;
        bytes += atts.reduce((acc, a) => acc + embeddedBytes(a.dataUrl), 0);
      }
      const docs = await listDocuments();
      setSummary({
        contracts: ids.length,
        contractsWithFiles,
        files,
        docs: docs.length,
        bytes: bytes + docs.reduce((acc, d) => acc + embeddedBytes(d.raw_data?.dataUrl), 0),
      });
      setStatus('checked');
    } catch (err) {
      console.error('[migração] erro ao verificar:', err);
      showToast('Não foi possível verificar agora. Tente novamente.', 'danger');
      setStatus('idle');
    }
  };

  const handleMove = async () => {
    if (!summary) return;
    setStatus('moving');
    const total = summary.files + summary.docs;
    let done = 0;
    let failed = 0;
    const movedById = new Map(); // o mesmo arquivo pode estar no contrato e no documento
    setProgress({ done, total, failed });

    const upload = async (item) => {
      const path = await uploadAttachmentBlob(dataUrlToBlob(item.dataUrl), {
        name: item.name || item.fileName || 'arquivo',
        type: item.type,
        escritorioId: officeId,
      });
      movedById.set(String(item.id), path);
      return path;
    };

    try {
      for (const id of await listContracts()) {
        const row = await loadContract(id);
        const raw = row.raw_data || {};
        const atts = Array.isArray(raw.attachments) ? raw.attachments : [];
        if (!atts.some(a => isEmbedded(a?.dataUrl))) continue;
        let rowOk = true;
        const nextAtts = [];
        for (const att of atts) {
          if (!isEmbedded(att?.dataUrl)) { nextAtts.push(att); continue; }
          try {
            const path = await upload(att);
            const { dataUrl, fileData, isLarge, hasIndexedDb, ...rest } = att;
            nextAtts.push({ ...rest, type: mimeOf(att.name, att.type), storagePath: path });
            done += 1;
          } catch (err) {
            console.warn('[migração] anexo não enviado:', att?.name, err.message);
            rowOk = false;
            failed += 1;
            nextAtts.push(att);
          }
          setProgress({ done, total, failed });
        }
        if (!rowOk) continue; // registro fica como estava; dá para rodar de novo depois
        const { raw_data: _copy, fileUrl, ...cleanRaw } = raw;
        const { data: updated, error } = await supabase
          .from('contracts')
          .update({ raw_data: { ...cleanRaw, attachments: nextAtts, fileUrl: isEmbedded(fileUrl) ? '' : (fileUrl || '') } })
          .eq('id', id)
          .select('id');
        if (error || !updated?.length) {
          console.warn('[migração] contrato não atualizado:', id, error?.message);
          failed += 1;
        }
      }

      for (const doc of await listDocuments()) {
        const raw = doc.raw_data || {};
        try {
          const path = movedById.get(String(doc.id)) || await upload({ ...raw, id: doc.id });
          const { dataUrl, fileData, isLarge, hasIndexedDb, raw_data: _copy, ...rest } = raw;
          const { data: updated, error } = await supabase
            .from('documents')
            .update({ raw_data: { ...rest, type: mimeOf(raw.fileName, raw.type), storagePath: path } })
            .eq('id', doc.id)
            .select('id');
          if (error || !updated?.length) throw error || new Error('não atualizado');
          done += 1;
        } catch (err) {
          console.warn('[migração] documento não movido:', doc.id, err?.message);
          failed += 1;
        }
        setProgress({ done, total, failed });
      }
    } catch (err) {
      console.error('[migração] interrompida:', err);
      failed += 1;
    }

    setProgress({ done, total, failed });
    setStatus('done');
    logActivity && logActivity('Migração de anexos', 'Arquivos', `${done} arquivo(s) movido(s), ${failed} com falha.`);
    showToast(
      failed ? `${done} arquivo(s) movido(s). ${failed} não foram e continuam onde estavam; rode de novo.` : `${done} arquivo(s) movido(s) com sucesso.`,
      failed ? 'warning' : 'success',
      7000
    );
  };

  const busy = status === 'checking' || status === 'moving';

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">Arquivos dos contratos e documentos</h3>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Anexos antigos ficavam guardados dentro do próprio contrato, deixando a lista lenta (e às vezes sem carregar).
          Esta ferramenta move esses arquivos para o espaço de arquivos do sistema. Os arquivos continuam abrindo do mesmo jeito.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleCheck}
          disabled={busy || !officeId}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <Search className="h-3.5 w-3.5" /> {status === 'checking' ? 'Verificando...' : '1. Verificar'}
        </button>
        <button
          type="button"
          onClick={handleMove}
          disabled={busy || status !== 'checked' || !summary || summary.files + summary.docs === 0}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-700 via-brand-600 to-brand-500 px-4 py-2 text-xs font-bold text-white shadow-md hover:brightness-110 disabled:opacity-40"
        >
          <HardDriveUpload className="h-3.5 w-3.5" /> {status === 'moving' ? 'Movendo...' : '2. Mover arquivos'}
        </button>
      </div>

      {summary && (
        <div className="rounded-2xl border border-slate-200 px-4 py-3 text-xs text-slate-600 dark:border-white/[0.08] dark:text-slate-300">
          <p>
            <b>{summary.files}</b> arquivo(s) dentro de <b>{summary.contractsWithFiles}</b> de {summary.contracts} contrato(s)
            {' '}e <b>{summary.docs}</b> na aba Documentos · {formatFileSize(summary.bytes)} no total.
          </p>
          {summary.files + summary.docs === 0 && (
            <p className="mt-1 flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5" /> Nada a mover: todos os arquivos já estão no lugar certo.
            </p>
          )}
        </div>
      )}

      {(status === 'moving' || status === 'done') && (
        <div className="space-y-1.5">
          <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-gold-600 to-gold-400 transition-all"
              style={{ width: `${progress.total ? Math.round(((progress.done + progress.failed) / progress.total) * 100) : 100}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {progress.done} de {progress.total} movido(s){progress.failed ? ` · ${progress.failed} com falha (continuam onde estavam)` : ''}
            {status === 'moving' ? ' · não feche esta página' : ''}
          </p>
        </div>
      )}
    </div>
  );
}
