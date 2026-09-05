import React, { useState } from 'react';
import {
  Search,
  Plus,
  Filter,
  CheckSquare,
  Square,
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
  Calendar,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils/formatters';
import { Badge } from '../common/Badge';
import { EmptyState } from '../common/EmptyState';
import { ConfirmModal } from '../common/ConfirmModal';
import { TASK_TYPES } from '../../data/legalAreas';

export function TaskList({ onOpenNewTask, onEditTask }) {
  const { tasks = [], toggleTask, deleteTask, showToast, logActivity } = useCRM();
  const { users = [] } = useAuth();

  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedAssignee, setSelectedAssignee] = useState('');

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);

  const filteredTasks = (tasks || []).filter(t => {
    if (!t) return false;
    const term = (search || '').toLowerCase().trim();
    const title = String(t.title || '').toLowerCase();
    const description = String(t.description || '').toLowerCase();
    const customType = String(t.customType || '').toLowerCase();

    const matchesSearch = !term ||
      title.includes(term) ||
      description.includes(term) ||
      customType.includes(term);

    const matchesType = !selectedType ||
      (selectedType === 'personalizado'
        ? (t.taskType === 'personalizado' || Boolean(t.customType))
        : t.taskType === selectedType);

    const matchesPriority = !selectedPriority || (t.priority || 'media') === selectedPriority;
    const matchesStatus = !selectedStatus || (t.status || 'pending') === selectedStatus;
    const matchesAssignee = !selectedAssignee || (t.assignedTo || t.assigned_to) === selectedAssignee;

    return matchesSearch && matchesType && matchesPriority && matchesStatus && matchesAssignee;
  });

  const getUserName = (userId) => {
    const found = users.find(u => u.id === userId);
    return found ? found.name : 'Equipe';
  };

  const getPriorityBadgeVariant = (priority) => {
    switch (priority) {
      case 'urgente':
      case 'alta':
      case 'high':
        return 'danger';
      case 'media':
      case 'medium':
        return 'warning';
      case 'baixa':
      case 'low':
        return 'default';
      default:
        return 'default';
    }
  };

  const getTypeDisplay = (task) => {
    if (task.customType || task.taskType === 'personalizado') {
      return {
        label: task.customType || 'Personalizado',
        icon: <Edit3 className="h-3 w-3 text-amber-500" />,
        className: 'bg-amber-100/90 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/80',
      };
    }

    const typeObj = TASK_TYPES.find(t => t.id === task.taskType);
    if (!typeObj) {
      return {
        label: 'Geral',
        icon: <FileText className="h-3 w-3 text-slate-500" />,
        className: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
      };
    }

    let icon = <FileText className="h-3 w-3 text-brand-500" />;
    if (typeObj.id === 'prazo_fatal') icon = <AlertTriangle className="h-3 w-3 text-rose-500" />;
    if (typeObj.id === 'audiencia') icon = <Gavel className="h-3 w-3 text-purple-500" />;
    if (typeObj.id === 'diligencia') icon = <MapPin className="h-3 w-3 text-amber-500" />;
    if (typeObj.id === 'atendimento') icon = <UserCheck className="h-3 w-3 text-teal-500" />;
    if (typeObj.id === 'elaboracao_contrato') icon = <FileCheck className="h-3 w-3 text-indigo-500" />;
    if (typeObj.id === 'cobranca') icon = <Coins className="h-3 w-3 text-emerald-500" />;
    if (typeObj.id === 'analise') icon = <Search className="h-3 w-3 text-cyan-500" />;

    return {
      label: typeObj.label,
      icon,
      className: `${typeObj.color} border border-transparent`,
    };
  };

  const handleRequestDelete = (task) => {
    setTaskToDelete(task);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (taskToDelete) {
      const taskId = taskToDelete.id;
      const taskTitle = taskToDelete.title || 'Tarefa';
      setDeleteModalOpen(false);
      setTaskToDelete(null);
      deleteTask(taskId);
      logActivity('Exclusão de Tarefa', taskTitle, 'Prazo/tarefa excluído da pauta.');
      showToast('Tarefa excluída com sucesso!');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top action header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <CheckSquare className="h-6 w-6 text-brand-600 dark:text-gold-400" />
            Tarefas, Prazos & Follow-ups
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Controle rigoroso de prazos processuais, petições, diligências e tipos personalizados de tarefas.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Botão para Criar Tarefa Personalizada Direta */}
          <button
            onClick={() => onOpenNewTask({ taskType: 'personalizado', customType: '' })}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 border border-amber-400/40 text-amber-700 dark:text-amber-300 px-3.5 py-2.5 text-xs font-bold hover:bg-amber-500/20 dark:hover:bg-amber-500/30 transition-all shadow-xs"
            title="Criar tarefa com tipo customizado livre"
          >
            <Sparkles className="h-4 w-4 text-amber-500 dark:text-amber-300" />
            <span>+ Tipo Personalizado</span>
          </button>

          {/* Botão Nova Tarefa Padrão */}
          <button
            onClick={() => onOpenNewTask()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-brand-600/25 hover:from-brand-500 hover:to-brand-600 transition-all btn-tactile"
          >
            <Plus className="h-4 w-4" /> Nova Tarefa
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-white dark:bg-navy-900/90 border border-slate-200/80 dark:border-white/[0.08] p-3 shadow-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título, tipo personalizado ou descrição..."
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-navy-950/60 pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-brand-500 focus:outline-none"
          />
        </div>

        {/* Filtro por Tipo de Tarefa */}
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-navy-900 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 shadow-xs focus:outline-none"
        >
          <option value="">Todos os Tipos</option>
          {TASK_TYPES.map(t => (
            <option key={t.id} value={t.id}>{t.label}</option>
          ))}
        </select>

        {/* Filtro por Prioridade */}
        <select
          value={selectedPriority}
          onChange={(e) => setSelectedPriority(e.target.value)}
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-navy-900 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 shadow-xs focus:outline-none"
        >
          <option value="">Todas as Prioridades</option>
          <option value="urgente">Urgente</option>
          <option value="alta">Alta / Fatal</option>
          <option value="media">Média</option>
          <option value="baixa">Baixa</option>
        </select>

        {/* Filtro por Status */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-navy-900 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 shadow-xs focus:outline-none"
        >
          <option value="">Todos os Status</option>
          <option value="pending">Pendentes</option>
          <option value="completed">Concluídas</option>
        </select>

        {/* Filtro por Responsável */}
        <select
          value={selectedAssignee}
          onChange={(e) => setSelectedAssignee(e.target.value)}
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-navy-900 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 shadow-xs focus:outline-none"
        >
          <option value="">Todos os Responsáveis</option>
          {users.map(u => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>

        {(selectedType || selectedPriority || selectedStatus || selectedAssignee || search) && (
          <button
            onClick={() => {
              setSelectedType('');
              setSelectedPriority('');
              setSelectedStatus('');
              setSelectedAssignee('');
              setSearch('');
            }}
            className="text-xs text-rose-600 dark:text-rose-400 hover:underline px-2 font-semibold"
          >
            Limpar Filtros
          </button>
        )}
      </div>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <EmptyState
          title="Nenhuma tarefa ou prazo encontrado"
          description="Cadastre novos prazos processuais e tarefas personalizadas para organizar o fluxo do escritório."
          iconName="CheckSquare"
          actionLabel="Criar Tarefa"
          onAction={() => onOpenNewTask()}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-navy-900 shadow-xs divide-y divide-slate-100 dark:divide-slate-800/60">
          {filteredTasks.map((task) => {
            const isCompleted = task.status === 'completed';
            const typeInfo = getTypeDisplay(task);

            return (
              <div
                key={task.id}
                className={`p-4 flex items-center justify-between gap-4 transition-colors hover:bg-slate-50/80 dark:hover:bg-white/[0.02] ${
                  isCompleted ? 'opacity-60 bg-slate-50/40 dark:bg-navy-950/40' : ''
                }`}
              >
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  <button
                    onClick={() => toggleTask(task.id)}
                    className={`h-5 w-5 rounded-lg border flex items-center justify-center transition-all shrink-0 ${
                      isCompleted
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-slate-300 dark:border-slate-700 hover:border-brand-500 text-transparent'
                    }`}
                  >
                    <CheckSquare className="h-3.5 w-3.5" />
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className={`text-xs sm:text-sm font-bold ${isCompleted ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white'}`}>
                        {task.title || 'Sem título'}
                      </h4>

                      {/* BADGE DE TIPO DE TAREFA COM ÍCONE E COR */}
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[10px] sm:text-[11px] font-bold ${typeInfo.className}`}>
                        {typeInfo.icon}
                        <span>{typeInfo.label}</span>
                      </span>

                      {/* BADGE DE PRIORIDADE */}
                      <Badge variant={getPriorityBadgeVariant(task.priority)} size="sm">
                        {String(task.priority || 'media').toUpperCase()}
                      </Badge>
                    </div>

                    {task.description && (
                      <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {task.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1 font-medium text-slate-600 dark:text-slate-300">
                        <Clock className="h-3 w-3 text-brand-500" /> Prazo: {formatDate(task.dueDate || task.due_date || new Date().toISOString())} {task.dueTime ? `às ${task.dueTime}` : ''}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3 text-slate-400" /> {getUserName(task.assignedTo || task.assigned_to)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => onEditTask && onEditTask(task)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Editar Tarefa"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleRequestDelete(task)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                    title="Excluir Tarefa"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setTaskToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Excluir Tarefa / Prazo"
        message={`Deseja realmente excluir a tarefa "${taskToDelete?.title || 'selecionada'}"?`}
        confirmLabel="Sim, Excluir"
      />
    </div>
  );
}
