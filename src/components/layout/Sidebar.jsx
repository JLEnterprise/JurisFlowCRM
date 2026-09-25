import React, { useEffect, useState } from 'react';
import {
  Briefcase,
  Building2,
  ChevronDown,
  Scale,
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
import logoEmblema from '../../assets/logo-emblema.png';
import { UserProfileModal } from '../common/UserProfileModal';

const BADGE_TONES = {
  brand: 'bg-brand-500 text-white',
  rose: 'bg-rose-500 text-white',
};

// Item de menu: nível principal (com ícone e destaque azul) ou subitem (mais leve, dentro do grupo)
function NavItem({ item, active, collapsed = false, sub = false, onClick }) {
  const Icon = item.icon;
  const badge = Number(item.badge) || 0;

  if (sub) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-current={active ? 'page' : undefined}
        className={`relative flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs transition-colors ${
          active
            ? 'bg-gold-500/10 font-semibold text-slate-900 dark:text-gold-100'
            : 'font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.04] hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        {active && <span className="absolute -left-[11px] top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-full bg-gold-500" />}
        <span className="truncate">{item.label}</span>
        {badge > 0 && (
          <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${BADGE_TONES[item.badgeTone] || 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300'}`}>
            {badge}
          </span>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      aria-current={active ? 'page' : undefined}
      className={`group relative flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-200 btn-tactile ${
        active
          ? 'bg-gradient-to-r from-brand-600 to-brand-700 text-white shadow-lg shadow-brand-600/25 font-bold'
          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.04] hover:text-slate-900 dark:hover:text-white'
      }`}
    >
      {active && <span className="absolute left-0 inset-y-2 w-1 rounded-r-full bg-gold-400" />}
      <span className="flex items-center gap-3">
        <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-white' : 'text-slate-400 group-hover:text-gold-500 dark:group-hover:text-gold-400'}`} />
        {!collapsed && <span className="truncate">{item.label}</span>}
      </span>
      {!collapsed && badge > 0 && (
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${active ? 'bg-white/20 text-white' : BADGE_TONES[item.badgeTone] || 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300'}`}>
          {badge}
        </span>
      )}
    </button>
  );
}

export function Sidebar({
  currentTab,
  setCurrentTab,
  isOpen: mobileOpen,
  setIsOpen: setMobileOpen,
  onOpenCopilot,
  onOpenProfile,
}) {
  const { currentUser, permissions } = useAuth();
  const { tasks = [], appointments = [], leads = [], officeSettings } = useCRM();
  const [collapsed, setCollapsed] = useState(false);
  const [localProfileModalOpen, setLocalProfileModalOpen] = useState(false);

  const handleOpenProfileModal = () => {
    if (onOpenProfile) {
      onOpenProfile();
    } else {
      setLocalProfileModalOpen(true);
    }
  };

  const pendingTasksCount = (tasks || []).filter(t => t && t.status !== 'completed').length;
  const newLeadsCount = (leads || []).filter(l => l && (l.stage === 'novo_lead' || l.stage === 'novo')).length;

  // Menu em grupos: itens de uso diário ficam soltos; o resto entra em submenus por área.
  const navTree = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, show: true },
    {
      id: 'grp_comercial', label: 'Comercial', icon: Briefcase, children: [
        { id: 'kanban', label: 'Funil Comercial', icon: Users, badge: newLeadsCount, badgeTone: 'brand', show: true },
        { id: 'proposals', label: 'Propostas', icon: FileText, show: true },
        { id: 'attendance', label: 'Atendimentos', icon: PhoneCall, show: true },
      ],
    },
    { id: 'clients', label: 'Clientes', icon: UserCheck, show: true },
    {
      id: 'grp_juridico', label: 'Jurídico', icon: Scale, children: [
        { id: 'processes', label: 'Processos', icon: Gavel, show: permissions?.canAccessProcesses },
        { id: 'contracts', label: 'Contratos & Minutas', icon: FileCheck, show: permissions?.canAccessContracts },
        // Documentos saiu do menu: os anexos ficam direto na ficha do cliente
      ],
    },
    {
      id: 'grp_agenda', label: 'Agenda & Prazos', icon: Calendar, children: [
        { id: 'agenda', label: 'Agenda & Audiências', icon: Calendar, show: true },
        { id: 'tasks', label: 'Prazos & Tarefas', icon: CheckSquare, badge: pendingTasksCount, badgeTone: 'rose', show: true },
      ],
    },
    {
      id: 'grp_financeiro', label: 'Financeiro', icon: DollarSign, children: [
        { id: 'financial', label: 'Contas & Honorários', icon: DollarSign, show: permissions?.canAccessFinancial },
        { id: 'reports', label: 'Relatórios', icon: BarChart3, show: permissions?.canAccessReports },
      ],
    },
    {
      id: 'grp_escritorio', label: 'Escritório', icon: Building2, children: [
        { id: 'team', label: 'Equipe', icon: UserCog, show: permissions?.canAccessTeam },
        { id: 'security', label: 'Auditoria & LGPD', icon: Shield, show: permissions?.canAccessSecurity },
        { id: 'settings', label: 'Configurações', icon: Settings, show: permissions?.canAccessSettings },
      ],
    },
  ];

  // Aplica permissões; grupo com um único item permitido vira item solto
  const visibleTree = navTree
    .map(node => {
      if (!node.children) return node.show ? node : null;
      const children = node.children.filter(c => c.show);
      if (children.length === 0) return null;
      if (children.length === 1) return children[0];
      return { ...node, children };
    })
    .filter(Boolean);

  const activeTabId = currentTab === 'leads' ? 'kanban' : currentTab;
  const activeGroupId = visibleTree.find(n => n.children?.some(c => c.id === activeTabId))?.id;

  // Grupos abertos: lembra entre sessões e abre sozinho o grupo da tela atual
  const [openGroups, setOpenGroups] = useState(() => {
    try { return JSON.parse(window.localStorage.getItem('jurisflow_menu_grupos') || '[]'); } catch { return []; }
  });
  useEffect(() => {
    if (activeGroupId && !openGroups.includes(activeGroupId)) setOpenGroups(prev => [...prev, activeGroupId]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGroupId]);
  useEffect(() => {
    try { window.localStorage.setItem('jurisflow_menu_grupos', JSON.stringify(openGroups)); } catch { /* sem storage */ }
  }, [openGroups]);

  const toggleGroup = (groupId) => {
    if (collapsed) {
      // Menu recolhido: expande e mostra o grupo
      setCollapsed(false);
      setOpenGroups(prev => (prev.includes(groupId) ? prev : [...prev, groupId]));
      return;
    }
    setOpenGroups(prev => (prev.includes(groupId) ? prev.filter(g => g !== groupId) : [...prev, groupId]));
  };

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
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-slate-200/80 dark:border-white/[0.08] app-glass bg-white/80 max-lg:bg-white/95 max-lg:dark:!bg-[#070b14]/95 transition-all duration-300 ease-in-out lg:static lg:translate-x-0 ${
          collapsed ? 'w-20' : 'w-64'
        } ${
          mobileVisible ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo & Executive Brand Header */}
        <div className="flex h-[4.5rem] shrink-0 items-center justify-between px-4 border-b border-slate-200/80 dark:border-white/[0.08]">
          <button
            onClick={() => handleNavClick('dashboard')}
            className="flex items-center gap-3 text-left focus:outline-none group overflow-hidden"
          >
            {officeSettings?.logoUrl ? (
              <BrandLogo
                className="h-10 w-10"
                iconSize="h-5 w-5"
                showText={!collapsed}
              />
            ) : (
              <>
                <img
                  src={logoEmblema}
                  alt="JurisFlow"
                  draggable="false"
                  className="h-11 w-11 shrink-0 object-contain drop-shadow-[0_0_10px_rgba(212,175,55,0.35)] transition-transform duration-500 group-hover:scale-105"
                />
                {!collapsed && (
                  <div className="min-w-0">
                    <div className="brand-wordmark text-[1.25rem] tracking-[0.12em]">JurisFlow</div>
                    <div className="mt-1 text-[0.55rem] font-semibold uppercase tracking-[0.34em] text-slate-400 dark:text-gold-200/60 truncate">
                      CRM Jurídico
                    </div>
                  </div>
                )}
              </>
            )}
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
          {visibleTree.map((node) => {
            if (!node.children) {
              return (
                <NavItem
                  key={node.id}
                  item={node}
                  active={activeTabId === node.id}
                  collapsed={collapsed}
                  onClick={() => handleNavClick(node.id)}
                />
              );
            }

            const GroupIcon = node.icon;
            const isOpen = openGroups.includes(node.id) && !collapsed;
            const hasActive = node.id === activeGroupId;
            const groupBadge = node.children.reduce((acc, c) => acc + (Number(c.badge) || 0), 0);

            return (
              <div key={node.id}>
                <button
                  type="button"
                  onClick={() => toggleGroup(node.id)}
                  aria-expanded={isOpen}
                  title={collapsed ? node.label : undefined}
                  className={`group relative flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-colors ${
                    hasActive
                      ? 'text-slate-900 dark:text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.04] hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <GroupIcon className={`h-4 w-4 shrink-0 ${hasActive ? 'text-gold-500 dark:text-gold-400' : 'text-slate-400 group-hover:text-gold-500 dark:group-hover:text-gold-400'}`} />
                    {!collapsed && <span className="truncate">{node.label}</span>}
                  </span>
                  {!collapsed && (
                    <span className="flex items-center gap-1.5">
                      {!isOpen && groupBadge > 0 && (
                        <span className="rounded-full bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                          {groupBadge}
                        </span>
                      )}
                      <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? '' : '-rotate-90'}`} />
                    </span>
                  )}
                  {collapsed && hasActive && (
                    <span className="absolute left-0 inset-y-2 w-1 rounded-r-full bg-gold-400" />
                  )}
                </button>

                {isOpen && (
                  <div className="relative ml-[1.35rem] mt-0.5 mb-1 space-y-0.5 border-l border-slate-200 dark:border-white/[0.08] pl-2.5 animate-fade-in">
                    {node.children.map((child) => (
                      <NavItem
                        key={child.id}
                        item={child}
                        sub
                        active={activeTabId === child.id}
                        onClick={() => handleNavClick(child.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Copiloto IA: atalho discreto no fim da lista */}
          {onOpenCopilot && (
            <div className="pt-2 mt-2 border-t border-slate-200/80 dark:border-white/[0.06]">
              <button
                type="button"
                onClick={() => {
                  onOpenCopilot('chat');
                  handleCloseMobile();
                }}
                title={collapsed ? 'Copiloto IA' : undefined}
                className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-gold-500/[0.08] hover:text-slate-900 dark:hover:text-gold-100 transition-colors"
              >
                <Sparkles className="h-4 w-4 shrink-0 text-gold-500 dark:text-gold-400" />
                {!collapsed && <span className="truncate">Copiloto IA</span>}
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
            onClick={handleOpenProfileModal}
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

      {/* Modal de Perfil Pessoal (Fallback local) */}
      <UserProfileModal
        isOpen={localProfileModalOpen}
        onClose={() => setLocalProfileModalOpen(false)}
      />
    </>
  );
}
