import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  FileText,
  FileCheck,
  CheckSquare,
  DollarSign,
  BarChart3,
  UserCog,
  Shield,
  Settings,
  X,
  ChevronLeft,
  ChevronRight,
  FolderLock,
  Gavel,
  PhoneCall,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCRM } from '../../context/CRMContext';
import { Avatar } from '../common/Avatar';
import { BrandLogo } from '../common/BrandLogo';
import { UserProfileModal } from '../common/UserProfileModal';

export function Sidebar({
  currentTab,
  setCurrentTab,
  isOpen: mobileOpen,
  setIsOpen: setMobileOpen,
  onOpenCopilot,
}) {
  const { currentUser, permissions } = useAuth();
  const { tasks = [], appointments = [], leads = [] } = useCRM();
  const [collapsed, setCollapsed] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const pendingTasksCount = (tasks || []).filter(t => t && t.status !== 'completed').length;
  const newLeadsCount = (leads || []).filter(l => l && (l.stage === 'novo_lead' || l.stage === 'novo')).length;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard Executivo', icon: LayoutDashboard, category: 'Geral', show: true },
    { id: 'kanban', label: 'Funil Comercial', icon: Users, category: 'Comercial', badge: newLeadsCount > 0 ? `${newLeadsCount}` : null, badgeColor: 'bg-brand-500 text-white', show: true },
    { id: 'clients', label: 'Clientes & Contatos', icon: UserCheck, category: 'Comercial', show: true },
    { id: 'proposals', label: 'Propostas de Honorários', icon: FileText, category: 'Comercial', show: true },
    { id: 'contracts', label: 'Contratos & Minutas', icon: FileCheck, category: 'Comercial', show: true },
    { id: 'processes', label: 'Processos Judiciais (CNJ)', icon: Gavel, category: 'Jurídico', show: permissions?.canAccessProcesses },
    { id: 'agenda', label: 'Agenda & Audiências', icon: Calendar, category: 'Jurídico', show: true },
    { id: 'tasks', label: 'Prazos Fatais & Tarefas', icon: CheckSquare, category: 'Jurídico', badge: pendingTasksCount > 0 ? `${pendingTasksCount}` : null, badgeColor: 'bg-rose-500 text-white', show: true },
    { id: 'attendance', label: 'Atendimentos & WhatsApp', icon: PhoneCall, category: 'Atendimento', show: true },
    { id: 'documents', label: 'Documentos & GED', icon: FolderLock, category: 'Documentos', show: true },
    { id: 'financial', label: 'Financeiro & Honorários', icon: DollarSign, category: 'Financeiro', show: permissions?.canAccessFinancial },
    { id: 'reports', label: 'Relatórios & Inteligência', icon: BarChart3, category: 'Gestão', show: true },
    { id: 'team', label: 'Equipe & Performance', icon: UserCog, category: 'Gestão', show: permissions?.canAccessTeam },
    { id: 'security', label: 'Auditoria & LGPD', icon: Shield, category: 'Configuração', show: permissions?.canAccessSecurity },
    { id: 'settings', label: 'Configurações', icon: Settings, category: 'Configuração', show: permissions?.canAccessSettings },
  ];

  const allowedNavItems = navItems.filter(item => item.show);

  const activeTabId = currentTab === 'leads' ? 'kanban' : currentTab;

  const handleCloseMobile = () => {
    if (setMobileOpen) setMobileOpen(false);
  };

  const handleNavClick = (tabId) => {
    setCurrentTab(tabId);
    handleCloseMobile();
  };

  const mobileVisible = !!mobileOpen;

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileVisible && (
        <div
          onClick={handleCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs transition-opacity lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-slate-200/80 dark:border-white/[0.08] bg-white/95 dark:bg-[#0b0f17]/95 backdrop-blur-2xl transition-all duration-300 ease-in-out lg:static lg:translate-x-0 ${
          collapsed ? 'w-20' : 'w-64'
        } ${
          mobileVisible ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo & Executive Brand Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-200/80 dark:border-white/[0.08]">
          <button
            onClick={() => handleNavClick('dashboard')}
            className="flex items-center gap-3 text-left focus:outline-none group overflow-hidden"
          >
            <BrandLogo
              className="h-10 w-10"
              iconSize="h-5 w-5"
              showText={!collapsed}
            />
          </button>

          {/* Botão de Fechar no Mobile */}
          <button
            onClick={handleCloseMobile}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 lg:hidden rounded-lg hover:bg-slate-100 dark:hover:bg-white/5"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5">
          {allowedNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTabId === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                title={collapsed ? item.label : undefined}
                className={`group relative flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-200 btn-tactile ${
                  isActive
                    ? 'bg-gradient-to-r from-brand-600 to-brand-700 text-white shadow-lg shadow-brand-600/25 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.04] hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {/* Active Indicator Bar */}
                {isActive && (
                  <span className="absolute left-0 inset-y-2 w-1 rounded-r-full bg-gold-400 shadow-glow-gold" />
                )}

                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-4 w-4 shrink-0 transition-transform duration-300 group-hover:scale-110 ${
                      isActive ? 'text-white' : 'text-slate-400 dark:text-slate-400 group-hover:text-brand-500 dark:group-hover:text-gold-400'
                    }`}
                  />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </div>

                {!collapsed && item.badge && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      isActive ? 'bg-white/20 text-white' : item.badgeColor || 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* BANNER COPILOTO IA NA SIDEBAR */}
          {!collapsed && onOpenCopilot && (
            <div className="pt-2">
              <button
                onClick={() => {
                  onOpenCopilot('chat');
                  handleCloseMobile();
                }}
                className="w-full p-3 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-600/15 to-brand-600/10 border border-amber-400/30 text-left transition-all hover:border-amber-400 hover:shadow-sm group"
              >
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-bold text-xs mb-1">
                  <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />
                  <span>Copiloto & Chatbot IA</span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                  Tire dúvidas, consulte clientes e processos, calcule prazos e redija minutas.
                </p>
              </button>
            </div>
          )}
        </div>

        {/* Collapse button (Desktop only) */}
        <div className="hidden lg:flex items-center justify-between px-3 py-2 border-t border-slate-200/80 dark:border-white/[0.08]">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 p-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
            title={collapsed ? "Expandir Menu" : "Recolher (Modo de Foco Imersivo)"}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span className="text-[11px] font-medium">Modo Foco Imersivo</span>
              </>
            )}
          </button>
        </div>

        {/* User profile footer */}
        <div className="border-t border-slate-200/80 dark:border-white/[0.08] p-3">
          <button
            type="button"
            onClick={() => setProfileModalOpen(true)}
            className={`w-full flex items-center gap-3 rounded-2xl bg-slate-50 hover:bg-emerald-500/10 dark:bg-white/[0.03] dark:hover:bg-emerald-500/10 border border-slate-200/60 hover:border-emerald-500/30 dark:border-white/[0.05] dark:hover:border-emerald-500/30 p-2.5 transition-all text-left group cursor-pointer ${
              collapsed ? 'justify-center p-2' : ''
            }`}
            title="Editar meu perfil, foto e informações pessoais"
          >
            <Avatar
              src={currentUser?.avatar}
              name={currentUser?.name || 'Dra. Helena Prado'}
              size="sm"
              status="online"
            />
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <div className="truncate text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors">
                  {currentUser?.name || 'Dra. Helena Prado'}
                </div>
                <div className="truncate text-[10px] text-slate-500 dark:text-slate-400">
                  {currentUser?.title || (currentUser?.role === 'admin' || currentUser?.roles?.includes('admin') ? 'Sócia Administradora' : currentUser?.role === 'lawyer' || currentUser?.roles?.includes('lawyer') ? 'Advogado(a)' : 'Comercial')}
                </div>
              </div>
            )}
          </button>
        </div>
      </aside>

      {/* Modal de Perfil Pessoal */}
      <UserProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />
    </>
  );
}
