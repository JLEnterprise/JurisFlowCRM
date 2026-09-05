/**
 * Utilitários para manuseio de arquivos anexados (PDF, Word, etc.)
 */

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

  return {
    label: 'Documento',
    extension: name.split('.').pop() || 'doc',
    color: 'text-slate-500 dark:text-slate-400',
    bgColor: 'bg-slate-50 dark:bg-navy-950',
    borderColor: 'border-slate-200 dark:border-slate-800',
    badgeColor: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  };
}

export function downloadAttachment(attachment) {
  if (!attachment || !attachment.dataUrl) {
    alert('Arquivo não disponível para download.');
    return;
  }

  try {
    const link = document.createElement('a');
    link.href = attachment.dataUrl;
    link.download = attachment.name || `documento_${Date.now()}.${attachment.type?.includes('pdf') ? 'pdf' : 'docx'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error('Erro ao baixar arquivo:', err);
    // Fallback: abrir em nova janela
    window.open(attachment.dataUrl, '_blank');
  }
}

export function openAttachment(attachment) {
  if (!attachment || !attachment.dataUrl) {
    alert('Arquivo não disponível para visualização.');
    return;
  }

  const isPdf = attachment.type?.includes('pdf') || String(attachment.name).toLowerCase().endsWith('.pdf') || String(attachment.dataUrl).startsWith('data:application/pdf');

  if (isPdf) {
    try {
      // Converte Data URL para Blob para abrir em aba limpa
      const arr = attachment.dataUrl.split(',');
      const mime = arr[0].match(/:(.*?);/)[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const blob = new Blob([u8arr], { type: mime });
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
    } catch (e) {
      // Fallback
      const win = window.open();
      if (win) {
        win.document.write(`<title>${attachment.name || 'Visualização do Contrato'}</title><body style="margin:0"><iframe src="${attachment.dataUrl}" frameborder="0" style="border:0; width:100vw; height:100vh;" allowfullscreen></iframe></body>`);
      } else {
        downloadAttachment(attachment);
      }
    }
  } else {
    // Arquivos Word (.docx, .doc) são baixados pois navegadores não renderizam docx nativamente
    downloadAttachment(attachment);
  }
}
