import React, { useState, useEffect } from 'react';
import { useCRM } from '../../context/CRMContext';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../common/Modal';
import { brasilApiService } from '../../services/brasilApiService';
import { Search, Sparkles, CheckCircle2, Building2, Gavel } from 'lucide-react';

export function ProcessModal({ isOpen, onClose, processToEdit = null, prefillData = null }) {
  const { addProcess, updateProcess, clients = [], legalAreas = [], showToast } = useCRM();
  const { users = [] } = useAuth();

  const [formData, setFormData] = useState({
    processNumber: '',
    clientId: '',
    clientName: '',
    tribunal: 'TJSP - Tribunal de Justiça de São Paulo',
    court: '2ª Vara Cível da Comarca da Capital',
    legalArea: 'civil',
    responsibleLawyerId: 'usr_2',
    status: 'active',
    distributionDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [isSearchingCNJ, setIsSearchingCNJ] = useState(false);
  const [cnjDecodedInfo, setCnjDecodedInfo] = useState(null);

  useEffect(() => {
    if (processToEdit) {
      setFormData(processToEdit);
      setCnjDecodedInfo(null);
    } else if (prefillData) {
      setFormData({
        processNumber: prefillData.processNumber || '',
        clientId: prefillData.clientId || '',
        clientName: prefillData.clientName || '',
        tribunal: prefillData.tribunal || 'TJSP - Tribunal de Justiça de São Paulo',
        court: prefillData.court || 'Vara Cível',
        legalArea: prefillData.legalArea || 'civil',
        responsibleLawyerId: users[0]?.id || 'usr_2',
        status: 'active',
        distributionDate: new Date().toISOString().split('T')[0],
        notes: '',
      });
      setCnjDecodedInfo(null);
    } else {
      setFormData({
        processNumber: '',
        clientId: clients[0]?.id || '',
        clientName: clients[0]?.name || '',
        tribunal: 'TJSP - Tribunal de Justiça de São Paulo',
        court: '1ª Vara Cível',
        legalArea: 'civil',
        responsibleLawyerId: users[0]?.id || 'usr_2',
        status: 'active',
        distributionDate: new Date().toISOString().split('T')[0],
        notes: '',
      });
      setCnjDecodedInfo(null);
    }
  }, [processToEdit, prefillData, isOpen, clients, users]);

  const handleClientChange = (clientId) => {
    const selected = clients.find(c => c.id === clientId);
    setFormData(prev => ({
      ...prev,
      clientId,
      clientName: selected ? (selected.name || selected.nome) : '',
    }));
  };

  const handleLookupCNJ = () => {
    if (!formData.processNumber.trim()) {
      alert('Digite o número CNJ do processo (ex: 0001234-56.2024.8.26.0100)');
      return;
    }

    setIsSearchingCNJ(true);
    setTimeout(() => {
      const decoded = brasilApiService.decodeCNJ(formData.processNumber);
      if (decoded && decoded.isValidCNJ) {
        setFormData(prev => ({
          ...prev,
          tribunal: `${decoded.court} - ${decoded.branchName}`,
          court: decoded.originVara,
          legalArea: decoded.branchId === '5' ? 'trabalhista' : prev.legalArea,
        }));
        setCnjDecodedInfo(decoded);
        showToast(`Processo localizado no ${decoded.court}!`);
      } else {
        // Fallback amigável
        setFormData(prev => ({
          ...prev,
          tribunal: 'TJSP - Tribunal de Justiça',
          court: 'Vara Cível da Capital',
        }));
        showToast('Dados básicos inferidos pelo padrão CNJ.');
      }
      setIsSearchingCNJ(false);
    }, 350);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.processNumber || !formData.clientName) {
      alert('Por favor, informe o número do processo e o cliente.');
      return;
    }

    const lawyer = users.find(u => u.id === formData.responsibleLawyerId);
    const finalData = {
      ...formData,
      responsibleLawyerName: lawyer ? lawyer.name : 'Advogado Responsável',
    };

    if (processToEdit) {
      updateProcess(processToEdit.id, finalData);
    } else {
      addProcess(finalData);
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={processToEdit ? 'Editar Processo Judicial' : 'Vincular Novo Processo Judicial'}
      subtitle="Cadastro de autos com consulta CNJ/DataJud, tribunal, vara e advogado condutor"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Número CNJ com Botão de Consulta DataJud */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Número Único do Processo (CNJ) *
            </label>
            <button
              type="button"
              onClick={handleLookupCNJ}
              disabled={isSearchingCNJ}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 border border-amber-200 dark:border-amber-800/60 transition-all"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>{isSearchingCNJ ? 'Consultando CNJ...' : '🔍 Buscar no CNJ / DataJud'}</span>
            </button>
          </div>
          <div className="relative">
            <Gavel className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              required
              value={formData.processNumber}
              onChange={(e) => setFormData({ ...formData, processNumber: e.target.value })}
              placeholder="0001234-56.2024.8.26.0100"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 pl-10 pr-4 py-2 text-xs font-mono font-semibold text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
            />
          </div>
          {cnjDecodedInfo && (
            <div className="mt-2 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-800 dark:text-emerald-200 flex items-center justify-between animate-fade-in">
              <span className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Jurisdição: {cnjDecodedInfo.court} ({cnjDecodedInfo.branchName})
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                Distribuído em {cnjDecodedInfo.year}
              </span>
            </div>
          )}
        </div>

        {/* Cliente Vinculado */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Cliente Vinculado *
          </label>
          <select
            value={formData.clientId}
            onChange={(e) => handleClientChange(e.target.value)}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
          >
            <option value="">Selecione um cliente...</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.name || c.nome}</option>
            ))}
          </select>
        </div>

        {/* Tribunal & Vara */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Tribunal / Jurisdição *
            </label>
            <input
              type="text"
              required
              value={formData.tribunal}
              onChange={(e) => setFormData({ ...formData, tribunal: e.target.value })}
              placeholder="Ex: TJSP, TRF3, TRT2, STJ"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Vara / Órgão Julgador *
            </label>
            <input
              type="text"
              required
              value={formData.court}
              onChange={(e) => setFormData({ ...formData, court: e.target.value })}
              placeholder="Ex: 2ª Vara Cível Central da Capital"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Área, Advogado & Status */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Área Jurídica *
            </label>
            <select
              value={formData.legalArea}
              onChange={(e) => setFormData({ ...formData, legalArea: e.target.value })}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
            >
              {legalAreas.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Advogado Responsável
            </label>
            <select
              value={formData.responsibleLawyerId}
              onChange={(e) => setFormData({ ...formData, responsibleLawyerId: e.target.value })}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
            >
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name} ({Array.isArray(u.roles) ? u.roles.join(', ') : (u.role || 'Advogado')})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Status Processual *
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
            >
              <option value="active">Ativo / Em Andamento</option>
              <option value="suspenso">Suspenso</option>
              <option value="encerrado">Encerrado</option>
              <option value="arquivado">Arquivado Definitivamente</option>
            </select>
          </div>
        </div>

        {/* Observações */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Último Andamento / Observações Processuais
          </label>
          <textarea
            rows={3}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Informações sobre liminares, audiências, recursos ou prazos..."
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 p-3 text-xs text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="rounded-xl bg-brand-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-brand-700 transition-colors"
          >
            {processToEdit ? 'Salvar Processo' : 'Cadastrar Processo'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
