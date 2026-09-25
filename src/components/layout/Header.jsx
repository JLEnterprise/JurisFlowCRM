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
  Sparkles,
  MessageSquare,
  User,
  Settings as SettingsIcon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useCRM } from '../../context/CRMContext';
import { NotificationCenter } from './NotificationCenter';
import { PeriodFilter } from '../common/PeriodFilter';

// Nome curto e completo de cada página, mostrado no topo
const PAGE_NAMES = {
  copilot: 'Copiloto IA',
  account: 'Configurações',
  dashboard: 'Dashboard',
  kanban: 'Funil comercial',
  leads: 'Funil comercial',
  clients: 'Clientes',
  proposals: 'Propostas',
  contracts: 'Contratos & minutas',
  processes: 'Processos',
  agenda: 'Agenda & audiências',
  tasks: 'Prazos & tarefas',
  attendance: 'Atendimentos',
  documents: 'Documentos',
  financial: 'Contas & honorários',
  reports: 'Relatórios',
  team: 'Equipe',
  security: 'Auditoria & LGPD',
  settings: 'Escritório',
};
import { Avatar } from '../common/Avatar';
import { UserProfileModal } from '../common/UserProfileModal';

export function Header({
  onOpenSearch,
  onOpenCopilot,
  onOpenWhatsApp,
  onToggleSidebar,
  onToggleMobileSidebar,
  currentTab,
  currentViewTitle,
  onNavigate,
  onOpenProfile,
}) {
  const { currentUser, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { currentEscritorio, escritorios = [], switchEscritorio, currentEscritorioId, officeSettings } = useCRM();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [localProfileModalOpen, setLocalProfileModalOpen] = useState(false);
  const userMenuRef = useRef(null);

  const handleOpenProfileModal = () => {
    setShowUserMenu(false);
    if (onOpenProfile) {
      onOpenProfile();
    } else {
      setLocalProfileModalOpen(true);
    }
  };

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

  // Relógio do topo: atualiza a cada 15 s
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(timer);
  }, []);
  const dateLabel = now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  const timeLabel = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

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
    <header className="app-header sticky top-0 z-30 flex h-[4.5rem] w-full items-center justify-between gap-4 app-glass bg-white/80 px-4 sm:px-6 lg:px-8 transition-colors">
      {/* Esquerda: menu (celular) e título da tela, em estilo editorial */}
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={toggleSidebarFn}
          className="header-icon-btn lg:hidden"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        {/* Nome da página (curto e completo) + usuário, data e hora; substitui os títulos de seção dentro das telas */}
        <div className="min-w-0">
          <h1 className="truncate font-display text-lg sm:text-xl font-semibold leading-tight text-slate-900 dark:text-white">
            {PAGE_NAMES[currentTab] || 'Dashboard'}
          </h1>
          <p className="flex items-center gap-2 whitespace-nowrap text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-gold-700/80 dark:text-gold-300/60 mt-0.5">
            <span className="h-1 w-1 rotate-45 bg-gold-500/70" aria-hidden="true" />
            <span className="max-w-[10rem] truncate normal-case tracking-[0.06em] text-slate-500 dark:text-slate-300">{currentUser?.name || 'Usuário'}</span>
            <span className="text-slate-300 dark:text-white/20">·</span>
            <span className="hidden sm:inline first-letter:uppercase">{dateLabel}</span>
            <span className="hidden sm:inline text-slate-300 dark:text-white/20">·</span>
            <span className="tabular-nums">{timeLabel}</span>
          </p>
        </div>
      </div>

      {/* Direita: busca, período, ações e perfil */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {/* Busca global */}
        <button
          onClick={onOpenSearch}
          className="hidden xl:flex w-60 2xl:w-72 items-center gap-2 rounded-full bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.07] px-4 py-2 text-xs text-slate-400 hover:border-gold-500/40 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        >
          <Search className="h-3.5 w-3.5 shrink-0" />
          <span className="flex-1 truncate text-left">Buscar clientes, processos...</span>
          <kbd className="rounded-md px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 border border-slate-200 dark:border-white/10">
            Ctrl K
          </kbd>
        </button>
        <button onClick={onOpenSearch} className="header-icon-btn xl:hidden" aria-label="Buscar" data-tip="Buscar">
          <Search className="h-[18px] w-[18px]" />
        </button>

        {/* Filtro de período (vale para o funil e as listas) */}
        <PeriodFilter className="hidden lg:block" />

        {/* Ações rápidas: mesmo estilo discreto, a cor aparece só no hover */}
        <div className="flex items-center gap-0.5 sm:rounded-full sm:border sm:border-slate-200 sm:dark:border-white/[0.07] sm:px-1 sm:py-0.5">
          {onOpenWhatsApp && (
            <button
              onClick={() => onOpenWhatsApp()}
              className="header-icon-btn hover:!text-emerald-600 dark:hover:!text-emerald-400"
              aria-label="WhatsApp"
              data-tip="WhatsApp"
            >
              <MessageSquare className="h-[18px] w-[18px]" />
            </button>
          )}

          <NotificationCenter />

          <button
            onClick={toggleTheme}
            className="header-icon-btn"
            aria-label={isDark ? 'Tema claro' : 'Tema escuro'}
            data-tip={isDark ? 'Tema claro' : 'Tema escuro'}
          >
            {isDark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
          </button>
        </div>

        <span className="hidden sm:block h-6 w-px bg-slate-200 dark:bg-white/[0.08] mx-1" aria-hidden="true" />

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
            {/* O nome já aparece à esquerda; aqui fica só a foto com o menu da conta */}
            <ChevronDown className="hidden h-3.5 w-3.5 text-slate-400 sm:block" />
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
                
                {/* Identificação do Escritório / Banca - Clicável para edição */}
                <button
                  type="button"
                  onClick={handleOpenProfileModal}
                  className="mt-2 w-full flex items-center justify-between gap-1.5 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors text-[11px] font-semibold text-slate-700 dark:text-slate-300 text-left group"
                  title="Clique para editar o nome da Banca / Escritório"
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <Building2 className="h-3.5 w-3.5 text-gold-500 shrink-0" />
                    <span className="truncate">{currentEscritorio?.nome || officeSettings?.officeName || officeSettings?.tradeName || currentUser?.firmName || 'Meu Escritório'}</span>
                  </div>
                  <span className="text-[10px] text-brand-600 dark:text-gold-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    Alterar
                  </span>
                </button>
              </div>

              {/* Informações da Conta */}
              <div className="mb-2 px-1 space-y-1.5">
                {/* Se houver múltiplas filiais do próprio escritório, permite alternar */}
                {(() => {
                  const myBranches = (escritorios || []).filter(esc => esc && (esc.id === currentEscritorioId || (esc.parent_id && esc.parent_id === currentEscritorioId)));
                  if (myBranches.length <= 1) return null;
                  return (
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06] space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Filial Ativa:
                      </span>
                      <div className="space-y-1 max-h-28 overflow-y-auto">
                        {myBranches.map(esc => (
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
                  );
                })()}

                {/* Botão Meu Perfil Pessoal & Foto */}
                <button
                  onClick={handleOpenProfileModal}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-xl transition-colors font-semibold btn-tactile"
                >
                  <User className="h-4 w-4 text-brand-600 dark:text-gold-400" />
                  <span>Meu Perfil & Foto</span>
                </button>

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

      {/* Modal de Perfil Pessoal & Foto (Fallback local caso onOpenProfile não seja passado) */}
      <UserProfileModal
        isOpen={localProfileModalOpen}
        onClose={() => setLocalProfileModalOpen(false)}
      />
    </header>
  );
}
