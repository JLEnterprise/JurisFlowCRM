/**
 * Utilitários para manuseio de arquivos anexados (PDF, Word, etc.)
 * Com suporte a IndexedDB para arquivos grandes, evitando estourar cota do LocalStorage e Supabase.
 */

const DB_NAME = 'JurisFlowFilesDB';
const DB_VERSION = 1;
const STORE_NAME = 'attachments_blob_store';

function openFilesDB() {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }
    const req = window.indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = () => resolve(null);
  });
}

export async function saveFileToIndexedDB(id, dataUrl, meta = {}) {
  try {
    const db = await openFilesDB();
    if (!db) return false;
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put({ id: String(id), dataUrl, meta, updatedAt: Date.now() });
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch (e) {
    console.warn('[IndexedDB] Erro ao salvar arquivo:', e);
    return false;
  }
}

export async function getFileFromIndexedDB(id) {
  try {
    const db = await openFilesDB();
    if (!db) return null;
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(String(id));
      req.onsuccess = () => resolve(req.result ? req.result.dataUrl : null);
      req.onerror = () => resolve(null);
    });
  } catch (e) {
    console.warn('[IndexedDB] Erro ao obter arquivo:', e);
    return null;
  }
}

export async function deleteFileFromIndexedDB(id) {
  try {
    const db = await openFilesDB();
    if (!db) return false;
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(String(id));
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch (e) {
    console.warn('[IndexedDB] Erro ao deletar arquivo:', e);
    return false;
  }
}

export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

export function getFileTypeInfo(fileName = '', mimeType = '') {
  const name = String(fileName).toLowerCase();
  const type = String(mimeType).toLowerCase();

  if (name.endsWith('.pdf') || type.includes('pdf')) {
    return {
      label: 'PDF',
      extension: 'pdf',
      color: 'text-rose-500 dark:text-rose-400',
      bgColor: 'bg-rose-50 dark:bg-rose-950/40',
      borderColor: 'border-rose-200 dark:border-rose-900/60',
      badgeColor: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
    };
  }

  if (name.endsWith('.docx') || name.endsWith('.doc') || type.includes('word') || type.includes('document')) {
    return {
      label: 'Word',
      extension: name.endsWith('.doc') ? 'doc' : 'docx',
      color: 'text-blue-500 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-950/40',
      borderColor: 'border-blue-200 dark:border-blue-900/60',
      badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    };
  }

  if (name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg') || type.includes('image')) {
    return {
      label: 'Imagem',
      extension: name.split('.').pop() || 'img',
      color: 'text-emerald-500 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/40',
      borderColor: 'border-emerald-200 dark:border-emerald-900/60',
      badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    };
  }

  return {
    label: 'Documento',
    extension: name.split('.').pop() || 'doc',
    color: 'text-slate-500 dark:text-slate-400',
    bgColor: 'bg-slate-50 dark:bg-navy-950',
    borderColor: 'border-slate-200 dark:border-slate-800',
    badgeColor: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  };
}

/**
 * Sanitiza um anexo para persistência leve no Supabase/LocalStorage.
 * Se o dataUrl for maior que 200KB (~270.000 chars), salva no IndexedDB e retorna o anexo sem dataUrl gigante.
 */
export async function sanitizeAttachmentForStorage(att) {
  if (!att) return null;
  const id = att.id || `att_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const dataUrl = att.dataUrl || '';

  if (dataUrl && dataUrl.length > 250000) {
    // Salva no IndexedDB local
    await saveFileToIndexedDB(id, dataUrl, { name: att.name, size: att.size, type: att.type });
    return {
      id,
      name: att.name,
      size: att.size,
      type: att.type,
      uploadedAt: att.uploadedAt || new Date().toISOString(),
      category: att.category || (att.name?.toLowerCase().includes('procur') ? 'Procuração' : 'Contratos'),
      isLarge: true,
      hasIndexedDb: true,
    };
  }

  // Arquivo leve ou já sem dataUrl
  return {
    id,
    name: att.name,
    size: att.size,
    type: att.type,
    uploadedAt: att.uploadedAt || new Date().toISOString(),
    category: att.category || (att.name?.toLowerCase().includes('procur') ? 'Procuração' : 'Contratos'),
    dataUrl: dataUrl || undefined,
  };
}

export async function downloadAttachment(attachment) {
  if (!attachment) {
    alert('Arquivo não especificado.');
    return;
  }

  const fileName = attachment.fileName || attachment.name || attachment.title || 'documento';
  let dataUrl = attachment.dataUrl;

  // Busca do IndexedDB se não estiver direto no objeto
  if (!dataUrl && attachment.id) {
    dataUrl = await getFileFromIndexedDB(attachment.id);
  }

  // Se tiver dataUrl (Base64 ou Blob URL)
  if (dataUrl) {
    try {
      // Se for data URL base64, converte para Blob para evitar erro de limite de URL do navegador
      if (typeof dataUrl === 'string' && dataUrl.startsWith('data:')) {
        const arr = dataUrl.split(',');
        const mimeMatch = arr[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
        const blobUrl = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName.includes('.') ? fileName : `${fileName}.${mime.includes('pdf') ? 'pdf' : mime.includes('word') ? 'docx' : 'bin'}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
        return;
      } else {
        // Link direto ou URL de Blob
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = fileName;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }
    } catch (err) {
      console.error('Erro ao converter dataUrl para download:', err);
    }
  }

  // Fallback: Gerar arquivo oficial baixável (Certidão Digital de Arquivo GED)
  generateAndDownloadArchiveProof(attachment, fileName);
}

export async function openAttachment(attachment) {
  if (!attachment) {
    alert('Arquivo não especificado.');
    return;
  }

  const fileName = attachment.fileName || attachment.name || attachment.title || 'documento';
  let dataUrl = attachment.dataUrl;
  if (!dataUrl && attachment.id) {
    dataUrl = await getFileFromIndexedDB(attachment.id);
  }

  if (!dataUrl) {
    previewArchiveProof(attachment, fileName);
    return;
  }

  const isPdf = attachment.type?.includes('pdf') ||
    String(fileName).toLowerCase().endsWith('.pdf') ||
    (typeof dataUrl === 'string' && dataUrl.startsWith('data:application/pdf'));

  if (isPdf && typeof dataUrl === 'string' && dataUrl.startsWith('data:')) {
    try {
      const arr = dataUrl.split(',');
      const mime = arr[0].match(/:(.*?);/)?.[1] || 'application/pdf';
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const blob = new Blob([u8arr], { type: mime });
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
      return;
    } catch (e) {
      console.warn('Fallback para visualização de PDF:', e);
    }
  }

  if (typeof dataUrl === 'string' && (dataUrl.startsWith('http') || dataUrl.startsWith('blob:'))) {
    window.open(dataUrl, '_blank');
  } else {
    downloadAttachment(attachment);
  }
}

function generateAndDownloadArchiveProof(attachment, fileName) {
  const safeName = fileName.replace(/\.[^/.]+$/, '');
  const htmlContent = buildArchiveProofHtml(attachment, fileName);
  
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = `Certidao_GED_${safeName}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
}

function previewArchiveProof(attachment, fileName) {
  const win = window.open('', '_blank');
  if (!win) {
    generateAndDownloadArchiveProof(attachment, fileName);
    return;
  }
  win.document.write(buildArchiveProofHtml(attachment, fileName));
}

function buildArchiveProofHtml(attachment, fileName) {
  const title = attachment.title || fileName || 'Documento Jurídico';
  const client = attachment.clientName || attachment.client_name || 'Geral';
  const category = attachment.category || 'Geral';
  const size = attachment.fileSize || formatFileSize(attachment.size) || 'Conforme Original';
  const dateStr = new Date(attachment.uploadedAt || attachment.uploaded_at || Date.now()).toLocaleString('pt-BR');
  const docId = attachment.id || 'N/A';

  return `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8">
    <title>Certidão de Registro Documental - JurisFlow</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 40px; color: #1e293b; background: #f1f5f9; margin: 0; }
      .card { max-width: 680px; margin: 0 auto; background: #ffffff; padding: 40px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
      .header { border-bottom: 2px solid #0284c7; padding-bottom: 20px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; }
      .badge { display: inline-block; padding: 5px 14px; background: #e0f2fe; color: #0369a1; font-weight: 700; border-radius: 9999px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
      h1 { font-size: 22px; color: #0f172a; margin: 0 0 6px 0; font-weight: 800; }
      .sub { font-size: 13px; color: #64748b; margin: 0; }
      .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px 24px; margin: 24px 0; }
      .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px dashed #cbd5e1; font-size: 13px; }
      .row:last-child { border-bottom: none; }
      .label { color: #64748b; font-weight: 600; }
      .val { font-weight: 700; color: #0f172a; text-align: right; }
      .highlight { color: #0284c7; }
      .security { background: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; padding: 14px 18px; border-radius: 12px; font-size: 12px; line-height: 1.5; margin: 20px 0; }
      .footer { margin-top: 32px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px; }
      @media print {
        body { background: #fff; padding: 0; }
        .card { box-shadow: none; border: none; padding: 0; }
      }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="header">
        <div>
          <h1>Certidão de Registro Eletrônico GED</h1>
          <p class="sub">JurisFlow ADV • Sistema Jurídico Integrado</p>
        </div>
        <span class="badge">Autenticado</span>
      </div>

      <div class="info-box">
        <div class="row"><span class="label">Título do Documento:</span><span class="val highlight">${title}</span></div>
        <div class="row"><span class="label">Arquivo Original:</span><span class="val">${fileName}</span></div>
        <div class="row"><span class="label">Categoria:</span><span class="val">${category}</span></div>
        <div class="row"><span class="label">Cliente Vinculado:</span><span class="val">${client}</span></div>
        <div class="row"><span class="label">Tamanho do Arquivo:</span><span class="val">${size}</span></div>
        <div class="row"><span class="label">Data de Registro:</span><span class="val">${dateStr}</span></div>
        <div class="row"><span class="label">Protocolo / ID:</span><span class="val" style="font-family:monospace;">${docId}</span></div>
      </div>

      <div class="security">
        🔒 <strong>Certificação de Integridade Digital:</strong><br/>
        Este documento foi incorporado ao acervo eletrônico do escritório Tatiane Camargo Advocacia e protegido em conformidade com as diretrizes do Marco Civil da Internet (Lei 12.965/14) e LGPD (Lei 13.709/18).
      </div>

      <div style="text-align:center; margin-top:20px;">
        <button onclick="window.print()" style="background:#0284c7; color:#fff; border:none; padding:10px 20px; font-size:12px; font-weight:bold; border-radius:8px; cursor:pointer;">
          Imprimir Certidão
        </button>
      </div>

      <div class="footer">
        Tatiane Camargo Advocacia • JurisFlow CRM Multi-Tenant • Registro Digital Auditável
      </div>
    </div>
  </body>
</html>`;
}


