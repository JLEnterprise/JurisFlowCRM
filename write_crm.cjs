const fs = require('fs');
const path = require('path');

const content = import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { storageService, INITIAL_ESCRITORIOS } from '../services/storageService';
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
import { useAuth } from './AuthContext';

const CRMContext = createContext();

export function CRMProvider({ children }) {
  const { currentUser } = useAuth();

  // Multi-Tenant State
  const [escritorios, setEscritorios] = useState(() => storageService.loadData('escritorios', INITIAL_ESCRITORIOS));
  const [currentEscritorioId, setCurrentEscritorioIdState] = useState(() => storageService.getCurrentEscritorioId());

  // State slices
  const [leads, setLeads] = useState(() => storageService.loadData('leads', INITIAL_LEADS));
  const [clients, setClients] = useState(() => storageService.loadData('clients', INITIAL_CLIENTS));
  const [contracts, setContracts] = useState(() => storageService.loadData('contracts', INITIAL_CONTRACTS));
  const [proposals, setProposals] = useState(() => storageService.loadData('proposals', INITIAL_PROPOSALS));
  const [processes, setProcesses] = useState(() => storageService.loadData('processes', INITIAL_PROCESSES));
  const [tasks, setTasks] = useState(() => storageService.loadData('tasks', INITIAL_TASKS));
  const [appointments, setAppointments] = useState(() => storageService.loadData('appointments', INITIAL_APPOINTMENTS));
  const [attendances, setAttendances] = useState(() => storageService.loadData('attendances', INITIAL_ATTENDANCES));
  const [installments, setInstallments] = useState(() => storageService.loadData('installments', INITIAL_INSTALLMENTS));
  const [documents, setDocuments] = useState(() => storageService.loadData('documents', INITIAL_DOCUMENTS));
  const [legalAreas, setLegalAreas] = useState(() => storageService.loadData('legal_areas', INITIAL_LEGAL_AREAS));
  const [leadSources, setLeadSources] = useState(() => storageService.loadData('lead_sources', INITIAL_LEAD_SOURCES));
  const [activityLogs, setActivityLogs] = useState(() => storageService.loadData('activity_logs', INITIAL_ACTIVITY_LOGS));
  const [notifications, setNotifications] = useState(() => storageService.loadData('notifications', INITIAL_NOTIFICATIONS));
  const [officeSettings, setOfficeSettings] = useState(() => storageService.loadData('office_settings', INITIAL_OFFICE_SETTINGS));

  const [supabaseConnected, setSupabaseConnected] = useState(true);
  const [initialSupabaseSyncDone, setInitialSupabaseSyncDone] = useState(false);
  const isSyncReadyRef = useRef(false);

  // Objeto do escritorio ativo
  const currentEscritorio = escritorios.find(e => e.id === currentEscritorioId) || escritorios[0] || INITIAL_ESCRITORIOS[0];

  // Alternar escritorio ativo
  const switchEscritorio = useCallback(async (escritorioId) => {
    storageService.setCurrentEscritorioId(escritorioId);
    setCurrentEscritorioIdState(escritorioId);
    
    // Recarregar dados do tenant
    try {
      const [
        cloudLeads,
        cloudClients,
        cloudContracts,
        cloudProposals,
        cloudProcesses,
        cloudTasks,
        cloudAppointments,
        cloudAttendances,
        cloudInstallments,
        cloudDocs
      ] = await Promise.all([
        storageService.fetchFromSupabase('leads', [], escritorioId),
        storageService.fetchFromSupabase('clients', [], escritorioId),
        storageService.fetchFromSupabase('contracts', [], escritorioId),
        storageService.fetchFromSupabase('proposals', [], escritorioId),
        storageService.fetchFromSupabase('processes', [], escritorioId),
        storageService.fetchFromSupabase('tasks', [], escritorioId),
        storageService.fetchFromSupabase('appointments', [], escritorioId),
        storageService.fetchFromSupabase('attendances', [], escritorioId),
        storageService.fetchFromSupabase('installments', [], escritorioId),
        storageService.fetchFromSupabase('documents', [], escritorioId),
      ]);

      if (cloudLeads !== undefined) setLeads(cloudLeads);
      if (cloudClients !== undefined) setClients(cloudClients);
      if (cloudContracts !== undefined) setContracts(cloudContracts);
      if (cloudProposals !== undefined) setProposals(cloudProposals);
      if (cloudProcesses !== undefined) setProcesses(cloudProcesses);
      if (cloudTasks !== undefined) setTasks(cloudTasks);
      if (cloudAppointments !== undefined) setAppointments(cloudAppointments);
      if (cloudAttendances !== undefined) setAttendances(cloudAttendances);
      if (cloudInstallments !== undefined) setInstallments(cloudInstallments);
      if (cloudDocs !== undefined) setDocuments(cloudDocs);
    } catch (err) {
      console.warn('Erro ao carregar dados do escritorio:', err);
    }
  }, []);

  // Hidratacao e sincronizacao inicial a partir do Supabase
  useEffect(() => {
    async function loadCloudData() {
      try {
        const [
          cloudEscritorios,
          cloudLeads,
          cloudClients,
          cloudContracts,
          cloudProposals,
          cloudProcesses,
          cloudTasks,
          cloudAppointments,
          cloudAttendances,
          cloudInstallments,
          cloudDocs,
          cloudOfficeSettings
        ] = await Promise.all([
          storageService.fetchFromSupabase('escritorios', INITIAL_ESCRITORIOS),
          storageService.fetchFromSupabase('leads', [], currentEscritorioId),
          storageService.fetchFromSupabase('clients', [], currentEscritorioId),
          storageService.fetchFromSupabase('contracts', [], currentEscritorioId),
          storageService.fetchFromSupabase('proposals', [], currentEscritorioId),
          storageService.fetchFromSupabase('processes', [], currentEscritorioId),
          storageService.fetchFromSupabase('tasks', [], currentEscritorioId),
          storageService.fetchFromSupabase('appointments', [], currentEscritorioId),
          storageService.fetchFromSupabase('attendances', [], currentEscritorioId),
          storageService.fetchFromSupabase('installments', [], currentEscritorioId),
          storageService.fetchFromSupabase('documents', [], currentEscritorioId),
          storageService.fetchFromSupabase('office_settings', [INITIAL_OFFICE_SETTINGS]),
        ]);

        if (cloudEscritorios && cloudEscritorios.length > 0) setEscritorios(cloudEscritorios);
        if (cloudLeads !== undefined) setLeads(cloudLeads);
        if (cloudClients !== undefined) setClients(cloudClients);
        if (cloudContracts !== undefined) setContracts(cloudContracts);
        if (cloudProposals !== undefined) setProposals(cloudProposals);
        if (cloudProcesses !== undefined) setProcesses(cloudProcesses);
        if (cloudTasks !== undefined) setTasks(cloudTasks);
        if (cloudAppointments !== undefined) setAppointments(cloudAppointments);
        if (cloudAttendances !== undefined) setAttendances(cloudAttendances);
        if (cloudInstallments !== undefined) setInstallments(cloudInstallments);
        if (cloudDocs !== undefined) setDocuments(cloudDocs);
        if (cloudOfficeSettings && cloudOfficeSettings.length > 0) {
          setOfficeSettings(cloudOfficeSettings[0]);
        }

        setSupabaseConnected(true);
      } catch (err) {
        console.warn('Erro no sync inicial do Supabase, operando com cache local:', err);
      } finally {
        setInitialSupabaseSyncDone(true);
        isSyncReadyRef.current = true;
      }
    }

    loadCloudData();
  }, []);

  // Global filters & UI state
  const [periodFilter, setPeriodFilter] = useState('30d');
  const [toast, setToast] = useState(null);

  // Sync state to storage SOMENTE apos a hidratacao inicial para evitar sobrescrever a nuvem com dados antigos
  useEffect(() => { if (isSyncReadyRef.current) storageService.saveData('escritorios', escritorios); }, [escritorios]);
  useEffect(() => { if (isSyncReadyRef.current) storageService.saveData('leads', leads); }, [leads]);
  useEffect(() => { if (isSyncReadyRef.current) storageService.saveData('clients', clients); }, [clients]);
  useEffect(() => { if (isSyncReadyRef.current) storageService.saveData('contracts', contracts); }, [contracts]);
  useEffect(() => { if (isSyncReadyRef.current) storageService.saveData('proposals', proposals); }, [proposals]);
  useEffect(() => { if (isSyncReadyRef.current) storageService.saveData('processes', processes); }, [processes]);
  useEffect(() => { if (isSyncReadyRef.current) storageService.saveData('tasks', tasks); }, [tasks]);
  useEffect(() => { if (isSyncReadyRef.current) storageService.saveData('appointments', appointments); }, [appointments]);
  useEffect(() => { if (isSyncReadyRef.current) storageService.saveData('attendances', attendances); }, [attendances]);
  useEffect(() => { if (isSyncReadyRef.current) storageService.saveData('installments', installments); }, [installments]);
  useEffect(() => { if (isSyncReadyRef.current) storageService.saveData('documents', documents); }, [documents]);
  useEffect(() => { if (isSyncReadyRef.current) storageService.saveData('legal_areas', legalAreas); }, [legalAreas]);
  useEffect(() => { if (isSyncReadyRef.current) storageService.saveData('lead_sources', leadSources); }, [leadSources]);
  useEffect(() => { if (isSyncReadyRef.current) storageService.saveData('activity_logs', activityLogs); }, [activityLogs]);
  useEffect(() => { if (isSyncReadyRef.current) storageService.saveData('notifications', notifications); }, [notifications]);
  useEffect(() => { if (isSyncReadyRef.current) storageService.saveData('office_settings', officeSettings); }, [officeSettings]);

  // Toast Helper com ID unico e auto-dismiss imediato
  const showToast = useCallback((message, type = 'success', duration = 3000) => {
    if (!message) {
      setToast(null);
      return;
    }
    const id = Date.now();
    setToast({ message, type, id });
    setTimeout(() => {
      setToast(current => (current?.id === id ? null : current));
    }, duration);
  }, []);

  const triggerConfetti = useCallback(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#c69214', '#e0a820', '#ffffff', '#3b82f6']
      });
    } catch (e) {
      console.warn('Confetti nao disponivel:', e);
    }
  }, []);

  const logActivity = useCallback((action, target, details) => {
    const newLog = {
      id: 'log_' + Date.now(),
      escritorio_id: currentEscritorioId,
      userName: currentUser?.name || 'Sistema',
      userRole: currentUser?.role || 'admin',
      action,
      target,
      details,
      timestamp: new Date().toISOString()
    };
    setActivityLogs(prev => {
      const next = [newLog, ...prev.slice(0, 99)];
      storageService.saveData('activity_logs', next);
      return next;
    });
  }, [currentUser, currentEscritorioId]);

  // --- MULTI-TENANT ACTIONS ---
  const addEscritorio = (escData) => {
    const newEsc = {
      id: 'esc_' + Date.now(),
      nome: escData.nome || escData.name || 'Novo Escritorio',
      cnpj: escData.cnpj || '',
      email: escData.email || '',
      telefone: escData.telefone || escData.phone || '',
      endereco: escData.endereco || escData.address || '',
      cidade: escData.cidade || escData.city || '',
      estado: escData.estado || escData.state || '',
      plano: escData.plano || 'professional',
      status: 'active',
    };
    setEscritorios(prev => {
      const next = [...prev, newEsc];
      storageService.saveData('escritorios', next);
      return next;
    });
    logActivity('Novo Escritorio Criado', newEsc.nome, 'Plano: ' + newEsc.plano);
    showToast('Escritorio ' + newEsc.nome + ' criado com sucesso!');
    return newEsc;
  };

  const updateEscritorio = (id, escData) => {
    setEscritorios(prev => {
      const next = prev.map(e => e.id === id ? { ...e, ...escData } : e);
      storageService.saveData('escritorios', next);
      return next;
    });
    logActivity('Escritorio Atualizado', escData.nome || id, 'Dados cadastrais atualizados');
    showToast('Dados do escritorio atualizados!');
  };

  const deleteEscritorio = (id) => {
    if (id === 'escritorio_principal') {
      showToast('O escritorio matriz de origem nao pode ser excluido.', 'warning');
      return;
    }
    setEscritorios(prev => {
      const next = prev.filter(e => e.id !== id);
      storageService.saveData('escritorios', next);
      return next;
    });
    storageService.deleteFromSupabase('escritorios', id);
    if (currentEscritorioId === id) {
      switchEscritorio('escritorio_principal');
    }
    showToast('Filial excluida com sucesso!');
  };

  // --- LEADS ACTIONS ---
  const addLead = (leadData) => {
    const newLead = {
      ...leadData,
      id: 'lead_' + Date.now(),
      escritorio_id: currentEscritorioId,
      stage: leadData.stage || 'novo_lead',
      temperature: leadData.temperature || 'warm',
      createdAt: new Date().toISOString().split('T')[0],
      firstContactDate: leadData.firstContactDate || new Date().toISOString().split('T')[0],
    };
    setLeads(prev => {
      const next = [newLead, ...prev];
      storageService.saveData('leads', next);
      return next;
    });
    logActivity('Novo Lead', newLead.name, 'Origem: ' + (newLead.source || 'Indicacao'));
    showToast('Lead adicionado com sucesso!');
    return newLead;
  };

  const updateLead = (id, leadData) => {
    setLeads(prev => {
      const next = prev.map(l => l.id === id ? { ...l, ...leadData } : l);
      storageService.saveData('leads', next);
      return next;
    });
    logActivity('Lead Atualizado', leadData.name || id, 'Informacoes atualizadas');
    showToast('Lead atualizado com sucesso!');
  };

  const moveLeadStage = (leadId, newStage, newSubStage = null) => {
    setLeads(prev => {
      const lead = prev.find(l => l.id === leadId);
      const next = prev.map(l => {
        if (l.id === leadId) {
          return {
            ...l,
            stage: newStage,
            subStage: newSubStage || l.subStage,
            lastContactDate: new Date().toISOString().split('T')[0]
          };
        }
        return l;
      });
      storageService.saveData('leads', next);
      if (lead) {
        logActivity('Lead Movido', lead.name, 'Etapa: ' + newStage);
      }
      return next;
    });
  };

  const deleteLead = (id) => {
    setLeads(prev => {
      const next = prev.filter(l => l.id !== id);
      storageService.saveData('leads', next);
      return next;
    });
    storageService.deleteFromSupabase('leads', id);
    showToast('Lead excluido com sucesso.');
  };

  // --- CLIENTS ACTIONS ---
  const addClient = (clientData) => {
    const newClient = {
      ...clientData,
      id: 'cli_' + Date.now(),
      escritorio_id: currentEscritorioId,
      status: clientData.status || 'active',
      totalContracted: Number(clientData.totalContracted) || 0,
      totalPaid: Number(clientData.totalPaid) || 0,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setClients(prev => {
      const next = [newClient, ...prev];
      storageService.saveData('clients', next);
      return next;
    });
    logActivity('Novo Cliente', newClient.name, 'CPF/CNPJ: ' + (newClient.cpf || newClient.cnpj || 'N/A'));
    showToast('Cliente cadastrado com sucesso!');
    return newClient;
  };

  const updateClient = (id, clientData) => {
    setClients(prev => {
      const next = prev.map(c => c.id === id ? { ...c, ...clientData } : c);
      storageService.saveData('clients', next);
      return next;
    });
    logActivity('Cliente Atualizado', clientData.name || id, 'Dados atualizados');
    showToast('Cliente atualizado com sucesso!');
  };

  const deleteClient = (id) => {
    setClients(prev => {
      const next = prev.filter(c => c.id !== id);
      storageService.saveData('clients', next);
      return next;
    });
    storageService.deleteFromSupabase('clients', id);
    showToast('Cliente excluido.');
  };

  // --- CONTRACTS ACTIONS ---
  const addContract = (contractData) => {
    const newContract = {
      ...contractData,
      id: 'cnt_' + Date.now(),
      escritorio_id: currentEscritorioId,
      status: contractData.status || 'draft',
      createdDate: new Date().toISOString().split('T')[0],
    };
    setContracts(prev => {
      const next = [newContract, ...prev];
      storageService.saveData('contracts', next);
      return next;
    });
    logActivity('Novo Contrato', newContract.title, 'Cliente: ' + newContract.clientName);
    showToast('Contrato gerado com sucesso!');
    return newContract;
  };

  const updateContract = (id, contractData) => {
    setContracts(prev => {
      const next = prev.map(c => c.id === id ? { ...c, ...contractData } : c);
      storageService.saveData('contracts', next);
      return next;
    });
    logActivity('Contrato Atualizado', contractData.title || id, 'Status: ' + contractData.status);
    showToast('Contrato atualizado com sucesso!');
  };

  const deleteContract = (id) => {
    setContracts(prev => {
      const next = prev.filter(c => c.id !== id);
      storageService.saveData('contracts', next);
      return next;
    });
    storageService.deleteFromSupabase('contracts', id);
    showToast('Contrato excluido.');
  };

  const closeContractWorkflow = (leadId, contractData, installmentsList = []) => {
    triggerConfetti();

    // 1. Criar ou buscar cliente
    let client = clients.find(c => c.id === contractData.clientId || (leadId && c.leadId === leadId));
    if (!client && leadId) {
      const lead = leads.find(l => l.id === leadId);
      if (lead) {
        client = {
          id: 'cli_' + Date.now(),
          escritorio_id: currentEscritorioId,
          name: lead.name,
          cpf: lead.cpf || '',
          email: lead.email || '',
          phone: lead.phone || '',
          whatsapp: lead.whatsapp || lead.phone || '',
          city: lead.city || '',
          state: lead.state || '',
          legalArea: lead.legalArea || contractData.legalArea || 'Geral',
          status: 'active',
          totalContracted: Number(contractData.value) || 0,
          totalPaid: 0,
          createdAt: new Date().toISOString().split('T')[0],
        };
        setClients(prev => {
          const next = [client, ...prev];
          storageService.saveData('clients', next);
          return next;
        });
      }
    }

    // 2. Criar contrato
    const contract = {
      ...contractData,
      id: 'cnt_' + Date.now(),
      escritorio_id: currentEscritorioId,
      clientId: client?.id || contractData.clientId,
      clientName: client?.name || contractData.clientName,
      status: 'active',
      signedDate: new Date().toISOString().split('T')[0],
      createdDate: new Date().toISOString().split('T')[0],
    };
    setContracts(prev => {
      const next = [contract, ...prev];
      storageService.saveData('contracts', next);
      return next;
    });

    // 3. Gerar parcelas no financeiro
    if (installmentsList.length > 0) {
      setInstallments(prev => {
        const next = [...installmentsList.map(inst => ({ ...inst, escritorio_id: currentEscritorioId })), ...prev];
        storageService.saveData('installments', next);
        return next;
      });
    }

    // 4. Mover lead para contrato_assinado
    if (leadId) {
      moveLeadStage(leadId, 'contrato_assinado');
    }

    logActivity('Fechamento de Negocio', contract.title, 'Valor: R$ ' + Number(contract.value || 0).toLocaleString('pt-BR'));
    showToast('Negocio fechado com sucesso! Contrato, cliente e financeiro criados.');
  };

  // --- PROPOSALS ACTIONS ---
  const addProposal = (propData) => {
    const newProp = {
      ...propData,
      id: 'prop_' + Date.now(),
      escritorio_id: currentEscritorioId,
      status: propData.status || 'sent',
      sentDate: new Date().toISOString().split('T')[0],
    };
    setProposals(prev => {
      const next = [newProp, ...prev];
      storageService.saveData('proposals', next);
      return next;
    });
    logActivity('Nova Proposta', newProp.title, 'Para: ' + (newProp.clientName || newProp.leadName));
    showToast('Proposta criada e enviada!');
    return newProp;
  };

  const updateProposal = (id, propData) => {
    setProposals(prev => {
      const next = prev.map(p => p.id === id ? { ...p, ...propData } : p);
      storageService.saveData('proposals', next);
      return next;
    });
    logActivity('Proposta Atualizada', propData.title || id, 'Status: ' + propData.status);
    showToast('Proposta atualizada!');
  };

  const deleteProposal = (id) => {
    setProposals(prev => {
      const next = prev.filter(p => p.id !== id);
      storageService.saveData('proposals', next);
      return next;
    });
    storageService.deleteFromSupabase('proposals', id);
    showToast('Proposta excluida.');
  };

  // --- PROCESSES ACTIONS ---
  const addProcess = (procData) => {
    const newProc = {
      ...procData,
      id: 'prc_' + Date.now(),
      escritorio_id: currentEscritorioId,
      status: procData.status || 'active',
      distributionDate: procData.distributionDate || new Date().toISOString().split('T')[0],
      lastUpdateDate: new Date().toISOString().split('T')[0],
    };
    setProcesses(prev => {
      const next = [newProc, ...prev];
      storageService.saveData('processes', next);
      return next;
    });
    logActivity('Novo Processo', newProc.processNumber, 'Cliente: ' + newProc.clientName);
    showToast('Processo cadastrado com sucesso!');
    return newProc;
  };

  const updateProcess = (id, procData) => {
    setProcesses(prev => {
      const next = prev.map(p => p.id === id ? { ...p, ...procData, lastUpdateDate: new Date().toISOString().split('T')[0] } : p);
      storageService.saveData('processes', next);
      return next;
    });
    logActivity('Processo Atualizado', procData.processNumber || id, 'Status: ' + procData.status);
    showToast('Processo atualizado!');
  };

  const deleteProcess = (id) => {
    setProcesses(prev => {
      const next = prev.filter(p => p.id !== id);
      storageService.saveData('processes', next);
      return next;
    });
    storageService.deleteFromSupabase('processes', id);
    showToast('Processo excluido.');
  };

  // --- TASKS ACTIONS ---
  const addTask = (taskData) => {
    const newTask = {
      ...taskData,
      id: 'tsk_' + Date.now(),
      escritorio_id: currentEscritorioId,
      status: 'pending',
      createdAt: new Date().toISOString().split('T')[0],
    };
    setTasks(prev => {
      const next = [newTask, ...prev];
      storageService.saveData('tasks', next);
      return next;
    });
    logActivity('Nova Tarefa', newTask.title, 'Prazo: ' + (newTask.dueDate || 'Nao informado'));
    showToast('Tarefa criada com sucesso!');
    return newTask;
  };

  const toggleTask = (id) => {
    setTasks(prev => {
      const next = prev.map(t => {
        if (t.id === id) {
          const nextStatus = t.status === 'completed' ? 'pending' : 'completed';
          if (nextStatus === 'completed') showToast('Tarefa concluida!');
          return { ...t, status: nextStatus };
        }
        return t;
      });
      storageService.saveData('tasks', next);
      return next;
    });
  };

  const deleteTask = (id) => {
    setTasks(prev => {
      const next = prev.filter(t => t.id !== id);
      storageService.saveData('tasks', next);
      return next;
    });
    storageService.deleteFromSupabase('tasks', id);
    showToast('Tarefa excluida.');
  };

  // --- APPOINTMENTS / AGENDA ---
  const addAppointment = (aptData) => {
    const newApt = {
      ...aptData,
      id: 'apt_' + Date.now(),
      escritorio_id: currentEscritorioId,
      type: aptData.type || 'meeting',
    };
    setAppointments(prev => {
      const next = [newApt, ...prev];
      storageService.saveData('appointments', next);
      return next;
    });
    logActivity('Novo Agendamento', newApt.title, newApt.date + ' as ' + newApt.time);
    showToast('Compromisso agendado com sucesso!');
    return newApt;
  };

  const deleteAppointment = (id) => {
    setAppointments(prev => {
      const next = prev.filter(a => a.id !== id);
      storageService.saveData('appointments', next);
      return next;
    });
    storageService.deleteFromSupabase('appointments', id);
    showToast('Compromisso cancelado.');
  };

  // --- ATTENDANCES ACTIONS ---
  const addAttendance = (attData) => {
    const newAtt = {
      ...attData,
      id: 'att_' + Date.now(),
      escritorio_id: currentEscritorioId,
      date: attData.date || new Date().toISOString().split('T')[0],
    };
    setAttendances(prev => {
      const next = [newAtt, ...prev];
      storageService.saveData('attendances', next);
      return next;
    });
    logActivity('Atendimento Registrado', newAtt.clientName, 'Canal: ' + newAtt.channel);
    showToast('Atendimento registrado!');
    return newAtt;
  };

  // --- FINANCIAL ACTIONS ---
  const markInstallmentPaid = (installmentId) => {
    setInstallments(prev => {
      const next = prev.map(inst => {
        if (inst.id === installmentId) {
          return {
            ...inst,
            status: 'paid',
            paymentDate: new Date().toISOString().split('T')[0]
          };
        }
        return inst;
      });
      storageService.saveData('installments', next);
      return next;
    });
    showToast('Parcela marcada como paga!');
  };

  // --- DOCUMENTS ACTIONS ---
  const addDocument = (docData) => {
    const newDoc = {
      ...docData,
      id: 'doc_' + Date.now(),
      escritorio_id: currentEscritorioId,
      uploadedAt: new Date().toISOString(),
    };
    setDocuments(prev => {
      const next = [newDoc, ...prev];
      storageService.saveData('documents', next);
      return next;
    });
    logActivity('Upload de Documento', newDoc.title, 'Categoria: ' + newDoc.category);
    showToast('Documento anexado com sucesso!');
    return newDoc;
  };

  const deleteDocument = (id) => {
    setDocuments(prev => {
      const next = prev.filter(d => d.id !== id);
      storageService.saveData('documents', next);
      return next;
    });
    storageService.deleteFromSupabase('documents', id);
    showToast('Documento removido.');
  };

  // --- SETTINGS ACTIONS ---
  const updateOfficeSettings = (settingsData) => {
    setOfficeSettings(prev => {
      const merged = { ...prev, ...settingsData };
      storageService.saveData('office_settings', merged);
      return merged;
    });

    if (currentEscritorioId) {
      setEscritorios(prev => {
        const next = prev.map(e => {
          if (e.id === currentEscritorioId) {
            return {
              ...e,
              nome: settingsData.officeName || settingsData.name || e.nome,
              cnpj: settingsData.cnpj !== undefined ? settingsData.cnpj : e.cnpj,
              email: settingsData.email !== undefined ? settingsData.email : e.email,
              telefone: settingsData.phone !== undefined ? settingsData.phone : e.telefone,
              endereco: settingsData.address !== undefined ? settingsData.address : e.endereco,
            };
          }
          return e;
        });
        storageService.saveData('escritorios', next);
        return next;
      });
    }
  };

  const addLegalArea = (area) => {
    setLegalAreas(prev => {
      const next = [...prev, { ...area, id: 'area_' + Date.now() }];
      storageService.saveData('legal_areas', next);
      return next;
    });
  };

  const removeLegalArea = (id) => {
    setLegalAreas(prev => {
      const next = prev.filter(a => a.id !== id);
      storageService.saveData('legal_areas', next);
      return next;
    });
  };

  const addLeadSource = (source) => {
    setLeadSources(prev => {
      const next = [...prev, { ...source, id: 'source_' + Date.now() }];
      storageService.saveData('lead_sources', next);
      return next;
    });
  };

  const removeLeadSource = (id) => {
    setLeadSources(prev => {
      const next = prev.filter(s => s.id !== id);
      storageService.saveData('lead_sources', next);
      return next;
    });
  };

  const resetAllData = async () => {
    await storageService.resetToDefault();
    setEscritorios(INITIAL_ESCRITORIOS);
    setLeads(INITIAL_LEADS);
    setClients(INITIAL_CLIENTS);
    setContracts(INITIAL_CONTRACTS);
    setProposals(INITIAL_PROPOSALS);
    setProcesses(INITIAL_PROCESSES);
    setTasks(INITIAL_TASKS);
    setAppointments(INITIAL_APPOINTMENTS);
    setAttendances(INITIAL_ATTENDANCES);
    setInstallments(INITIAL_INSTALLMENTS);
    setDocuments(INITIAL_DOCUMENTS);
    setLegalAreas(INITIAL_LEGAL_AREAS);
    setLeadSources(INITIAL_LEAD_SOURCES);
    setOfficeSettings(INITIAL_OFFICE_SETTINGS);
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => {
      const next = prev.map(n => ({ ...n, read: true }));
      storageService.saveData('notifications', next);
      return next;
    });
  };

  return (
    <CRMContext.Provider
      value={{
        // Multi-Tenant
        escritorios,
        currentEscritorioId,
        currentEscritorio,
        switchEscritorio,
        addEscritorio,
        updateEscritorio,
        deleteEscritorio,

        // Data State
        leads,
        clients,
        contracts,
        proposals,
        processes,
        tasks,
        appointments,
        attendances,
        installments,
        documents,
        legalAreas,
        leadSources,
        activityLogs,
        notifications,
        officeSettings,
        periodFilter,
        setPeriodFilter,
        toast,
        showToast,
        triggerConfetti,
        supabaseConnected,
        initialSupabaseSyncDone,

        // Methods
        addLead,
        updateLead,
        moveLeadStage,
        deleteLead,
        addClient,
        updateClient,
        deleteClient,
        addContract,
        updateContract,
        deleteContract,
        closeContractWorkflow,
        addProposal,
        updateProposal,
        deleteProposal,
        addProcess,
        updateProcess,
        deleteProcess,
        addTask,
        toggleTask,
        deleteTask,
        addAppointment,
        deleteAppointment,
        addAttendance,
        markInstallmentPaid,
        addDocument,
        deleteDocument,
        updateOfficeSettings,
        addLegalArea,
        removeLegalArea,
        addLeadSource,
        removeLeadSource,
        resetAllData,
        markAllNotificationsRead,
      }}
    >
      {children}
    </CRMContext.Provider>
  );
}

export function useCRM() {
  const context = useContext(CRMContext);
  if (!context) throw new Error('useCRM must be used within a CRMProvider');
  return context;
}
;

fs.writeFileSync(path.join('C:', 'JurisFlow-ADV', 'src', 'context', 'CRMContext.jsx'), content, 'utf8');
console.log('CRMContext.jsx written successfully!');