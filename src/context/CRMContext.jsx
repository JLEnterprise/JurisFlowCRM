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
import { deleteFileFromIndexedDB, formatFileSize } from '../utils/fileHelper';

const CRMContext = createContext();

export function CRMProvider({ children }) {
  const { currentUser } = useAuth();

  // Multi-Tenant State estritamente acoplado ao usuário autenticado
  const activeTenantId = currentUser?.escritorio_id || storageService.getCurrentEscritorioId() || null;
  const [currentEscritorioId, setCurrentEscritorioIdState] = useState(() => activeTenantId);
  const [escritorios, setEscritorios] = useState(() => {
    if (!activeTenantId) return [];
    return storageService.loadData('escritorios', [], activeTenantId);
  });

  // State slices iniciam vazios por padrão ou carregados exclusivamente para o tenant ativo
  const [leads, setLeads] = useState(() => activeTenantId ? storageService.loadData('leads', [], activeTenantId) : []);
  const [clients, setClients] = useState(() => activeTenantId ? storageService.loadData('clients', [], activeTenantId) : []);
  const [contracts, setContracts] = useState(() => activeTenantId ? storageService.loadData('contracts', [], activeTenantId) : []);
  const [proposals, setProposals] = useState(() => {
    if (!activeTenantId) return [];
    const loaded = storageService.loadData('proposals', [], activeTenantId) || [];
    return loaded.filter(p => {
      const id = String(p?.id || '');
      const num = String(p?.proposalNumber || p?.proposal_number || '');
      return !storageService.isDeleted(id) && !storageService.isDeleted(num);
    });
  });
  const [processes, setProcesses] = useState(() => activeTenantId ? storageService.loadData('processes', [], activeTenantId) : []);
  const [tasks, setTasks] = useState(() => activeTenantId ? storageService.loadData('tasks', [], activeTenantId) : []);
  const [appointments, setAppointments] = useState(() => activeTenantId ? storageService.loadData('appointments', [], activeTenantId) : []);
  const [attendances, setAttendances] = useState(() => activeTenantId ? storageService.loadData('attendances', [], activeTenantId) : []);
  const [installments, setInstallments] = useState(() => activeTenantId ? storageService.loadData('installments', [], activeTenantId) : []);
  const [documents, setDocuments] = useState(() => activeTenantId ? storageService.loadData('documents', [], activeTenantId) : []);
  const [legalAreas, setLegalAreas] = useState(() => storageService.loadData('legal_areas', INITIAL_LEGAL_AREAS));
  const [leadSources, setLeadSources] = useState(() => storageService.loadData('lead_sources', INITIAL_LEAD_SOURCES));
  const [activityLogs, setActivityLogs] = useState(() => activeTenantId ? storageService.loadData('activity_logs', [], activeTenantId) : []);
  const [notifications, setNotifications] = useState(() => activeTenantId ? storageService.loadData('notifications', [], activeTenantId) : []);
  const [officeSettings, setOfficeSettings] = useState(() => {
    const defaultSettings = {
      ...INITIAL_OFFICE_SETTINGS,
      officeName: currentUser?.firmName || 'Meu Escritório',
      tradeName: currentUser?.firmName || 'JurisFlow CRM',
      email: currentUser?.email || 'contato@jurisflow.adv.br',
    };
    if (!activeTenantId) return defaultSettings;
    return storageService.loadData('office_settings', defaultSettings, activeTenantId);
  });

  const [supabaseConnected, setSupabaseConnected] = useState(true);
  const [initialSupabaseSyncDone, setInitialSupabaseSyncDone] = useState(false);
  const isSyncReadyRef = useRef(false);

  // Objeto do escritorio ativo (sempre isolado)
  const currentEscritorio = escritorios.find(e => e.id === currentEscritorioId) || {
    id: currentEscritorioId || 'esc_novo',
    nome: currentUser?.firmName || officeSettings?.officeName || 'Meu Escritório',
    status: 'active'
  };

  // Alternar escritorio ativo com carregamento instantaneo e sincronizacao
  const switchEscritorio = useCallback(async (escritorioId) => {
    if (!escritorioId) return;
    storageService.setCurrentEscritorioId(escritorioId);
    setCurrentEscritorioIdState(escritorioId);
    storageService.purgeContaminatedCache(escritorioId);
    
    // 1. Carregamento local instantaneo (0ms - zero tela preta ou espera)
    const localLeads = storageService.loadData('leads', [], escritorioId);
    const localClients = storageService.loadData('clients', [], escritorioId);
    const localContracts = storageService.loadData('contracts', [], escritorioId);
    const localProposals = storageService.loadData('proposals', [], escritorioId);
    const localProcesses = storageService.loadData('processes', [], escritorioId);
    const localTasks = storageService.loadData('tasks', [], escritorioId);
    const localAppointments = storageService.loadData('appointments', [], escritorioId);
    const localAttendances = storageService.loadData('attendances', [], escritorioId);
    const localInstallments = storageService.loadData('installments', [], escritorioId);
    const localDocs = storageService.loadData('documents', [], escritorioId);
    const localSettings = storageService.loadData('office_settings', null, escritorioId);
    const localEscritorios = storageService.loadData('escritorios', [], escritorioId);

    setLeads(localLeads || []);
    setClients(localClients || []);
    setContracts(localContracts || []);
    setProposals(localProposals || []);
    setProcesses(localProcesses || []);
    setTasks(localTasks || []);
    setAppointments(localAppointments || []);
    setAttendances(localAttendances || []);
    setInstallments(localInstallments || []);
    setDocuments(localDocs || []);
    if (localSettings) setOfficeSettings(localSettings);
    if (localEscritorios?.length) setEscritorios(localEscritorios);

    // 2. Sincronizacao remota em segundo plano
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
        cloudDocs,
        cloudSettings,
        cloudEscritorios
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
        storageService.fetchFromSupabase('office_settings', [], escritorioId),
        storageService.fetchFromSupabase('escritorios', [], escritorioId),
      ]);

      if (cloudLeads) setLeads(cloudLeads);
      if (cloudClients) setClients(cloudClients);
      if (cloudContracts) setContracts(cloudContracts);
      if (cloudProposals) setProposals(cloudProposals);
      if (cloudProcesses) setProcesses(cloudProcesses);
      if (cloudTasks) setTasks(cloudTasks);
      if (cloudAppointments) setAppointments(cloudAppointments);
      if (cloudAttendances) setAttendances(cloudAttendances);
      if (cloudInstallments) setInstallments(cloudInstallments);
      if (cloudDocs) setDocuments(cloudDocs);
      if (cloudEscritorios && cloudEscritorios.length > 0) {
        setEscritorios(cloudEscritorios);
      }
      if (cloudSettings && cloudSettings.length > 0) {
        setOfficeSettings(cloudSettings[0]);
      }
    } catch (err) {
      console.warn('Erro ao carregar dados remotos do escritorio:', err);
    }
  }, []);


  // Hidratacao e sincronizacao inicial a partir do Supabase com isolamento estrito
  // CRÍTICO: quando o escritorio_id muda (troca de conta), limpa estado IMEDIATAMENTE
  // para evitar que dados do escritório anterior apareçam mesmo por um frame.
  const prevEscritorioIdRef = useRef(currentUser?.escritorio_id || null);

  useEffect(() => {
    const targetEscritorioId = currentUser?.escritorio_id || null;
    const previousId = prevEscritorioIdRef.current;
    const tenantChanged = previousId !== targetEscritorioId;
    prevEscritorioIdRef.current = targetEscritorioId;

    // ── LIMPEZA SÍNCRONA FORA DA ASYNC ──────────────────────────────────────
    // Executada ANTES de chamar loadCloudData(), garantindo que o React aplique
    // os setStates em um único batch e NUNCA renderize dados cruzados entre tenants.
    if (!targetEscritorioId) {
      // Logout: limpar tudo agora, na mesma microtask do useEffect
      isSyncReadyRef.current = false;
      setInitialSupabaseSyncDone(false);
      setCurrentEscritorioIdState(null);
      setLeads([]);
      setClients([]);
      setContracts([]);
      setProposals([]);
      setProcesses([]);
      setTasks([]);
      setAppointments([]);
      setAttendances([]);
      setInstallments([]);
      setDocuments([]);
      setEscritorios([]);
      setActivityLogs([]);
      setNotifications([]);
      setOfficeSettings({ ...INITIAL_OFFICE_SETTINGS });
      return; // Não há dados para carregar — encerra aqui
    }

    // SEMPRE que o tenant muda (inclusive de null→ID no login), resetar o sync
    // para garantir que a tela de carregamento apareça e dados antigos sejam purgados.
    if (tenantChanged) {
      isSyncReadyRef.current = false;
      setInitialSupabaseSyncDone(false);
    }

    if (tenantChanged && previousId !== null) {
      // Troca entre dois tenants válidos: zeramos dados do tenant anterior AGORA
      setLeads([]);
      setClients([]);
      setContracts([]);
      setProposals([]);
      setProcesses([]);
      setTasks([]);
      setAppointments([]);
      setAttendances([]);
      setInstallments([]);
      setDocuments([]);
      setEscritorios([]);
      setActivityLogs([]);
      setNotifications([]);
      setOfficeSettings({ ...INITIAL_OFFICE_SETTINGS, officeName: currentUser?.firmName || 'Meu Escritório' });
    }

    // Definir o tenant ativo antes do carregamento assíncrono
    storageService.setCurrentEscritorioId(targetEscritorioId);
    setCurrentEscritorioIdState(targetEscritorioId);
    storageService.purgeContaminatedCache(targetEscritorioId);

    async function loadCloudData() {

      // PASSO 2: Carregamento local (cache do tenant correto)
      const localLeads = storageService.loadData('leads', [], targetEscritorioId);
      const localClients = storageService.loadData('clients', [], targetEscritorioId);
      const localContracts = storageService.loadData('contracts', [], targetEscritorioId);
      const localProposals = storageService.loadData('proposals', [], targetEscritorioId);
      const localProcesses = storageService.loadData('processes', [], targetEscritorioId);
      const localTasks = storageService.loadData('tasks', [], targetEscritorioId);
      const localAppointments = storageService.loadData('appointments', [], targetEscritorioId);
      const localAttendances = storageService.loadData('attendances', [], targetEscritorioId);
      const localInstallments = storageService.loadData('installments', [], targetEscritorioId);
      const localDocs = storageService.loadData('documents', [], targetEscritorioId);
      const localSettings = storageService.loadData('office_settings', null, targetEscritorioId);
      const localEscritorios = storageService.loadData('escritorios', [], targetEscritorioId);

      if (localLeads?.length) setLeads(localLeads);
      if (localClients?.length) setClients(localClients);
      if (localContracts?.length) setContracts(localContracts);
      if (localProposals?.length) setProposals(localProposals);
      if (localProcesses?.length) setProcesses(localProcesses);
      if (localTasks?.length) setTasks(localTasks);
      if (localAppointments?.length) setAppointments(localAppointments);
      if (localAttendances?.length) setAttendances(localAttendances);
      if (localInstallments?.length) setInstallments(localInstallments);
      if (localDocs?.length) setDocuments(localDocs);
      if (localSettings) setOfficeSettings(localSettings);
      if (localEscritorios?.length) setEscritorios(localEscritorios);

      // PASSO 3: Sync remoto com Supabase
      try {
        const cloudEscritorios = await storageService.fetchFromSupabase('escritorios', [], targetEscritorioId);
        if (cloudEscritorios && cloudEscritorios.length > 0) {
          setEscritorios(cloudEscritorios);
        } else if (!localEscritorios?.length) {
          setEscritorios([{
            id: targetEscritorioId,
            nome: currentUser?.firmName || 'Meu Escritório',
            status: 'active'
          }]);
        }

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
          storageService.recoverAndSyncLocalData('leads', [], targetEscritorioId),
          storageService.recoverAndSyncLocalData('clients', [], targetEscritorioId),
          storageService.recoverAndSyncLocalData('contracts', [], targetEscritorioId),
          storageService.recoverAndSyncLocalData('proposals', [], targetEscritorioId),
          storageService.recoverAndSyncLocalData('processes', [], targetEscritorioId),
          storageService.recoverAndSyncLocalData('tasks', [], targetEscritorioId),
          storageService.recoverAndSyncLocalData('appointments', [], targetEscritorioId),
          storageService.recoverAndSyncLocalData('attendances', [], targetEscritorioId),
          storageService.recoverAndSyncLocalData('installments', [], targetEscritorioId),
          storageService.recoverAndSyncLocalData('documents', [], targetEscritorioId),
          storageService.recoverAndSyncLocalData('office_settings', [], targetEscritorioId),
        ]);

        if (syncedLeads) setLeads(syncedLeads);
        if (syncedClients) setClients(syncedClients);
        if (syncedContracts) setContracts(syncedContracts);
        if (syncedProposals) setProposals(syncedProposals);
        if (syncedProcesses) setProcesses(syncedProcesses);
        if (syncedTasks) setTasks(syncedTasks);
        if (syncedAppointments) setAppointments(syncedAppointments);
        if (syncedAttendances) setAttendances(syncedAttendances);
        if (syncedInstallments) setInstallments(syncedInstallments);
        if (syncedDocs) setDocuments(syncedDocs);
        if (syncedOfficeSettings && syncedOfficeSettings.length > 0) {
          setOfficeSettings(syncedOfficeSettings[0]);
        }

        setSupabaseConnected(true);

        // --- AUTO-LINK UNIVERSAL: reconcilia contratos/parcelas sem clientId para TODOS os tenants ---
        // Aplicado de forma segura a qualquer escritório (não apenas legados), pois
        // os dados já foram filtrados por escritorio_id pelo RLS do Supabase.
        const allClients = syncedClients || [];
        let allContracts = syncedContracts || [];
        let contractsUpdated = false;

        allContracts = allContracts.map(c => {
          if (!c.clientId && c.clientName) {
            const matched = allClients.find(cl => cl.name?.trim().toLowerCase() === c.clientName?.trim().toLowerCase());
            if (matched) {
              contractsUpdated = true;
              return { ...c, clientId: matched.id };
            }
          }
          return c;
        });

        if (contractsUpdated) {
          setContracts(allContracts);
          storageService.saveData('contracts', allContracts, targetEscritorioId);
        }

        let allInstallments = syncedInstallments || [];
        let installmentsUpdated = false;

        allInstallments = allInstallments.map(i => {
          if (!i.clientId && i.clientName) {
            const matched = allClients.find(cl => cl.name?.trim().toLowerCase() === i.clientName?.trim().toLowerCase());
            if (matched) {
              installmentsUpdated = true;
              return { ...i, clientId: matched.id };
            }
          }
          return i;
        });

        if (installmentsUpdated) {
          setInstallments(allInstallments);
          storageService.saveData('installments', allInstallments, targetEscritorioId);
        }
        // --- FIM DO AUTO-LINK ---
      } catch (err) {
        console.warn('Erro no sync inicial do Supabase, operando com cache local:', err);
      } finally {
        setInitialSupabaseSyncDone(true);
        isSyncReadyRef.current = true;
      }
    }

    loadCloudData();
  }, [currentUser?.escritorio_id]);

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

        // Se for DELETE, remove imediatamente do state sem disparar refetch com race condition
        if (payload.eventType === 'DELETE') {
          const deletedId = payload.old?.id;
          if (deletedId) {
            storageService.markAsDeleted(deletedId);
            const setter = stateSettersRef.current[table];
            if (setter) {
              setter(prev => Array.isArray(prev) ? prev.filter(item => String(item.id) !== String(deletedId)) : prev);
            }
          }
          return;
        }

        const activeEscritorio = storageService.getCurrentEscritorioId();

        // ISOLAMENTO MULTI-TENANT ESTRITO EM TEMPO REAL:
        // Ignora sumariamente qualquer evento gerado por outro escritório
        const payloadEscritorio = payload.new?.escritorio_id || payload.old?.escritorio_id;
        if (payloadEscritorio && activeEscritorio && payloadEscritorio !== activeEscritorio) {
          return;
        }

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

  // Sync state to localStorage SOMENTE — o Supabase é atualizado diretamente e exclusivamente pelas actions CRUD.
  // Isso impede loops infinitos e garante que registros excluídos nunca sejam ressuscitados por cache local.
  const persistToLocal = useCallback((key, data) => {
    if (!isSyncReadyRef.current || !currentEscritorioId) return;
    try {
      storageService.saveData(key, data, currentEscritorioId);
    } catch (e) {
      console.error('Erro ao salvar ' + key + ' no localStorage:', e);
    }
  }, [currentEscritorioId]);

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
    const now = Date.now();
    const contractNumber = contractData.contractNumber || contractData.contract_number || `CTR-2026/${String(now).slice(-4)}`;

    // Auto-associação com cliente existente caso o clientId não tenha sido passado
    let finalClientId = contractData.clientId || contractData.client_id || null;
    let finalClientName = contractData.clientName || contractData.client_name || 'Cliente';
    if (!finalClientId && finalClientName) {
      const matched = clients.find(cl => cl.name?.trim().toLowerCase() === finalClientName.trim().toLowerCase());
      if (matched) {
        finalClientId = matched.id;
        finalClientName = matched.name;
      }
    }

    const newContract = {
      ...contractData,
      id: contractData.id || `cnt_${now}`,
      clientId: finalClientId,
      clientName: finalClientName,
      escritorio_id: currentEscritorioId,
      contractNumber,
      status: contractData.status || 'draft',
      value: Number(contractData.value) || 0,
      createdDate: contractData.createdDate || new Date().toISOString().split('T')[0],
    };
    setContracts(prev => {
      const next = [newContract, ...prev.filter(c => String(c.id) !== String(newContract.id))];
      storageService.saveData('contracts', next);
      return next;
    });
    storageService.saveToSupabase('contracts', [newContract]);

    // Replicar anexos do contrato na coleção documents (GED Jurídico e Acervo do Cliente)
    const newAtts = Array.isArray(newContract.attachments) ? newContract.attachments : [];
    if (newAtts.length > 0) {
      const generatedDocs = newAtts.map(att => ({
        id: `doc_${newContract.id}_${att.id || Math.random().toString(36).substr(2, 6)}`,
        title: att.name || 'Documento Anexado',
        clientId: finalClientId,
        clientName: finalClientName,
        category: att.category || (att.name?.toLowerCase().includes('procur') ? 'Procuração' : 'Contratos'),
        fileName: att.name || 'documento.pdf',
        fileSize: typeof att.size === 'number' ? formatFileSize(att.size) : (att.size || '1.0 MB'),
        uploadedBy: 'Dra. Tatiane Camargo',
        uploadedAt: att.uploadedAt || new Date().toISOString(),
        escritorio_id: currentEscritorioId,
      }));
      setDocuments(prev => {
        const next = [...generatedDocs, ...prev];
        storageService.saveData('documents', next);
        return next;
      });
      storageService.saveToSupabase('documents', generatedDocs);
    }

    // Gerar parcelas automaticamente se o contrato tiver valor e número de parcelas
    const contractValue = Number(newContract.value) || 0;
    const numInstallments = Number(newContract.installmentsCount || newContract.installments_count) || 1;
    if (contractValue > 0) {
      const installmentValue = contractValue / numInstallments;
      const generatedInstallments = [];
      for (let i = 0; i < numInstallments; i++) {
        const dueDate = new Date();
        dueDate.setMonth(dueDate.getMonth() + i);
        generatedInstallments.push({
          id: `inst_${now}_${i + 1}`,
          escritorio_id: currentEscritorioId,
          contractId: newContract.id,
          clientId: finalClientId,
          clientName: finalClientName,
          installmentNumber: i + 1,
          totalInstallments: numInstallments,
          value: installmentValue,
          amount: installmentValue,
          dueDate: dueDate.toISOString().split('T')[0],
          status: 'pending',
          paymentMethod: newContract.paymentMethod || newContract.payment_method || 'PIX',
        });
      }
      if (generatedInstallments.length > 0) {
        setInstallments(prev => {
          const next = [...generatedInstallments, ...prev];
          storageService.saveData('installments', next);
          return next;
        });
        storageService.saveToSupabase('installments', generatedInstallments);
      }
    }

    // Atualizar totalContracted do cliente
    if (finalClientId) {
      setClients(prev => {
        const next = prev.map(cl => {
          if (String(cl.id) === String(finalClientId)) {
            const newTotal = (Number(cl.totalContracted || cl.total_contracted) || 0) + contractValue;
            const updated = { ...cl, totalContracted: newTotal, total_contracted: newTotal };
            storageService.saveToSupabase('clients', [updated]);
            return updated;
          }
          return cl;
        });
        storageService.saveData('clients', next);
        return next;
      });
    }

    logActivity('Novo Contrato', newContract.title, `Cliente: ${newContract.clientName} | Valor: R$ ${contractValue.toLocaleString('pt-BR')}`);
    showToast('Contrato gerado com sucesso!');
    return newContract;
  };

  const updateContract = (id, contractData) => {
    let updatedContract = null;
    const strId = String(id);
    setContracts(prev => {
      const next = prev.map(c => {
        if (String(c.id) === strId) {
          updatedContract = { ...c, ...contractData, escritorio_id: currentEscritorioId };
          return updatedContract;
        }
        return c;
      });
      storageService.saveData('contracts', next);
      return next;
    });

    if (updatedContract) {
      // Salva contrato no Supabase (com anexos devidamente sanitizados contra payload gigante)
      storageService.saveToSupabase('contracts', [updatedContract]);

      // 1. Replicar anexos do contrato na coleção documents (GED Jurídico e Acervo do Cliente)
      const currentAtts = Array.isArray(updatedContract.attachments) ? updatedContract.attachments : [];
      if (currentAtts.length > 0) {
        const generatedDocs = [];
        currentAtts.forEach(att => {
          const docId = `doc_${strId}_${att.id || att.name}`;
          const alreadyExists = documents.some(d => String(d.id) === docId || (d.title === att.name && String(d.clientId) === String(updatedContract.clientId)));
          if (!alreadyExists) {
            generatedDocs.push({
              id: docId,
              title: att.name || 'Documento Anexado',
              clientId: updatedContract.clientId || updatedContract.client_id || null,
              clientName: updatedContract.clientName || updatedContract.client_name || 'Cliente',
              category: att.category || (att.name?.toLowerCase().includes('procur') ? 'Procuração' : 'Contratos'),
              fileName: att.name || 'documento.pdf',
              fileSize: typeof att.size === 'number' ? formatFileSize(att.size) : (att.size || '1.0 MB'),
              uploadedBy: 'Dra. Tatiane Camargo',
              uploadedAt: att.uploadedAt || new Date().toISOString(),
              escritorio_id: currentEscritorioId,
            });
          }
        });
        if (generatedDocs.length > 0) {
          setDocuments(prev => {
            const next = [...generatedDocs, ...prev];
            storageService.saveData('documents', next);
            return next;
          });
          storageService.saveToSupabase('documents', generatedDocs);
        }
      }

      // 2. Recálculo e sincronização automática das parcelas financeiras
      const contractValue = Number(updatedContract.value) || 0;
      const numInstallments = Number(updatedContract.installmentsCount || updatedContract.installments_count) || 1;
      const existingInsts = installments.filter(i => String(i.contractId || i.contract_id) === strId);
      const now = Date.now();

      if (contractValue > 0) {
        if (existingInsts.length === 0) {
          // Cenário A: Ainda não tinha parcelas
          const installmentValue = contractValue / numInstallments;
          const generatedInstallments = [];
          for (let i = 0; i < numInstallments; i++) {
            const dueDate = new Date(updatedContract.createdDate || updatedContract.created_date || now);
            dueDate.setMonth(dueDate.getMonth() + i);
            generatedInstallments.push({
              id: `inst_${now}_${i + 1}`,
              escritorio_id: currentEscritorioId,
              contractId: strId,
              clientId: updatedContract.clientId || updatedContract.client_id || null,
              clientName: updatedContract.clientName || updatedContract.client_name || 'Cliente',
              installmentNumber: i + 1,
              totalInstallments: numInstallments,
              value: installmentValue,
              amount: installmentValue,
              dueDate: dueDate.toISOString().split('T')[0],
              status: 'pending',
              paymentMethod: updatedContract.paymentMethod || updatedContract.payment_method || 'PIX',
            });
          }
          if (generatedInstallments.length > 0) {
            setInstallments(prev => {
              const next = [...generatedInstallments, ...prev];
              storageService.saveData('installments', next);
              return next;
            });
            storageService.saveToSupabase('installments', generatedInstallments);
          }
        } else {
          // Cenário B: JÁ existiam parcelas (ex: parcela inicial de teste ou proposta aceita)
          const paidInsts = existingInsts.filter(i => i.status === 'paid');
          const pendingInsts = existingInsts.filter(i => i.status !== 'paid');
          let changedInsts = [];

          if (paidInsts.length === 0) {
            // Nenhuma parcela paga ainda: rateia o valor total entre todas as parcelas pendentes existentes
            const count = pendingInsts.length > 0 ? pendingInsts.length : numInstallments;
            const eachVal = contractValue / count;
            changedInsts = existingInsts.map((inst, idx) => ({
              ...inst,
              value: eachVal,
              amount: eachVal,
              totalInstallments: count,
              installmentNumber: idx + 1,
              clientName: updatedContract.clientName || inst.clientName,
              clientId: updatedContract.clientId || inst.clientId,
            }));
          } else {
            // Havia parcela paga: recalcular o saldo restante
            const paidSum = paidInsts.reduce((acc, i) => acc + (Number(i.value || i.amount) || 0), 0);
            const remaining = Math.max(0, contractValue - paidSum);

            if (pendingInsts.length > 0 && remaining > 0) {
              const eachPending = remaining / pendingInsts.length;
              changedInsts = pendingInsts.map(inst => ({
                ...inst,
                value: eachPending,
                amount: eachPending,
                clientName: updatedContract.clientName || inst.clientName,
                clientId: updatedContract.clientId || inst.clientId,
              }));
            } else if (remaining > 0 && pendingInsts.length === 0) {
              // Se só existia a parcela inicial (que estava como paga) e o novo contrato é maior, gera nova parcela com o saldo
              const newBalInst = {
                id: `inst_${now}_bal`,
                escritorio_id: currentEscritorioId,
                contractId: strId,
                clientId: updatedContract.clientId || updatedContract.client_id || null,
                clientName: updatedContract.clientName || updatedContract.client_name || 'Cliente',
                installmentNumber: paidInsts.length + 1,
                totalInstallments: paidInsts.length + 1,
                value: remaining,
                amount: remaining,
                dueDate: new Date(now + 30 * 86400000).toISOString().split('T')[0],
                status: 'pending',
                paymentMethod: updatedContract.paymentMethod || updatedContract.payment_method || 'PIX',
              };
              changedInsts = [newBalInst];
            }
          }

          if (changedInsts.length > 0) {
            setInstallments(prev => {
              const mapChanged = new Map(changedInsts.map(i => [String(i.id), i]));
              let next = prev.map(inst => mapChanged.has(String(inst.id)) ? mapChanged.get(String(inst.id)) : inst);
              changedInsts.forEach(ci => {
                if (!next.some(ex => String(ex.id) === String(ci.id))) {
                  next = [ci, ...next];
                }
              });
              storageService.saveData('installments', next);
              return next;
            });
            storageService.saveToSupabase('installments', changedInsts);
          }
        }
      }

      // 3. Atualizar métricas financeiras do cliente
      const cId = updatedContract.clientId || updatedContract.client_id;
      if (cId) {
        setClients(prevClients => {
          const nextClients = prevClients.map(cl => {
            if (String(cl.id) === String(cId)) {
              // Soma de todos os contratos vigentes deste cliente
              const clientContractsList = contracts
                .map(c => String(c.id) === strId ? updatedContract : c)
                .filter(c => String(c.clientId || c.client_id) === String(cId));
              const totalContractedSum = clientContractsList.reduce((acc, c) => acc + (Number(c.value) || 0), 0);
              const upd = { ...cl, totalContracted: totalContractedSum, total_contracted: totalContractedSum };
              storageService.saveToSupabase('clients', [upd]);
              return upd;
            }
            return cl;
          });
          storageService.saveData('clients', nextClients);
          return nextClients;
        });
      }
    }
    logActivity('Contrato Atualizado', contractData.title || id, `Status: ${contractData.status} | Valor: R$ ${(Number(contractData.value) || 0).toLocaleString('pt-BR')}`);
    showToast('Contrato atualizado com sucesso!');
  };

  const deleteContract = (id) => {
    const strId = String(id);
    const contractToDelete = contracts.find(c => String(c.id) === strId);
    storageService.markAsDeleted(strId);
    setContracts(prev => {
      const next = prev.filter(c => 
        String(c.id) !== strId && 
        String(c.contractNumber) !== strId && 
        String(c.contract_number) !== strId
      );
      storageService.saveData('contracts', next);
      return next;
    });
    storageService.deleteFromSupabase('contracts', strId);

    // Limpar anexos do contrato do IndexedDB
    if (contractToDelete && Array.isArray(contractToDelete.attachments)) {
      contractToDelete.attachments.forEach(att => {
        if (att?.id) deleteFileFromIndexedDB(att.id);
      });
    }

    // Remover documentos do GED vinculados a este contrato
    setDocuments(prev => {
      const next = prev.filter(d => !String(d.id).includes(strId));
      storageService.saveData('documents', next);
      return next;
    });
    supabase.from('documents').delete().like('id', `%${strId}%`).catch(() => {});

    // Também remove as parcelas vinculadas ao contrato apagado (localmente e nuvem)
    setInstallments(prev => {
      const next = prev.filter(i => String(i.contractId || i.contract_id) !== strId);
      storageService.saveData('installments', next);
      return next;
    });
    supabase.from('installments').delete().eq('contract_id', strId).catch(() => {});

    // Recalcular totalContracted do cliente
    if (contractToDelete && (contractToDelete.clientId || contractToDelete.client_id)) {
      const cId = contractToDelete.clientId || contractToDelete.client_id;
      setClients(prevClients => {
        const nextClients = prevClients.map(cl => {
          if (String(cl.id) === String(cId)) {
            const remainingContracts = contracts.filter(c => String(c.id) !== strId && String(c.clientId || c.client_id) === String(cId));
            const newTotalContracted = remainingContracts.reduce((acc, c) => acc + (Number(c.value) || 0), 0);
            const upd = { ...cl, totalContracted: newTotalContracted, total_contracted: newTotalContracted };
            storageService.saveToSupabase('clients', [upd]);
            return upd;
          }
          return cl;
        });
        storageService.saveData('clients', nextClients);
        return nextClients;
      });
    }

    showToast('Contrato excluído com sucesso.');
  };

  const closeContractWorkflow = (leadIdOrPayload, maybeContractData, maybeInstallmentsList = []) => {
    triggerConfetti();

    let leadId = null;
    let contractData = {};
    let clientData = null;
    let customInstallments = [];

    if (leadIdOrPayload && typeof leadIdOrPayload === 'object') {
      leadId = leadIdOrPayload.leadId;
      clientData = leadIdOrPayload.clientData || {};
      const val = Number(leadIdOrPayload.contractValue || leadIdOrPayload.value) || 0;
      const instCount = Number(leadIdOrPayload.installmentsCount) || 1;
      contractData = {
        title: leadIdOrPayload.serviceDescription ? `Contrato - ${leadIdOrPayload.serviceDescription.substring(0, 35)}...` : 'Contrato de Prestação de Serviços Advocatícios',
        value: val,
        serviceDescription: leadIdOrPayload.serviceDescription || '',
        paymentMethod: leadIdOrPayload.paymentMethod || 'Parcelado (Boleto / PIX)',
        installmentsCount: instCount,
        installmentValue: val / instCount,
        responsibleLawyerId: leadIdOrPayload.responsibleLawyerId || 'usr_2',
        signedDate: leadIdOrPayload.signedDate || new Date().toISOString().split('T')[0],
        observations: leadIdOrPayload.observations || '',
        status: 'assinado',
        clientId: clientData.id || null,
        clientName: clientData.name || '',
      };
      customInstallments = Array.isArray(leadIdOrPayload.installments) ? leadIdOrPayload.installments : [];
    } else {
      leadId = leadIdOrPayload;
      contractData = maybeContractData || {};
      customInstallments = maybeInstallmentsList || [];
    }

    // 1. Criar ou buscar cliente
    let client = clients.find(c => (contractData.clientId && c.id === contractData.clientId) || (leadId && c.leadId === leadId) || (clientData?.name && c.name === clientData.name));
    if (!client) {
      const lead = leadId ? leads.find(l => l.id === leadId) : null;
      const clientName = clientData?.name || lead?.name || contractData.clientName || 'Cliente';
      client = {
        id: clientData?.id || `cli_${Date.now()}`,
        escritorio_id: currentEscritorioId,
        name: clientName,
        cpf: clientData?.cpf || lead?.cpf || '',
        email: clientData?.email || lead?.email || '',
        phone: clientData?.phone || lead?.phone || '',
        whatsapp: clientData?.whatsapp || lead?.whatsapp || lead?.phone || '',
        city: clientData?.city || lead?.city || '',
        state: clientData?.state || lead?.state || '',
        legalArea: clientData?.legalArea || lead?.legalArea || contractData.legalArea || 'civil',
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

    // 2. Criar contrato
    const now = Date.now();
    const contractValue = Number(contractData.value) || 0;
    const numInstallments = Number(contractData.installmentsCount) || 1;
    const contractNumber = contractData.contractNumber || contractData.contract_number || `CTR-2026/${String(now).slice(-4)}`;
    const contract = {
      ...contractData,
      id: contractData.id || `cnt_${now}`,
      escritorio_id: currentEscritorioId,
      contractNumber,
      clientId: client.id,
      clientName: client.name,
      status: 'assinado',
      value: contractValue,
      installmentsCount: numInstallments,
      installmentValue: contractValue / numInstallments,
      signedDate: contractData.signedDate || new Date().toISOString().split('T')[0],
      createdDate: contractData.createdDate || new Date().toISOString().split('T')[0],
    };
    setContracts(prev => {
      const next = [contract, ...prev];
      storageService.saveData('contracts', next);
      return next;
    });
    storageService.saveToSupabase('contracts', [contract]);

    // 3. Gerar parcelas no financeiro
    let installmentsToSave = [];
    if (customInstallments.length > 0) {
      installmentsToSave = customInstallments.map((inst, i) => ({
        ...inst,
        id: inst.id || `inst_${now}_${i + 1}`,
        contractId: contract.id,
        clientId: client.id,
        clientName: client.name,
        escritorio_id: currentEscritorioId,
      }));
    } else if (contractValue > 0) {
      const installmentValue = contractValue / numInstallments;
      for (let i = 0; i < numInstallments; i++) {
        const dueDate = new Date();
        dueDate.setMonth(dueDate.getMonth() + i);
        installmentsToSave.push({
          id: `inst_${now}_${i + 1}`,
          escritorio_id: currentEscritorioId,
          contractId: contract.id,
          clientId: client.id,
          clientName: client.name,
          installmentNumber: i + 1,
          totalInstallments: numInstallments,
          value: installmentValue,
          amount: installmentValue,
          dueDate: dueDate.toISOString().split('T')[0],
          status: 'pending',
          paymentMethod: contract.paymentMethod || 'PIX',
        });
      }
    }

    if (installmentsToSave.length > 0) {
      setInstallments(prev => {
        const next = [...installmentsToSave, ...prev];
        storageService.saveData('installments', next);
        return next;
      });
      storageService.saveToSupabase('installments', installmentsToSave);
    }

    // 4. Mover lead para contrato_assinado se leadId existir
    if (leadId) {
      moveLeadStage(leadId, 'contrato_assinado');
    }

    logActivity('Fechamento de Negócio', contract.title, `Cliente: ${contract.clientName} | Valor: R$ ${contractValue.toLocaleString('pt-BR')}`);
    showToast('🎉 Negócio fechado com sucesso! Contrato, cliente e financeiro criados.');
    return contract;
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

    // Se proposta for criada com status 'aceita', gera automaticamente contrato e parcelas
    if (newProp.status === 'aceita' && (Number(newProp.value || newProp.feeValue) || 0) > 0) {
      addContract({
        title: newProp.title || newProp.serviceName || 'Contrato de Prestação de Serviços',
        clientId: newProp.clientId || null,
        clientName: newProp.clientName || newProp.leadName || 'Cliente',
        legalArea: newProp.legalArea || 'civil',
        value: Number(newProp.value || newProp.feeValue) || 0,
        installmentsCount: 1,
        status: 'assinado',
        serviceDescription: newProp.description || newProp.notes || 'Contrato formalizado a partir de proposta comercial aceita.',
      });
    }
    return newProp;
  };

  const updateProposal = (id, propData) => {
    let updatedProp = null;
    const strId = String(id);
    setProposals(prev => {
      const next = prev.map(p => {
        if (String(p.id) === strId) {
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

      // Se a proposta foi marcada como aceita, converte para contrato caso ainda não exista para esta proposta
      if (updatedProp.status === 'aceita') {
        const val = Number(updatedProp.value || updatedProp.feeValue) || 0;
        const targetContractId = `cnt_prop_${updatedProp.id}`;
        const existsContract = contracts.some(c => String(c.id) === targetContractId || String(c.proposalId) === String(updatedProp.id));
        if (val > 0 && !existsContract) {
          const matchedClient = clients.find(cl =>
            (updatedProp.clientId && String(cl.id) === String(updatedProp.clientId)) ||
            (cl.name && updatedProp.clientName && cl.name.trim().toLowerCase() === updatedProp.clientName.trim().toLowerCase())
          );

          addContract({
            id: targetContractId,
            proposalId: updatedProp.id,
            title: updatedProp.title || updatedProp.serviceName || 'Contrato de Prestação de Serviços',
            clientId: matchedClient ? matchedClient.id : (updatedProp.clientId || null),
            clientName: matchedClient ? matchedClient.name : (updatedProp.clientName || updatedProp.leadName || 'Cliente'),
            legalArea: updatedProp.legalArea || 'civil',
            value: val,
            installmentsCount: 1,
            status: 'assinado',
            serviceDescription: updatedProp.description || updatedProp.notes || 'Contrato formalizado a partir de proposta comercial aceita.',
          });
        }
      }
    }
    logActivity('Proposta Atualizada', propData.title || id, `Status: ${propData.status}`);
    showToast('Proposta atualizada!');
  };

  const deleteProposal = async (id, optionalProposalNumber = null) => {
    const strId = String(id || '');
    const strNumber = optionalProposalNumber ? String(optionalProposalNumber) : '';
    if (strId) storageService.markAsDeleted(strId);
    if (strNumber) storageService.markAsDeleted(strNumber);

    // Remove do estado React IMEDIATAMENTE de forma síncrona
    setProposals(prev => {
      const next = prev.filter(p => {
        const pId = String(p.id || '');
        const pNum = String(p.proposalNumber || p.proposal_number || '');
        if (strId && (pId === strId || pNum === strId)) return false;
        if (strNumber && (pId === strNumber || pNum === strNumber)) return false;
        return true;
      });
      storageService.saveData('proposals', next);
      return next;
    });

    // Expurgo assíncrono no Supabase (soft-delete seguro + tentativa de hard delete, com timeout não bloqueante)
    try {
      const ops = [];
      if (strId) {
        ops.push(supabase.from('proposals').update({ status: 'recusada', raw_data: { deleted: true, is_deleted: true } }).eq('id', strId));
        ops.push(supabase.from('proposals').delete().eq('id', strId));
        ops.push(storageService.deleteFromSupabase('proposals', strId));
      }
      if (strNumber && strNumber !== strId) {
        ops.push(supabase.from('proposals').update({ status: 'recusada', raw_data: { deleted: true, is_deleted: true } }).eq('proposal_number', strNumber));
        ops.push(supabase.from('proposals').delete().eq('proposal_number', strNumber));
        ops.push(storageService.deleteFromSupabase('proposals', strNumber));
      }
      // Timeout seguro de 3s para garantir que nunca congele a UI caso haja lock no Supabase
      await Promise.race([
        Promise.allSettled(ops),
        new Promise(resolve => setTimeout(resolve, 3000))
      ]);
    } catch (err) {
      console.warn('Operação no Supabase (não bloqueante):', err);
    }
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

  const updateAttendance = (id, updatedFields) => {
    let updatedAtt = null;
    setAttendances(prev => {
      const next = prev.map(a => {
        if (String(a.id) === String(id)) {
          updatedAtt = {
            ...a,
            ...updatedFields,
            id: a.id,
            escritorio_id: a.escritorio_id || currentEscritorioId,
          };
          return updatedAtt;
        }
        return a;
      });
      storageService.saveData('attendances', next);
      return next;
    });

    if (updatedAtt) {
      storageService.saveToSupabase('attendances', [updatedAtt]);
      logActivity('Atendimento Atualizado', updatedAtt.clientName || 'Cliente', `Assunto: ${updatedAtt.subject || ''}`);
      showToast('Atendimento atualizado com sucesso!');
    }
    return true;
  };

  const deleteAttendance = (id) => {
    let removedAtt = null;
    setAttendances(prev => {
      const target = prev.find(a => String(a.id) === String(id));
      if (target) removedAtt = target;
      const next = prev.filter(a => String(a.id) !== String(id));
      storageService.saveData('attendances', next);
      return next;
    });

    storageService.deleteFromSupabase('attendances', id);
    if (removedAtt) {
      logActivity('Atendimento Excluído', removedAtt.clientName || 'Cliente', `Assunto: ${removedAtt.subject || ''}`);
    }
    showToast('Atendimento excluído com sucesso.');
    return true;
  };

  // --- FINANCIAL ACTIONS ---
  const markInstallmentPaid = (installmentId) => {
    let paidInst = null;
    const today = new Date().toISOString().split('T')[0];

    setInstallments(prev => {
      const next = prev.map(inst => {
        if (String(inst.id) === String(installmentId)) {
          paidInst = {
            ...inst,
            status: 'paid',
            paidDate: today,
            paid_date: today,
            paymentDate: today,
            payment_date: today,
            escritorio_id: inst.escritorio_id || currentEscritorioId,
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

      const instAmount = Number(paidInst.amount || paidInst.value) || 0;
      // Atualiza o total liquidado do cliente se houver cliente vinculado
      if (instAmount > 0) {
        setClients(prev => {
          const next = prev.map(c => {
            const isMatch = (paidInst.clientId && String(c.id) === String(paidInst.clientId)) ||
              (paidInst.clientName && c.name?.trim().toLowerCase() === paidInst.clientName?.trim().toLowerCase());
            if (isMatch) {
              const updatedTotalPaid = (Number(c.totalPaid || c.total_paid) || 0) + instAmount;
              const updatedClient = {
                ...c,
                totalPaid: updatedTotalPaid,
                total_paid: updatedTotalPaid,
              };
              storageService.saveToSupabase('clients', [updatedClient]);
              return updatedClient;
            }
            return c;
          });
          storageService.saveData('clients', next);
          return next;
        });
      }

      logActivity('Baixa de Parcela', paidInst.clientName || 'Cliente', `Parcela de R$ ${instAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} liquidada com sucesso.`);
    }

    try {
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
    } catch (_) {}

    showToast('Parcela marcada como paga! 💰', 'success');
  };

  const unmarkInstallmentPaid = (installmentId) => {
    let revertedInst = null;
    
    setInstallments(prev => {
      const next = prev.map(inst => {
        if (String(inst.id) === String(installmentId) && inst.status === 'paid') {
          revertedInst = {
            ...inst,
            status: 'pending',
            paidDate: null,
            paid_date: null,
            paymentDate: null,
            payment_date: null,
          };
          return revertedInst;
        }
        return inst;
      });
      storageService.saveData('installments', next);
      return next;
    });

    if (revertedInst) {
      storageService.saveToSupabase('installments', [revertedInst]);

      const instAmount = Number(revertedInst.amount || revertedInst.value) || 0;
      if (instAmount > 0) {
        setClients(prev => {
          const next = prev.map(c => {
            const isMatch = (revertedInst.clientId && String(c.id) === String(revertedInst.clientId)) ||
              (revertedInst.clientName && c.name?.trim().toLowerCase() === revertedInst.clientName?.trim().toLowerCase());
            if (isMatch) {
              const updatedTotalPaid = Math.max(0, (Number(c.totalPaid || c.total_paid) || 0) - instAmount);
              const updatedClient = {
                ...c,
                totalPaid: updatedTotalPaid,
                total_paid: updatedTotalPaid,
              };
              storageService.saveToSupabase('clients', [updatedClient]);
              return updatedClient;
            }
            return c;
          });
          storageService.saveData('clients', next);
          return next;
        });
      }

      logActivity('Estorno de Parcela', revertedInst.clientName || 'Cliente', `Parcela de R$ ${instAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} estornada para pendente.`);
      showToast('Baixa cancelada. Parcela voltou a ficar pendente.');
    }
  };

  const deleteInstallment = (installmentId) => {
    const deletedInst = installments.find(i => String(i.id) === String(installmentId));
    
    if (deletedInst) {
      setInstallments(prev => {
        const next = prev.filter(i => String(i.id) !== String(installmentId));
        storageService.saveData('installments', next);
        return next;
      });

      storageService.deleteFromSupabase('installments', deletedInst.id);
      
      const instAmount = Number(deletedInst.amount || deletedInst.value) || 0;
      if (deletedInst.status === 'paid' && instAmount > 0) {
        setClients(prev => {
          const next = prev.map(c => {
            const isMatch = (deletedInst.clientId && String(c.id) === String(deletedInst.clientId)) ||
              (deletedInst.clientName && c.name?.trim().toLowerCase() === deletedInst.clientName?.trim().toLowerCase());
            if (isMatch) {
              const updatedTotalPaid = Math.max(0, (Number(c.totalPaid || c.total_paid) || 0) - instAmount);
              const updatedClient = {
                ...c,
                totalPaid: updatedTotalPaid,
                total_paid: updatedTotalPaid,
              };
              storageService.saveToSupabase('clients', [updatedClient]);
              return updatedClient;
            }
            return c;
          });
          storageService.saveData('clients', next);
          return next;
        });
      }

      logActivity('Exclusão de Parcela', deletedInst.clientName || 'Cliente', `Parcela no valor de R$ ${instAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} excluída.`);
      showToast('Parcela excluída com sucesso!');
    }
  };

  const updateInstallment = (installmentId, updates) => {
    let updatedInst = null;
    let oldInst = null;
    setInstallments(prev => {
      const next = prev.map(inst => {
        if (String(inst.id) === String(installmentId)) {
          oldInst = { ...inst };
          updatedInst = { ...inst, ...updates, updatedAt: new Date().toISOString() };
          return updatedInst;
        }
        return inst;
      });
      storageService.saveData('installments', next);
      return next;
    });

    if (updatedInst) {
      storageService.saveToSupabase('installments', [updatedInst]);

      // Handle totalPaid recalculation if status or amount changed and it was paid or became paid
      const oldStatus = oldInst.status;
      const newStatus = updatedInst.status;
      const oldAmount = Number(oldInst.amount || oldInst.value) || 0;
      const newAmount = Number(updatedInst.amount || updatedInst.value) || 0;

      let valueDiff = 0;
      if (oldStatus === 'paid' && newStatus === 'paid') {
        valueDiff = newAmount - oldAmount; // if they changed the amount while paid
      } else if (oldStatus !== 'paid' && newStatus === 'paid') {
        valueDiff = newAmount; // it became paid
      } else if (oldStatus === 'paid' && newStatus !== 'paid') {
        valueDiff = -oldAmount; // it was unpaid
      }

      if (valueDiff !== 0) {
        setClients(prev => {
          const next = prev.map(c => {
            const isMatch = (updatedInst.clientId && String(c.id) === String(updatedInst.clientId)) ||
              (updatedInst.clientName && c.name?.trim().toLowerCase() === updatedInst.clientName?.trim().toLowerCase());
            if (isMatch) {
              const updatedTotalPaid = Math.max(0, (Number(c.totalPaid || c.total_paid) || 0) + valueDiff);
              const updatedClient = {
                ...c,
                totalPaid: updatedTotalPaid,
                total_paid: updatedTotalPaid,
              };
              storageService.saveToSupabase('clients', [updatedClient]);
              return updatedClient;
            }
            return c;
          });
          storageService.saveData('clients', next);
          return next;
        });
      }

      logActivity('Atualização de Parcela', updatedInst.clientName || 'Cliente', 'Dados da parcela/recibo atualizados.');
      showToast('Parcela/Recibo atualizado com sucesso!');
    }
  };

  // --- DOCUMENTS ACTIONS ---
  const addDocument = (docData) => {
    const newDoc = {
      ...docData,
      id: docData.id || `doc_${Date.now()}`,
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
    const cleanId = String(id);
    let docToRemove = null;

    setDocuments(prev => {
      docToRemove = prev.find(d => String(d.id) === cleanId);
      const next = prev.filter(d => String(d.id) !== cleanId);
      storageService.saveData('documents', next);
      return next;
    });

    // Exclui do IndexedDB
    deleteFileFromIndexedDB(cleanId);

    // Exclui do Supabase
    storageService.deleteFromSupabase('documents', cleanId);

    // Se o documento pertencia a anexos de contratos, remove também do contrato para não ressuscitar
    if (docToRemove) {
      setContracts(prev => {
        let contractChanged = false;
        const next = prev.map(c => {
          if (Array.isArray(c.attachments) && c.attachments.length > 0) {
            const filteredAtts = c.attachments.filter(att => 
              String(att.id) !== cleanId && 
              att.name !== docToRemove.fileName && 
              att.name !== docToRemove.title &&
              `doc_${c.id}_${att.id}` !== cleanId &&
              `doc_${c.id}_${att.name}` !== cleanId
            );
            if (filteredAtts.length !== c.attachments.length) {
              contractChanged = true;
              const updatedContract = { ...c, attachments: filteredAtts };
              storageService.saveToSupabase('contracts', [updatedContract]);
              return updatedContract;
            }
          }
          return c;
        });
        if (contractChanged) {
          storageService.saveData('contracts', next);
        }
        return next;
      });
    }

    logActivity('Exclusão de Documento', docToRemove?.title || 'Documento', 'Documento removido do acervo.');
    showToast('Documento excluído com sucesso!', 'success');
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
        updateAttendance,
        deleteAttendance,
        markInstallmentPaid,
        unmarkInstallmentPaid,
        deleteInstallment,
        updateInstallment,
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
