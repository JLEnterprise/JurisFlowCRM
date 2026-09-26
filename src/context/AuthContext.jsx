import React, { createContext, useContext, useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { INITIAL_USERS } from '../data/initialData';
import { signIn, signUp, signOut, resetPasswordForEmail, getSession, onAuthStateChange, supabase, openedFromRecoveryLink } from '../lib/supabase';
import { permissionsForRoles } from '../utils/accessLevels';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [users, setUsers] = useState(() => {
    const loaded = storageService.loadData('users', INITIAL_USERS);
    if (!Array.isArray(loaded)) return [];
    // remove senhas que versões antigas deixavam salvas no navegador
    return loaded.map(u => {
      if (!u || typeof u !== 'object') return u;
      const { password, senha, ...rest } = u;
      return rest;
    });
  });

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = storageService.loadData('current_user', null);
    if (!saved || typeof saved !== 'object') return saved;
    const { password, senha, ...rest } = saved;
    return rest;
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const saved = storageService.loadData('current_user', null);
    return !!saved;
  });

  const [authError, setAuthError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // true quando o usuário chega pelo link "Esqueceu a senha" do e-mail
  // Tabela de níveis de acesso do escritório (vem de office_settings, carregada pelo CRMContext)
  const [roleMatrix, setRoleMatrix] = useState(null);
  // Filial aberta pelo dono (null = o próprio escritório): a lista da equipe acompanha
  const [teamOfficeId, setTeamOfficeId] = useState(null);

  // Aberto pelo link de redefinição de senha: já começa pedindo a nova senha
  const [passwordRecovery, setPasswordRecovery] = useState(openedFromRecoveryLink);

  // Remove qualquer sessão local (localStorage) — o acesso depende SEMPRE do Supabase Auth
  function clearLocalSession() {
    storageService.saveData('current_user', null);
    storageService.setCurrentEscritorioId(null);
    setCurrentUser(null);
    setIsAuthenticated(false);
    setUsers([]);
  }

  // Remove campos sensíveis antes de salvar/sincronizar
  function stripSecrets(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    const { password, senha, ...rest } = obj;
    return rest;
  }

  // Escutar mudancas de sessao no Supabase e carregar perfil completo
  useEffect(() => {
    let mounted = true;

    async function checkInitialSession() {
      try {
        const session = await getSession();
        if (session?.user && mounted) {
          const email = session.user.email?.toLowerCase();
          
          let remoteUser = null;
          try {
            const { data } = await supabase.from('users').select('*').eq('email', email).maybeSingle();
            if (data) {
              const raw = (data.raw_data && typeof data.raw_data === 'object') ? data.raw_data : {};
              const rawRoles = Array.isArray(data.roles) ? data.roles : (Array.isArray(raw.roles) ? raw.roles : null);
              const singleRole = data.role || raw.role || 'admin';
              const assignedRoles = rawRoles && rawRoles.length > 0 ? rawRoles : [singleRole];
              const primaryRole = assignedRoles.includes('dev') ? 'dev' : (assignedRoles.includes('admin') ? 'admin' : singleRole);
              const singleTitle = data.title || raw.title || 'Advogado(a)';
              const assignedTitles = Array.isArray(data.titles) ? data.titles : (Array.isArray(raw.titles) ? raw.titles : [singleTitle]);

              const userEscritorioId = data.escritorio_id || null;

              remoteUser = {
                id: data.id || session.user.id,
                name: data.name || raw.name || email.split('@')[0],
                email: email,
                role: primaryRole,
                roles: assignedRoles,
                title: singleTitle,
                titles: assignedTitles,
                oab: data.oab || raw.oab || '',
                phone: data.phone || raw.phone || '',
                avatar: data.avatar || raw.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=256',
                status: data.status || 'active',
                escritorio_id: userEscritorioId
              };
            }
          } catch (err) {
            console.warn('Erro ao consultar perfil inicial no Supabase:', err.message);
          }

          // [Segurança] Só entra quem tem perfil vinculado a um escritório no banco
          const match = remoteUser;
          if (match && match.escritorio_id) {
            storageService.setCurrentEscritorioId(match.escritorio_id);
            storageService.purgeContaminatedCache(match.escritorio_id);
            setCurrentUser(match);
            setIsAuthenticated(true);
            storageService.saveData('current_user', match);
          } else if (mounted) {
            setAuthError('Seu acesso ainda não foi liberado. Peça ao administrador do escritório para cadastrar seu e-mail em Equipe.');
            clearLocalSession();
            signOut().catch(() => {});
          }
        } else if (mounted) {
          // [Segurança] Sem sessão válida no Supabase Auth = sem acesso (limpa sessão local antiga)
          clearLocalSession();
        }
      } catch (e) {
        console.warn('Sessao Supabase nao disponivel no inicio:', e.message);
      }
    }

    checkInitialSession();

    const { data: authListener } = onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === 'SIGNED_OUT') {
        clearLocalSession();
      }
      if (event === 'PASSWORD_RECOVERY') {
        setPasswordRecovery(true);
      }
    });

    return () => {
      mounted = false;
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    storageService.saveData('users', users);
  }, [users]);

  useEffect(() => {
    storageService.saveData('current_user', currentUser);
  }, [currentUser]);

  // Carregar usuários remotos na inicialização e sincronizar currentUser
  useEffect(() => {
    let mounted = true;
    async function loadCloudUsers() {
      try {
        // Filial aberta pelo dono: mostra a equipe daquela filial
        const ownEscId = currentUser?.escritorio_id || storageService.getCurrentEscritorioId();
        const currentEscId = teamOfficeId || ownEscId;
        if (!currentEscId) return;

        const cloudUsers = await storageService.fetchFromSupabase('users', [], currentEscId);
        if (mounted && teamOfficeId && teamOfficeId !== ownEscId) {
          setUsers((Array.isArray(cloudUsers) ? cloudUsers : []).filter(u => u.escritorio_id === teamOfficeId));
          return;
        }
        if (mounted && Array.isArray(cloudUsers) && cloudUsers.length > 0) {
          const tenantUsers = cloudUsers.filter(u => u.escritorio_id === currentEscId);
          setUsers(tenantUsers);

          // Atualizar currentUser se ele estiver presente nos usuários remotos com dados mais frescos
          const emailToMatch = (currentUser?.email || '').toLowerCase().trim();
          if (emailToMatch) {
            const match = tenantUsers.find(u => u.email?.toLowerCase() === emailToMatch);
            if (match) {
              const updated = { ...(currentUser || {}), ...match };
              setCurrentUser(updated);
              storageService.saveData('current_user', updated);
            }
          }
        }
      } catch (e) {
        console.warn('Erro ao carregar usuários remotos:', e);
      }
    }
    loadCloudUsers();
    return () => { mounted = false; };
  }, [currentUser?.escritorio_id, teamOfficeId]);

  // Sincronizar currentUser dinamicamente sempre que a lista global de users mudar
  useEffect(() => {
    if (currentUser?.email && users.length > 0) {
      const emailToMatch = currentUser.email.toLowerCase().trim();
      const match = users.find(u => u.email?.toLowerCase() === emailToMatch);
      if (match) {
        const hasDifferences =
          match.role !== currentUser.role ||
          match.name !== currentUser.name ||
          match.title !== currentUser.title ||
          match.avatar !== currentUser.avatar ||
          match.phone !== currentUser.phone ||
          match.oab !== currentUser.oab ||
          JSON.stringify(match.roles) !== JSON.stringify(currentUser.roles) ||
          JSON.stringify(match.titles) !== JSON.stringify(currentUser.titles);

        if (hasDifferences) {
          const merged = { ...currentUser, ...match };
          setCurrentUser(merged);
          storageService.saveData('current_user', merged);
        }
      }
    }
  }, [users]);

  // Escutar atualizações de Usuários e Permissões em TEMPO REAL no Supabase
  useEffect(() => {
    let mounted = true;

    const usersChannel = supabase.channel('realtime_users_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'users' },
        (payload) => {
          if (!mounted) return;
          if (payload.eventType === 'DELETE' && payload.old?.id) {
            setUsers(prev => {
              const updated = prev.filter(u => u.id !== payload.old.id);
              storageService.saveData('users', updated);
              return updated;
            });
            return;
          }

          if (payload.new) {
            const currentEscId = currentUser?.escritorio_id || storageService.getCurrentEscritorioId();
            const raw = (payload.new.raw_data && typeof payload.new.raw_data === 'object') ? payload.new.raw_data : {};
            const userEscritorioId = payload.new.escritorio_id || raw.escritorio_id || `esc_${payload.new.id}`;

            // Ignora usuários de outros escritórios no canal Realtime
            if (currentEscId && userEscritorioId !== currentEscId) return;

            const rawRoles = Array.isArray(payload.new.roles) ? payload.new.roles : (Array.isArray(raw.roles) ? raw.roles : null);
            const singleRole = payload.new.role || raw.role || 'lawyer';
            const assignedRoles = rawRoles && rawRoles.length > 0 ? rawRoles : [singleRole];
            const primaryRole = assignedRoles.includes('dev')
              ? 'dev'
              : assignedRoles.includes('admin')
              ? 'admin'
              : singleRole;

            const rawTitles = Array.isArray(payload.new.titles) ? payload.new.titles : (Array.isArray(raw.titles) ? raw.titles : null);
            const singleTitle = payload.new.title || raw.title || 'Advogado(a)';
            const assignedTitles = rawTitles && rawTitles.length > 0 ? rawTitles : [singleTitle];

            const normalizedUser = {
              id: payload.new.id,
              name: payload.new.name || raw.name || payload.new.email?.split('@')[0],
              email: payload.new.email,
              role: primaryRole,
              roles: assignedRoles,
              title: singleTitle,
              titles: assignedTitles,
              oab: payload.new.oab || raw.oab || '',
              phone: payload.new.phone || raw.phone || '',
              firmName: raw.firmName || 'JurisFlow Advocacia',
              avatar: payload.new.avatar || raw.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=256',
              status: payload.new.status || 'active',
              escritorio_id: userEscritorioId,
            };

            setUsers(prev => {
              const exists = prev.some(u => u.id === normalizedUser.id || u.email?.toLowerCase() === normalizedUser.email?.toLowerCase());
              const updated = exists
                ? prev.map(u => (u.id === normalizedUser.id || u.email?.toLowerCase() === normalizedUser.email?.toLowerCase()) ? { ...u, ...normalizedUser } : u)
                : [...prev, normalizedUser];
              storageService.saveData('users', updated);
              return updated;
            });

            // Se for o usuário atual logado, atualiza imediatamente os privilégios e permissões na tela em TEMPO REAL
            setCurrentUser(prevCurrent => {
              if (prevCurrent && (prevCurrent.id === normalizedUser.id || prevCurrent.email?.toLowerCase() === normalizedUser.email?.toLowerCase())) {
                const updatedCurrent = { ...prevCurrent, ...normalizedUser };
                if (normalizedUser.escritorio_id) {
                  storageService.setCurrentEscritorioId(normalizedUser.escritorio_id);
                }
                storageService.saveData('current_user', updatedCurrent);
                return updatedCurrent;
              }
              return prevCurrent;
            });
          }
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(usersChannel);
    };
  }, [currentUser?.escritorio_id]);

  // Sincronizar o usuário/perfil na tabela users do Supabase PostgreSQL
  const syncProfileWithSupabase = async (userObj) => {
    if (!userObj?.email) return;
    const cleanEmail = userObj.email.toLowerCase().trim();
    const cleanId = String(userObj.id || '');
    const assignedRoles = Array.isArray(userObj.roles) && userObj.roles.length > 0
      ? userObj.roles
      : (userObj.role ? [userObj.role] : ['lawyer']);
    const primaryRole = assignedRoles.includes('dev')
      ? 'dev'
      : assignedRoles.includes('admin')
      ? 'admin'
      : (userObj.role || assignedRoles[0] || 'lawyer');

    const assignedTitles = Array.isArray(userObj.titles) && userObj.titles.length > 0
      ? userObj.titles
      : (userObj.title ? [userObj.title] : ['Advogado(a)']);
    const primaryTitle = userObj.title || assignedTitles.join(' • ');

    const userData = {
      name: userObj.name || cleanEmail.split('@')[0],
      email: cleanEmail,
      role: primaryRole,
      title: primaryTitle,
      oab: userObj.oab || null,
      phone: userObj.phone || null,
      avatar: userObj.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=256',
      status: userObj.status || 'active',
      escritorio_id: userObj.escritorio_id || storageService.getCurrentEscritorioId(),
      raw_data: {
        ...stripSecrets(userObj),
        id: cleanId,
        email: cleanEmail,
        name: userObj.name || cleanEmail.split('@')[0],
        role: primaryRole,
        roles: assignedRoles,
        title: primaryTitle,
        titles: assignedTitles,
        oab: userObj.oab || null,
        phone: userObj.phone || null,
        avatar: userObj.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=256',
        status: userObj.status || 'active',
        escritorio_id: userObj.escritorio_id || storageService.getCurrentEscritorioId(),
      }
    };

    try {
      // 1. Tenta atualizar por email
      let { data: updated } = await supabase
        .from('users')
        .update(userData)
        .eq('email', cleanEmail)
        .select();

      // 2. Se não encontrou por email e tem ID válido, tenta por id
      if ((!updated || updated.length === 0) && cleanId) {
        const { data: updatedById } = await supabase
          .from('users')
          .update(userData)
          .eq('id', cleanId)
          .select();
        updated = updatedById;
      }

      // 3. Se ainda não existia, insere
      if (!updated || updated.length === 0) {
        const insertData = { ...userData, id: cleanId || `usr_${Date.now()}` };
        await supabase.from('users').insert(insertData);
      }
    } catch (e) {
      console.warn('[Users Supabase Sync Warning]:', e.message);
    }
  };

  // Login universal com consulta remota ao Supabase e salvamento permanente
  const login = async (email, password, rememberMe = true) => {
    setIsLoading(true);
    setAuthError('');
    const cleanEmail = (email || '').toLowerCase().trim();

    try {
      // 1. Autenticação REAL no Supabase Auth (senha conferida no servidor)
      let authData = null;
      try {
        authData = await signIn(cleanEmail, password);
      } catch (supabaseErr) {
        const msg = (supabaseErr?.message || '').toLowerCase();
        if (msg.includes('email not confirmed')) {
          setAuthError('Confirme seu e-mail pelo link que enviamos antes de entrar.');
        } else if (msg.includes('invalid login credentials')) {
          setAuthError('E-mail ou senha incorretos. Se esqueceu a senha, clique em "Esqueceu a senha?".');
        } else {
          setAuthError('Não foi possível entrar agora. Verifique sua conexão e tente novamente.');
        }
        setIsLoading(false);
        return false;
      }

      if (!authData?.user) {
        setAuthError('E-mail ou senha incorretos.');
        setIsLoading(false);
        return false;
      }

      // 2. Com a sessão ativa, busca o perfil (o RLS só devolve o próprio escritório)
      let remoteProfile = null;
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', cleanEmail)
          .maybeSingle();

        if (data && !error) {
          const raw = (data.raw_data && typeof data.raw_data === 'object') ? data.raw_data : {};
          const rawRoles = Array.isArray(data.roles) ? data.roles : (Array.isArray(raw.roles) ? raw.roles : null);
          const singleRole = data.role || raw.role || 'lawyer';
          const assignedRoles = rawRoles && rawRoles.length > 0 ? rawRoles : [singleRole];
          const primaryRole = assignedRoles.includes('dev')
            ? 'dev'
            : assignedRoles.includes('admin')
            ? 'admin'
            : singleRole;

          const rawTitles = Array.isArray(data.titles) ? data.titles : (Array.isArray(raw.titles) ? raw.titles : null);
          const singleTitle = data.title || raw.title || 'Advogado(a)';
          const assignedTitles = rawTitles && rawTitles.length > 0 ? rawTitles : [singleTitle];

          remoteProfile = {
            id: data.id,
            name: data.name || raw.name || data.email?.split('@')[0],
            email: data.email,
            role: primaryRole,
            roles: assignedRoles,
            title: singleTitle,
            titles: assignedTitles,
            oab: data.oab || raw.oab || '',
            phone: data.phone || raw.phone || '',
            firmName: raw.firmName || 'JurisFlow Advocacia',
            avatar: data.avatar || raw.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=256',
            status: data.status || 'active',
            escritorio_id: data.escritorio_id || null
          };
        }
      } catch (dbErr) {
        console.warn('[Supabase Users Query Warning]:', dbErr.message);
      }

      // 3. Sem perfil vinculado a um escritório = sem acesso
      if (!remoteProfile || !remoteProfile.escritorio_id) {
        setAuthError('Seu acesso ainda não foi liberado. Peça ao administrador do escritório para cadastrar seu e-mail em Equipe.');
        signOut().catch(() => {});
        setIsLoading(false);
        return false;
      }
      if (remoteProfile.status && remoteProfile.status !== 'active') {
        setAuthError('Seu usuário está inativo. Fale com o administrador do escritório.');
        signOut().catch(() => {});
        setIsLoading(false);
        return false;
      }

      storageService.setCurrentEscritorioId(remoteProfile.escritorio_id);
      storageService.purgeContaminatedCache(remoteProfile.escritorio_id);
      setCurrentUser(remoteProfile);
      setIsAuthenticated(true);
      storageService.saveData('current_user', remoteProfile);
      setIsLoading(false);
      return true;
    } catch (err) {
      console.error('Erro no login:', err);
      setIsLoading(false);
      return false;
    }
  };

  // Registro de novos usuarios com persistencia no Supabase PostgreSQL e login automatico
  // Cadastro via Supabase Auth.
  // O escritório + perfil de administrador são criados NO BANCO (trigger) quando o e-mail é confirmado.
  // Convite (?invite=...) só funciona se o administrador já tiver cadastrado o e-mail em Equipe.
  // Retorna: { ok: boolean, needsConfirmation?: boolean }
  const registerUser = async ({ name, email, password, firmName = 'Meu Escritório', escritorio_id = null }) => {
    setIsLoading(true);
    setAuthError('');
    const cleanEmail = (email || '').toLowerCase().trim();
    if (!cleanEmail || !password) {
      setIsLoading(false);
      return { ok: false };
    }

    try {
      const authData = await signUp(cleanEmail, password, {
        name: (name || '').trim(),
        firmName: firmName || 'Meu Escritório',
        invite: escritorio_id || null,
      });

      // Projeto com confirmação de e-mail: não há sessão até o usuário clicar no link
      if (!authData?.session) {
        setIsLoading(false);
        return { ok: true, needsConfirmation: true };
      }

      // Confirmação desativada: a sessão já existe → faz o login normal
      setIsLoading(false);
      const logged = await login(cleanEmail, password);
      return { ok: logged };
    } catch (err) {
      const msg = (err?.message || '').toLowerCase();
      if (msg.includes('already registered') || msg.includes('already been registered')) {
        setAuthError('Este e-mail já possui cadastro. Use "Entrar" ou "Esqueceu a senha?".');
      } else if (msg.includes('password')) {
        setAuthError('Senha fraca: use pelo menos 8 caracteres, com letras e números.');
      } else {
        setAuthError('Não foi possível criar a conta agora. Tente novamente.');
      }
      console.error('Erro ao registrar usuário:', err);
      setIsLoading(false);
      return { ok: false };
    }
  };

  // Define a nova senha após o usuário abrir o link de redefinição recebido por e-mail
  const updatePassword = async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    setPasswordRecovery(false);
    return true;
  };

  const logout = () => {
    // 1. Limpeza SÍNCRONA e IMEDIATA de sessão (transição para Login sem lag nem congelamento)
    storageService.saveData('current_user', null);
    storageService.setCurrentEscritorioId(null);
    setCurrentUser(null);
    setIsAuthenticated(false);
    setUsers([]);

    // 2. Término assíncrono em segundo plano (não bloqueia a renderização da UI)
    setTimeout(() => {
      try {
        storageService.clearTenantCache();
        signOut().catch(e => console.warn('Erro ao deslogar do Supabase:', e.message));
      } catch (err) {
        console.warn('Erro pós-logout:', err);
      }
    }, 50);
  };

  // Alternância direta desabilitada: cada conta é particular e intransferível
  const switchUser = () => {
    console.warn('[Segurança JurisFlow] Acesso direto a outras contas desativado: a conta é pessoal e intransferível. Encerre a sessão para entrar com outro usuário.');
    return false;
  };

  const createUser = (userData) => {
    const assignedRoles = Array.isArray(userData.roles) && userData.roles.length > 0
      ? userData.roles
      : (userData.role ? [userData.role] : ['lawyer']);
    const primaryRole = assignedRoles.includes('dev')
      ? 'dev'
      : assignedRoles.includes('admin')
      ? 'admin'
      : (userData.role || assignedRoles[0] || 'lawyer');

    const assignedTitles = Array.isArray(userData.titles) && userData.titles.length > 0
      ? userData.titles
      : (userData.title ? [userData.title] : ['Advogado(a)']);

    const newUser = {
      ...stripSecrets(userData),
      id: userData.id || `usr_${Date.now()}`,
      // Colaborador entra no escritório aberto (matriz ou a filial que o dono escolheu)
      escritorio_id: userData.escritorio_id || teamOfficeId || currentUser?.escritorio_id,
      role: primaryRole,
      roles: assignedRoles,
      title: userData.title || assignedTitles.join(' • '),
      titles: assignedTitles,
      status: 'active',
      avatar: userData.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
    };
    setUsers(prev => {
      const next = [...prev, newUser];
      storageService.saveData('users', next);
      return next;
    });
    syncProfileWithSupabase(newUser);
    return newUser;
  };

  const updateUser = async (id, updatedFields) => {
    const target = users.find(u => u.id === id || (u.email && updatedFields.email && u.email.toLowerCase() === updatedFields.email.toLowerCase())) || {};
    
    const nextRoles = Array.isArray(updatedFields.roles)
      ? updatedFields.roles
      : (updatedFields.role ? [updatedFields.role] : (Array.isArray(target.roles) ? target.roles : [target.role || 'lawyer']));
    
    const primaryRole = nextRoles.includes('dev')
      ? 'dev'
      : nextRoles.includes('admin')
      ? 'admin'
      : (updatedFields.role || nextRoles[0] || 'lawyer');

    const nextTitles = Array.isArray(updatedFields.titles)
      ? updatedFields.titles
      : (updatedFields.title ? [updatedFields.title] : (Array.isArray(target.titles) ? target.titles : [target.title || 'Advogado(a)']));

    const updatedUserObj = {
      ...target,
      ...updatedFields,
      id: target.id || id,
      role: primaryRole,
      roles: nextRoles,
      titles: nextTitles,
      title: updatedFields.title || nextTitles.join(' • '),
    };

    // 1. Atualiza lista de usuários no estado e localStorage
    setUsers(prev => {
      const updatedList = prev.map(u => (u.id === id || (u.email && updatedFields.email && u.email.toLowerCase() === updatedFields.email.toLowerCase())) ? updatedUserObj : u);
      storageService.saveData('users', updatedList);
      return updatedList;
    });

    // 2. Se for o usuário autenticado atualmente, atualiza currentUser
    if (currentUser?.id === id || (currentUser?.email && updatedFields.email && currentUser.email.toLowerCase() === updatedFields.email.toLowerCase())) {
      setCurrentUser(prev => {
        const updated = {
          ...prev,
          ...updatedUserObj
        };
        storageService.saveData('current_user', updated);
        return updated;
      });
    }

    // 3. Sincroniza em segundo plano com o Supabase sem bloquear a UI
    syncProfileWithSupabase(updatedUserObj).catch(err => {
      console.warn('Erro ao sincronizar updateUser com Supabase:', err.message);
    });

    return true;
  };

  const deleteUser = async (id) => {
    if (users.length <= 1) {
      alert('Não é possível excluir o único usuário do sistema.');
      return false;
    }

    const targetUser = users.find(u => u.id === id);
    const targetEmail = targetUser?.email ? targetUser.email.toLowerCase().trim() : '';
    const cleanId = String(id || '');

    // 1. Atualização instantânea no estado e localStorage
    setUsers(prev => {
      const filtered = prev.filter(u => u.id !== cleanId && (!targetEmail || u.email?.toLowerCase() !== targetEmail));
      storageService.saveData('users', filtered);
      return filtered;
    });

    // 2. Exclusão direta no Supabase
    try {
      if (targetEmail) {
        await supabase.from('users').delete().eq('email', targetEmail);
      }
      if (cleanId) {
        await supabase.from('users').delete().eq('id', cleanId);
      }
    } catch (err) {
      console.warn('Erro ao deletar usuário do Supabase:', err.message);
    }

    // 3. Se for o usuário atual, muda para o próximo
    if (currentUser?.id === cleanId || (targetEmail && currentUser?.email?.toLowerCase() === targetEmail)) {
      const nextUser = users.find(u => u.id !== cleanId && (!targetEmail || u.email?.toLowerCase() !== targetEmail)) || null;
      setCurrentUser(nextUser);
      storageService.saveData('current_user', nextUser);
    }
    return true;
  };

  // Envia o e-mail de redefinição. Não revela se o e-mail existe; só avisa quando o envio
  // foi barrado por limite (o e-mail padrão do Supabase tem cota baixa por hora).
  const resetPassword = async (email) => {
    setIsLoading(true);
    let result = { ok: true, rateLimited: false };
    try {
      await resetPasswordForEmail(email);
    } catch (err) {
      const msg = (err?.message || '').toLowerCase();
      if (err?.status === 429 || msg.includes('rate limit') || msg.includes('security purposes') || msg.includes('seconds')) {
        result = { ok: false, rateLimited: true };
      }
      console.warn('Reset password email warning:', err.message);
    }
    await new Promise(res => setTimeout(res, 300));
    setIsLoading(false);
    return result;
  };

  const updateProfile = async (updatedData) => {
    if (!currentUser) return false;
    const cleanEmail = (updatedData.email || currentUser.email || '').toLowerCase().trim();
    const assignedRoles = Array.isArray(updatedData.roles) && updatedData.roles.length > 0
      ? updatedData.roles
      : (Array.isArray(currentUser.roles) ? currentUser.roles : [currentUser.role || 'admin']);

    const primaryRole = assignedRoles.includes('dev')
      ? 'dev'
      : assignedRoles.includes('admin')
      ? 'admin'
      : (updatedData.role || currentUser.role || 'lawyer');

    const assignedTitles = Array.isArray(updatedData.titles) && updatedData.titles.length > 0
      ? updatedData.titles
      : (Array.isArray(currentUser.titles) ? currentUser.titles : [updatedData.title || currentUser.title || 'Advogado(a)']);

    const primaryTitle = updatedData.title || assignedTitles.join(' • ');

    const updatedUser = {
      ...currentUser,
      ...updatedData,
      id: currentUser.id,
      email: cleanEmail,
      role: primaryRole,
      roles: assignedRoles,
      title: primaryTitle,
      titles: assignedTitles,
    };

    // 1. Atualiza estado e localStorage do currentUser imediatamente
    setCurrentUser(updatedUser);
    storageService.saveData('current_user', updatedUser);

    // 2. Atualiza a lista geral de users
    setUsers(prev => {
      const exists = prev.some(u => u.id === updatedUser.id || u.email?.toLowerCase() === cleanEmail);
      const updated = exists
        ? prev.map(u => (u.id === updatedUser.id || u.email?.toLowerCase() === cleanEmail) ? { ...u, ...updatedUser } : u)
        : [...prev, updatedUser];
      storageService.saveData('users', updated);
      return updated;
    });

    // 3. Persiste no Supabase PostgreSQL de forma resiliente
    try {
      await syncProfileWithSupabase(updatedUser);
    } catch (err) {
      console.warn('Falha ao sincronizar perfil com Supabase:', err.message);
    }
    return true;
  };

  const userRoles = Array.isArray(currentUser?.roles) && currentUser.roles.length > 0
    ? currentUser.roles
    : (currentUser?.role ? [currentUser.role] : []);

  const isDev = userRoles.includes('dev') || currentUser?.role === 'dev';
  const isAdmin = userRoles.includes('admin') || currentUser?.role === 'admin' || isDev;
  const isSeniorLawyer = userRoles.includes('senior_lawyer') || currentUser?.role === 'senior_lawyer';
  const isLawyer = userRoles.includes('lawyer') || currentUser?.role === 'lawyer' || isSeniorLawyer;
  const isFinancial = userRoles.includes('financial') || currentUser?.role === 'financial';
  const isSalesManager = userRoles.includes('sales_manager') || currentUser?.role === 'sales_manager';
  const isSales = userRoles.includes('sales') || currentUser?.role === 'sales' || isSalesManager;
  const isSecretary = userRoles.includes('secretary') || currentUser?.role === 'secretary';

  // Módulos liberados por cargo: tabela "Níveis de acesso" do escritório (padrão = regras originais).
  // Dono/sócio-administrador e Dev sempre com acesso total.
  const modulePermissions = permissionsForRoles(userRoles, roleMatrix, { fullAccess: isDev || isAdmin });

  const permissions = {
    isDev,
    isAdmin,
    isSeniorLawyer,
    isLawyer,
    isFinancial,
    isSalesManager,
    isSales,
    isSecretary,

    ...modulePermissions,
    // Histórico de ações (auditoria): só o dono da conta — igual à regra do banco
    canAccessSecurity: isDev || isAdmin,
    canAccessAdvancedSettings: isDev || isAdmin,
    canDeleteRecords: isDev || isAdmin,
    canResetDatabase: isDev || isAdmin,
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        isAuthenticated,
        authError,
        isLoading,
        login,
        registerUser,
        logout,
        switchUser,
        createUser,
        updateUser,
        updateProfile,
        deleteUser,
        resetPassword,
        updatePassword,
        passwordRecovery,
        roleMatrix,
        setRoleMatrix,
        teamOfficeId,
        setTeamOfficeId,
        permissions,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

