import React, { useState } from 'react';
import {
  Calendar,
  Headphones,
  UserCheck,
  Settings,
  FileText,
  LayoutDashboard,
  FolderLock,
  UserCog,
  DollarSign,
  Kanban,
  Users,
  Briefcase,
  FileCheck2,
  BarChart3,
  ShieldAlert,
  CheckSquare,
  Scale,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { useAuth } from '../../context/AuthContext';
import { BrandLogo } from '../common/BrandLogo';
import { Avatar } from '../common/Avatar';

export function Sidebar({
  currentTab,
  setCurrentTab,
  currentView,
  onChangeView,
  isOpen,
  setIsOpen,
  isMobileOpen,
  onCloseMobile,
}) {
  const { leads, tasks, appointments } = useCRM();
  const { currentUser, permissions } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const activeTabId = currentTab || currentView || 'dashboard';
  const handleSelectTab = setCurrentTab || onChangeView || (() => {});
  const handleCloseMobile = onCloseMobile || (setIsOpen ? () => setIsOpen(false) : () => {});
  const mobileVisible = isMobileOpen !== undefined ? isMobileOpen : isOpen;

  const hotLeadsCount = leads.filter(
    l => l.temperature === 'hot' && l.stage !== 'contrato_fechado' && l.stage !== 'perdido'
  ).length;
  const pendingTasksCount = tasks.filter(t => t.status === 'pending').length;

  // Lista de abas rigorosamente organizada em ORDEM ALFABÉTICA
  const navItems = [
    { id: 'agenda', label: 'Agenda & Audiências', icon: Calendar, badge: appointments.length > 0 ? appointments.length : null },
    { id: 'attendance', label: 'Atendimentos & Contatos', icon: Headphones },
    { id: 'clients', label: 'Base de Clientes', icon: UserCheck },
    { id: 'settings', label: 'Configurações', icon: Settings },
    { id: 'contracts', label: 'Contratos & Minutas', icon: FileText },
    { id: 'dashboard', label: 'Dashboard Executivo', icon: LayoutDashboard },
    { id: 'documents', label: 'Documentos & GED', icon: FolderLock },
    { id: 'team', label: 'Equipe & Advogados', icon: UserCog },
    { id: 'financial', label: 'Financeiro & Honorários', icon: DollarSign },
    { id: 'kanban', label: 'Funil Comercial (Kanban)', icon: Kanban, badge: hotLeadsCount > 0 ? `${hotLeadsCount} 🔥` : null, badgeColor: 'bg-rose-500/90 text-white shadow-xs' },
    { id: 'leads', label: 'Lista de Leads', icon: Users },
    { id: 'processes', label: 'Processos & Dossiês', icon: Briefcase },
    { id: 'proposals', label: 'Propostas Comerciais', icon: FileCheck2 },
    { id: 'reports', label: 'Relatórios & BI', icon: BarChart3 },
    { id: 'security', label: 'Segurança & LGPD', icon: ShieldAlert },
    { id: 'tasks', label: 'Tarefas & Prazos', icon: CheckSquare, badge: pendingTasksCount > 0 ? pendingTasksCount : null, badgeColor: 'bg-amber-500/90 text-white shadow-xs' },
  ];

  // Filtragem de permissões
  const allowedNavItems = navItems.filter(item => {
    if (item.id === 'security') return permissions?.canAccessSecurity;
    if (item.id === 'settings') return permissions?.canAccessSettings;
    if (item.id === 'financial') return permissions?.canAccessFinancial;
    if (item.id === 'reports') return permissions?.canAccessReports;
    if (item.id === 'team') return permissions?.canAccessTeam;
    if (item.id === 'processes') return permissions?.canAccessProcesses;
    if (item.id === 'contracts') return permissions?.canAccessContracts;
    if (item.id === 'documents') return permissions?.canAccessDocuments;
    return true;
  });

  const handleNavClick = (viewId) => {
    handleSelectTab(viewId);
    if (handleCloseMobile) handleCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileVisible && (
        <div
          onClick={handleCloseMobile}
          className="fixed inset-0 z-40 bg-obsidian-950/80 backdrop-blur-md lg:hidden transition-opacity"
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
          <div className={`flex items-center gap-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.05] p-2.5 transition-all ${
            collapsed ? 'justify-center p-2' : ''
          }`}>
            <Avatar
              src={currentUser?.avatar}
              name={currentUser?.name || 'Dra. Helena Prado'}
              size="sm"
              status="online"
            />
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <div className="truncate text-xs font-bold text-slate-900 dark:text-white">
                  {currentUser?.name || 'Dra. Helena Prado'}
                </div>
                <div className="truncate text-[10px] text-slate-500 dark:text-slate-400 capitalize">
                  {currentUser?.role === 'admin' ? 'Sócia Administradora' : currentUser?.role === 'lawyer' ? 'Advogado(a)' : 'Comercial'}
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
