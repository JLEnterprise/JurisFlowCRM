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
export const DEFAULT_ESCRITORIO_ID = 'escritorio_Tatiane';

export const INITIAL_ESCRITORIOS = [
  {
    id: 'escritorio_Tatiane',
    nome: 'Tatiane Camargo Advocacia',
    cnpj: '',
    email: 'tatianecamargo@adv.oabsp.org.br',
    telefone: '(11) 98289-9672',
    endereco: 'Escritório Home - N/A',
    cidade: 'Jandira',
    estado: 'SP',
    plano: 'Anual',
    status: 'active'
  },
  {
    id: 'escritorio_principal',
    nome: 'JurisFlow Advocacia Matriz',
    cnpj: '',
    email: 'contato@jurisflow.adv.br',
    telefone: '(11) 99999-9999',
    endereco: 'Av. Paulista, 1000 - Bela Vista',
    cidade: 'São Paulo',
    estado: 'SP',
    plano: 'enterprise',
    status: 'active'
  }
];

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
    const sentDate = base.sentDate || base.sent_date || new Date().toISOString().split('T')[0];
    const attachments = Array.isArray(base.attachments) ? base.attachments : [];

    return {
      ...base,
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
    return {
      ...base,
      title: base.title || 'Documento',
      clientName: base.clientName || base.client_name || 'Geral',
      fileName: base.fileName || base.file_name || 'Documento.pdf',
      category: base.category || 'Outros',
      fileSize: base.fileSize || base.file_size || '1.0 MB',
      uploadedAt: base.uploadedAt || base.uploaded_at || base.created_at || new Date().toISOString(),
      fileData: base.fileData || base.file_data || base.dataUrl || null,
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
    return {
      ...base,
      contractId: base.contractId || base.contract_id || null,
      clientId: base.clientId || base.client_id || null,
      clientName: base.clientName || base.client_name || 'Cliente',
      installmentNumber: Number(base.installmentNumber || base.installment_number) || 1,
      totalInstallments: Number(base.totalInstallments || base.total_installments) || 1,
      value: Number(base.value) || 0,
      dueDate: base.dueDate || base.due_date || new Date().toISOString().split('T')[0],
      paidDate: base.paidDate || base.paid_date || null,
      status: base.status || 'pending',
      paymentMethod: base.paymentMethod || base.payment_method || 'PIX',
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
      avatar: base.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
      status: base.status || 'active',
    };
  }

  return base;
}

function mapItemToSqlRow(table, item, activeEscritorio) {
  if (!item) return null;
  const base = {
    id: String(item.id || `id_${Date.now()}`),
    escritorio_id: item.escritorio_id || activeEscritorio || DEFAULT_ESCRITORIO_ID,
    raw_data: item,
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
    return {
      ...base,
      contract_id: item.contractId || item.contract_id || null,
      client_name: item.clientName || item.client_name || null,
      number: Number(item.installmentNumber || item.installment_number || item.number) || 1,
      total_installments: Number(item.totalInstallments || item.total_installments) || 1,
      amount: Number(item.value || item.amount) || 0,
      due_date: item.dueDate || item.due_date || null,
      payment_date: item.paidDate || item.paid_date || item.payment_date || null,
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
  getCurrentEscritorioId() {
    try {
      const stored = localStorage.getItem(STORAGE_PREFIX + 'current_escritorio_id');
      return stored || DEFAULT_ESCRITORIO_ID;
    } catch (e) {
      return DEFAULT_ESCRITORIO_ID;
    }
  },

  setCurrentEscritorioId(id) {
    try {
      localStorage.setItem(STORAGE_PREFIX + 'current_escritorio_id', id);
    } catch (e) {
      console.error('Erro ao salvar escritorio_id no localStorage:', e);
    }
  },

  loadData(key, fallback) {
    try {
      const stored = localStorage.getItem(STORAGE_PREFIX + key);
      if (!stored) return fallback;
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed.map(item => normalizeRow(key, item, this.getCurrentEscritorioId()));
      }
      return parsed;
    } catch (e) {
      console.error('Erro ao carregar chave ' + key + ' do localStorage:', e);
      return fallback;
    }
  },

  saveData(key, data) {
    try {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data));
      this.syncToSupabase(key, data).catch(err => {
        console.warn('[Supabase Sync Warning] Falha ao sincronizar ' + key + ':', err?.message || err);
      });
    } catch (e) {
      console.error('Erro ao salvar chave ' + key + ' no localStorage:', e);
    }
  },

  async fetchFromSupabase(table, fallback = [], escritorioId = null) {
    try {
      const activeEscritorio = escritorioId || this.getCurrentEscritorioId();
      let query = supabase.from(table).select('*');
      
      if (!['legal_areas', 'lead_sources', 'escritorios', 'office_settings', 'users'].includes(table)) {
        query = query.or(`escritorio_id.eq.${activeEscritorio},escritorio_id.is.null,escritorio_id.eq.escritorio_Tatiane,escritorio_id.eq.escritorio_principal`);
      }

      const { data, error } = await query;
      if (error) throw error;
      if (!data) return fallback;
      
      const mapped = data.map(row => normalizeRow(table, row, activeEscritorio));

      localStorage.setItem(STORAGE_PREFIX + table, JSON.stringify(mapped));
      return mapped;
    } catch (e) {
      console.warn('[Supabase Fetch] Usando cache local para ' + table + ':', e.message);
      return this.loadData(table, fallback);
    }
  },

  async syncToSupabase(table, data) {
    if (!supabase) return;
    try {
      const activeEscritorio = this.getCurrentEscritorioId();

      if (table === 'users') {
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
            await supabase.from('users').insert(insertRow);
          }
        }
        return;
      }

      if (Array.isArray(data)) {
        if (data.length === 0) return;
        const rows = data.map(item => mapItemToSqlRow(table, item, activeEscritorio));
        const { error } = await supabase.from(table).upsert(rows, { onConflict: 'id' });
        if (error) throw error;
      } else if (data && typeof data === 'object') {
        const row = mapItemToSqlRow(table, data, activeEscritorio);
        const { error } = await supabase.from(table).upsert(row, { onConflict: 'id' });
        if (error) throw error;
      }
    } catch (err) {
      console.warn('Erro ao sincronizar ' + table + ' com Supabase:', err.message);
    }
  },

  async saveToSupabase(table, data) {
    return this.syncToSupabase(table, data);
  },

  async deleteFromSupabase(table, id, email = null) {
    try {
      if (table === 'users') {
        const cleanEmail = email ? String(email).toLowerCase().trim() : '';
        const cleanId = String(id || '');
        if (cleanEmail) {
          await supabase.from('users').delete().eq('email', cleanEmail);
        }
        if (cleanId) {
          await supabase.from('users').delete().eq('id', cleanId);
        }
        return;
      }
      const { error } = await supabase.from(table).delete().eq('id', String(id));
      if (error) throw error;
    } catch (err) {
      console.warn('Erro ao deletar ' + id + ' de ' + table + ' no Supabase:', err.message);
    }
  },

  async resetToDefault() {
    try {
      const defaults = {
        escritorios: INITIAL_ESCRITORIOS,
        leads: INITIAL_LEADS,
        clients: INITIAL_CLIENTS,
        contracts: INITIAL_CONTRACTS,
        proposals: INITIAL_PROPOSALS,
        processes: INITIAL_PROCESSES,
        tasks: INITIAL_TASKS,
        appointments: INITIAL_APPOINTMENTS,
        attendances: INITIAL_ATTENDANCES,
        installments: INITIAL_INSTALLMENTS,
        documents: INITIAL_DOCUMENTS,
        activity_logs: INITIAL_ACTIVITY_LOGS,
        notifications: INITIAL_NOTIFICATIONS,
        office_settings: INITIAL_OFFICE_SETTINGS,
        legal_areas: INITIAL_LEGAL_AREAS,
        lead_sources: INITIAL_LEAD_SOURCES,
      };

      for (const [key, value] of Object.entries(defaults)) {
        localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
        await this.syncToSupabase(key, value);
      }
      return true;
    } catch (e) {
      console.error('Erro ao resetar dados:', e);
      return false;
    }
  }
};
