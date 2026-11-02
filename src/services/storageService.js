import { supabase } from '../lib/supabase';
import {
  INITIAL_LEADS,
  INITIAL_CLIENTS,
  INITIAL_CONTRACTS,
  INITIAL_PROPOSALS,
  INITIAL_PROCESSES,
  INITIAL_TASKS,
  INITIAL_APPOINTMENTS,
  INITIAL_ATTENDANCES,
  INITIAL_INSTALLMENTS,
  INITIAL_DOCUMENTS,
  INITIAL_ACTIVITY_LOGS,
  INITIAL_NOTIFICATIONS,
  INITIAL_OFFICE_SETTINGS,
} from '../data/initialData';
import { INITIAL_LEGAL_AREAS, INITIAL_LEAD_SOURCES } from '../data/legalAreas';

const STORAGE_PREFIX = 'jurisflow_';
export const DEFAULT_ESCRITORIO_ID = null;

export const INITIAL_ESCRITORIOS = [];

function normalizeRow(table, row, activeEscritorio) {
  if (!row) return row;
  const raw = (row.raw_data && typeof row.raw_data === 'object') ? row.raw_data : {};
  const base = {
    ...row,
    ...raw,
    id: String(row.id || raw.id || `id_${Date.now()}`),
    escritorio_id: row.escritorio_id || raw.escritorio_id || activeEscritorio
  };

  if (table === 'clients') {
    const name = base.name || base.client_name || base.nome || 'Cliente';
    const cpf = base.cpf || base.document || base.cpf_cnpj || '';
    const cnpj = base.cnpj || (cpf.length === 14 || cpf.length === 18 ? cpf : '');
    const rg = base.rg || '';
    const birthDate = base.birthDate || base.birth_date || '';
    const maritalStatus = base.maritalStatus || base.marital_status || 'Casado(a)';
    const profession = base.profession || '';
    const email = base.email || '';
    const phone = base.phone || base.telefone || '';
    const whatsapp = base.whatsapp || phone || '';
    const address = base.address || base.endereco || '';
    const neighborhood = base.neighborhood || base.bairro || '';
    const city = base.city || base.cidade || 'São Paulo';
    const state = base.state || base.estado || 'SP';
    const zipCode = base.zipCode || base.zip_code || base.cep || '';
    const legalArea = base.legalArea || base.legal_area || 'civil';
    const responsibleLawyerId = base.responsibleLawyerId || base.responsible_lawyer_id || 'usr_2';
    const status = base.status || 'active';
    const totalContracted = Number(base.totalContracted || base.total_contracted) || 0;
    const totalPaid = Number(base.totalPaid || base.total_paid) || 0;
    const notes = base.notes || base.observacoes || '';
    const createdAt = base.createdAt || base.created_at || new Date().toISOString().split('T')[0];

    return {
      ...base,
      name,
      cpf,
      cnpj,
      rg,
      birthDate,
      birth_date: birthDate,
      maritalStatus,
      marital_status: maritalStatus,
      profession,
      email,
      phone,
      whatsapp,
      address,
      neighborhood,
      city,
      state,
      zipCode,
      zip_code: zipCode,
      legalArea,
      legal_area: legalArea,
      responsibleLawyerId,
      responsible_lawyer_id: responsibleLawyerId,
      status,
      totalContracted,
      total_contracted: totalContracted,
      totalPaid,
      total_paid: totalPaid,
      notes,
      createdAt,
    };
  }

  if (table === 'leads') {
    const name = base.name || base.nome || 'Lead';
    const email = base.email || '';
    const phone = base.phone || base.telefone || '';
    const whatsapp = base.whatsapp || phone || '';
    const source = base.source || base.origem || 'google';
    const legalArea = base.legalArea || base.legal_area || 'trabalhista';
    const assignedTo = base.assignedTo || base.assigned_to || 'usr_4';
    const lawyerId = base.lawyerId || base.lawyer_id || 'usr_2';
    const stage = base.stage || base.etapa || 'novo_lead';
    const temperature = base.temperature || 'warm';
    const estimatedValue = Number(base.estimatedValue || base.estimated_value || base.value) || 0;
    const notes = base.notes || base.observacoes || '';
    const firstContactDate = base.firstContactDate || base.first_contact_date || new Date().toISOString().slice(0, 16);
    const nextActionDate = base.nextActionDate || base.next_action_date || '';
    const lossReason = base.lossReason || base.loss_reason || '';
    const createdAt = base.createdAt || base.created_at || new Date().toISOString().split('T')[0];

    return {
      ...base,
      name,
      email,
      phone,
      whatsapp,
      source,
      legalArea,
      legal_area: legalArea,
      assignedTo,
      assigned_to: assignedTo,
      lawyerId,
      lawyer_id: lawyerId,
      stage,
      temperature,
      estimatedValue,
      estimated_value: estimatedValue,
      notes,
      firstContactDate,
      first_contact_date: firstContactDate,
      nextActionDate,
      next_action_date: nextActionDate,
      lossReason,
      loss_reason: lossReason,
      createdAt,
    };
  }

  if (table === 'processes') {
    const processNumber = base.processNumber || base.process_number || base.cnj_number || '0000000-00.2026.8.26.0000';
    const title = base.title || `Processo ${processNumber}`;
    const clientId = base.clientId || base.client_id || null;
    const clientName = base.clientName || base.client_name || 'Cliente';
    const tribunal = base.tribunal || base.court_system || 'TJSP';
    const court = base.court || base.vara || '1ª Vara Cível';
    const legalArea = base.legalArea || base.legal_area || 'civil';
    const responsibleLawyerId = base.responsibleLawyerId || base.responsible_lawyer_id || base.assigned_to || 'usr_2';
    const responsibleLawyerName = base.responsibleLawyerName || base.responsible_lawyer_name || 'Advogado Responsável';
    const status = base.status || 'active';
    const phase = base.phase || 'Em andamento';
    const value = Number(base.value) || 0;
    const distributionDate = base.distributionDate || base.distribution_date || (base.created_at ? base.created_at.split('T')[0] : new Date().toISOString().split('T')[0]);
    const lastUpdateDate = base.lastUpdateDate || base.last_update_date || new Date().toISOString().split('T')[0];
    const notes = base.notes || '';

    return {
      ...base,
      processNumber,
      process_number: processNumber,
      title,
      clientId,
      client_id: clientId,
      clientName,
      client_name: clientName,
      tribunal,
      court,
      legalArea,
      legal_area: legalArea,
      responsibleLawyerId,
      responsible_lawyer_id: responsibleLawyerId,
      responsibleLawyerName,
      responsible_lawyer_name: responsibleLawyerName,
      status,
      phase,
      value,
      distributionDate,
      distribution_date: distributionDate,
      lastUpdateDate,
      last_update_date: lastUpdateDate,
      notes,
    };
  }

  if (table === 'contracts') {
    const contractNumber = base.contractNumber || base.contract_number || (base.id ? `CTR-2026/${String(base.id).slice(-3)}` : 'CTR-2026/001');
    const clientName = base.clientName || base.client_name || 'Cliente';
    const clientId = base.clientId || base.client_id || null;
    const title = base.title || 'Contrato de Prestação de Serviços';
    const legalArea = base.legalArea || base.legal_area || 'civil';
    const status = base.status || 'draft';
    const value = Number(base.value) || 0;
    const paymentMethod = base.paymentMethod || base.payment_method || 'A combinar';
    const installmentsCount = Number(base.installmentsCount || base.installments_count) || 1;
    const installmentValue = Number(base.installmentValue || base.installment_value) || (value / (installmentsCount || 1));
    const createdDate = base.createdDate || base.created_date || (row.created_at ? row.created_at.split('T')[0] : new Date().toISOString().split('T')[0]);
    const signedDate = base.signedDate || base.signed_date || '';
    const sentDate = base.sentDate || base.sent_date || '';
    const serviceDescription = base.serviceDescription || base.service_description || '';
    const responsibleLawyerId = base.responsibleLawyerId || base.responsible_lawyer_id || null;
    const responsibleLawyerName = base.responsibleLawyerName || base.responsible_lawyer_name || '';
    const attachments = Array.isArray(base.attachments) ? base.attachments : (base.attachment ? [base.attachment] : []);
    const observations = base.observations || base.notes || '';

    return {
      ...base,
      contractNumber,
      contract_number: contractNumber,
      clientName,
      client_name: clientName,
      clientId,
      client_id: clientId,
      title,
      legalArea,
      legal_area: legalArea,
      status,
      value,
      paymentMethod,
      payment_method: paymentMethod,
      installmentsCount,
      installments_count: installmentsCount,
      installmentValue,
      installment_value: installmentValue,
      createdDate,
      created_date: createdDate,
      signedDate,
      signed_date: signedDate,
      sentDate,
      sent_date: sentDate,
      serviceDescription,
      service_description: serviceDescription,
      responsibleLawyerId,
      responsible_lawyer_id: responsibleLawyerId,
      responsibleLawyerName,
      responsible_lawyer_name: responsibleLawyerName,
      attachments,
      observations,
    };
  }

  if (table === 'proposals') {
    const proposalNumber = base.proposalNumber || base.proposal_number || (base.id ? `PROP-2026/${String(base.id).slice(-3)}` : 'PROP-2026/001');
    const clientName = base.clientName || base.client_name || base.leadName || base.lead_name || 'Cliente';
    const leadId = base.leadId || base.lead_id || null;
    const serviceName = base.serviceName || base.service_name || base.title || 'Proposta de Honorários';
    const status = base.status || 'rascunho';
    const value = Number(base.value || base.feeValue || base.fee_value) || 0;
    const feeValue = value;
    const legalArea = base.legalArea || base.legal_area || 'empresarial';
    const responsibleId = base.responsibleId || base.responsible_id || 'usr_1';
    const responsibleName = base.responsibleName || base.responsible_name || 'Equipe Comercial';
    const paymentTerms = base.paymentTerms || base.payment_terms || '';
    const validityDate = base.validityDate || base.validity_date || '';
    const sentDate = base.sentDate || base.sent_date || '';
    const createdAt = base.createdAt || base.created_at || (row.created_at ? row.created_at : new Date().toISOString());
    const attachments = Array.isArray(base.attachments) ? base.attachments : [];

    return {
      ...base,
      createdAt,
      created_at: createdAt,
      proposalNumber,
      proposal_number: proposalNumber,
      clientName,
      client_name: clientName,
      leadId,
      lead_id: leadId,
      serviceName,
      service_name: serviceName,
      title: serviceName,
      status,
      value,
      feeValue,
      legalArea,
      legal_area: legalArea,
      responsibleId,
      responsible_id: responsibleId,
      responsibleName,
      responsible_name: responsibleName,
      paymentTerms,
      payment_terms: paymentTerms,
      validityDate,
      validity_date: validityDate,
      sentDate,
      sent_date: sentDate,
      attachments,
    };
  }

  if (table === 'documents') {
    const dataUrl = base.dataUrl || base.fileData || base.file_data || null;
    return {
      ...base,
      title: base.title || 'Documento',
      clientId: base.clientId || base.client_id || null,
      client_id: base.clientId || base.client_id || null,
      clientName: base.clientName || base.client_name || 'Geral',
      client_name: base.clientName || base.client_name || 'Geral',
      fileName: base.fileName || base.file_name || 'Documento.pdf',
      file_name: base.fileName || base.file_name || 'Documento.pdf',
      category: base.category || 'Outros',
      fileSize: base.fileSize || base.file_size || '1.0 MB',
      file_size: base.fileSize || base.file_size || '1.0 MB',
      uploadedAt: base.uploadedAt || base.uploaded_at || base.created_at || new Date().toISOString(),
      uploaded_at: base.uploadedAt || base.uploaded_at || base.created_at || new Date().toISOString(),
      uploadedBy: base.uploadedBy || base.uploaded_by || 'Dra. Tatiane Camargo',
      uploaded_by: base.uploadedBy || base.uploaded_by || 'Dra. Tatiane Camargo',
      dataUrl,
      fileData: dataUrl,
    };
  }

  if (table === 'tasks') {
    const title = base.title || 'Tarefa';
    const description = base.description || '';
    const priority = base.priority || 'media';
    const status = base.status || 'pending';
    const taskType = base.taskType || base.task_type || 'peticao';
    const customType = base.customType || base.custom_type || '';
    const dueDate = base.dueDate || base.due_date || new Date().toISOString().split('T')[0];
    const dueTime = base.dueTime || base.due_time || '14:00';
    const assignedTo = base.assignedTo || base.assigned_to || null;
    const clientId = base.clientId || base.client_id || null;
    const leadId = base.leadId || base.lead_id || null;
    const processId = base.processId || base.process_id || null;

    return {
      ...base,
      title,
      description,
      priority,
      status,
      taskType,
      task_type: taskType,
      customType,
      custom_type: customType,
      dueDate,
      due_date: dueDate,
      dueTime,
      due_time: dueTime,
      assignedTo,
      assigned_to: assignedTo,
      clientId,
      client_id: clientId,
      leadId,
      lead_id: leadId,
      processId,
      process_id: processId,
    };
  }

  if (table === 'appointments') {
    return {
      ...base,
      title: base.title || 'Compromisso',
      date: base.date || new Date().toISOString().split('T')[0],
      startTime: base.startTime || base.time || '10:00',
      endTime: base.endTime || '11:00',
      time: base.time || base.startTime || '10:00',
      type: base.type || 'reuniao',
      location: base.location || 'Escritório',
      clientId: base.clientId || base.client_id || null,
      clientName: base.clientName || base.client_name || '',
      responsibleId: base.responsibleId || base.responsible_id || 'usr_1',
      responsibleName: base.responsibleName || base.responsible_name || 'Advogado',
      notes: base.notes || '',
    };
  }

  if (table === 'attendances') {
    return {
      ...base,
      clientId: base.clientId || base.client_id || null,
      clientName: base.clientName || base.client_name || 'Cliente',
      subject: base.subject || 'Atendimento Geral',
      description: base.description || '',
      channel: base.channel || 'whatsapp',
      result: base.result || '',
      nextAction: base.nextAction || base.next_action || '',
      date: base.date || new Date().toISOString().split('T')[0],
    };
  }

  if (table === 'installments') {
    const val = Number(base.value || base.amount) || 0;
    const num = Number(base.installmentNumber || base.installment_number || base.number) || 1;
    const pDate = base.paymentDate || base.payment_date || base.paidDate || base.paid_date || null;
    return {
      ...base,
      contractId: base.contractId || base.contract_id || null,
      contract_id: base.contractId || base.contract_id || null,
      clientId: base.clientId || base.client_id || null,
      client_id: base.clientId || base.client_id || null,
      clientName: base.clientName || base.client_name || 'Cliente',
      client_name: base.clientName || base.client_name || 'Cliente',
      installmentNumber: num,
      installment_number: num,
      number: num,
      totalInstallments: Number(base.totalInstallments || base.total_installments) || 1,
      total_installments: Number(base.totalInstallments || base.total_installments) || 1,
      value: val,
      amount: val,
      dueDate: base.dueDate || base.due_date || new Date().toISOString().split('T')[0],
      due_date: base.dueDate || base.due_date || new Date().toISOString().split('T')[0],
      paidDate: pDate,
      paid_date: pDate,
      paymentDate: pDate,
      payment_date: pDate,
      status: base.status || 'pending',
      paymentMethod: base.paymentMethod || base.payment_method || 'PIX',
      payment_method: base.paymentMethod || base.payment_method || 'PIX',
    };
  }

  if (table === 'users') {
    const roles = Array.isArray(base.roles) && base.roles.length > 0
      ? base.roles
      : (base.role ? [base.role] : ['lawyer']);
    const primaryRole = roles.includes('dev')
      ? 'dev'
      : roles.includes('admin')
      ? 'admin'
      : (base.role || roles[0] || 'lawyer');

    const titles = Array.isArray(base.titles) && base.titles.length > 0
      ? base.titles
      : (base.title ? [base.title] : ['Advogado(a) Associado(a)']);

    return {
      ...base,
      name: base.name || 'Colaborador',
      email: base.email || '',
      role: primaryRole,
      roles: roles,
      title: base.title || titles.join(' • '),
      titles: titles,
      oab: base.oab || '',
      phone: base.phone || '',
      avatar: base.avatar || null,
      status: base.status || 'active',
    };
  }

  return base;
}

function sanitizePayload(data, keepLargeData = false) {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(item => sanitizePayload(item, keepLargeData));

  const clean = { ...data };

  // Tratamento para Documentos avulsos na tabela 'documents'
  if (!keepLargeData && clean.dataUrl && clean.dataUrl.length > 250000) {
    clean.isLarge = true;
    clean.hasIndexedDb = true;
    delete clean.dataUrl;
  }

  if (Array.isArray(clean.attachments)) {
    clean.attachments = clean.attachments.map(att => {
      if (!att) return att;
      const dataUrl = att.dataUrl || '';
      // Se tiver mais de 250KB de Base64, e não for para nuvem, remove a string
      if (!keepLargeData && dataUrl.length > 250000) {
        const { dataUrl: _, ...rest } = att;
        return {
          ...rest,
          isLarge: true,
          category: att.category || (att.name?.toLowerCase().includes('procur') ? 'Procuração' : 'Contratos'),
        };
      }
      return att;
    });
  }
  return clean;
}

// --- ENVIO AO BANCO ---
// O banco é a fonte da verdade: é ele que todos os computadores do escritório leem.
// Sem conexão, a alteração fica guardada na fila abaixo (sobrevive a fechar o navegador) e é
// reenviada sozinha; recusa do banco é avisada na hora, nunca fica parecendo que salvou.
const OUTBOX_KEY = STORAGE_PREFIX + 'outbox';
const syncListeners = new Set();
const inFlight = new Map(); // `tabela:id` -> registro sendo enviado agora
let outboxOwner = null;
let flushing = false;

const readOutbox = () => {
  try {
    const list = JSON.parse(localStorage.getItem(OUTBOX_KEY) || '[]');
    return Array.isArray(list) ? list : [];
  } catch (e) {
    return [];
  }
};
const writeOutbox = (list) => {
  try {
    localStorage.setItem(OUTBOX_KEY, JSON.stringify(list));
    return true;
  } catch (e) {
    return false;
  }
};
const myOutbox = () => readOutbox().filter(entry => entry.owner === outboxOwner);
const emitSync = (event) => {
  syncListeners.forEach((listener) => {
    try { listener({ ...event, pending: myOutbox().length }); } catch (e) { /* ouvinte não derruba o envio */ }
  });
};

// Queda de internet e instabilidade valem nova tentativa; recusa do banco não.
function isRetryable(error) {
  const code = String(error?.code || '');
  if (/^(PGRST0|PGRST30|57|08|53)/.test(code)) return true;
  if (code) return false;
  return /fetch|network|timeout|load failed|aborted/i.test(String(error?.message || ''));
}
const isPermissionError = (error) => error?.code === '42501' || /row-level security/i.test(error?.message || '');

function enqueue(entry) {
  const others = readOutbox().filter(e => !(e.owner === outboxOwner && e.table === entry.table && String(e.id) === String(entry.id)));
  return writeOutbox([...others, { ...entry, owner: outboxOwner }]);
}
const dequeue = (table, id) => writeOutbox(readOutbox().filter(e => !(e.owner === outboxOwner && e.table === table && String(e.id) === String(id))));

// Registros que ainda não chegaram ao banco valem sobre o que veio dele, para não sumirem da tela
function applyPendingChanges(table, rows) {
  let result = rows;
  const pendingUpserts = [];
  myOutbox().filter(e => e.table === table).forEach((entry) => {
    if (entry.op === 'delete') result = result.filter(r => String(r.id) !== String(entry.id));
    else pendingUpserts.push(entry.item);
  });
  inFlight.forEach((item, key) => {
    if (key.startsWith(table + ':')) pendingUpserts.push(item);
  });
  if (pendingUpserts.length === 0) return result;
  const ids = new Set(pendingUpserts.map(i => String(i.id)));
  return [...pendingUpserts, ...result.filter(r => !ids.has(String(r.id)))];
}

// Cache local guarda anexo grande sem o arquivo: nunca deixar isso apagar o arquivo que está no banco
async function restoreLargeFiles(table, rows) {
  if (table !== 'contracts') return rows;
  const needsRestore = rows.filter(r => (r.raw_data?.attachments || []).some(a => a?.isLarge && !a.dataUrl));
  if (needsRestore.length === 0) return rows;
  const { data, error } = await supabase.from('contracts').select('id, raw_data').in('id', needsRestore.map(r => r.id));
  if (error) throw error;
  const byId = new Map((data || []).map(r => [String(r.id), r.raw_data?.attachments || []]));
  return rows.map((row) => {
    const saved = byId.get(String(row.id));
    if (!saved) return row;
    const attachments = (row.raw_data?.attachments || []).map((att) => {
      if (!att?.isLarge || att.dataUrl) return att;
      const original = saved.find(s => String(s?.id) === String(att.id));
      return original?.dataUrl ? { ...att, dataUrl: original.dataUrl } : att;
    });
    return { ...row, raw_data: { ...row.raw_data, attachments } };
  });
}

// Salva com "cria ou atualiza" (upsert). Contratos e parcelas podem nascer pelas mãos de quem não
// os enxerga depois (ex.: comercial fechando negócio): a segurança por cargo recusa o upsert, então
// tenta como inserção simples. Nas demais tabelas a recusa volta como erro e a pessoa é avisada.
const INSERT_FALLBACK_TABLES = ['contracts', 'installments'];

async function upsertRespectingRoles(table, rows, { insertOnly = false } = {}) {
  // Auditoria: quem registra não pode ler, então é sempre inserção
  if (table === 'activity_logs') {
    const { error } = await supabase.from(table).insert(rows);
    if (error && error.code !== '23505') throw error;
    return;
  }
  const { error } = await supabase.from(table).upsert(rows, { onConflict: 'id', ignoreDuplicates: insertOnly });
  if (!error) return;
  if (!isPermissionError(error) || !INSERT_FALLBACK_TABLES.includes(table)) throw error;
  for (const row of rows) {
    const { error: insertError } = await supabase.from(table).insert(row);
    if (insertError && insertError.code !== '23505') throw insertError;
  }
}

function mapItemToSqlRow(table, item, activeEscritorio) {
  if (!item) return null;
  const sanitizedItem = sanitizePayload(item, true); // true = KEEP dataUrl for Supabase
  const base = {
    id: String(item.id || `id_${Date.now()}`),
    escritorio_id: item.escritorio_id || activeEscritorio || DEFAULT_ESCRITORIO_ID,
    raw_data: sanitizedItem,
  };

  if (table === 'clients') {
    return {
      ...base,
      name: item.name || item.client_name || 'Cliente',
      cpf: item.cpf || item.cnpj || item.cpf_cnpj || null,
      rg: item.rg || null,
      birth_date: item.birthDate || item.birth_date || null,
      marital_status: item.maritalStatus || item.marital_status || null,
      profession: item.profession || null,
      email: item.email || null,
      phone: item.phone || null,
      whatsapp: item.whatsapp || null,
      address: item.address || null,
      city: item.city || null,
      state: item.state || null,
      zip_code: item.zipCode || item.zip_code || null,
      legal_area: item.legalArea || item.legal_area || null,
      responsible_lawyer_id: item.responsibleLawyerId || item.responsible_lawyer_id || null,
      status: item.status || 'active',
      total_contracted: Number(item.totalContracted || item.total_contracted) || 0,
      total_paid: Number(item.totalPaid || item.total_paid) || 0,
      avatar: item.avatar || null,
      notes: item.notes || null,
    };
  }

  if (table === 'leads') {
    return {
      ...base,
      name: item.name || 'Lead',
      cpf: item.cpf || item.cnpj || item.cpf_cnpj || null,
      phone: item.phone || null,
      whatsapp: item.whatsapp || null,
      email: item.email || null,
      city: item.city || null,
      state: item.state || null,
      birth_date: item.birthDate || item.birth_date || null,
      source: item.source || null,
      legal_area: item.legalArea || item.legal_area || null,
      assigned_to: item.assignedTo || item.assigned_to || null,
      lawyer_id: item.lawyerId || item.lawyer_id || null,
      stage: item.stage || 'novo_lead',
      temperature: item.temperature || 'warm',
      estimated_value: Number(item.estimatedValue || item.estimated_value) || 0,
      notes: item.notes || null,
      first_contact_date: item.firstContactDate || item.first_contact_date || null,
      last_contact_date: item.lastContactDate || item.last_contact_date || null,
      next_action_date: item.nextActionDate || item.next_action_date || null,
      loss_reason: item.lossReason || item.loss_reason || null,
    };
  }

  if (table === 'contracts') {
    return {
      ...base,
      contract_number: item.contractNumber || item.contract_number || null,
      client_id: item.clientId || item.client_id || null,
      client_name: item.clientName || item.client_name || 'Cliente',
      title: item.title || 'Contrato de Prestação de Serviços',
      legal_area: item.legalArea || item.legal_area || null,
      responsible_lawyer_id: item.responsibleLawyerId || item.responsible_lawyer_id || null,
      responsible_lawyer_name: item.responsibleLawyerName || item.responsible_lawyer_name || null,
      service_description: item.serviceDescription || item.service_description || null,
      status: item.status || 'draft',
      value: Number(item.value) || 0,
      payment_method: item.paymentMethod || item.payment_method || null,
      installments_count: Number(item.installmentsCount || item.installments_count) || 1,
      installment_value: Number(item.installmentValue || item.installment_value) || Number(item.value) || 0,
      created_date: item.createdDate || item.created_date || null,
      sent_date: item.sentDate || item.sent_date || null,
      signed_date: item.signedDate || item.signed_date || null,
      observations: item.observations || item.notes || null,
    };
  }

  if (table === 'proposals') {
    return {
      ...base,
      proposal_number: item.proposalNumber || item.proposal_number || null,
      client_id: item.clientId || item.client_id || null,
      lead_id: item.leadId || item.lead_id || null,
      client_name: item.clientName || item.client_name || null,
      lead_name: item.leadName || item.lead_name || null,
      title: item.title || item.serviceName || item.service_name || 'Proposta de Honorários',
      legal_area: item.legalArea || item.legal_area || null,
      responsible_lawyer_id: item.responsibleId || item.responsible_id || item.responsibleLawyerId || item.responsible_lawyer_id || null,
      fee_value: Number(item.feeValue || item.fee_value || item.value) || 0,
      status: item.status || 'rascunho',
    };
  }

  if (table === 'processes') {
    return {
      ...base,
      process_number: item.processNumber || item.process_number || null,
      client_id: item.clientId || item.client_id || null,
      client_name: item.clientName || item.client_name || null,
      tribunal: item.tribunal || null,
      vara: item.court || item.vara || null,
      legal_area: item.legalArea || item.legal_area || null,
      responsible_lawyer_id: item.responsibleLawyerId || item.responsible_lawyer_id || null,
      responsible_lawyer_name: item.responsibleLawyerName || item.responsible_lawyer_name || null,
      status: item.status || 'active',
      distribution_date: item.distributionDate || item.distribution_date || null,
      last_update_date: item.lastUpdateDate || item.last_update_date || null,
      action_type: item.actionType || item.action_type || null,
      value: Number(item.value) || 0,
    };
  }

  if (table === 'tasks') {
    return {
      ...base,
      title: item.title || 'Tarefa',
      description: item.description || null,
      due_date: item.dueDate || item.due_date || null,
      priority: item.priority || 'media',
      status: item.status || 'pending',
      assigned_to: item.assignedTo || item.assigned_to || null,
      client_id: item.clientId || item.client_id || null,
      lead_id: item.leadId || item.lead_id || null,
      process_id: item.processId || item.process_id || null,
    };
  }

  if (table === 'appointments') {
    return {
      ...base,
      title: item.title || 'Compromisso',
      date: item.date || null,
      time: item.startTime || item.time || null,
      type: item.type || 'reuniao',
      location: item.location || null,
      client_id: item.clientId || item.client_id || null,
      client_name: item.clientName || item.client_name || null,
      lawyer_id: item.responsibleId || item.responsibleLawyerId || item.lawyer_id || null,
      notes: item.notes || null,
    };
  }

  if (table === 'attendances') {
    return {
      ...base,
      client_id: item.clientId || item.client_id || null,
      client_name: item.clientName || item.client_name || null,
      lead_id: item.leadId || item.lead_id || null,
      responsible_id: item.responsibleId || item.responsible_id || null,
      responsible_name: item.responsibleName || item.responsible_name || null,
      date: item.date || null,
      channel: item.channel || 'whatsapp',
      subject: item.subject || 'Atendimento Geral',
      description: item.description || null,
      result: item.result || null,
      next_action: item.nextAction || item.next_action || null,
    };
  }

  if (table === 'installments') {
    const paidDate = item.paymentDate || item.payment_date || item.paidDate || item.paid_date || null;
    return {
      ...base,
      contract_id: item.contractId || item.contract_id || null,
      client_name: item.clientName || item.client_name || null,
      number: Number(item.installmentNumber || item.installment_number || item.number) || 1,
      total_installments: Number(item.totalInstallments || item.total_installments) || 1,
      amount: Number(item.value || item.amount) || 0,
      due_date: item.dueDate || item.due_date || null,
      payment_date: paidDate,
      status: item.status || 'pending',
      payment_method: item.paymentMethod || item.payment_method || 'PIX',
    };
  }

  if (table === 'documents') {
    return {
      ...base,
      title: item.title || 'Documento',
      client_id: item.clientId || item.client_id || null,
      client_name: item.clientName || item.client_name || null,
      category: item.category || 'Outros',
      file_name: item.fileName || item.file_name || null,
      file_size: item.fileSize || item.file_size || '1.0 MB',
      uploaded_by: item.uploadedBy || item.uploaded_by || null,
      uploaded_at: item.uploadedAt || item.uploaded_at || new Date().toISOString(),
    };
  }

  if (table === 'legal_areas' || table === 'lead_sources') {
    return {
      ...base,
      name: item.name || null,
      color: item.color || null,
      icon: item.icon || null,
    };
  }

  if (table === 'activity_logs') {
    return {
      ...base,
      user_name: item.userName || item.user_name || null,
      user_role: item.userRole || item.user_role || null,
      action: item.action || null,
      target: item.target || null,
      details: item.details || null,
      timestamp: item.timestamp || new Date().toISOString(),
    };
  }

  if (table === 'notifications') {
    return {
      ...base,
      title: item.title || null,
      message: item.message || null,
      type: item.type || 'info',
      read: Boolean(item.read),
      timestamp: item.timestamp || new Date().toISOString(),
    };
  }

  if (table === 'escritorios') {
    return {
      id: item.id || 'escritorio_principal',
      nome: item.nome || item.name || 'JurisFlow Advocacia Matriz',
      cnpj: item.cnpj || null,
      email: item.email || null,
      telefone: item.telefone || item.phone || null,
      endereco: item.endereco || item.address || null,
      cidade: item.cidade || item.city || null,
      estado: item.estado || item.state || null,
      logo_url: item.logoUrl || item.logo_url || null,
      plano: item.plano || 'enterprise',
      status: item.status || 'active',
      parent_id: item.parent_id || item.parentId || null,
      raw_data: item,
    };
  }

  if (table === 'office_settings') {
    return {
      ...base,
      id: item.id || 'settings_default',
      office_name: item.officeName || item.office_name || item.name || 'JurisFlow Advocacia',
      cnpj: item.cnpj || null,
      email: item.email || null,
      phone: item.phone || null,
      address: item.address || null,
    };
  }

  if (table === 'users') {
    const roles = Array.isArray(item.roles) && item.roles.length > 0
      ? item.roles
      : (item.role ? [item.role] : ['lawyer']);
    const primaryRole = roles.includes('dev')
      ? 'dev'
      : roles.includes('admin')
      ? 'admin'
      : (item.role || roles[0] || 'lawyer');
    const titles = Array.isArray(item.titles) && item.titles.length > 0
      ? item.titles
      : (item.title ? [item.title] : ['Advogado(a)']);

    return {
      ...base,
      name: item.name || null,
      email: item.email || null,
      role: primaryRole,
      roles: roles,
      title: item.title || (Array.isArray(item.titles) ? item.titles.join(' • ') : 'Advogado(a)'),
      titles: titles,
      oab: item.oab || null,
      phone: item.phone || null,
      avatar: item.avatar || null,
      status: item.status || 'active',
    };
  }

  return base;
}

export const storageService = {
  getDeletedIds() {
    const permanentBanned = ['test_del_123', 'PROP-2026/123', 'test_princ', 'test_tatiane', 'PROP-TEST-1', 'PROP-TEST-2'];
    try {
      const stored = localStorage.getItem(STORAGE_PREFIX + 'deleted_ids');
      const list = stored ? JSON.parse(stored) : [];
      for (const b of permanentBanned) {
        if (!list.includes(b)) list.push(b);
      }
      return list;
    } catch (e) {
      return [...permanentBanned];
    }
  },

  markAsDeleted(id) {
    if (!id) return;
    try {
      const cleanId = String(id);
      const list = this.getDeletedIds();
      if (!list.includes(cleanId)) {
        list.push(cleanId);
        if (list.length > 500) list.shift();
        localStorage.setItem(STORAGE_PREFIX + 'deleted_ids', JSON.stringify(list));
      }
    } catch (e) {
      console.warn('Erro ao registrar deleted_id:', e);
    }
  },

  unmarkAsDeleted(id) {
    if (!id) return;
    const permanentBanned = ['test_del_123', 'PROP-2026/123', 'test_princ', 'test_tatiane', 'PROP-TEST-1', 'PROP-TEST-2'];
    if (permanentBanned.includes(String(id))) return;
    try {
      const cleanId = String(id);
      const list = this.getDeletedIds().filter(d => d !== cleanId);
      localStorage.setItem(STORAGE_PREFIX + 'deleted_ids', JSON.stringify(list));
    } catch (e) {
      console.warn('Erro ao remover de deleted_ids:', e);
    }
  },

  isDeleted(id) {
    if (!id) return false;
    const clean = String(id);
    const permanentBanned = ['test_del_123', 'PROP-2026/123', 'test_princ', 'test_tatiane', 'PROP-TEST-1', 'PROP-TEST-2'];
    if (permanentBanned.includes(clean)) return true;
    const list = this.getDeletedIds();
    return list.includes(clean);
  },

  getCurrentEscritorioId() {
    try {
      const stored = localStorage.getItem(STORAGE_PREFIX + 'current_escritorio_id');
      if (stored) {
        const clean = stored.replace(/^"|"$/g, '').trim();
        if (clean && clean !== 'null' && clean !== 'undefined') return clean;
      }
      return null;
    } catch (e) {
      return null;
    }
  },

  setCurrentEscritorioId(id) {
    try {
      if (!id) {
        localStorage.removeItem(STORAGE_PREFIX + 'current_escritorio_id');
        return;
      }
      const clean = String(id).replace(/^"|"$/g, '').trim();
      localStorage.setItem(STORAGE_PREFIX + 'current_escritorio_id', clean);
    } catch (e) {
      console.error('Erro ao salvar escritorio_id no localStorage:', e);
    }
  },

  getTenantStorageKey(key, escritorioId = null) {
    const escId = escritorioId || this.getCurrentEscritorioId();
    if (!escId) return `${STORAGE_PREFIX}anonymous_${key}`;
    return `${STORAGE_PREFIX}${escId}_${key}`;
  },

  clearTenantCache() {
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(STORAGE_PREFIX)) {
          // Preserva preferências e chaves utilitárias do sistema
          if (
            k !== STORAGE_PREFIX + 'theme' &&
            k !== OUTBOX_KEY &&
            k !== STORAGE_PREFIX + 'gemini_api_key'
          ) {
            keysToRemove.push(k);
          }
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch (e) {
      console.warn('Erro ao limpar cache de tenant:', e);
    }
  },

  purgeContaminatedCache(activeEscritorio) {
    try {
      if (!activeEscritorio) return;

      const tables = [
        'clients', 'contracts', 'proposals', 'leads', 'processes',
        'tasks', 'appointments', 'attendances', 'installments', 'documents',
        'office_settings', 'users', 'escritorios', 'activity_logs', 'notifications'
      ];

      // 1. Expurgar TODAS as chaves globais sem prefixo de tenant (evita vazamento legado)
      tables.forEach(table => {
        localStorage.removeItem(STORAGE_PREFIX + table);
      });

      // 2. Expurgar chaves pertencentes a outros escritórios do LocalStorage
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(STORAGE_PREFIX)) {
          // Mantém apenas chaves do tenant ativo ou chaves de controle geral de sessão
          if (
            k !== STORAGE_PREFIX + 'current_escritorio_id' &&
            k !== STORAGE_PREFIX + 'current_user' &&
            k !== OUTBOX_KEY &&
            k !== STORAGE_PREFIX + 'gemini_api_key' &&
            k !== STORAGE_PREFIX + 'theme' &&
            !k.startsWith(`${STORAGE_PREFIX}${activeEscritorio}_`)
          ) {
            keysToRemove.push(k);
          }
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));

      // 3. Limpeza interna de itens dentro da chave do próprio tenant ativo
      tables.forEach(table => {
        const tenantKey = this.getTenantStorageKey(table, activeEscritorio);
        const raw = localStorage.getItem(tenantKey);
        if (raw) {
          try {
            const items = JSON.parse(raw);
            if (Array.isArray(items)) {
              const cleaned = items.filter(item => {
                if (!item) return false;
                if (table === 'escritorios') {
                  return item.id === activeEscritorio || item.parent_id === activeEscritorio;
                }
                const itemEsc = item.escritorio_id || (item.raw_data && item.raw_data.escritorio_id);
                return itemEsc === activeEscritorio;
              });
              if (cleaned.length !== items.length) {
                localStorage.setItem(tenantKey, JSON.stringify(cleaned));
              }
            }
          } catch (err) {}
        }
      });
    } catch (e) {
      console.warn('Erro na purificação de cache:', e);
    }
  },

  loadData(key, fallback = [], escritorioId = null) {
    try {
      // 1. Chaves globais de sessão e sistema que NÃO dependem do tenant:
      if (key === 'current_user') {
        const storedUser = localStorage.getItem(STORAGE_PREFIX + 'current_user');
        if (!storedUser || storedUser === 'null' || storedUser === 'undefined') return fallback;
        try {
          return JSON.parse(storedUser);
        } catch (e) {
          return fallback;
        }
      }
      if (key === 'current_escritorio_id') {
        return this.getCurrentEscritorioId() || fallback;
      }

      // Metadados do sistema (áreas e origens de lead) podem ter fallback se não salvos
      const isSystemMeta = ['legal_areas', 'lead_sources'].includes(key);

      const activeEscritorio = escritorioId || this.getCurrentEscritorioId();
      // Sem escritório ainda (abrindo antes do login): listas do sistema voltam o padrão, nunca vazias
      if (!activeEscritorio) return isSystemMeta ? fallback : (Array.isArray(fallback) ? [] : fallback);
      const effectiveFallback = isSystemMeta ? fallback : (Array.isArray(fallback) ? [] : fallback);

      const tenantKey = this.getTenantStorageKey(key, activeEscritorio);
      const stored = localStorage.getItem(tenantKey);

      if (!stored) return effectiveFallback;

      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        const deletedIds = this.getDeletedIds();
        return parsed
          .filter(item => {
            if (!item) return false;
            const id = String(item.id || '');
            const num = String(item.proposalNumber || item.proposal_number || '');
            if (deletedIds.includes(id) || (num && deletedIds.includes(num))) return false;
            
            // ISOLAMENTO ESTRITO:
            if (key === 'escritorios') {
              return item.id === activeEscritorio || item.parent_id === activeEscritorio;
            }
            const itemEsc = item.escritorio_id || (item.raw_data && item.raw_data.escritorio_id);
            if (itemEsc && itemEsc !== activeEscritorio) {
              return false;
            }
            return true;
          })
          .map(item => normalizeRow(key, item, activeEscritorio));
      }
      return parsed;
    } catch (e) {
      console.error('Erro ao carregar chave ' + key + ' do localStorage:', e);
      return Array.isArray(fallback) ? [] : fallback;
    }
  },

  saveData(key, data, escritorioId = null) {
    try {
      // 1. Chaves globais de sessão e sistema que NÃO dependem do tenant:
      if (key === 'current_user') {
        if (!data) {
          localStorage.removeItem(STORAGE_PREFIX + 'current_user');
          return;
        }
        localStorage.setItem(STORAGE_PREFIX + 'current_user', JSON.stringify(data));
        return;
      }
      if (key === 'current_escritorio_id') {
        this.setCurrentEscritorioId(data);
        return;
      }

      const activeEscritorio = escritorioId || this.getCurrentEscritorioId();
      if (!activeEscritorio) return;

      const sanitized = sanitizePayload(data, false);
      const tenantKey = this.getTenantStorageKey(key, activeEscritorio);
      localStorage.setItem(tenantKey, JSON.stringify(sanitized));
    } catch (e) {
      console.warn(`[storageService] Quota no localStorage para ${key}:`, e.message);
    }
  },

  // options.allAccessible: visão consolidada ("Todos os escritórios") — traz tudo o que o banco
  // libera para a pessoa (matriz + filiais do dono), sem filtrar por um escritório só.
  // options.strict: em falha lança o erro, para quem chamou manter o que já está na tela.
  async fetchFromSupabase(table, fallback = [], escritorioId = null, options = {}) {
    if (!supabase) return fallback;
    const allAccessible = !!options.allAccessible;
    try {
      const activeEscritorio = escritorioId || this.getCurrentEscritorioId();
      if (!activeEscritorio) return Array.isArray(fallback) ? [] : fallback;

      const isSystemMeta = ['legal_areas', 'lead_sources'].includes(table);
      const effectiveFallback = isSystemMeta ? fallback : (Array.isArray(fallback) ? [] : fallback);

      let query = supabase.from(table).select('*');

      // ISOLAMENTO MULTI-TENANT ESTRITO NO SUPABASE (o banco também garante via RLS):
      if (!allAccessible && ['users', 'clients', 'processes', 'leads', 'contracts', 'proposals', 'tasks', 'appointments', 'attendances', 'installments', 'documents', 'activity_logs', 'notifications', 'office_settings', 'legal_areas', 'lead_sources'].includes(table)) {
        query = query.eq('escritorio_id', activeEscritorio);
      }
      // Escritórios: o banco devolve só os acessíveis (o próprio + filiais, se for o dono)

      // Ordenação estável por created_at desc se disponível
      if (['proposals', 'contracts', 'clients', 'leads', 'processes', 'tasks', 'appointments', 'attendances', 'installments', 'documents', 'activity_logs', 'notifications'].includes(table)) {
        query = query.order('created_at', { ascending: false });
      }
      if (table === 'activity_logs') query = query.limit(500);

      const { data, error } = await query;
      if (error) throw error;

      const deletedIds = this.getDeletedIds();
      const fromCloud = (data || [])
        .filter(row => {
          if (!row || !row.id) return false;
          const id = String(row.id);
          const num = String(row.proposal_number || (row.raw_data && (row.raw_data.proposalNumber || row.raw_data.proposal_number)) || '');

          // Blindagem de validação de isolamento (escritórios e visão consolidada já vêm filtrados pelo banco)
          if (table !== 'escritorios' && !allAccessible) {
            const rowEsc = row.escritorio_id || (row.raw_data && row.raw_data.escritorio_id);
            if (rowEsc && rowEsc !== activeEscritorio) return false;
          }

          return !deletedIds.includes(id) && (!num || !deletedIds.includes(num));
        })
        .map(row => (allAccessible
          ? { ...normalizeRow(table, row, row.escritorio_id || activeEscritorio), escritorio_id: row.escritorio_id }
          : normalizeRow(table, row, activeEscritorio)));
      const mapped = applyPendingChanges(table, fromCloud);

      // A visão consolidada não vai para o cache de um escritório específico
      if (!allAccessible) this.saveData(table, mapped, activeEscritorio);
      return mapped.length === 0 ? effectiveFallback : mapped;
    } catch (e) {
      if (options.strict) throw e;
      console.warn('[Supabase Fetch] Usando cache local para ' + table + ':', e.message);
      return this.loadData(table, fallback, escritorioId);
    }
  },

  // O banco é a referência de todos os computadores: cópia local nunca sobe sozinha por cima dele
  // (isso ressuscitava o que outra pessoa excluiu). O que falta enviar fica na fila de envio.
  async recoverAndSyncLocalData(table, fallback = [], escritorioId = null) {
    return this.fetchFromSupabase(table, fallback, escritorioId);
  },

  // --- Fila de envio: uso pelo CRMContext ---
  setOutboxOwner(userId) {
    outboxOwner = userId || null;
  },

  subscribeSync(listener) {
    syncListeners.add(listener);
    return () => syncListeners.delete(listener);
  },

  reportSyncIssue(type, table) {
    emitSync({ type, table });
  },

  getPendingSyncCount() {
    return outboxOwner ? myOutbox().length : 0;
  },

  isSaving() {
    return inFlight.size > 0;
  },

  async flushOutbox() {
    if (!supabase || flushing || !outboxOwner) return;
    const entries = myOutbox();
    if (entries.length === 0) return;
    flushing = true;
    try {
      for (const entry of entries) {
        try {
          if (entry.op === 'delete') {
            await this.runDelete(entry.table, String(entry.id));
            this.unmarkAsDeleted(entry.id);
          } else {
            const rows = await restoreLargeFiles(entry.table, [mapItemToSqlRow(entry.table, entry.item, entry.item?.escritorio_id)]);
            await upsertRespectingRoles(entry.table, rows, { insertOnly: !!entry.insertOnly });
          }
          dequeue(entry.table, entry.id);
        } catch (err) {
          if (isRetryable(err)) break; // continua sem conexão: tenta tudo de novo mais tarde
          dequeue(entry.table, entry.id);
          if (entry.op === 'delete') this.unmarkAsDeleted(entry.id);
          console.warn('[Fila de envio] recusado pelo banco:', entry.table, err.message);
          if (!entry.silent) emitSync({ type: isPermissionError(err) ? 'denied' : 'failed', table: entry.table });
        }
      }
    } finally {
      flushing = false;
      emitSync({ type: 'progress' });
    }
  },

  async syncToSupabase(table, data, { insertOnly = false, silent = false } = {}) {
    if (!supabase) return false;
    const activeEscritorio = this.getCurrentEscritorioId();

    if (table === 'users') {
      try {
        const items = Array.isArray(data) ? data : [data];
        for (const item of items) {
          if (!item?.email) continue;
          const cleanEmail = item.email.toLowerCase().trim();
          const cleanId = String(item.id || '');
          const row = mapItemToSqlRow('users', item, activeEscritorio);

          let { data: updated } = await supabase
            .from('users')
            .update(row)
            .eq('email', cleanEmail)
            .select();

          if ((!updated || updated.length === 0) && cleanId) {
            const { data: updatedById } = await supabase
              .from('users')
              .update(row)
              .eq('id', cleanId)
              .select();
            updated = updatedById;
          }

          if (!updated || updated.length === 0) {
            const insertRow = { ...row, id: cleanId || `usr_${Date.now()}` };
            const { error } = await supabase.from('users').insert(insertRow);
            if (error) throw error;
          }
        }
        return true;
      } catch (err) {
        console.warn('Erro ao sincronizar users com Supabase:', err.message);
        emitSync({ type: isPermissionError(err) ? 'denied' : 'failed', table });
        return false;
      }
    }

    const deletedIds = this.getDeletedIds();
    const items = (Array.isArray(data) ? data : [data]).filter((item) => {
      if (!item || typeof item !== 'object' || !item.id) return false;
      const id = String(item.id);
      const num = String(item.proposalNumber || item.proposal_number || '');
      return !deletedIds.includes(id) && (!num || !deletedIds.includes(num));
    });
    if (items.length === 0) return true;

    const keys = items.map(item => `${table}:${item.id}`);
    items.forEach((item, i) => inFlight.set(keys[i], item));
    try {
      let rows = items.map(item => mapItemToSqlRow(table, item, activeEscritorio));
      if (table === 'office_settings') {
        // Uma linha por escritório: usa a que já existe, sem depender do id que está na tela
        const officeId = rows[0].escritorio_id;
        const { data: existing, error: lookupError } = await supabase
          .from('office_settings').select('id').eq('escritorio_id', officeId).limit(1);
        if (lookupError) throw lookupError;
        const id = existing?.[0]?.id || `settings_${officeId}`;
        rows = rows.map(row => ({ ...row, id }));
      }
      rows = await restoreLargeFiles(table, rows);
      await upsertRespectingRoles(table, rows, { insertOnly });
      items.forEach(item => dequeue(table, item.id));
      return true;
    } catch (err) {
      console.warn('Erro ao sincronizar ' + table + ' com Supabase:', err.message);
      if (isRetryable(err)) {
        const queued = items.every(item => enqueue({ op: 'upsert', table, id: item.id, item, insertOnly, silent }));
        if (!silent) emitSync({ type: queued ? 'queued' : 'failed', table });
      } else if (!silent) {
        emitSync({ type: isPermissionError(err) ? 'denied' : 'failed', table });
      }
      return false;
    } finally {
      keys.forEach(key => inFlight.delete(key));
    }
  },

  async saveToSupabase(table, data, options) {
    return this.syncToSupabase(table, data, options);
  },

  // Exclui no banco e confirma: a segurança do banco recusa exclusão sem dar erro (só não apaga nada)
  async runDelete(table, cleanId) {
    if (table === 'contracts') {
      const { error } = await supabase.from('installments').delete().eq('contract_id', cleanId);
      if (error) throw error;
    }
    const columns = table === 'proposals' ? ['id', 'proposal_number'] : ['id'];
    let removed = 0;
    for (const column of columns) {
      const { data, error } = await supabase.from(table).delete().eq(column, cleanId).select('id');
      if (error) throw error;
      removed += (data || []).length;
    }
    if (removed > 0) return;
    const { data: stillThere, error: checkError } = await supabase.from(table).select('id').eq('id', cleanId).limit(1);
    if (checkError) throw checkError;
    if ((stillThere || []).length > 0) {
      throw Object.assign(new Error('Exclusão recusada pela segurança do banco'), { code: '42501' });
    }
  },

  async deleteFromSupabase(table, id, email = null) {
    const cleanId = String(id || '');
    this.markAsDeleted(cleanId);
    try {
      if (table === 'users') {
        const cleanEmail = email ? String(email).toLowerCase().trim() : '';
        if (cleanEmail) {
          const { error } = await supabase.from('users').delete().eq('email', cleanEmail);
          if (error) throw error;
        }
        if (cleanId) {
          const { error } = await supabase.from('users').delete().eq('id', cleanId);
          if (error) throw error;
        }
      } else {
        await this.runDelete(table, cleanId);
      }
      this.unmarkAsDeleted(cleanId);
      return true;
    } catch (err) {
      console.warn('Erro ao deletar ' + id + ' de ' + table + ' no Supabase:', err.message);
      if (table !== 'users' && isRetryable(err)) {
        const queued = enqueue({ op: 'delete', table, id: cleanId });
        emitSync({ type: queued ? 'queued' : 'failed', table });
      } else {
        this.unmarkAsDeleted(cleanId);
        emitSync({ type: isPermissionError(err) ? 'denied' : 'failed', table });
      }
      return false;
    }
  }
};
