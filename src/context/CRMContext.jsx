import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { storageService, INITIAL_ESCRITORIOS } from '../services/storageService';
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

  // Sincronizar escritorio ativo automaticamente quando o usuario logar ou possuir escritorio_id
  useEffect(() => {
    if (currentUser?.escritorio_id && currentUser.escritorio_id !== currentEscritorioId) {
      switchEscritorio(currentUser.escritorio_id);
    }
  }, [currentUser?.escritorio_id, currentEscritorioId, switchEscritorio]);

  // Hidratacao e sincronizacao inicial a partir do Supabase com Auto-Recuperacao Local
  useEffect(() => {
    async function loadCloudData() {
      try {
        const cloudEscritorios = await storageService.fetchFromSupabase('escritorios', INITIAL_ESCRITORIOS);
        if (cloudEscritorios && cloudEscritorios.length > 0) {
          setEscritorios(cloudEscritorios);
        }

        let targetEscritorioId = currentUser?.escritorio_id || storageService.getCurrentEscritorioId();
        if (cloudEscritorios && cloudEscritorios.length > 0) {
          const targetExists = cloudEscritorios.some(e => e.id === targetEscritorioId);
          if (!targetExists) {
            targetEscritorioId = cloudEscritorios[0].id;
          }
        }
        storageService.setCurrentEscritorioId(targetEscritorioId);
        setCurrentEscritorioIdState(targetEscritorioId);

        // Auto-recupera qualquer dado que a cliente tenha digitado no navegador local e sincroniza com a nuvem
        const [
          syncedLeads,
          syncedClients,
          syncedContracts,
          syncedProposals,
          syncedProcesses,
          syncedTasks,
          syncedAppointments,
          syncedAttendances,
          syncedInstallments,
          syncedDocs,
          syncedOfficeSettings
        ] = await Promise.all([
          storageService.recoverAndSyncLocalData('leads', INITIAL_LEADS, targetEscritorioId),
          storageService.recoverAndSyncLocalData('clients', INITIAL_CLIENTS, targetEscritorioId),
          storageService.recoverAndSyncLocalData('contracts', INITIAL_CONTRACTS, targetEscritorioId),
          storageService.recoverAndSyncLocalData('proposals', INITIAL_PROPOSALS, targetEscritorioId),
          storageService.recoverAndSyncLocalData('processes', INITIAL_PROCESSES, targetEscritorioId),
          storageService.recoverAndSyncLocalData('tasks', INITIAL_TASKS, targetEscritorioId),
          storageService.recoverAndSyncLocalData('appointments', INITIAL_APPOINTMENTS, targetEscritorioId),
          storageService.recoverAndSyncLocalData('attendances', INITIAL_ATTENDANCES, targetEscritorioId),
          storageService.recoverAndSyncLocalData('installments', INITIAL_INSTALLMENTS, targetEscritorioId),
          storageService.recoverAndSyncLocalData('documents', INITIAL_DOCUMENTS, targetEscritorioId),
          storageService.recoverAndSyncLocalData('office_settings', [INITIAL_OFFICE_SETTINGS], targetEscritorioId),
        ]);

        if (syncedLeads !== undefined) setLeads(syncedLeads);
        if (syncedClients !== undefined) setClients(syncedClients);
        if (syncedContracts !== undefined) setContracts(syncedContracts);
        if (syncedProposals !== undefined) setProposals(syncedProposals);
        if (syncedProcesses !== undefined) setProcesses(syncedProcesses);
        if (syncedTasks !== undefined) setTasks(syncedTasks);
        if (syncedAppointments !== undefined) setAppointments(syncedAppointments);
        if (syncedAttendances !== undefined) setAttendances(syncedAttendances);
        if (syncedInstallments !== undefined) setInstallments(syncedInstallments);
        if (syncedDocs !== undefined) setDocuments(syncedDocs);
        if (syncedOfficeSettings && syncedOfficeSettings.length > 0) {
          setOfficeSettings(syncedOfficeSettings[0]);
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

  // Live Sync em TEMPO REAL com Supabase para dados do CRM
  // Ref para impedir que atualizações vindas do realtime re-disparem sync para o Supabase (loop infinito)
  const isRealtimeUpdateRef = useRef(false);
  const subscriptionStatusRef = useRef('closed');
  const pollingIntervalRef = useRef(null);

  // Mapa de setters para simplificar o handler de realtime
  const stateSettersRef = useRef({
    leads: setLeads,
    clients: setClients,
    contracts: setContracts,
    proposals: setProposals,
    processes: setProcesses,
    tasks: setTasks,
    appointments: setAppointments,
    attendances: setAttendances,
    installments: setInstallments,
    documents: setDocuments,
    escritorios: setEscritorios,
    office_settings: (data) => {
      if (Array.isArray(data) && data.length > 0) setOfficeSettings(data[0]);
      else if (data && !Array.isArray(data)) setOfficeSettings(data);
    },
  });

  useEffect(() => {
    let mounted = true;

    const tablesToWatch = [
      'leads', 'clients', 'contracts', 'proposals', 'processes',
      'tasks', 'appointments', 'attendances', 'installments',
      'documents', 'office_settings', 'escritorios'
    ];

    // Handler centralizado de realtime
    const handleRealtimeEvent = async (table, payload) => {
      if (!mounted) return;
      try {
        console.info(`[Realtime] Evento recebido na tabela ${table}:`, payload.eventType);
        const activeEscritorio = storageService.getCurrentEscritorioId();
        const refreshed = await storageService.fetchFromSupabase(table, [], activeEscritorio);
        if (!mounted || !refreshed) return;

        // Marca que esta atualização vem do realtime — os useEffects de persist
        // NÃO devem chamar syncToSupabase novamente para evitar loop infinito
        isRealtimeUpdateRef.current = true;

        const setter = stateSettersRef.current[table];
        if (setter) {
          setter(refreshed);
        }

        // Reseta a flag após o React processar o setState
        requestAnimationFrame(() => {
          isRealtimeUpdateRef.current = false;
        });
      } catch (err) {
        console.warn(`[Realtime Sync Warning ${table}]:`, err.message);
      }
    };

    // Cria o canal realtime com tracking de status
    const crmChannel = supabase.channel('realtime_crm_data_changes', {
      config: { broadcast: { self: false } }
    });

    tablesToWatch.forEach(table => {
      crmChannel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        (payload) => handleRealtimeEvent(table, payload)
      );
    });

    crmChannel.subscribe((status) => {
      subscriptionStatusRef.current = status;
      console.info('[Realtime] Status da subscription:', status);
      if (status === 'SUBSCRIBED') {
        console.info('[Realtime] ✅ Canal ativo — sincronização em tempo real funcionando');
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        console.warn('[Realtime] ⚠️ Canal fechado/erro — tentando reconectar em 5s...');
        setTimeout(() => {
          if (mounted) {
            crmChannel.subscribe();
          }
        }, 5000);
      }
    });

    // Polling de fallback a cada 30s caso o realtime perca conexão silenciosamente
    pollingIntervalRef.current = setInterval(async () => {
      if (!mounted) return;
      if (subscriptionStatusRef.current !== 'SUBSCRIBED') {
        console.info('[Polling Fallback] Realtime offline — buscando dados do Supabase...');
        try {
          const activeEscritorio = storageService.getCurrentEscritorioId();
          const refreshPromises = tablesToWatch
            .filter(t => t !== 'escritorios' && t !== 'office_settings')
            .map(async (table) => {
              const data = await storageService.fetchFromSupabase(table, [], activeEscritorio);
              if (data && mounted) {
                isRealtimeUpdateRef.current = true;
                const setter = stateSettersRef.current[table];
                if (setter) setter(data);
                requestAnimationFrame(() => { isRealtimeUpdateRef.current = false; });
              }
            });
          await Promise.allSettled(refreshPromises);
        } catch (err) {
          console.warn('[Polling Fallback] Erro:', err.message);
        }
      }
    }, 30000);

    return () => {
      mounted = false;
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
      supabase.removeChannel(crmChannel);
    };
  }, []);

  // Global filters & UI state
  const [periodFilter, setPeriodFilter] = useState('30d');
  const [toast, setToast] = useState(null);

  // Sync state to localStorage SOMENTE — o Supabase é atualizado diretamente pelas actions CRUD.
  // Quando a atualização veio do realtime (isRealtimeUpdateRef.current === true), salva apenas no localStorage
  // para manter o cache local atualizado, MAS NÃO faz syncToSupabase (evita loop infinito).
  const persistToLocal = useCallback((key, data) => {
    if (!isSyncReadyRef.current) return;
    try {
      localStorage.setItem('jurisflow_' + key, JSON.stringify(data));
    } catch (e) {
      console.error('Erro ao salvar ' + key + ' no localStorage:', e);
    }
    // Só sincroniza com Supabase se a mudança NÃO veio de um evento realtime
    if (!isRealtimeUpdateRef.current) {
      storageService.syncToSupabase(key, data).catch(err => {
        console.warn('[Persist Sync] Falha em ' + key + ':', err?.message || err);
      });
    }
  }, []);

  useEffect(() => { persistToLocal('escritorios', escritorios); }, [escritorios, persistToLocal]);
  useEffect(() => { persistToLocal('leads', leads); }, [leads, persistToLocal]);
  useEffect(() => { persistToLocal('clients', clients); }, [clients, persistToLocal]);
  useEffect(() => { persistToLocal('contracts', contracts); }, [contracts, persistToLocal]);
  useEffect(() => { persistToLocal('proposals', proposals); }, [proposals, persistToLocal]);
  useEffect(() => { persistToLocal('processes', processes); }, [processes, persistToLocal]);
  useEffect(() => { persistToLocal('tasks', tasks); }, [tasks, persistToLocal]);
  useEffect(() => { persistToLocal('appointments', appointments); }, [appointments, persistToLocal]);
  useEffect(() => { persistToLocal('attendances', attendances); }, [attendances, persistToLocal]);
  useEffect(() => { persistToLocal('installments', installments); }, [installments, persistToLocal]);
  useEffect(() => { persistToLocal('documents', documents); }, [documents, persistToLocal]);
  useEffect(() => { persistToLocal('legal_areas', legalAreas); }, [legalAreas, persistToLocal]);
  useEffect(() => { persistToLocal('lead_sources', leadSources); }, [leadSources, persistToLocal]);
  useEffect(() => { persistToLocal('activity_logs', activityLogs); }, [activityLogs, persistToLocal]);
  useEffect(() => { persistToLocal('notifications', notifications); }, [notifications, persistToLocal]);
  useEffect(() => { persistToLocal('office_settings', officeSettings); }, [officeSettings, persistToLocal]);


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

  const hideToast = useCallback(() => {
    setToast(null);
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
      id: `log_${Date.now()}`,
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
      id: `esc_${Date.now()}`,
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
    logActivity('Novo Escritorio Criado', newEsc.nome, `Plano: ${newEsc.plano}`);
    showToast(`Escritorio ${newEsc.nome} criado com sucesso!`);
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
      id: `lead_${Date.now()}`,
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
    storageService.saveToSupabase('leads', [newLead]);
    logActivity('Novo Lead', newLead.name, `Origem: ${newLead.source || 'Indicacao'}`);
    showToast('Lead adicionado com sucesso!');
    return newLead;
  };

  const updateLead = (id, leadData) => {
    let updatedLead = null;
    setLeads(prev => {
      const next = prev.map(l => {
        if (l.id === id) {
          updatedLead = { ...l, ...leadData, escritorio_id: currentEscritorioId };
          return updatedLead;
        }
        return l;
      });
      storageService.saveData('leads', next);
      return next;
    });
    if (updatedLead) {
      storageService.saveToSupabase('leads', [updatedLead]);
    }
    logActivity('Lead Atualizado', leadData.name || id, 'Informacoes atualizadas');
    showToast('Lead atualizado com sucesso!');
  };

  const moveLeadStage = (leadId, newStage, newSubStage = null) => {
    let updatedLead = null;
    setLeads(prev => {
      const lead = prev.find(l => l.id === leadId);
      const next = prev.map(l => {
        if (l.id === leadId) {
          updatedLead = {
            ...l,
            stage: newStage,
            subStage: newSubStage || l.subStage,
            lastContactDate: new Date().toISOString().split('T')[0],
            escritorio_id: currentEscritorioId
          };
          return updatedLead;
        }
        return l;
      });
      storageService.saveData('leads', next);
      if (lead) {
        logActivity('Lead Movido', lead.name, `Etapa: ${newStage}`);
      }
      return next;
    });
    if (updatedLead) {
      storageService.saveToSupabase('leads', [updatedLead]);
    }
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
      id: `cli_${Date.now()}`,
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
    storageService.saveToSupabase('clients', [newClient]);
    logActivity('Novo Cliente', newClient.name, `CPF/CNPJ: ${newClient.cpf || newClient.cnpj || 'N/A'}`);
    showToast('Cliente cadastrado com sucesso!');
    return newClient;
  };

  const updateClient = (id, clientData) => {
    let updatedClient = null;
    setClients(prev => {
      const next = prev.map(c => {
        if (c.id === id) {
          updatedClient = { ...c, ...clientData, escritorio_id: currentEscritorioId };
          return updatedClient;
        }
        return c;
      });
      storageService.saveData('clients', next);
      return next;
    });
    if (updatedClient) {
      storageService.saveToSupabase('clients', [updatedClient]);
    }
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
      id: `cnt_${Date.now()}`,
      escritorio_id: currentEscritorioId,
      status: contractData.status || 'draft',
      createdDate: new Date().toISOString().split('T')[0],
    };
    setContracts(prev => {
      const next = [newContract, ...prev];
      storageService.saveData('contracts', next);
      return next;
    });
    storageService.saveToSupabase('contracts', [newContract]);
    logActivity('Novo Contrato', newContract.title, `Cliente: ${newContract.clientName}`);
    showToast('Contrato gerado com sucesso!');
    return newContract;
  };

  const updateContract = (id, contractData) => {
    let updatedContract = null;
    setContracts(prev => {
      const next = prev.map(c => {
        if (c.id === id) {
          updatedContract = { ...c, ...contractData, escritorio_id: currentEscritorioId };
          return updatedContract;
        }
        return c;
      });
      storageService.saveData('contracts', next);
      return next;
    });
    if (updatedContract) {
      storageService.saveToSupabase('contracts', [updatedContract]);
    }
    logActivity('Contrato Atualizado', contractData.title || id, `Status: ${contractData.status}`);
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
          id: `cli_${Date.now()}`,
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
        storageService.saveToSupabase('clients', [client]);
      }
    }

    // 2. Criar contrato
    const contract = {
      ...contractData,
      id: `cnt_${Date.now()}`,
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
    storageService.saveToSupabase('contracts', [contract]);

    // 3. Gerar parcelas no financeiro
    if (installmentsList.length > 0) {
      const mappedInsts = installmentsList.map(inst => ({ ...inst, escritorio_id: currentEscritorioId }));
      setInstallments(prev => {
        const next = [...mappedInsts, ...prev];
        storageService.saveData('installments', next);
        return next;
      });
      storageService.saveToSupabase('installments', mappedInsts);
    }

    // 4. Mover lead para contrato_assinado
    if (leadId) {
      moveLeadStage(leadId, 'contrato_assinado');
    }

    logActivity('Fechamento de Negocio', contract.title, `Valor: R$ ${Number(contract.value || 0).toLocaleString('pt-BR')}`);
    showToast('🎉 Negocio fechado com sucesso! Contrato, cliente e financeiro criados.');
  };

  // --- PROPOSALS ACTIONS ---
  const addProposal = (propData) => {
    const newProp = {
      ...propData,
      id: `prop_${Date.now()}`,
      escritorio_id: currentEscritorioId,
      status: propData.status || 'sent',
      sentDate: new Date().toISOString().split('T')[0],
    };
    setProposals(prev => {
      const next = [newProp, ...prev];
      storageService.saveData('proposals', next);
      return next;
    });
    storageService.saveToSupabase('proposals', [newProp]);
    logActivity('Nova Proposta', newProp.title, `Para: ${newProp.clientName || newProp.leadName}`);
    showToast('Proposta criada e enviada!');
    return newProp;
  };

  const updateProposal = (id, propData) => {
    let updatedProp = null;
    setProposals(prev => {
      const next = prev.map(p => {
        if (p.id === id) {
          updatedProp = { ...p, ...propData, escritorio_id: currentEscritorioId };
          return updatedProp;
        }
        return p;
      });
      storageService.saveData('proposals', next);
      return next;
    });
    if (updatedProp) {
      storageService.saveToSupabase('proposals', [updatedProp]);
    }
    logActivity('Proposta Atualizada', propData.title || id, `Status: ${propData.status}`);
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
      id: `prc_${Date.now()}`,
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
    storageService.saveToSupabase('processes', [newProc]);
    logActivity('Novo Processo', newProc.processNumber, `Cliente: ${newProc.clientName}`);
    showToast('Processo cadastrado com sucesso!');
    return newProc;
  };

  const updateProcess = (id, procData) => {
    let updatedProc = null;
    setProcesses(prev => {
      const next = prev.map(p => {
        if (p.id === id) {
          updatedProc = { ...p, ...procData, lastUpdateDate: new Date().toISOString().split('T')[0], escritorio_id: currentEscritorioId };
          return updatedProc;
        }
        return p;
      });
      storageService.saveData('processes', next);
      return next;
    });
    if (updatedProc) {
      storageService.saveToSupabase('processes', [updatedProc]);
    }
    logActivity('Processo Atualizado', procData.processNumber || id, `Status: ${procData.status}`);
    showToast('Processo atualizado!');
  };

  const deleteProcess = (id) => {
    setProcesses(prev => {
      const next = prev.filter(p => p.id !== id);
      storageService.saveData('processes', next);
      return next;
    });
    storageService.deleteFromSupabase('processes', id);
    showToast('Processo excluida.');
  };

  // --- TASKS ACTIONS ---
  const addTask = (taskData) => {
    const newTask = {
      ...taskData,
      id: `tsk_${Date.now()}`,
      escritorio_id: currentEscritorioId,
      status: 'pending',
      createdAt: new Date().toISOString().split('T')[0],
    };
    setTasks(prev => {
      const next = [newTask, ...prev];
      storageService.saveData('tasks', next);
      return next;
    });
    storageService.saveToSupabase('tasks', [newTask]);
    logActivity('Nova Tarefa', newTask.title, `Prazo: ${newTask.dueDate || 'Nao informado'}`);
    showToast('Tarefa criada com sucesso!');
    return newTask;
  };

  const updateTask = (id, taskData) => {
    let updatedTask = null;
    setTasks(prev => {
      const next = prev.map(t => {
        if (t.id === id) {
          updatedTask = { ...t, ...taskData, escritorio_id: currentEscritorioId };
          return updatedTask;
        }
        return t;
      });
      storageService.saveData('tasks', next);
      return next;
    });
    if (updatedTask) {
      storageService.saveToSupabase('tasks', [updatedTask]);
    }
    logActivity('Tarefa Atualizada', taskData.title || id, `Prioridade: ${taskData.priority || 'media'}`);
    showToast('Tarefa atualizada com sucesso!');
  };

  const toggleTask = (id) => {
    let toggledTask = null;
    setTasks(prev => {
      const next = prev.map(t => {
        if (t.id === id) {
          const nextStatus = t.status === 'completed' ? 'pending' : 'completed';
          if (nextStatus === 'completed') showToast('Tarefa concluida!');
          toggledTask = { ...t, status: nextStatus, escritorio_id: currentEscritorioId };
          return toggledTask;
        }
        return t;
      });
      storageService.saveData('tasks', next);
      return next;
    });
    if (toggledTask) {
      storageService.saveToSupabase('tasks', [toggledTask]);
    }
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
    let resolvedClientId = aptData.clientId || null;
    let autoCreatedClient = null;

    // Se informou nome de cliente e não vinculou ID existente, verifica se já existe ou cria
    if (aptData.clientName && aptData.clientName.trim()) {
      const cleanName = aptData.clientName.trim();
      const existingClient = clients.find(c => (c.name || '').toLowerCase() === cleanName.toLowerCase());
      if (existingClient) {
        resolvedClientId = existingClient.id;
      } else {
        // Auto-cria cliente na base do CRM para sincronização imediata
        autoCreatedClient = {
          id: `cli_${Date.now()}`,
          escritorio_id: currentEscritorioId,
          name: cleanName,
          cpf: '',
          cnpj: '',
          email: '',
          phone: '',
          whatsapp: '',
          city: 'São Paulo',
          state: 'SP',
          legalArea: 'Geral',
          status: 'active',
          totalContracted: 0,
          totalPaid: 0,
          createdAt: new Date().toISOString().split('T')[0],
          notes: `Cliente cadastrado automaticamente via agendamento de ${aptData.title || 'compromisso'}.`
        };
        resolvedClientId = autoCreatedClient.id;
        setClients(prev => {
          const nextClients = [autoCreatedClient, ...prev];
          storageService.saveData('clients', nextClients);
          return nextClients;
        });
        storageService.saveToSupabase('clients', [autoCreatedClient]);
      }
    }

    const newApt = {
      ...aptData,
      id: `apt_${Date.now()}`,
      clientId: resolvedClientId,
      escritorio_id: currentEscritorioId,
      type: aptData.type || 'meeting',
    };

    setAppointments(prev => {
      const next = [newApt, ...prev];
      storageService.saveData('appointments', next);
      return next;
    });

    storageService.saveToSupabase('appointments', [newApt]);

    logActivity('Novo Agendamento', newApt.title, `${newApt.date} às ${newApt.time || newApt.startTime || ''}`);
    showToast(autoCreatedClient ? 'Compromisso agendado e cliente cadastrado no CRM!' : 'Compromisso agendado com sucesso!');
    return newApt;
  };

  const updateAppointment = (id, updatedFields) => {
    let updatedApt = null;
    setAppointments(prev => {
      const next = prev.map(a => {
        if (a.id === id) {
          updatedApt = { ...a, ...updatedFields, escritorio_id: currentEscritorioId };
          return updatedApt;
        }
        return a;
      });
      storageService.saveData('appointments', next);
      return next;
    });
    if (updatedApt) {
      storageService.saveToSupabase('appointments', [updatedApt]);
    }
    logActivity('Compromisso Atualizado', updatedFields.title || 'Agenda', `Atualizado em ${new Date().toLocaleDateString('pt-BR')}`);
    showToast('Compromisso atualizado com sucesso!');
    return true;
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
      id: `att_${Date.now()}`,
      escritorio_id: currentEscritorioId,
      date: attData.date || new Date().toISOString().split('T')[0],
    };
    setAttendances(prev => {
      const next = [newAtt, ...prev];
      storageService.saveData('attendances', next);
      return next;
    });
    storageService.saveToSupabase('attendances', [newAtt]);
    logActivity('Atendimento Registrado', newAtt.clientName, `Canal: ${newAtt.channel}`);
    showToast('Atendimento registrado!');
    return newAtt;
  };

  // --- FINANCIAL ACTIONS ---
  const markInstallmentPaid = (installmentId) => {
    let paidInst = null;
    setInstallments(prev => {
      const next = prev.map(inst => {
        if (inst.id === installmentId) {
          paidInst = {
            ...inst,
            status: 'paid',
            paymentDate: new Date().toISOString().split('T')[0],
            escritorio_id: currentEscritorioId
          };
          return paidInst;
        }
        return inst;
      });
      storageService.saveData('installments', next);
      return next;
    });
    if (paidInst) {
      storageService.saveToSupabase('installments', [paidInst]);
    }
    showToast('Parcela marcada como paga! 💰');
  };

  // --- DOCUMENTS ACTIONS ---
  const addDocument = (docData) => {
    const newDoc = {
      ...docData,
      id: `doc_${Date.now()}`,
      escritorio_id: currentEscritorioId,
      uploadedAt: new Date().toISOString(),
    };
    setDocuments(prev => {
      const next = [newDoc, ...prev];
      storageService.saveData('documents', next);
      return next;
    });
    storageService.saveToSupabase('documents', [newDoc]);
    logActivity('Upload de Documento', newDoc.title, `Categoria: ${newDoc.category}`);
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
    const merged = { ...officeSettings, ...settingsData, escritorio_id: currentEscritorioId };
    setOfficeSettings(merged);
    storageService.saveData('office_settings', merged);
    storageService.saveToSupabase('office_settings', [merged]);

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
        storageService.saveToSupabase('escritorios', next);
        return next;
      });
    }
  };

  const addLegalArea = (area) => {
    setLegalAreas(prev => {
      const next = [...prev, { ...area, id: `area_${Date.now()}` }];
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
      const next = [...prev, { ...source, id: `source_${Date.now()}` }];
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
        hideToast,
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
        updateTask,
        toggleTask,
        deleteTask,
        addAppointment,
        updateAppointment,
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
