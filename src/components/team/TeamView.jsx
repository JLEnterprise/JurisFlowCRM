import React, { useState } from 'react';
import {
  UserCog,
  Plus,
  Mail,
  Phone,
  Shield,
  Award,
  TrendingUp,
  Percent,
  CheckCircle2,
  DollarSign,
  Scale,
  Edit,
  Trash2,
  Camera,
  Upload,
  Briefcase,
  X,
  Search,
  Filter,
  Check,
  Tag,
  Users,
  Link as LinkIcon,
  Copy
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCRM } from '../../context/CRMContext';
import { storageService } from '../../services/storageService';
import { formatCurrency } from '../../utils/formatters';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { ConfirmModal } from '../common/ConfirmModal';
import { Avatar } from '../common/Avatar';
import { compressAvatarImage } from '../../utils/imageUtils';

// Lista de Cargos e Especialidades Jurídicas Sugeridas
export const PREDEFINED_JOB_TITLES = [
  'Sócia Administradora',
  'Sócio Diretor',
  'Advogado(a) Sênior',
  'Advogado(a) Pleno',
  'Advogado(a) Júnior',
  'Advogado(a) Trabalhista',
  'Advogado(a) Cível & Contratos',
  'Advogado(a) Tributarista',
  'Advogado(a) Criminalista',
  'Advogado(a) Previdenciarista',
  'Advogado(a) Família & Sucessões',
  'Advogado(a) Empresarial',
  'Advogado(a) Imobiliário',
  'Controller Jurídico & Financeiro',
  'Head Comercial / Gestor(a)',
  'Consultor(a) Comercial / SDR',
  'Secretário(a) Executivo(a)',
  'Estagiário(a) de Direito',
  'TI & Administrador de Sistemas',
  'Conciliador(a) / Mediador(a)'
];

// Perfis de Acesso ao Sistema (RBAC)
export const SYSTEM_ROLES = [
  { id: 'admin', label: 'Sócia Administradora', desc: 'Acesso pleno a governança, financeiro e configurações', color: 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800' },
  { id: 'senior_lawyer', label: 'Advogado(a) Sênior', desc: 'Coordenação jurídica, processos, prazos e equipe', color: 'bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border-cyan-300 dark:border-cyan-800' },
  { id: 'lawyer', label: 'Advogado(a) Pleno / Associado', desc: 'Processos, contratos, agenda, tarefas e clientes', color: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800' },
  { id: 'financial', label: 'Controller / Financeiro', desc: 'Honorários, parcelas, faturamento e relatórios', color: 'bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-300 dark:border-teal-800' },
  { id: 'sales_manager', label: 'Head Comercial', desc: 'Gestão de funil, metas de vendas e propostas', color: 'bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-800' },
  { id: 'sales', label: 'Comercial / SDR', desc: 'Atendimentos, novos leads e propostas', color: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800' },
  { id: 'secretary', label: 'Secretaria & GED', desc: 'Agenda, recepção de clientes e documentos', color: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700' },
  { id: 'dev', label: 'Dev / TI', desc: 'Engenharia, banco de dados Supabase e acesso irrestrito', color: 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-800' },
];

export function TeamView() {
  const { users = [], createUser, updateUser, deleteUser, currentUser } = useAuth();
  const { leads = [], contracts = [], showToast, logActivity } = useCRM();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterTitle, setFilterTitle] = useState('');
  const [filterRole, setFilterRole] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // Estado do formulário de colaborador
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'lawyer',
    roles: ['lawyer'],
    title: 'Advogado(a) Associado(a)',
    titles: ['Advogado(a) Associado(a)'],
    oab: 'OAB/SP ',
    phone: '',
    avatar: '',
  });

  const [customTitleInput, setCustomTitleInput] = useState('');

  const handleOpenCreateModal = () => {
    setEditingUserId(null);
    setFormData({
      name: '',
      email: '',
      role: 'lawyer',
      roles: ['lawyer'],
      title: 'Advogado(a) Associado(a)',
      titles: ['Advogado(a) Associado(a)'],
      oab: 'OAB/SP ',
      phone: '(11) 98888-0000',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
    });
    setCustomTitleInput('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (member) => {
    setEditingUserId(member.id);

    // Normaliza títulos/cargos múltiplos
    let memberTitles = [];
    if (Array.isArray(member.titles) && member.titles.length > 0) {
      memberTitles = member.titles;
    } else if (member.title) {
      memberTitles = member.title.split(/[•,]/).map(t => t.trim()).filter(Boolean);
    }
    if (memberTitles.length === 0) memberTitles = ['Advogado(a)'];

    // Normaliza papéis/roles múltiplos
    let memberRoles = [];
    if (Array.isArray(member.roles) && member.roles.length > 0) {
      memberRoles = member.roles;
    } else if (member.role) {
      memberRoles = [member.role];
    }
    if (memberRoles.length === 0) memberRoles = ['lawyer'];

    const primaryRole = memberRoles.includes('dev')
      ? 'dev'
      : memberRoles.includes('admin')
      ? 'admin'
      : (memberRoles[0] || 'lawyer');

    setFormData({
      name: member.name || '',
      email: member.email || '',
      role: primaryRole,
      roles: memberRoles,
      title: memberTitles.join(' • '),
      titles: memberTitles,
      oab: member.oab || '',
      phone: member.phone || '',
      avatar: member.avatar || '',
    });
    setCustomTitleInput('');
    setIsModalOpen(true);
  };

  // Funções de manipulação de múltiplos cargos
  const addTitle = (titleToAdd) => {
    const trimmed = String(titleToAdd || '').trim();
    if (!trimmed) return;
    if (formData.titles.includes(trimmed)) {
      showToast(`O cargo "${trimmed}" já está atribuído.`, 'warning');
      return;
    }
    const nextTitles = [...formData.titles, trimmed];
    setFormData(prev => ({
      ...prev,
      titles: nextTitles,
      title: nextTitles.join(' • '),
    }));
    setCustomTitleInput('');
  };

  const removeTitle = (titleToRemove) => {
    const nextTitles = formData.titles.filter(t => t !== titleToRemove);
    if (nextTitles.length === 0) {
      nextTitles.push('Colaborador');
    }
    setFormData(prev => ({
      ...prev,
      titles: nextTitles,
      title: nextTitles.join(' • '),
    }));
  };

  // Funções de manipulação de múltiplos perfis de acesso (RBAC)
  const toggleRole = (roleId) => {
    let nextRoles = [...formData.roles];
    if (nextRoles.includes(roleId)) {
      if (nextRoles.length === 1) {
        showToast('O funcionário precisa ter ao menos 1 perfil de acesso ativo.', 'warning');
        return;
      }
      nextRoles = nextRoles.filter(r => r !== roleId);
    } else {
      nextRoles.push(roleId);
    }

    const primaryRole = nextRoles.includes('dev')
      ? 'dev'
      : nextRoles.includes('admin')
      ? 'admin'
      : (nextRoles[0] || 'lawyer');

    setFormData(prev => ({
      ...prev,
      roles: nextRoles,
      role: primaryRole,
    }));
  };

  const handleSaveUser = (e) => {
    try {
      if (e) {
        if (typeof e.preventDefault === 'function') e.preventDefault();
        if (typeof e.stopPropagation === 'function') e.stopPropagation();
      }

    const targetId = editingUserId;
    const editingMember = targetId ? users.find(u => u.id === targetId) : null;
    const cleanName = (formData.name || '').trim() || editingMember?.name || 'Colaborador';
    const cleanEmail = (formData.email || '').trim() || editingMember?.email || `colaborador_${Date.now()}@jurisflow.adv.br`;

    const assignedRoles = Array.isArray(formData.roles) && formData.roles.length > 0 ? formData.roles : ['lawyer'];
    const primaryRole = assignedRoles.includes('dev')
      ? 'dev'
      : assignedRoles.includes('admin')
      ? 'admin'
      : (formData.role || assignedRoles[0] || 'lawyer');

    const assignedTitles = Array.isArray(formData.titles) && formData.titles.length > 0 ? formData.titles : ['Colaborador'];

    const finalData = {
      ...formData,
      name: cleanName,
      email: cleanEmail,
      titles: assignedTitles,
      title: assignedTitles.join(' • '),
      roles: assignedRoles,
      role: primaryRole,
    };

    // 1. FECHA O MODAL IMEDIATAMENTE (Zero lag / Zero espera)
    setIsModalOpen(false);
    setEditingUserId(null);

      // 2. Salva e sincroniza de forma segura
      if (targetId) {
        updateUser(targetId, finalData);
        if (logActivity) logActivity('Alteração de Colaborador', cleanName, `Cargos atualizados: ${finalData.title}`);
        showToast(`Colaborador "${cleanName}" atualizado com sucesso!`, 'success');
      } else {
        createUser(finalData);
        if (logActivity) logActivity('Cadastro de Colaborador', cleanName, `Novo membro com cargos: ${finalData.title}`);
        showToast(`Novo colaborador "${cleanName}" adicionado à equipe!`, 'success');
      }
    } catch (err) {
      console.error('Erro geral ao salvar colaborador:', err);
      showToast('Ocorreu um erro, mas a janela será fechada.', 'info');
    }
  };

  const handleRequestDelete = (member) => {
    setUserToDelete(member);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (userToDelete) {
      const userId = userToDelete.id;
      const userName = userToDelete.name;
      setDeleteConfirmOpen(false);
      setUserToDelete(null);
      await deleteUser(userId);
      logActivity('Exclusão de Colaborador', userName, 'Membro da equipe removido do sistema.');
      showToast(`Colaborador "${userName}" removido com sucesso.`, 'success');
    }
  };

  // Coleta todos os cargos únicos existentes para alimentar o filtro
  const allUniqueTitles = Array.from(
    new Set(
      users.flatMap(u => {
        if (Array.isArray(u.titles) && u.titles.length > 0) return u.titles;
        if (u.title) return u.title.split(/[•,]/).map(t => t.trim());
        return [];
      }).filter(Boolean)
    )
  );

  // Filtragem dos membros da equipe
  const filteredUsers = users.filter(user => {
    const term = searchTerm.toLowerCase().trim();
    const nameMatch = (user.name || '').toLowerCase().includes(term);
    const emailMatch = (user.email || '').toLowerCase().includes(term);
    const oabMatch = (user.oab || '').toLowerCase().includes(term);
    const titleMatch = (user.title || '').toLowerCase().includes(term);

    const matchesSearch = !term || nameMatch || emailMatch || oabMatch || titleMatch;

    const userTitles = Array.isArray(user.titles) ? user.titles : (user.title ? user.title.split(/[•,]/).map(t => t.trim()) : []);
    const matchesTitle = !filterTitle || userTitles.includes(filterTitle);

    const userRoles = Array.isArray(user.roles) ? user.roles : [user.role || 'lawyer'];
    const matchesRole = !filterRole || userRoles.includes(filterRole);

    return matchesSearch && matchesTitle && matchesRole;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header & Stats Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <UserCog className="h-5 w-5 text-brand-600 dark:text-gold-400" />
            Gestão de Equipe & Múltiplos Cargos
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Atribua múltiplos cargos, especialidades jurídicas e permissões de acesso simultâneas para cada funcionário
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const currentEscritorio = storageService.getCurrentEscritorioId();
              const baseUrl = window.location.origin;
              const inviteLink = `${baseUrl}/?invite=${currentEscritorio}`;
              navigator.clipboard.writeText(inviteLink);
              showToast('Link de convite copiado para a área de transferência!', 'success');
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white dark:bg-navy-800 border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-navy-700 transition-all btn-tactile"
            title="Copiar link para convidar membros para este escritório"
          >
            <LinkIcon className="h-4 w-4" /> Convite
          </button>
          
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-brand-600/25 hover:from-brand-500 hover:to-brand-600 transition-all btn-tactile"
          >
            <Plus className="h-4 w-4" /> Novo Membro
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-white dark:bg-navy-900/90 border border-slate-200/80 dark:border-white/[0.08] p-3 shadow-xs">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, cargo, e-mail ou OAB..."
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-navy-950/60 pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-brand-500 focus:outline-none"
          />
        </div>

        {/* Filtro por Cargo */}
        <select
          value={filterTitle}
          onChange={(e) => setFilterTitle(e.target.value)}
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-navy-900 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 shadow-xs focus:outline-none"
        >
          <option value="">Todos os Cargos & Especialidades</option>
          {allUniqueTitles.map((t, idx) => (
            <option key={idx} value={t}>{t}</option>
          ))}
        </select>

        {/* Filtro por Perfil RBAC */}
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-navy-900 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 shadow-xs focus:outline-none"
        >
          <option value="">Todos os Perfis de Acesso</option>
          {SYSTEM_ROLES.map(r => (
            <option key={r.id} value={r.id}>{r.label}</option>
          ))}
        </select>

        {(searchTerm || filterTitle || filterRole) && (
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterTitle('');
              setFilterRole('');
            }}
            className="text-xs text-rose-600 dark:text-rose-400 hover:underline px-2"
          >
            Limpar Filtros
          </button>
        )}
      </div>

      {/* Team Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map((member) => {
          const userLeads = leads.filter(l => l.assignedTo === member.id || l.lawyerId === member.id);
          const userContracts = contracts.filter(c => c.responsibleLawyerId === member.id);
          const totalSold = userContracts.reduce((acc, c) => acc + (Number(c.value) || 0), 0);
          const conversionRate = userLeads.length > 0 ? ((userContracts.length / userLeads.length) * 100).toFixed(1) : '0.0';

          // Múltiplos cargos do membro
          const memberTitles = Array.isArray(member.titles) && member.titles.length > 0
            ? member.titles
            : (member.title ? member.title.split(/[•,]/).map(t => t.trim()) : ['Colaborador']);

          // Múltiplos papéis/roles do membro
          const memberRoles = Array.isArray(member.roles) && member.roles.length > 0
            ? member.roles
            : [member.role || 'lawyer'];

          return (
            <div
              key={member.id}
              className="rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between space-y-5 hover:border-brand-500/40 transition-all group"
            >
              <div>
                {/* Top Row: Avatar & Actions */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <Avatar
                      src={member.avatar}
                      name={member.name}
                      size="lg"
                      className="rounded-2xl ring-2 ring-brand-500/20 shadow-sm shrink-0"
                    />
                    <div className="min-w-0">
                      <h3 className="font-extrabold text-base text-slate-900 dark:text-white truncate">
                        {member.name}
                      </h3>
                      {member.oab && (
                        <div className="text-[11px] text-slate-400 font-mono font-medium mt-0.5">
                          {member.oab}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Edit & Delete Action Buttons */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleOpenEditModal(member)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-slate-800 transition-colors"
                      title="Editar cargos e permissões do colaborador"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    {users.length > 1 && (
                      <button
                        onClick={() => handleRequestDelete(member)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                        title="Remover da equipe"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Seção de Múltiplos Cargos Atribuídos */}
                <div className="mt-3.5 space-y-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Briefcase className="h-3 w-3 text-brand-500" />
                    <span>Cargos & Especialidades ({memberTitles.length}):</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {memberTitles.map((jobTitle, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-gold-300 border border-brand-200 dark:border-brand-800/80 shadow-2xs"
                      >
                        <Tag className="h-2.5 w-2.5 opacity-70" />
                        <span>{jobTitle}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Perfis de Acesso ao Sistema (RBAC) */}
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                    <Shield className="h-3 w-3 text-emerald-500" />
                    <span>Acesso RBAC:</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {memberRoles.map((rId) => {
                      const sysRole = SYSTEM_ROLES.find(r => r.id === rId);
                      return (
                        <span
                          key={rId}
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                            sysRole ? sysRole.color : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {sysRole ? sysRole.label : rId}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Performance Box */}
                <div className="mt-4 rounded-2xl bg-slate-50 dark:bg-navy-950 p-4 border border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Award className="h-3.5 w-3.5 text-gold-500" /> Desempenho do Período
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Leads Atendidos</span>
                      <span className="font-extrabold text-slate-900 dark:text-white text-sm">{userLeads.length}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px]">Contratos Fechados</span>
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">{userContracts.length}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px]">Total Vendido</span>
                      <span className="font-extrabold text-slate-900 dark:text-white text-xs">{formatCurrency(totalSold)}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px]">Conversão</span>
                      <span className="font-extrabold text-brand-600 dark:text-brand-400 text-xs">{conversionRate}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact info footer */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-3 text-[11px] text-slate-500 space-y-1">
                <div className="flex items-center gap-1.5 truncate">
                  <Mail className="h-3 w-3 text-slate-400" /> {member.email}
                </div>
                {member.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3 w-3 text-slate-400" /> {member.phone}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Criação / Edição de Funcionário com Múltiplos Cargos */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingUserId(null);
        }}
        title={editingUserId ? 'Editar Funcionário & Múltiplos Cargos' : 'Novo Membro da Equipe'}
        subtitle="Atribua múltiplos cargos, especialidades advocatícias e permissões do sistema"
        maxWidth="max-w-2xl"
      >
        <form noValidate onSubmit={handleSaveUser} className="space-y-5">
          {/* Nome Completo & E-mail */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nome Completo do Funcionário *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Dra. Helena Prado"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                E-mail Corporativo *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="nome@escritorio.adv.br"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>

          {/* OAB & Telefone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Inscrição OAB (Se aplicável)
              </label>
              <input
                type="text"
                value={formData.oab}
                onChange={(e) => setFormData({ ...formData, oab: e.target.value })}
                placeholder="OAB/SP 123.456"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Telefone / WhatsApp
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(11) 98888-0000"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>

          {/* SEÇÃO PRINCIPAL: MÚLTIPLOS CARGOS DO FUNCIONÁRIO */}
          <div className="rounded-2xl border border-brand-200 dark:border-brand-900/60 bg-brand-50/30 dark:bg-brand-950/20 p-4 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-brand-600 dark:text-gold-400" />
                <label className="text-xs font-bold text-slate-900 dark:text-white">
                  Cargos & Especialidades Atribuídas ({formData.titles.length})
                </label>
              </div>
              <span className="text-[11px] text-slate-500">
                O funcionário pode acumular múltiplos cargos
              </span>
            </div>

            {/* Tags dos Cargos Atuais com botão Remover */}
            <div className="flex flex-wrap gap-2 min-h-[38px] p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-navy-900 shadow-2xs">
              {formData.titles.map((t, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-brand-100 dark:bg-brand-900/60 text-brand-800 dark:text-gold-300 border border-brand-300 dark:border-brand-700 shadow-xs animate-scale-in"
                >
                  <Tag className="h-3 w-3 opacity-75" />
                  <span>{t}</span>
                  <button
                    type="button"
                    onClick={() => removeTitle(t)}
                    className="p-0.5 rounded-full hover:bg-brand-200 dark:hover:bg-brand-800 text-brand-600 dark:text-brand-300 transition-colors"
                    title="Remover este cargo"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>

            {/* Adicionar Cargo Personalizado ou Selecionar da Lista */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customTitleInput}
                  onChange={(e) => setCustomTitleInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTitle(customTitleInput);
                    }
                  }}
                  placeholder="Digitar novo cargo personalizado e teclar Enter..."
                  className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => addTitle(customTitleInput)}
                  disabled={!customTitleInput.trim()}
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-xs disabled:opacity-50 disabled:cursor-not-allowed transition-all btn-tactile"
                >
                  <Plus className="h-4 w-4" /> Adicionar
                </button>
              </div>

              {/* Sugestões Rápidas de Cargos para Clicar */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Sugestões Rápidas (Clique para Atribuir):
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                  {PREDEFINED_JOB_TITLES.map((preset, idx) => {
                    const isSelected = formData.titles.includes(preset);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => isSelected ? removeTitle(preset) : addTitle(preset)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                          isSelected
                            ? 'bg-brand-600 text-white shadow-xs'
                            : 'bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-brand-400'
                        }`}
                      >
                        {isSelected ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3 text-slate-400" />}
                        <span>{preset}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* SEÇÃO DE PERFIS DE ACESSO AO SISTEMA (RBAC) */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-navy-950/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <label className="text-xs font-bold text-slate-900 dark:text-white">
                  Níveis de Acesso ao Sistema (RBAC Multicargo)
                </label>
              </div>
              <span className="text-[11px] text-slate-400">
                Selecione as permissões acumuladas
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SYSTEM_ROLES.map((r) => {
                const isChecked = formData.roles.includes(r.id);
                return (
                  <div
                    key={r.id}
                    onClick={() => toggleRole(r.id)}
                    className={`cursor-pointer rounded-xl border p-2.5 transition-all flex items-start gap-2.5 ${
                      isChecked
                        ? 'border-brand-500 bg-white dark:bg-navy-900 shadow-xs ring-1 ring-brand-500/30'
                        : 'border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-navy-900/60 hover:border-slate-300'
                    }`}
                  >
                    <div className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                      isChecked
                        ? 'border-brand-600 bg-brand-600 text-white'
                        : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950'
                    }`}>
                      {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {r.label}
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-1">
                        {r.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Foto de Perfil */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Foto de Perfil do Colaborador
            </label>
            <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-slate-50 dark:bg-navy-950/70 border border-slate-200 dark:border-slate-800">
              <Avatar src={formData.avatar} name={formData.name || 'Novo Membro'} size="lg" />
              <div className="flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-sm transition-all btn-tactile">
                    <Upload className="h-3.5 w-3.5" />
                    <span>Escolher Foto do Computador</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const compressed = await compressAvatarImage(file, 256, 0.85);
                            if (compressed) {
                              setFormData(prev => ({ ...prev, avatar: compressed }));
                              showToast('Foto do colaborador processada!', 'success');
                            }
                          } catch (err) {
                            console.error('Erro na foto:', err);
                            showToast('Erro ao processar imagem.', 'danger');
                          }
                        }
                      }}
                    />
                  </label>
                  {formData.avatar && (
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, avatar: '' }))}
                      className="text-xs text-rose-500 hover:text-rose-600 font-semibold px-2.5 py-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                    >
                      Remover Foto
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Botões do Modal */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                setEditingUserId(null);
              }}
              className="rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => {
                try {
                  handleSaveUser();
                } catch (e) {
                  console.error('Erro ao salvar usuário:', e);
                }
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-lg shadow-brand-600/25 transition-all btn-tactile"
            >
              <CheckCircle2 className="h-4 w-4" />
              {editingUserId ? 'Salvar Alterações de Cargos' : 'Adicionar Membro à Equipe'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal de Confirmação de Exclusão */}
      <ConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setUserToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Remover Colaborador da Equipe"
        message={`Tem certeza que deseja remover "${userToDelete?.name}" da equipe? Os registros de leads e contratos continuarão preservados no histórico.`}
        confirmLabel="Sim, Remover"
      />
    </div>
  );
}
