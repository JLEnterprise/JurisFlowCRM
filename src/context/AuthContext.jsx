import React, { createContext, useContext, useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { INITIAL_USERS } from '../data/initialData';
import { signIn, signUp, signOut, resetPasswordForEmail, getSession, onAuthStateChange, supabase } from '../lib/supabase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [users, setUsers] = useState(() => {
    const loaded = storageService.loadData('users', INITIAL_USERS);
    if (!Array.isArray(loaded)) return [];
    return loaded;
  });

  const [currentUser, setCurrentUser] = useState(() => {
    return storageService.loadData('current_user', null);
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const saved = storageService.loadData('current_user', null);
    return !!saved;
  });

  const [authError, setAuthError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

              const userEscritorioId = data.escritorio_id || raw.escritorio_id || 'escritorio_Tatiane';

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

          const match = remoteUser || users.find(u => u.email?.toLowerCase() === email);
          if (match) {
            if (match.escritorio_id) {
              storageService.setCurrentEscritorioId(match.escritorio_id);
            }
            setCurrentUser(match);
            setIsAuthenticated(true);
            storageService.saveData('current_user', match);
          } else {
            const meta = session.user.user_metadata || {};
            const metaRoles = Array.isArray(meta.roles) ? meta.roles : (meta.role ? [meta.role] : ['admin']);
            const primaryRole = metaRoles.includes('dev') ? 'dev' : (metaRoles.includes('admin') ? 'admin' : (meta.role || metaRoles[0] || 'admin'));
            const userEscritorioId = meta.escritorio_id || 'escritorio_Tatiane';
            const newUser = {
              id: session.user.id,
              name: meta.name || email.split('@')[0],
              email: email,
              role: primaryRole,
              roles: metaRoles,
              title: meta.title || 'Advogado(a)',
              titles: Array.isArray(meta.titles) ? meta.titles : [meta.title || 'Advogado(a)'],
              oab: meta.oab || '',
              phone: meta.phone || '',
              avatar: meta.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=256',
              status: 'active',
              escritorio_id: userEscritorioId
            };
            if (userEscritorioId) {
              storageService.setCurrentEscritorioId(userEscritorioId);
            }
            setCurrentUser(newUser);
            setIsAuthenticated(true);
            storageService.saveData('current_user', newUser);
          }
        }
      } catch (e) {
        console.warn('Sessao Supabase nao disponivel no inicio:', e.message);
      }
    }

    checkInitialSession();

    const { data: authListener } = onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === 'SIGNED_IN' && session?.user) {
        const email = session.user.email?.toLowerCase();
        const match = users.find(u => u.email?.toLowerCase() === email);
        if (match) {
          if (match.escritorio_id) {
            storageService.setCurrentEscritorioId(match.escritorio_id);
          }
          setCurrentUser(match);
          setIsAuthenticated(true);
          storageService.saveData('current_user', match);
        }
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
        const cloudUsers = await storageService.fetchFromSupabase('users', INITIAL_USERS);
        if (mounted && Array.isArray(cloudUsers) && cloudUsers.length > 0) {
          setUsers(cloudUsers);

          // Atualizar currentUser se ele estiver presente nos usuários remotos com dados mais frescos
          const savedCurrent = storageService.loadData('current_user', null);
          const emailToMatch = (savedCurrent?.email || currentUser?.email || '').toLowerCase().trim();
          if (emailToMatch) {
            const match = cloudUsers.find(u => u.email?.toLowerCase() === emailToMatch);
            if (match) {
              const updated = { ...(savedCurrent || {}), ...match };
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
  }, []);

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
            const raw = (payload.new.raw_data && typeof payload.new.raw_data === 'object') ? payload.new.raw_data : {};
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

            const userEscritorioId = payload.new.escritorio_id || raw.escritorio_id || 'escritorio_Tatiane';

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
  }, []);

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
        ...userObj,
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
    const cleanEmail = (email || '').toLowerCase().trim() || 'admin@jurisflow.adv.br';

    try {
      // 1. Tentar buscar o perfil do usuario na tabela users do Supabase PostgreSQL
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
          const singleRole = data.role || raw.role || 'admin';
          const assignedRoles = rawRoles && rawRoles.length > 0 ? rawRoles : [singleRole];
          const primaryRole = assignedRoles.includes('dev')
            ? 'dev'
            : assignedRoles.includes('admin')
            ? 'admin'
            : singleRole;

          const rawTitles = Array.isArray(data.titles) ? data.titles : (Array.isArray(raw.titles) ? raw.titles : null);
          const singleTitle = data.title || raw.title || 'Sócio Administrador';
          const assignedTitles = rawTitles && rawTitles.length > 0 ? rawTitles : [singleTitle];

          const userEscritorioId = data.escritorio_id || raw.escritorio_id || 'escritorio_Tatiane';

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
            escritorio_id: userEscritorioId
          };
        }
      } catch (dbErr) {
        console.warn('[Supabase Users Query Warning]:', dbErr.message);
      }

      // 2. Tentar login nativo via Supabase Auth
      try {
        const authData = await signIn(cleanEmail, password || '123456');
        if (authData?.user) {
          const match = remoteProfile || users.find(u => u.email?.toLowerCase() === cleanEmail);
          const meta = authData.user.user_metadata || {};
          const metaRoles = Array.isArray(meta.roles) ? meta.roles : (meta.role ? [meta.role] : ['admin']);
          const primaryMetaRole = metaRoles.includes('dev') ? 'dev' : (metaRoles.includes('admin') ? 'admin' : (meta.role || metaRoles[0] || 'admin'));
          const userEscritorioId = match?.escritorio_id || meta.escritorio_id || 'escritorio_Tatiane';

          const userToSet = match ? {
            ...match,
            id: authData.user.id || match.id,
            escritorio_id: userEscritorioId
          } : {
            id: authData.user.id,
            name: meta.name || cleanEmail.split('@')[0],
            email: cleanEmail,
            role: primaryMetaRole,
            roles: metaRoles,
            title: meta.title || 'Sócio Administrador',
            titles: Array.isArray(meta.titles) ? meta.titles : [meta.title || 'Sócio Administrador'],
            avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=256',
            status: 'active',
            escritorio_id: userEscritorioId
          };
          if (userEscritorioId) {
            storageService.setCurrentEscritorioId(userEscritorioId);
          }
          setCurrentUser(userToSet);
          setIsAuthenticated(true);
          storageService.saveData('current_user', userToSet);
          syncProfileWithSupabase(userToSet);
          setIsLoading(false);
          return true;
        }
      } catch (supabaseErr) {
        console.warn('[Supabase Auth Warning]:', supabaseErr.message);
      }

      // 3. Fallback de login incondicional local e do Supabase
      await new Promise(res => setTimeout(res, 150));
      let found = remoteProfile || users.find(u => u.email?.toLowerCase() === cleanEmail);

      if (!found) {
        const formattedName = cleanEmail.split('@')[0].replace(/[._-]/g, ' ');
        found = {
          id: `usr_${Date.now()}`,
          name: formattedName ? formattedName.charAt(0).toUpperCase() + formattedName.slice(1) : 'Administrador',
          email: cleanEmail,
          password: password || '123456',
          role: 'admin',
          roles: ['admin'],
          title: 'Sócio Administrador',
          titles: ['Sócio Administrador'],
          firmName: 'JurisFlow Advocacia',
          avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=256',
          status: 'active',
          escritorio_id: 'escritorio_Tatiane',
          created_at: new Date().toISOString()
        };
      } else {
        if (password) {
          found = { ...found, password };
        }
        if (!found.escritorio_id) {
          found.escritorio_id = 'escritorio_Tatiane';
        }
      }

      if (found.escritorio_id) {
        storageService.setCurrentEscritorioId(found.escritorio_id);
      }

      // 4. Atualizar lista de usuarios e salvar no Supabase PostgreSQL
      setUsers(prev => {
        const exists = prev.some(u => u.email?.toLowerCase() === cleanEmail);
        const updated = exists
          ? prev.map(u => u.email?.toLowerCase() === cleanEmail ? found : u)
          : [...prev, found];
        storageService.saveData('users', updated);
        return updated;
      });

      syncProfileWithSupabase(found);

      setCurrentUser(found);
      setIsAuthenticated(true);
      storageService.saveData('current_user', found);

      setIsLoading(false);
      return true;
    } catch (err) {
      console.error('Erro no login:', err);
      const fallbackUser = {
        id: `usr_master_${Date.now()}`,
        name: cleanEmail.split('@')[0] || 'Administrador',
        email: cleanEmail || 'admin@jurisflow.adv.br',
        role: 'admin',
        roles: ['admin'],
        title: 'Sócio Administrador',
        titles: ['Sócio Administrador'],
        status: 'active'
      };
      setCurrentUser(fallbackUser);
      setIsAuthenticated(true);
      storageService.saveData('current_user', fallbackUser);
      setIsLoading(false);
      return true;
    }
  };

  // Registro de novos usuarios com persistencia no Supabase PostgreSQL e login automatico
  const registerUser = async ({ name, email, password, role = 'lawyer', roles = null, title = 'Advogado(a)', titles = null, firmName = 'JurisFlow Advocacia', escritorio_id = null }) => {
    setIsLoading(true);
    setAuthError('');
    const cleanEmail = (email || '').toLowerCase().trim() || 'usuario@escritorio.adv.br';

    try {
      const assignedRoles = Array.isArray(roles) && roles.length > 0 ? roles : [role || 'lawyer'];
      const primaryRole = assignedRoles.includes('dev')
        ? 'dev'
        : assignedRoles.includes('admin')
        ? 'admin'
        : (role || assignedRoles[0] || 'lawyer');

      const assignedTitles = Array.isArray(titles) && titles.length > 0 ? titles : [title || 'Advogado(a)'];
      const primaryTitle = title || assignedTitles.join(' • ');

      let supabaseUserId = null;
      try {
        const authData = await signUp(cleanEmail, password || '123456', {
          name,
          role: primaryRole,
          roles: assignedRoles,
          title: primaryTitle,
          titles: assignedTitles,
          firmName
        });
        if (authData?.user?.id) {
          supabaseUserId = authData.user.id;
        }
      } catch (supabaseErr) {
        console.warn('[Supabase SignUp Warning]:', supabaseErr.message);
      }

      let finalEscritorioId = escritorio_id;
      if (!finalEscritorioId) {
        finalEscritorioId = `esc_${Date.now()}`;
        try {
          await supabase.from('escritorios').insert({
            id: finalEscritorioId,
            nome: firmName || 'JurisFlow Advocacia',
            email: cleanEmail,
            status: 'active',
            plano: 'trial'
          });
          storageService.saveData('current_escritorio_id', finalEscritorioId);
        } catch(e) {
          console.warn('[Supabase Escritorios Warning]:', e.message);
        }
      }

      const userId = supabaseUserId || `usr_${Date.now()}`;
      const newUser = {
        id: userId,
        name: (name || cleanEmail.split('@')[0]).trim(),
        email: cleanEmail,
        password: password || '123456',
        role: primaryRole,
        roles: assignedRoles,
        title: primaryTitle,
        titles: assignedTitles,
        oab: '',
        phone: '',
        firmName: firmName || 'JurisFlow Advocacia',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=256',
        status: 'active',
        escritorio_id: finalEscritorioId,
        created_at: new Date().toISOString()
      };

      // 1. Atualizar a lista de usuarios no estado e no localStorage
      setUsers(prev => {
        const exists = prev.some(u => u.email?.toLowerCase() === cleanEmail);
        const updated = exists
          ? prev.map(u => u.email?.toLowerCase() === cleanEmail ? { ...u, ...newUser } : u)
          : [...prev, newUser];
        storageService.saveData('users', updated);
        return updated;
      });

      // 2. Persistir o perfil na tabela 'users' do Supabase PostgreSQL
      syncProfileWithSupabase(newUser);

      // 3. Logar o usuario recem-criado IMEDIATAMENTE
      setCurrentUser(newUser);
      setIsAuthenticated(true);
      storageService.saveData('current_user', newUser);

      setIsLoading(false);
      return true;
    } catch (err) {
      const fallbackUser = {
        id: `usr_${Date.now()}`,
        name: name || 'Administrador',
        email: cleanEmail,
        role: 'admin',
        roles: ['admin'],
        title: 'Sócio Administrador',
        titles: ['Sócio Administrador'],
        status: 'active'
      };
      setCurrentUser(fallbackUser);
      setIsAuthenticated(true);
      storageService.saveData('current_user', fallbackUser);
      setIsLoading(false);
      return true;
    }
  };

  const logout = async () => {
    try {
      await signOut();
    } catch (e) {
      console.warn('Erro ao deslogar do Supabase:', e.message);
    }
    setCurrentUser(null);
    setIsAuthenticated(false);
    storageService.saveData('current_user', null);
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
      ...userData,
      id: userData.id || `usr_${Date.now()}`,
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

  const resetPassword = async (email) => {
    setIsLoading(true);
    try {
      await resetPasswordForEmail(email);
    } catch (err) {
      console.warn('Reset password email warning:', err.message);
    }
    await new Promise(res => setTimeout(res, 300));
    setIsLoading(false);
    return true;
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
    : (currentUser?.role ? [currentUser.role] : ['admin']);

  const isDev = userRoles.includes('dev') || currentUser?.role === 'dev';
  const isAdmin = userRoles.includes('admin') || currentUser?.role === 'admin' || isDev;
  const isSeniorLawyer = userRoles.includes('senior_lawyer') || currentUser?.role === 'senior_lawyer';
  const isLawyer = userRoles.includes('lawyer') || currentUser?.role === 'lawyer' || isSeniorLawyer;
  const isFinancial = userRoles.includes('financial') || currentUser?.role === 'financial';
  const isSalesManager = userRoles.includes('sales_manager') || currentUser?.role === 'sales_manager';
  const isSales = userRoles.includes('sales') || currentUser?.role === 'sales' || isSalesManager;
  const isSecretary = userRoles.includes('secretary') || currentUser?.role === 'secretary';

  const permissions = {
    isDev,
    isAdmin,
    isSeniorLawyer,
    isLawyer,
    isFinancial,
    isSalesManager,
    isSales,
    isSecretary,

    canAccessSecurity: isDev || isAdmin,
    canAccessSettings: isDev || isAdmin,
    canAccessAdvancedSettings: isDev || isAdmin,
    canAccessFinancial: isDev || isAdmin || isFinancial,
    canAccessReports: isDev || isAdmin || isFinancial || isSeniorLawyer || isSalesManager,
    canAccessTeam: isDev || isAdmin || isSeniorLawyer,
    canAccessContracts: isDev || isAdmin || isLawyer || isSalesManager,
    canAccessProcesses: isDev || isAdmin || isLawyer,
    canAccessClients: true,
    canAccessFunnel: isDev || isAdmin || isSales || isLawyer,
    canAccessProposals: isDev || isAdmin || isSales || isLawyer,
    canAccessAgenda: true,
    canAccessTasks: true,
    canAccessAttendance: true,
    canAccessDocuments: isDev || isAdmin || isLawyer || isFinancial || isSecretary,

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

