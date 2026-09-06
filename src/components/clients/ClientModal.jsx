import React, { useState, useEffect } from 'react';
import { useCRM } from '../../context/CRMContext';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../common/Modal';
import { brasilApiService } from '../../services/brasilApiService';
import { Sparkles, Building2, MapPin, CheckCircle2 } from 'lucide-react';

export function ClientModal({ isOpen, onClose, clientToEdit = null }) {
  const { addClient, updateClient, legalAreas = [], showToast } = useCRM();
  const { users = [] } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    cpf: '',
    cnpj: '',
    rg: '',
    birthDate: '',
    maritalStatus: 'Casado(a)',
    profession: '',
    email: '',
    phone: '',
    whatsapp: '',
    address: '',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '',
    legalArea: 'civil',
    responsibleLawyerId: 'usr_2',
    status: 'active',
    totalContracted: '',
    totalPaid: '',
    notes: '',
  });

  const [isSearchingCNPJ, setIsSearchingCNPJ] = useState(false);
  const [isSearchingCEP, setIsSearchingCEP] = useState(false);

  useEffect(() => {
    if (clientToEdit) {
      setFormData({
        ...clientToEdit,
        totalContracted: clientToEdit.totalContracted || '',
        totalPaid: clientToEdit.totalPaid || '',
      });
    } else {
      setFormData({
        name: '',
        cpf: '',
        cnpj: '',
        rg: '',
        birthDate: '',
        maritalStatus: 'Casado(a)',
        profession: '',
        email: '',
        phone: '',
        whatsapp: '',
        address: '',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '',
        legalArea: 'civil',
        responsibleLawyerId: users[0]?.id || 'usr_2',
        status: 'active',
        totalContracted: '',
        totalPaid: '',
        notes: '',
      });
    }
  }, [clientToEdit, isOpen, users]);

  const handleLookupCNPJ = async () => {
    const rawDoc = formData.cnpj || formData.cpf;
    const cleanDoc = String(rawDoc).replace(/\D/g, '');

    if (cleanDoc.length !== 14) {
      alert('Por favor, informe um CNPJ válido com 14 dígitos para consulta.');
      return;
    }

    setIsSearchingCNPJ(true);
    try {
      const data = await brasilApiService.fetchCNPJ(cleanDoc);
      if (data) {
        setFormData(prev => ({
          ...prev,
          name: data.name || prev.name,
          cnpj: data.document,
          cpf: '',
          email: data.email || prev.email,
          phone: data.phone || prev.phone,
          whatsapp: data.phone || prev.whatsapp,
          address: data.address || prev.address,
          city: data.city || prev.city,
          state: data.state || prev.state,
          notes: `${prev.notes ? prev.notes + '\n' : ''}CNAE: ${data.cnae || 'N/A'} - Situação: ${data.status || 'Ativa'}`,
        }));
        showToast('Dados da empresa importados da Receita Federal com sucesso!');
      }
    } catch (err) {
      alert('Erro ao consultar CNPJ: ' + err.message);
    } finally {
      setIsSearchingCNPJ(false);
    }
  };

  const handleLookupCEP = async () => {
    const cleanCep = String(formData.zipCode).replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      alert('Informe um CEP com 8 dígitos.');
      return;
    }

    setIsSearchingCEP(true);
    try {
      const data = await brasilApiService.fetchCEP(cleanCep);
      if (data) {
        setFormData(prev => ({
          ...prev,
          address: data.street ? `${data.street}, ${data.neighborhood}` : prev.address,
          city: data.city || prev.city,
          state: data.state || prev.state,
        }));
        showToast('Endereço preenchido pelo CEP!');
      }
    } catch (err) {
      console.warn(err);
    } finally {
      setIsSearchingCEP(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Por favor, informe o nome do cliente.');
      return;
    }

    if (clientToEdit) {
      updateClient(clientToEdit.id, formData);
    } else {
      addClient(formData);
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={clientToEdit ? 'Editar Dados do Cliente' : 'Cadastrar Novo Cliente'}
      subtitle="Ficha cadastral com busca automática de CNPJ (Receita Federal) e CEP"
      maxWidth="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Row 1: Nome & CPF/CNPJ com Botão de Consulta */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nome Completo / Razão Social *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Renata Lins Cavalcanti ou Empresa LTDA"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                CPF ou CNPJ *
              </label>
              {(formData.cnpj || (formData.cpf && formData.cpf.replace(/\D/g, '').length >= 14)) && (
                <button
                  type="button"
                  onClick={handleLookupCNPJ}
                  disabled={isSearchingCNPJ}
                  className="text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                >
                  <Sparkles className="h-3 w-3" />
                  {isSearchingCNPJ ? 'Consultando...' : '🔍 Buscar CNPJ'}
                </button>
              )}
            </div>
            <input
              type="text"
              required
              value={formData.cpf || formData.cnpj}
              onChange={(e) => {
                const val = e.target.value;
                if (val.length > 14) {
                  setFormData({ ...formData, cnpj: val, cpf: '' });
                } else {
                  setFormData({ ...formData, cpf: val, cnpj: '' });
                }
              }}
              placeholder="000.000.000-00 ou CNPJ"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-xs font-mono font-semibold text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Row 2: RG, Data Nascimento & Estado Civil */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              RG / Órgão Emissor
            </label>
            <input
              type="text"
              value={formData.rg}
              onChange={(e) => setFormData({ ...formData, rg: e.target.value })}
              placeholder="00.000.000-0 SSP/SP"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Data de Nascimento
            </label>
            <input
              type="date"
              value={formData.birthDate}
              onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Estado Civil
            </label>
            <select
              value={formData.maritalStatus}
              onChange={(e) => setFormData({ ...formData, maritalStatus: e.target.value })}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
            >
              <option value="Solteiro(a)">Solteiro(a)</option>
              <option value="Casado(a)">Casado(a)</option>
              <option value="União Estável">União Estável</option>
              <option value="Divorciado(a)">Divorciado(a)</option>
              <option value="Viúvo(a)">Viúvo(a)</option>
            </select>
          </div>
        </div>

        {/* Row 3: Profissão, E-mail & WhatsApp */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Profissão / Cargo
            </label>
            <input
              type="text"
              value={formData.profession}
              onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
              placeholder="Ex: Arquiteta, Empresário"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              E-mail Principal
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="cliente@email.com"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              WhatsApp *
            </label>
            <input
              type="text"
              required
              value={formData.whatsapp}
              onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
              placeholder="(11) 98888-7777"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
            />
          </div>
        </div>

        {/* Row 4: CEP, Endereço, Cidade, Estado */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                CEP
              </label>
              {formData.zipCode && formData.zipCode.replace(/\D/g, '').length === 8 && (
                <button
                  type="button"
                  onClick={handleLookupCEP}
                  disabled={isSearchingCEP}
                  className="text-[10px] text-brand-600 dark:text-brand-400 font-bold hover:underline"
                >
                  {isSearchingCEP ? '...' : '🔍 Buscar'}
                </button>
              )}
            </div>
            <input
              type="text"
              value={formData.zipCode}
              onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
              placeholder="00000-000"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Endereço Completo
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Rua / Av, Número, Bairro, Apto"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Cidade / UF
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="São Paulo"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-2.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
              />
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                placeholder="SP"
                maxLength={2}
                className="w-14 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-2 py-2 text-xs text-slate-900 dark:text-white focus:outline-none uppercase text-center"
              />
            </div>
          </div>
        </div>

        {/* Row 5: Área Jurídica, Advogado Responsável & Status */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Área Jurídica Predominante *
            </label>
            <select
              value={formData.legalArea}
              onChange={(e) => setFormData({ ...formData, legalArea: e.target.value })}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
            >
              {legalAreas.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Advogado(a) Responsável
            </label>
            <select
              value={formData.responsibleLawyerId}
              onChange={(e) => setFormData({ ...formData, responsibleLawyerId: e.target.value })}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
            >
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name} ({Array.isArray(u.roles) ? u.roles.join(', ') : (u.role || 'Advogado')})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Status do Cliente
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
            >
              <option value="active">Ativo na Base</option>
              <option value="inactive">Inativo / Concluído</option>
            </select>
          </div>
        </div>

        {/* Observações */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Observações Internas
          </label>
          <textarea
            rows={2}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Informações adicionais, histórico de relacionamento..."
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 p-3 text-xs text-slate-900 dark:text-white focus:outline-none"
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="rounded-xl bg-brand-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-brand-700"
          >
            {clientToEdit ? 'Salvar Dados' : 'Cadastrar Cliente'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
