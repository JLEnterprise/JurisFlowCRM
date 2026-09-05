import React, { useState, useEffect } from 'react';
import { useCRM } from '../../context/CRMContext';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../common/Modal';
import { ATTENDANCE_CHANNELS } from '../../data/legalAreas';

export function AttendanceModal({ isOpen, onClose, prefillData = null }) {
  const { addAttendance, clients, leads } = useCRM();
  const { users } = useAuth();

  const [formData, setFormData] = useState({
    clientId: '',
    clientName: '',
    channel: 'whatsapp',
    subject: '',
    description: '',
    result: '',
    nextAction: '',
    date: new Date().toISOString().slice(0, 16),
  });

  useEffect(() => {
    if (prefillData) {
      setFormData({
        clientId: prefillData.clientId || '',
        clientName: prefillData.clientName || '',
        channel: 'whatsapp',
        subject: '',
        description: '',
        result: '',
        nextAction: '',
        date: new Date().toISOString().slice(0, 16),
      });
    } else {
      setFormData({
        clientId: clients[0]?.id || '',
        clientName: clients[0]?.name || '',
        channel: 'whatsapp',
        subject: '',
        description: '',
        result: '',
        nextAction: '',
        date: new Date().toISOString().slice(0, 16),
      });
    }
  }, [prefillData, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.clientName || !formData.subject || !formData.description) {
      alert('Por favor, preencha os campos obrigatórios do atendimento.');
      return;
    }

    addAttendance(formData);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar Atendimento Jurídico / Contato"
      subtitle="Grave o histórico de interações por WhatsApp, telefone, reunião presencial ou vídeo"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Cliente & Canal */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Cliente / Lead *
            </label>
            <input
              type="text"
              required
              value={formData.clientName}
              onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
              placeholder="Nome do cliente ou lead atendido"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Canal de Atendimento *
            </label>
            <select
              value={formData.channel}
              onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
            >
              {ATTENDANCE_CHANNELS.map(ch => (
                <option key={ch.id} value={ch.id}>{ch.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Assunto & Data */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Assunto / Pauta *
            </label>
            <input
              type="text"
              required
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="Ex: Envio de certidões atualizadas do imóvel"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Data e Horário
            </label>
            <input
              type="datetime-local"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Descrição Detalhada */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Descrição do Atendimento *
          </label>
          <textarea
            rows={3}
            required
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Relate detalhadamente o que foi conversado e acordado..."
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 p-3 text-sm text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
          />
        </div>

        {/* Resultado & Próxima Ação */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Resultado / Encaminhamento
            </label>
            <input
              type="text"
              value={formData.result}
              onChange={(e) => setFormData({ ...formData, result: e.target.value })}
              placeholder="Ex: Documentação aprovada e anexada aos autos"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Próxima Ação Necessária
            </label>
            <input
              type="text"
              value={formData.nextAction}
              onChange={(e) => setFormData({ ...formData, nextAction: e.target.value })}
              placeholder="Ex: Protocolar petição na próxima semana"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
            />
          </div>
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
            Salvar Registro
          </button>
        </div>
      </form>
    </Modal>
  );
}
