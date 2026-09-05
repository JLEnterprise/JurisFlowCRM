import React, { useState, useEffect } from 'react';
import { useCRM } from '../../context/CRMContext';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../common/Modal';
import { TASK_PRIORITIES, TASK_TYPES } from '../../data/legalAreas';
import {
  FileText,
  AlertTriangle,
  Gavel,
  MapPin,
  UserCheck,
  FileCheck,
  Coins,
  Search,
  Edit3,
  Sparkles,
  PlusCircle,
  Clock,
  Calendar,
  User,
  CheckCircle2,
} from 'lucide-react';

export function TaskModal({ isOpen, onClose, taskToEdit = null, prefillData = null }) {
  const { addTask, updateTask, leads = [], clients = [] } = useCRM();
  const { users = [] } = useAuth();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedTo: 'usr_4',
    leadId: '',
    clientId: '',
    dueDate: new Date().toISOString().split('T')[0],
    dueTime: '14:00',
    priority: 'media',
    taskType: 'peticao',
    customType: '',
  });

  const [isCustomTypeMode, setIsCustomTypeMode] = useState(false);

  useEffect(() => {
    if (taskToEdit) {
      const isCustom = taskToEdit.taskType === 'personalizado' ||
        (taskToEdit.customType && !TASK_TYPES.some(t => t.id === taskToEdit.taskType && t.id !== 'personalizado'));
      
      setFormData({
        title: taskToEdit.title || '',
        description: taskToEdit.description || '',
        assignedTo: taskToEdit.assignedTo || taskToEdit.assigned_to || (users[0]?.id || 'usr_4'),
        leadId: taskToEdit.leadId || '',
        clientId: taskToEdit.clientId || '',
        dueDate: taskToEdit.dueDate || taskToEdit.due_date || new Date().toISOString().split('T')[0],
        dueTime: taskToEdit.dueTime || taskToEdit.due_time || '14:00',
        priority: taskToEdit.priority || 'media',
        taskType: isCustom ? 'personalizado' : (taskToEdit.taskType || 'peticao'),
        customType: taskToEdit.customType || (isCustom ? taskToEdit.taskType : ''),
      });
      setIsCustomTypeMode(Boolean(isCustom));
    } else if (prefillData) {
      const isCustom = prefillData.taskType === 'personalizado' || Boolean(prefillData.customType);
      setFormData({
        title: prefillData.title || '',
        description: prefillData.description || '',
        assignedTo: prefillData.assignedTo || (users[0]?.id || 'usr_4'),
        leadId: prefillData.leadId || '',
        clientId: prefillData.clientId || '',
        dueDate: prefillData.dueDate || new Date().toISOString().split('T')[0],
        dueTime: prefillData.dueTime || '14:00',
        priority: prefillData.priority || 'alta',
        taskType: isCustom ? 'personalizado' : (prefillData.taskType || 'peticao'),
        customType: prefillData.customType || '',
      });
      setIsCustomTypeMode(Boolean(isCustom));
    } else {
      setFormData({
        title: '',
        description: '',
        assignedTo: users[0]?.id || 'usr_4',
        leadId: '',
        clientId: '',
        dueDate: new Date().toISOString().split('T')[0],
        dueTime: '14:00',
        priority: 'media',
        taskType: 'peticao',
        customType: '',
      });
      setIsCustomTypeMode(false);
    }
  }, [taskToEdit, prefillData, isOpen, users]);

  const handleSelectType = (typeId) => {
    if (typeId === 'personalizado') {
      setIsCustomTypeMode(true);
      setFormData(prev => ({ ...prev, taskType: 'personalizado' }));
    } else {
      setIsCustomTypeMode(false);
      setFormData(prev => ({
        ...prev,
        taskType: typeId,
        customType: '',
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Por favor, informe o título da tarefa.');
      return;
    }

    if (isCustomTypeMode && !formData.customType.trim()) {
      alert('Por favor, digite o nome do tipo personalizado da tarefa.');
      return;
    }

    const payload = {
      ...formData,
      taskType: isCustomTypeMode ? 'personalizado' : formData.taskType,
      customType: isCustomTypeMode ? formData.customType.trim() : '',
    };

    if (taskToEdit) {
      if (typeof updateTask === 'function') {
        updateTask(taskToEdit.id, payload);
      }
    } else {
      addTask(payload);
    }
    onClose();
  };

  const presetTitles = [
    { label: 'Elaborar Petição Inicial', type: 'peticao' },
    { label: 'Contestação / Defesa Processual', type: 'peticao' },
    { label: 'Protocolar Recurso Ordinário', type: 'prazo_fatal' },
    { label: 'Cumprimento de Prazo Fatal', type: 'prazo_fatal' },
    { label: 'Audiência de Instrução e Julgamento', type: 'audiencia' },
    { label: 'Diligência Presencial no Fórum', type: 'diligencia' },
    { label: 'Reunião de Alinhamento com Cliente', type: 'atendimento' },
    { label: 'Elaborar Minuta de Contrato', type: 'elaboracao_contrato' },
    { label: 'Cobrança de Parcela / Honorários', type: 'cobranca' },
    { label: 'Análise de Documentos e Parecer', type: 'analise' },
  ];

  const getTypeIcon = (id) => {
    switch (id) {
      case 'peticao': return <FileText className="h-3.5 w-3.5" />;
      case 'prazo_fatal': return <AlertTriangle className="h-3.5 w-3.5" />;
      case 'audiencia': return <Gavel className="h-3.5 w-3.5" />;
      case 'diligencia': return <MapPin className="h-3.5 w-3.5" />;
      case 'atendimento': return <UserCheck className="h-3.5 w-3.5" />;
      case 'elaboracao_contrato': return <FileCheck className="h-3.5 w-3.5" />;
      case 'cobranca': return <Coins className="h-3.5 w-3.5" />;
      case 'analise': return <Search className="h-3.5 w-3.5" />;
      case 'personalizado': return <Edit3 className="h-3.5 w-3.5" />;
      default: return <FileText className="h-3.5 w-3.5" />;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={taskToEdit ? 'Editar Tarefa / Prazo' : 'Nova Tarefa & Prazo Fatal'}
      subtitle="Defina o tipo, responsável, prazo de conclusão e prioridade de execução"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* SELEÇÃO DE TIPO DA TAREFA & BOTÃO PERSONALIZADO */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Tipo da Tarefa *
            </label>
            <button
              type="button"
              onClick={() => handleSelectType('personalizado')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                isCustomTypeMode
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm ring-2 ring-amber-400/40'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800/60'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-500 dark:text-amber-300" />
              <span>+ Escrever Tipo Personalizado</span>
            </button>
          </div>

          {/* Chips de Tipos Padrões */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {TASK_TYPES.filter(t => t.id !== 'personalizado').map((type) => {
              const isSelected = !isCustomTypeMode && formData.taskType === type.id;
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => handleSelectType(type.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all text-left ${
                    isSelected
                      ? 'bg-brand-50/90 dark:bg-brand-950/60 border-brand-500 text-brand-700 dark:text-brand-300 ring-2 ring-brand-500/20 shadow-xs'
                      : 'bg-slate-50/70 dark:bg-navy-950/50 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800'
                  }`}
                >
                  <span className={isSelected ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400'}>
                    {getTypeIcon(type.id)}
                  </span>
                  <span className="truncate">{type.label}</span>
                </button>
              );
            })}
          </div>

          {/* CAMPO DE TIPO PERSONALIZADO QUANDO ATIVO */}
          {isCustomTypeMode && (
            <div className="mt-3 p-3.5 rounded-2xl bg-gradient-to-r from-amber-50/90 to-amber-100/40 dark:from-amber-950/30 dark:to-navy-900/40 border border-amber-300 dark:border-amber-700/60 animate-fade-in shadow-xs">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                  <Edit3 className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  Especifique o Tipo Personalizado da Tarefa *
                </label>
                <button
                  type="button"
                  onClick={() => handleSelectType('peticao')}
                  className="text-[11px] text-slate-500 dark:text-slate-400 hover:underline"
                >
                  Voltar aos tipos padrões
                </button>
              </div>
              <input
                type="text"
                required={isCustomTypeMode}
                value={formData.customType}
                onChange={(e) => setFormData(prev => ({ ...prev, customType: e.target.value }))}
                placeholder="Ex: Perícia Técnica Contábil, Despacho Presencial com Juiz, Notificação Cartorária..."
                className="w-full rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                autoFocus
              />
              <p className="text-[11px] text-amber-700 dark:text-amber-300/80 mt-1">
                Este tipo personalizado será salvo e destacado com identificador próprio na listagem.
              </p>
            </div>
          )}
        </div>

        {/* Modelos Rápidos de Tarefas (Presets) */}
        <div>
          <span className="block text-[11px] font-semibold text-slate-400 mb-1.5">
            Modelos Rápidos (preenchimento em 1 clique):
          </span>
          <div className="flex flex-wrap gap-1.5">
            {presetTitles.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setFormData(prev => ({
                    ...prev,
                    title: preset.label,
                    taskType: preset.type,
                    customType: '',
                  }));
                  setIsCustomTypeMode(false);
                }}
                className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-950/60 dark:hover:text-brand-400 transition-colors border border-transparent hover:border-brand-200 dark:hover:border-brand-800/40"
              >
                + {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Título */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Título / Assunto da Tarefa *
          </label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Ex: Protocolar contestação com preliminar de prescrição"
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
          />
        </div>

        {/* Responsável & Prioridade */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Responsável pela Execução *
            </label>
            <select
              value={formData.assignedTo}
              onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
            >
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name} ({Array.isArray(u.roles) ? u.roles.join(', ') : (u.role || 'Membro')})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nível de Prioridade *
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
            >
              {TASK_PRIORITIES.map(p => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Data & Horário */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Data de Vencimento / Prazo Fatal *
            </label>
            <input
              type="date"
              required
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Horário Limite (Hora Fatal)
            </label>
            <input
              type="time"
              value={formData.dueTime}
              onChange={(e) => setFormData({ ...formData, dueTime: e.target.value })}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Vínculo Opcional (Cliente ou Lead) */}
        {(clients.length > 0 || leads.length > 0) && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Vincular a Cliente (Opcional)
              </label>
              <select
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
              >
                <option value="">Nenhum Cliente Vinculado</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name || c.nome}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Vincular a Lead / Negociação (Opcional)
              </label>
              <select
                value={formData.leadId}
                onChange={(e) => setFormData({ ...formData, leadId: e.target.value })}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
              >
                <option value="">Nenhum Lead Vinculado</option>
                {leads.map(l => (
                  <option key={l.id} value={l.id}>{l.name || l.nome}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Descrição */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Descrição / Instruções da Tarefa
          </label>
          <textarea
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Descreva detalhes específicos, links para peças, teses jurídicas ou instruções para o responsável..."
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 p-3 text-sm text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-5 py-2 text-sm font-semibold text-white shadow-md hover:from-brand-500 hover:to-brand-600 transition-all btn-tactile"
          >
            <CheckCircle2 className="h-4 w-4" />
            {taskToEdit ? 'Salvar Alterações' : 'Criar Tarefa'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
