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
      dataUrl,
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

// O documento do GED copiado de um contrato guarda só os metadados: o arquivo fica no anexo
function findContractAttachment(doc, contracts) {
  const docId = String(doc.id);
  for (const contract of contracts || []) {
    const attachments = Array.isArray(contract?.attachments) ? contract.attachments : [];
    const found = attachments.find(att => att && (
      String(att.id) === docId ||
      `doc_${contract.id}_${att.id}` === docId ||
      `doc_${contract.id}_${att.name}` === docId
    ));
    if (found) return found;
  }
  return null;
}

// Procura no próprio registro, no anexo do contrato e, por último, no IndexedDB deste navegador
async function resolveDataUrl(attachment, contracts) {
  const linked = findContractAttachment(attachment, contracts);
  const dataUrl = attachment.dataUrl || attachment.fileData || linked?.dataUrl;
  if (dataUrl) return dataUrl;

  // O IndexedDB guarda pelo id do anexo, que continua no id do documento mesmo sem o contrato
  const anexoId = String(attachment.id || '').match(/_(att_.+)$/)?.[1];
  const ids = new Set([attachment.id, linked?.id, anexoId].filter(Boolean));
  for (const id of ids) {
    const localFile = await getFileFromIndexedDB(id);
    if (localFile) return localFile;
  }
  return null;
}

function alertFileUnavailable(fileName) {
  alert(`Arquivo indisponível: "${fileName}" não foi encontrado no sistema nem neste navegador. Envie o arquivo novamente para que ele possa ser aberto.`);
}

// Retorna true quando o download começou; false quando o arquivo não foi encontrado
export async function downloadAttachment(attachment, contracts = []) {
  if (!attachment) {
    alert('Arquivo não especificado.');
    return false;
  }

  const fileName = attachment.fileName || attachment.name || attachment.title || 'documento';
  const dataUrl = await resolveDataUrl(attachment, contracts);

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
        return true;
      } else {
        // Link direto ou URL de Blob
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = fileName;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return true;
      }
    } catch (err) {
      console.error('Erro ao converter dataUrl para download:', err);
    }
  }

  alertFileUnavailable(fileName);
  return false;
}

export async function openAttachment(attachment, contracts = []) {
  if (!attachment) {
    alert('Arquivo não especificado.');
    return;
  }

  const fileName = attachment.fileName || attachment.name || attachment.title || 'documento';
  const dataUrl = await resolveDataUrl(attachment, contracts);

  if (!dataUrl) {
    alertFileUnavailable(fileName);
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
    downloadAttachment({ ...attachment, dataUrl });
  }
}
