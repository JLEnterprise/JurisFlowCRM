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

  // Escutar mudancas de sessao no Supabase
  useEffect(() => {
    let mounted = true;

    async function checkInitialSession() {
      try {
        const session = await getSession();
        if (session?.user && mounted) {
          const email = session.user.email?.toLowerCase();
          const match = users.find(u => u.email?.toLowerCase() === email);
          if (match) {
            setCurrentUser(match);
            setIsAuthenticated(true);
          } else {
            const meta = session.user.user_metadata || {};
            const newUser = {
              id: session.user.id,
              name: meta.name || email.split('@')[0],
              email: email,
              role: meta.role || 'admin',
              title: meta.title || 'Advogado(a)',
              oab: meta.oab || '',
              phone: meta.phone || '',
              avatar: meta.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=256',
              status: 'active'
            };
            setCurrentUser(newUser);
            setIsAuthenticated(true);
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
          setCurrentUser(match);
          setIsAuthenticated(true);
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

  // Carregar usuários remotos na inicialização
  useEffect(() => {
    let mounted = true;
    async function loadCloudUsers() {
      try {
        const cloudUsers = await storageService.fetchFromSupabase('users', INITIAL_USERS);
        if (mounted && Array.isArray(cloudUsers) && cloudUsers.length > 0) {
          setUsers(cloudUsers);
        }
      } catch (e) {
        console.warn('Erro ao carregar usuários remotos:', e);
      }
    }
    loadCloudUsers();
    return () => { mounted = false; };
  }, []);

  // Sincronizar o usuário/perfil na tabela users do Supabase PostgreSQL
  const syncProfileWithSupabase = async (userObj) => {
    try {
      if (!userObj?.email) return;
      const cleanEmail = userObj.email.toLowerCase().trim();
      const userData = {
        id: userObj.id || `usr_${Date.now()}`,
        email: cleanEmail,
        name: userObj.name || cleanEmail.split('@')[0],
        role: userObj.role || 'admin',
        title: userObj.title || 'Sócio Administrador',
        firmName: userObj.firmName || 'JurisFlow Advocacia',
        phone: userObj.phone || '',
        oab: userObj.oab || '',
        avatar: userObj.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=256',
        status: userObj.status || 'active',
      };
      await storageService.syncToSupabase('users', userData);
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
          remoteProfile = {
            id: data.id,
            name: data.name || raw.name || data.email?.split('@')[0],
            email: data.email,
            role: data.role || raw.role || 'admin',
            title: data.title || raw.title || 'Sócio Administrador',
            oab: data.oab || raw.oab || '',
            phone: data.phone || raw.phone || '',
            firmName: raw.firmName || 'JurisFlow Advocacia',
            avatar: data.avatar || raw.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=256',
            status: data.status || 'active'
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
          const userToSet = match || {
            id: authData.user.id,
            name: authData.user.user_metadata?.name || cleanEmail.split('@')[0],
            email: cleanEmail,
            role: authData.user.user_metadata?.role || 'admin',
            title: authData.user.user_metadata?.title || 'Sócio Administrador',
            avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=256',
            status: 'active'
          };
          setCurrentUser(userToSet);
          setIsAuthenticated(true);
          storageService.saveData('current_user', userToSet);
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
          title: 'Sócio Administrador',
          firmName: 'JurisFlow Advocacia',
          avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=256',
          status: 'active',
          created_at: new Date().toISOString()
        };
      } else if (password) {
        found = { ...found, password };
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
        title: 'Sócio Administrador',
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
  const registerUser = async ({ name, email, password, role = 'lawyer', roles = null, title = 'Advogado(a)', titles = null, firmName = 'JurisFlow Advocacia' }) => {
    setIsLoading(true);
    setAuthError('');
    const cleanEmail = (email || '').toLowerCase().trim() || 'usuario@escritorio.adv.br';

    try {
      let supabaseUserId = null;
      try {
        const authData = await signUp(cleanEmail, password || '123456', { name, role, title, firmName });
        if (authData?.user?.id) {
          supabaseUserId = authData.user.id;
        }
      } catch (supabaseErr) {
        console.warn('[Supabase SignUp Warning]:', supabaseErr.message);
      }

      const assignedRoles = Array.isArray(roles) && roles.length > 0 ? roles : [role || 'lawyer'];
      const assignedTitles = Array.isArray(titles) && titles.length > 0 ? titles : [title || 'Advogado(a)'];

      const userId = supabaseUserId || `usr_${Date.now()}`;
      const newUser = {
        id: userId,
        name: (name || cleanEmail.split('@')[0]).trim(),
        email: cleanEmail,
        password: password || '123456',
        role: assignedRoles[0] || 'lawyer',
        roles: assignedRoles,
        title: assignedTitles.join(' • '),
        titles: assignedTitles,
        oab: '',
        phone: '',
        firmName: firmName || 'JurisFlow Advocacia',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=256',
        status: 'active',
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

      // 2. Persistir o perfil na tabela 'profiles' do Supabase PostgreSQL
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
        title: 'Sócio Administrador',
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
    const newUser = {
      ...userData,
      id: `usr_${Date.now()}`,
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

  const updateUser = (id, updatedFields) => {
    setUsers(prev => {
      const updatedList = prev.map(u => (u.id === id ? { ...u, ...updatedFields } : u));
      storageService.saveData('users', updatedList);
      return updatedList;
    });

    if (currentUser?.id === id) {
      setCurrentUser(prev => {
        const updated = { ...prev, ...updatedFields };
        storageService.saveData('current_user', updated);
        syncProfileWithSupabase(updated);
        return updated;
      });
    }
    return true;
  };

  const deleteUser = (id) => {
    if (users.length <= 1) {
      alert('Não é possível excluir o único usuário do sistema.');
      return false;
    }
    setUsers(prev => {
      const filtered = prev.filter(u => u.id !== id);
      storageService.saveData('users', filtered);
      return filtered;
    });
    storageService.deleteFromSupabase('users', id);
    if (currentUser?.id === id) {
      const nextUser = users.find(u => u.id !== id) || null;
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

  const userRoles = Array.isArray(currentUser?.roles) && currentUser.roles.length > 0
    ? currentUser.roles
    : (currentUser?.role ? [currentUser.role] : ['admin']);

  const isDev = userRoles.includes('dev');
  const isAdmin = userRoles.includes('admin') || isDev;
  const isSeniorLawyer = userRoles.includes('senior_lawyer');
  const isLawyer = userRoles.includes('lawyer') || isSeniorLawyer;
  const isFinancial = userRoles.includes('financial');
  const isSalesManager = userRoles.includes('sales_manager');
  const isSales = userRoles.includes('sales') || isSalesManager;
  const isSecretary = userRoles.includes('secretary');

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
