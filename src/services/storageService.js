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
export const DEFAULT_ESCRITORIO_ID = 'escritorio_principal';

export const INITIAL_ESCRITORIOS = [
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
    id: row.id || raw.id,
    escritorio_id: row.escritorio_id || raw.escritorio_id || activeEscritorio
  };

  if (table === 'contracts') {
    const contractNumber = base.contractNumber || base.contract_number || (base.id ? `CTR-2026/${String(base.id).slice(-3)}` : 'CTR-2026/001');
    const clientName = base.clientName || base.client_name || 'Cliente';
    const clientId = base.clientId || base.client_id || null;
    const title = base.title || 'Contrato de Prestação de Serviços';
    const legalArea = base.legalArea || base.legal_area || 'Direito Civil';
    const status = base.status || 'draft';
    const value = Number(base.value) || 0;
    const paymentMethod = base.paymentMethod || base.payment_method || 'A combinar';
    const installmentsCount = Number(base.installmentsCount || base.installments_count) || 1;
    const createdDate = base.createdDate || base.created_date || (row.created_at ? row.created_at.split('T')[0] : new Date().toISOString().split('T')[0]);
    const signedDate = base.signedDate || base.signed_date || '';
    const sentDate = base.sentDate || base.sent_date || '';
    const serviceDescription = base.serviceDescription || base.service_description || '';
    const responsibleLawyerId = base.responsibleLawyerId || base.responsible_lawyer_id || null;
    const responsibleLawyerName = base.responsibleLawyerName || base.responsible_lawyer_name || '';
    const attachments = Array.isArray(base.attachments) ? base.attachments : (base.attachment ? [base.attachment] : []);

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
    };
  }

  if (table === 'proposals') {
    const proposalNumber = base.proposalNumber || base.proposal_number || (base.id ? `PROP-2026/${String(base.id).slice(-3)}` : 'PROP-2026/001');
    const clientName = base.clientName || base.client_name || base.leadName || base.lead_name || 'Cliente';
    const serviceName = base.serviceName || base.service_name || base.title || 'Proposta de Honorários';
    const status = base.status || 'rascunho';
    const value = Number(base.value) || 0;
    const legalArea = base.legalArea || base.legal_area || 'Direito Geral';
    const attachments = Array.isArray(base.attachments) ? base.attachments : [];

    return {
      ...base,
      proposalNumber,
      proposal_number: proposalNumber,
      clientName,
      client_name: clientName,
      serviceName,
      service_name: serviceName,
      status,
      value,
      legalArea,
      legal_area: legalArea,
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
    return {
      ...base,
      title: base.title || 'Tarefa',
      description: base.description || '',
      priority: base.priority || 'media',
      status: base.status || 'pending',
      dueDate: base.dueDate || base.due_date || new Date().toISOString().split('T')[0],
      assignedTo: base.assignedTo || base.assigned_to || null,
    };
  }

  if (table === 'appointments') {
    return {
      ...base,
      title: base.title || 'Compromisso',
      date: base.date || new Date().toISOString().split('T')[0],
      time: base.time || base.startTime || '09:00',
      type: base.type || 'reuniao',
      location: base.location || 'Escritório',
      clientName: base.clientName || base.client_name || '',
    };
  }

  if (table === 'attendances') {
    return {
      ...base,
      clientName: base.clientName || base.client_name || 'Cliente',
      subject: base.subject || 'Atendimento Geral',
      description: base.description || '',
      channel: base.channel || 'whatsapp',
      date: base.date || new Date().toISOString().split('T')[0],
    };
  }

  if (table === 'users') {
    const roles = Array.isArray(base.roles) && base.roles.length > 0
      ? base.roles
      : (base.role ? [base.role] : ['lawyer']);
    const titles = Array.isArray(base.titles) && base.titles.length > 0
      ? base.titles
      : (base.title ? [base.title] : ['Advogado(a) Associado(a)']);

    return {
      ...base,
      name: base.name || 'Colaborador',
      email: base.email || '',
      role: base.role || roles[0] || 'lawyer',
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
  const base = {
    id: String(item.id),
    escritorio_id: item.escritorio_id || activeEscritorio,
    raw_data: item,
  };

  if (table === 'clients') {
    return {
      ...base,
      name: item.name || item.client_name || null,
      cpf: item.cpf || null,
      rg: item.rg || null,
      birth_date: item.birthDate || null,
      marital_status: item.maritalStatus || null,
      profession: item.profession || null,
      email: item.email || null,
      phone: item.phone || null,
      whatsapp: item.whatsapp || null,
      zip_code: item.zipCode || null,
      address: item.address || null,
      neighborhood: item.neighborhood || null,
      city: item.city || null,
      state: item.state || null,
      legal_area: item.legalArea || null,
      responsible_lawyer_id: item.responsibleLawyerId || null,
      status: item.status || 'active',
      notes: item.notes || null,
      first_contact_date: item.firstContactDate || null,
      converted_date: item.convertedDate || null,
    };
  }

  if (table === 'leads') {
    return {
      ...base,
      name: item.name || null,
      email: item.email || null,
      phone: item.phone || null,
      whatsapp: item.whatsapp || null,
      source: item.source || null,
      legal_area: item.legalArea || null,
      assigned_to: item.assignedTo || null,
      lawyer_id: item.lawyerId || null,
      stage: item.stage || 'novo_lead',
      temperature: item.temperature || 'warm',
      estimated_value: Number(item.estimatedValue) || 0,
      notes: item.notes || null,
      first_contact_date: item.firstContactDate || null,
      last_contact_date: item.lastContactDate || null,
      next_action_date: item.nextActionDate || null,
      loss_reason: item.lossReason || null,
    };
  }

  if (table === 'contracts') {
    return {
      ...base,
      contract_number: item.contractNumber || item.contract_number || null,
      client_id: item.clientId || item.client_id || null,
      client_name: item.clientName || item.client_name || null,
      title: item.title || null,
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
      observations: item.observations || null,
    };
  }

  if (table === 'proposals') {
    return {
      ...base,
      proposal_number: item.proposalNumber || item.proposal_number || null,
      client_name: item.clientName || item.client_name || null,
      service_name: item.serviceName || item.service_name || null,
      legal_area: item.legalArea || item.legal_area || null,
      status: item.status || 'rascunho',
      value: Number(item.value) || 0,
    };
  }

  if (table === 'tasks') {
    return {
      ...base,
      title: item.title || null,
      description: item.description || null,
      due_date: item.dueDate || item.due_date || null,
      priority: item.priority || 'medium',
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
      title: item.title || null,
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

  if (table === 'escritorios') {
    return {
      ...base,
      id: item.id || 'escritorio_principal',
      nome: item.nome || item.name || 'JurisFlow Advocacia Matriz',
      cnpj: item.cnpj || null,
      email: item.email || null,
      telefone: item.telefone || item.phone || null,
      endereco: item.endereco || item.address || null,
      cidade: item.cidade || item.city || null,
      estado: item.estado || item.state || null,
      plano: item.plano || 'enterprise',
      status: item.status || 'active',
    };
  }

  if (table === 'office_settings') {
    return {
      ...base,
      id: item.id || 'settings_default',
      office_name: item.officeName || item.office_name || 'JurisFlow Advocacia',
      cnpj: item.cnpj || null,
      email: item.email || null,
      phone: item.phone || null,
      address: item.address || null,
    };
  }

  if (table === 'users') {
    return {
      ...base,
      name: item.name || null,
      email: item.email || null,
      role: item.role || (Array.isArray(item.roles) ? item.roles[0] : 'lawyer'),
      title: item.title || (Array.isArray(item.titles) ? item.titles.join(' • ') : 'Advogado(a)'),
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
        query = query.or('escritorio_id.eq.' + activeEscritorio + ',escritorio_id.is.null,escritorio_id.eq.escritorio_principal');
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

  async deleteFromSupabase(table, id) {
    try {
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
