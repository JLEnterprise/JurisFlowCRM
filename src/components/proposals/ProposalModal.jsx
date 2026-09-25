import React, { useState, useEffect, useMemo } from 'react';
import { Link2 } from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../common/Modal';
import { PROPOSAL_STATUSES, KANBAN_STAGES } from '../../data/legalAreas';
import { Select } from '../common/Select';
import { DateField } from '../common/DateField';

export function ProposalModal({ isOpen, onClose, proposalToEdit = null }) {
  const { addProposal, updateProposal, moveLeadStage, leads, clients, legalAreas } = useCRM();
  const { users } = useAuth();

  const [formData, setFormData] = useState({
    clientName: '',
    leadId: '',
    serviceName: '',
    legalArea: 'empresarial',
    responsibleId: 'usr_1',
    description: '',
    feeValue: '',
    paymentTerms: 'Entrada de 30% + saldo em até 4 parcelas',
    validityDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
    status: 'enviada',
    notes: '',
  });

  useEffect(() => {
    if (proposalToEdit) {
      setFormData(proposalToEdit);
    } else {
      setFormData({
        clientName: '',
        leadId: '',
        clientId: '',
        serviceName: '',
        legalArea: 'empresarial',
        responsibleId: 'usr_1',
        description: '',
        feeValue: '',
        paymentTerms: 'Entrada de 30% + saldo em até 4 parcelas',
        validityDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
        status: 'enviada',
        notes: '',
      });
    }
  }, [proposalToEdit, isOpen]);

  // ---- Busca de lead/cliente pelo nome ----
  const [pickerOpen, setPickerOpen] = useState(false);
  const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  const stageName = (id) => KANBAN_STAGES.find(s => s.id === id)?.name || 'Funil';

  const suggestions = useMemo(() => {
    const term = norm(formData.clientName);
    if (!term) return [];
    const leadHits = (leads || [])
      .filter(l => norm(l.name).includes(term))
      .map(l => ({
        kind: 'lead', id: l.id, name: l.name, badge: stageName(l.stage),
        detail: [l.phone || l.whatsapp, l.email].filter(Boolean).join(' · ') || 'Lead do funil comercial',
        raw: l,
      }));
    const clientHits = (clients || [])
      .filter(c => norm(c.name).includes(term))
      .map(c => ({
        kind: 'client', id: c.id, name: c.name, badge: 'Cliente',
        detail: [c.whatsapp || c.phone, c.email].filter(Boolean).join(' · ') || 'Cliente cadastrado',
        raw: c,
      }));
    return [...leadHits, ...clientHits].slice(0, 8);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.clientName, leads, clients]);

  const handlePick = (s) => {
    if (s.kind === 'lead') {
      setFormData(prev => ({
        ...prev,
        clientName: s.name,
        leadId: s.id,
        clientId: '',
        legalArea: s.raw.legalArea || s.raw.legal_area || prev.legalArea,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        clientName: s.name,
        clientId: s.id,
        leadId: '',
        legalArea: s.raw.legalArea || prev.legalArea,
      }));
    }
    setPickerOpen(false);
  };

  const linkedLead = formData.leadId ? (leads || []).find(l => String(l.id) === String(formData.leadId)) : null;
  // Já em negociação ou além não volta para trás no funil
  const LATER_STAGES = ['proposta', 'negociacao', 'contrato_enviado', 'contrato_fechado'];
  const willMove = !!linkedLead && !LATER_STAGES.includes(linkedLead.stage);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.clientName || !formData.serviceName || !formData.feeValue) {
      alert('Por favor, preencha os campos obrigatórios da proposta.');
      return;
    }

    // Lead vinculado: move no funil para "Proposta Enviada"
    if (willMove && moveLeadStage) {
      moveLeadStage(linkedLead.id, 'proposta');
    }

    const resp = users.find(u => u.id === formData.responsibleId);
    const finalData = {
      ...formData,
      responsibleName: resp ? resp.name : 'Equipe Comercial',
      feeValue: Number(formData.feeValue) || 0,
    };

    if (proposalToEdit) {
      updateProposal(proposalToEdit.id, finalData);
    } else {
      addProposal(finalData);
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={proposalToEdit ? 'Editar Proposta Comercial' : 'Nova Proposta de Honorários'}
      subtitle="Elaboração de proposta técnica com honorários, metodologia e validade"
      maxWidth="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Row 1: Cliente & Serviço */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Cliente / Lead *
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={formData.clientName}
                onChange={(e) => {
                  // Digitou: desfaz o vínculo e mostra as sugestões
                  setFormData({ ...formData, clientName: e.target.value, leadId: '', clientId: '' });
                  setPickerOpen(true);
                }}
                onFocus={() => setPickerOpen(true)}
                onBlur={() => setTimeout(() => setPickerOpen(false), 150)}
                placeholder="Digite o nome do lead ou cliente"
                autoComplete="off"
                className={`w-full rounded-xl border bg-white dark:bg-navy-950 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-gold-500 focus:outline-none ${
                  linkedLead ? 'border-gold-500/60 pr-9' : 'border-slate-300 dark:border-slate-700'
                }`}
              />
              {linkedLead && (
                <Link2 className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gold-600 dark:text-gold-400" />
              )}

              {pickerOpen && suggestions.length > 0 && (
                <div className="premium-panel absolute left-0 top-full z-50 mt-1 max-h-64 w-[min(22rem,80vw)] overflow-y-auto p-1">
                  {suggestions.map(s => (
                    <button
                      key={`${s.kind}_${s.id}`}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handlePick(s)}
                      className="premium-option flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-slate-900 dark:text-white">{s.name}</span>
                        <span className="block truncate text-[11px] text-slate-400">{s.detail}</span>
                      </span>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        s.kind === 'lead' ? 'bg-gold-500/10 text-gold-800 dark:text-gold-200' : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                      }`}>
                        {s.badge}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {linkedLead ? (
              <p className="mt-1 text-[11px] text-gold-700 dark:text-gold-300">
                Lead do funil ({stageName(linkedLead.stage)}){willMove ? ' · vai para "Proposta Enviada"' : ''}
              </p>
            ) : formData.clientId ? (
              <p className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400">Cliente já cadastrado</p>
            ) : null}
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Serviço / Ação Proposta *
            </label>
            <input
              type="text"
              required
              value={formData.serviceName}
              onChange={(e) => setFormData({ ...formData, serviceName: e.target.value })}
              placeholder="Ex: Planejamento Sucessório e Constituição de Holding"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Row 2: Área, Responsável & Status */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Área Jurídica *
            </label>
            <Select
              value={formData.legalArea}
              onChange={(e) => setFormData({ ...formData, legalArea: e.target.value })}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
            >
              {legalAreas.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Responsável Comercial *
            </label>
            <Select
              value={formData.responsibleId}
              onChange={(e) => setFormData({ ...formData, responsibleId: e.target.value })}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
            >
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Status da Proposta *
            </label>
            <Select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
            >
              {PROPOSAL_STATUSES.map(s => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </Select>
          </div>
        </div>

        {/* Row 3: Valor, Forma de Pagamento & Validade */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Honorários Propostos (R$) *
            </label>
            <input
              type="number"
              required
              value={formData.feeValue}
              onChange={(e) => setFormData({ ...formData, feeValue: e.target.value })}
              placeholder="Ex: 45000"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Condições de Pagamento
            </label>
            <input
              type="text"
              value={formData.paymentTerms}
              onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Validade da Proposta
            </label>
            <DateField
              type="date"
              value={formData.validityDate}
              onChange={(e) => setFormData({ ...formData, validityDate: e.target.value })}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Descrição e Escopo */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Descrição Técnica do Escopo dos Serviços
          </label>
          <textarea
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Detalhe o escopo, etapas de execução e benefícios jurídicos para o cliente..."
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
            className="rounded-full bg-gradient-to-r from-brand-700 via-brand-600 to-brand-500 px-5 py-2 text-sm font-semibold text-white shadow-md hover:brightness-110 transition-colors"
          >
            {proposalToEdit ? 'Salvar Proposta' : 'Emitir Proposta'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
