import React, { useMemo, useRef, useState } from 'react';
import {
  Search,
  Plus,
  CheckSquare,
  Clock,
  User,
  Trash2,
  Edit,
  AlertTriangle,
  Sparkles,
  FileText,
  Gavel,
  MapPin,
  UserCheck,
  FileCheck,
  Coins,
  Edit3,
  List,
  Rows3,
  Columns3,
  ChevronDown,
  Briefcase,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils/formatters';
import { useHorizontalWheel } from '../../utils/useHorizontalWheel';
import { Badge } from '../common/Badge';
import { EmptyState } from '../common/EmptyState';
import { ConfirmModal } from '../common/ConfirmModal';
import { TASK_TYPES } from '../../data/legalAreas';
import { Select } from '../common/Select';

// Fluxo das tarefas: concluídas sempre por último
export const TASK_STATUSES = [
  { id: 'pending', label: 'Pendentes', dot: 'bg-slate-400' },
  { id: 'in_progress', label: 'Em andamento', dot: 'bg-brand-500' },
  { id: 'blocked', label: 'Travadas', dot: 'bg-rose-500' },
  { id: 'completed', label: 'Concluídas', dot: 'bg-emerald-500' },
];
const STATUS_SINGULAR = { pending: 'Pendente', in_progress: 'Em andamento', blocked: 'Travada', completed: 'Concluída' };
const statusOf = (t) => (TASK_STATUSES.some(s => s.id === t.status) ? t.status : 'pending');

const PRIORITY_ORDER = { urgente: 0, alta: 1, high: 1, media: 2, medium: 2, baixa: 3, low: 3 };
const VIEW_KEY = 'jurisflow_tarefas_visao';
const GROUP_KEY = 'jurisflow_tarefas_agrupar';

function loadPref(key, fallback) {
  try { return window.localStorage.getItem(key) || fallback; } catch { return fallback; }
}
function savePref(key, value) {
  try { window.localStorage.setItem(key, value); } catch { /* sem storage: só não lembra */ }
}

export function TaskList({ onOpenNewTask, onEditTask }) {
  const { tasks = [], clients = [], toggleTask, updateTask, deleteTask, showToast, logActivity } = useCRM();
  const { users = [] } = useAuth();

  const [view, setView] = useState(() => loadPref(VIEW_KEY, 'grupos'));
  const [groupBy, setGroupBy] = useState(() => loadPref(GROUP_KEY, 'status'));
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [selectedClient, setSelectedClient] = useState('');

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);

  const changeView = (v) => { setView(v); savePref(VIEW_KEY, v); };
  const changeGroupBy = (g) => { setGroupBy(g); savePref(GROUP_KEY, g); };

  const clientName = (id) => (clients.find(c => String(c.id) === String(id))?.name) || '';
  const getUserName = (userId) => users.find(u => u.id === userId)?.name || 'Equipe';

  const filteredTasks = useMemo(() => (tasks || [])
    .filter(t => {
      if (!t) return false;
      const term = (search || '').toLowerCase().trim();
      const matchesSearch = !term || [t.title, t.description, t.customType, clientName(t.clientId || t.client_id)]
        .some(v => String(v || '').toLowerCase().includes(term));
      const matchesType = !selectedType ||
        (selectedType === 'personalizado'
          ? (t.taskType === 'personalizado' || Boolean(t.customType))
          : t.taskType === selectedType);
      const matchesPriority = !selectedPriority || (t.priority || 'media') === selectedPriority;
      const matchesStatus = !selectedStatus || statusOf(t) === selectedStatus;
      const matchesAssignee = !selectedAssignee || (t.assignedTo || t.assigned_to) === selectedAssignee;
      const cid = String(t.clientId || t.client_id || '');
      const matchesClient = !selectedClient || (selectedClient === '__none' ? !cid : cid === selectedClient);
      return matchesSearch && matchesType && matchesPriority && matchesStatus && matchesAssignee && matchesClient;
    })
    // Prazo mais próximo primeiro; no mesmo dia, maior prioridade primeiro
    .sort((a, b) => String(a.dueDate || '').localeCompare(String(b.dueDate || ''))
      || (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2)),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [tasks, clients, search, selectedType, selectedPriority, selectedStatus, selectedAssignee, selectedClient]);

  const hasFilters = selectedType || selectedPriority || selectedStatus || selectedAssignee || selectedClient || search;
  const clearFilters = () => {
    setSelectedType(''); setSelectedPriority(''); setSelectedStatus('');
    setSelectedAssignee(''); setSelectedClient(''); setSearch('');
  };

  const changeStatus = (task, status) => {
    if (statusOf(task) === status) return;
    updateTask(task.id, { status });
  };

  const handleRequestDelete = (task) => {
    setTaskToDelete(task);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!taskToDelete) return;
    const { id, title } = taskToDelete;
    setDeleteModalOpen(false);
    setTaskToDelete(null);
    deleteTask(id);
    logActivity('Exclusão de Tarefa', title || 'Tarefa', 'Prazo/tarefa excluído da pauta.');
    showToast('Tarefa excluída com sucesso!');
  };

  const sortedClients = [...clients].filter(c => c && c.id).sort((a, b) => String(a.name).localeCompare(String(b.name), 'pt-BR'));
  const rowProps = { clientName, getUserName, onToggle: toggleTask, onChangeStatus: changeStatus, onEdit: onEditTask, onDelete: handleRequestDelete };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Linha 1: visões + ações (compactas, na mesma linha) */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="funil-tabs" role="tablist" aria-label="Visualização das tarefas">
          {[
            { id: 'lista', label: 'Lista', icon: List },
            { id: 'grupos', label: 'Grupos', icon: Rows3 },
            { id: 'kanban', label: 'Kanban', icon: Columns3 },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={view === id}
              onClick={() => changeView(id)}
              className={`funil-tab ${view === id ? 'is-active' : ''}`}
            >
              <Icon className="h-3.5 w-3.5" /> <span>{label}</span>
            </button>
          ))}
        </div>

        {view === 'grupos' && (
          <Select value={groupBy} onChange={(e) => changeGroupBy(e.target.value)} aria-label="Agrupar por" className="w-44 py-1.5 text-xs">
            <option value="status">Agrupar por status</option>
            <option value="cliente">Agrupar por cliente</option>
            <option value="responsavel">Agrupar por responsável</option>
          </Select>
        )}

        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onOpenNewTask({ taskType: 'personalizado', customType: '' })}
            className="header-icon-btn border border-slate-200 dark:border-white/[0.08] hover:!text-gold-500"
            aria-label="Nova tarefa com tipo personalizado"
            data-tip="Tipo personalizado"
          >
            <Sparkles className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onOpenNewTask()}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-700 via-brand-600 to-brand-500 px-4 py-2 text-xs font-semibold tracking-wide text-white shadow-md shadow-brand-900/20 hover:brightness-110 transition btn-tactile"
          >
            <Plus className="h-4 w-4" /> Nova Tarefa
          </button>
        </div>
      </div>

      {/* Linha 2: busca e filtros compactos */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar tarefa..."
            className="w-full rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-gold-500/60 focus:outline-none"
          />
        </div>

        <Select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} aria-label="Status" className="w-36 py-1.5 text-xs">
          <option value="">Todos os status</option>
          {TASK_STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
        </Select>

        <Select value={selectedPriority} onChange={(e) => setSelectedPriority(e.target.value)} aria-label="Prioridade" className="w-36 py-1.5 text-xs">
          <option value="">Todas as prioridades</option>
          <option value="urgente">Urgente</option>
          <option value="alta">Alta / Fatal</option>
          <option value="media">Média</option>
          <option value="baixa">Baixa</option>
        </Select>

        <Select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} aria-label="Tipo" className="w-36 py-1.5 text-xs">
          <option value="">Todos os tipos</option>
          {TASK_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
        </Select>

        <Select value={selectedAssignee} onChange={(e) => setSelectedAssignee(e.target.value)} aria-label="Responsável" className="w-40 py-1.5 text-xs">
          <option value="">Todos os responsáveis</option>
          {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </Select>

        <Select value={selectedClient} onChange={(e) => setSelectedClient(e.target.value)} aria-label="Cliente" className="w-40 py-1.5 text-xs">
          <option value="">Todos os clientes</option>
          <option value="__none">Sem cliente</option>
          {sortedClients.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
        </Select>

        {hasFilters && (
          <button onClick={clearFilters} className="px-1 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline">
            Limpar
          </button>
        )}
      </div>

      {filteredTasks.length === 0 && view !== 'kanban' ? (
        <EmptyState
          title="Nenhuma tarefa ou prazo encontrado"
          description={hasFilters ? 'Nenhuma tarefa com esses filtros.' : 'Cadastre prazos processuais e tarefas para organizar o fluxo do escritório.'}
          iconName="CheckSquare"
          actionLabel="Criar Tarefa"
          onAction={() => onOpenNewTask()}
        />
      ) : view === 'lista' ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#111827] divide-y divide-slate-100 dark:divide-white/[0.05]">
          {filteredTasks.map(task => <TaskRow key={task.id} task={task} {...rowProps} />)}
        </div>
      ) : view === 'grupos' ? (
        <GroupedTasks tasks={filteredTasks} groupBy={groupBy} users={users} clients={sortedClients} rowProps={rowProps} />
      ) : (
        <TaskKanban tasks={filteredTasks} onChangeStatus={changeStatus} rowProps={rowProps} />
      )}

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); setTaskToDelete(null); }}
        onConfirm={handleConfirmDelete}
        title="Excluir Tarefa / Prazo"
        message={`Deseja realmente excluir a tarefa "${taskToDelete?.title || 'selecionada'}"?`}
        confirmLabel="Sim, Excluir"
      />
    </div>
  );
}

/* ============================== Peças visuais ============================== */

function getPriorityBadgeVariant(priority) {
  if (['urgente', 'alta', 'high'].includes(priority)) return 'danger';
  if (['media', 'medium'].includes(priority)) return 'warning';
  return 'default';
}

function getTypeDisplay(task) {
  if (task.customType || task.taskType === 'personalizado') {
    return {
      label: task.customType || 'Personalizado',
      icon: <Edit3 className="h-3 w-3 text-gold-500" />,
      className: 'bg-gold-500/10 text-gold-800 border border-gold-500/30 dark:text-gold-200',
    };
  }
  const typeObj = TASK_TYPES.find(t => t.id === task.taskType);
  if (!typeObj) {
    return {
      label: 'Geral',
      icon: <FileText className="h-3 w-3 text-slate-500" />,
      className: 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-white/[0.05] dark:text-slate-300 dark:border-white/[0.08]',
    };
  }
  const icons = {
    prazo_fatal: <AlertTriangle className="h-3 w-3 text-rose-500" />,
    audiencia: <Gavel className="h-3 w-3 text-brand-500" />,
    diligencia: <MapPin className="h-3 w-3 text-gold-500" />,
    atendimento: <UserCheck className="h-3 w-3 text-teal-500" />,
    elaboracao_contrato: <FileCheck className="h-3 w-3 text-brand-500" />,
    cobranca: <Coins className="h-3 w-3 text-emerald-500" />,
    analise: <Search className="h-3 w-3 text-cyan-500" />,
  };
  return {
    label: typeObj.label,
    icon: icons[typeObj.id] || <FileText className="h-3 w-3 text-brand-500" />,
    className: `${typeObj.color} border border-transparent`,
  };
}

function isOverdue(task) {
  if (statusOf(task) === 'completed' || !task.dueDate) return false;
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  return String(task.dueDate).slice(0, 10) < todayKey;
}

function TaskRow({ task, clientName, getUserName, onToggle, onChangeStatus, onEdit, onDelete }) {
  const status = statusOf(task);
  const isCompleted = status === 'completed';
  const typeInfo = getTypeDisplay(task);
  const client = clientName(task.clientId || task.client_id);
  const overdue = isOverdue(task);

  return (
    <div className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors hover:bg-slate-50/80 dark:hover:bg-white/[0.02] ${isCompleted ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-3.5 flex-1 min-w-0">
        <button
          onClick={() => onToggle(task.id)}
          aria-label={isCompleted ? 'Reabrir tarefa' : 'Concluir tarefa'}
          className={`mt-0.5 h-5 w-5 rounded-md border flex items-center justify-center transition-all shrink-0 ${
            isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 dark:border-white/20 hover:border-gold-500 text-transparent'
          }`}
        >
          <CheckSquare className="h-3.5 w-3.5" />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className={`text-sm font-semibold ${isCompleted ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white'}`}>
              {task.title || 'Sem título'}
            </h4>
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold ${typeInfo.className}`}>
              {typeInfo.icon}<span>{typeInfo.label}</span>
            </span>
            <Badge variant={getPriorityBadgeVariant(task.priority)} size="sm">
              {String(task.priority || 'media').toUpperCase()}
            </Badge>
          </div>

          {task.description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{task.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[11px] text-slate-400">
            <span className={`flex items-center gap-1 font-medium ${overdue ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-300'}`}>
              <Clock className="h-3 w-3" /> {overdue ? 'Atrasada · ' : ''}{formatDate(task.dueDate || task.due_date)} {task.dueTime ? `às ${task.dueTime}` : ''}
            </span>
            <span className="flex items-center gap-1"><User className="h-3 w-3" /> {getUserName(task.assignedTo || task.assigned_to)}</span>
            {client && <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" /> {client}</span>}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0 pl-8 sm:pl-0">
        <Select value={status} onChange={(e) => onChangeStatus(task, e.target.value)} aria-label="Status da tarefa" className="w-36 py-1 text-xs">
          {TASK_STATUSES.map(s => <option key={s.id} value={s.id}>{STATUS_SINGULAR[s.id]}</option>)}
        </Select>
        <button onClick={() => onEdit && onEdit(task)} className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-white/[0.05]" title="Editar tarefa" aria-label="Editar tarefa">
          <Edit className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => onDelete(task)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-500/10" title="Excluir tarefa" aria-label="Excluir tarefa">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

/* ============================== Grupos ============================== */

function GroupedTasks({ tasks, groupBy, users, clients, rowProps }) {
  const [collapsed, setCollapsed] = useState({ completed: true });

  const groups = useMemo(() => {
    if (groupBy === 'cliente') {
      const list = clients.map(c => ({ id: String(c.id), label: c.name, dot: 'bg-gold-500' }));
      list.push({ id: '__none', label: 'Sem cliente', dot: 'bg-slate-400' });
      return list.map(g => ({ ...g, items: tasks.filter(t => (String(t.clientId || t.client_id || '') || '__none') === g.id) }));
    }
    if (groupBy === 'responsavel') {
      const list = users.map(u => ({ id: u.id, label: u.name, dot: 'bg-brand-500' }));
      list.push({ id: '__none', label: 'Sem responsável', dot: 'bg-slate-400' });
      const known = new Set(users.map(u => u.id));
      return list.map(g => ({
        ...g,
        items: tasks.filter(t => {
          const a = t.assignedTo || t.assigned_to;
          return g.id === '__none' ? !a || !known.has(a) : a === g.id;
        }),
      }));
    }
    return TASK_STATUSES.map(s => ({ ...s, items: tasks.filter(t => statusOf(t) === s.id) }));
  }, [tasks, groupBy, users, clients]);

  // No agrupamento por cliente/responsável, esconde grupos vazios para não poluir
  const visibleGroups = groupBy === 'status' ? groups : groups.filter(g => g.items.length > 0);

  return (
    <div className="space-y-3">
      {visibleGroups.map(group => {
        const isOpen = !collapsed[group.id];
        return (
          <section key={group.id} className="overflow-hidden rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#111827]">
            <button
              type="button"
              onClick={() => setCollapsed(prev => ({ ...prev, [group.id]: !prev[group.id] }))}
              aria-expanded={isOpen}
              className="flex w-full items-center gap-2.5 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
            >
              <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? '' : '-rotate-90'}`} />
              <span className={`h-2 w-2 rounded-full ${group.dot}`} />
              <span className="font-display text-lg font-semibold leading-none text-slate-900 dark:text-white">{group.label}</span>
              <span className="rounded-full bg-slate-100 dark:bg-white/[0.06] px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                {group.items.length}
              </span>
            </button>
            {isOpen && (
              group.items.length === 0 ? (
                <div className="border-t border-slate-100 dark:border-white/[0.05] px-4 py-3 text-xs text-slate-400">Nenhuma tarefa aqui.</div>
              ) : (
                <div className="border-t border-slate-100 dark:border-white/[0.05] divide-y divide-slate-100 dark:divide-white/[0.05]">
                  {group.items.map(task => <TaskRow key={task.id} task={task} {...rowProps} />)}
                </div>
              )
            )}
          </section>
        );
      })}
    </div>
  );
}

/* ============================== Kanban ============================== */

function TaskKanban({ tasks, onChangeStatus, rowProps }) {
  const boardRef = useRef(null);
  useHorizontalWheel(boardRef);
  const [dragId, setDragId] = useState(null);
  const [overCol, setOverCol] = useState(null);

  const drop = (e, statusId) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain') || dragId;
    const task = tasks.find(t => t.id === id);
    if (task) onChangeStatus(task, statusId);
    setDragId(null);
    setOverCol(null);
  };

  return (
    <div ref={boardRef} className="flex gap-3.5 overflow-x-auto pb-4 kanban-column-scroll min-h-[calc(100vh-260px)]">
      {TASK_STATUSES.map(col => {
        const items = tasks.filter(t => statusOf(t) === col.id);
        return (
          <div
            key={col.id}
            onDragOver={(e) => { e.preventDefault(); if (overCol !== col.id) setOverCol(col.id); }}
            onDragLeave={() => setOverCol(null)}
            onDrop={(e) => drop(e, col.id)}
            className={`flex w-72 sm:w-80 flex-shrink-0 flex-col rounded-2xl border p-3 bg-slate-100/80 dark:bg-[#0b0f17]/80 transition-colors ${
              overCol === col.id ? 'border-gold-500/50' : 'border-slate-200/80 dark:border-white/[0.08]'
            }`}
          >
            <div className="mb-3 flex items-center gap-2 border-b border-slate-200/70 dark:border-white/[0.06] pb-2.5">
              <span className={`h-2 w-2 rounded-full ${col.dot}`} />
              <span className="font-display text-[1.05rem] font-semibold leading-none text-slate-900 dark:text-white">{col.label}</span>
              <span className="rounded-full bg-white dark:bg-white/[0.08] px-1.5 text-[10px] font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/[0.05]">
                {items.length}
              </span>
            </div>
            <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[calc(100vh-330px)] pr-1">
              {items.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-white/[0.08] rounded-xl">
                  Arraste tarefas para cá
                </div>
              ) : items.map(task => (
                <TaskCard key={task.id} task={task} onDragStart={(e) => { setDragId(task.id); e.dataTransfer.setData('text/plain', task.id); }} {...rowProps} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TaskCard({ task, onDragStart, clientName, getUserName, onEdit }) {
  const typeInfo = getTypeDisplay(task);
  const client = clientName(task.clientId || task.client_id);
  const overdue = isOverdue(task);
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={() => onEdit && onEdit(task)}
      className="cursor-grab active:cursor-grabbing rounded-xl border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#111827] p-3 shadow-sm hover:border-gold-500/40 transition-colors"
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${typeInfo.className}`}>
          {typeInfo.icon}<span className="truncate max-w-[9rem]">{typeInfo.label}</span>
        </span>
        <Badge variant={getPriorityBadgeVariant(task.priority)} size="sm">{String(task.priority || 'media').toUpperCase()}</Badge>
      </div>
      <div className="text-sm font-semibold text-slate-900 dark:text-white leading-snug">{task.title || 'Sem título'}</div>
      <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] text-slate-400">
        <span className={`flex items-center gap-1 ${overdue ? 'text-rose-600 dark:text-rose-400 font-semibold' : ''}`}>
          <Clock className="h-3 w-3" /> {formatDate(task.dueDate || task.due_date)}
        </span>
        <span className="flex items-center gap-1"><User className="h-3 w-3" /> {getUserName(task.assignedTo || task.assigned_to).split(' ')[0]}</span>
        {client && <span className="flex items-center gap-1 truncate"><Briefcase className="h-3 w-3" /> {client}</span>}
      </div>
    </div>
  );
}
