import React, { useState, useEffect } from 'react';
import { useCRM } from '../../context/CRMContext';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../common/Modal';
import { Sparkles, UserCheck, UserPlus, Info, CheckCircle2 } from 'lucide-react';

export const PRESET_EVENT_GROUPS = [
  {
    group: '⚖️ Jurídico & Processual',
    options: [
      { value: 'audiencia', label: 'Audiência Judicial' },
      { value: 'prazo', label: 'Prazo Processual Fatal' },
      { value: 'diligencia', label: 'Diligência em Fórum / Cartório' },
      { value: 'sustentacao', label: 'Sessão de Julgamento / Sustentação Oral' },
      { value: 'pericia', label: 'Perícia Judicial / Assistência Técnica' },
    ]
  },
  {
    group: '🤝 Atendimento a Clientes & Comercial',
    options: [
      { value: 'consulta', label: 'Consulta Jurídica Inicial' },
      { value: 'reuniao', label: 'Reunião com Cliente' },
      { value: 'retorno', label: 'Retorno de Caso / Feedback' },
      { value: 'fechamento', label: 'Fechamento de Contrato / Assinatura' },
      { value: 'follow-up', label: 'Follow-up Comercial' },
      { value: 'atendimento', label: 'Atendimento Geral' },
    ]
  },
  {
    group: '🏢 Interno & Gestão do Escritório',
    options: [
      { value: 'reuniao_interna', label: 'Reunião Interna de Equipe / Sócios' },
      { value: 'estudo', label: 'Estudo de Caso / Pesquisa Jurídica' },
      { value: 'administrativo', label: 'Gestão Administrativa / Financeira' },
    ]
  },
  {
    group: '☕ Pessoal & Particular',
    options: [
      { value: 'medico', label: 'Consulta Médica / Exames / Saúde' },
      { value: 'pessoal', label: 'Compromisso Pessoal / Particular' },
      { value: 'curso', label: 'Curso / Congresso / Palestra' },
      { value: 'viagem', label: 'Viagem / Deslocamento' },
      { value: 'outro', label: 'Outro Compromisso' },
    ]
  }
];

// Helper para saber se um tipo de evento é pessoal ou interno
export const isPersonalOrInternalEvent = (type) => {
  const t = (type || '').toLowerCase().trim();
  return [
    'medico', 'médico', 'saude', 'saúde',
    'pessoal', 'particular',
    'curso', 'palestra', 'congresso',
    'viagem', 'deslocamento',
    'outro',
    'reuniao_interna', 'equipe', 'socios', 'sócios',
    'estudo', 'pesquisa',
    'administrativo', 'financeiro_interno'
  ].some(k => t.includes(k));
};

// Helper para saber se é explicitamente voltado a atendimento/cliente
export const isClientFacingEvent = (type) => {
  const t = (type || '').toLowerCase().trim();
  return [
    'consulta', 'reuniao', 'retorno', 'fechamento', 'follow-up', 'atendimento'
  ].some(k => t.includes(k)) && !isPersonalOrInternalEvent(type);
};

export function EventModal({ isOpen, onClose, eventToEdit = null, defaultDate = null }) {
  const { addAppointment, updateAppointment, clients, leads } = useCRM();
  const { users } = useAuth();

  const [isCustomType, setIsCustomType] = useState(false);
  const [customTypeName, setCustomTypeName] = useState('');
  const [saveAsNewClient, setSaveAsNewClient] = useState(false);

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

  const allPresetValues = PRESET_EVENT_GROUPS.flatMap(g => g.options.map(o => o.value));

  useEffect(() => {
    if (eventToEdit) {
      setFormData(eventToEdit);
      const isPreset = allPresetValues.includes(eventToEdit.type);
      if (!isPreset && eventToEdit.type) {
        setIsCustomType(true);
        setCustomTypeName(eventToEdit.type);
      } else {
        setIsCustomType(false);
        setCustomTypeName('');
      }
      setSaveAsNewClient(false);
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
      setSaveAsNewClient(false);
    }
  }, [eventToEdit, defaultDate, isOpen, users]);

  const resolvedCurrentType = isCustomType
    ? (customTypeName.trim() || 'Compromisso Personalizado')
    : formData.type;

  const isPersonal = isPersonalOrInternalEvent(resolvedCurrentType);

  const trimmedClientName = (formData.clientName || '').trim();
  const matchedExistingClient = clients.find(
    c => (c.name || '').toLowerCase() === trimmedClientName.toLowerCase()
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.date) {
      alert('Por favor, informe o título e a data do compromisso.');
      return;
    }

    if (isCustomType && !customTypeName.trim()) {
      alert('Por favor, informe o nome do evento personalizado.');
      return;
    }

    const lawyer = users.find(u => u.id === formData.responsibleId);
    const finalData = {
      ...formData,
      type: resolvedCurrentType,
      clientName: trimmedClientName,
      clientId: matchedExistingClient ? matchedExistingClient.id : (formData.clientId || null),
      // Só cadastra novo cliente se NÃO for pessoal/interno E usuário tiver marcado expressamente o checkbox
      saveAsNewClient: !isPersonal && !matchedExistingClient && saveAsNewClient,
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
      subtitle="Agendamento de reuniões, consultas, audiências, compromissos pessoais e eventos"
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
              placeholder={isPersonal ? 'Ex: Consulta com Cardiologista / Dentista' : 'Ex: Audiência de Instrução — 2ª Vara Cível'}
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
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none cursor-pointer"
              >
                {PRESET_EVENT_GROUPS.map((group) => (
                  <optgroup key={group.group} label={group.group} className="font-bold text-slate-700 dark:text-slate-200">
                    {group.options.map((opt) => (
                      <option key={opt.value} value={opt.value} className="font-normal text-slate-900 dark:text-slate-100">
                        {opt.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
                <optgroup label="✨ Opção Livre">
                  <option value="custom" className="font-bold text-brand-600 dark:text-gold-400">
                    Outro (Digitar personalizado...)
                  </option>
                </optgroup>
              </select>
            ) : (
              <div className="space-y-1">
                <input
                  type="text"
                  required
                  autoFocus
                  value={customTypeName}
                  onChange={(e) => setCustomTypeName(e.target.value)}
                  placeholder="Ex: Sustentação Oral, Reunião de Família..."
                  className="w-full rounded-xl border-2 border-brand-500/60 dark:border-gold-500/60 bg-brand-50/20 dark:bg-gold-500/5 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-brand-500 dark:focus:border-gold-400 focus:outline-none placeholder:text-slate-400 font-medium"
                />
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Evento livre sem restrição de categoria
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Cliente / Participante & Responsável */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {isPersonal ? 'Participante ou Terceiro (Opcional)' : 'Cliente / Interessado *'}
            </label>
            <input
              type="text"
              required={!isPersonal}
              list="clients-leads-list"
              value={formData.clientName}
              onChange={(e) => {
                const val = e.target.value;
                const matched = clients.find(c => c.name === val || `${c.name} (${c.cpf || c.phone || 'Cliente'})` === val);
                if (matched) {
                  setFormData({ ...formData, clientName: matched.name, clientId: matched.id });
                } else {
                  setFormData({ ...formData, clientName: val, clientId: '' });
                }
              }}
              placeholder={isPersonal ? 'Ex: Dr. Carlos (Médico), Clínica São Paulo (ou deixe vazio)' : 'Digite o nome ou selecione da base...'}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
            />
            <datalist id="clients-leads-list">
              {clients.map(c => (
                <option key={c.id} value={c.name}>{c.cpf ? `CPF: ${c.cpf}` : (c.phone ? `Tel: ${c.phone}` : 'Cliente Base')}</option>
              ))}
              {leads.map(l => (
                <option key={l.id} value={l.name}>{l.phone ? `Lead • ${l.phone}` : 'Lead Comercial'}</option>
              ))}
            </datalist>

            {/* Feedback e Controle de Salvamento como Cliente */}
            <div className="mt-1.5 space-y-1.5">
              {isPersonal ? (
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/30 p-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800/50">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  <span>Compromisso pessoal/interno — <strong>não gera cadastro</strong> na base de clientes.</span>
                </div>
              ) : matchedExistingClient ? (
                <div className="flex items-center gap-1.5 text-[11px] text-brand-700 dark:text-brand-300 bg-brand-50/60 dark:bg-brand-950/30 p-1.5 rounded-lg border border-brand-200 dark:border-brand-800/50">
                  <UserCheck className="h-3.5 w-3.5 shrink-0" />
                  <span>Cliente vinculado: <strong>{matchedExistingClient.name}</strong></span>
                </div>
              ) : trimmedClientName ? (
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-navy-900/90 border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                    <Info className="h-3.5 w-3.5 text-brand-500 shrink-0" />
                    <span>Nome não encontrado na base de clientes.</span>
                  </div>
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer pt-1 border-t border-slate-200 dark:border-slate-800">
                    <input
                      type="checkbox"
                      checked={saveAsNewClient}
                      onChange={(e) => setSaveAsNewClient(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                    />
                    <span className="flex items-center gap-1 text-[11px]">
                      <UserPlus className="h-3 w-3 text-gold-500" />
                      Cadastrar também como novo cliente na base do CRM
                    </span>
                  </label>
                  {!saveAsNewClient && (
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 italic">
                      * O nome ficará registrado apenas no card deste agendamento, mantendo sua base limpa.
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-[10px] text-slate-400 dark:text-slate-500">
                  Selecione um cliente existente ou digite o nome do interessado.
                </p>
              )}
            </div>
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
            Localização / Endereço / Link da Videoconferência
          </label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder={isPersonal ? 'Ex: Hospital São Luiz, Consultório Dr. Marcos ou Residência' : 'Ex: Fórum Central, Google Meet ou Sala 01'}
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
            placeholder={isPersonal ? 'Anotações particulares, exames a levar, preparos...' : 'Pauta da reunião, documentos a serem analisados, testemunhas...'}
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
            {eventToEdit ? 'Salvar Alterações' : 'Confirmar Agendamento'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
