import React, { useState, useEffect } from 'react';
import { useCRM } from '../../context/CRMContext';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../common/Modal';
import { PROPOSAL_STATUSES } from '../../data/legalAreas';

export function ProposalModal({ isOpen, onClose, proposalToEdit = null }) {
  const { addProposal, updateProposal, leads, clients, legalAreas } = useCRM();
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
        clientName: leads[0]?.name || clients[0]?.name || '',
        leadId: leads[0]?.id || '',
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.clientName || !formData.serviceName || !formData.feeValue) {
      alert('Por favor, preencha os campos obrigatórios da proposta.');
      return;
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
            <input
              type="text"
              required
              value={formData.clientName}
              onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
              placeholder="Nome do contratante"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
            />
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
            <select
              value={formData.legalArea}
              onChange={(e) => setFormData({ ...formData, legalArea: e.target.value })}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
            >
              {legalAreas.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Responsável Comercial *
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
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Status da Proposta *
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
            >
              {PROPOSAL_STATUSES.map(s => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
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
            <input
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
            className="rounded-xl bg-brand-600 px-5 py-2 text-sm font-semibold text-white shadow-md hover:bg-brand-700 transition-colors"
          >
            {proposalToEdit ? 'Salvar Proposta' : 'Emitir Proposta'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
