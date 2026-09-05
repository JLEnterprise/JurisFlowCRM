import React, { useState, useEffect } from 'react';
import { useCRM } from '../../context/CRMContext';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../common/Modal';
import { Sparkles } from 'lucide-react';

const PRESET_EVENT_TYPES = [
  { value: 'consulta', label: 'Consulta Jurídica' },
  { value: 'reuniao', label: 'Reunião Estratégica' },
  { value: 'audiencia', label: 'Audiência Judicial' },
  { value: 'prazo', label: 'Prazo Processual' },
  { value: 'retorno', label: 'Retorno de Caso' },
  { value: 'follow-up', label: 'Follow-up Comercial' },
  { value: 'diligencia', label: 'Diligência Externa / Cartório' },
  { value: 'atendimento', label: 'Atendimento Geral' },
];

export function EventModal({ isOpen, onClose, eventToEdit = null, defaultDate = null }) {
  const { addAppointment, updateAppointment, clients, leads } = useCRM();
  const { users } = useAuth();

  const [isCustomType, setIsCustomType] = useState(false);
  const [customTypeName, setCustomTypeName] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    type: 'reuniao',
    clientId: '',
    clientName: '',
    responsibleId: 'usr_1',
    date: new Date().toISOString().split('T')[0],
    startTime: '10:00',
    endTime: '11:00',
    location: 'Sala de Videoconferência (Google Meet)',
    notes: '',
  });

  useEffect(() => {
    if (eventToEdit) {
      setFormData(eventToEdit);
      const isPreset = PRESET_EVENT_TYPES.some(p => p.value === eventToEdit.type);
      if (!isPreset && eventToEdit.type) {
        setIsCustomType(true);
        setCustomTypeName(eventToEdit.type);
      } else {
        setIsCustomType(false);
        setCustomTypeName('');
      }
    } else {
      setFormData({
        title: '',
        type: 'reuniao',
        clientId: '',
        clientName: '',
        responsibleId: users[0]?.id || 'usr_1',
        date: defaultDate || new Date().toISOString().split('T')[0],
        startTime: '10:00',
        endTime: '11:00',
        location: 'Sala de Videoconferência (Google Meet)',
        notes: '',
      });
      setIsCustomType(false);
      setCustomTypeName('');
    }
  }, [eventToEdit, defaultDate, isOpen, users]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.date) {
      alert('Por favor, informe o título e a data do compromisso.');
      return;
    }

    const resolvedType = isCustomType
      ? (customTypeName.trim() || 'Compromisso Personalizado')
      : formData.type;

    if (isCustomType && !customTypeName.trim()) {
      alert('Por favor, informe o nome do evento personalizado.');
      return;
    }

    const lawyer = users.find(u => u.id === formData.responsibleId);
    const finalData = {
      ...formData,
      type: resolvedType,
      responsibleName: lawyer ? lawyer.name : (users[0]?.name || 'Advogado Responsável'),
    };

    if (eventToEdit?.id && updateAppointment) {
      updateAppointment(eventToEdit.id, finalData);
    } else {
      addAppointment(finalData);
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={eventToEdit ? 'Editar Evento da Agenda' : 'Agendar Novo Compromisso'}
      subtitle="Agendamento de reuniões, consultas, audiências, prazos e eventos personalizados"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Título & Tipo */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Título do Compromisso *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ex: Consulta Inicial — Guarda e Partilha de Bens"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Tipo de Evento *
              </label>
              <button
                type="button"
                onClick={() => {
                  const nextCustom = !isCustomType;
                  setIsCustomType(nextCustom);
                  if (!nextCustom) {
                    setFormData(prev => ({ ...prev, type: 'reuniao' }));
                  }
                }}
                className="text-[11px] font-semibold text-brand-600 dark:text-gold-400 hover:text-brand-700 dark:hover:text-gold-300 transition-colors cursor-pointer flex items-center gap-1"
                title={isCustomType ? 'Voltar para lista pré-definida' : 'Digitar evento personalizado'}
              >
                {isCustomType ? '← Ver Lista' : '✨ Personalizar'}
              </button>
            </div>

            {!isCustomType ? (
              <select
                value={formData.type}
                onChange={(e) => {
                  if (e.target.value === 'custom') {
                    setIsCustomType(true);
                    setCustomTypeName('');
                  } else {
                    setFormData({ ...formData, type: e.target.value });
                  }
                }}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
              >
                {PRESET_EVENT_TYPES.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
                <option value="custom" className="font-bold text-brand-600 dark:text-gold-400">
                  ✨ Outro (Digitar personalizado...)
                </option>
              </select>
            ) : (
              <div className="space-y-1">
                <input
                  type="text"
                  required
                  autoFocus
                  value={customTypeName}
                  onChange={(e) => setCustomTypeName(e.target.value)}
                  placeholder="Ex: Sustentação Oral, Perícia..."
                  className="w-full rounded-xl border-2 border-brand-500/60 dark:border-gold-500/60 bg-brand-50/20 dark:bg-gold-500/5 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-brand-500 dark:focus:border-gold-400 focus:outline-none placeholder:text-slate-400 font-medium"
                />
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Evento livre sem restrição de lista
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Cliente & Responsável */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Cliente / Participante *
            </label>
            <input
              type="text"
              required
              value={formData.clientName}
              onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
              placeholder="Nome do cliente ou lead"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Advogado / Responsável *
            </label>
            <select
              value={formData.responsibleId}
              onChange={(e) => setFormData({ ...formData, responsibleId: e.target.value })}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
            >
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Data, Horários */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Data *
            </label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Horário de Início
            </label>
            <input
              type="time"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Horário de Término
            </label>
            <input
              type="time"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Local / Link */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Localização / Link da Videoconferência
          </label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="Ex: Google Meet, Zoom ou Sala de Reuniões 01"
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
          />
        </div>

        {/* Observações */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Pauta & Observações
          </label>
          <textarea
            rows={2}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Itens a serem abordados na reunião..."
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 p-2.5 text-xs text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="rounded-xl bg-brand-600 px-5 py-2 text-sm font-semibold text-white shadow-md hover:bg-brand-700 transition-colors"
          >
            {eventToEdit ? 'Salvar Compromisso' : 'Confirmar Agendamento'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
