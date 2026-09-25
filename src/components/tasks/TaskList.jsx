import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  Ban,
  RotateCcw,
  Pencil,
  CheckCircle2,
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

// Etapas de trabalho (editáveis por escritório em Configurações do escritório → taskStages).
// "Concluídas" e "Recusadas" são destinos finais fixos, com abas próprias.
export const DEFAULT_TASK_STAGES = [
  { id: 'pending', label: 'Pendentes' },
  { id: 'in_progress', label: 'Em andamento' },
  { id: 'blocked', label: 'Travadas' },
];
const DONE = 'completed';
const REFUSED = 'refused';
const STAGE_DOTS = ['bg-slate-400', 'bg-brand-500', 'bg-rose-500', 'bg-gold-500', 'bg-violet-500', 'bg-teal-500'];

const PRIORITY_ORDER = { urgente: 0, alta: 1, high: 1, media: 2, medium: 2, baixa: 3, low: 3 };
const VIEW_KEY = 'jurisflow_tarefas_visao';
const GROUP_KEY = 'jurisflow_tarefas_agrupar';

function loadPref(key, fallback) {
  try { return window.localStorage.getItem(key) || fallback; } catch { return fallback; }
}
function savePref(key, value) {
  try { window.localStorage.setItem(key, value); } catch { /* sem storage: só não lembra */ }
}

const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const addDaysKey = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Filtro de prazo (data de vencimento)
function matchesDue(task, dueFilter) {
  if (!dueFilter) return true;
  const due = String(task.dueDate || task.due_date || '').slice(0, 10);
  if (!due) return false;
  const today = todayKey();
  switch (dueFilter) {
    case 'atrasadas': return due < today;
    case 'hoje': return due === today;
    case 'semana': return due >= today && due <= addDaysKey(7);
    case 'mes': return due.slice(0, 7) === today.slice(0, 7);
    case 'proximos30': return due >= today && due <= addDaysKey(30);
    default: return true;
  }
}

export function TaskList({ onOpenNewTask, onEditTask }) {
  const { tasks = [], clients = [], toggleTask, updateTask, deleteTask, showToast, logActivity, officeSettings, updateOfficeSettings } = useCRM();
  const { users = [] } = useAuth();

  const stages = (Array.isArray(officeSettings?.taskStages) && officeSettings.taskStages.length > 0)
    ? officeSettings.taskStages
    : DEFAULT_TASK_STAGES;
  const stageIds = stages.map(s => s.id);
  const statusOf = (t) => (t.status === DONE || t.status === REFUSED ? t.status : stageIds.includes(t.status) ? t.status : stageIds[0]);

  const [view, setView] = useState(() => loadPref(VIEW_KEY, 'grupos'));
  const [groupBy, setGroupBy] = useState(() => loadPref(GROUP_KEY, 'status'));
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [dueFilter, setDueFilter] = useState('');

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [stageToDelete, setStageToDelete] = useState(null);

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
        (selectedType === 'personalizado' ? (t.taskType === 'personalizado' || Boolean(t.customType)) : t.taskType === selectedType);
      const matchesPriority = !selectedPriority || (t.priority || 'media') === selectedPriority;
      const matchesStatus = !selectedStatus || statusOf(t) === selectedStatus;
      const matchesAssignee = !selectedAssignee || (t.assignedTo || t.assigned_to) === selectedAssignee;
      const cid = String(t.clientId || t.client_id || '');
      const matchesClient = !selectedClient || (selectedClient === '__none' ? !cid : cid === selectedClient);
      return matchesSearch && matchesType && matchesPriority && matchesStatus && matchesAssignee && matchesClient && matchesDue(t, dueFilter);
    })
    .sort((a, b) => String(a.dueDate || '').localeCompare(String(b.dueDate || ''))
      || (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2)),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [tasks, clients, stages, search, selectedType, selectedPriority, selectedStatus, selectedAssignee, selectedClient, dueFilter]);

  const activeTasks = filteredTasks.filter(t => statusOf(t) !== DONE && statusOf(t) !== REFUSED);
  const doneTasks = filteredTasks.filter(t => statusOf(t) === DONE);
  const refusedTasks = filteredTasks.filter(t => statusOf(t) === REFUSED);
  const isClosedView = view === 'concluidas' || view === 'recusadas';

  const hasFilters = selectedType || selectedPriority || selectedStatus || selectedAssignee || selectedClient || search || dueFilter;
  const clearFilters = () => {
    setSelectedType(''); setSelectedPriority(''); setSelectedStatus('');
    setSelectedAssignee(''); setSelectedClient(''); setSearch(''); setDueFilter('');
  };

  const changeStatus = (task, status) => {
    if (statusOf(task) === status) return;
    updateTask(task.id, { status });
  };

  // --- Etapas editáveis ---
  const saveStages = (next) => updateOfficeSettings({ taskStages: next });
  const renameStage = (id, label) => {
    const clean = label.trim();
    if (!clean) return;
    saveStages(stages.map(s => (s.id === id ? { ...s, label: clean } : s)));
  };
  const addStage = () => {
    const id = `etapa_${Date.now()}`;
    saveStages([...stages, { id, label: 'Nova etapa' }]);
    return id;
  };
  const confirmDeleteStage = () => {
    const stage = stageToDelete;
    setStageToDelete(null);
    if (!stage || stages.length <= 1) return;
    const remaining = stages.filter(s => s.id !== stage.id);
    // Tarefas da etapa excluída vão para a primeira etapa que sobrou
    (tasks || []).filter(t => t && statusOf(t) === stage.id).forEach(t => updateTask(t.id, { status: remaining[0].id }));
    saveStages(remaining);
    showToast(`Etapa "${stage.label}" excluída.`);
  };

  const handleRequestDelete = (task) => { setTaskToDelete(task); setDeleteModalOpen(true); };
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
  const rowProps = {
    stages, statusOf, clientName, getUserName,
    onToggle: toggleTask,
    onChangeStatus: changeStatus,
    onRefuse: (task) => changeStatus(task, REFUSED),
    onReopen: (task) => changeStatus(task, stageIds[0]),
    onEdit: onEditTask,
    onDelete: handleRequestDelete,
  };

  const listFor = view === 'concluidas' ? doneTasks : view === 'recusadas' ? refusedTasks : activeTasks;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Linha 1: visões à esquerda; Concluídas/Recusadas + criar à direita */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="funil-tabs" role="tablist" aria-label="Visualização das tarefas">
          {[
            { id: 'lista', label: 'Lista', icon: List },
            { id: 'grupos', label: 'Grupos', icon: Rows3 },
            { id: 'kanban', label: 'Kanban', icon: Columns3 },
          ].map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" role="tab" aria-selected={view === id} onClick={() => changeView(id)}
              className={`funil-tab ${view === id ? 'is-active' : ''}`}>
              <Icon className="h-3.5 w-3.5" /> <span>{label}</span>
            </button>
          ))}
        </div>

        {view === 'grupos' && (
          <Select value={groupBy} onChange={(e) => changeGroupBy(e.target.value)} aria-label="Agrupar por" className="w-44 py-1.5 text-xs">
            <option value="status">Agrupar por etapa</option>
            <option value="cliente">Agrupar por cliente</option>
            <option value="responsavel">Agrupar por responsável</option>
          </Select>
        )}

        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          <div className="funil-tabs" role="tablist" aria-label="Tarefas encerradas">
            <button type="button" role="tab" aria-selected={view === 'concluidas'} onClick={() => changeView('concluidas')}
              className={`funil-tab is-won ${view === 'concluidas' ? 'is-active' : ''}`}>
              <CheckCircle2 className="h-3.5 w-3.5" /> <span>Concluídas</span>
              <span className="funil-tab__count">{doneTasks.length}</span>
            </button>
            <button type="button" role="tab" aria-selected={view === 'recusadas'} onClick={() => changeView('recusadas')}
              className={`funil-tab is-lost ${view === 'recusadas' ? 'is-active' : ''}`}>
              <Ban className="h-3.5 w-3.5" /> <span>Recusadas</span>
              <span className="funil-tab__count">{refusedTasks.length}</span>
            </button>
          </div>
          <button type="button" onClick={() => onOpenNewTask({ taskType: 'personalizado', customType: '' })}
            className="header-icon-btn border border-slate-200 dark:border-white/[0.08] hover:!text-gold-500"
            aria-label="Nova tarefa com tipo personalizado" data-tip="Tipo personalizado">
            <Sparkles className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => onOpenNewTask()}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-700 via-brand-600 to-brand-500 px-4 py-2 text-xs font-semibold tracking-wide text-white shadow-md shadow-brand-900/20 hover:brightness-110 transition btn-tactile">
            <Plus className="h-4 w-4" /> Nova Tarefa
          </button>
        </div>
      </div>

      {/* Linha 2: busca e filtros (valem para todas as visões, inclusive Concluídas e Recusadas) */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-52">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar tarefa..."
            className="w-full rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-gold-500/60 focus:outline-none" />
        </div>

        <Select value={dueFilter} onChange={(e) => setDueFilter(e.target.value)} aria-label="Prazo" className="w-36 py-1.5 text-xs">
          <option value="">Qualquer prazo</option>
          <option value="atrasadas">Atrasadas</option>
          <option value="hoje">Vencem hoje</option>
          <option value="semana">Próximos 7 dias</option>
          <option value="proximos30">Próximos 30 dias</option>
          <option value="mes">Este mês</option>
        </Select>

        {!isClosedView && (
          <Select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} aria-label="Etapa" className="w-36 py-1.5 text-xs">
            <option value="">Todas as etapas</option>
            {stages.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </Select>
        )}

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
          <button onClick={clearFilters} className="px-1 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline">Limpar</button>
        )}
      </div>

      {isClosedView && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {view === 'concluidas'
            ? 'Tarefas concluídas. Desmarque a caixa de uma tarefa para devolvê-la à primeira etapa.'
            : 'Tarefas recusadas ou que não serão feitas. Use "Reabrir" para devolver uma tarefa ao fluxo.'}
        </p>
      )}

      {listFor.length === 0 && view !== 'kanban' && !(view === 'grupos' && groupBy === 'status') ? (
        <EmptyState
          title={view === 'concluidas' ? 'Nenhuma tarefa concluída' : view === 'recusadas' ? 'Nenhuma tarefa recusada' : 'Nenhuma tarefa ou prazo encontrado'}
          description={hasFilters ? 'Nenhuma tarefa com esses filtros.' : 'Cadastre prazos processuais e tarefas para organizar o fluxo do escritório.'}
          iconName="CheckSquare"
          actionLabel={isClosedView ? undefined : 'Criar Tarefa'}
          onAction={isClosedView ? undefined : () => onOpenNewTask()}
        />
      ) : view === 'grupos' ? (
        <GroupedTasks
          tasks={activeTasks}
          groupBy={groupBy}
          users={users}
          clients={sortedClients}
          rowProps={rowProps}
          onRenameStage={renameStage}
          onAddStage={addStage}
          onDeleteStage={(stage) => setStageToDelete(stage)}
        />
      ) : view === 'kanban' ? (
        <TaskKanban tasks={activeTasks} rowProps={rowProps} />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#111827] divide-y divide-slate-100 dark:divide-white/[0.05]">
          {listFor.map(task => <TaskRow key={task.id} task={task} {...rowProps} />)}
        </div>
      )}

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); setTaskToDelete(null); }}
        onConfirm={handleConfirmDelete}
        title="Excluir Tarefa / Prazo"
        message={`Deseja realmente excluir a tarefa "${taskToDelete?.title || 'selecionada'}"?`}
        confirmLabel="Sim, Excluir"
      />

      <ConfirmModal
        isOpen={Boolean(stageToDelete)}
        onClose={() => setStageToDelete(null)}
        onConfirm={confirmDeleteStage}
        title="Excluir etapa"
        message={stageToDelete
          ? `Excluir a etapa "${stageToDelete.label}"? As tarefas dela vão para "${stages.find(s => s.id !== stageToDelete.id)?.label || 'a primeira etapa'}".`
          : ''}
        confirmLabel="Sim, excluir etapa"
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

function isOverdue(task, status) {
  if (status === DONE || status === REFUSED) return false;
  const due = String(task.dueDate || '').slice(0, 10);
  return Boolean(due) && due < todayKey();
}

function TaskRow({ task, stages, statusOf, clientName, getUserName, onToggle, onChangeStatus, onRefuse, onReopen, onEdit, onDelete }) {
  const status = statusOf(task);
  const isCompleted = status === DONE;
  const isRefused = status === REFUSED;
  const typeInfo = getTypeDisplay(task);
  const client = clientName(task.clientId || task.client_id);
  const overdue = isOverdue(task, status);

  return (
    <div className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors hover:bg-slate-50/80 dark:hover:bg-white/[0.02] ${isCompleted || isRefused ? 'opacity-70' : ''}`}>
      <div className="flex items-start gap-3.5 flex-1 min-w-0">
        {!isRefused && (
          <button onClick={() => onToggle(task.id)} aria-label={isCompleted ? 'Reabrir tarefa' : 'Concluir tarefa'}
            title={isCompleted ? 'Desmarcar (volta para a primeira etapa)' : 'Marcar como concluída'}
            className={`mt-0.5 h-5 w-5 rounded-md border flex items-center justify-center transition-all shrink-0 ${
              isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 dark:border-white/20 hover:border-gold-500 text-transparent'
            }`}>
            <CheckSquare className="h-3.5 w-3.5" />
          </button>
        )}
        {isRefused && <Ban className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" />}

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className={`text-sm font-semibold ${isCompleted || isRefused ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white'}`}>
              {task.title || 'Sem título'}
            </h4>
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold ${typeInfo.className}`}>
              {typeInfo.icon}<span>{typeInfo.label}</span>
            </span>
            <Badge variant={getPriorityBadgeVariant(task.priority)} size="sm">{String(task.priority || 'media').toUpperCase()}</Badge>
          </div>
          {task.description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{task.description}</p>}
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
        {isCompleted || isRefused ? (
          <button onClick={() => onReopen(task)}
            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-slate-500 hover:text-brand-600 dark:hover:text-gold-400 hover:bg-slate-100 dark:hover:bg-white/[0.05]">
            <RotateCcw className="h-3 w-3" /> Reabrir
          </button>
        ) : (
          <>
            <Select value={status} onChange={(e) => onChangeStatus(task, e.target.value)} aria-label="Etapa da tarefa" className="w-36 py-1 text-xs">
              {stages.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              <option value={DONE}>✓ Concluída</option>
              <option value={REFUSED}>✕ Recusada</option>
            </Select>
            <button onClick={() => onRefuse(task)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-500/10" title="Recusar / não será feita" aria-label="Recusar tarefa">
              <Ban className="h-3.5 w-3.5" />
            </button>
          </>
        )}
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

// Nome da etapa editável: clique para renomear, Enter/fora para salvar, Esc para cancelar
function EditableStageName({ label, autoEdit, onSave }) {
  const [editing, setEditing] = useState(Boolean(autoEdit));
  const [value, setValue] = useState(label);
  const inputRef = useRef(null);

  useEffect(() => { if (!editing) setValue(label); }, [label, editing]);
  useEffect(() => { if (editing) inputRef.current?.select(); }, [editing]);

  if (!editing) {
    return (
      <button type="button" onClick={(e) => { e.stopPropagation(); setEditing(true); }}
        className="group/name flex items-center gap-1.5 font-display text-lg font-semibold leading-none text-slate-900 dark:text-white hover:text-gold-600 dark:hover:text-gold-300"
        title="Clique para renomear a etapa">
        {label}
        <Pencil className="h-3 w-3 opacity-0 group-hover/name:opacity-60 transition-opacity" />
      </button>
    );
  }

  const commit = () => { setEditing(false); if (value.trim() && value.trim() !== label) onSave(value); };
  return (
    <input
      ref={inputRef}
      value={value}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') { e.preventDefault(); commit(); }
        if (e.key === 'Escape') { setValue(label); setEditing(false); }
      }}
      maxLength={40}
      aria-label="Nome da etapa"
      className="w-56 rounded-lg border border-gold-500/50 bg-transparent px-2 py-1 font-display text-lg font-semibold leading-none text-slate-900 dark:text-white focus:outline-none"
    />
  );
}

function GroupedTasks({ tasks, groupBy, users, clients, rowProps, onRenameStage, onAddStage, onDeleteStage }) {
  const [collapsed, setCollapsed] = useState({});
  const [justCreated, setJustCreated] = useState(null);
  const { stages, statusOf } = rowProps;

  const groups = useMemo(() => {
    if (groupBy === 'cliente') {
      const list = clients.map(c => ({ id: String(c.id), label: c.name, dot: 'bg-gold-500' }));
      list.push({ id: '__none', label: 'Sem cliente', dot: 'bg-slate-400' });
      return list.map(g => ({ ...g, items: tasks.filter(t => (String(t.clientId || t.client_id || '') || '__none') === g.id) }));
    }
    if (groupBy === 'responsavel') {
      const known = new Set(users.map(u => u.id));
      const list = users.map(u => ({ id: u.id, label: u.name, dot: 'bg-brand-500' }));
      list.push({ id: '__none', label: 'Sem responsável', dot: 'bg-slate-400' });
      return list.map(g => ({
        ...g,
        items: tasks.filter(t => {
          const a = t.assignedTo || t.assigned_to;
          return g.id === '__none' ? !a || !known.has(a) : a === g.id;
        }),
      }));
    }
    return stages.map((s, i) => ({ ...s, dot: STAGE_DOTS[i % STAGE_DOTS.length], isStage: true, items: tasks.filter(t => statusOf(t) === s.id) }));
  }, [tasks, groupBy, users, clients, stages, statusOf]);

  const visibleGroups = groupBy === 'status' ? groups : groups.filter(g => g.items.length > 0);

  return (
    <div className="space-y-3">
      {visibleGroups.map(group => {
        const isOpen = !collapsed[group.id];
        return (
          <section key={group.id} className="group/section overflow-hidden rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#111827]">
            <div className="flex w-full items-center gap-2.5 px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
              <button type="button" onClick={() => setCollapsed(prev => ({ ...prev, [group.id]: !prev[group.id] }))}
                aria-expanded={isOpen} aria-label={isOpen ? 'Recolher grupo' : 'Expandir grupo'} className="rounded p-0.5">
                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? '' : '-rotate-90'}`} />
              </button>
              <span className={`h-2 w-2 rounded-full ${group.dot}`} />
              {group.isStage ? (
                <EditableStageName
                  label={group.label}
                  autoEdit={justCreated === group.id}
                  onSave={(label) => { onRenameStage(group.id, label); setJustCreated(null); }}
                />
              ) : (
                <span className="font-display text-lg font-semibold leading-none text-slate-900 dark:text-white">{group.label}</span>
              )}
              <span className="rounded-full bg-slate-100 dark:bg-white/[0.06] px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                {group.items.length}
              </span>
              {group.isStage && stages.length > 1 && (
                <button type="button" onClick={() => onDeleteStage(group)}
                  className="ml-auto rounded-lg p-1.5 text-slate-400 opacity-0 transition-opacity hover:bg-rose-500/10 hover:text-rose-600 group-hover/section:opacity-100 focus:opacity-100"
                  title="Excluir etapa" aria-label={`Excluir etapa ${group.label}`}>
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
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

      {groupBy === 'status' && (
        <button type="button" onClick={() => setJustCreated(onAddStage())}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 dark:border-white/[0.12] py-3 text-xs font-semibold text-slate-500 hover:border-gold-500/50 hover:text-gold-600 dark:hover:text-gold-300 transition-colors">
          <Plus className="h-4 w-4" /> Adicionar etapa
        </button>
      )}
    </div>
  );
}

/* ============================== Kanban ============================== */

function TaskKanban({ tasks, rowProps }) {
  const boardRef = useRef(null);
  useHorizontalWheel(boardRef);
  const [dragId, setDragId] = useState(null);
  const [overCol, setOverCol] = useState(null);
  const { stages, statusOf, onChangeStatus } = rowProps;

  const drop = (e, statusId) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain') || dragId;
    const task = tasks.find(t => t.id === id);
    if (task) onChangeStatus(task, statusId);
    setDragId(null);
    setOverCol(null);
  };

  const columns = [
    ...stages.map((s, i) => ({ ...s, dot: STAGE_DOTS[i % STAGE_DOTS.length] })),
  ];

  return (
    <div ref={boardRef} className="flex gap-3.5 overflow-x-auto pb-4 kanban-column-scroll min-h-[calc(100vh-260px)]">
      {columns.map(col => {
        const items = tasks.filter(t => statusOf(t) === col.id);
        return (
          <div key={col.id}
            onDragOver={(e) => { e.preventDefault(); if (overCol !== col.id) setOverCol(col.id); }}
            onDragLeave={() => setOverCol(null)}
            onDrop={(e) => drop(e, col.id)}
            className={`flex w-72 sm:w-80 flex-shrink-0 flex-col rounded-2xl border p-3 bg-slate-100/80 dark:bg-[#0b0f17]/80 transition-colors ${
              overCol === col.id ? 'border-gold-500/50' : 'border-slate-200/80 dark:border-white/[0.08]'
            }`}>
            <div className="mb-3 flex items-center gap-2 border-b border-slate-200/70 dark:border-white/[0.06] pb-2.5">
              <span className={`h-2 w-2 rounded-full ${col.dot}`} />
              <span className="font-display text-[1.05rem] font-semibold leading-none text-slate-900 dark:text-white">{col.label}</span>
              <span className="rounded-full bg-white dark:bg-white/[0.08] px-1.5 text-[10px] font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/[0.05]">{items.length}</span>
            </div>
            <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[calc(100vh-330px)] pr-1">
              {items.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-white/[0.08] rounded-xl">Arraste tarefas para cá</div>
              ) : items.map(task => (
                <TaskCard key={task.id} task={task} status={statusOf(task)}
                  onDragStart={(e) => { setDragId(task.id); e.dataTransfer.setData('text/plain', task.id); }} {...rowProps} />
              ))}
            </div>
          </div>
        );
      })}

      {/* Destinos finais: soltar aqui conclui ou recusa */}
      <div className="flex w-52 flex-shrink-0 flex-col gap-3.5">
        {[
          { id: DONE, label: 'Concluir', icon: CheckCircle2, tone: 'emerald' },
          { id: REFUSED, label: 'Recusar', icon: Ban, tone: 'rose' },
        ].map(({ id, label, icon: Icon, tone }) => (
          <div key={id}
            onDragOver={(e) => { e.preventDefault(); if (overCol !== id) setOverCol(id); }}
            onDragLeave={() => setOverCol(null)}
            onDrop={(e) => drop(e, id)}
            className={`flex flex-1 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed p-4 text-center transition-colors ${
              overCol === id ? (tone === 'emerald' ? 'border-emerald-500/70 bg-emerald-500/10' : 'border-rose-500/70 bg-rose-500/10') : 'border-slate-300 dark:border-white/[0.1]'
            }`}>
            <Icon className={`h-5 w-5 ${tone === 'emerald' ? 'text-emerald-500' : 'text-rose-500'}`} />
            <div className="text-xs font-bold text-slate-800 dark:text-white">{label}</div>
            <p className="text-[10px] text-slate-400">Solte a tarefa aqui</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function TaskCard({ task, status, onDragStart, clientName, getUserName, onEdit }) {
  const typeInfo = getTypeDisplay(task);
  const client = clientName(task.clientId || task.client_id);
  const overdue = isOverdue(task, status);
  return (
    <div draggable onDragStart={onDragStart} onClick={() => onEdit && onEdit(task)}
      className="cursor-grab active:cursor-grabbing rounded-xl border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#111827] p-3 shadow-sm hover:border-gold-500/40 transition-colors">
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
