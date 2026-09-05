import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Moon,
  Sun,
  Menu,
  ChevronDown,
  UserCheck,
  LogOut,
  Shield,
  Calendar,
  Building2,
  Settings as SettingsIcon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useCRM } from '../../context/CRMContext';
import { NotificationCenter } from './NotificationCenter';
import { Avatar } from '../common/Avatar';

export function Header({
  onOpenSearch,
  onToggleSidebar,
  onToggleMobileSidebar,
  currentTab,
  currentViewTitle,
  onNavigate,
}) {
  const { currentUser, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { periodFilter, setPeriodFilter, currentEscritorio, escritorios = [], switchEscritorio, currentEscritorioId } = useCRM();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  const toggleSidebarFn = onToggleSidebar || onToggleMobileSidebar || (() => {});

  // Fechar menu do usuário ao clicar fora
  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    }
    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  const tabTitles = {
    dashboard: 'Painel Executivo & BI',
    kanban: 'Funil Comercial & Conversão',
    leads: 'Gestão de Leads & Oportunidades',
    clients: 'Base de Clientes & Relacionamento',
    proposals: 'Propostas de Honorários',
    contracts: 'Contratos & Minutas',
    processes: 'Dossiês & Processos Judiciais (CNJ)',
    agenda: 'Agenda Jurídica & Audiências',
    tasks: 'Tarefas & Prazos Fatais',
    attendance: 'Central de Atendimento Multicanal',
    documents: 'Documentos & GED Inteligente',
    financial: 'Contas a Receber & Honorários',
    reports: 'Relatórios & Inteligência Jurídica',
    team: 'Equipe & Performance da Banca',
    security: 'Trilha de Auditoria & LGPD',
    settings: 'Configurações do Escritório',
  };

  const titleToDisplay = currentViewTitle || tabTitles[currentTab] || 'Dashboard Executivo';

  const periodOptions = [
    { id: 'today', label: 'Hoje' },
    { id: '7d', label: 'Últimos 7 dias' },
    { id: '30d', label: 'Últimos 30 dias' },
    { id: '90d', label: 'Últimos 90 dias' },
    { id: '12m', label: 'Últimos 12 meses' },
    { id: 'all', label: 'Todo o Período' },
  ];

  const roleLabels = {
    dev: 'Dev / TI (Infra & Engenharia)',
    admin: 'Sócia Administradora',
    senior_lawyer: 'Advogado(a) Sênior',
    lawyer: 'Advogado(a)',
    financial: 'Financeiro',
    sales_manager: 'Head Comercial',
    sales: 'Comercial / SDR',
    secretary: 'Administrativo',
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 dark:border-white/[0.08] bg-white/90 dark:bg-[#0b0f17]/90 px-4 sm:px-6 backdrop-blur-xl transition-colors">
      {/* Left section: Hamburger button e Título da Tela */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebarFn}
          className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-white/5 lg:hidden"
          title="Abrir Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2 font-sans tracking-tight">
            {titleToDisplay}
          </h1>
        </div>
      </div>

      {/* Right Section: Ações Globais e Perfil */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Global Spotlight Search Button */}
        <button
          onClick={onOpenSearch}
          className="hidden sm:flex items-center gap-2 rounded-xl bg-slate-100/90 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] px-3.5 py-1.5 text-xs text-slate-500 dark:text-slate-400 hover:border-gold-500/50 hover:bg-gold-500/5 transition-all shadow-xs btn-tactile"
        >
          <Search className="h-3.5 w-3.5 text-slate-400" />
          <span>Busca global...</span>
          <kbd className="rounded bg-white dark:bg-white/[0.08] px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 dark:text-slate-300 shadow-2xs border border-slate-200 dark:border-white/10">
            Ctrl+K
          </kbd>
        </button>

        {/* Period Filter */}
        <div className="hidden md:flex items-center gap-1.5 bg-slate-100/90 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl px-2.5 py-1 text-xs">
          <Calendar className="h-3.5 w-3.5 text-gold-500" />
          <select
            value={periodFilter || '30d'}
            onChange={(e) => setPeriodFilter(e.target.value)}
            className="bg-transparent text-slate-700 dark:text-slate-200 focus:outline-none font-semibold cursor-pointer text-xs"
          >
            {periodOptions.map(opt => (
              <option key={opt.id} value={opt.id} className="dark:bg-[#111827] dark:text-white">
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-white/5 transition-colors btn-tactile"
          title={isDark ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro'}
        >
          {isDark ? <Sun className="h-4.5 w-4.5 text-amber-400" /> : <Moon className="h-4.5 w-4.5 text-slate-600" />}
        </button>

        {/* Notifications */}
        <NotificationCenter />

        {/* User Profile Dropdown */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2.5 rounded-xl p-1.5 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors btn-tactile"
          >
            <Avatar
              src={currentUser?.avatar}
              name={currentUser?.name || 'Helena Prado'}
              size="sm"
            />
            <div className="hidden text-left xl:block">
              <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                {currentUser?.name?.split(' ')[0]}
                {currentUser?.role === 'admin' && <Shield className="h-3 w-3 text-gold-500" />}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[140px]">
                {currentUser?.title || roleLabels[currentUser?.role] || 'Usuário'}
              </div>
            </div>
            <ChevronDown className="hidden h-3.5 w-3.5 text-slate-400 xl:block" />
          </button>

          {/* Dropdown Menu */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/[0.08] p-3 shadow-2xl z-50 animate-fade-in backdrop-blur-2xl">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-white/[0.08] mb-2">
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  {currentUser?.name}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {currentUser?.email}
                </div>
                
                {/* Identificação do Escritório / Banca */}
                <div className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  <Building2 className="h-3.5 w-3.5 text-gold-500 shrink-0" />
                  <span className="truncate">{currentEscritorio?.nome || 'JurisFlow Advocacia'}</span>
                </div>
              </div>

              {/* Informações da Conta */}
              <div className="mb-2 px-1 space-y-1.5">
                {/* Se houver múltiplas filiais, permite alternar com facilidade */}
                {escritorios.length > 1 && (
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06] space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Alternar Filial / Escritório:
                    </span>
                    <div className="space-y-1 max-h-28 overflow-y-auto">
                      {escritorios.map(esc => (
                        <button
                          key={esc.id}
                          onClick={() => {
                            switchEscritorio(esc.id);
                            setShowUserMenu(false);
                          }}
                          className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-colors text-left ${
                            esc.id === currentEscritorioId
                              ? 'bg-brand-600 text-white font-bold'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                          }`}
                        >
                          <span className="truncate">{esc.nome}</span>
                          {esc.id === currentEscritorioId && <UserCheck className="h-3.5 w-3.5 shrink-0" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {onNavigate && (
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onNavigate('settings');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-xl transition-colors font-medium btn-tactile"
                  >
                    <SettingsIcon className="h-4 w-4 text-brand-500" />
                    <span>Configurações do Escritório</span>
                  </button>
                )}
              </div>

              <div className="border-t border-slate-100 dark:border-white/[0.08] pt-2">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors font-semibold btn-tactile"
                >
                  <LogOut className="h-4 w-4" /> Sair da Sessão
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
