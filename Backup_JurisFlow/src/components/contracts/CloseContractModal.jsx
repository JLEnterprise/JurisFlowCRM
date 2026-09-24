import React, { useState, useEffect } from 'react';
import { useCRM } from '../../context/CRMContext';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../common/Modal';
import { Sparkles, CheckCircle2, FileCheck2, DollarSign } from 'lucide-react';

export function CloseContractModal({ isOpen, onClose, lead, onContractClosed }) {
  const { closeContractWorkflow } = useCRM();
  const { users } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    cpf: '',
    rg: '',
    maritalStatus: 'Casado(a)',
    profession: 'Profissional',
    phone: '',
    whatsapp: '',
    email: '',
    address: '',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '',
    contractValue: '',
    serviceDescription: '',
    paymentMethod: 'Parcelado no Boleto / PIX',
    installmentsCount: 3,
    responsibleLawyerId: 'usr_2',
    signedDate: new Date().toISOString().split('T')[0],
    observations: '',
  });

  useEffect(() => {
    if (lead) {
      setFormData({
        name: lead.name || '',
        cpf: lead.cpf || '',
        rg: '',
        maritalStatus: 'Casado(a)',
        profession: 'Profissional Liberal',
        phone: lead.phone || '',
        whatsapp: lead.whatsapp || lead.phone || '',
        email: lead.email || '',
        address: 'Av. Paulista, 1000',
        city: lead.city || 'São Paulo',
        state: lead.state || 'SP',
        zipCode: '01310-100',
        contractValue: lead.estimatedValue || 20000,
        serviceDescription: lead.notes || `Prestação de serviços advocatícios na área de ${lead.legalArea}.`,
        paymentMethod: 'Parcelado (Boleto / PIX)',
        installmentsCount: 3,
        responsibleLawyerId: lead.lawyerId || 'usr_2',
        signedDate: new Date().toISOString().split('T')[0],
        observations: 'Contrato fechado com sucesso através da negociação comercial.',
      });
    }
  }, [lead, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.contractValue) {
      alert('Por favor, informe os dados obrigatórios do cliente e valor dos honorários.');
      return;
    }

    const result = closeContractWorkflow({
      leadId: lead?.id,
      clientData: {
        name: formData.name,
        cpf: formData.cpf,
        rg: formData.rg,
        maritalStatus: formData.maritalStatus,
        profession: formData.profession,
        email: formData.email,
        phone: formData.phone,
        whatsapp: formData.whatsapp,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
      },
      contractValue: Number(formData.contractValue),
      serviceDescription: formData.serviceDescription,
      paymentMethod: formData.paymentMethod,
      installmentsCount: Number(formData.installmentsCount),
      responsibleLawyerId: formData.responsibleLawyerId,
      signedDate: formData.signedDate,
      observations: formData.observations,
    });

    onClose();
    if (onContractClosed) {
      onContractClosed(result);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="🎉 Fechamento de Contrato & Conversão em Cliente"
      subtitle="O sistema criará o cliente na base, gerará o contrato assinado, criará as parcelas financeiras e atualizará o funil automaticamente."
      maxWidth="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Banner de automação */}
        <div className="rounded-2xl bg-gradient-to-r from-emerald-500/10 to-brand-500/10 border border-emerald-500/20 p-4 text-xs text-emerald-900 dark:text-emerald-200 flex items-center gap-3">
          <Sparkles className="h-6 w-6 text-emerald-500 flex-shrink-0" />
          <div>
            <strong>Fluxo Inteligente Automático:</strong> Ao confirmar, o lead será marcado como <em>Contrato Fechado</em>, o cliente será integrado na base ativa e o valor entrará diretamente no fluxo de caixa do escritório.
          </div>
        </div>

        {/* Dados do Cliente */}
        <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            1. Dados Cadastrais do Contratante
          </h4>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nome do Cliente *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                CPF / CNPJ
              </label>
              <input
                type="text"
                value={formData.cpf}
                onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                placeholder="000.000.000-00"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Dados do Contrato */}
        <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            2. Honorários & Condições de Pagamento
          </h4>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Valor Total dos Honorários (R$) *
              </label>
              <input
                type="number"
                required
                value={formData.contractValue}
                onChange={(e) => setFormData({ ...formData, contractValue: e.target.value })}
                className="w-full rounded-xl border border-emerald-500/50 bg-white dark:bg-navy-950 px-3.5 py-2 text-sm font-bold text-emerald-600 dark:text-emerald-400 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Forma de Pagamento *
              </label>
              <input
                type="text"
                required
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                placeholder="Ex: 5x de R$ 5.000 no PIX / Boleto"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Número de Parcelas
              </label>
              <input
                type="number"
                min="1"
                max="36"
                value={formData.installmentsCount}
                onChange={(e) => setFormData({ ...formData, installmentsCount: e.target.value })}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 mt-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Advogado(a) Responsável pela Execução
              </label>
              <select
                value={formData.responsibleLawyerId}
                onChange={(e) => setFormData({ ...formData, responsibleLawyerId: e.target.value })}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
              >
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Data de Fechamento / Assinatura
              </label>
              <input
                type="date"
                value={formData.signedDate}
                onChange={(e) => setFormData({ ...formData, signedDate: e.target.value })}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-3">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Objeto e Escopo dos Serviços Advocatícios
            </label>
            <textarea
              rows={2}
              value={formData.serviceDescription}
              onChange={(e) => setFormData({ ...formData, serviceDescription: e.target.value })}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 p-2.5 text-xs text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-700 transition-all hover:scale-[1.02]"
          >
            <FileCheck2 className="h-4 w-4" /> Fechar Contrato e Ativar Cliente
          </button>
        </div>
      </form>
    </Modal>
  );
}
