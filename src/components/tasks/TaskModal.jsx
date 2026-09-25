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
import { Select } from '../common/Select';
import { DateField } from '../common/DateField';

export function TaskModal({ isOpen, onClose, taskToEdit = null, prefillData = null }) {
  const { addTask, updateTask, leads = [], clients = [], officeSettings } = useCRM();
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
        status: taskToEdit.status || 'pending',
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

  const stageOptions = (Array.isArray(officeSettings?.taskStages) && officeSettings.taskStages.length > 0)
    ? officeSettings.taskStages
    : [{ id: 'pending', label: 'Pendentes' }, { id: 'in_progress', label: 'Em andamento' }, { id: 'blocked', label: 'Travadas' }];

  const PRIORITY_DOTS = { baixa: 'bg-slate-400', media: 'bg-brand-500', alta: 'bg-gold-500', urgente: 'bg-rose-500' };
  const inputClass = 'w-full rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-gold-500/60 focus:outline-none focus:ring-2 focus:ring-gold-500/15';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={taskToEdit ? 'Editar tarefa' : 'Nova tarefa'}
      subtitle="Preencha em quatro passos: o que é, quem faz e quando, vínculos e detalhes"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. O QUE É */}
        <FormSection number="1" title="O que é a tarefa">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_15rem]">
            <div>
              <FieldLabel>Título *</FieldLabel>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex.: Protocolar contestação com preliminar de prescrição"
                className={`${inputClass} font-medium`}
              />
            </div>
            {/* Modelo rápido: escolher preenche o título e o tipo de uma vez */}
            <div>
              <FieldLabel>Modelo rápido</FieldLabel>
              <Select
                value={presetTitles.some(p => p.label === formData.title) ? formData.title : ''}
                onChange={(e) => {
                  const preset = presetTitles.find(p => p.label === e.target.value);
                  if (!preset) return;
                  setFormData(prev => ({ ...prev, title: preset.label, taskType: preset.type, customType: '' }));
                  setIsCustomTypeMode(false);
                }}
                aria-label="Modelo rápido"
                className="w-full"
              >
                <option value="">Escolher modelo...</option>
                {presetTitles.map(p => <option key={p.label} value={p.label}>{p.label}</option>)}
              </Select>
            </div>
          </div>

          <div>
            <FieldLabel>Tipo *</FieldLabel>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {TASK_TYPES.map((type) => {
                const isCustom = type.id === 'personalizado';
                const isSelected = isCustom ? isCustomTypeMode : (!isCustomTypeMode && formData.taskType === type.id);
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => handleSelectType(type.id)}
                    aria-pressed={isSelected}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs font-semibold transition-all ${
                      isSelected
                        ? 'border-gold-500/60 bg-gold-500/10 text-slate-900 dark:text-gold-100 ring-1 ring-inset ring-gold-500/30'
                        : 'border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-300 hover:border-gold-500/40'
                    }`}
                  >
                    <span className={isSelected ? 'text-gold-600 dark:text-gold-400' : 'text-slate-400'}>
                      {isCustom ? <Sparkles className="h-3.5 w-3.5" /> : getTypeIcon(type.id)}
                    </span>
                    <span className="truncate">{isCustom ? 'Outro (personalizado)' : type.label}</span>
                  </button>
                );
              })}
            </div>
            {isCustomTypeMode && (
              <input
                type="text"
                required
                value={formData.customType}
                onChange={(e) => setFormData(prev => ({ ...prev, customType: e.target.value }))}
                placeholder="Nome do tipo. Ex.: Perícia contábil, Despacho com o juiz..."
                className={`${inputClass} mt-2.5 animate-fade-in`}
                autoFocus
              />
            )}
          </div>
        </FormSection>

        {/* 2. QUEM E QUANDO */}
        <FormSection number="2" title="Quem faz e quando">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-1">
              <FieldLabel>Responsável *</FieldLabel>
              <Select value={formData.assignedTo} onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })} className="w-full">
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </Select>
            </div>
            <div>
              <FieldLabel>Prazo *</FieldLabel>
              <DateField type="date" required value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} className="w-full" />
            </div>
            <div>
              <FieldLabel>Horário limite</FieldLabel>
              <DateField type="time" value={formData.dueTime} onChange={(e) => setFormData({ ...formData, dueTime: e.target.value })} className="w-full" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <FieldLabel>Prioridade *</FieldLabel>
              <div className="grid grid-cols-4 gap-1.5" role="radiogroup" aria-label="Prioridade">
                {TASK_PRIORITIES.map(p => {
                  const active = formData.priority === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setFormData({ ...formData, priority: p.id })}
                      className={`flex items-center justify-center gap-1.5 rounded-xl border px-2 py-2 text-xs font-semibold transition-all ${
                        active
                          ? 'border-gold-500/60 bg-gold-500/10 text-slate-900 dark:text-gold-100'
                          : 'border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-300 hover:border-gold-500/40'
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${PRIORITY_DOTS[p.id] || 'bg-slate-400'}`} />
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <FieldLabel>Etapa</FieldLabel>
              <Select value={formData.status || stageOptions[0].id} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full">
                {stageOptions.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                <option value="completed">Concluída</option>
                <option value="refused">Recusada</option>
              </Select>
            </div>
          </div>
        </FormSection>

        {/* 3. VÍNCULOS */}
        {(clients.length > 0 || leads.length > 0) && (
          <FormSection number="3" title="Vínculos" hint="opcional">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel>Cliente</FieldLabel>
                <Select value={formData.clientId} onChange={(e) => setFormData({ ...formData, clientId: e.target.value })} className="w-full">
                  <option value="">Nenhum cliente</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name || c.nome}</option>)}
                </Select>
              </div>
              <div>
                <FieldLabel>Lead / negociação</FieldLabel>
                <Select value={formData.leadId} onChange={(e) => setFormData({ ...formData, leadId: e.target.value })} className="w-full">
                  <option value="">Nenhum lead</option>
                  {leads.map(l => <option key={l.id} value={l.id}>{l.name || l.nome}</option>)}
                </Select>
              </div>
            </div>
          </FormSection>
        )}

        {/* 4. DETALHES */}
        <FormSection number={clients.length > 0 || leads.length > 0 ? '4' : '3'} title="Detalhes" hint="opcional">
          <textarea
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Instruções para o responsável, links de peças, teses..."
            className={inputClass}
          />
        </FormSection>

        <div className="flex items-center justify-end gap-2.5 border-t border-slate-200 dark:border-white/[0.08] pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 dark:border-white/[0.1] px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:border-gold-500/40 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-700 via-brand-600 to-brand-500 px-5 py-2 text-sm font-semibold tracking-wide text-white shadow-md shadow-brand-900/20 hover:brightness-110 transition btn-tactile"
          >
            <CheckCircle2 className="h-4 w-4" />
            {taskToEdit ? 'Salvar alterações' : 'Criar tarefa'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// Bloco numerado do formulário: número em círculo dourado + título + fio dourado
function FormSection({ number, title, hint, children }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2.5">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-gold-500/50 bg-gold-500/10 text-[11px] font-bold text-gold-700 dark:text-gold-300">
          {number}
        </span>
        <h4 className="font-display text-lg font-semibold leading-none text-slate-900 dark:text-white">{title}</h4>
        {hint && <span className="text-[10px] uppercase tracking-[0.16em] text-slate-400">{hint}</span>}
        <span className="h-px flex-1 bg-gradient-to-r from-gold-500/30 to-transparent" />
      </div>
      {children}
    </section>
  );
}

function FieldLabel({ children }) {
  return (
    <label className="mb-1.5 block text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
      {children}
    </label>
  );
}
