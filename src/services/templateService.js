import { supabase } from '../lib/supabase';

// Modelos do escritório (petições, contratos, laudos...).
// Diferente dos anexos, o arquivo fica no Storage: quem envia em um computador, os colegas abrem em outro.
const BUCKET = 'jurisflow-docs';

export const TEMPLATE_MAX_BYTES = 20 * 1024 * 1024;
export const TEMPLATE_ACCEPT = '.pdf,.doc,.docx,.odt,.rtf';

// Pastas que todo escritório já recebe (não são apagáveis; as criadas pela equipe ficam no banco)
export const DEFAULT_FOLDERS = [
  { id: 'peticoes', name: 'Petições e peças' },
  { id: 'contratos', name: 'Contratos' },
  { id: 'laudos', name: 'Laudos' },
  { id: 'procuracoes', name: 'Procurações' },
  { id: 'outros', name: 'Outros' },
];

const MIME_BY_EXT = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  odt: 'application/vnd.oasis.opendocument.text',
  rtf: 'application/rtf',
};

const extensionOf = (fileName = '') => String(fileName).split('.').pop().toLowerCase();

export const isSupportedTemplate = (fileName) => Boolean(MIME_BY_EXT[extensionOf(fileName)]);
export const isPdfTemplate = (template) => extensionOf(template?.file_name) === 'pdf';

// Na visão "Todos os escritórios" (escritorioId nulo) a segurança do banco já limita ao que a pessoa pode ver
export async function fetchTemplateLibrary(escritorioId) {
  const scoped = (query) => (escritorioId ? query.eq('escritorio_id', escritorioId) : query);
  const [foldersRes, templatesRes] = await Promise.all([
    scoped(supabase.from('template_folders').select('*')).order('name'),
    scoped(supabase.from('document_templates').select('*')).order('created_at', { ascending: false }),
  ]);
  if (foldersRes.error) throw foldersRes.error;
  if (templatesRes.error) throw templatesRes.error;
  return { customFolders: foldersRes.data || [], templates: templatesRes.data || [] };
}

export async function createTemplateFolder(escritorioId, name) {
  const { data, error } = await supabase
    .from('template_folders')
    .insert({ escritorio_id: escritorioId, name: name.trim() })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function renameTemplateFolder(id, name) {
  const { data, error } = await supabase
    .from('template_folders')
    .update({ name: name.trim() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTemplateFolder(id) {
  const { error } = await supabase.from('template_folders').delete().eq('id', id);
  if (error) throw error;
}

export async function uploadTemplate({ file, title, folderId, notes, escritorioId, uploadedBy, uploadedByName }) {
  const ext = extensionOf(file.name);
  const contentType = MIME_BY_EXT[ext];
  // Caminho sem o nome original: nome com acento ou espaço é recusado pelo Storage
  const filePath = `${escritorioId}/modelos/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, file, { contentType, upsert: false });
  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from('document_templates')
    .insert({
      escritorio_id: escritorioId,
      folder_id: folderId,
      title: title.trim(),
      notes: notes?.trim() || null,
      file_name: file.name,
      file_path: filePath,
      file_size: file.size,
      mime_type: contentType,
      uploaded_by: uploadedBy || null,
      uploaded_by_name: uploadedByName || null,
    })
    .select()
    .single();

  if (error) {
    // Sem o registro o arquivo ficaria perdido no Storage
    await supabase.storage.from(BUCKET).remove([filePath]);
    throw error;
  }
  return data;
}

export async function updateTemplate(id, { title, folderId, notes }) {
  const { data, error } = await supabase
    .from('document_templates')
    .update({
      title: title.trim(),
      folder_id: folderId,
      notes: notes?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTemplate(template) {
  const { error } = await supabase.from('document_templates').delete().eq('id', template.id);
  if (error) throw error;
  const { error: storageError } = await supabase.storage.from(BUCKET).remove([template.file_path]);
  if (storageError) console.warn('[modelos] arquivo não removido do Storage:', storageError.message);
}

async function fetchTemplateBlob(template) {
  const { data, error } = await supabase.storage.from(BUCKET).download(template.file_path);
  if (error) throw error;
  return data;
}

export async function downloadTemplate(template) {
  const blob = await fetchTemplateBlob(template);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = template.file_name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

// A aba precisa abrir antes do "await", senão o navegador a trata como pop-up e bloqueia
export async function openTemplatePdf(template) {
  const tab = window.open('', '_blank');
  try {
    const blob = await fetchTemplateBlob(template);
    const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
    if (tab) tab.location.href = url;
    else window.location.assign(url);
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  } catch (err) {
    if (tab) tab.close();
    throw err;
  }
}
